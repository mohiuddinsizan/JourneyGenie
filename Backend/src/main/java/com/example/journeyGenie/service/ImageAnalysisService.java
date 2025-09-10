package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.ImageAnalysisDTO;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.entity.Day;
import com.example.journeyGenie.entity.Photo;
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

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

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

    // Simple in-memory cache for analyzed images
    private final Map<String, AnalysisCache> analysisCache = new ConcurrentHashMap<>();

    // Cache entry class
    private static class AnalysisCache {
        String description;
        String category;
        String mood;
        List<String> tags;
        LocalDateTime analyzedAt;

        AnalysisCache(String description, String category, String mood, List<String> tags) {
            this.description = description;
            this.category = category;
            this.mood = mood;
            this.tags = tags;
            this.analyzedAt = LocalDateTime.now();
        }
    }

    // Photo metadata class
    private static class PhotoData {
        Long photoId;
        String imageUrl;
        Long tourId;
        Long dayId;
        String tourTitle;
        String destination;
        String startLocation;
        String date;

        PhotoData(Long photoId, String imageUrl, Long tourId, Long dayId,
                  String tourTitle, String destination, String startLocation, String date) {
            this.photoId = photoId;
            this.imageUrl = imageUrl;
            this.tourId = tourId;
            this.dayId = dayId;
            this.tourTitle = tourTitle;
            this.destination = destination;
            this.startLocation = startLocation;
            this.date = date;
        }
    }

    // Original analyze method - keep for backward compatibility
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

    // New smart search method
    public ResponseEntity<?> searchImages(ImageAnalysisDTO searchRequest, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        String query = searchRequest.getQuery();
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Search query is required"));
        }

        Debug.log("Smart search initiated for query: '" + query + "' by user: " + email);

        try {
            // Extract all user photos
            List<PhotoData> allPhotos = extractUserPhotos(user);
            Debug.log("Total photos found: " + allPhotos.size());

            if (allPhotos.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "results", new ArrayList<>(),
                        "message", "No photos found"
                ));
            }

            // Analyze photos that aren't cached yet (limit to prevent API overload)
            int maxToAnalyze = Math.min(10, allPhotos.size());
            int analyzed = 0;

            for (int i = 0; i < maxToAnalyze; i++) {
                PhotoData photo = allPhotos.get(i);
                String cacheKey = photo.imageUrl + "_" + email;

                if (!analysisCache.containsKey(cacheKey)) {
                    try {
                        AnalysisCache analysis = analyzeImageWithGemini(photo.imageUrl);
                        if (analysis != null) {
                            analysisCache.put(cacheKey, analysis);
                            analyzed++;
                            Debug.log("Analyzed photo " + photo.photoId + " successfully");
                        }

                        // Small delay to prevent API rate limiting
                        Thread.sleep(500);
                    } catch (Exception e) {
                        Debug.log("Failed to analyze photo " + photo.photoId + ": " + e.getMessage());
                    }
                }
            }

            Debug.log("Analyzed " + analyzed + " new photos");

            // Perform search
            List<ImageAnalysisDTO> searchResults = performIntelligentSearch(query, allPhotos, email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("results", searchResults);
            response.put("totalPhotos", allPhotos.size());
            response.put("analyzedPhotos", analysisCache.size());
            response.put("newlyAnalyzed", analyzed);
            response.put("query", query);

            Debug.log("Search completed. Found " + searchResults.size() + " matching photos");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Debug.log("Smart search failed: " + e.getMessage());
            e.printStackTrace();

            // Fallback to basic search
            try {
                List<PhotoData> allPhotos = extractUserPhotos(user);
                List<ImageAnalysisDTO> basicResults = performBasicSearch(query, allPhotos);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "results", basicResults,
                        "message", "Used basic search due to error in AI analysis",
                        "error", e.getMessage()
                ));
            } catch (Exception fallbackError) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                        "success", false,
                        "error", "Search failed completely",
                        "message", fallbackError.getMessage()
                ));
            }
        }
    }

    // Extract photos from user data
    private List<PhotoData> extractUserPhotos(User user) {
        List<PhotoData> photos = new ArrayList<>();

        if (user.getTours() != null) {
            for (Tour tour : user.getTours()) {
                if (tour.getDays() != null) {
                    for (Day day : tour.getDays()) {
                        if (day.getPhotos() != null) {
                            for (Photo photo : day.getPhotos()) {
                                photos.add(new PhotoData(
                                        photo.getId(),
                                        photo.getLink(),
                                        tour.getId(),
                                        day.getId(),
                                        tour.getDestination() + " Trip",
                                        tour.getDestination(),
                                        tour.getStartLocation(),
                                        day.getDate() != null ? day.getDate().toString() : ""
                                ));
                            }
                        }
                    }
                }
            }
        }

        return photos;
    }

    // Analyze image with Gemini for search
    private AnalysisCache analyzeImageWithGemini(String imageUrl) throws Exception {
        String searchPrompt = """
            Analyze this travel photo and provide a structured response in the following format:
            
            DESCRIPTION: [Detailed description of what you see in the image]
            CATEGORY: [Choose one: landscape, food, architecture, people, animals, activity, sunset, cityscape, beach, mountain, indoor, outdoor, cultural, transport]
            MOOD: [Choose one: peaceful, exciting, romantic, adventurous, relaxing, energetic, serene, dramatic, festive, cozy, mysterious]
            TAGS: [List 5-8 relevant searchable keywords separated by commas]
            
            Focus on elements that would help someone search for this image later.
            """;

        try {
            String response = callGeminiVisionAPI(imageUrl, searchPrompt);
            return parseStructuredResponse(response);
        } catch (Exception e) {
            Debug.log("Gemini analysis failed for image: " + e.getMessage());
            throw e;
        }
    }

    // Parse Gemini structured response
    private AnalysisCache parseStructuredResponse(String response) {
        String description = "";
        String category = "";
        String mood = "";
        List<String> tags = new ArrayList<>();

        try {
            String[] lines = response.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.startsWith("DESCRIPTION:")) {
                    description = line.substring(12).trim();
                } else if (line.startsWith("CATEGORY:")) {
                    category = line.substring(9).trim().toLowerCase();
                } else if (line.startsWith("MOOD:")) {
                    mood = line.substring(5).trim().toLowerCase();
                } else if (line.startsWith("TAGS:")) {
                    String tagsStr = line.substring(5).trim();
                    if (!tagsStr.isEmpty()) {
                        tags = Arrays.stream(tagsStr.split(","))
                                .map(String::trim)
                                .map(String::toLowerCase)
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.toList());
                    }
                }
            }

            // If parsing fails, use the full response as description
            if (description.isEmpty()) {
                description = response;
            }

        } catch (Exception e) {
            Debug.log("Failed to parse structured response: " + e.getMessage());
            description = response;
        }

        return new AnalysisCache(description, category, mood, tags);
    }

    // Perform intelligent search using cached analysis
    private List<ImageAnalysisDTO> performIntelligentSearch(String query, List<PhotoData> photos, String userEmail) {
        List<ImageAnalysisDTO> results = new ArrayList<>();
        String queryLower = query.toLowerCase();

        for (PhotoData photo : photos) {
            double relevanceScore = 0.0;
            String matchDescription = "";
            String source = "basic";

            // Check cache for AI analysis
            String cacheKey = photo.imageUrl + "_" + userEmail;
            AnalysisCache analysis = analysisCache.get(cacheKey);

            if (analysis != null) {
                source = "analyzed";

                // Check description match
                if (analysis.description != null && analysis.description.toLowerCase().contains(queryLower)) {
                    relevanceScore += 2.0;
                    matchDescription = analysis.description;
                }

                // Check category match
                if (analysis.category != null && analysis.category.toLowerCase().contains(queryLower)) {
                    relevanceScore += 1.5;
                }

                // Check mood match
                if (analysis.mood != null && analysis.mood.toLowerCase().contains(queryLower)) {
                    relevanceScore += 1.2;
                }

                // Check tags match
                if (analysis.tags != null) {
                    for (String tag : analysis.tags) {
                        if (tag.toLowerCase().contains(queryLower)) {
                            relevanceScore += 1.0;
                            break;
                        }
                    }
                }
            }

            // Basic location/title matching
            String locationText = (photo.tourTitle + " " + photo.destination + " " + photo.startLocation).toLowerCase();
            if (locationText.contains(queryLower)) {
                relevanceScore += 0.5;
                if (matchDescription.isEmpty()) {
                    matchDescription = "Location match: " + photo.tourTitle;
                }
            }

            // Include results with any relevance
            if (relevanceScore > 0) {
                ImageAnalysisDTO result = new ImageAnalysisDTO();
                result.setPhotoId(photo.photoId);
                result.setImageUrl(photo.imageUrl);
                result.setDescription(matchDescription);
                result.setRelevance(relevanceScore);
                result.setSource(source);
                result.setTourId(photo.tourId);
                result.setDayId(photo.dayId);
                result.setTourTitle(photo.tourTitle);
                result.setDestination(photo.destination);
                result.setStartLocation(photo.startLocation);
                result.setDate(photo.date);

                if (analysis != null) {
                    result.setCategory(analysis.category);
                    result.setMood(analysis.mood);
                    result.setTags(analysis.tags);
                    result.setAnalyzedAt(analysis.analyzedAt);
                }

                results.add(result);
            }
        }

        // Sort by relevance (highest first)
        results.sort((a, b) -> Double.compare(b.getRelevance(), a.getRelevance()));
        return results;
    }

    // Basic search fallback
    private List<ImageAnalysisDTO> performBasicSearch(String query, List<PhotoData> photos) {
        List<ImageAnalysisDTO> results = new ArrayList<>();
        String queryLower = query.toLowerCase();

        for (PhotoData photo : photos) {
            String searchText = (photo.tourTitle + " " + photo.destination + " " + photo.startLocation).toLowerCase();
            if (searchText.contains(queryLower)) {
                ImageAnalysisDTO result = new ImageAnalysisDTO();
                result.setPhotoId(photo.photoId);
                result.setImageUrl(photo.imageUrl);
                result.setDescription("Basic location match");
                result.setRelevance(0.5);
                result.setSource("basic");
                result.setTourId(photo.tourId);
                result.setDayId(photo.dayId);
                result.setTourTitle(photo.tourTitle);
                result.setDestination(photo.destination);
                result.setStartLocation(photo.startLocation);
                result.setDate(photo.date);

                results.add(result);
            }
        }

        return results;
    }

    // Original Gemini API call method (your working code)
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