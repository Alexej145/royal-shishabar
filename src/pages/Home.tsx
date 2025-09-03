import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Star,
  Users,
  Clock,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Music,
  Gift,
} from "lucide-react";
// SocialBar moved to app-level layout
import CountUp from "../components/common/CountUp";
import RoyalShishaLogo from "../assets/Logo.jpeg";
import { HERO_VIDEOS, VIDEO_SETTINGS } from "../config/videos";
import LocationMap from "../components/maps/LocationMap";

const Home: React.FC = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const isAutoPlay = VIDEO_SETTINGS?.autoPlay ?? false;
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
    }, VIDEO_SETTINGS.autoAdvanceInterval || 8000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const togglePlay = () => {
    const current = videoRefs.current[currentVideoIndex];
    if (!current) return;
    if (isPlaying) current.pause();
    else current.play();
    setIsPlaying(!isPlaying);
  };

  const goToVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    const v = videoRefs.current[index];
    if (v) {
      v.currentTime = 0;
      v.play();
    }
  };

  const previousVideo = () =>
    setCurrentVideoIndex((i) => (i === 0 ? HERO_VIDEOS.length - 1 : i - 1));

  const nextVideo = () =>
    setCurrentVideoIndex((i) => (i + 1) % HERO_VIDEOS.length);

  const handleVideoError = (index: number) => {
    if (!VIDEO_SETTINGS?.fallbackOnError) return;
    const el = videoRefs.current[index];
    if (!el) return;
    el.style.display = "none";
    const next = el.nextElementSibling as HTMLImageElement | null;
    if (next) next.style.display = "block";
  };

  const features = [
    {
      icon: Crown,
      title: "Königliches Erlebnis",
      description:
        "Erleben Sie die feinsten Shisha-Aromen in einer luxuriösen Atmosphäre",
    },
    {
      icon: Music,
      title: "Live-Unterhaltung",
      description:
        "Genießen Sie Live-DJ-Auftritte und erstellen Sie Ihre eigene königliche Playlist",
    },
    {
      icon: Users,
      title: "Exklusive Atmosphäre",
      description:
        "Der perfekte Ort, um stilvoll zu entspannen und sich mit Freunden zu treffen",
    },
    {
      icon: Star,
      title: "Premium-Service",
      description:
        "Professionelles Personal, das sich Ihrem königlichen Wohlbefinden widmet",
    },
  ];

  const stats = [
    { number: 50, suffix: "+", label: "Premium-Aromen" },
    { number: 100, suffix: "+", label: "Königliche Gäste" },
    { number: 5, suffix: "", label: "Sterne-Bewertung" },
    { number: 24, suffix: "/7", label: "Königlicher Service" },
  ];

  return (
    <div className="min-h-screen">
      {/* SocialBar is rendered globally in App.tsx */}

      {/* Hero Section with Video Carousel */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden hero-section">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVideoIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <video
                ref={(el) => (videoRefs.current[currentVideoIndex] = el)}
                autoPlay
                loop
                muted
                playsInline
                onError={() => handleVideoError(currentVideoIndex)}
                className="absolute top-1/2 left-1/2 w-auto min-w-full min-h-full max-w-none transform -translate-x-1/2 -translate-y-1/2 object-cover"
              >
                <source
                  src={HERO_VIDEOS[currentVideoIndex].url}
                  type="video/mp4"
                />
              </video>

              <img
                src={HERO_VIDEOS[currentVideoIndex].fallback}
                alt={HERO_VIDEOS[currentVideoIndex].title}
                className="absolute top-1/2 left-1/2 w-auto min-w-full min-h-full max-w-none transform -translate-x-1/2 -translate-y-1/2 object-cover hidden"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-royal-purple-dark/50 z-10" />

        <div className="absolute inset-0 z-30">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={previousVideo}
              className="bg-royal-gold/20 backdrop-blur-sm text-white p-2 md:p-3 rounded-full border border-royal-gold/30 hover:bg-royal-gold/30 transition-all duration-300 royal-glow"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </motion.button>
          </div>

          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextVideo}
              className="bg-royal-gold/20 backdrop-blur-sm text-white p-2 md:p-3 rounded-full border border-royal-gold/30 hover:bg-royal-gold/30 transition-all duration-300 royal-glow"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </motion.button>
          </div>

          <div className="absolute top-20 md:top-24 right-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="bg-royal-gold/20 backdrop-blur-sm text-white p-2 md:p-3 rounded-full border border-royal-gold/30 hover:bg-royal-gold/30 transition-all duration-300 royal-glow"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </motion.button>
          </div>

          <div className="absolute bottom-16 md:bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2 md:space-x-3">
              {HERO_VIDEOS.map((_, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToVideo(index)}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                    index === currentVideoIndex
                      ? "bg-royal-gold royal-glow"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30 text-center hidden md:block">
            <motion.div
              key={currentVideoIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white"
            >
              <h3 className="text-2xl font-royal font-bold mb-2 royal-text-glow">
                {HERO_VIDEOS[currentVideoIndex].title}
              </h3>
              <p className="text-royal-cream-light">
                {HERO_VIDEOS[currentVideoIndex].description}
              </p>
            </motion.div>
          </div>

          <div className="absolute inset-0 z-10 pointer-events-none hero-background-elements">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-20 w-16 h-16 md:w-32 md:h-32 bg-royal-gold/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-20 right-20 w-20 h-20 md:w-40 md:h-40 bg-royal-purple/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ y: [0, -15, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/6 w-12 h-12 bg-royal-gold/20 rounded-full blur-lg hidden md:block"
            />
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [0.15, 0.3, 0.15] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3,
              }}
              className="absolute bottom-1/4 right-1/6 w-10 h-10 bg-royal-burgundy/15 rounded-full blur-md hidden md:block"
            />
          </div>

          <div className="relative z-30 text-center text-white px-4 max-w-4xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-4 md:mb-8 hero-logo-container"
            >
              <div className="relative">
                <img
                  draggable={false}
                  src={RoyalShishaLogo}
                  alt="Royal Shisha Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-40 md:h-40 mx-auto rounded-full object-cover border-2 md:border-4 border-royal-gold shadow-2xl relative z-10"
                />
                <div className="absolute inset-0 bg-royal-gold/20 rounded-full blur-xl animate-pulse" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mb-6 md:mb-8"
            >
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-royal font-bold mb-4 md:mb-6 royal-text-glow">
                Royal Shisha Bar
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-royal-cream-light mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
                Erleben Sie die Kunst des Shisha-Rauchens in einer königlichen
                Atmosphäre mit Premium-Aromen und exklusivem Service
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 md:mb-12"
            >
              <Link
                to="/menu"
                className="px-8 py-4 bg-royal-gold text-royal-charcoal font-royal font-bold rounded-royal hover:bg-royal-gold/90 transition-all duration-300 royal-glow hover:scale-105 transform"
              >
                Menü Entdecken
              </Link>
              <Link
                to="/events"
                className="px-8 py-4 border-2 border-royal-gold text-royal-gold font-royal font-bold rounded-royal hover:bg-royal-gold hover:text-royal-charcoal transition-all duration-300 royal-glow hover:scale-105 transform"
              >
                Events & Reservierungen
              </Link>
              <Link
                to="/loyalty"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-royal font-bold rounded-royal hover:from-purple-700 hover:to-purple-900 transition-all duration-300 royal-glow hover:scale-105 transform flex items-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Stempelpass</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-4 bg-royal-gold/10 backdrop-blur-sm rounded-royal border border-royal-gold/20"
                >
                  <div className="text-2xl md:text-3xl font-royal font-bold text-royal-gold mb-1">
                    <CountUp end={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs md:text-sm text-royal-cream-light">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Loyalty Program Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-purple-900 to-royal-purple-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Crown className="w-12 h-12 text-royal-gold" />
              <h2 className="text-3xl md:text-5xl font-royal font-bold text-white">
                Royal Stempelpass
              </h2>
            </div>
            <p className="text-lg md:text-xl text-royal-cream-light max-w-3xl mx-auto">
              Sammeln Sie bei jeder Shisha-Bestellung Stempel und erhalten Sie
              nach 10 Stempeln eine gratis Shisha
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-royal border border-white/20"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-royal-gold/20 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-royal-gold" />
              </div>
              <h3 className="text-xl font-royal font-bold text-white mb-3">
                Sammeln
              </h3>
              <p className="text-royal-cream-light leading-relaxed">
                1 Stempel pro bestellter Shisha
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-royal border border-white/20"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-royal-gold/20 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-royal-gold" />
              </div>
              <h3 className="text-xl font-royal font-bold text-white mb-3">
                10 Stempel = Belohnung
              </h3>
              <p className="text-royal-cream-light leading-relaxed">
                Eine gratis Shisha Ihrer Wahl
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-royal border border-white/20"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-royal-gold/20 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-royal-gold" />
              </div>
              <h3 className="text-xl font-royal font-bold text-white mb-3">
                Einlösen
              </h3>
              <p className="text-royal-cream-light leading-relaxed">
                Einfach bei der nächsten Bestellung verwenden
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              to="/loyalty"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-royal-gold text-royal-charcoal font-royal font-bold rounded-royal hover:bg-royal-gold/90 transition-all duration-300 royal-glow hover:scale-105 transform"
            >
              <Crown className="w-5 h-5" />
              <span>Stempelpass erstellen</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-royal-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-royal font-bold text-white mb-4 md:mb-6">
              Warum Royal Shisha Bar?
            </h2>
            <p className="text-lg md:text-xl text-royal-cream-light max-w-3xl mx-auto">
              Entdecken Sie die einzigartigen Vorteile, die uns zu Ihrer ersten
              Wahl für ein königliches Shisha-Erlebnis machen
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-royal-gradient-gold rounded-royal royal-glow border border-royal-gold/30"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-royal-gold/20 rounded-full flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-royal-gold" />
                </div>
                <h3 className="text-xl font-royal font-bold text-royal-charcoal mb-3">
                  {feature.title}
                </h3>
                <p className="text-royal-charcoal/80 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-royal-purple-dark to-royal-burgundy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-royal font-bold text-white mb-4 md:mb-6">
              Kontaktieren Sie Uns
            </h2>
            <p className="text-lg md:text-xl text-royal-cream-light max-w-3xl mx-auto">
              Bereit für ein königliches Erlebnis? Kontaktieren Sie uns für
              Reservierungen oder Fragen
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <LocationMap className="max-w-4xl mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-royal border border-white/20"
            >
              <Phone className="w-12 h-12 mx-auto mb-4 text-royal-gold" />
              <h3 className="text-xl font-royal font-bold text-white mb-2">
                Telefon
              </h3>
              <p className="text-royal-cream-light">+49 15781413767</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-royal border border-white/20"
            >
              <Mail className="w-12 h-12 mx-auto mb-4 text-royal-gold" />
              <h3 className="text-xl font-royal font-bold text-white mb-2">
                E-Mail
              </h3>
              <p className="text-royal-cream-light">
                Royal.Waldkraiburg@gmail.com
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-royal border border-white/20"
            >
              <Clock className="w-12 h-12 mx-auto mb-4 text-royal-gold" />
              <h3 className="text-xl font-royal font-bold text-white mb-2">
                Öffnungszeiten
              </h3>
              <p className="text-royal-cream-light">
                Mo-Fr: 17:00 - 01:00
                <br />
                Sa-So: 17:00 - 03:00
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
