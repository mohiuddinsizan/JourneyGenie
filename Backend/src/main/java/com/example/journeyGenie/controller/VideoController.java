//package com.example.journeyGenie.controller;
//
//import com.example.journeyGenie.authJWT.JWTService;
//import com.example.journeyGenie.service.VideoService;
//import com.example.journeyGenie.service.TokenService;
//import jakarta.servlet.http.HttpServletRequest;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;

//@RestController
//@RequestMapping("/tour")
//public class VideoController {
//
//    @Autowired
//    private VideoService videoService;
//
//    @Autowired
//    private TokenService tokenService; // Inject TokenService
//
//    @PostMapping("/{tourId}/video/generate")
//    public ResponseEntity<?> generate(@PathVariable Long tourId, HttpServletRequest request) {
//        // Check if the user has at least 10 tokens for video generation
//        ResponseEntity<?> tokenResponse = tokenService.getUserToken(request, null);
//
//        // Debug: Log the response body to understand its structure
//        System.out.println("Token Response: " + tokenResponse.getBody());
//
//        if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
//            return ResponseEntity.status(401).body("User not authenticated");
//        }
//
//        // Extract token balance from the response (based on the actual response structure)
//        Integer userTokens = null;
//
//        // Check if response body is a Map or some other object
//        if (tokenResponse.getBody() instanceof Map) {
//            Map<?, ?> responseMap = (Map<?, ?>) tokenResponse.getBody();
//            // Log the response map keys to check the structure
//            System.out.println("Response Map Keys: " + responseMap.keySet());
//            userTokens = (Integer) responseMap.get("tokens"); // Assuming the token is in the "tokens" key
//        } else {
//            // Handle other types of response if it's not a Map
//            userTokens = (Integer) tokenResponse.getBody();
//        }
//
//        // Log the token value after extraction
//        System.out.println("User Tokens: " + userTokens);
//
//        if (userTokens == null || userTokens < 10) {
//            return ResponseEntity.status(400).body("Insufficient tokens. You need at least 10 tokens to generate a video.");
//        }
//
//        // Deduct 10 tokens for video generation
//        ResponseEntity<?> deductionResponse = tokenService.deductTokens(request, tokenService.getVideoGenerationTokenCost());
//        if (!deductionResponse.getStatusCode().is2xxSuccessful()) {
//            return ResponseEntity.status(400).body("Failed to deduct tokens.");
//        }
//
//        // Proceed with video generation
//        return videoService.generateTourVideo(tourId, request);
//    }
//}

package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.VideoService;
import com.example.journeyGenie.service.TokenService;
import com.example.journeyGenie.authJWT.JWTService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/tour")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000",
        "https://journey-genie-nu.vercel.app"
}, allowCredentials = "true", maxAge = 3600)
public class VideoController {

    @Autowired
    private VideoService videoService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private JWTService jwtService;

    private HttpHeaders getCorsHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Access-Control-Allow-Origin", "https://journey-genie-nu.vercel.app");
        headers.add("Access-Control-Allow-Credentials", "true");
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.add("Access-Control-Allow-Headers", "*");
        return headers;
    }

    @PostMapping("/{tourId}/video/generate")
    public ResponseEntity<?> generate(@PathVariable Long tourId, HttpServletRequest request) {
        HttpHeaders headers = getCorsHeaders();

        try {
            // Check if the user has at least 10 tokens for video generation
            ResponseEntity<?> tokenResponse = tokenService.getUserToken(request, null);

            System.out.println("Token Response: " + tokenResponse.getBody());

            if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(401)
                        .headers(headers)
                        .body(Map.of("success", false, "message", "Unauthorized"));
            }

            // Extract token balance from the response
            Integer userTokens = null;
            if (tokenResponse.getBody() instanceof Map) {
                Map<?, ?> responseMap = (Map<?, ?>) tokenResponse.getBody();
                System.out.println("Response Map Keys: " + responseMap.keySet());
                userTokens = (Integer) responseMap.get("tokens");
            } else {
                userTokens = (Integer) tokenResponse.getBody();
            }

            System.out.println("User Tokens: " + userTokens);

            if (userTokens == null || userTokens < 10) {
                return ResponseEntity.status(400)
                        .headers(headers)
                        .body(Map.of("success", false, "message", "Insufficient tokens. You need at least 10 tokens to generate a video."));
            }

            // Deduct 10 tokens for video generation
            ResponseEntity<?> deductionResponse = tokenService.deductTokens(request, tokenService.getVideoGenerationTokenCost());
            if (!deductionResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(400)
                        .headers(headers)
                        .body(Map.of("success", false, "message", "Failed to deduct tokens."));
            }

            // Use your existing method name
            return videoService.generateTourVideo(tourId, request);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .headers(headers)
                    .body(Map.of("success", false, "message", "Server error: " + e.getMessage()));
        }
    }

    // Optional: Add this endpoint for future async implementation
    @GetMapping("/{tourId}/video/status/{jobId}")
    public ResponseEntity<?> getVideoStatus(@PathVariable Long tourId, @PathVariable String jobId, HttpServletRequest request) {
        HttpHeaders headers = getCorsHeaders();

        try {
            final String email = jwtService.getEmailFromRequest(request);
            if (email == null) {
                return ResponseEntity.status(401)
                        .headers(headers)
                        .body(Map.of("success", false, "message", "Unauthorized"));
            }

            // This endpoint is for future async implementation
            // For now, just return a simple message
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(Map.of("success", false, "message", "Async video generation not yet implemented"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .headers(headers)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Handle preflight requests explicitly
    @RequestMapping(value = "/{tourId}/video/generate", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handlePreflight(@PathVariable Long tourId) {
        HttpHeaders headers = getCorsHeaders();
        headers.add("Access-Control-Max-Age", "3600");
        return ResponseEntity.ok().headers(headers).build();
    }
}