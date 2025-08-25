package com.example.journeyGenie.util;

import io.github.cdimascio.dotenv.Dotenv;

public class AppEnv {
    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    public static boolean isProduction() {
        return "true".equalsIgnoreCase(dotenv.get("PRODUCTION"));
    }

    public static String getTokenSecret() {
        return dotenv.get("TOKEN_SECRET");
    }

    public static int getTokenValidityMinutes() {
        String value = dotenv.get("TOKEN_VALIDITY_MINUTES");
        if (value == null || value.isEmpty()) {
            Debug.log("TOKEN_VALIDITY_MINUTES not set, defaulting to 60 minutes");
            return 60; // Default to 60 minutes if not set
        }
        try {
            Debug.log("TOKEN_VALIDITY_MINUTES value: " + value);
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            System.err.println("Invalid TOKEN_VALIDITY_MINUTES value, defaulting to 60 minutes");
            return 60; // Default to 60 minutes if parsing fails
        }
    }

    public static boolean isTokenRefreshEnabled() {
        return "true".equalsIgnoreCase(dotenv.get("TOKEN_REFRESH_ENABLED"));
    }

    public static String getOauthRedirectPage() {
        return dotenv.get("OAUTH_REDIRECT_PAGE");
    }

    public static String getFrontendUrl() {
        return dotenv.get("FRONTEND_URL");
    }

    public static String getBackendUrl() {
        return dotenv.get("BACKEND_URL");
    }

    public static String getGEMINI_API() {
        return dotenv.get("GEMINI_API_KEY");
    }

    public static String getCloudinary_API(){return dotenv.get("CLOUDINARY_URL");}

    public static String getCloudinaryName(){return dotenv.get("CLOUD_NAME");}
}
