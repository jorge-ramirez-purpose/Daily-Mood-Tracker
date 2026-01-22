# Week 2 Checklist: Cloud Sync Implementation (BYOS)

## Overview

Week 2 focuses on implementing "Bring Your Own Storage" (BYOS) cloud sync, allowing users to sync their mood data across devices using their own Google Drive or Dropbox account.

**Why BYOS?** Your mood data stays in YOUR cloud storage - we never store it on our servers. This means better privacy and no legal headaches.

---

## Prerequisites

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Mood Tracker")
3. Enable the **Google Drive API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google Drive API" → Enable
4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
     - `https://your-app.vercel.app` (production)
   - No redirect URIs needed (we use popup flow)
5. Configure OAuth consent screen:
   - User type: External
   - App name, email, etc.
   - Scopes: Add `https://www.googleapis.com/auth/drive.appdata`
   - **Note**: `drive.appdata` is non-sensitive, so no app verification needed!
6. Copy your **Client ID** to `.env`:
   ```bash
   VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

### Dropbox Setup

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose:
   - API: Scoped access
   - Access type: App folder (only your app's folder)
   - Name: "Mood Tracker" (or similar)
4. In app settings:
   - Add redirect URI: `http://localhost:5173/auth/dropbox/callback`
   - Add production URI when ready
5. Copy your **App key** to `.env`:
   ```bash
   VITE_DROPBOX_CLIENT_ID=your-app-key
   ```

### Install Dependencies

```bash
cd client
npm install dropbox
```

---

## Week 2 Tasks

### Task 1: Storage Provider Interface
- [ ] Create `client/src/lib/storage/types.ts`
- [ ] Define `StorageProvider` interface
- [ ] Define `CloudSyncState` type

### Task 2: Google Drive Provider
- [ ] Create `client/src/lib/storage/googleDrive.ts`
- [ ] Create `client/src/types/google.d.ts` (type declarations)
- [ ] Implement OAuth popup flow with Google Identity Services
- [ ] Implement `load()` and `save()` using Drive API
- [ ] Test: Connect → Save → Load → Disconnect

### Task 3: Dropbox Provider
- [ ] Create `client/src/lib/storage/dropbox.ts`
- [ ] Implement PKCE OAuth flow
- [ ] Create callback route handler
- [ ] Implement `load()` and `save()` using Dropbox SDK
- [ ] Test: Connect → Save → Load → Disconnect

### Task 4: Sync Hook
- [ ] Create `client/src/hooks/useCloudSync.ts`
- [ ] Implement provider state management
- [ ] Implement merge strategy (local wins, keep remote-only)
- [ ] Auto-restore provider on app load

### Task 5: Settings UI
- [ ] Create `client/src/components/CloudSyncSettings.tsx`
- [ ] Add provider selection buttons
- [ ] Add sync status indicator
- [ ] Add "Sync Now" and "Disconnect" buttons
- [ ] Integrate into existing settings/menu

### Task 6: Integration
- [ ] Update `App.tsx` to use `useCloudSync` hook
- [ ] Add sync on entry change (debounced)
- [ ] Add sync indicator to header
- [ ] Handle offline gracefully

---

## File Structure (After Week 2)

```
client/src/
├── lib/
│   └── storage/
│       ├── types.ts           # Interfaces
│       ├── googleDrive.ts     # Google Drive provider
│       └── dropbox.ts         # Dropbox provider
├── hooks/
│   └── useCloudSync.ts        # Sync state management
├── components/
│   └── CloudSyncSettings.tsx  # Settings UI
├── types/
│   └── google.d.ts            # Google API type declarations
└── App.tsx                    # Updated with sync integration
```

---

## Verification Checklist

After completing Week 2, verify:

### Google Drive
- [ ] "Connect Google Drive" button shows OAuth popup
- [ ] After auth, shows "Connected to Google Drive"
- [ ] Adding a mood entry and clicking "Sync Now" succeeds
- [ ] Opening app on another device/browser with same Google account shows synced data
- [ ] "Disconnect" clears connection and token

### Dropbox
- [ ] "Connect Dropbox" redirects to Dropbox auth page
- [ ] After auth, redirects back and shows "Connected to Dropbox"
- [ ] Sync works same as Google Drive
- [ ] Data appears in Dropbox at `/Apps/YourAppName/mood-tracker-data.json`

### Edge Cases
- [ ] App works offline (uses localStorage)
- [ ] Reconnecting to internet allows sync to continue
- [ ] Switching providers disconnects old one first

---

## Environment Variables

Create/update `client/.env`:

```bash
# Google Drive OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Dropbox OAuth
VITE_DROPBOX_CLIENT_ID=your-dropbox-app-key
```

Update `client/.env.example` with same structure (without real values).

---

## Useful Commands

```bash
# Start Vite dev server
cd client && npm run dev

# Build for production
cd client && npm run build

# Type check
cd client && npx tsc --noEmit
```

---

## Troubleshooting

### "popup_closed_by_user" (Google)
- User closed the OAuth popup before completing
- Just try again

### "redirect_uri_mismatch" (Dropbox)
- Redirect URI in code doesn't match Dropbox App Console
- Make sure both are exactly: `http://localhost:5173/auth/dropbox/callback`

### "Not connected" errors
- Token may have expired
- Try disconnecting and reconnecting

### Data not syncing
- Check browser console for errors
- Verify provider is actually connected (`isConnected()`)
- Try manual "Sync Now"

---

## What's NOT in Week 2

These are intentionally deferred:

- ❌ Server-side storage (not needed for BYOS)
- ❌ User accounts/authentication (providers handle this)
- ❌ Database setup (not needed)
- ❌ NextAuth configuration (not needed)
- ❌ iCloud support (no public API available)

---

## Next Steps (Week 3+)

- Auto-sync on app focus/visibility change
- Conflict resolution UI for rare edge cases
- Sync status in notification/toast
- Optional: End-to-end encryption layer

---

**Ready to start?** Begin with Task 1 (Storage Provider Interface) - it's the foundation everything else builds on!
