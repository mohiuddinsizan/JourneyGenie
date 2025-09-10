package com.example.journeyGenie.service;

import com.example.journeyGenie.dto.ProductRequestDTO;
import com.example.journeyGenie.util.AppEnv;
import com.example.journeyGenie.util.Debug;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    public Map<String, Object> createCheckoutSession(ProductRequestDTO productRequest, HttpServletRequest request) throws Exception {
        Debug.log("Creating Stripe Checkout Session");
        Debug.log("Product Request - Quantity: " + productRequest.getQuantity() + ", Price: " + productRequest.getPrice());

        Stripe.apiKey = AppEnv.getStripeSecretKey(); // load from env/config

        // Calculate final price after discount and round up
        Long originalPrice = productRequest.getQuantity(); // 1 cent per token
        Long finalPrice = originalPrice;

        if (productRequest.getDiscountApplied() != null && productRequest.getDiscountApplied() && productRequest.getDiscount() != null) {
            double discountAmount = (originalPrice * productRequest.getDiscount()) / 100.0;
            finalPrice = (long) Math.ceil(originalPrice - discountAmount);
        }

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(AppEnv.getFrontendUrl() + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(AppEnv.getFrontendUrl() + "/payment/cancel")
                .putMetadata("quantity", productRequest.getQuantity().toString())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(productRequest.getQuantity())
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(1L) // 1 cent per token (unit price)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Tokens")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();

        // If discount is applied, we need to create a custom line item with the final price
        if (productRequest.getDiscountApplied() != null && productRequest.getDiscountApplied()) {
            params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(AppEnv.getFrontendUrl() + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(AppEnv.getFrontendUrl() + "/payment/cancel")
                    .putMetadata("quantity", productRequest.getQuantity().toString())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("usd")
                                                    .setUnitAmount(finalPrice) // final discounted price
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Tokens (" + productRequest.getDiscount() + "% off)")
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();
        }

        Session session = Session.create(params);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", session.getId()); // frontend uses this for redirect
        return responseData;
    }
}