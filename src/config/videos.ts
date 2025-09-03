export interface VideoConfig {
  id: number;
  title: string;
  description: string;
  url: string;
  fallback: string;
  duration?: number; // in seconds
  category?: string;
}

export interface VideoClip {
  id: string;
  src: string;
  title: string;
  description: string;
  duration: number;
  thumbnail?: string;
}

// Real optimized videos for hero section
export const HERO_VIDEOS: VideoConfig[] = [
  {
    id: 1,
    title: "Royal Shisha Experience",
    description: "Experience the premium atmosphere of Royal Shisha",
    url: "/videos/optimized/clip_1.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "experience"
  },
  {
    id: 2,
    title: "Aerial View",
    description: "Breathtaking aerial footage of our location",
    url: "/videos/optimized/clip_2.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "drone"
  },
  {
    id: 3,
    title: "Premium Hookah Setup",
    description: "Watch our expert staff prepare your perfect hookah",
    url: "/videos/optimized/clip_3.mp4",
    fallback: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "service"
  },
  {
    id: 4,
    title: "Evening Atmosphere",
    description: "The magical evening ambiance at Royal Shisha",
    url: "/videos/optimized/clip_4.mp4",
    fallback: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "atmosphere"
  },
  {
    id: 5,
    title: "Drone Footage",
    description: "Spectacular drone views of our premium location",
    url: "/videos/optimized/clip_5.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "drone"
  },
  {
    id: 6,
    title: "Sunset Views",
    description: "Beautiful sunset over Royal Shisha",
    url: "/videos/optimized/clip_6.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "atmosphere"
  },
  {
    id: 7,
    title: "Premium Service",
    description: "Our dedicated staff providing exceptional service",
    url: "/videos/optimized/clip_7.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "service"
  },
  {
    id: 8,
    title: "Hookah Preparation",
    description: "The art of preparing the perfect hookah",
    url: "/videos/optimized/clip_8.mp4",
    fallback: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "service"
  },
  {
    id: 9,
    title: "Aerial Tour",
    description: "Complete aerial tour of our facilities",
    url: "/videos/optimized/clip_9.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "drone"
  },
  {
    id: 10,
    title: "Evening Lights",
    description: "The beautiful evening lighting at Royal Shisha",
    url: "/videos/optimized/clip_10.mp4",
    fallback: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "atmosphere"
  },
  {
    id: 11,
    title: "Premium Atmosphere",
    description: "Experience our premium atmosphere and service",
    url: "/videos/optimized/clip_11.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "atmosphere"
  },
  {
    id: 12,
    title: "Quick Tour",
    description: "A quick tour of our premium facilities",
    url: "/videos/optimized/clip_12.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "tour"
  },
  {
    id: 13,
    title: "Service Excellence",
    description: "Our commitment to service excellence",
    url: "/videos/optimized/clip_13.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "service"
  },
  {
    id: 14,
    title: "Complete Experience",
    description: "The complete Royal Shisha experience",
    url: "/videos/optimized/clip_14.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "experience"
  },
  {
    id: 15,
    title: "Royal Shisha Complete",
    description: "The complete Royal Shisha experience showcase",
    url: "/videos/optimized/clip_15.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    duration: 1,
    category: "showcase"
  }
];

