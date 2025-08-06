package com.example.journeyGenie.controller;

import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.service.ActivityService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/activity")
public class ActivityController {

//    @Autowired
//    private ActivityService activityService;
//
//    @PostMapping("/add")
//    public ResponseEntity<?> addActivity(@RequestBody Activity activity, HttpServletRequest request) {
//        Debug.log("Creating tour: ");
//        Debug.log("Activity description: " + activity.getDescription());
//        Debug.log("Activity date: " + activity.getDay().getDate());
//        return activityService.addActivity(activity, request);
//    }
}
