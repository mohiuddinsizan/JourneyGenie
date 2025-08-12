package com.example.journeyGenie.controller;

import com.example.journeyGenie.entity.*;
import com.example.journeyGenie.service.TourService;
import com.example.journeyGenie.util.AppEnv;
import com.example.journeyGenie.util.Debug;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/plan")
public class PlanController {

    @Autowired
    private TourService tourService;

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    // Your Google API key for Gemini here:
    private static final String API_KEY = AppEnv.getGEMINI_API();

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class PlanRequest {
        public String destination;
        public String startDate;
        public String endDate;
        public String budget;
    }

    @PostMapping("/preview")
    public ResponseEntity<?> preview(@RequestBody PlanRequest req, HttpServletRequest request) {
        Debug.log("preparing plan preview");
        try {
            LocalDate start = LocalDate.parse(req.startDate);
            LocalDate end = LocalDate.parse(req.endDate);
            long days = ChronoUnit.DAYS.between(start, end) + 1;
            if (days <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid date range");
            }

            String prompt = buildGeminiPrompt(req.destination, days, req.budget, req.startDate);
            Debug.log("Prompt: " + prompt);

            ObjectNode geminiResponse = callGeminiApiNew(prompt);

            Debug.log("checkpoint 5");
            if (geminiResponse == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get response from Gemini");
            }

            Debug.log("Full Gemini response: " + geminiResponse.toString());
            Debug.log("checkpoint 6");

            // Check if response has candidates
            JsonNode candidates = geminiResponse.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                Debug.log("No candidates in response");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No candidates in Gemini response");
            }

            // Extract the generated content text - correct path for Gemini API
            JsonNode firstCandidate = candidates.get(0);
            JsonNode content = firstCandidate.get("content");
            if (content == null) {
                Debug.log("No content in first candidate");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No content in Gemini response");
            }

            JsonNode parts = content.get("parts");
            if (parts == null || parts.isEmpty()) {
                Debug.log("No parts in content");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No parts in Gemini response");
            }

            String textContent = parts.get(0).get("text").asText();
            Debug.log("Raw text content: " + textContent);

            // Clean the JSON content (remove markdown code blocks if present)
            String cleanedContent = textContent.trim();
            if (cleanedContent.startsWith("```json")) {
                cleanedContent = cleanedContent.substring(7);
            }
            if (cleanedContent.endsWith("```")) {
                cleanedContent = cleanedContent.substring(0, cleanedContent.length() - 3);
            }
            cleanedContent = cleanedContent.trim();

            Debug.log("Cleaned content: " + cleanedContent);

            // Parse the content JSON string into Map
            Map<String, Object> planMap;
            try {
                planMap = objectMapper.readValue(cleanedContent, Map.class);
            } catch (Exception e) {
                Debug.log("Failed to parse JSON: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to parse Gemini response as JSON: " + e.getMessage());
            }

            Debug.log("checkpoint 7");

            // Add original fields for frontend display
            planMap.put("destination", req.destination);
            planMap.put("startDate", req.startDate);
            planMap.put("endDate", req.endDate);
            planMap.put("budget", req.budget);

            Debug.log("checkpoint 8");

            return ResponseEntity.ok(planMap);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error generating plan: " + e.getMessage());
        }
    }

    // New endpoint to commit the plan into DB
    // Method 1: Using ObjectMapper to convert to JSON (Recommended)
    @PostMapping("/commit")
    public ResponseEntity<?> commitPlan(@RequestBody Map<String, Object> planRequest, HttpServletRequest request) {
        try {
            Tour tour = new Tour();

            // Extract base fields
            tour.setDestination((String) planRequest.get("destination"));
            tour.setStartDate((String) planRequest.get("startDate"));
            tour.setEndDate((String) planRequest.get("endDate"));
            tour.setBudget((String) planRequest.get("budget"));

            // TODO: set user from session/auth if applicable
            tour.setUser(null);

            List<Day> days = new ArrayList<>();

            Object daysObj = planRequest.get("days");
            if (daysObj instanceof List<?>) {
                List<?> daysList = (List<?>) daysObj;
                for (Object dayObj : daysList) {
                    if (!(dayObj instanceof Map)) continue;
                    Map<?, ?> dayMap = (Map<?, ?>) dayObj;

                    Day day = new Day();
                    day.setDate((String) dayMap.get("date"));
                    day.setTour(tour);

                    // Activities
                    List<Activity> activities = new ArrayList<>();
                    Object activitiesObj = dayMap.get("activities");
                    if (activitiesObj instanceof List<?>) {
                        List<?> activitiesList = (List<?>) activitiesObj;
                        for (Object activityObj : activitiesList) {
                            if (!(activityObj instanceof Map)) continue;
                            Map<?, ?> activityMap = (Map<?, ?>) activityObj;

                            Activity activity = new Activity();

                            String description = null;
                            if (activityMap.get("description") != null) {
                                description = (String) activityMap.get("description");
                            } else {
                                StringBuilder sb = new StringBuilder();
                                Object name = activityMap.get("name");
                                Object timeOfDay = activityMap.get("timeOfDay");
                                Object cost = activityMap.get("cost");

                                if (name != null) sb.append(name);
                                if (timeOfDay != null) sb.append(" (").append(timeOfDay).append(")");
                                if (cost != null) sb.append(" - Cost: ").append(cost);

                                description = sb.toString();
                            }

                            activity.setDescription(description);
                            activity.setDay(day);
                            activities.add(activity);
                        }
                    }

                    day.setActivities(activities);
                    day.setPhotos(new ArrayList<>());
                    days.add(day);
                }
            }

            tour.setDays(days);

            // Method 1: Print as JSON (Most readable and detailed)
            try {
                ObjectMapper mapper = new ObjectMapper();
                // Configure to handle circular references if any
                mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
                String tourJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(tour);
                System.out.println("=== COMPLETE TOUR OBJECT AS JSON ===");
                System.out.println(tourJson);
                System.out.println("=== END TOUR OBJECT ===");
            } catch (Exception e) {
                System.err.println("Failed to serialize tour to JSON: " + e.getMessage());
            }

            // Method 2: Print basic tour info
            System.out.println("=== TOUR SUMMARY ===");
            System.out.println("Destination: " + tour.getDestination());
            System.out.println("Start Date: " + tour.getStartDate());
            System.out.println("End Date: " + tour.getEndDate());
            System.out.println("Budget: " + tour.getBudget());
            System.out.println("Total Days: " + tour.getDays().size());

            // Method 3: Print each day with activities
            System.out.println("=== DETAILED DAY-BY-DAY BREAKDOWN ===");
            for (int i = 0; i < tour.getDays().size(); i++) {
                Day day = tour.getDays().get(i);
                System.out.println("Day " + (i + 1) + " (" + day.getDate() + "):");
                System.out.println("  Activities: " + day.getActivities().size());
                for (int j = 0; j < day.getActivities().size(); j++) {
                    Activity activity = day.getActivities().get(j);
                    System.out.println("    Activity " + (j + 1) + ": " + activity.getDescription());
                }
            }

            // Method 4: Count totals
            int totalActivities = tour.getDays().stream()
                    .mapToInt(day -> day.getActivities().size())
                    .sum();
            System.out.println("=== TOUR STATISTICS ===");
            System.out.println("Total Days: " + tour.getDays().size());
            System.out.println("Total Activities: " + totalActivities);

            return tourService.createTour(tour, request);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save tour: " + e.getMessage());
        }
    }

    // Alternative Method: Create a separate utility method for printing tours
    private void printTourDetails(Tour tour) {
        System.out.println("==========================================");
        System.out.println("           TOUR DETAILS");
        System.out.println("==========================================");
        System.out.println("Destination: " + tour.getDestination());
        System.out.println("Dates: " + tour.getStartDate() + " to " + tour.getEndDate());
        System.out.println("Budget: " + tour.getBudget());
        System.out.println("User: " + (tour.getUser() != null ? tour.getUser().getEmail() : "Not set"));
        System.out.println("------------------------------------------");

        for (int dayIndex = 0; dayIndex < tour.getDays().size(); dayIndex++) {
            Day day = tour.getDays().get(dayIndex);
            System.out.println("DAY " + (dayIndex + 1) + " - " + day.getDate());
            System.out.println("Activities (" + day.getActivities().size() + "):");

            for (int actIndex = 0; actIndex < day.getActivities().size(); actIndex++) {
                Activity activity = day.getActivities().get(actIndex);
                System.out.println("  " + (actIndex + 1) + ". " + activity.getDescription());
            }

            System.out.println("Photos: " + day.getPhotos().size());
            System.out.println("------------------------------------------");
        }
        System.out.println("==========================================");
    }

