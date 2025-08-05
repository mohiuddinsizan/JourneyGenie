# REST API Documentation

## Sign Up
### Request

`POST user/signup` <br>

### Headers

    Content-Type: application/json

### Body

    {
    "email": "pranto@gmail.com",
    "password": "p123",
    "name": "Pranto"
    }


### Response

    {
    "id": 2,
    "name": "Pranto",
    "email": "pranto@gmail.com",
    "password": "$2a$07$31420VAyk.TTv3ICMq1.iucMuAGSGlAIkxhkbfv1e5988Rrr8p6nS"
    }

## Login
### Request

`POST user/login` <br>

### Headers

    Content-Type: application/json

### Body

    {
    "email": "pranto@gmail.com",
    "password": "p123"
    }


### Response Body

    Login successful

### Response cookie

    Set-Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTY5MjQ2NjYwMCwiZXhwIjoxNjkyNDY3MjAwfQ.4b7a
                secure = true
                httponly = true