package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.repository.ActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {

//    @Autowired
//    private ActivityRepository activityRepository;
//
//    @Autowired
//    private JWTService jwtService;
//
//    public ResponseEntity<?> addActivity(Activity activity, HttpServletRequest request) {
//        String email = jwtService.getEmailFromRequest(request);
//        if (email == null) {
//            return ResponseEntity.status(401).body("Unauthorized");
//        }
//        activity.set
//
//        // Return a success response
//        return ResponseEntity.ok(savedActivity);
//    }
}
