package com.example.journeyGenie.controller;

import com.example.journeyGenie.service.PaymentService;
import com.example.journeyGenie.dto.ProductRequestDTO;
import com.example.journeyGenie.service.TokenService;
import com.example.journeyGenie.util.AppEnv;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/create-checkout-session")
    public Map<String, Object> createCheckoutSession(@RequestBody ProductRequestDTO productRequest, HttpServletRequest request) throws Exception {
        return paymentService.createCheckoutSession(productRequest, request);
    }

    @GetMapping("/verify-session")
    public Map<String, Object> verifySession(@RequestParam("session_id") String sessionId, HttpServletRequest request) throws Exception {
        Stripe.apiKey = AppEnv.getStripeSecretKey();

        Session session = Session.retrieve(sessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("payment_status", session.getPaymentStatus());

        if ("paid".equals(session.getPaymentStatus())) {
            int quantity = Integer.parseInt(session.getMetadata().get("quantity"));
            // update tokens safely
            tokenService.addTokens(request, quantity);
        }

        return response;
    }

}
