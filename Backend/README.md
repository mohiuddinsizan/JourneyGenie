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

## Plan Tour
### Request

`POST /api/plan/preview` <br>

### Headers

    Content-Type: application/json

### Request Body

    {
    "startDate": "2025-09-10",
    "endDate": "2025-09-13",
    "destination": "Khulna",
    "budget": "Low"
    }


### Response Body

    {
    "days": [
    {
    "date": "2025-09-10",
    "title": "Arrival and City Exploration",
    "transportation": "CNG/Auto Rickshaw",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Arrival at Khulna Airport/Bus Station and check-in",
    "timeOfDay": "morning",
    "cost": "$5"
    },
    {
    "name": "Visit Dak Bungalow (historical site)",
    "timeOfDay": "afternoon",
    "cost": "$2"
    },
    {
    "name": "Explore Khulna Divisional Museum",
    "timeOfDay": "afternoon",
    "cost": "$3"
    },
    {
    "name": "Dinner at a local restaurant (Biryani House)",
    "timeOfDay": "evening",
    "cost": "$8"
    }
    ]
    },
    {
    "date": "2025-09-11",
    "title": "Sundarban Exploration (Partial)",
    "transportation": "Local Bus to Mongla, then shared boat",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Travel to Mongla by Bus (early morning)",
    "timeOfDay": "morning",
    "cost": "$4"
    },
    {
    "name": "Hire a shared boat for a short Sundarban tour (Karamjal Eco Park)",
    "timeOfDay": "morning",
    "cost": "$15"
    },
    {
    "name": "Explore Karamjal Eco Park (Sundarban)",
    "timeOfDay": "afternoon",
    "cost": "$5"
    },
    {
    "name": "Return to Khulna by Bus",
    "timeOfDay": "evening",
    "cost": "$4"
    },
    {
    "name": "Dinner at a local restaurant (try local fish)",
    "timeOfDay": "evening",
    "cost": "$10"
    }
    ]
    },
    {
    "date": "2025-09-12",
    "title": "Historical Sites and River Cruise",
    "transportation": "CNG/Auto Rickshaw",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Visit Rabindranath Tagore's father's Kuthibari at Dakshindi",
    "timeOfDay": "morning",
    "cost": "$3"
    },
    {
    "name": "Explore Senhati village and its local market",
    "timeOfDay": "afternoon",
    "cost": "$0"
    },
    {
    "name": "Enjoy a sunset river cruise on the Rupsa River (short trip)",
    "timeOfDay": "afternoon",
    "cost": "$10"
    },
    {
    "name": "Dinner at a budget-friendly restaurant near the river",
    "timeOfDay": "evening",
    "cost": "$7"
    }
    ]
    },
    {
    "date": "2025-09-13",
    "title": "Shopping and Departure",
    "transportation": "CNG/Auto Rickshaw, Taxi to Airport/Bus Station",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Visit New Market for local handicrafts and souvenirs",
    "timeOfDay": "morning",
    "cost": "$5"
    },
    {
    "name": "Explore the local tea stalls and enjoy some tea",
    "timeOfDay": "morning",
    "cost": "$2"
    },
    {
    "name": "Lunch at a local restaurant",
    "timeOfDay": "afternoon",
    "cost": "$8"
    },
    {
    "name": "Departure from Khulna Airport/Bus Station",
    "timeOfDay": "afternoon",
    "cost": "$10"
    }
    ]
    }
    ],
    "destination": "Khulna",
    "startDate": "2025-09-10",
    "endDate": "2025-09-13",
    "budget": "Low"
    }

### Response cookie

    Set-Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTY5MjQ2NjYwMCwiZXhwIjoxNjkyNDY3MjAwfQ.4b7a
                secure = true
                httponly = true


## Commit Tour
### Request

`POST /api/plan/commit` <br>

### Headers

    Content-Type: application/json

