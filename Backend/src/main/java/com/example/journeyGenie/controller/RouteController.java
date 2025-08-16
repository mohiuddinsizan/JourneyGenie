package com.example.journeyGenie.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.*;
import java.util.*;

@RestController
@RequestMapping("/api/route")
public class RouteController {

    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper om = new ObjectMapper();

    @GetMapping
    public ResponseEntity<?> getRoute(
            @RequestParam String start,   // place name
            @RequestParam String end,     // place name
            @RequestParam(defaultValue = "driving") String mode // driving|walking|cycling
    ) {
        try {
            // 1) Geocode start & end (Open-Meteo Geocoding API — free, no key)
            var startGeo = geocode(start);
            var endGeo   = geocode(end);
            if (startGeo == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Start location not found"));
            }
            if (endGeo == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "End location not found"));
            }

            // 2) Route (OSRM public server – free, no key)
            String profile = switch (mode.toLowerCase()) {
                case "walking" -> "foot";
                case "cycling" -> "bike";
                default -> "car";
            };
            // OSRM expects: /route/v1/{profile}/{lon1},{lat1};{lon2},{lat2}
            String url = String.format(
                    "https://router.project-osrm.org/route/v1/%s/%f,%f;%f,%f?overview=full&geometries=geojson&alternatives=false&steps=false",
                    (profile.equals("car") ? "driving" : profile.equals("foot") ? "walking" : "cycling"),
                    startGeo.lon, startGeo.lat, endGeo.lon, endGeo.lat
            );

            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("error", "Route provider error", "status", resp.statusCode(), "body", resp.body()));
            }

            JsonNode root = om.readTree(resp.body());
            var routes = root.path("routes");
            if (!routes.isArray() || routes.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No route found"));
            }
            JsonNode r0 = routes.get(0);

            double distanceM = r0.path("distance").asDouble(); // meters
            double durationS = r0.path("duration").asDouble(); // seconds

            // geometry.coordinates is [ [lon,lat], ... ]
            var coords = r0.path("geometry").path("coordinates");
            if (!coords.isArray() || coords.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No geometry"));
            }

            // Convert to Leaflet-friendly [lat, lon]
            List<List<Double>> latlngs = new ArrayList<>();
            double minLat =  90, minLon =  180, maxLat = -90, maxLon = -180;
            for (JsonNode p : coords) {
                double lon = p.get(0).asDouble();
                double lat = p.get(1).asDouble();
                latlngs.add(List.of(lat, lon));
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
            }

            ObjectNode out = om.createObjectNode();
            ObjectNode s = om.createObjectNode();
            s.put("name", startGeo.name);
            s.put("lat", startGeo.lat);
            s.put("lon", startGeo.lon);
            ObjectNode e = om.createObjectNode();
            e.put("name", endGeo.name);
            e.put("lat", endGeo.lat);
            e.put("lon", endGeo.lon);

            out.set("start", s);
            out.set("end", e);
            out.put("profile", mode.toLowerCase());
            out.put("distanceKm", Math.round((distanceM / 1000.0) * 10.0) / 10.0);
            out.put("durationMin", Math.round((durationS / 60.0) * 10.0) / 10.0);
            out.set("latlngs", om.valueToTree(latlngs)); // [[lat,lon],...]
            out.set("bounds", om.valueToTree(List.of(List.of(minLat, minLon), List.of(maxLat, maxLon)))); // [[southLat,southLon],[northLat,northLon]]

            return ResponseEntity.ok(out);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to build route", "reason", ex.getMessage()));
        }
    }

    // ————— helpers —————

    private static class Geo {
        final String name; final double lat; final double lon;
        Geo(String name, double lat, double lon){ this.name=name; this.lat=lat; this.lon=lon; }
    }

    private Geo geocode(String place) throws Exception {
        String url = "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + java.net.URLEncoder.encode(place, java.nio.charset.StandardCharsets.UTF_8);
        HttpRequest req = HttpRequest.newBuilder(URI.create(url)).header("Accept", "application/json").GET().build();
        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) return null;
        JsonNode root = om.readTree(resp.body());
        var results = root.path("results");
        if (!results.isArray() || results.isEmpty()) return null;
        JsonNode r0 = results.get(0);
        String name = r0.path("name").asText(place);
        double lat = r0.path("latitude").asDouble();
        double lon = r0.path("longitude").asDouble();
        return new Geo(name, lat, lon);
    }
}
