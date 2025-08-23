package com.example.journeyGenie.controller;

import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.service.TokenService;
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
    @Autowired
    private TokenService tokenService;

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

    // endpoint to logout user
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request, HttpServletResponse response) {
        Debug.log("User logout request");
        return userService.logoutUser(request,response);
    }

    // endpoint to get user from JWT token
    @GetMapping("/me")
    public ResponseEntity<?> getUser(HttpServletRequest request) {
        Debug.log("Fetching user details from JWT token");
        return userService.getUser(request);
    }

    // endpoint to get username from JWT token
    @GetMapping("/getName")
    public ResponseEntity<?> getUserName(HttpServletRequest request) {
        return userService.getUserName(request);
    }

    // endpoint to get user token
    @GetMapping("/token")
    public ResponseEntity<?> getUserToken(HttpServletRequest request, HttpServletResponse response) {
        Debug.log("Fetching user token from JWT token");
        return tokenService.getUserToken(request, response);
    }

}
