package com.example.journeyGenie.controller;

import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.service.UserService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        Debug.log("User signup request: ");
        Debug.log("Name: " + user.getName());
        Debug.log("Email: " + user.getEmail());
        return userService.createUser(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user , HttpServletResponse response) {
        Debug.log("User login request: ");
        Debug.log("Name: " + user.getName());
        Debug.log("Email: " + user.getEmail());
        return userService.loginUser(user,response);
    }

    // endpoint to get username from JWT token
    @GetMapping("/getName")
    public ResponseEntity<?> getUserName(HttpServletRequest request) {
        return userService.getUserName(request);
    }
}
