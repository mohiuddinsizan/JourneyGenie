package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.ImageAnalysisDTO;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.UserRepository;
import com.example.journeyGenie.util.Debug;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${google.vision.api.key}")
    private String googleVisionApiKey;

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

        try {
            String description = callOpenAIVisionAPI(imageAnalysisDTO.getImageUrl(), imageAnalysisDTO.getPrompt());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("description", description);

            Debug.log("Image analysis successful. Description: " + description);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Debug.log("Image analysis failed: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to analyze image");
            errorResponse.put("details", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    public ResponseEntity<?> googleVisionDescribe(ImageAnalysisDTO imageAnalysisDTO, HttpServletRequest request) {
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

        try {
            String description = callGoogleVisionAPI(imageAnalysisDTO.getImageUrl());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("description", description);

            Debug.log("Google Vision analysis successful. Description: " + description);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Debug.log("Google Vision analysis failed: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to analyze image");
            errorResponse.put("details", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private String callOpenAIVisionAPI(String imageUrl, String prompt) throws Exception {
        String url = "https://api.openai.com/v1/chat/completions";

        // Default prompt if none provided
        if (prompt == null || prompt.isEmpty()) {
            prompt = "Describe this image in detail, including objects, animals, landscapes, people, food, activities, weather, time of day, and any notable features. Be comprehensive but concise.";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4-vision-preview");
        requestBody.put("max_tokens", 300);
        requestBody.put("temperature", 0.3);

        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");

        List<Map<String, Object>> content = new ArrayList<>();

        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", prompt);
        content.add(textContent);

        Map<String, Object> imageContent = new HashMap<>();
        imageContent.put("type", "image_url");
        Map<String, Object> imageUrlObj = new HashMap<>();
        imageUrlObj.put("url", imageUrl);
        imageUrlObj.put("detail", "low");
        imageContent.put("image_url", imageUrlObj);
        content.add(imageContent);

        message.put("content", content);
        messages.add(message);
        requestBody.put("messages", messages);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            return jsonResponse.path("choices").get(0).path("message").path("content").asText().trim();
        } else {
            throw new RuntimeException("OpenAI API call failed with status: " + response.getStatusCode());
        }
    }

    private String callGoogleVisionAPI(String imageUrl) throws Exception {
        String url = "https://vision.googleapis.com/v1/images:annotate?key=" + googleVisionApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> requests = new ArrayList<>();

        Map<String, Object> request = new HashMap<>();

        Map<String, Object> image = new HashMap<>();
        Map<String, String> source = new HashMap<>();
        source.put("imageUri", imageUrl);
        image.put("source", source);
        request.put("image", image);

        List<Map<String, Object>> features = new ArrayList<>();

        Map<String, Object> labelDetection = new HashMap<>();
        labelDetection.put("type", "LABEL_DETECTION");
        labelDetection.put("maxResults", 20);
        features.add(labelDetection);

        Map<String, Object> objectDetection = new HashMap<>();
        objectDetection.put("type", "OBJECT_LOCALIZATION");
        objectDetection.put("maxResults", 20);
        features.add(objectDetection);

        Map<String, Object> landmarkDetection = new HashMap<>();
        landmarkDetection.put("type", "LANDMARK_DETECTION");
        landmarkDetection.put("maxResults", 10);
        features.add(landmarkDetection);

        request.put("features", features);
        requests.add(request);
        requestBody.put("requests", requests);

        HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, httpRequest, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            return parseGoogleVisionResponse(jsonResponse);
        } else {
            throw new RuntimeException("Google Vision API call failed with status: " + response.getStatusCode());
        }
    }

    private String parseGoogleVisionResponse(JsonNode response) {
        StringBuilder description = new StringBuilder();
        List<String> allDetected = new ArrayList<>();

        JsonNode annotations = response.path("responses").get(0);

        // Extract labels
        JsonNode labelAnnotations = annotations.path("labelAnnotations");
        if (labelAnnotations.isArray()) {
            for (JsonNode label : labelAnnotations) {
                String labelDesc = label.path("description").asText().toLowerCase();
                if (!labelDesc.isEmpty()) {
                    allDetected.add(labelDesc);
                }
            }
        }

        // Extract objects
        JsonNode objectAnnotations = annotations.path("localizedObjectAnnotations");
        if (objectAnnotations.isArray()) {
            for (JsonNode object : objectAnnotations) {
                String objectName = object.path("name").asText().toLowerCase();
                if (!objectName.isEmpty() && !allDetected.contains(objectName)) {
                    allDetected.add(objectName);
                }
            }
        }

        // Extract landmarks
        JsonNode landmarkAnnotations = annotations.path("landmarkAnnotations");
        if (landmarkAnnotations.isArray()) {
            for (JsonNode landmark : landmarkAnnotations) {
                String landmarkDesc = landmark.path("description").asText().toLowerCase();
                if (!landmarkDesc.isEmpty() && !allDetected.contains(landmarkDesc)) {
                    allDetected.add(landmarkDesc);
                }
            }
        }

        if (!allDetected.isEmpty()) {
            description.append("This image contains: ").append(String.join(", ", allDetected));
        } else {
            description.append("Unable to detect specific content in this image");
        }

        return description.toString();
    }
}