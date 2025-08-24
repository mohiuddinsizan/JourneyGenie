package com.example.journeyGenie.controller;

import com.example.journeyGenie.dto.CouponRequestDTO;
import com.example.journeyGenie.service.TokenService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/token")
public class TokenController {

    @Autowired
    private TokenService tokenService;

    // Get user token balance
    @GetMapping("/balance")
    public ResponseEntity<?> getUserTokens(HttpServletRequest request, HttpServletResponse response) {
        Debug.log("Retrieving token balance for user");
        return tokenService.getUserToken(request, response);
    }

    // Deduct tokens (e.g., when user performs an action like generating a blog)
    @PostMapping("/deduct")
    public ResponseEntity<?> deductTokens(@RequestParam("tokens") int tokensToDeduct, HttpServletRequest request) {
        Debug.log("Deducting tokens for user");
        Debug.log("Tokens to Deduct: " + tokensToDeduct);
        return tokenService.deductTokens(request, tokensToDeduct);
    }

    // Add tokens (Normal purchase or coupon application)
    @PostMapping("/add")
    public ResponseEntity<?> addTokens(@RequestParam("tokens") int tokensToAdd, HttpServletRequest request) {
        Debug.log("Adding tokens for user");
        Debug.log("Tokens to Add: " + tokensToAdd);
        return tokenService.addTokens(request, tokensToAdd);
    }

    // Apply a coupon for token bonus (Received as JSON body)
    @PostMapping("/apply-coupon")
    public ResponseEntity<?> applyCoupon(@RequestBody CouponRequestDTO couponRequestDTO, HttpServletRequest request) {
        Debug.log("Applying coupon for user");
        Debug.log("Coupon Code received: " + couponRequestDTO.getCouponCode());

        if ("sizan".equalsIgnoreCase(couponRequestDTO.getCouponCode())) {
            Debug.log("Coupon 'sizan' applied, awarding 10 tokens");
            return tokenService.addTokens(request, 10);  // Award 10 tokens for the coupon "sizan"
        } else {
            Debug.log("Invalid coupon code entered: " + couponRequestDTO.getCouponCode());
            return ResponseEntity.badRequest().body("Invalid coupon code.");
        }
    }
}