### Request Body

    {
    "days": [
    {
    "date": "2025-09-10",
    "title": "Arrival and City Exploration",
    "transportation": "CNG/Auto Rickshaw",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Arrival at Khulna Airport/Bus Station and check-in",
    "timeOfDay": "morning",
    "cost": "$5"
    },
    {
    "name": "Visit Dak Bungalow (historical site)",
    "timeOfDay": "afternoon",
    "cost": "$2"
    },
    {
    "name": "Explore Khulna Divisional Museum",
    "timeOfDay": "afternoon",
    "cost": "$3"
    },
    {
    "name": "Dinner at a local restaurant (Biryani House)",
    "timeOfDay": "evening",
    "cost": "$8"
    }
    ]
    },
    {
    "date": "2025-09-11",
    "title": "Sundarban Exploration (Partial)",
    "transportation": "Local Bus to Mongla, then shared boat",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Travel to Mongla by Bus (early morning)",
    "timeOfDay": "morning",
    "cost": "$4"
    },
    {
    "name": "Hire a shared boat for a short Sundarban tour (Karamjal Eco Park)",
    "timeOfDay": "morning",
    "cost": "$15"
    },
    {
    "name": "Explore Karamjal Eco Park (Sundarban)",
    "timeOfDay": "afternoon",
    "cost": "$5"
    },
    {
    "name": "Return to Khulna by Bus",
    "timeOfDay": "evening",
    "cost": "$4"
    },
    {
    "name": "Dinner at a local restaurant (try local fish)",
    "timeOfDay": "evening",
    "cost": "$10"
    }
    ]
    },
    {
    "date": "2025-09-12",
    "title": "Historical Sites and River Cruise",
    "transportation": "CNG/Auto Rickshaw",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Visit Rabindranath Tagore's father's Kuthibari at Dakshindi",
    "timeOfDay": "morning",
    "cost": "$3"
    },
    {
    "name": "Explore Senhati village and its local market",
    "timeOfDay": "afternoon",
    "cost": "$0"
    },
    {
    "name": "Enjoy a sunset river cruise on the Rupsa River (short trip)",
    "timeOfDay": "afternoon",
    "cost": "$10"
    },
    {
    "name": "Dinner at a budget-friendly restaurant near the river",
    "timeOfDay": "evening",
    "cost": "$7"
    }
    ]
    },
    {
    "date": "2025-09-13",
    "title": "Shopping and Departure",
    "transportation": "CNG/Auto Rickshaw, Taxi to Airport/Bus Station",
    "hotel": "Hotel Royal International (budget-friendly option)",
    "activities": [
    {
    "name": "Visit New Market for local handicrafts and souvenirs",
    "timeOfDay": "morning",
    "cost": "$5"
    },
    {
    "name": "Explore the local tea stalls and enjoy some tea",
    "timeOfDay": "morning",
    "cost": "$2"
    },
    {
    "name": "Lunch at a local restaurant",
    "timeOfDay": "afternoon",
    "cost": "$8"
    },
    {
    "name": "Departure from Khulna Airport/Bus Station",
    "timeOfDay": "afternoon",
    "cost": "$10"
    }
    ]
    }
    ],
    "destination": "Khulna",
    "startDate": "2025-09-10",
    "endDate": "2025-09-13",
    "budget": "Low"
    }

