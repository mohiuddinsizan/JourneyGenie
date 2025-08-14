package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.Tour;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.ArrayList;
import java.util.Map;


@Service
public class UserService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JWTService jwtService;

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder(7);


    public ResponseEntity<?> createUser(User user) {
        System.out.println("inside the user service , create user");
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        User existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser != null) {
            System.out.println("User with this email already exists");
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("User with this email already exists");
        } else {
            user.setTours(new ArrayList<Tour>());
            userRepository.save(user);
            System.out.println("User created successfully");
            return ResponseEntity.ok(user);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));

        if (authentication.isAuthenticated()) {
            String token = jwtService.generateToken(user.getEmail());

            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(true); // set ture in production , must be set for same-site = None to work
            cookie.setPath("/");
            cookie.setMaxAge(60*30); // 30 minute
            cookie.setAttribute("SameSite","None"); // set true in production , Set SameSite attribute to None
            response.addCookie(cookie);

            // find user from database
            User existingUser = userRepository.findByEmail(user.getEmail());
            return ResponseEntity.ok(existingUser);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login failed");
        }
    }

    public ResponseEntity<?> getUserName(HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email != null) {
            User user = userRepository.findByEmail(email);
            if (user != null) {
                return ResponseEntity.ok(Map.of("name", user.getName()));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }

    public ResponseEntity<?> getUser(HttpServletRequest request) {
        String email = jwtService.getEmailFromRequest(request);
        if (email != null) {
            User user = userRepository.findByEmail(email);
            if (user != null) {
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }
}
