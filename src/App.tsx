import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Events from "./pages/Events";
import Menu from "./pages/Menu";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Reservations from "./pages/Reservations";
import Loyalty from "./pages/Loyalty";
import PrivacyPolicy from "./components/gdpr/PrivacyPolicy";
import PrivacyDashboard from "./components/gdpr/PrivacyDashboard";
import Impressum from "./components/gdpr/Impressum";
import AGB from "./components/gdpr/AGB";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import SocialBar from "./components/common/SocialBar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PerformanceMonitor from "./components/common/PerformanceMonitor";
import AdminSetupButton from "./components/common/AdminSetupButton";
import LivePopup from "./components/common/LivePopup";
import OfflineIndicator from "./components/common/OfflineIndicator";
import ErrorBoundary from "./components/common/ErrorBoundary";
import SessionActivityTracker from "./components/common/SessionActivityTracker";
import CookieConsentBanner from "./components/gdpr/CookieConsentBanner";
import "./utils/eventNotifications"; // Import to start notification manager
import { autoInitializeReservationData } from "./utils/initializeReservationData";
import { useAuthStore } from "./stores/authStore";

function App() {
  const { initializeFromCookie } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from cookies immediately
    initializeFromCookie();

    // Initialize reservation data on app start
    autoInitializeReservationData();
  }, [initializeFromCookie]);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen bg-royal-charcoal">
              <Header />
              <SocialBar />
              <OfflineIndicator />
              <main className="flex-grow">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/reservations" element={<Reservations />} />
                    <Route path="/loyalty" element={<Loyalty />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/impressum" element={<Impressum />} />
                    <Route path="/agb" element={<AGB />} />
                    <Route
                      path="/privacy-dashboard"
                      element={
                        <ProtectedRoute requireAuth={true} redirectTo="/auth">
                          <PrivacyDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/auth"
                      element={
                        <ProtectedRoute requireAuth={false} redirectTo="/">
                          <Auth />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute
                          requireAuth={true}
                          requireRole="admin"
                          redirectTo="/auth"
                        >
                          <Admin />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer />
              <LivePopup />
              <AdminSetupButton />
              <PerformanceMonitor />
              <SessionActivityTracker />
              <CookieConsentBanner />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1a1b23",
                    color: "#f7f3e3",
                    border: "1px solid #d4af37",
                  },
                }}
              />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
