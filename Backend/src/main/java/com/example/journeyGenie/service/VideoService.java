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
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Service
public class VideoService {

    @Autowired private TourRepository tourRepository;
    @Autowired private JWTService jwtService;

    // Cloudinary init (same as your PhotoService style)
    private Cloudinary cloudinary;
    private Cloudinary getCloudinary() {
        if (cloudinary == null) {
            cloudinary = new Cloudinary("cloudinary://214429925976299:KRgnNaisrd_3PPVxjDRHfSOWAhY@dg1sx19ve");
        }
        return cloudinary;
    }

    /** ffmpeg absolute path (you confirmed it's here) */
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

            // Download images
            List<File> frames = new ArrayList<>();
            for (int i = 0; i < imageUrls.size(); i++) {
                String link = imageUrls.get(i);
                File out = workDir.resolve(String.format("img_%05d.jpg", i)).toFile();
                try (InputStream in = new URL(link).openStream()) {
                    Files.copy(in, out.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }
                frames.add(out);
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

            // ffmpeg command
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
            Process proc = new ProcessBuilder(cmd).redirectErrorStream(true).start();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                String line; while ((line = br.readLine()) != null) Debug.log(line);
            }
            int exit = proc.waitFor();
            if (exit != 0 || !outMp4.exists()) {
                safeDeleteRecursive(workDir);
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Video encoding failed (ffmpeg)"));
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

            // Save and return owner with initialized graph
            tour.setVideo(videoUrl);
            tourRepository.save(tour);

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

    // remove temp dir (pure Java)
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
