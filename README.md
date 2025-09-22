# 🌸 KiraKira - Digital Emotional Garden

> A meditative PWA where your daily emotions bloom into a unique digital garden

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Telegram Mini App

KiraKira is also available as a **Telegram Mini App**! Experience your emotional garden directly in Telegram with additional features:

- **Bot**: [@KiraKiraGardenBot](https://t.me/KiraKiraGardenBot)
- **CloudStorage sync** - Sync between devices automatically
- **Haptic feedback** - Touch feedback on mobile
- **Share gardens** - Send beautiful garden screenshots
- **Telegram Stars** - Premium features and gifts
- **Native integration** - Works seamlessly in Telegram

### Quick Telegram Setup

1. **Create environment file** `.env.local` (for local development):

   ```env
   VITE_TELEGRAM_BOT_TOKEN=8300088116:AAGnsuXBd1eP3vChaxPOIpxCOQxKDANE-zU
   VITE_TELEGRAM_BOT_USERNAME=KiraKiraGardenBot
   VITE_APP_URL=http://localhost:3000
   ```

2. **Auto-configure the bot**:

   ```bash
   npm run setup-bot
   ```

3. **Set up HTTPS for testing**:

   ```bash
   npx ngrok http 3000
   # Copy the HTTPS URL (e.g. https://abc123.ngrok-free.app)
   ```

4. **Configure Mini App in BotFather**:
   - Open [@BotFather](https://t.me/BotFather)
   - Send `/mybots` → Select your bot → `Configure Mini App`
   - Enter your ngrok HTTPS URL

5. **Test it!** Open [@KiraKiraGardenBot](https://t.me/KiraKiraGardenBot)

### 🚀 Already have Vercel project? (kirakira-theta.vercel.app)

1. **Add Environment Variables** in [Vercel Dashboard](https://vercel.com/dashboard):

   ```
   VITE_TELEGRAM_BOT_TOKEN = 8300088116:AAGnsuXBd1eP3vChaxPOIpxCOQxKDANE-zU
   VITE_TELEGRAM_BOT_USERNAME = KiraKiraGardenBot
   VITE_APP_URL = https://kirakira-theta.vercel.app
   ```

2. **Redeploy** your project in Vercel

3. **Configure production bot**:

   ```bash
   npm run setup-bot:prod https://kirakira-theta.vercel.app
   ```

4. **Set Mini App URL** in [@BotFather](https://t.me/BotFather): `https://kirakira-theta.vercel.app`

📚 **Documentation**: [Quick Start](./docs/QUICK_START.md) | [Full Integration Guide](./docs/TELEGRAM_INTEGRATION.md) | [Vercel Setup](./docs/VERCEL_SETUP.md)

## 📱 Features

- **Mood Tracking** - Daily emotional check-ins with beautiful UI
- **Digital Garden** - Your emotions become unique plants and elements
- **PWA Support** - Install on any device, works offline
- **Privacy First** - All data stored locally on your device
- **Framer Motion** - Smooth, physics-based animations
- **TypeScript** - Strict typing for reliability
- **Mobile Optimized** - Touch-friendly interface

## 🛠 Tech Stack

- **React 18** + **TypeScript** - Modern React with hooks
- **Vite** - Fast development and building
- **Framer Motion** - Declarative animations
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **PWA** - Service worker and offline support

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Basic UI primitives
│   ├── garden/         # Garden-specific components
│   └── mood/           # Mood tracking components
├── hooks/              # Custom React hooks
├── stores/             # Zustand stores
├── utils/              # Pure utility functions
├── types/              # TypeScript definitions
├── pages/              # Page components
└── styles/             # Global styles
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Lint code
npm run type-check # TypeScript type checking
```

### Environment Variables

Create `.env.local` for configuration:

```bash
# Telegram Mini App (recommended)
VITE_TELEGRAM_BOT_TOKEN=8300088116:AAGnsuXBd1eP3vChaxPOIpxCOQxKDANE-zU
VITE_TELEGRAM_BOT_USERNAME=KiraKiraGardenBot
VITE_APP_URL=http://localhost:3000

# Optional Supabase integration (advanced)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🌱 How It Works

1. **Daily Check-in** - Users select their current mood
2. **Element Generation** - Mood influences plant type and characteristics
3. **Garden Growth** - New elements appear based on mood patterns
4. **Visual Journey** - Garden becomes a personal emotional landscape

## 🎨 Design Principles

- **Minimalist** - Clean, uncluttered interface
- **Calming** - Soft colors and gentle animations
- **Accessible** - High contrast, keyboard navigation
- **Mobile-First** - Touch-friendly interactions

## 📱 PWA Features

- Install to home screen
- Offline functionality
- Push notifications (optional)
- Native app experience

## 🔒 Privacy & Security

- **Local Storage** - Data stays on your device
- **No Tracking** - No analytics or behavioral monitoring
- **Anonymous** - No personal information required
- **Optional Cloud Sync** - Via Supabase (user choice)

## 🧪 Testing

```bash
npm run test          # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards in `.cursor/rules/project-rules.mdc`
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- **Framer Motion** - Beautiful animations
- **React Team** - Amazing framework
- **Tailwind CSS** - Utility-first styling
- **The meditation community** - Inspiration

---

**Created with 🌸 for mental wellness and digital mindfulness**

_KiraKira - Where emotions bloom into beauty_
