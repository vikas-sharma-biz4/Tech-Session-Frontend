# Auth Module - Frontend

A modern, responsive authentication frontend built with React, TypeScript, Redux Toolkit, and Mario-themed UI.

## 🚀 Features

- ✅ User Registration with OTP Verification
- ✅ User Login
- ✅ Google OAuth Integration
- ✅ Password Reset with OTP
- ✅ Protected Routes
- ✅ Redux State Management
- ✅ Lazy Loading for Performance
- ✅ Form Validation with Yup
- ✅ React Hook Form Integration
- ✅ Mario-themed UI Design
- ✅ Responsive Design
- ✅ TypeScript Support

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   
   Create a `.env` file in the `frontend/` directory (optional):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```
   
   Note: The app uses a proxy configured in `package.json` by default.

## 🎮 Running the Application

### Development Mode
```bash
npm start
```

The application will open at `http://localhost:3000`

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Running Tests
```bash
npm test
```

## 🎨 Pages & Routes

- `/login` - User login page
- `/signup` - User registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset with OTP
- `/auth/callback` - OAuth callback handler
- `/dashboard` - Protected dashboard (requires authentication)
- `/` - Redirects to dashboard

## 🎯 Key Components

### Pages
- **Login** - Login form with Google OAuth button
- **Signup** - Registration form with OTP verification
- **ForgotPassword** - Two-step password reset (email → OTP)
- **ResetPassword** - Password reset with OTP verification
- **Dashboard** - Protected user dashboard
- **OAuthCallback** - Handles OAuth redirects

### Components
- **Navbar** - Navigation bar with logout
- **ProtectedRoute** - Route guard for authenticated routes
- **LoadingSpinner** - Loading indicator for lazy-loaded components

### State Management

#### Redux Store
- **authSlice** - Authentication state and actions
  - `checkAuth` - Verify existing token
  - `login` - User login
  - `signup` - User registration
  - `verifySignupOTP` - Verify signup OTP
  - `forgotPassword` - Request password reset OTP
  - `verifyOTP` - Verify OTP
  - `resetPasswordWithOTP` - Reset password with OTP
  - `handleOAuthCallback` - Handle OAuth authentication
  - `logout` - User logout

#### Selectors
- `selectUser` - Get current user
- `selectIsAuthenticated` - Check authentication status
- `selectLoading` - Get loading state
- `selectError` - Get error message

## 🎨 UI Theme

The application features a **Mario game-themed** design with:
- Light, playful colors (red, blue, yellow, green)
- Comic Sans MS font family
- Bold text shadows
- Rounded corners and borders
- Game-inspired styling

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Application entry point
│   ├── index.css           # Global styles (Mario theme)
│   ├── components/
│   │   ├── LoadingSpinner.tsx
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Login.tsx
│   │   ├── OAuthCallback.tsx
│   │   ├── ResetPassword.tsx
│   │   └── Signup.tsx
│   ├── services/
│   │   └── api.ts          # Axios API client
│   ├── store/
│   │   ├── index.ts        # Redux store configuration
│   │   ├── hooks.ts        # Typed Redux hooks
│   │   ├── selectors.ts    # Redux selectors
│   │   └── slices/
│   │       └── authSlice.ts # Authentication slice
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── package.json
└── tsconfig.json
```

## 🔧 Technologies Used

- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management
- **React Redux** - Redux bindings for React
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form management
- **Yup** - Schema validation
- **Axios** - HTTP client
- **@hookform/resolvers** - Form validation resolvers

## 📦 Dependencies

### Production
- `react` - React library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `@reduxjs/toolkit` - Redux Toolkit
- `react-redux` - React Redux bindings
- `axios` - HTTP client
- `react-hook-form` - Form handling
- `yup` - Validation schema
- `@hookform/resolvers` - Form validation resolvers

### Development
- `typescript` - TypeScript compiler
- `@types/react` - React TypeScript types
- `@types/react-dom` - React DOM TypeScript types
- `@types/node` - Node.js TypeScript types

## 🔌 API Integration

The frontend communicates with the backend API through:

- **Base URL**: Configured via proxy (`/api`) or `REACT_APP_API_URL`
- **Authentication**: JWT tokens stored in localStorage
- **Axios Interceptors**: Automatically add auth tokens and handle 401 errors

### API Service

Located in `src/services/api.ts`:
- Automatic token injection
- Error handling
- Request/response interceptors

## 🎮 User Flows

### Registration Flow
1. User fills signup form
2. OTP sent to email
3. User enters OTP
4. Account verified → Welcome email sent
5. User redirected to dashboard

### Login Flow
1. User enters credentials OR clicks Google OAuth
2. JWT token received
3. Token stored in localStorage
4. User redirected to dashboard

### Password Reset Flow
1. User requests password reset
2. OTP sent to email
3. User enters OTP and new password
4. Password reset → Redirect to login

## 🎨 Styling

The application uses:
- **Mario-themed CSS** in `index.css`
- **Inline styles** for dynamic components
- **Responsive design** with media queries
- **Gradient backgrounds** and bold colors
- **Playful fonts** (Comic Sans MS)

## 🚀 Performance Optimizations

- **Lazy Loading**: All page components use `React.lazy()`
- **Code Splitting**: Automatic code splitting with Suspense
- **Redux Optimization**: Efficient state management
- **Memoization**: React optimization patterns

## 🔒 Security Features

- **Protected Routes**: Authentication required for dashboard
- **Token Storage**: Secure localStorage usage
- **Automatic Logout**: On 401 errors
- **Input Validation**: Client-side validation with Yup

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Check browser console for network errors
- Verify proxy configuration in `package.json`

### OAuth Redirect Issues
- Ensure `FRONTEND_URL` matches in backend `.env`
- Check OAuth callback route is accessible
- Verify Google OAuth credentials

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

MIT License

## 👨‍💻 Author

Vikas Sharma

