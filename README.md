# 🐕 PuppyTimer

Modern, feature-rich dog care and community app with premium customization options.

## ✨ Features

### 🎨 Premium Customization
- **Animated Frame Effects** - 6 premium frame types with stunning animations:
  - 🔥 Fire (animated flame effect)
  - 👑 Gold Crown (pulsing glow)
  - 👸 Pink Crown (shimmering effect)
  - 🎀 Red Ribbon (soft glow)
  - ⭐ Star (twinkling effect)
  - 💎 Diamond (crystal shimmer)

- **Message Colors** - 5 premium colors for community chat messages
- **Custom Accessories** - Dress up your dog with various accessories
- **Color Customization** - Personalize your dog's appearance

### 🗺️ Community Map
- Interactive map with dog locations
- Premium markers (larger, animated)
- Friend system with messaging
- Navigation routes between friends
- Community zones (safe/social areas)

### 💬 Community Features
- Public community chat with rate limiting (5 messages per 5 minutes)
- Profanity filter and moderation system
- Private messaging between friends
- Real-time updates via Firestore
- Report system with automatic bans

### 📊 Dog Management
- Track activities (walks, vaccines, medications, etc.)
- Growth tracking and statistics
- Photo management with cartoon filter
- Birthday celebrations with animations
- Multiple dog profiles

### 🛡️ Security & Privacy
- Anonymous authentication via Firebase
- IndexedDB for local data storage
- Firestore sync for cross-device support
- Community moderation and ban system
- Friend-only navigation and messaging

## 🏗️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Dexie.js** for IndexedDB
- **Lucide React** for icons

### Backend
- **Firebase Authentication** (anonymous)
- **Firestore** for real-time data
- **Firebase Hosting** for deployment

### Key Libraries
- `dexie` - IndexedDB wrapper
- `leaflet` - Map visualization
- `date-fns` - Date utilities
- `three` - 3D dog animations

## 📁 Project Structure

```
PuppyTimer/
├── PuppyTimerWeb/          # Web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # Business logic & APIs
│   │   ├── hooks/          # Custom React hooks
│   │   ├── db/            # IndexedDB schemas
│   │   ├── types/         # TypeScript types
│   │   └── styles/        # CSS animations
│   ├── public/            # Static assets
│   └── dist/              # Production build
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project

### Installation

```bash
# Clone repository
git clone https://github.com/Kralbogi/PuppyTimer.git
cd PuppyTimer/PuppyTimerWeb

# Install dependencies
npm install

# Set up Firebase
# Create .env file with your Firebase config
cp .env.example .env
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

```bash
# Deploy to Firebase Hosting
npm run build
npx firebase deploy --only hosting
```

## 🎯 Premium Features

Premium users get access to:
- ✅ Animated frame effects (6 types)
- ✅ Message colors (5 colors)
- ✅ Unlimited name changes
- ✅ Unlimited color customization
- ✅ Larger map markers with priority z-index
- ✅ Full accessory collection

Free users:
- ⚡ 1 name change per week
- ⚡ 3 color changes total
- ⚡ Default message color
- ⚡ Normal frame only

## 📝 Key Optimizations

- **Firestore Size Limit Fix**: Large images (fotoData, avatarData) stored only in IndexedDB, not Firestore
- **Real-time Sync**: Metadata synced via Firestore, images remain local
- **Rate Limiting**: Client-side rate limiting for chat (5 messages/5 min)
- **Thumbnail Generation**: 128x128 thumbnails for community map (~5-10KB each)
- **Animation Performance**: CSS-based animations with GPU acceleration

## 🐛 Known Issues

- QuotaExceededError may occur if browser cache is not cleared after updates
- Premium features require hard refresh (Cmd+Shift+R) after purchase

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development

Built with ❤️ using Claude Code (Anthropic)

---

**Live Demo**: https://pawland3448.web.app
