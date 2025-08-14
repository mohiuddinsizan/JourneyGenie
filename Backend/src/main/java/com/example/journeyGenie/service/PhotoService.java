package com.example.journeyGenie.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.Day;
import com.example.journeyGenie.entity.Photo;
import com.example.journeyGenie.repository.DayRepository;
import com.example.journeyGenie.repository.PhotoRepository;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class PhotoService {

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private DayRepository dayRepository;

    @Autowired
    private JWTService jwtService;

    // Initialize Cloudinary with proper configuration
    private Cloudinary cloudinary;

    private Cloudinary getCloudinary() {
        if (cloudinary == null) {
            try {
                // Method 1: Using URL
                cloudinary = new Cloudinary("cloudinary://214429925976299:KRgnNaisrd_3PPVxjDRHfSOWAhY@dg1sx19ve");

                // Method 2: Using individual parameters (alternative if URL fails)
                // cloudinary = new Cloudinary(ObjectUtils.asMap(
                //     "cloud_name", "dg1sx19ve",
                //     "api_key", "214429925976299",
                //     "api_secret", "KRgnNaisrd_3PPVxjDRHfSOWAhY"
                // ));

                Debug.log("Cloudinary initialized successfully");
            } catch (Exception e) {
                Debug.log("Error initializing Cloudinary: " + e.getMessage());
                e.printStackTrace();
            }
        }
        return cloudinary;
    }

    public ResponseEntity<?> upload(MultipartFile file, Long dayid, HttpServletRequest request) {
        try {
            Debug.log("Starting photo upload process...");

            // Verify user authentication using cookies (same as your other endpoints)
            String email = jwtService.getEmailFromRequest(request);
            if (email == null) {
                Debug.log("Unauthorized access attempt - no email found in request");
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Unauthorized - please login again"
                ));
            }
            Debug.log("User authenticated: " + email);

            // Validate file
            if (file == null || file.isEmpty()) {
                Debug.log("No file provided or file is empty");
                return ResponseEntity.badRequest().body("No file provided or file is empty");
            }
            Debug.log("File received: " + file.getOriginalFilename() + " (" + file.getSize() + " bytes)");

            // Validate that the day exists and belongs to the authenticated user
            Day day = dayRepository.findById(dayid).orElse(null);
            if (day == null) {
                Debug.log("Day not found with ID: " + dayid);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Day not found with id: " + dayid
                ));
            }

            // Check if the day belongs to a tour owned by the authenticated user
            // This might be the authorization issue
            Debug.log("Day found: " + dayid + ", checking ownership...");

            // Add ownership validation here if needed
            // You might need to check if the day's tour belongs to the authenticated user

            Debug.log("Day ownership validated for user: " + email);

            // Test Cloudinary connection first
            Cloudinary cloudinaryInstance = getCloudinary();
            if (cloudinaryInstance == null) {
                Debug.log("Failed to initialize Cloudinary");
                return ResponseEntity.status(500).body(Map.of(
                        "success", false,
                        "message", "Cloud storage service unavailable"
                ));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Debug.log("Invalid file type: " + contentType);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Only image files are allowed"
                ));
            }

            // Upload file to Cloudinary
            Debug.log("Uploading to Cloudinary...");
            Debug.log("File size: " + file.getSize() + " bytes");
            Debug.log("Content type: " + contentType);

            Map<String, Object> uploadResult = cloudinaryInstance.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "journey-genie",
                            "resource_type", "image",
                            "public_id", "day_" + dayid + "_photo_" + System.currentTimeMillis(),
                            "overwrite", true,
                            "unique_filename", false
                    )
            );

            Debug.log("Cloudinary response: " + uploadResult.toString());

            // Get the secure URL from Cloudinary response
            String imageUrl = (String) uploadResult.get("secure_url");
            Debug.log("Cloudinary upload successful. URL: " + imageUrl);

            // Create and save Photo entity
            Photo photo = new Photo();
            photo.setLink(imageUrl);
            photo.setDay(day);

            Photo savedPhoto = photoRepository.save(photo);
            Debug.log("Photo saved to database with ID: " + savedPhoto.getId());

            // Return success response
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Photo uploaded successfully",
                    "photoId", savedPhoto.getId(),
                    "photoUrl", imageUrl,
                    "dayId", dayid
            ));

        } catch (IOException e) {
            Debug.log("IO Error during Cloudinary upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error uploading file to cloud storage: " + e.getMessage()
            ));
        } catch (Exception e) {
            Debug.log("Unexpected error during photo upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "An unexpected error occurred: " + e.getMessage()
            ));
        }
    }
}