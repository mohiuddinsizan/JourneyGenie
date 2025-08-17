package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.dto.BlogDTO;
import com.example.journeyGenie.dto.TitleDTO;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.TourRepository;
import com.example.journeyGenie.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TourService {
    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DayService dayService;

    @Autowired
    private JWTService jwtService;

    public ResponseEntity<?> createTour(Tour tour, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User existingUser = userRepository.findByEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        tour.setUser(existingUser);
        tourRepository.save(tour);
        existingUser.getTours().add(tour);
        userRepository.save(existingUser);
        return ResponseEntity.ok(existingUser);
    }

    public ResponseEntity<?> updateTitle(TitleDTO titleDTO, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User existingUser = userRepository.findByEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        Tour tour = tourRepository.findById(titleDTO.getTourid())
                .orElseThrow(() -> new RuntimeException("Tour not found with id: " + titleDTO.getTourid()));

        if (!tour.getUser().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to update this tour");
        }

        tour.setTitle(titleDTO.getTitle());
        tourRepository.save(tour);
        return ResponseEntity.ok(existingUser);
    }

    public ResponseEntity<?> updateBlog(BlogDTO blogDto, HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User existingUser = userRepository.findByEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        Tour tour = tourRepository.findById(blogDto.getTourid())
                .orElseThrow(() -> new RuntimeException("Tour not found with id: " + blogDto.getTourid()));

        if (!tour.getUser().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to update this tour");
        }

        tour.setBlog(blogDto.getBlog());
        tourRepository.save(tour);
        return ResponseEntity.ok(existingUser);
    }
}
