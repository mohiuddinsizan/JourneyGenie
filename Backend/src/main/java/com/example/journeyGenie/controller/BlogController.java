package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.BlogService;
import com.example.journeyGenie.service.TokenService; // Import TokenService for checking user tokens
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blog")
public class BlogController {

    @Autowired
    private BlogService blogService;

    @Autowired
    private TokenService tokenService; // Inject TokenService

    // POST /api/blog/generate/{tourId}
    @PostMapping("/generate/{tourId}")
    public ResponseEntity<?> generateBlog(@PathVariable("tourId") Long tourId,
                                          HttpServletRequest request) {
        // Check if the user has at least 5 tokens
        ResponseEntity<?> tokenResponse = tokenService.getUserToken(request, null);
        if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(401).body("User not authenticated");
        }

        // Extract the user's token balance from the response (it should be in a Map)
        Map<String, Object> responseBody = (Map<String, Object>) tokenResponse.getBody();
        Integer userTokens = (Integer) responseBody.get("tokens");  // Extract tokens from the response body
        if (userTokens == null || userTokens < 5) {
            return ResponseEntity.status(400).body("Insufficient tokens. You need at least 5 tokens to generate a blog.");
        }

        // Proceed with generating the blog if the user has enough tokens
        ResponseEntity<?> blogResponse = blogService.generateAndSaveBlog(tourId, request);

        if (blogResponse.getStatusCode().is2xxSuccessful()) {
            // Deduct 5 tokens after the blog is generated successfully
            tokenService.deductTokens(request, 5);  // Deduct 5 tokens for blog generation
        }

        return blogResponse;
    }
}