export const videoClips: VideoClip[] = [
  {
    id: 'clip_1',
    src: '/videos/optimized/clip_1.mp4',
    title: 'Royal Shisha Experience',
    description: 'Experience the premium atmosphere of Royal Shisha',
    duration: 1
  },
  {
    id: 'clip_2',
    src: '/videos/optimized/clip_2.mp4',
    title: 'Aerial View',
    description: 'Breathtaking aerial footage of our location',
    duration: 1
  },
  {
    id: 'clip_3',
    src: '/videos/optimized/clip_3.mp4',
    title: 'Premium Hookah Setup',
    description: 'Watch our expert staff prepare your perfect hookah',
    duration: 1
  },
  {
    id: 'clip_4',
    src: '/videos/optimized/clip_4.mp4',
    title: 'Evening Atmosphere',
    description: 'The magical evening ambiance at Royal Shisha',
    duration: 1
  },
  {
    id: 'clip_5',
    src: '/videos/optimized/clip_5.mp4',
    title: 'Drone Footage',
    description: 'Spectacular drone views of our premium location',
    duration: 1
  },
  {
    id: 'clip_6',
    src: '/videos/optimized/clip_6.mp4',
    title: 'Sunset Views',
    description: 'Beautiful sunset over Royal Shisha',
    duration: 1
  },
  {
    id: 'clip_7',
    src: '/videos/optimized/clip_7.mp4',
    title: 'Premium Service',
    description: 'Our dedicated staff providing exceptional service',
    duration: 1
  },
  {
    id: 'clip_8',
    src: '/videos/optimized/clip_8.mp4',
    title: 'Hookah Preparation',
    description: 'The art of preparing the perfect hookah',
    duration: 1
  },
  {
    id: 'clip_9',
    src: '/videos/optimized/clip_9.mp4',
    title: 'Aerial Tour',
    description: 'Complete aerial tour of our facilities',
    duration: 1
  },
  {
    id: 'clip_10',
    src: '/videos/optimized/clip_10.mp4',
    title: 'Evening Lights',
    description: 'The beautiful evening lighting at Royal Shisha',
    duration: 1
  },
  {
    id: 'clip_11',
    src: '/videos/optimized/clip_11.mp4',
    title: 'Premium Atmosphere',
    description: 'Experience our premium atmosphere and service',
    duration: 1
  },
  {
    id: 'clip_12',
    src: '/videos/optimized/clip_12.mp4',
    title: 'Quick Tour',
    description: 'A quick tour of our premium facilities',
    duration: 1
  },
  {
    id: 'clip_13',
    src: '/videos/optimized/clip_13.mp4',
    title: 'Service Excellence',
    description: 'Our commitment to service excellence',
    duration: 1
  },
  {
    id: 'clip_14',
    src: '/videos/optimized/clip_14.mp4',
    title: 'Complete Experience',
    description: 'The complete Royal Shisha experience',
    duration: 1
  },
  {
    id: 'clip_15',
    src: '/videos/optimized/clip_15.mp4',
    title: 'Royal Shisha Complete',
    description: 'The complete Royal Shisha experience showcase',
    duration: 1
  }
];

export const videoCarouselSettings = {
  autoAdvance: true,
  autoAdvanceInterval: 2000, // 8 seconds
  showControls: true,
  showIndicators: true,
  showVideoInfo: true
};

// Video settings optimized for real videos
export const VIDEO_SETTINGS = {
  autoPlay: true,
  loop: true,
  muted: true,
  transitionDuration: 1000, // milliseconds
  autoAdvanceInterval: 2200, // 6 seconds - shorter for more engaging experience
  showControls: true,
  showIndicators: true,
  showInfo: true,
  fallbackOnError: true
};

// Vercel hosting recommendations
export const VERCEL_VIDEO_GUIDELINES = {
  maxFileSize: "10MB", // Vercel's limit for free tier
  recommendedFormats: ["mp4", "webm"],
  recommendedCodec: "H.264",
  maxDuration: "30 seconds",
  compression: "Use tools like HandBrake or FFmpeg to compress videos"
};

// Video quality settings for different screen sizes
export const VIDEO_QUALITY = {
  mobile: {
    width: 640,
    height: 360,
    bitrate: "800k"
  },
  tablet: {
    width: 1280,
    height: 720,
    bitrate: "1500k"
  },
  desktop: {
    width: 1920,
    height: 1080,
    bitrate: "3000k"
  }
};

// Helper function to get video by category
export const getVideosByCategory = (category: string): VideoConfig[] => {
  return HERO_VIDEOS.filter(video => video.category === category);
};

// Helper function to get random video
export const getRandomVideo = (): VideoConfig => {
  const randomIndex = Math.floor(Math.random() * HERO_VIDEOS.length);
  return HERO_VIDEOS[randomIndex];
};

// Helper function to get video by ID
export const getVideoById = (id: number): VideoConfig | undefined => {
  return HERO_VIDEOS.find(video => video.id === id);
}; 