// Then call it like this:
// printTourDetails(tour);

    private String buildGeminiPrompt(String destination, long days, String budget, String startDate) {
        return String.format("""
            You are a travel assistant AI. Create a detailed %d-day tour plan for a trip to %s.
            The budget is %s level.
            For each day, suggest:
             - date (in yyyy-MM-dd format)
             - title (short summary)
             - transportation option(s)
             - hotel name or recommendation
             - a list of activities with name, optional timeOfDay (morning, afternoon, evening), and approximate cost.
            
            IMPORTANT: Return ONLY the JSON response, no additional text or markdown formatting.
            
            Return the plan as JSON in the following format:

            {
              "days": [
                {
                  "date": "2025-08-15",
                  "title": "Arrival and sightseeing",
                  "transportation": "Taxi from airport",
                  "hotel": "Hotel Sunshine",
                  "activities": [
                    {"name": "Visit the Old Town", "timeOfDay": "morning", "cost": "$20"},
                    {"name": "Lunch at local restaurant", "timeOfDay": "afternoon", "cost": "$15"},
                    {"name": "Evening river walk", "timeOfDay": "evening", "cost": "$0"}
                  ]
                }
              ]
            }

            Make the plan realistic and varied, based on the %s budget level.
            Use dates starting from the trip start date %s.
            Ensure all activities have a cost field, use "$0" for free activities.
            """, days, destination, budget, budget, startDate);
    }

    private ObjectNode callGeminiApiNew(String prompt) throws IOException, InterruptedException {
        // Build request JSON body with generation config for better JSON output
        ObjectNode textPart = objectMapper.createObjectNode();
        textPart.put("text", prompt);
        Debug.log("checkpoint 1");

        ObjectNode partNode = objectMapper.createObjectNode();
        partNode.set("parts", objectMapper.createArrayNode().add(textPart));

        // Add generation config for more consistent JSON output
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("topK", 40);
        generationConfig.put("topP", 0.95);
        generationConfig.put("maxOutputTokens", 8192);

        ObjectNode bodyJson = objectMapper.createObjectNode();
        bodyJson.set("contents", objectMapper.createArrayNode().add(partNode));
        bodyJson.set("generationConfig", generationConfig);

        Debug.log("Request body: " + bodyJson.toString());
        Debug.log("checkpoint 2");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_API_URL + "?key=" + API_KEY))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson.toString()))
                .build();

        Debug.log("checkpoint 3");

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        Debug.log("Response status: " + response.statusCode());
        Debug.log("Response body: " + response.body());
        Debug.log("checkpoint 4");

        if (response.statusCode() != 200) {
            System.err.println("Gemini API error: " + response.body());
            return null;
        }

        return (ObjectNode) objectMapper.readTree(response.body());
    }
}