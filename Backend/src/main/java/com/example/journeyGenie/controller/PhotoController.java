package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.PhotoService;
import com.example.journeyGenie.service.TokenService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/photo")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    @Autowired
    private TokenService tokenService; // Inject TokenService

    @PostMapping(value = "/upload")  // Remove the consumes constraint
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam("dayid") Long dayid,
                                    HttpServletRequest request) {

        // Check if the user has at least 10 tokens for photo upload
        ResponseEntity<?> tokenResponse = tokenService.getUserToken(request, null);

        // Debug: Log the response body to understand its structure
        System.out.println("Token Response: " + tokenResponse.getBody());

        if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(401).body("User not authenticated");
        }

        // Extract token balance from the response (based on the actual response structure)
        Integer userTokens = null;

        // Check if response body is a Map or some other object
        if (tokenResponse.getBody() instanceof Map) {
            Map<?, ?> responseMap = (Map<?, ?>) tokenResponse.getBody();
            // Log the response map keys to check the structure
            System.out.println("Response Map Keys: " + responseMap.keySet());
            userTokens = (Integer) responseMap.get("tokens"); // Assuming the token is in the "tokens" key
        } else {
            // Handle other types of response if it's not a Map
            userTokens = (Integer) tokenResponse.getBody();
        }

        // Log the token value after extraction
        System.out.println("User Tokens: " + userTokens);

        if (userTokens == null || userTokens < 1) {
            return ResponseEntity.status(400).body("Insufficient tokens. You need at least 1 tokens to upload a photo.");
        }

        // Deduct 10 tokens for photo upload
        ResponseEntity<?> deductionResponse = tokenService.deductTokens(request, 1); // Deduct 1 tokens for upload
        if (!deductionResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(400).body("Failed to deduct tokens.");
        }

        // Proceed with photo upload
        Debug.log("=== PHOTO UPLOAD REQUEST ===");
        Debug.log("Day ID: " + dayid);
        Debug.log("File name: " + (file != null ? file.getOriginalFilename() : "null"));
        Debug.log("File size: " + (file != null ? file.getSize() + " bytes" : "null"));
        Debug.log("Content type: " + (file != null ? file.getContentType() : "null"));

        return photoService.upload(file, dayid, request);
    }
}
