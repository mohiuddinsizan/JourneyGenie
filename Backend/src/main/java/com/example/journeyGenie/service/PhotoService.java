package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.PhotoDTO;
import com.example.journeyGenie.entity.Activity;
import com.example.journeyGenie.entity.Day;
import com.example.journeyGenie.entity.Photo;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.ActivityRepository;
import com.example.journeyGenie.repository.DayRepository;
import com.example.journeyGenie.repository.PhotoRepository;
import com.example.journeyGenie.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class PhotoService {
    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private DayRepository dayRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JWTService jwtService;

    public ResponseEntity<?> addPhoto(PhotoDTO photo, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        // Create a new Photo entity from the DTO
        Photo newPhoto = new Photo();
        newPhoto.setLink(photo.getLink());
        Day day = dayRepository.findById(photo.getDayid())
                .orElseThrow(() -> new RuntimeException("Day not found with id: " + photo.getDayid()));
        newPhoto.setDay(day);

        photoRepository.save(newPhoto);
        User existingUser = userRepository.findByEmail(email);
        return ResponseEntity.ok(existingUser);
    }
}
