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

    @PostMapping("/analyze-image-content")
    public ResponseEntity<?> analyzeImageContent(@RequestBody ImageAnalysisDTO imageAnalysisDTO, HttpServletRequest request) {
        Debug.log("Analyzing image content with Gemini: ");
        Debug.log("Image URL: " + imageAnalysisDTO.getImageUrl());
        Debug.log("Prompt: " + imageAnalysisDTO.getPrompt());
        return imageAnalysisService.analyzeImageContent(imageAnalysisDTO, request);
    }
}