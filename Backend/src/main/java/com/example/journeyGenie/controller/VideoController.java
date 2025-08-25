package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.VideoService;
import com.example.journeyGenie.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/tour")
public class VideoController {

    @Autowired
    private VideoService videoService;

    @Autowired
    private TokenService tokenService; // Inject TokenService

    @PostMapping("/{tourId}/video/generate")
    public ResponseEntity<?> generate(@PathVariable Long tourId, HttpServletRequest request) {
        // Check if the user has at least 10 tokens for video generation
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

        if (userTokens == null || userTokens < 10) {
            return ResponseEntity.status(400).body("Insufficient tokens. You need at least 10 tokens to generate a video.");
        }

        // Deduct 10 tokens for video generation
        ResponseEntity<?> deductionResponse = tokenService.deductTokens(request, tokenService.getVideoGenerationTokenCost());
        if (!deductionResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(400).body("Failed to deduct tokens.");
        }

        // Proceed with video generation
        return videoService.generateTourVideo(tourId, request);
    }
}