### Response Body

    {
    "id": 1,
    "name": "Pranto",
    "email": "pranto@gmail.com",
    "password": "$2a$07$bVKHjYpSyWXSU9NyMqkpr.83G3NyqO3M92wEn8u7mC/RQ3pBlzu4e",
    "tours": [
    {
    "id": 8,
    "startDate": "2025-09-10",
    "endDate": "2025-09-13",
    "destination": "Khulna",
    "budget": "Low",
    "video": null,
    "days": [
    {
    "id": 23,
    "date": "2025-09-10",
    "activities": [
    {
    "id": 47,
    "description": "Arrival at Khulna Airport/Bus Station and check-in (morning) - Cost: $5",
    "status": "pending"
    },
    {
    "id": 48,
    "description": "Visit Dak Bungalow (historical site) (afternoon) - Cost: $2",
    "status": "pending"
    },
    {
    "id": 49,
    "description": "Explore Khulna Divisional Museum (afternoon) - Cost: $3",
    "status": "pending"
    },
    {
    "id": 50,
    "description": "Dinner at a local restaurant (Biryani House) (evening) - Cost: $8",
    "status": "pending"
    }
    ],
    "photos": []
    },
    {
    "id": 24,
    "date": "2025-09-11",
    "activities": [
    {
    "id": 51,
    "description": "Travel to Mongla by Bus (early morning) (morning) - Cost: $4",
    "status": "pending"
    },
    {
    "id": 52,
    "description": "Hire a shared boat for a short Sundarban tour (Karamjal Eco Park) (morning) - Cost: $15",
    "status": "pending"
    },
    {
    "id": 53,
    "description": "Explore Karamjal Eco Park (Sundarban) (afternoon) - Cost: $5",
    "status": "pending"
    },
    {
    "id": 54,
    "description": "Return to Khulna by Bus (evening) - Cost: $4",
    "status": "pending"
    },
    {
    "id": 55,
    "description": "Dinner at a local restaurant (try local fish) (evening) - Cost: $10",
    "status": "pending"
    }
    ],
    "photos": []
    },
    {
    "id": 25,
    "date": "2025-09-12",
    "activities": [
    {
    "id": 56,
    "description": "Visit Rabindranath Tagore's father's Kuthibari at Dakshindi (morning) - Cost: $3",
    "status": "pending"
    },
    {
    "id": 57,
    "description": "Explore Senhati village and its local market (afternoon) - Cost: $0",
    "status": "pending"
    },
    {
    "id": 58,
    "description": "Enjoy a sunset river cruise on the Rupsa River (short trip) (afternoon) - Cost: $10",
    "status": "pending"
    },
    {
    "id": 59,
    "description": "Dinner at a budget-friendly restaurant near the river (evening) - Cost: $7",
    "status": "pending"
    }
    ],
    "photos": []
    },
    {
    "id": 26,
    "date": "2025-09-13",
    "activities": [
    {
    "id": 60,
    "description": "Visit New Market for local handicrafts and souvenirs (morning) - Cost: $5",
    "status": "pending"
    },
    {
    "id": 61,
    "description": "Explore the local tea stalls and enjoy some tea (morning) - Cost: $2",
    "status": "pending"
    },
    {
    "id": 62,
    "description": "Lunch at a local restaurant (afternoon) - Cost: $8",
    "status": "pending"
    },
    {
    "id": 63,
    "description": "Departure from Khulna Airport/Bus Station (afternoon) - Cost: $10",
    "status": "pending"
    }
    ],
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



## Add activity
### Request

`POST activity/add` <br>

### Headers

    Content-Type: application/json

### Request Body

    {
    "dayid": 23,
    "description": "Swimming with crocos"
    }

### Response Body

    {
    "id": 1,
    "name": "Pranto",
    "email": "pranto@gmail.com",
    "password": "$2a$07$bVKHjYpSyWXSU9NyMqkpr.83G3NyqO3M92wEn8u7mC/RQ3pBlzu4e",
    "tours": [
    {
    "id": 8,
    "startDate": "2025-09-10",
    "endDate": "2025-09-13",
    "destination": "Khulna",
    "budget": "Low",
    "video": null,
    "days": [
    {
    "id": 23,
    "date": "2025-09-10",
    "activities": [
    {
    "id": 47,
    "description": "Arrival at Khulna Airport/Bus Station and check-in (morning) - Cost: $5",
    "status": "pending"
    },
    {
    "id": 48,
    "description": "Visit Dak Bungalow (historical site) (afternoon) - Cost: $2",
    "status": "pending"
    },
    {
    "id": 49,
    "description": "Explore Khulna Divisional Museum (afternoon) - Cost: $3",
    "status": "pending"
    },
    {
    "id": 50,
    "description": "Dinner at a local restaurant (Biryani House) (evening) - Cost: $8",
    "status": "pending"
    },
    {
    "id": 64,
    "description": "Swimming with crocos",
    "status": "done"
    }
    ],
    "photos": []
    },
    {
    "id": 24,
    "date": "2025-09-11",
    "activities": [
    {
    "id": 51,
    "description": "Travel to Mongla by Bus (early morning) (morning) - Cost: $4",
    "status": "pending"
    },
    {
    "id": 52,
    "description": "Hire a shared boat for a short Sundarban tour (Karamjal Eco Park) (morning) - Cost: $15",
    "status": "pending"
    },
    {
    "id": 53,
    "description": "Explore Karamjal Eco Park (Sundarban) (afternoon) - Cost: $5",
    "status": "pending"
    },
    {
    "id": 54,
    "description": "Return to Khulna by Bus (evening) - Cost: $4",
    "status": "pending"
    },
    {
    "id": 55,
    "description": "Dinner at a local restaurant (try local fish) (evening) - Cost: $10",
    "status": "pending"
    }
    ],
    "photos": []
    },
    {
    "id": 25,
    "date": "2025-09-12",
    "activities": [
    {
    "id": 56,
    "description": "Visit Rabindranath Tagore's father's Kuthibari at Dakshindi (morning) - Cost: $3",
    "status": "pending"
    },
    {
    "id": 57,
    "description": "Explore Senhati village and its local market (afternoon) - Cost: $0",
    "status": "pending"
    },
    {
    "id": 58,
    "description": "Enjoy a sunset river cruise on the Rupsa River (short trip) (afternoon) - Cost: $10",
    "status": "pending"
    },
    {
    "id": 59,
    "description": "Dinner at a budget-friendly restaurant near the river (evening) - Cost: $7",
    "status": "pending"
    }
    ],
    "photos": []
    },
    {
    "id": 26,
    "date": "2025-09-13",
    "activities": [
    {
    "id": 60,
    "description": "Visit New Market for local handicrafts and souvenirs (morning) - Cost: $5",
    "status": "pending"
    },
    {
    "id": 61,
    "description": "Explore the local tea stalls and enjoy some tea (morning) - Cost: $2",
    "status": "pending"
    },
    {
    "id": 62,
    "description": "Lunch at a local restaurant (afternoon) - Cost: $8",
    "status": "pending"
    },
    {
    "id": 63,
    "description": "Departure from Khulna Airport/Bus Station (afternoon) - Cost: $10",
    "status": "pending"
    }
    ],
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

## Add photo
### Request

`POST photo/add` <br>

### Headers

    Content-Type: application/json

### Request Body

    {
    "dayid": 9,
    "link": "https://images.pexels.com/photos/33126155/pexels-photo-33126155.jpeg"
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
    "activities": [
    {
    "id": 1,
    "description": "Exploring the city center"
    },
    {
    "id": 2,
    "description": "Exploring the city park"
    }
    ],
    "photos": [
    {
    "id": 1,
    "link": "https://images.pexels.com/photos/33126155/pexels-photo-33126155.jpeg"
    }
    ]
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