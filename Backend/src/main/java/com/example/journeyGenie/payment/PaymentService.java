package com.example.journeyGenie.payment;

import com.example.journeyGenie.util.AppEnv;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    public Map<String, Object> createCheckoutSession(ProductRequest productRequest, HttpServletRequest request) throws Exception {
        Stripe.apiKey = AppEnv.getStripeSecretKey(); // load from env/config

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
                                                .setUnitAmount(productRequest.getPrice()) // amount in cents
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

        Session session = Session.create(params);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", session.getId()); // frontend uses this for redirect
        return responseData;
    }
}
