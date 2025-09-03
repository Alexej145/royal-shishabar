import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Star, Clock, MapPin } from "lucide-react";
import { MenuService } from "../services/menuService";
import { SpecialOfferService } from "../services/specialOfferService";
import { MenuItem } from "../types/menu";
import { SpecialOffer } from "../types/menu";
import AddToCart from "../components/common/AddToCart";
import LocationMap from "../components/maps/LocationMap";

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories
  const categories = [
    "all",
    ...Array.from(new Set(menuItems.map((item) => item.category))),
  ];

  // Filter items by category
  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  useEffect(() => {
    const unsubscribeMenu = MenuService.onMenuItemsChange((items) => {
      setMenuItems(items);
    });

    const unsubscribeOffers = SpecialOfferService.onActiveSpecialOffersChange(
      (offers) => {
        setSpecialOffers(offers);
        setLoading(false);
      }
    );

    // Add error handling for special offers
    const handleOffersError = (error: Error) => {
      console.error("Error loading special offers:", error);
      setSpecialOffers([]);
      setLoading(false);
    };

    // Fallback: if real-time listener fails, try to load offers once
    const loadOffersOnce = async () => {
      try {
        const offers = await SpecialOfferService.getActiveSpecialOffers();
        setSpecialOffers(offers);
      } catch (error) {
        handleOffersError(error as Error);
      }
    };

    // Set a timeout to try loading offers once if real-time fails
    const timeoutId = setTimeout(loadOffersOnce, 5000);

    return () => {
      unsubscribeMenu();
      unsubscribeOffers();
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-gradient-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-royal-gold mx-auto mb-4"></div>
          <p className="text-royal-charcoal">Lade Menü...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-gradient-cream">
      {/* Header */}
      <div className="bg-royal-gradient-gold py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Crown className="w-12 h-12 mx-auto text-royal-charcoal mb-4" />
              <h1 className="text-4xl md:text-6xl font-royal font-bold text-royal-charcoal mb-4">
                Unser Menü
              </h1>
              <p className="text-lg md:text-xl text-royal-charcoal/80 max-w-2xl mx-auto">
                Entdecken Sie unsere königliche Auswahl an
                Premium-Shisha-Aromen, exklusiven Getränken und feinen Speisen
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Special Offers Section */}
      {specialOffers.length > 0 && (
        <section className="py-8 bg-royal-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-royal font-bold text-royal-cream mb-4">
                🎉 Spezielle Angebote
              </h2>
              <p className="text-royal-cream/90 text-lg">
                Begrenzte Zeit - Exklusive Deals für unsere königlichen Gäste
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="bg-royal-charcoal-dark/80 backdrop-blur-sm rounded-royal p-6 border border-royal-gold/30 relative overflow-hidden royal-glow"
                >
                  {/* Discount Badge */}
                  <div className="absolute top-4 right-4 bg-royal-gold text-royal-charcoal px-3 py-1 rounded-full text-sm font-bold">
                    -{offer.discountPercentage}%
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-royal font-bold text-royal-cream">
                      {offer.title}
                    </h3>
                    <p className="text-royal-cream/80">{offer.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="text-royal-cream">
                        <span className="line-through text-royal-cream/60">
                          {offer.originalPrice.toFixed(2)}€
                        </span>
                        <span className="text-2xl font-bold ml-2 text-royal-gold">
                          {offer.discountedPrice.toFixed(2)}€
                        </span>
                      </div>
                    </div>

                    {offer.validUntil && (
                      <div className="flex items-center text-royal-cream/80 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          Gültig bis{" "}
                          {new Date(offer.validUntil).toLocaleDateString(
                            "de-DE"
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="py-8 bg-royal-charcoal-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-royal font-royal font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-royal-gradient-gold text-royal-charcoal royal-glow"
                    : "bg-royal-charcoal text-royal-cream hover:bg-royal-charcoal-light border border-royal-gold/30"
                }`}
              >
                {category === "all" ? "Alle" : category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-12 bg-royal-gradient-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-royal shadow-lg royal-glow border border-royal-gold/20 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Item Image */}
                {item.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-royal-gold/90 text-royal-charcoal px-3 py-1 rounded-full text-sm font-bold">
                        {item.category}
                      </span>
                    </div>
                  </div>
                )}

                {/* Item Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-royal font-bold text-royal-charcoal">
                      {item.name}
                    </h3>
                    <span className="text-2xl font-bold text-royal-gold">
                      {(typeof item.price === "number"
                        ? item.price
                        : parseFloat(item.price) || 0
                      ).toFixed(2)}
                      €
                    </span>
                  </div>

                  <p className="text-royal-charcoal/70 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Item Details */}
                  <div className="space-y-2 mb-6">
                    {item.ingredients && (
                      <div className="flex items-center text-sm text-royal-charcoal/60">
                        <Star className="w-4 h-4 mr-2" />
                        <span>{item.ingredients}</span>
                      </div>
                    )}
                    {item.preparationTime && (
                      <div className="flex items-center text-sm text-royal-charcoal/60">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Zubereitungszeit: {item.preparationTime}</span>
                      </div>
                    )}
                    {item.allergens && (
                      <div className="flex items-center text-sm text-royal-charcoal/60">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Allergene: {item.allergens}</span>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Component */}
                  <AddToCart item={item} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Crown className="w-16 h-16 mx-auto text-royal-charcoal/30 mb-4" />
              <h3 className="text-xl font-royal font-bold text-royal-charcoal mb-2">
                Keine Artikel in dieser Kategorie
              </h3>
              <p className="text-royal-charcoal/70">
                Wählen Sie eine andere Kategorie oder schauen Sie später wieder
                vorbei.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 bg-royal-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-royal font-bold text-white mb-4 md:mb-6">
              Besuchen Sie Uns
            </h2>
            <p className="text-lg md:text-xl text-royal-cream-light max-w-3xl mx-auto">
              Finden Sie uns in der Innenstadt von Waldkraiburg für ein
              königliches Shisha-Erlebnis
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <LocationMap className="max-w-4xl mx-auto" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Menu;
