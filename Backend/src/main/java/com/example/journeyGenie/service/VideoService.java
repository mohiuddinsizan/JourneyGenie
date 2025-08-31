package com.example.journeyGenie.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.Photo;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.TourRepository;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class VideoService {

    @Autowired private TourRepository tourRepository;
    @Autowired private JWTService jwtService;

    // In-memory job tracking (use Redis in production)
    private final Map<String, VideoJob> videoJobs = new ConcurrentHashMap<>();

    @Async
    public String startAsyncVideoGeneration(Long tourId, HttpServletRequest request) {
        String jobId = UUID.randomUUID().toString();
        VideoJob job = new VideoJob(jobId, "processing", null, null);
        videoJobs.put(jobId, job);

        // Run the actual video generation in background
        CompletableFuture.runAsync(() -> {
            try {
                ResponseEntity<?> result = generateTourVideo(tourId, request);
                if (result.getStatusCode().is2xxSuccessful()) {
                    // Extract video URL from the result
                    if (result.getBody() instanceof User) {
                        User user = (User) result.getBody();
                        Tour tour = user.getTours().stream()
                                .filter(t -> t.getId().equals(tourId))
                                .findFirst()
                                .orElse(null);
                        if (tour != null && tour.getVideo() != null) {
                            job.setStatus("completed");
                            job.setVideoUrl(tour.getVideo());
                        } else {
                            job.setStatus("failed");
                            job.setError("Video URL not found after generation");
                        }
                    }
                } else {
                    job.setStatus("failed");
                    job.setError("Video generation failed: " + result.getBody());
                }
            } catch (Exception e) {
                job.setStatus("failed");
                job.setError("Video generation error: " + e.getMessage());
                e.printStackTrace();
            }
        });

        return jobId;
    }

    public Map<String, Object> getVideoGenerationStatus(String jobId, Long tourId, String email) {
        VideoJob job = videoJobs.get(jobId);
        if (job == null) {
            return Map.of("success", false, "message", "Job not found");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", job.getStatus());
        response.put("jobId", jobId);

        if ("completed".equals(job.getStatus())) {
            response.put("videoUrl", job.getVideoUrl());
            // Also return updated user data
            try {
                Tour tour = tourRepository.findById(tourId).orElse(null);
                if (tour != null && tour.getUser().getEmail().equalsIgnoreCase(email)) {
                    response.put("updatedUser", tour.getUser());
                }
            } catch (Exception e) {
                // Log but don't fail the response
                e.printStackTrace();
            }
        } else if ("failed".equals(job.getStatus())) {
            response.put("error", job.getError());
        }

        return response;
    }

    // Keep your existing method name for the controller
    @Transactional
    public ResponseEntity<?> generateTourVideo(Long tourId, HttpServletRequest request) {
        // Your existing generateTourVideo method content goes here
        // ... (same as before)
        try {
            final String email = jwtService.getEmailFromRequest(request);
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            Tour tour = tourRepository.findById(tourId).orElse(null);
            if (tour == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tour not found"));
            }

            // Ownership check
            User owner = tour.getUser();
            if (owner == null || !email.equalsIgnoreCase(owner.getEmail())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));
            }

            // Collect photo URLs (days by date string; photos by id)
            List<String> imageUrls = new ArrayList<>();
            if (tour.getDays() != null) {
                tour.getDays().stream()
                        .sorted(Comparator.comparing(d -> d.getDate()))
                        .forEach(d -> {
                            if (d.getPhotos() != null) {
                                d.getPhotos().stream()
                                        .sorted(Comparator.comparing(Photo::getId))
                                        .forEach(p -> {
                                            if (p.getLink() != null && !p.getLink().isBlank()) {
                                                imageUrls.add(p.getLink());
                                            }
                                        });
                            }
                        });
            }

            if (imageUrls.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No photos found for this tour"));
            }

            // Temp workspace
            Path workDir = Files.createTempDirectory("jg-video-" + tourId + "-");
            workDir.toFile().deleteOnExit();

            // Download images with error handling
            List<File> frames = new ArrayList<>();
            for (int i = 0; i < imageUrls.size(); i++) {
                String link = imageUrls.get(i);
                File out = workDir.resolve(String.format("img_%05d.jpg", i)).toFile();
                try (InputStream in = new URL(link).openStream()) {
                    Files.copy(in, out.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    frames.add(out);
                } catch (Exception e) {
                    Debug.log("Failed to download image " + link + ": " + e.getMessage());
                    // Continue with other images
                }
            }

            if (frames.isEmpty()) {
                safeDeleteRecursive(workDir);
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to download any images"));
            }

            // Build ffmpeg concat file
            File listFile = workDir.resolve("list.txt").toFile();
            try (PrintWriter pw = new PrintWriter(new OutputStreamWriter(new FileOutputStream(listFile), StandardCharsets.UTF_8))) {
                for (File f : frames) {
                    pw.println("file '" + f.getAbsolutePath().replace("'", "'\\''") + "'");
                    pw.println("duration 2.5");
                }
                // repeat last frame so duration applies to the last image
                pw.println("file '" + frames.get(frames.size() - 1).getAbsolutePath().replace("'", "'\\''") + "'");
            }

            File outMp4 = workDir.resolve("tour-" + tourId + ".mp4").toFile();

            // ffmpeg command with timeout
            List<String> cmd = List.of(
                    ffmpegPath(), "-y",
                    "-f", "concat", "-safe", "0",
                    "-i", listFile.getAbsolutePath(),
                    "-vf", "scale=1280:-2,format=yuv420p",
                    "-r", "30",
                    "-movflags", "+faststart",
                    outMp4.getAbsolutePath()
            );

            Debug.log("Running ffmpeg: " + String.join(" ", cmd));
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process proc = pb.start();

            // Read output with timeout
            boolean finished = proc.waitFor(5, TimeUnit.MINUTES); // 5 minute timeout
            if (!finished) {
                proc.destroyForcibly();
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Video generation timed out"));
            }

            int exit = proc.exitValue();
            if (exit != 0 || !outMp4.exists()) {
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Video encoding failed (ffmpeg exit: " + exit + ")"));
            }

            // Upload to Cloudinary as a VIDEO
            Map<String, Object> up = getCloudinary().uploader().upload(
                    outMp4,
                    ObjectUtils.asMap(
                            "folder", "journey-genie",
                            "resource_type", "video",
                            "public_id", "tour_" + tourId + "_video",
                            "overwrite", true,
                            "unique_filename", false
                    )
            );
            String videoUrl = (String) up.get("secure_url");
            if (videoUrl == null || videoUrl.isBlank()) {
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Cloudinary video upload failed"));
            }

            // Save and return owner
            tour.setVideo(videoUrl);
            tourRepository.save(tour);

            // Initialize lazy collections if needed
            if (owner.getTours() != null) {
                owner.getTours().size();
                owner.getTours().forEach(t -> {
                    if (t.getDays() != null) {
                        t.getDays().size();
                        t.getDays().forEach(d -> {
                            if (d.getPhotos() != null) d.getPhotos().size();
                            if (d.getActivities() != null) d.getActivities().size();
                        });
                    }
                });
            }

            safeDeleteRecursive(workDir);
            return ResponseEntity.ok(owner);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Helper classes
    private static class VideoJob {
        private String jobId;
        private String status; // "processing", "completed", "failed"
        private String videoUrl;
        private String error;

        public VideoJob(String jobId, String status, String videoUrl, String error) {
            this.jobId = jobId;
            this.status = status;
            this.videoUrl = videoUrl;
            this.error = error;
        }

        // getters and setters
        public String getJobId() { return jobId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getVideoUrl() { return videoUrl; }
        public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    // Your existing methods...
    private Cloudinary cloudinary;
    private Cloudinary getCloudinary() {
        if (cloudinary == null) {
            cloudinary = new Cloudinary("cloudinary://214429925976299:KRgnNaisrd_3PPVxjDRHfSOWAhY@dg1sx19ve");
        }
        return cloudinary;
    }

    private String ffmpegPath() {
        return "/usr/bin/ffmpeg";
    }

    private void safeDeleteRecursive(Path root) {
        if (root == null) return;
        try {
            if (!Files.exists(root)) return;
            Files.walk(root)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });
        } catch (IOException ignored) {}
    }
}