# Yebichu Barber Shop App

A premium, full-stack mobile application built for modern barber shops. This application features role-based access control (Admin, Barber, Customer), real-time booking, payment integration, and a dedicated business intelligence dashboard.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Distinct interfaces and capabilities for Customers, Barbers, and Admins. Hardened at the navigation stack and component levels.
*   **Customer Portal:** Browse services, book appointments, view history, and process payments securely.
*   **Barber Portal:** Dedicated dashboard to view daily schedules and manage assigned appointments.
*   **Admin Dashboard:** Comprehensive business intelligence, analytics (revenue, volume), and service/package management.
*   **Premium Design:** Built with React Native and Expo, featuring a sleek dark mode, vibrant gradients, and smooth animations using Reanimated.
*   **Robust Backend:** Node.js/Express API with secure JSON Web Token (JWT) authentication and robust error handling.
*   **Automated Testing:** Integration tests (Jest/Supertest) for the backend and component tests (Jest/Testing Library) for the frontend.

## 🛠️ Technology Stack

### Frontend
*   React Native (Expo SDK 55)
*   React Navigation (Bottom Tabs, Stack)
*   Axios for API communication
*   Lucide React Native for iconography
*   React Native Reanimated & Gesture Handler
*   Jest & React Native Testing Library (RNTL)

### Backend
*   Node.js & Express.js
*   Firebase Admin SDK (Firestore Database & Authentication integration)
*   JSON Web Tokens (JWT) for secure session management
*   Jest & Supertest for API Integration Testing

## 📦 Project Structure

The repository is divided into two main directories:

*   `/frontend`: Contains the React Native Expo application.
*   `/backend`: Contains the Node.js Express server.

## 🚦 Getting Started

### Prerequisites
*   Node.js (v18 or newer recommended)
*   npm or yarn
*   Expo CLI

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    *   Create a `.env` file in the `backend` directory based on required keys (e.g., `PORT=5000`, `JWT_SECRET`, etc.).
    *   Ensure your `firebase-service-account.json` is placed in `backend/config/` (Do not commit this file).
4.  Start the development server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure API Endpoint:
    *   Update `API_BASE_URL` in `frontend/src/services/api.js` to point to your local backend IP address (e.g., `http://192.168.1.xxx:5000/api`). Do not use `localhost` if testing on a physical device.
4.  Start the Expo development server:
    ```bash
    npx expo start
    ```

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔒 Security Notes
*   Environment variables (`.env`) and sensitive configuration files (like Firebase service accounts) are explicitly ignored in `.gitignore`.
*   Authentication is enforced via middleware on protected routes.
*   Frontend navigation guards prevent unauthorized access to role-specific screens.
