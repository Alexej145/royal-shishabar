---
description: Repository Information Overview
alwaysApply: true
---

# Royal Shisha Bar Information

## Summary

A modern, responsive website for a premium hookah bar in Germany featuring user authentication, menu display, live announcements, reviews, events tracking, and integrations for table reservations. Built with React, TypeScript, and Firebase.

## Structure

- **src/**: Main source code with React components, services, and utilities
  - **components/**: UI components organized by feature (admin, auth, common, events, etc.)
  - **pages/**: Page-level components (Home, Admin, Auth, Menu, etc.)
  - **services/**: Service modules for API interactions (auth, menu, orders, etc.)
  - **stores/**: Zustand state management stores
  - **hooks/**: Custom React hooks
  - **contexts/**: React context providers
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions
- **public/**: Static assets and resources
- **scripts/**: Utility scripts for video optimization and favicon generation
- **dataconnect/**: GraphQL schema and connector configurations

## Language & Runtime

**Language**: TypeScript
**Version**: TypeScript 5.0.2
**Framework**: React 18.2.0
**Build System**: Vite 4.4.5
**Package Manager**: npm

## Dependencies

**Main Dependencies**:

- Firebase 11.10.0 (Authentication, Firestore, Storage)
- React Router 6.8.1 (Routing)
- Zustand 4.4.1 (State management)
- Framer Motion 10.16.4 (Animations)
- React Hot Toast 2.5.2 (Notifications)
- Date-fns 4.1.0 (Date utilities)
- JSPdf 3.0.1 (PDF generation)

**Development Dependencies**:

- Vitest 3.2.4 (Testing)
- Testing Library (React testing)
- ESLint 8.45.0 (Linting)
- Tailwind CSS 3.3.0 (Styling)
- TypeScript ESLint (Type checking)

## Build & Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Firebase Integration

**Configuration**: Firebase app with Authentication, Firestore, and Storage
**Services**:

- Authentication (Email/password, Social login ready)
- Firestore Database (Menu, Orders, Reservations)
- Storage (Images, Videos)
  **Deployment**:

```bash
npm run firebase:deploy
```

## Testing

**Framework**: Vitest with Testing Library
**Test Location**: src/test/
**Configuration**: Configured in vite.config.ts
**Run Command**:

```bash
npm run test       # Interactive mode
npm run test:run   # Run all tests
npm run test:coverage # Generate coverage report
```

## Deployment

**Platform**: Vercel
**Configuration**: vercel.json with custom headers and SPA routing
**Build Command**: npm run build
**Output Directory**: dist/
**Environment Variables**:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

## Security

**Tools**:

- Snyk for vulnerability scanning
- npm audit for dependency checks
  **Commands**:

```bash
npm run security:test    # Run security tests
npm run security:monitor # Monitor for vulnerabilities
npm run security:audit   # Run full security audit
```
