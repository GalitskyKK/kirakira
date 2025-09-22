# 🌸 KiraKira - Emotional Garden

> Transform your daily emotions into a beautiful digital garden. A mindful PWA for emotional wellness and self-reflection.

[![Demo](https://img.shields.io/badge/🌸_Try_Demo-Live_App-pink?style=for-the-badge)](https://kirakira-theta.vercel.app)
[![Telegram](https://img.shields.io/badge/📱_Telegram-Mini_App-blue?style=for-the-badge)](https://t.me/KiraKiraGardenBot)

## ✨ What is KiraKira?

KiraKira is a meditative application that helps you **track your emotions** by transforming them into a **beautiful digital garden**. Each mood becomes a unique plant, crystal, or garden element, creating a personalized emotional landscape that grows with you over time.

### 🎯 Key Features

- **🌱 Emotion Tracking** - Daily mood check-ins with intuitive interface
- **🌸 Visual Transformation** - Watch emotions bloom into beautiful garden elements
- **📱 Progressive Web App** - Works offline, installs like native app
- **🤖 Telegram Integration** - Full Mini App experience in Telegram
- **🎨 Beautiful Animations** - Smooth Framer Motion interactions
- **🔒 Privacy First** - All data stored locally (with optional cloud sync)
- **⭐ Premium Features** - Enhanced elements via Telegram Stars

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/kirakira.git
cd kirakira

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Telegram Mini App

Experience KiraKira natively in Telegram with enhanced features:

- **Seamless Integration** - No app switching needed
- **Cloud Synchronization** - Automatic sync across devices
- **Haptic Feedback** - Native mobile interactions
- **Share & Invite** - Send garden screenshots to friends
- **Premium Shop** - Purchase exclusive elements with Telegram Stars

### Setup Telegram Integration

1. **Create your bot** with [@BotFather](https://t.me/BotFather)

2. **Configure environment** in `.env.local`:

   ```env
   VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
   VITE_TELEGRAM_BOT_USERNAME=your_bot_username
   VITE_APP_URL=http://localhost:3000
   ```

3. **Setup bot automatically**:

   ```bash
   npm run setup-bot
   ```

4. **Configure Mini App URL** in BotFather with your deployment URL

📖 **Detailed guides**: [Telegram Setup](./docs/TELEGRAM_INTEGRATION.md) | [Vercel Deployment](./docs/VERCEL_SETUP.md) | [Quick Start](./docs/QUICK_START.md)

## 🌟 How It Works

1. **🧠 Daily Check-in** - Select your current emotional state from intuitive mood options
2. **🎨 Element Generation** - Each emotion transforms into a unique garden element based on mood mapping
3. **🌱 Garden Evolution** - Watch your personal landscape grow and change over time
4. **📊 Emotional Insights** - Discover patterns in your emotional journey through visual analytics

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Animations**: Framer Motion (60fps smooth animations)
- **State**: Zustand (lightweight & fast)
- **PWA**: Workbox + Service Workers
- **Integration**: Telegram Mini Apps API
- **Testing**: Vitest + React Testing Library

## 📂 Architecture

```
src/
├── components/          # React component library
│   ├── ui/             # Reusable UI primitives
│   ├── garden/         # Garden visualization components
│   ├── mood/           # Emotion tracking interface
│   └── telegram/       # Telegram-specific features
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── utils/              # Pure utility functions
├── types/              # TypeScript definitions
└── assets/             # Static resources
```

## 🔧 Development Setup

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- Optional: **Telegram Bot** for Mini App features

### Available Scripts

```bash
npm run dev          # Development server with HMR
npm run build        # Production build + optimization
npm run preview      # Preview production build locally
npm run test         # Run unit tests with Vitest
npm run lint         # ESLint code analysis
npm run type-check   # TypeScript validation
npm run setup-bot    # Auto-configure Telegram bot
```

### Environment Configuration

Create `.env.local` for local development:

```bash
# Telegram Mini App Integration (optional)
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_APP_URL=http://localhost:3000

# Optional: Supabase for advanced analytics
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ **Security Note**: Never commit tokens to version control. Use environment variables in production.

## 🎨 Design Philosophy

- **🧘 Mindful UX** - Calming colors, gentle animations, stress-free interactions
- **♿ Accessibility** - WCAG 2.1 compliant, keyboard navigation, screen reader support
- **📱 Mobile-First** - Touch-optimized interface, responsive design, PWA capabilities
- **⚡ Performance** - <3s load time, 60fps animations, optimized bundle size

## 🔒 Privacy & Security

- **🏠 Local-First** - All emotion data stored locally on user's device
- **🚫 No Tracking** - Zero analytics, no behavioral monitoring, no ads
- **🔐 Anonymous** - No personal information required or collected
- **☁️ Optional Sync** - User chooses whether to enable cloud synchronization
- **🛡️ Secure** - HTTPS-only, Content Security Policy, secure token handling

## 📊 Performance Metrics

- **Bundle Size**: ~500KB gzipped (optimized with code splitting)
- **First Paint**: <1.5s on 3G networks
- **Interactive**: <3s time to interactive
- **PWA Score**: 100/100 on Lighthouse
- **Accessibility**: AAA compliant

## 🧪 Testing

```bash
npm run test              # Unit tests with Vitest
npm run test:coverage     # Coverage reports
npm run test:ui          # Visual test runner
npm run e2e              # End-to-end testing
```

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Add environment variables in dashboard
3. Deploy automatically on push

### Other Platforms

- **Netlify**: Drag & drop `dist/` folder
- **Firebase**: `firebase deploy`
- **Static Hosting**: Any service supporting SPAs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** coding standards and add tests
4. **Submit** a pull request with detailed description

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **🎨 Design Inspiration**: Japanese garden aesthetics, mindfulness apps
- **💻 Technology**: React team, Framer Motion, Tailwind CSS community
- **🧠 Mental Health**: Therapy community, mindfulness practitioners
- **🤖 Telegram**: Mini Apps platform and development tools

---

<div align="center">

**🌸 Built with care for mental wellness and emotional awareness**

[🌐 Live Demo](https://kirakira-theta.vercel.app) • [📱 Telegram Bot](https://t.me/KiraKiraGardenBot) • [📖 Documentation](./docs/)

_KiraKira - Where emotions bloom into beauty_ ✨

</div>
