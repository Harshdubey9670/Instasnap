/**
 * InstaSnap AR Lens Framework & Face Tracking Architecture
 * Module 10: AR-Ready Lens System (React Native version)
 */

export const AR_LENS_CATEGORIES = [
  'Trending',
  'Beauty',
  'Funny',
  'Anime',
  'Retro & Cyber',
  'Atmosphere',
  'AI Masks'
];

export interface BuiltinArLens {
  id: string;
  name: string;
  category: string;
  faceMeshPoints?: string[];
  segmentation?: string;
  icon: string;
  isFavorite: boolean;
  eyeTracking?: boolean;
  smileDetection?: boolean;
  triggerEvent?: string;
  handTracking?: boolean;
  gestureRecognition?: string[];
  backgroundSegmentation?: boolean;
}

export const BUILTIN_AR_LENSES: BuiltinArLens[] = [
  {
    id: 'lens_cyber_neon',
    name: 'Cyber Neon Visor',
    category: 'Retro & Cyber',
    faceMeshPoints: ['eyes', 'forehead'],
    segmentation: 'background_blur',
    icon: '🕶️',
    isFavorite: true
  },
  {
    id: 'lens_anime_eyes',
    name: 'Anime Sparkle Eyes',
    category: 'Anime',
    faceMeshPoints: ['left_eye', 'right_eye'],
    eyeTracking: true,
    icon: '✨',
    isFavorite: false
  },
  {
    id: 'lens_smile_burst',
    name: 'Smile Heart Burst',
    category: 'Funny',
    smileDetection: true,
    triggerEvent: 'smile',
    icon: '💖',
    isFavorite: true
  },
  {
    id: 'lens_hand_fire',
    name: 'Hand Palm Fireball',
    category: 'Atmosphere',
    handTracking: true,
    gestureRecognition: ['open_palm', 'peace_sign'],
    icon: '🔥',
    isFavorite: false
  },
  {
    id: 'lens_green_screen',
    name: 'AI Green Screen Studio',
    category: 'AI Masks',
    backgroundSegmentation: true,
    icon: '🎬',
    isFavorite: true
  }
];

type LensListener = (lens: BuiltinArLens) => void;

class ArLensEngine {
  activeLens: BuiltinArLens;
  favorites: Set<string>;
  recentLenses: string[];
  listeners: Set<LensListener>;

  constructor() {
    this.activeLens = BUILTIN_AR_LENSES[0];
    this.favorites = new Set(['lens_cyber_neon', 'lens_smile_burst']);
    this.recentLenses = ['lens_cyber_neon'];
    this.listeners = new Set();
  }

  selectLens(lensId: string) {
    const found = BUILTIN_AR_LENSES.find(l => l.id === lensId);
    if (found) {
      this.activeLens = found;
      this.recentLenses = [lensId, ...this.recentLenses.filter(id => id !== lensId)].slice(0, 10);
      this.notifyListeners();
    }
  }

  toggleFavorite(lensId: string) {
    if (this.favorites.has(lensId)) {
      this.favorites.delete(lensId);
    } else {
      this.favorites.add(lensId);
    }
    this.notifyListeners();
  }

  subscribe(callback: LensListener) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.activeLens));
  }
}

export const ArLensFramework = new ArLensEngine();
