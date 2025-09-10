//package com.example.journeyGenie.controller;
//
//import com.example.journeyGenie.dto.ImageAnalysisDTO;
//import com.example.journeyGenie.service.ImageAnalysisService;
//import com.example.journeyGenie.util.Debug;
//import jakarta.servlet.http.HttpServletRequest;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api")
//public class ImageAnalysisController {
//
//    @Autowired
//    private ImageAnalysisService imageAnalysisService;
//
//    @PostMapping("/analyze-image-content")
//    public ResponseEntity<?> analyzeImageContent(@RequestBody ImageAnalysisDTO imageAnalysisDTO, HttpServletRequest request) {
//        Debug.log("Analyzing image content with Gemini: ");
//        Debug.log("Image URL: " + imageAnalysisDTO.getImageUrl());
//        Debug.log("Prompt: " + imageAnalysisDTO.getPrompt());
//        return imageAnalysisService.analyzeImageContent(imageAnalysisDTO, request);
//    }
//}

package com.example.journeyGenie.controller;

import com.example.journeyGenie.dto.ImageAnalysisDTO;
import com.example.journeyGenie.service.ImageAnalysisService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
        "http://localhost:5174",
        "http://localhost:3000",
        "https://journey-genie-nu.vercel.app"
}, allowCredentials = "true")
public class ImageAnalysisController {

    @Autowired
    private ImageAnalysisService imageAnalysisService;

    /**
     * Original endpoint - analyze single image with HuggingFace
     */
    @PostMapping("/analyze-image-content")
    public ResponseEntity<?> analyzeImageContent(@RequestBody ImageAnalysisDTO imageAnalysisDTO, HttpServletRequest request) {
        Debug.log("Single image analysis request");
        Debug.log("Image URL: " + imageAnalysisDTO.getImageUrl());
        Debug.log("Prompt: " + imageAnalysisDTO.getPrompt());
        return imageAnalysisService.analyzeImageContent(imageAnalysisDTO, request);
    }

    /**
     * Smart search endpoint - searches both cached and new analyses
     */
    @PostMapping("/search-images")
    public ResponseEntity<?> searchImages(@RequestBody ImageAnalysisDTO searchRequest, HttpServletRequest request) {
        String query = searchRequest.getQuery();

        Debug.log("Smart image search request: '" + query + "'");

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Query is required"
            ));
        }

        return imageAnalysisService.smartImageSearch(query.trim(), request);
    }

    /**
     * Batch analyze unprocessed photos - run this to pre-analyze photos
     */
    @PostMapping("/batch-analyze-photos")
    public ResponseEntity<?> batchAnalyzePhotos(HttpServletRequest request) {
        Debug.log("Batch analysis request received");
        return imageAnalysisService.batchAnalyzePhotos(request);
    }

    /**
     * DEBUG: Get photo descriptions to see what's actually stored
     */
    @GetMapping("/debug-descriptions")
    public ResponseEntity<?> debugDescriptions(HttpServletRequest request) {
        Debug.log("Debug descriptions request received");
        return imageAnalysisService.debugDescriptions(request);
    }

    /**
     * Health check for the API
     */
    @GetMapping("/search-health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "Image Analysis Service",
                "provider", "HuggingFace",
                "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * FORCE re-analyze all photos (including ones with "Unable to analyze image")
     */
    @PostMapping("/force-reanalyze")
    public ResponseEntity<?> forceReanalyzePhotos(HttpServletRequest request) {
        Debug.log("Force re-analysis request received");
        return imageAnalysisService.forceReanalyzePhotos(request);
    }

    /**
     * Get search statistics for a user
     */
    @GetMapping("/search-stats")
    public ResponseEntity<?> getSearchStats(HttpServletRequest request) {
        // This could return stats about analyzed photos, etc.
        return ResponseEntity.ok(Map.of(
                "message", "Search stats endpoint - to be implemented"
        ));
    }
}