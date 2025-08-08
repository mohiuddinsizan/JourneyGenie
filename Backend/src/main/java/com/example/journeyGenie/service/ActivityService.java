package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.ActivityDTO;
import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.entity.Day;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.ActivityRepository;
import com.example.journeyGenie.repository.DayRepository;
import com.example.journeyGenie.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DayRepository dayRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JWTService jwtService;

    public ResponseEntity<?> addActivity(ActivityDTO activity, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        // Create a new Activity entity from the DTO
        Activity newActivity = new Activity();
        newActivity.setDescription(activity.getDescription());
        Day day = dayRepository.findById(activity.getDayid())
                .orElseThrow(() -> new RuntimeException("Day not found with id: " + activity.getDayid()));
        newActivity.setDay(day);

        activityRepository.save(newActivity);
        User existingUser = userRepository.findByEmail(email);
        return ResponseEntity.ok(existingUser);
    }
}
