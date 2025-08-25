package com.example.journeyGenie.service;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.UserRepository;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;


@Getter
@Service
public class TokenService {
    private final int blogGenerationTokenCost = 1;
    private final int tourGenerationTokenCostPerDay = 1;
    private final int videoGenerationTokenCost = 10;
    private final int photoUploadTokenCost = 1;

    @Autowired
    private JWTService jwtService;

    @Autowired
    private UserRepository userRepository;

    public ResponseEntity<?> getUserToken(HttpServletRequest request, HttpServletResponse response) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid request, email not found"));
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        if (user.getToken() == null) {
            user.setToken(0);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of("tokens", user.getToken()));
    }

    public ResponseEntity<?> deductTokens(HttpServletRequest request, int tokensToDeduct) {
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid request, email not found"));
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        if (user.getToken() == null) {
            user.setToken(0);
            userRepository.save(user);
        }

        int currentTokens = user.getToken();
        if (currentTokens >= tokensToDeduct) {
            user.setToken(currentTokens - tokensToDeduct);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("tokens", user.getToken(),
                    "message", tokensToDeduct + " tokens deducted successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Insufficient tokens",
                            "tokensAvailable", currentTokens));
        }
    }

    public ResponseEntity<?> addTokens(HttpServletRequest request, int tokensToAdd) {
        Debug.log("Adding " + tokensToAdd + " tokens to user");
        String email = jwtService.getEmailFromRequest(request);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid request, email not found"));
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        if (user.getToken() == null) {
            user.setToken(0);
            userRepository.save(user);
        }

        int currentTokens = user.getToken();
        user.setToken(currentTokens + tokensToAdd);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "tokens", user.getToken(),
                "message", tokensToAdd + " tokens added successfully"
        ));
    }

}
