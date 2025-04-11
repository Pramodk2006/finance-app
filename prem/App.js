import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AIBudget from "./components/AIBudget";
import ChatBot from './components/ChatBot';

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import { BudgetProvider } from "./context/BudgetContext";
import { AIProvider } from "./context/AIContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navigation from "./components/Navigation";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

// Protected Route component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <TransactionProvider>
          <BudgetProvider>
            <AIProvider>
              <Router>
                <Header />
                <main>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes */}
                    <Route
                      path="/"
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <PrivateRoute>
                          <Transactions />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/budgets"
                      element={
                        <PrivateRoute>
                          <Budgets />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <PrivateRoute>
                          <Analytics />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/ai-budget"
                      element={
                        <PrivateRoute>
                          <AIBudget />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
                <ChatBot />
              </Router>
            </AIProvider>
          </BudgetProvider>
        </TransactionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
