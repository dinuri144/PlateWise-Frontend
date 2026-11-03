# PlateWise – Frontend

**Smart nutrition, made simple.**

PlateWise is a smart nutrition and meal-planning web application designed to help users make healthier food choices, manage their pantry, track their daily food intake, and achieve their nutrition goals.

This repository contains the frontend application of PlateWise, built with React, TypeScript, and Vite.

## ✨ Features

- **User Authentication** – Register and log in securely.
- **Personalized Onboarding** – Set up personal details, dietary preferences, and nutrition goals.
- **BMI & Nutrition Goals** – View BMI information and personalized calorie and protein targets.
- **Pantry Management** – Manage available food items.
- **Meal & Recipe Management** – Explore recipes and meal suggestions.
- **Food Diary** – Track daily food intake.
- **Shopping List** – Organize grocery shopping.
- **Weekly Insights** – Review nutrition and food-related progress.
- **AI Nutrition Advisor** – Get nutrition-related assistance powered by Google Gemini.

  ## 📸 Application Screenshots

###Login
![Login](Screenshot 2026-11-03 215858.png)

### Dashboard
![Dashboard](localhost_5173_dashboard (1).png)

### Pantry Management
![Pantry](localhost_5173_pantry.png)

### Shopping List
![Shopping List](localhost_5173_shopping-list.png)


## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| React 19 | User interface |
| TypeScript | Type-safe development |
| Vite | Development server and build tool |
| Tailwind CSS 4 | Styling |
| React Router | Client-side navigation |
| Recharts | Data visualization |
| Lucide React | Icons |
| Google Gemini AI | AI-powered nutrition assistance |

## 📁 Project Structure

```text
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── ...
├── package.json
├── tsconfig.json
└── vite.config.ts
```

*The structure may evolve as the application develops.*

## ⚙️ Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/dinuri144/PlateWise-Frontend.git
```

### 2. Navigate to the project folder

```bash
cd PlateWise-Frontend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file if required by the application.

Add the necessary configuration values based on your local backend and Gemini AI setup. Never commit secret API keys.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal to access the application.

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run lint` | Run ESLint checks |
| `npm run preview` | Preview the production build |

## 🔗 Related Repository

**Backend:** [PlateWise-Backend](https://github.com/dinuri144/PlateWise-Backend)

## 👩‍💻 Author

Developed as a personal software development project.

**GitHub:** [@dinuri144](https://github.com/dinuri144)

---

*PlateWise – Making healthier food choices simpler.*
