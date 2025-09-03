import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RoyalShishaLogo from "../../assets/Logo.jpeg";
import {
  Menu,
  X,
  User,
  LogOut,
  Crown,
  ChevronDown,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useCart } from "../../contexts/CartContext";
import { usePermissions } from "../../hooks/usePermissions";
import Cart from "../common/Cart";
import toast from "react-hot-toast";

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  // Use the new permissions hook for fast access
  const { isAuthenticated, userRole, canAccessAdmin, getSessionInfo } =
    usePermissions();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debug: Log session info occasionally
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🍪 Header session info:", getSessionInfo());
    }
  }, [isAuthenticated, getSessionInfo]);

  const handleLogout = async () => {
    try {
      logout();
      toast.success("Successfully logged out!");
      setIsUserMenuOpen(false);
      navigate("/");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const navLinks = [
    { name: "Startseite", path: "/" },
    { name: "Menü", path: "/menu" },
    { name: "Reservierungen", path: "/reservations" },
    { name: "Stempelpass", path: "/loyalty" },
    { name: "Events", path: "/events" },
    { name: "Kontakt", path: "/contact" },
  ];

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-royal-charcoal-dark shadow-lg"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex-shrink-0">
              <img
                draggable={false}
                className="h-10 w-10 md:h-16 md:w-16 rounded-full border border-royal-gold object-cover"
                src={RoyalShishaLogo}
                alt="Royal Shisha Logo"
              />
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `royal-nav-link text-lg font-medium transition-all duration-300 hover:text-royal-gold ${
                      isActive ? "text-royal-gold" : "text-royal-cream"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Cart and User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Button */}
              <motion.button
                onClick={handleCartClick}
                className="relative bg-royal-gradient-gold text-royal-charcoal p-3 rounded-lg royal-glow hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="w-5 h-5" />

                {/* Item Count Badge */}
                {getTotalItems() > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    {getTotalItems() > 99 ? "99+" : getTotalItems()}
                  </motion.div>
                )}
              </motion.button>

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 bg-royal-gradient-gold text-royal-charcoal px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 royal-hover-glow"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Crown className="w-4 h-4" />
                    <span className="font-medium">
                      {user?.name || "Royal Member"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-royal-charcoal-dark border border-royal-gold/30 rounded-lg shadow-xl royal-glow"
                      >
                        <div className="p-4">
                          <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-royal-gold/20">
                            <div className="w-10 h-10 bg-royal-gradient-gold rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-royal-charcoal" />
                            </div>
                            <div>
                              <p className="text-royal-cream font-medium">
                                {user?.name}
                              </p>
                              <p className="text-royal-cream-light text-sm">
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-royal-cream-light text-sm">
                              <Crown className="w-4 h-4 text-royal-gold" />
                              <span>Role: {userRole || "Loading..."}</span>
                            </div>

                            {canAccessAdmin() && (
                              <Link
                                to="/admin"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-royal-cream hover:text-royal-gold hover:bg-royal-charcoal rounded-md transition-all duration-200"
                              >
                                <Shield className="w-4 h-4" />
                                <span>Admin-Bereich</span>
                              </Link>
                            )}

                            <motion.button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-royal-cream hover:text-royal-gold hover:bg-royal-charcoal rounded-md transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Abmelden</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/auth"
                    className="bg-royal-gradient-gold text-royal-charcoal px-6 py-2 rounded-lg font-semibold royal-glow hover:shadow-lg transition-all duration-300"
                  >
                    Anmelden
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-royal-cream hover:text-royal-gold p-2"
                whileTap={{ scale: 0.9 }}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t border-royal-gold/20"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-royal-cream hover:text-royal-gold hover:bg-royal-charcoal rounded-md transition-all duration-200"
                    >
                      {link.name}
                    </Link>
                  ))}

                  {/* Mobile Cart Link */}
                  <motion.button
                    onClick={handleCartClick}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-royal-cream hover:text-royal-gold hover:bg-royal-charcoal rounded-md transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Warenkorb</span>
                    {getTotalItems() > 0 && (
                      <span className="bg-royal-gold text-royal-charcoal rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {getTotalItems()}
                      </span>
                    )}
                  </motion.button>

                  {isAuthenticated ? (
                    <div className="mt-6 pt-6 border-t border-royal-gold/20 space-y-3">
                      <div className="px-4 py-3 text-royal-cream-light text-sm royal-glass rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-royal-gradient-gold rounded-full flex items-center justify-center">
                            <Crown className="w-4 h-4 text-royal-charcoal" />
                          </div>
                          <div>
                            <p className="font-medium text-royal-cream">
                              {user?.name}
                            </p>
                            <p className="text-xs">{user?.email}</p>
                            <p className="text-xs">Role: {userRole}</p>
                          </div>
                        </div>
                      </div>

                      {canAccessAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-royal-cream hover:text-royal-gold hover:bg-royal-charcoal rounded-lg transition-all duration-200"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin-Bereich</span>
                        </Link>
                      )}

                      <motion.button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-royal-cream hover:text-royal-gold hover:bg-royal-charcoal rounded-lg transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Abmelden</span>
                      </motion.button>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="block mx-3 mt-6 px-4 py-3 bg-royal-gradient-gold text-royal-charcoal text-center rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                    >
                      Anmelden
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
