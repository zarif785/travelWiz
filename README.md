# AI Travel Assistant

A modern, production-grade AI Travel Assistant web application built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **AI-Powered Itineraries** - Generate personalized travel plans (coming soon)
- **Smart Maps** - Interactive map integration (coming soon)
- **Flight & Hotel Search** - Find the best deals (coming soon)
- **Modern UI** - Clean, responsive design with travel aesthetic
- **Production-Ready** - Scalable architecture and TypeScript

## 🛠 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Full type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **TanStack Query** - Data fetching and caching

## 📦 Installation

```bash
# Install dependencies
npm install

# Start backend API (in another terminal)
npm run dev:server

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗 Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Footer, Layout
│   └── ui/              # Reusable UI components
├── pages/               # Page components
├── routes/              # React Router configuration
├── context/             # Context providers
├── types/               # TypeScript types
├── hooks/               # Custom hooks
├── services/            # API services
└── utils/               # Utility functions
```

## 🎨 Design System

- **Colors:** Soft blues (primary) and earth tones (neutral)
- **Typography:** Inter font family
- **Components:** Button, Card, Container, LoadingSpinner, EmptyState
- **Responsive:** Mobile-first design

## 📱 Pages

- **Home** (`/`) - Landing page with hero and features
- **Plan Trip** (`/plan`) - Trip planning interface (placeholder)
- **My Trips** (`/trips`) - Saved trips list (placeholder)
- **404** - Not found page

## 🔧 Development

The application is currently in the **foundation phase**. The core UX and app shell are complete, ready for feature implementation.

## 🤖 Itinerary API (Feature 3)

Backend endpoints:

- `POST /api/itinerary/generate`
- `POST /api/itinerary/refine`

Environment:

- Copy `.env.example` to `.env`
- Set `OPENAI_API_KEY`

Example generate request:

```json
{
  "tripProfile": {
    "id": "trip_123",
    "createdAt": "2026-02-11T08:00:00.000Z",
    "destinations": [{ "city": "Tokyo", "country": "Japan" }],
    "dateMode": "duration",
    "durationDays": 3,
    "currency": "JPY",
    "budgetTotal": 90000,
    "travelType": "sightseeing",
    "pace": "balanced",
    "interests": ["food", "museums"],
    "constraints": {
      "withKids": false,
      "mustSee": ["Senso-ji Temple"],
      "avoid": []
    },
    "companionsCount": 2,
    "preferences": {
      "walkingTolerance": 6,
      "dayStartPreference": 5,
      "comfortVsBudget": 5
    }
  }
}
```

Example response (shape):

```json
{
  "itinerary": {
    "id": "uuid",
    "tripId": "trip_123",
    "destinationSummary": "3-day Tokyo culture + food itinerary",
    "totals": {
      "estimatedTotalCost": 78000,
      "estimatedDailyAverageCost": 26000,
      "currency": "JPY"
    },
    "days": [
      {
        "dayNumber": 1,
        "morning": [],
        "afternoon": [],
        "evening": []
      }
    ],
    "places": []
  },
  "meta": {
    "model": "gpt-4.1-mini",
    "createdAt": "2026-02-11T08:10:00.000Z"
  }
}
```

### Next Steps:
1. Implement trip planning form
2. Integrate AI service for itinerary generation
3. Add map integration (Mapbox/Google Maps)
4. Set up backend API and database
5. Implement authentication
6. Add flight and hotel search

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
