package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.PhotoService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/photo")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    @PostMapping(value = "/upload")  // Remove the consumes constraint
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam("dayid") Long dayid,
                                    HttpServletRequest request) {

        Debug.log("=== PHOTO UPLOAD REQUEST ===");
        Debug.log("Day ID: " + dayid);
        Debug.log("File name: " + (file != null ? file.getOriginalFilename() : "null"));
        Debug.log("File size: " + (file != null ? file.getSize() + " bytes" : "null"));
        Debug.log("Content type: " + (file != null ? file.getContentType() : "null"));

        return photoService.upload(file, dayid, request);
    }
}