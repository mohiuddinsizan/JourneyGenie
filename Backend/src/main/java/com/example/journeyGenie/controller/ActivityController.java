package com.example.journeyGenie.controller;

import com.example.journeyGenie.dto.ActivityDTO;
import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.service.ActivityService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/activity")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @PostMapping("/add")
    public ResponseEntity<?> addActivity(@RequestBody ActivityDTO activity, HttpServletRequest request) {
        Debug.log("Creating activity: ");
        Debug.log("Activity description: " + activity.getDescription());
        Debug.log("Day id: " + activity.getDayid());
        return activityService.addActivity(activity, request);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeByClone(@PathVariable("id") Long id, HttpServletRequest request) {
        return activityService.completeByClone(id, request);
    }

}
