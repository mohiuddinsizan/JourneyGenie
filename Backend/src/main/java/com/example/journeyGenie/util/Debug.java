package com.example.journeyGenie.util;

public class Debug {
    public static void log(String message) {
        System.out.println("[DEBUG] " + message);
    }

    public static void exception(String message) {
        System.err.println("[EXCEPTION] " + message);
    }
}
