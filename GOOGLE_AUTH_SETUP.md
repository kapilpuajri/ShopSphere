# Google Authentication Setup Guide

## Steps to Enable Google Authentication

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application** as the application type
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:3000/`
7. Add authorized redirect URIs:
   - `http://localhost:3000`
8. Copy the **Client ID**

### 2. Configure in Frontend

Create a `.env` file in the `shopsphere-frontend` directory:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
```

Or update `App.tsx` directly with your Client ID:

```typescript
const GOOGLE_CLIENT_ID = 'your-google-client-id-here';
```

### 3. Restart the Frontend

After setting the Client ID, restart the React development server:

```bash
cd shopsphere-frontend
npm start
```

### 4. Test Google Authentication

1. Navigate to `/login` or `/register`
2. Click the "Sign in with Google" or "Sign up with Google" button
3. Select your Google account
4. You should be automatically logged in

## Notes

- The Google authentication will automatically create a user account if one doesn't exist
- Users can sign in with either email/password or Google
- Google users will have a randomly generated password (they won't need it for future logins)





