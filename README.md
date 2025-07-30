# 🚖 Ride-Sharing Microservices System

A modular and scalable ride-sharing platform built with **Node.js**, **Express**, and **PostgreSQL**, organized into independent microservices.

## 🧱 Architecture Overview

This project uses a microservices architecture with the following components:

- **Auth Service** (`auth-service`): Handles authentication (JWT + OTP via Vonage)
- **User Service** (`user-service`): Manages user profiles and roles
- **Driver Service** (`driver-service`): Manages driver profiles and availability
- **Trip Service** (`trip-service`): Handles trip creation, assignment, and completion
- **API Gateway** (`api-gateway`): Routes external requests to internal services

---

## 🧰 Technologies Used

| Component         | Tech Stack                                 |
|-------------------|---------------------------------------------|
| Backend           | Node.js, Express.js                         |
| Database          | PostgreSQL                                  |
| Auth              | JWT, bcrypt, Vonage (OTP SMS)               |
| Gateway Routing   | http-proxy-middleware                       |
| Communication     | REST via Fetch                              |

---

## 📁 Directory Structure

```
MicroServices/
├── api-gateway/
├── auth-service/
├── driver-service/
├── trip-service/
├── user-service/
└── README.md
```

---

## ⚙️ Environment Configuration

Each service has a `.env` file. Example for `auth-service`:

```env
PORT=4001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=userdb
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h
VONAGE_API_KEY=your_key
VONAGE_API_SECRET=your_secret
DRIVER_SERVICE_URL=http://localhost:8000/api/drivers
```

---

## 🚀 Running the Project

### 1. Clone the Repo

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd MicroServices
```

### 2. Install Dependencies

In each service folder:

```bash
cd auth-service
npm install
```

Repeat for all services and the API gateway.

### 3. Start All Services

In separate terminals:

```bash
# Example
cd auth-service && node server.js
cd driver-service && node server.js
cd trip-service && node server.js
cd user-service && node server.js
cd api-gateway && node server.js
```

---

## 🔐 Authentication Flow

1. **Signup** via phone number and password
2. **Login** using password or OTP
3. **JWT token** issued and used for protected routes

---

## 🧪 Sample API Calls

### ➤ Login

```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "phone": "999",
  "password": "111"
}
```

### ➤ Create Trip

```http
POST http://localhost:8000/api/trip
Authorization: Bearer <token>
```

### ➤ Assign Trip

```http
PUT http://localhost:8000/api/trip/:tripId/assign
Authorization: Bearer <admin_token>
```

---

## ✅ Features

- Microservices architecture
- Role-based access (`admin`, `user`, `driver`)
- Secure authentication with OTP and JWT
- Trip and driver management
- Scalable and easily extendable

---

## 🛡️ Security

- JWT middleware for protected routes
- Role-based authorization
- OTP validation via Vonage API

---

## 📬 Contact

For issues or collaboration: [albooss.jo2@gmail.com]

---
