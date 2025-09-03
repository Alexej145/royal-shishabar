import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  History,
  Gift,
  Star,
  ArrowLeft,
  Phone,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoyaltyService } from "../services/loyaltyService";
import { AuthService } from "../services/authService";
import {
  LoyaltyCard as LoyaltyCardType,
  LoyaltyTransaction,
} from "../types/loyalty";
import LoyaltyCard from "../components/loyalty/LoyaltyCard";
import LoyaltySearch from "../components/loyalty/LoyaltySearch";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

const Loyalty = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCardType | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  // Stable loader used by other callbacks
  const loadTransactions = useCallback(async (cardId: string) => {
    setLoading(true);
    try {
      const cardTransactions = await LoyaltyService.getLoyaltyTransactions(
        cardId
      );
      setTransactions(cardTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search for a user's loyalty card (stable callback)
  const searchUserLoyaltyCard = useCallback(
    async (phone: string) => {
      setLoading(true);
      try {
        const card = await LoyaltyService.searchLoyaltyCardByPhone(phone);
        if (card) {
          setLoyaltyCard(card);
          loadTransactions(card.id);
          toast.success("Ihr Stempelpass wurde gefunden!");
        } else {
          // No existing card, create one automatically
          const newCard = await LoyaltyService.getOrCreateLoyaltyCard(
            phone,
            user!.name
          );
          setLoyaltyCard(newCard);
          loadTransactions(newCard.id);
          toast.success("Neuer Stempelpass erstellt!");
        }
      } catch (error) {
        console.error("Error searching user loyalty card:", error);
        toast.error("Fehler beim Laden Ihres Stempelpasses");
      } finally {
        setLoading(false);
      }
    },
    [user, loadTransactions]
  );

  // Check for authenticated user's loyalty card on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.phone) {
        // User has a phone number, try to find their loyalty card
        searchUserLoyaltyCard(user.phone);
      } else {
        // User doesn't have a phone number, show prompt to add one
        setShowPhonePrompt(true);
      }
    }
  }, [isAuthenticated, user, searchUserLoyaltyCard]);

  const handlePhoneUpdate = async () => {
    if (!newPhone.trim()) {
      toast.error("Bitte geben Sie eine Telefonnummer ein");
      return;
    }

    setLoading(true);
    try {
      // Update user profile with phone number
      await AuthService.updateUserProfile(user!.id, { phone: newPhone.trim() });

      // Update local user state
      useAuthStore.getState().setUser({ ...user!, phone: newPhone.trim() });

      // Search for loyalty card with new phone
      await searchUserLoyaltyCard(newPhone.trim());
      setShowPhonePrompt(false);
      setNewPhone("");
    } catch (error) {
      console.error("Error updating phone:", error);
      toast.error("Fehler beim Aktualisieren der Telefonnummer");
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelected = async (card: LoyaltyCardType) => {
    setLoyaltyCard(card);
    loadTransactions(card.id);
  };

  const getTransactionIcon = (type: LoyaltyTransaction["type"]) => {
    switch (type) {
      case "stamp_earned":
        return <Star className="w-4 h-4 text-royal-purple" />;
      case "free_shisha_earned":
        return <Gift className="w-4 h-4 text-royal-purple-light" />;
      case "free_shisha_redeemed":
        return <Gift className="w-4 h-4 text-royal-gold" />;
      default:
        return <Star className="w-4 h-4 text-royal-purple" />;
    }
  };

  const getTransactionColor = (type: LoyaltyTransaction["type"]) => {
    switch (type) {
      case "stamp_earned":
        return "bg-royal-purple/10 border-royal-purple/20";
      case "free_shisha_earned":
        return "bg-royal-purple-light/10 border-royal-purple-light/20";
      case "free_shisha_redeemed":
        return "bg-royal-gold/10 border-royal-gold/20";
      default:
        return "bg-royal-purple/10 border-royal-purple/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-cream to-royal-purple/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-royal-purple to-royal-purple-light text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-royal-cream hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-8 h-8 text-royal-gold" />
            <h1 className="text-3xl md:text-4xl font-royal font-bold">
              Royal Stempelpass
            </h1>
          </div>
          <p className="text-royal-cream-light text-lg">
            Sammeln Sie Stempel und erhalten Sie gratis Shishas
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Phone Number Prompt for Authenticated Users */}
          {isAuthenticated && showPhonePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-royal p-6 shadow-lg border border-royal-purple/20"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-royal-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-8 h-8 text-royal-purple" />
                </div>
                <h3 className="text-xl font-royal font-bold text-royal-purple mb-2">
                  Telefonnummer hinzufügen
                </h3>
                <p className="text-royal-charcoal/70 mb-4">
                  Um Ihren Stempelpass zu verwalten, benötigen wir Ihre
                  Telefonnummer
                </p>
              </div>

              <div className="max-w-sm mx-auto">
                <div className="relative mb-4">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-royal-purple/60 w-5 h-5" />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="z.B. +49 123 4567890"
                    className="w-full pl-12 pr-4 py-3 border-2 border-royal-purple/20 rounded-royal focus:outline-none focus:border-royal-purple focus:ring-2 focus:ring-royal-purple/20 bg-white text-royal-charcoal placeholder-royal-charcoal/50 transition-all duration-200"
                    disabled={loading}
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePhoneUpdate}
                    disabled={loading || !newPhone.trim()}
                    className="flex-1 bg-royal-purple text-white py-3 px-6 rounded-royal font-medium hover:bg-royal-purple-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 royal-glow"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                    <span>{loading ? "Aktualisiere..." : "Hinzufügen"}</span>
                  </motion.button>

                  <button
                    onClick={() => setShowPhonePrompt(false)}
                    className="px-6 py-3 border-2 border-royal-charcoal/30 text-royal-charcoal/70 rounded-royal hover:bg-royal-charcoal/5 transition-colors duration-300 font-medium"
                  >
                    Später
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* How it works section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-royal p-6 shadow-lg border border-royal-purple/20"
          >
            <h2 className="text-2xl font-royal font-bold text-royal-purple mb-4">
              So funktioniert's
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-royal-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-royal-purple" />
                </div>
                <h3 className="font-bold text-royal-charcoal mb-2">Sammeln</h3>
                <p className="text-sm text-royal-charcoal/70">
                  Für jede bestellte Shisha erhalten Sie einen Stempel
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-royal-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-royal-purple" />
                </div>
                <h3 className="font-bold text-royal-charcoal mb-2">
                  10 Stempel
                </h3>
                <p className="text-sm text-royal-charcoal/70">
                  Bei 10 Stempeln erhalten Sie eine gratis Shisha
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-royal-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-8 h-8 text-royal-purple" />
                </div>
                <h3 className="font-bold text-royal-charcoal mb-2">Einlösen</h3>
                <p className="text-sm text-royal-charcoal/70">
                  Lösen Sie Ihre gratis Shisha bei Ihrer nächsten Bestellung ein
                </p>
              </div>
            </div>
          </motion.div>

          {/* Loyalty Card Search/Display */}
          {!loyaltyCard && !showPhonePrompt ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LoyaltySearch
                onCardSelected={handleCardSelected}
                showCreateNew={true}
                onCreateNew={() => {}}
              />
            </motion.div>
          ) : loyaltyCard ? (
            <div className="space-y-6">
              {/* Welcome message for authenticated users */}
              {isAuthenticated && user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-royal-purple/10 border border-royal-purple/20 rounded-royal p-4"
                >
                  <p className="text-royal-purple font-medium text-center">
                    Willkommen zurück, {user.name}! Hier ist Ihr Stempelpass:
                  </p>
                </motion.div>
              )}

              {/* Loyalty Card Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <LoyaltyCard loyaltyCard={loyaltyCard} showActions={false} />
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex-1 bg-royal-purple text-white py-3 px-6 rounded-royal font-medium hover:bg-royal-purple-light transition-colors duration-300 flex items-center justify-center space-x-2 royal-glow"
                >
                  <History className="w-5 h-5" />
                  <span>
                    {showHistory ? "Historie ausblenden" : "Historie anzeigen"}
                  </span>
                </button>

                <button
                  onClick={() => navigate("/menu")}
                  className="flex-1 border-2 border-royal-purple text-royal-purple py-3 px-6 rounded-royal font-medium hover:bg-royal-purple hover:text-white transition-colors duration-300"
                >
                  Zur Speisekarte
                </button>

                <button
                  onClick={() => {
                    setLoyaltyCard(null);
                    setTransactions([]);
                    setShowHistory(false);
                  }}
                  className="px-6 py-3 text-royal-charcoal/70 hover:text-royal-charcoal transition-colors duration-300"
                >
                  Neue Suche
                </button>
              </div>

              {/* Transaction History */}
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-royal p-6 shadow-lg border border-royal-purple/20"
                >
                  <h3 className="text-xl font-royal font-bold text-royal-purple mb-4 flex items-center space-x-2">
                    <History className="w-5 h-5" />
                    <span>Stempel-Historie</span>
                  </h3>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-royal border ${getTransactionColor(
                            transaction.type
                          )}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getTransactionIcon(transaction.type)}
                              <div>
                                <p className="font-medium text-royal-charcoal">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-royal-charcoal/60">
                                  {transaction.createdAt.toLocaleDateString(
                                    "de-DE",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              {transaction.stampsChanged > 0 && (
                                <div className="text-royal-purple font-bold">
                                  +{transaction.stampsChanged} Stempel
                                </div>
                              )}
                              {transaction.type === "free_shisha_redeemed" && (
                                <div className="text-royal-gold font-bold">
                                  -{transaction.shishaCount} Gratis
                                </div>
                              )}
                              {transaction.type === "free_shisha_earned" && (
                                <div className="text-royal-purple-light font-bold">
                                  +{transaction.shishaCount} Gratis
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-royal-charcoal/70">
                      <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>Noch keine Transaktionen vorhanden</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Loyalty;
