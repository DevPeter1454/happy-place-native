# Happy Place

Happy Place is a serene and personal mobile application built with React Native and Expo. It provides users with a digital sanctuary to track their daily prayers, write journal entries, and reflect on their personal growth in a beautiful, calm interface.

## Features

- **Personal Dashboard**: A welcoming home screen with quick actions, daily quotes, and at-a-glance statistics.
- **Prayer Tracker**: An interactive calendar to log and visualize your daily prayers and consistency.
- **Journaling**: Write, save, and review your daily reflections with options to mark favorites and add photos.
- **Calming UI/UX**: Designed with a bespoke theme utilizing warm neutrals, elegant serif typography (`Playfair Display`), and smooth animations powered by `moti`.
- **Authentication**: A beautifully designed onboarding and login flow.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/)
- **Navigation**: [React Navigation (Native Stack & Bottom Tabs)](https://reactnavigation.org/)
- **Animations**: [Moti](https://moti.fyi/) (built on Reanimated)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (for macOS) or Android Emulator

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd happy-place-native
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm run start
   ```

4. To run on a specific platform:
   - **iOS**: Press `i` in the terminal, or run `npm run ios`.
   - **Android**: Press `a` in the terminal, or run `npm run android`.

## Project Structure

- `src/components/`: Reusable UI elements (Buttons, Cards, Inputs).
- `src/navigation/`: App routing and navigators (Root, Auth, Tabs).
- `src/screens/`: Main view components (Dashboard, Journal, Login, etc.).
- `src/theme/`: Centralized design system (Colors, Fonts, Spacing).

## License

This project is proprietary and confidential.
