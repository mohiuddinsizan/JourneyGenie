// File: src/main/java/com/example/journeyGenie/controller/PlanController.java
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
import com.example.journeyGenie.service.TokenService;


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

    @Autowired
    private TokenService tokenService;

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    private static final String API_KEY = AppEnv.getGEMINI_API();

    // Adjust this if you want a different assumed rate (used ONLY to guide Gemini)
    private static final double APPROX_USD_TO_BDT = 120.0;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Now includes startLocation
    public static class PlanRequest {
        public String startLocation;
        public String destination;
        public String startDate;
        public String endDate;
        public String budget;
    }

    @PostMapping("/preview")
    public ResponseEntity<?> preview(@RequestBody PlanRequest req, HttpServletRequest request) {
        Debug.log("preparing plan preview");
        try {
            if (req.startLocation == null || req.startLocation.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Start location is required");
            }
            if (req.destination == null || req.destination.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Destination is required");
            }

            LocalDate start = LocalDate.parse(req.startDate);
            LocalDate end = LocalDate.parse(req.endDate);
            long days = ChronoUnit.DAYS.between(start, end) + 1;
            if (days <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid date range");
            }

            String prompt = buildGeminiPrompt(
                    req.startLocation,
                    req.destination,
                    days,
                    req.budget,
                    req.startDate,
                    APPROX_USD_TO_BDT
            );
            Debug.log("Prompt:\n" + prompt);

            ObjectNode geminiResponse = callGeminiApiNew(prompt);
            if (geminiResponse == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get response from Gemini");
            }

            JsonNode candidates = geminiResponse.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No candidates in Gemini response");
            }

            JsonNode firstCandidate = candidates.get(0);
            JsonNode content = firstCandidate.get("content");
            if (content == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No content in Gemini response");
            }

            JsonNode parts = content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No parts in Gemini response");
            }

            String textContent = parts.get(0).get("text").asText();

            // strip ```json fences if present
            String cleaned = textContent.trim();
            if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
            if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);
            cleaned = cleaned.trim();

            Map<String, Object> planMap;
            try {
                planMap = objectMapper.readValue(cleaned, Map.class);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to parse Gemini response as JSON: " + e.getMessage());
            }

            // Echo inputs so frontend sees them in preview/commit
            planMap.put("startLocation", req.startLocation);
            planMap.put("destination", req.destination);
            planMap.put("startDate", req.startDate);
            planMap.put("endDate", req.endDate);
            planMap.put("budget", req.budget);

            return ResponseEntity.ok(planMap);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error generating plan: " + e.getMessage());
        }
    }

    @PostMapping("/commit")
    public ResponseEntity<?> commitPlan(@RequestBody Map<String, Object> planRequest, HttpServletRequest request) {
        try {
            // Calculate number of days for token deduction
            int numberOfDays = 0;
            Object daysObj = planRequest.get("days");
            if (daysObj instanceof List<?> daysList) {
                numberOfDays = daysList.size();
            }

            // Check if the user has enough tokens (1 token per day)
            ResponseEntity<?> tokenResponse = tokenService.getUserToken(request, null);

            // Debug: Log the response body to understand its structure
            System.out.println("Token Response: " + tokenResponse.getBody());

            if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(401).body("User not authenticated");
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
            System.out.println("Required Tokens: " + numberOfDays);

            if (userTokens == null || userTokens < numberOfDays) {
                return ResponseEntity.status(400).body("Insufficient tokens. You need at least " + numberOfDays + " tokens to start this " + numberOfDays + "-day tour.");
            }

            // Deduct tokens (1 per day)
            ResponseEntity<?> deductionResponse = tokenService.deductTokens(request, numberOfDays);
            if (!deductionResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(400).body("Failed to deduct tokens.");
            }

            // Proceed with tour creation (your existing logic)
            Tour tour = new Tour();

            tour.setStartLocation((String) planRequest.get("startLocation"));
            tour.setDestination((String) planRequest.get("destination"));
            tour.setStartDate((String) planRequest.get("startDate"));
            tour.setEndDate((String) planRequest.get("endDate"));
            tour.setBudget((String) planRequest.get("budget"));
            tour.setUser(null); // bound in service

            List<Day> days = new ArrayList<>();
            if (daysObj instanceof List<?> daysList) {
                for (Object dayObj : daysList) {
                    if (!(dayObj instanceof Map)) continue;
                    Map<?, ?> dayMap = (Map<?, ?>) dayObj;

                    Day day = new Day();
                    day.setDate((String) dayMap.get("date"));
                    day.setTour(tour);

                    // Collect real activities from Gemini
                    List<Activity> activities = new ArrayList<>();
                    Object activitiesObj = dayMap.get("activities");
                    if (activitiesObj instanceof List<?> activitiesList) {
                        for (Object activityObj : activitiesList) {
                            if (!(activityObj instanceof Map)) continue;
                            Map<?, ?> activityMap = (Map<?, ?>) activityObj;

                            Activity activity = new Activity();
                            String description = buildActivityDescriptionWithBdt(activityMap);
                            activity.setDescription(description);
                            activity.setDay(day);
                            activities.add(activity);
                        }
                    }

                    // NEW: inject transport/hotel as synthetic activities
                    String transport = optString(dayMap, "transportation");
                    Double transportCost = readNumber(dayMap, "transportationCostBdt", "transportation_cost_bdt");
                    if (hasText(transport) || (transportCost != null && transportCost > 0)) {
                        Activity a = new Activity();
                        StringBuilder sb = new StringBuilder("Transport: ");
                        sb.append(hasText(transport) ? transport : "—");
                        if (transportCost != null) {
                            sb.append(" - Cost: ").append(formatBdt(transportCost));
                        } else {
                            sb.append(" - Cost: ").append("৳0");
                        }
                        a.setDescription(sb.toString());
                        a.setDay(day);
                        activities.add(0, a);
                    }

                    String hotel = optString(dayMap, "hotel");
                    Double hotelCost = readNumber(dayMap, "hotelCostBdt", "hotel_cost_bdt");
                    if (hasText(hotel) || (hotelCost != null && hotelCost > 0)) {
                        Activity a = new Activity();
                        StringBuilder sb = new StringBuilder("Hotel: ");
                        sb.append(hasText(hotel) ? hotel : "—");
                        if (hotelCost != null) {
                            sb.append(" - Cost: ").append(formatBdt(hotelCost));
                        } else {
                            sb.append(" - Cost: ").append("৳0");
                        }
                        a.setDescription(sb.toString());
                        a.setDay(day);
                        int insertAt = !activities.isEmpty() && activities.get(0).getDescription().startsWith("Transport:")
                                ? 1 : 0;
                        activities.add(insertAt, a);
                    }

                    day.setActivities(activities);
                    day.setPhotos(new ArrayList<>());
                    days.add(day);
                }
            }

            tour.setDays(days);
            return tourService.createTour(tour, request);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save tour: " + e.getMessage());
        }
    }

    // helpers (keep these in the same controller class)
    private static boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private static String formatBdt(double v) {
        return "৳" + Math.round(v);
    }

    private static Double readNumber(Map<?, ?> map, String... keys) {
        for (String k : keys) {
            Object v = map.get(k);
            if (v instanceof Number n) return n.doubleValue();
            if (v != null) {
                try {
                    String s = String.valueOf(v).replaceAll("[^0-9.\\-]", "");
                    if (hasText(s)) return Double.parseDouble(s);
                } catch (Exception ignored) {}
            }
        }
        return null;
    }

    /**
     * Build a user-friendly description string that always includes BDT cost when available.
     * Accepts several possible keys Gemini might return:
     *   - name / description
     *   - costBdt / cost_bdt (number or string)
     *   - cost (string like "$20" — we keep as fallback)
     */
    private String buildActivityDescriptionWithBdt(Map<?, ?> activityMap) {
        String name = optString(activityMap, "description");
        if (name == null || name.isBlank()) {
            name = optString(activityMap, "name");
        }
        String timeOfDay = optString(activityMap, "timeOfDay");

        // prefer numeric BDT if provided
        String bdtText = null;
        Object costBdtObj = firstNonNull(
                activityMap.get("costBdt"),
                activityMap.get("cost_bdt"),
                activityMap.get("priceBdt"),
                activityMap.get("price_bdt")
        );
        if (costBdtObj != null) {
            try {
                double v = costBdtObj instanceof Number
                        ? ((Number) costBdtObj).doubleValue()
                        : Double.parseDouble(String.valueOf(costBdtObj).replaceAll("[^0-9.]", ""));
                bdtText = "৳" + Math.round(v);
            } catch (Exception ignored) { /* fall back below */ }
        }

        // fallback to 'cost' (string like "$20")
        String costText = optString(activityMap, "cost");

        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name);
        if (timeOfDay != null && !timeOfDay.isBlank()) sb.append(" (").append(timeOfDay).append(")");
        if (bdtText != null) {
            sb.append(" - Cost: ").append(bdtText);
        } else if (costText != null && !costText.isBlank()) {
            sb.append(" - Cost: ").append(costText);
        } else {
            sb.append(" - Cost: ৳0");
        }
        return sb.toString();
    }

    private static Object firstNonNull(Object... xs) {
        for (Object x : xs) if (x != null) return x;
        return null;
    }

    private static String optString(Map<?, ?> m, String key) {
        Object v = m.get(key);
        return v == null ? null : String.valueOf(v);
    }

    // ROUND-TRIP prompt with explicit BDT costs & totals
    private String buildGeminiPrompt(String startLocation,
                                     String destination,
                                     long days,
                                     String budget,
                                     String tripStartDate,
                                     double usdToBdt) {
        return String.format("""
            You are a travel assistant AI. Create a detailed %d-day ROUND-TRIP itinerary that:
              • STARTS in %s,
              • TRAVELS to %s,
              • and RETURNS to %s by the end of the trip.

            Budget level: %s.
            Use calendar dates starting from %s (yyyy-MM-dd).
            For currency, ALWAYS provide **Bangladeshi Taka (BDT)** values for costs, using an approximate conversion of
            1 USD ≈ %.2f BDT when needed.

            HARD REQUIREMENTS:
            - Day 1 must include transit from %s to %s (with a realistic transport option AND cost in BDT).
            - The FINAL day must include transit from %s back to %s (with transport option AND cost in BDT).
            - Each day must contain:
                • "date" (yyyy-MM-dd)
                • "title" (short summary)
                • "transportation" (string for the day's movement; put the long-haul legs on Day 1 and final day)
                • "transportationCostBdt" (number, estimated)
                • "hotel" (name/suggestion; can be the same across multiple days)
                • "hotelCostBdt" (number, estimated for that night; 0 if not applicable)
                • "activities": array of objects with:
                    {
                      "name": "Visit XYZ",
                      "timeOfDay": "morning|afternoon|evening",
                      "costBdt": 0 | number (always present; put 0 for free)
                    }
                • "dailyTotalBdt": number = transportationCostBdt + hotelCostBdt + sum(activity.costBdt)

            ALSO RETURN a top-level "tripTotalBdt": sum of dailyTotalBdt across all days.

            OUTPUT FORMAT:
            Return ONLY valid JSON (no markdown). Use exactly this schema:

            {
              "days": [
                {
                  "date": "2025-08-15",
                  "title": "Arrival and sightseeing",
                  "transportation": "Flight from START → DEST, taxi to hotel",
                  "transportationCostBdt": 0,
                  "hotel": "Hotel Sunshine",
                  "hotelCostBdt": 0,
                  "activities": [
                    {"name": "Visit the Old Town", "timeOfDay": "morning", "costBdt": 0},
                    {"name": "Lunch at local restaurant", "timeOfDay": "afternoon", "costBdt": 1500},
                    {"name": "Evening river walk", "timeOfDay": "evening", "costBdt": 0}
                  ],
                  "dailyTotalBdt": 0
                }
              ],
              "tripTotalBdt": 0
            }

            Make the plan realistic for the specified budget and city.
            """,
                days, startLocation, destination, startLocation,
                budget,
                tripStartDate,
                usdToBdt,
                startLocation, destination,
                destination, startLocation
        );
    }

    private ObjectNode callGeminiApiNew(String prompt) throws IOException, InterruptedException {
        ObjectNode textPart = objectMapper.createObjectNode().put("text", prompt);
        ObjectNode partNode = objectMapper.createObjectNode().set("parts", objectMapper.createArrayNode().add(textPart));

        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.6);
        generationConfig.put("topK", 40);
        generationConfig.put("topP", 0.9);
        generationConfig.put("maxOutputTokens", 8192);

        ObjectNode bodyJson = objectMapper.createObjectNode();
        bodyJson.set("contents", objectMapper.createArrayNode().add(partNode));
        bodyJson.set("generationConfig", generationConfig);

        HttpRequest httpReq = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_API_URL + "?key=" + API_KEY))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson.toString()))
                .build();

        HttpResponse<String> resp = httpClient.send(httpReq, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            System.err.println("Gemini API error: " + resp.body());
            return null;
        }
        return (ObjectNode) objectMapper.readTree(resp.body());
    }
}
