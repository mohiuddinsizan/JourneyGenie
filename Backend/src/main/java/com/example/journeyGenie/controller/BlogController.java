package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.BlogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blog")
public class BlogController {

    @Autowired
    private BlogService blogService;

    // POST /api/blog/generate/{tourId}
    @PostMapping("/generate/{tourId}")
    public ResponseEntity<?> generateBlog(@PathVariable("tourId") Long tourId,
                                          HttpServletRequest request) {
        return blogService.generateAndSaveBlog(tourId, request);
    }
}
