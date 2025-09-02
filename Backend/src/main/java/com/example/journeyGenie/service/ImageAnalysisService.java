package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.ImageAnalysisDTO;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.UserRepository;
import com.example.journeyGenie.util.Debug;
import com.example.journeyGenie.util.AppEnv;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImageAnalysisService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JWTService jwtService;

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    private static final String API_KEY = AppEnv.getGEMINI_API();

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResponseEntity<?> analyzeImageContent(ImageAnalysisDTO imageAnalysisDTO, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        User existingUser = userRepository.findByEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        if (imageAnalysisDTO.getImageUrl() == null || imageAnalysisDTO.getImageUrl().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Image URL is required");
        }

        if (API_KEY == null || API_KEY.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Gemini API key not configured");
        }

        try {
            String description = callGeminiVisionAPI(imageAnalysisDTO.getImageUrl(), imageAnalysisDTO.getPrompt());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("description", description);

            Debug.log("Gemini image analysis successful. Description: " + description);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Debug.log("Gemini image analysis failed: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to analyze image");
            errorResponse.put("details", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private String callGeminiVisionAPI(String imageUrl, String prompt) throws Exception {
        String url = GEMINI_API_URL + "?key=" + API_KEY;

        // Default prompt if none provided
        if (prompt == null || prompt.isEmpty()) {
            prompt = "Describe this image in detail, including objects, animals, landscapes, people, food, activities, weather, time of day, and any notable features. Be comprehensive but concise.";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();

        // Create contents array
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();

        List<Map<String, Object>> parts = new ArrayList<>();

        // Add text part
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);

        // Add image part
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();

        // Download image and convert to base64
        String base64Image = downloadImageAsBase64(imageUrl);
        String mimeType = getMimeTypeFromUrl(imageUrl);

        inlineData.put("mime_type", mimeType);
        inlineData.put("data", base64Image);
        imagePart.put("inline_data", inlineData);
        parts.add(imagePart);

        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);

        // Add generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.3);
        generationConfig.put("maxOutputTokens", 300);
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            return parseGeminiResponse(jsonResponse);
        } else {
            throw new RuntimeException("Gemini API call failed with status: " + response.getStatusCode());
        }
    }

    private String downloadImageAsBase64(String imageUrl) throws Exception {
        ResponseEntity<byte[]> response = restTemplate.getForEntity(imageUrl, byte[].class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return java.util.Base64.getEncoder().encodeToString(response.getBody());
        } else {
            throw new RuntimeException("Failed to download image from URL: " + imageUrl);
        }
    }

    private String getMimeTypeFromUrl(String imageUrl) {
        String lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.contains(".jpg") || lowerUrl.contains(".jpeg")) {
            return "image/jpeg";
        } else if (lowerUrl.contains(".png")) {
            return "image/png";
        } else if (lowerUrl.contains(".gif")) {
            return "image/gif";
        } else if (lowerUrl.contains(".webp")) {
            return "image/webp";
        } else if (lowerUrl.contains(".bmp")) {
            return "image/bmp";
        } else {
            return "image/jpeg"; // default fallback
        }
    }

    private String parseGeminiResponse(JsonNode response) {
        try {
            JsonNode candidates = response.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode firstCandidate = candidates.get(0);
                JsonNode content = firstCandidate.path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText().trim();
                }
            }
            return "Unable to analyze image with Gemini";
        } catch (Exception e) {
            Debug.log("Error parsing Gemini response: " + e.getMessage());
            return "Error parsing Gemini response";
        }
    }
}