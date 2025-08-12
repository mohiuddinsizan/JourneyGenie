package com.example.journeyGenie.util;

import io.github.cdimascio.dotenv.Dotenv;

public class AppEnv {
    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    public static String getFrontendUrl() {
        return dotenv.get("FRONTEND_URL");
    }

    public static String getBackendUrl() {
        return dotenv.get("BACKEND_URL");
    }

    public static String getGEMINI_API() {
        return dotenv.get("GEMINI_API_KEY");
    }
}
