# Personal Trade Strategy Tracker

A user-friendly single-page web application to log, view, and analyze trade data based on multi-timeframe strategies (Setup 1 and Setup 2).

## Features

- **Trade Logging**: Comprehensive form to log trades with all required fields
- **Auto-calculations**: Automatic calculation of P&L, R:R, and adherence status
- **Trade Journal & Analytics**: View and filter trades with advanced filtering options
- **Performance Dashboard**: Key metrics including win rate, expectancy, and adherence rate
- **Firebase Integration**: Secure cloud storage using Cloud Firestore

## Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Backend/Database**: Google Firebase (Cloud Firestore)
- **Hosting**: Firebase Hosting

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Firebase account and project created
- Firebase CLI installed (`npm install -g firebase-tools`)

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Cloud Firestore in your Firebase project
3. Get your Firebase configuration from Project Settings > General > Your apps
4. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore Security Rules

```bash
firebase login
firebase init firestore
# Select your Firebase project
# Use the existing firestore.rules file
firebase deploy --only firestore:rules
```

### 5. Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
```

This creates a static export in the `out` directory.

### 7. Deploy to Firebase Hosting

```bash
firebase init hosting
# Select your Firebase project
# Set public directory to: out
# Configure as single-page app: Yes
# Set up automatic builds: No (or Yes if using CI/CD)

firebase deploy --only hosting
```

## Project Structure

```
tracker/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page with tabs
├── components/            # React components
│   ├── TradeForm.tsx      # Trade logging form
│   ├── Dashboard.tsx      # Performance metrics
│   ├── TradeTable.tsx     # Trade display table
│   └── TradeFilters.tsx   # Filtering component
├── lib/                   # Utility functions
│   ├── firebase.ts        # Firebase initialization
│   └── trades.ts          # Trade CRUD operations
├── types/                 # TypeScript types
│   └── trade.ts           # Trade data model
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
└── firestore.indexes.json # Firestore indexes
```

## Data Model

Each trade document in Firestore contains:

- Basic Info: `asset`, `strategyId`, `direction`, `entryTime`, `exitTime`
- Pricing: `optionEntryPrice`, `optionExitPrice`, `positionSize`
- Risk Management: `initialRisk`, `initialReward`, `realizedPnL`, `realizedRR`
- Analysis: `exitReason`, `emotionalState`, `isAdherent`
- Checklist: `H1_TrendAligned`, `M15_TrendAligned`, `M05_StructureMet`, `Confirmations`, `ExitRuleFollowed`

## Security Rules

The current Firestore rules allow public read/write access. For production, you should:

1. Implement Firebase Authentication
2. Update `firestore.rules` to require authentication:
   ```
   match /trades/{tradeId} {
     allow read, write: if request.auth != null;
   }
   ```

## License

Private project for personal use.
