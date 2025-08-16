package com.example.journeyGenie.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;

/**
 * GET /api/weather?place=Paris&start=2025-08-17&end=2025-08-31
 * Returns:
 * {
 *   "place": "Paris",
 *   "latitude": 48.86,
 *   "longitude": 2.35,
 *   "note": "Forecast shown only up to 2025-08-30 (provider limit).",  // when clamped
 *   "days": [
 *     {
 *       "date": "2025-08-20",
 *       "tMax": 29.1,
 *       "tMin": 19.3,
 *       "precipMm": 3.2,
 *       "precipProb": 55,
 *       "windMaxKph": 28.5,
 *       "gustMaxKph": 44.2,
 *       "uvMax": 6.7,
 *       "weatherCode": 61
 *     }
 *   ]
 * }
 */
@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<?> getWeather(
            @RequestParam String place,
            @RequestParam("start") String startDate,
            @RequestParam("end") String endDate
    ) {
        try {
            // Parse inputs
            LocalDate requestedStart = LocalDate.parse(startDate);
            LocalDate requestedEnd   = LocalDate.parse(endDate);

            // Provider window: forecast ~16 days ahead; also avoid dates earlier than "today"
            LocalDate today   = LocalDate.now(Clock.systemUTC());
            LocalDate maxEnd  = today.plusDays(16);

            LocalDate usedStart = requestedStart.isBefore(today) ? today : requestedStart;
            LocalDate usedEnd   = requestedEnd.isAfter(maxEnd) ? maxEnd : requestedEnd;

            Map<String, Object> out = new HashMap<>();
            StringBuilder note = new StringBuilder();

            if (!usedStart.equals(requestedStart)) {
                note.append("Start clamped to ").append(usedStart).append(". ");
            }
            if (!usedEnd.equals(requestedEnd)) {
                note.append("Forecast shown only up to ").append(usedEnd).append(" (provider limit).");
            }

            if (usedStart.isAfter(usedEnd)) {
                out.put("place", place);
                out.put("note", note.length() > 0 ? note.toString().trim() : "Requested window not available yet.");
                out.put("days", List.of());
                return ResponseEntity.ok(out);
            }

            // 1) Geocode
            String geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name="
                    + URLEncoder.encode(place, StandardCharsets.UTF_8)
                    + "&count=1";

            HttpRequest geoReq = HttpRequest.newBuilder()
                    .uri(URI.create(geoUrl))
                    .GET()
                    .build();

            HttpResponse<String> geoResp = httpClient.send(geoReq, HttpResponse.BodyHandlers.ofString());
            if (geoResp.statusCode() != 200) {
                return ResponseEntity.status(geoResp.statusCode()).body(geoResp.body());
            }
            JsonNode geo = objectMapper.readTree(geoResp.body());
            JsonNode first = geo.path("results").isArray() && geo.path("results").size() > 0
                    ? geo.path("results").get(0) : null;

            if (first == null) {
                return ResponseEntity.status(404).body("Destination not found: " + place);
            }

            double lat = first.path("latitude").asDouble();
            double lon = first.path("longitude").asDouble();
            String resolvedName = first.path("name").asText(place);

            // 2) Forecast (daily)
            String fcUrl = String.format(
                    Locale.ROOT,
                    "https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&start_date=%s&end_date=%s" +
                            "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum," +
                            "precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,weathercode" +
                            "&windspeed_unit=kmh&timezone=auto",
                    lat, lon, usedStart, usedEnd
            );

            HttpRequest fcReq = HttpRequest.newBuilder()
                    .uri(URI.create(fcUrl))
                    .GET()
                    .build();

            HttpResponse<String> fcResp = httpClient.send(fcReq, HttpResponse.BodyHandlers.ofString());
            if (fcResp.statusCode() != 200) {
                return ResponseEntity.status(fcResp.statusCode()).body(fcResp.body());
            }

            JsonNode daily = objectMapper.readTree(fcResp.body()).path("daily");
            int n = daily.path("time").size();
            List<Map<String, Object>> days = new ArrayList<>(n);
            for (int i = 0; i < n; i++) {
                Map<String, Object> row = new HashMap<>();
                row.put("date",         daily.path("time").get(i).asText());
                row.put("tMax",         daily.path("temperature_2m_max").get(i).asDouble());
                row.put("tMin",         daily.path("temperature_2m_min").get(i).asDouble());
                row.put("precipMm",     daily.path("precipitation_sum").get(i).asDouble());
                row.put("precipProb",   daily.path("precipitation_probability_max").get(i).asDouble());
                row.put("windMaxKph",   daily.path("wind_speed_10m_max").get(i).asDouble());
                row.put("gustMaxKph",   daily.path("wind_gusts_10m_max").get(i).asDouble());
                row.put("uvMax",        daily.path("uv_index_max").get(i).asDouble());
                row.put("weatherCode",  daily.path("weathercode").get(i).asInt());
                days.add(row);
            }

            out.put("place", resolvedName);
            out.put("latitude", lat);
            out.put("longitude", lon);
            if (note.length() > 0) out.put("note", note.toString().trim());
            out.put("days", days);

            return ResponseEntity.ok(out);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Weather fetch failed: " + e.getMessage());
        }
    }
}
