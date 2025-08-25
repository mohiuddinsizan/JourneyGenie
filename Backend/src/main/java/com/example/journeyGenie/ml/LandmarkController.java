//package com.example.journeyGenie.ml;
//
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//
//@RestController
//@RequestMapping("/ml")
//public class LandmarkController {
//
//    private final LandmarkService service;
//
//    public LandmarkController(LandmarkService service) {
//        this.service = service;
//    }
//
//    @PostMapping("/landmark")
//    public String detect(@RequestParam("file") MultipartFile file) throws Exception {
//        return service.detectLandmark(file);
//    }
//}
