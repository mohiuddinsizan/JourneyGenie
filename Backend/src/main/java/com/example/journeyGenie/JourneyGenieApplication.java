package com.example.journeyGenie;

import com.example.journeyGenie.util.AppEnv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class JourneyGenieApplication {

	public static void main(String[] args) {

		SpringApplication.run(JourneyGenieApplication.class, args);

		System.out.println("JourneyGenie Application Started Successfully!");
		System.out.println("Testing environment variables");
		System.out.println("FRONTEND_URL: " + AppEnv.getFrontendUrl());
		System.out.println("BACKEND_URL: " + AppEnv.getBackendUrl());
		System.out.println("API "+ AppEnv.getGEMINI_API());
	}

	// api for demonstration purpose (no usage)
	@RequestMapping("/test-no-auth")
	public String hello() {
		return "Hello, journeyGenie!";
	}
}

