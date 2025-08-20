package com.example.journeyGenie.authGoogleOAuth;

import com.example.journeyGenie.authJWT.JWTService;
import com.example.journeyGenie.entity.User;
import com.example.journeyGenie.repository.UserRepository;
import com.example.journeyGenie.util.AppEnv;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JWTService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Debug.log("OAuth2 login success ");
        Debug.log("email: " + email);
        Debug.log("name: " + name);

        // Save user if new
        if (userRepository.findByEmail(email) == null) {
            Debug.log("New user detected, saving to database.");
            Debug.log("Saving user with email: " + email + " and name: " + name);
            String defaultPassword = "googleNoPass";
            Debug.log("Saving user to database with default password " + defaultPassword);
            User user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(defaultPassword);
            userRepository.save(user);
        }

        Debug.log("Generating JWT token");

        // Generate JWT
        String jwt = jwtService.generateToken(email);

        Cookie cookie = new Cookie("jwt", jwt);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // Set to true in production
        cookie.setPath("/");
        cookie.setMaxAge(60 * 30); // 30 minutes
        cookie.setAttribute("SameSite", "None"); // set true in production

        response.addCookie(cookie);
        Debug.log("redirecting to "+ AppEnv.getFrontendUrl()+AppEnv.getOauthRedirectPage());
        response.sendRedirect(AppEnv.getFrontendUrl()+ AppEnv.getOauthRedirectPage());
    }
}
