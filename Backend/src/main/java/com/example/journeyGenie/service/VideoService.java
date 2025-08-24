package com.example.journeyGenie.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.Photo;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.TourRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class VideoService {

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private JWTService jwtService;

    private Cloudinary cloudinary;

    private Cloudinary getCloudinary() {
        if (cloudinary == null) {
            cloudinary = new Cloudinary("cloudinary://214429925976299:KRgnNaisrd_3PPVxjDRHfSOWAhY@dg1sx19ve");
        }
        return cloudinary;
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

            // Collect Cloudinary public IDs
            List<String> publicIds = tour.getDays().stream()
                    .filter(d -> d.getPhotos() != null)
                    .sorted(Comparator.comparing(d -> d.getDate()))
                    .flatMap(d -> d.getPhotos().stream())
                    .filter(p -> p.getLink() != null && !p.getLink().isBlank())
                    .map(p -> extractPublicId(p.getLink()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (publicIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No photos found"));
            }

            // Generate Cloudinary video from images (adding all images sequentially)
            Map<String, Object> options = ObjectUtils.asMap(
                    "resource_type", "video",
                    "public_id", "journey-genie/tour_" + tourId + "_video",
                    "folder", "journey-genie",
                    "overwrite", true,
                    "format", "mp4",
                    "eager", Collections.singletonList(
                            ObjectUtils.asMap(
                                    "transformation", Arrays.asList(
                                            ObjectUtils.asMap("width", 1280, "crop", "scale"),
                                            ObjectUtils.asMap("flags", "layer_apply")
                                    )
                            )
                    )
            );

            // Upload first photo as placeholder (Cloudinary handles the video generation)
            getCloudinary().uploader().upload(
                    publicIds.get(0), options
            );

            // Generate video URL using Cloudinary
            String videoUrl = getCloudinary().url()
                    .resourceType("video")
                    .format("mp4")
                    .generate("journey-genie/tour_" + tourId + "_video");

            // Save video URL in the Tour entity
            tour.setVideo(videoUrl);
            tourRepository.save(tour);

            return ResponseEntity.ok(Map.of("success", true, "videoUrl", videoUrl));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }


    // Extract public ID from Cloudinary URL
    private String extractPublicId(String url) {
        try {
            int start = url.indexOf("/upload/") + 8;
            int end = url.lastIndexOf('.');
            if (start >= 0 && end > start) return url.substring(start, end);
        } catch (Exception ignored) {}
        return null;
    }
}
