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
import java.net.URLConnection;
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

    @Transactional
    public ResponseEntity<?> generateTourVideo(Long tourId, HttpServletRequest request) {
        try {
            final String email = jwtService.getEmailFromRequest(request);
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            Tour tour = tourRepository.findById(tourId).orElse(null);
            if (tour == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tour not found"));
            }

            User owner = tour.getUser();
            if (owner == null || !email.equalsIgnoreCase(owner.getEmail())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));
            }

            // Collect photo URLs with LIMIT to prevent timeout
            List<String> imageUrls = new ArrayList<>();
            if (tour.getDays() != null) {
                List<String> finalImageUrls = imageUrls;
                tour.getDays().stream()
                        .sorted(Comparator.comparing(d -> d.getDate()))
                        .forEach(d -> {
                            if (d.getPhotos() != null) {
                                d.getPhotos().stream()
                                        .sorted(Comparator.comparing(Photo::getId))
                                        .limit(10) // LIMIT: Max 10 photos per day
                                        .forEach(p -> {
                                            if (p.getLink() != null && !p.getLink().isBlank()) {
                                                finalImageUrls.add(p.getLink());
                                            }
                                        });
                            }
                        });
            }

            // LIMIT: Max 30 total images to prevent timeout
            if (imageUrls.size() > 30) {
                imageUrls = imageUrls.subList(0, 30);
            }

            if (imageUrls.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No photos found for this tour"));
            }

            // Create temp workspace
            Path workDir = Files.createTempDirectory("jg-video-" + tourId + "-");
            workDir.toFile().deleteOnExit();

            // Download images with timeout and error handling
            List<File> frames = new ArrayList<>();
            int downloadTimeout = 10; // 10 seconds per image

            for (int i = 0; i < Math.min(imageUrls.size(), 20); i++) { // Max 20 images
                String link = imageUrls.get(i);
                File out = workDir.resolve(String.format("img_%05d.jpg", i)).toFile();

                try {
                    // Download with timeout
                    URLConnection connection = new URL(link).openConnection();
                    connection.setConnectTimeout(downloadTimeout * 1000);
                    connection.setReadTimeout(downloadTimeout * 1000);

                    try (InputStream in = connection.getInputStream()) {
                        Files.copy(in, out.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        frames.add(out);
                    }
                } catch (Exception e) {
                    Debug.log("Failed to download image " + link + ": " + e.getMessage());
                    // Continue with other images, but don't fail the entire process
                }

                // Stop if we have enough frames
                if (frames.size() >= 15) break; // Max 15 frames for faster processing
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
                    pw.println("duration 2"); // Reduced from 2.5 to 2 seconds
                }
                // Repeat last frame
                pw.println("file '" + frames.get(frames.size() - 1).getAbsolutePath().replace("'", "'\\''") + "'");
            }

            File outMp4 = workDir.resolve("tour-" + tourId + ".mp4").toFile();

            // Optimized ffmpeg command for faster processing
            List<String> cmd = List.of(
                    ffmpegPath(), "-y",
                    "-f", "concat", "-safe", "0",
                    "-i", listFile.getAbsolutePath(),
                    "-vf", "scale=720:-2,format=yuv420p", // Reduced from 1280 to 720 for faster processing
                    "-r", "24", // Reduced from 30 to 24 FPS
                    "-preset", "ultrafast", // Use fastest preset
                    "-crf", "28", // Higher CRF for smaller file/faster encoding (was default ~23)
                    "-movflags", "+faststart",
                    "-t", "60", // Limit video to max 60 seconds
                    outMp4.getAbsolutePath()
            );

            Debug.log("Running optimized ffmpeg: " + String.join(" ", cmd));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process proc = pb.start();

            // Read output in a separate thread to prevent blocking
            CompletableFuture<Void> outputReader = CompletableFuture.runAsync(() -> {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        Debug.log(line);
                    }
                } catch (IOException e) {
                    Debug.log("Error reading ffmpeg output: " + e.getMessage());
                }
            });

            // Wait for process with timeout
            boolean finished = proc.waitFor(90, TimeUnit.SECONDS); // 90 second timeout

            if (!finished) {
                proc.destroyForcibly();
                outputReader.cancel(true);
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Video generation timed out (90s limit)"));
            }

            // Wait for output reading to complete
            try {
                outputReader.get(5, TimeUnit.SECONDS);
            } catch (Exception e) {
                Debug.log("Output reading timeout: " + e.getMessage());
            }

            int exit = proc.exitValue();
            if (exit != 0 || !outMp4.exists()) {
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Video encoding failed (ffmpeg exit: " + exit + ")"));
            }

            // Check file size before upload
            long fileSizeBytes = outMp4.length();
            long fileSizeMB = fileSizeBytes / (1024 * 1024);
            Debug.log("Generated video size: " + fileSizeMB + " MB");

            if (fileSizeMB > 50) { // If larger than 50MB, it might timeout on upload
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Generated video too large (" + fileSizeMB + "MB). Try with fewer photos."));
            }

            // Upload to Cloudinary with timeout settings
            Map<String, Object> up = getCloudinary().uploader().upload(
                    outMp4,
                    ObjectUtils.asMap(
                            "folder", "journey-genie",
                            "resource_type", "video",
                            "public_id", "tour_" + tourId + "_video",
                            "overwrite", true,
                            "unique_filename", false,
                            "timeout", 120000 // 2 minute upload timeout
                    )
            );

            String videoUrl = (String) up.get("secure_url");
            if (videoUrl == null || videoUrl.isBlank()) {
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Cloudinary video upload failed"));
            }

            // Save and return
            tour.setVideo(videoUrl);
            tourRepository.save(tour);

            // Initialize lazy collections efficiently
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
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Video generation failed: " + e.getMessage()));
        }
    }

    private void safeDeleteRecursive(Path root) {
        if (root == null) return;
        try {
            if (!Files.exists(root)) return;
            Files.walk(root)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                            // Ignore cleanup errors
                        }
                    });
        } catch (IOException ignored) {
            // Ignore cleanup errors
        }
    }
}