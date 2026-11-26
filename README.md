 # SpendWise – AI Expense Tracker

**SpendWise** is an AI-powered personal expense tracker built using the MERN stack. It helps users manage their income, monthly budgets and expenses while providing AI-powered spending insights.

## Features

- User Registration and Login
- Secure JWT Authentication
- Add, Edit and Delete Expenses
- Monthly Income Management
- Monthly Budget Management
- Expense Search and Filtering
- Monthly Spending Overview
- Interactive Charts and Visualizations
- AI-Powered Expense Insights using Gemini
- Responsive Dashboard UI

## Tech Stack

**Frontend:** React, Vite, CSS, Recharts

**Backend:** Node.js, Express.js

**Database:** MongoDB

**Authentication:** JWT

**AI Integration:** Google Gemini API

## Project Structure

- `src/` – React frontend
- `server/` – Express backend
- `public/` – Public assets

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/ajaymalviya7999aj/SpendWise.git
cd SpendWise
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Never upload your actual `.env` file or API keys to GitHub.

### 5. Run the backend

From the `server` folder:

```bash
npm run dev
```

### 6. Run the frontend

Open another terminal in the project root:

```bash
npm run dev
```

## Author

**Ajay Malviya**

GitHub: https://github.com/ajaymalviya7999aj