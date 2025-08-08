package com.example.journeyGenie.controller;

import com.example.journeyGenie.dto.ActivityDTO;
import com.example.journeyGenie.dto.PhotoDTO;
import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.service.ActivityService;
import com.example.journeyGenie.service.PhotoService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/photo")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    @PostMapping("/add")
    public ResponseEntity<?> addPhoto(@RequestBody PhotoDTO photo, HttpServletRequest request) {
        Debug.log("adding photo: ");
        Debug.log("photo link " + photo.getLink());
        Debug.log("Day id: " + photo.getDayid());
        return photoService.addPhoto(photo, request);
    }
}
