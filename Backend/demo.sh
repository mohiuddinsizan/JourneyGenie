#!/bin/bash

export BACKEND_URL=http://localhost:8080
export FRONTEND_URL=http://localhost:5173

SPRING_DATA_MONGODB_URI="mongodb+srv://demoUser:demoPass@cluster0.demo.mongodb.net/?retryWrites=true&w=majority" \
SPRING_DATA_MONGODB_DATABASE=demoTodoList \
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com" \
GOOGLE_CLIENT_SECRET="your-google-client-secret" \
mvn spring-boot:run
