package com.example.journeyGenie.controller;

import com.example.journeyGenie.dto.ImageAnalysisDTO;
import com.example.journeyGenie.service.ImageAnalysisService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ImageAnalysisController {

    @Autowired
    private ImageAnalysisService imageAnalysisService;

    // Method for analyzing image content
    @PostMapping("/analyze-image-content")
    public ResponseEntity<?> analyzeImageContent(@RequestBody ImageAnalysisDTO imageAnalysisDTO,
                                                 HttpServletRequest request) {
        // Adjusted to reflect that 'prompt' is no longer required in the request
        Debug.log("Analyzing single image with Gemini:");
        Debug.log("Image URL: " + imageAnalysisDTO.getImageUrl());

        return imageAnalysisService.analyzeImageContent(imageAnalysisDTO, request);
    }

    // Method for searching images based on query
    @PostMapping("/search-images")
    public ResponseEntity<?> searchImages(@RequestBody ImageAnalysisDTO searchRequest,
                                          HttpServletRequest request) {
        // Adjusted to log the query field
        Debug.log("Smart image search initiated:");
        Debug.log("Query: " + searchRequest.getQuery());  // Log the query being searched

        return imageAnalysisService.searchImages(searchRequest, request);
    }
}
