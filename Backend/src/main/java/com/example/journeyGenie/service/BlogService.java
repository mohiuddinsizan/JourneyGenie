package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.BlogDTO;
import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.entity.Day;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.TourRepository;
import com.example.journeyGenie.repository.UserRepository;
import com.example.journeyGenie.util.AppEnv;
import com.example.journeyGenie.util.Debug;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;   // explicit to avoid ambiguity
import java.net.http.HttpResponse;  // explicit to avoid ambiguity
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BlogService {

    // NOTE: matches your code: @Autowired private JWTService jwtService;
    @Autowired private JWTService jwtService;

    @Autowired private UserRepository userRepository;
    @Autowired private TourRepository tourRepository;
    @Autowired private TourService tourService; // will call updateBlog(dto, request)

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    private static final String API_KEY = AppEnv.getGEMINI_API();

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResponseEntity<?> generateAndSaveBlog(Long tourId, HttpServletRequest request) {
        try {
            // 1) Auth & user
            String email = jwtService.getEmailFromRequest(request);
            if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            User user = userRepository.findByEmail(email);
            if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");

            // 2) Tour + ownership check
            Tour tour = tourRepository.findById(tourId)
                    .orElseThrow(() -> new RuntimeException("Tour not found with id: " + tourId));
            if (tour.getUser() == null || !email.equals(tour.getUser().getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to update this tour");
            }

            // 3) Build prompt (done/undone activities)
            String prompt = buildPoeticBlogPrompt(tour);
            Debug.log("Blog prompt:\n" + prompt);

            // 4) Call Gemini (same pattern as PlanController)
            ObjectNode geminiResponse = callGeminiApiNew(prompt);
            if (geminiResponse == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get response from Gemini");
            }

            JsonNode candidates = geminiResponse.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No candidates in Gemini response");
            }

            JsonNode content = candidates.get(0).get("content");
            if (content == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No content in Gemini response");
            }

            JsonNode parts = content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No parts in Gemini response");
            }

            String blogText = parts.get(0).get("text").asText();
            if (blogText == null || blogText.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Empty text from Gemini");
            }
            blogText = blogText.strip();

            // 5) Save via your EXISTING logic
            BlogDTO dto = new BlogDTO(tourId, blogText);
            return tourService.updateBlog(dto, request); // returns updated User

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate blog: " + e.getMessage());
        }
    }

    // ---------- helpers ----------

    private ObjectNode callGeminiApiNew(String prompt) throws Exception {
        ObjectNode textPart = objectMapper.createObjectNode().put("text", prompt);
        ObjectNode partNode = objectMapper.createObjectNode().set(
                "parts", objectMapper.createArrayNode().add(textPart)
        );

        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.75);
        generationConfig.put("topK", 40);
        generationConfig.put("topP", 0.95);
        generationConfig.put("maxOutputTokens", 2048);

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

    private String buildPoeticBlogPrompt(Tour tour) {
        String title         = safe(tour.getTitle());
        String startLocation = safe(tour.getStartLocation());
        String destination   = safe(tour.getDestination());
        String startDate     = prettyDate(safe(tour.getStartDate()));
        String endDate       = prettyDate(safe(tour.getEndDate()));
        String budget        = safe(tour.getBudget());

        List<Day> days = tour.getDays() == null ? List.of()
                : tour.getDays().stream()
                .sorted(Comparator.comparing(
                        d -> parseLocalDateSafe(d.getDate()),
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < days.size(); i++) {
            Day d = days.get(i);
            String dDate = prettyDate(safe(d.getDate()));
            sb.append("Day ").append(i + 1).append(" (").append(dDate).append(")\n");

            List<Activity> done = d.getActivities() == null ? List.of()
                    : d.getActivities().stream()
                    .filter(a -> "done".equalsIgnoreCase(safe(a.getStatus())))
                    .collect(Collectors.toList());

            List<Activity> pending = d.getActivities() == null ? List.of()
                    : d.getActivities().stream()
                    .filter(a -> !"done".equalsIgnoreCase(safe(a.getStatus())))
                    .collect(Collectors.toList());

            if (done.isEmpty() && pending.isEmpty()) {
                sb.append("  • No activities recorded\n\n");
                continue;
            }
            if (!done.isEmpty()) {
                sb.append("  • Completed:\n");
                for (Activity a : done) {
                    sb.append("    - ").append(safe(a.getDescription())).append("\n");
                }
            }
            if (!pending.isEmpty()) {
                sb.append("  • Not completed:\n");
                for (Activity a : pending) {
                    sb.append("    - ").append(safe(a.getDescription())).append("\n");
                }
            }
            sb.append("\n");
        }

        return String.format("""
                You are a travel blogger AI. Write ONE cohesive blog post in a poetic, fancy yet readable tone (about 350–600 words).
                Start with an evocative title on its own line (no markdown). Use plain text paragraphs only.
                Weave completed activities vividly; mention uncompleted ones as rain-checked dreams or missed chances.
                End with a reflective single line.

                TRIP FACTS
                • Title: %s
                • From: %s
                • Destination: %s
                • Dates: %s to %s
                • Budget: %s

                ACTIVITIES BY DAY
                %s
                """, title, startLocation, destination, startDate, endDate, budget, sb.toString());
    }

    private static String safe(String s) {
        return (s == null || s.isBlank()) ? "-" : s.trim();
    }

    private static LocalDate parseLocalDateSafe(String s) {
        try { return LocalDate.parse(s); } catch (Exception ignored) { return null; }
    }

    private static String prettyDate(String s) {
        LocalDate d = parseLocalDateSafe(s);
        if (d == null) return s == null ? "-" : s;
        return d.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
    }
}
