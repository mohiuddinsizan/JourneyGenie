package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.VideoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class VideoController {

    @Autowired private VideoService videoService;

    @PostMapping("/tour/{tourId}/video/generate")
    public ResponseEntity<?> generate(@PathVariable Long tourId, HttpServletRequest request) {
        return videoService.generateTourVideo(tourId, request);
    }
}
