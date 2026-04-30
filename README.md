# 🏥 Hospital OT Scheduling Web System

A comprehensive, full-stack Hospital Management and OT Scheduling System built with a **React** frontend, a **Node.js** API server, and an intelligent **C-based AI Scheduling Engine**.

## 🚀 Features

*   **👨‍⚕️ Doctor Management:** View and manage surgeon details including position, specialization, experience, worked hours, and salary calculation.
*   **👩‍⚕️ Nurse Management:** Manage nurse staff, track OT duty hours, and automate payroll.
*   **🏥 OT Management:** Track and maintain Operation Theaters. Easily toggle OT maintenance status, which triggers an automated backend re-allocation of affected surgeries to other available OTs.
*   **🧑 Patient / Surgery Data:** Add new surgeries by defining Patient ID, required equipment, duration, and urgency level (Emergency, Major, Minor). The system intelligently auto-allocates an available doctor and the required number of nurses.
*   **🧠 AI Preference List (Core Logic):** The C-backend utilizes a custom algorithm to calculate a **Priority Score** for each surgery based on:
    *   Urgency (Emergency = 100, Major = 50, Minor = 10)
    *   Short Duration Bonus
    *   Resource Availability Score
    *   Outputs a meticulously ordered schedule complete with priority reasoning for hospital administration.

## 💻 Technology Stack

*   **Frontend:** React, Vite, Lucide React (Icons), jsPDF (Report Generation)
*   **Backend API:** Node.js, Express.js
*   **Core Scheduling Engine:** C (Compiled automatically by Node.js for high-speed algorithmic sorting)

## 🛠️ How to Run Locally

### 1. Start the Backend API & C Engine
```bash
cd api
npm install
npm start
```
*(Note: If you are on Windows, ensure you run this in an environment where your Device Guard policy allows `.exe` compilation, or deploy directly to Linux-based cloud hosting like Render).*

### 2. Start the Frontend UI
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://localhost:5173`.

## 🌐 Deployment

This project is fully structured for modern cloud deployment:
*   **Frontend (UI):** Ready to be deployed on **Vercel** as a Vite project.
*   **Backend (API + Engine):** Ready to be deployed on **Render** as a Node Web Service. The included `package.json` contains a `postinstall` script (`gcc ../backend/*.c -o ../backend/hospital_backend`) which automatically compiles the C engine on Render's Linux servers!

---
*Built for efficient hospital resource management.*
FRONTEND : https://hospital-management-system-frzx.vercel.app/
BACKEND: https://hospital-management-system-my4q.onrender.com
