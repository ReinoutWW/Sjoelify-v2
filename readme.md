# Sjoelify v2

![image](https://github.com/user-attachments/assets/9871c9bb-098b-4bb2-bb65-adf7bca0221c)


A modern web platform for tracking Sjoelen games and statistics. Built with Next.js, TypeScript, and Firebase.

## Features

- 🎯 Track individual Sjoelen games with raw puck counts
- 📊 View personal statistics and performance over time
- 👥 Create games with 2-5 players
- 📱 Mobile-first, responsive design
- 🔒 Secure authentication with Firebase

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query
- **Backend**: Firebase (Auth, Firestore)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- Yarn package manager
- Firebase project with Auth and Firestore enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sjoelify-v2.git
   cd sjoelify-v2
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build production bundle
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking

### Code Style

- ESLint with Airbnb TypeScript configuration
- Prettier for code formatting
- Strict TypeScript mode enabled

## License

MIT License - See LICENSE file for details
