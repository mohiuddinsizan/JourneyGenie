package com.example.journeyGenie.authJWT;

import com.example.journeyGenie.authUsernamePassword.MyUserDetailsService;
import com.example.journeyGenie.util.Debug;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.metadata.Db2CallMetaDataProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JWTFilter extends OncePerRequestFilter {

    @Autowired
    private JWTService jwtService;

    @Autowired
    ApplicationContext context;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        Debug.log("JWT filter invoked for request: " + request.getRequestURI());

        String token = null;
        String username = null;

        try {
            // 1. Extract JWT token from cookies
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if (cookie.getName().equals("jwt")) {
                        token = cookie.getValue();
                        Debug.log("JWT token found in cookies: " + token);
                        break;
                    }
                }
            }

            // 2. Extract username and validate
            if (token != null) {
                username = jwtService.extractUserName(token);
                Debug.log("Extracted username from token: " + username);
            }

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = context.getBean(MyUserDetailsService.class).loadUserByUsername(username);

                if (jwtService.validateToken(token, userDetails)) {
                    // 3. Set Authentication in context
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // 4. Generate new token and update cookie
                    String newToken = jwtService.generateToken(username);
                    Cookie newCookie = new Cookie("jwt", newToken);
                    newCookie.setHttpOnly(true);
                    newCookie.setSecure(true); // Set to true in production
                    newCookie.setPath("/");
                    newCookie.setMaxAge(60 * 30); // 30 minutes
                    newCookie.setAttribute("SameSite","None"); // set true in production
                    response.addCookie(newCookie);

                    Debug.log("JWT token validated and new token set in cookie: " + newToken);

                    // 5. Continue filter chain
                    filterChain.doFilter(request, response);
                    return;
                }
            }

            // If token is invalid or missing, respond with 401
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{ \"error\": \"Unauthorized: Missing or invalid token\" }");

            Debug.exception("JWTFilter : unauthorized - Missing or invalid token");

        } catch (Exception e) {
            Debug.exception("JWTFilter : unauthorized");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{ \"error\": \"" + e.getMessage() + "\" }");
        }
    }


    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/user/login") || path.startsWith("/user/signup") || path.startsWith("/test-no-auth");
    }


}
