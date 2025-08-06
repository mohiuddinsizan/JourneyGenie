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
    "password": "$2a$07$31420VAyk.TTv3ICMq1.iucMuAGSGlAIkxhkbfv1e5988Rrr8p6nS",
    "tours": []
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

    {
    "id": 2,
    "name": "Pranto",
    "email": "pranto@gmail.com",
    "password": "$2a$07$31420VAyk.TTv3ICMq1.iucMuAGSGlAIkxhkbfv1e5988Rrr8p6nS",
    "tours": []
    }

### Response cookie

    Set-Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTY5MjQ2NjYwMCwiZXhwIjoxNjkyNDY3MjAwfQ.4b7a
                secure = true
                httponly = true

## get Name
### Request

`POST user/getName` <br>

### Headers

    Content-Type: application/json

### Response Body

    {
    "name": "Pranto"
    }

### Response cookie

    Set-Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTY5MjQ2NjYwMCwiZXhwIjoxNjkyNDY3MjAwfQ.4b7a
                secure = true
                httponly = true

## Create Tour
### Request

`POST tour/create` <br>

### Headers

    Content-Type: application/json

### Request Body

    {
    "startDate": "2025-08-10",
    "endDate": "2025-08-20",
    "destination": "Las Vegas",
    "budget": 5000
    }

### Response Body

    {
    "id": 2,
    "name": "Rakib",
    "email": "rakib@gmail.com",
    "password": "$2a$07$UD2LmHjVoNSNi7zXlqDPmejmULDyEV4gRDCs14px8lyy6YTxPQ2sa",
    "tours": [
    {
    "id": 5,
    "startDate": "2025-08-10",
    "endDate": "2025-08-20",
    "destination": "Las Vegas",
    "budget": 5000,
    "video": null,
    "days": [
    {
    "id": 1,
    "date": "2025-08-10",
    "activities": [],
    "photos": []
    },
    {
    "id": 2,
    "date": "2025-08-11",
    "activities": [],
    "photos": []
    },
    {
    "id": 3,
    "date": "2025-08-12",
    "activities": [],
    "photos": []
    },
    {
    "id": 4,
    "date": "2025-08-13",
    "activities": [],
    "photos": []
    },
    {
    "id": 5,
    "date": "2025-08-14",
    "activities": [],
    "photos": []
    },
    {
    "id": 6,
    "date": "2025-08-15",
    "activities": [],
    "photos": []
    },
    {
    "id": 7,
    "date": "2025-08-16",
    "activities": [],
    "photos": []
    },
    {
    "id": 8,
    "date": "2025-08-17",
    "activities": [],
    "photos": []
    },
    {
    "id": 9,
    "date": "2025-08-18",
    "activities": [],
    "photos": []
    },
    {
    "id": 10,
    "date": "2025-08-19",
    "activities": [],
    "photos": []
    },
    {
    "id": 11,
    "date": "2025-08-20",
    "activities": [],
    "photos": []
    }
    ]
    }
    ]
    }

### Response cookie

    Set-Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTY5MjQ2NjYwMCwiZXhwIjoxNjkyNDY3MjAwfQ.4b7a
                secure = true
                httponly = true