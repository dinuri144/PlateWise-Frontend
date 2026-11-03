
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { GuestRoute, RequireAuth } from "./components/RouteGuards";

import AppLayout from "./components/AppLayout";

import AuthPage from "./pages/AuthPage";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FoodLog from "./pages/FoodLog";
import Pantry from "./pages/Pantry";
import Recipes from "./pages/Recipes";
import ShoppingList from "./pages/ShoppingList";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Guest routes */}
          <Route
            path="/auth"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={
              <RequireAuth requireComplete={false}>
                <Onboarding />
              </RequireAuth>
            }
          />

          {/* Protected pages with shared sidebar */}
          <Route
            element={
              <RequireAuth requireComplete>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/food-log" element={<FoodLog />} />
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
