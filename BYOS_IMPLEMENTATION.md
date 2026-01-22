# Bring Your Own Storage (BYOS) Implementation Guide

This document details how to implement cross-device sync using the user's own cloud storage.

## Overview

Instead of storing user mood data on our servers, users connect their own Google Drive or Dropbox account. Data syncs directly between their devices and their personal cloud storage.

**Benefits:**
- Zero server-side data storage
- No GDPR/privacy compliance burden
- Users own and control their data
- No database hosting costs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App Component                         │
├─────────────────────────────────────────────────────────────┤
│                      useStorage Hook                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ - entries: EntriesMap                                  │  │
│  │ - provider: StorageProvider | null                     │  │
│  │ - syncStatus: 'idle' | 'syncing' | 'synced' | 'error' │  │
│  │ - connect(provider): Promise<void>                     │  │
│  │ - disconnect(): void                                   │  │
│  │ - sync(): Promise<void>                                │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                 StorageProvider Interface                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ LocalStorage │  │ GoogleDrive  │  │   Dropbox    │       │
│  │   Provider   │  │   Provider   │  │   Provider   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Storage Provider Interface

### File: `client/src/lib/storage/types.ts`

```typescript
import type { EntriesMap } from '../../utils/types';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface StorageProvider {
  /** Provider identifier */
  readonly name: 'localStorage' | 'googleDrive' | 'dropbox';

  /** Display name for UI */
  readonly displayName: string;

  /** Check if provider is connected/authenticated */
  isConnected(): boolean;

  /** Initiate OAuth flow or connection */
  connect(): Promise<void>;

  /** Disconnect and clear tokens */
  disconnect(): void;

  /** Load all entries from storage */
  load(): Promise<EntriesMap>;

  /** Save all entries to storage */
  save(entries: EntriesMap): Promise<void>;

  /** Get last sync timestamp */
  getLastSyncTime(): Date | null;
}

export interface CloudSyncState {
  provider: StorageProvider | null;
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
}
```

---

## Phase 2: Google Drive Provider

### Prerequisites

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev)
   - `https://your-domain.vercel.app` (production)

### Scope

We use the `drive.appdata` scope which:
- Creates a hidden "Application Data" folder in user's Drive
- Only our app can read/write this folder
- User cannot see this folder in Drive UI
- **Non-sensitive scope** = no Google app verification needed

### File: `client/src/lib/storage/googleDrive.ts`

```typescript
import type { StorageProvider } from './types';
import type { EntriesMap } from '../../utils/types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DATA_FILE_NAME = 'mood-tracker-data.json';

// Token storage keys
const TOKEN_KEY = 'mood-tracker.google.token';
const TOKEN_EXPIRY_KEY = 'mood-tracker.google.expiry';

export class GoogleDriveProvider implements StorageProvider {
  readonly name = 'googleDrive' as const;
  readonly displayName = 'Google Drive';

  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private accessToken: string | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
    // Restore token from localStorage if not expired
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (storedToken && expiry && Date.now() < parseInt(expiry)) {
      this.accessToken = storedToken;
    }
  }

  isConnected(): boolean {
    return this.accessToken !== null;
  }

  async connect(): Promise<void> {
    // Load Google Identity Services library
    await this.loadGisScript();
    await this.loadGapiScript();

    return new Promise((resolve, reject) => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          this.accessToken = response.access_token;

          // Store token with 1 hour expiry
          const expiry = Date.now() + (response.expires_in * 1000);
          localStorage.setItem(TOKEN_KEY, response.access_token);
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());

          // Initialize GAPI client
          gapi.client.setToken({ access_token: response.access_token });

          resolve();
        },
      });

      // Request token (opens popup)
      this.tokenClient.requestAccessToken();
    });
  }

  disconnect(): void {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken);
    }
    this.accessToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  async load(): Promise<EntriesMap> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    // Find existing file
    const fileId = await this.findDataFile();

    if (!fileId) {
      return {}; // No data yet
    }

    // Download file content
    const response = await gapi.client.drive.files.get({
      fileId,
      alt: 'media',
    });

    this.lastSyncTime = new Date();
    return JSON.parse(response.body);
  }

  async save(entries: EntriesMap): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    const content = JSON.stringify(entries);
    const fileId = await this.findDataFile();

    if (fileId) {
      // Update existing file
      await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        body: content,
      });
    } else {
      // Create new file
      const metadata = {
        name: DATA_FILE_NAME,
        parents: ['appDataFolder'],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'application/json' }));

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form,
      });
    }

    this.lastSyncTime = new Date();
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  private async findDataFile(): Promise<string | null> {
    const response = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      q: `name = '${DATA_FILE_NAME}'`,
      fields: 'files(id)',
    });

    const files = response.result.files;
    return files && files.length > 0 ? files[0].id! : null;
  }

  private loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined' && gapi.client) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('client', async () => {
          await gapi.client.init({});
          await gapi.client.load('drive', 'v3');
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}
```

### Type Declarations

Create `client/src/types/google.d.ts`:

```typescript
declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(): void;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    error?: string;
  }

  function initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }): TokenClient;

  function revoke(token: string): void;
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;

  namespace client {
    function init(config: object): Promise<void>;
    function load(api: string, version: string): Promise<void>;
    function setToken(token: { access_token: string }): void;
    function request(config: {
      path: string;
      method: string;
      params?: object;
      body?: string;
    }): Promise<any>;

    namespace drive.files {
      function list(params: object): Promise<{ result: { files?: { id?: string }[] } }>;
      function get(params: { fileId: string; alt?: string }): Promise<{ body: string }>;
    }
  }
}
```

---

## Phase 3: Dropbox Provider

### Prerequisites

1. Create an app at [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps)
2. Choose "Scoped access" and "App folder" access type
3. Add redirect URI: `http://localhost:5173/auth/dropbox/callback`
4. Get your App Key (client ID)

### File: `client/src/lib/storage/dropbox.ts`

```typescript
import { Dropbox, DropboxAuth } from 'dropbox';
import type { StorageProvider } from './types';
import type { EntriesMap } from '../../utils/types';

const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/dropbox/callback`;
const DATA_FILE_PATH = '/mood-tracker-data.json';

// Storage keys
const TOKEN_KEY = 'mood-tracker.dropbox.token';
const CODE_VERIFIER_KEY = 'mood-tracker.dropbox.verifier';

export class DropboxProvider implements StorageProvider {
  readonly name = 'dropbox' as const;
  readonly displayName = 'Dropbox';

  private dbxAuth: DropboxAuth;
  private dbx: Dropbox | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
    this.dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });

    // Restore token from localStorage
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      this.dbxAuth.setAccessToken(storedToken);
      this.dbx = new Dropbox({ auth: this.dbxAuth });
    }
  }

  isConnected(): boolean {
    return this.dbx !== null;
  }

  async connect(): Promise<void> {
    // Generate PKCE code verifier and challenge
    const authUrl = await this.dbxAuth.getAuthenticationUrl(
      REDIRECT_URI,
      undefined, // state
      'code',
      'offline', // token_access_type for refresh tokens
      undefined, // scope
      undefined, // include_granted_scopes
      true // usePKCE
    );

    // Store code verifier for after redirect
    const codeVerifier = this.dbxAuth.getCodeVerifier();
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

    // Redirect to Dropbox auth
    window.location.href = authUrl.toString();
  }

  /**
   * Call this from your callback route handler
   */
  async handleAuthCallback(code: string): Promise<void> {
    const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    this.dbxAuth.setCodeVerifier(codeVerifier);
    const response = await this.dbxAuth.getAccessTokenFromCode(REDIRECT_URI, code);

    const accessToken = response.result.access_token;
    localStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.removeItem(CODE_VERIFIER_KEY);

    this.dbxAuth.setAccessToken(accessToken);
    this.dbx = new Dropbox({ auth: this.dbxAuth });
  }

  disconnect(): void {
    this.dbxAuth.setAccessToken('');
    this.dbx = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  async load(): Promise<EntriesMap> {
    if (!this.dbx) {
      throw new Error('Not connected to Dropbox');
    }

    try {
      const response = await this.dbx.filesDownload({ path: DATA_FILE_PATH });
      const blob = (response.result as any).fileBlob as Blob;
      const text = await blob.text();

      this.lastSyncTime = new Date();
      return JSON.parse(text);
    } catch (error: any) {
      if (error?.error?.error?.['.tag'] === 'path' &&
          error?.error?.error?.path?.['.tag'] === 'not_found') {
        return {}; // File doesn't exist yet
      }
      throw error;
    }
  }

  async save(entries: EntriesMap): Promise<void> {
    if (!this.dbx) {
      throw new Error('Not connected to Dropbox');
    }

    const content = JSON.stringify(entries, null, 2);

    await this.dbx.filesUpload({
      path: DATA_FILE_PATH,
      contents: content,
      mode: { '.tag': 'overwrite' },
    });

    this.lastSyncTime = new Date();
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}
```

---

## Phase 4: useCloudSync Hook

### File: `client/src/hooks/useCloudSync.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import type { StorageProvider, CloudSyncState, SyncStatus } from '../lib/storage/types';
import type { EntriesMap } from '../utils/types';
import { GoogleDriveProvider } from '../lib/storage/googleDrive';
import { DropboxProvider } from '../lib/storage/dropbox';

const PROVIDER_KEY = 'mood-tracker.sync.provider';

export function useCloudSync(
  localEntries: EntriesMap,
  setLocalEntries: (entries: EntriesMap) => void
) {
  const [state, setState] = useState<CloudSyncState>({
    provider: null,
    status: 'idle',
    lastSyncTime: null,
    error: null,
  });

  // Restore provider on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(PROVIDER_KEY);
    if (savedProvider === 'googleDrive') {
      const provider = new GoogleDriveProvider();
      if (provider.isConnected()) {
        setState(prev => ({ ...prev, provider }));
      }
    } else if (savedProvider === 'dropbox') {
      const provider = new DropboxProvider();
      if (provider.isConnected()) {
        setState(prev => ({ ...prev, provider }));
      }
    }
  }, []);

  const connect = useCallback(async (providerType: 'googleDrive' | 'dropbox') => {
    const provider = providerType === 'googleDrive'
      ? new GoogleDriveProvider()
      : new DropboxProvider();

    setState(prev => ({ ...prev, status: 'syncing', error: null }));

    try {
      await provider.connect();
      localStorage.setItem(PROVIDER_KEY, providerType);
      setState(prev => ({ ...prev, provider, status: 'synced' }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    state.provider?.disconnect();
    localStorage.removeItem(PROVIDER_KEY);
    setState({
      provider: null,
      status: 'idle',
      lastSyncTime: null,
      error: null,
    });
  }, [state.provider]);

  const sync = useCallback(async () => {
    if (!state.provider) return;

    setState(prev => ({ ...prev, status: 'syncing', error: null }));

    try {
      // Load remote data
      const remoteEntries = await state.provider.load();

      // Merge: local changes take precedence, but keep remote-only entries
      const merged = mergeEntries(localEntries, remoteEntries);

      // Save merged data back to cloud
      await state.provider.save(merged);

      // Update local state
      setLocalEntries(merged);

      setState(prev => ({
        ...prev,
        status: 'synced',
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [state.provider, localEntries, setLocalEntries]);

  return {
    ...state,
    connect,
    disconnect,
    sync,
    isConnected: state.provider !== null,
  };
}

/**
 * Merge local and remote entries.
 * Strategy: Local changes win, but preserve remote-only entries.
 */
function mergeEntries(local: EntriesMap, remote: EntriesMap): EntriesMap {
  const merged: EntriesMap = { ...remote };

  for (const [key, value] of Object.entries(local)) {
    // Local always wins for entries that exist locally
    merged[key] = value;
  }

  return merged;
}
```

---

## Phase 5: Settings UI Component

### File: `client/src/components/CloudSyncSettings.tsx`

```typescript
import { useCloudSync } from '../hooks/useCloudSync';
import type { EntriesMap } from '../utils/types';

interface Props {
  entries: EntriesMap;
  setEntries: (entries: EntriesMap) => void;
}

export function CloudSyncSettings({ entries, setEntries }: Props) {
  const {
    provider,
    status,
    lastSyncTime,
    error,
    connect,
    disconnect,
    sync,
    isConnected,
  } = useCloudSync(entries, setEntries);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Cloud Sync</h3>

      {!isConnected ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">
            Connect a cloud storage provider to sync your mood data across devices.
          </p>

          <button
            onClick={() => connect('googleDrive')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <GoogleDriveIcon />
            Connect Google Drive
          </button>

          <button
            onClick={() => connect('dropbox')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <DropboxIcon />
            Connect Dropbox
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Connected to <strong>{provider?.displayName}</strong>
            </span>
            <StatusBadge status={status} />
          </div>

          {lastSyncTime && (
            <p className="text-xs text-gray-500">
              Last synced: {lastSyncTime.toLocaleString()}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={sync}
              disabled={status === 'syncing'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              onClick={disconnect}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    idle: 'bg-gray-100 text-gray-600',
    syncing: 'bg-blue-100 text-blue-600',
    synced: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}

// Icon components (simplified)
function GoogleDriveIcon() {
  return <span>📁</span>; // Replace with actual SVG
}

function DropboxIcon() {
  return <span>📦</span>; // Replace with actual SVG
}
```

---

## Environment Variables

Add to `client/.env`:

```bash
# Google Drive OAuth (get from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Dropbox OAuth (get from Dropbox App Console)
VITE_DROPBOX_CLIENT_ID=your-dropbox-app-key
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `client/src/lib/storage/types.ts` with interfaces
- [ ] Create `client/src/types/google.d.ts` for Google API types
- [ ] Add environment variables to `.env` and `.env.example`

### Phase 2: Google Drive Provider
- [ ] Set up Google Cloud project and OAuth credentials
- [ ] Implement `GoogleDriveProvider` class
- [ ] Test OAuth flow in development
- [ ] Test save/load operations

### Phase 3: Dropbox Provider
- [ ] Set up Dropbox App Console credentials
- [ ] Install Dropbox SDK: `npm install dropbox`
- [ ] Implement `DropboxProvider` class
- [ ] Create callback route handler
- [ ] Test OAuth flow in development

### Phase 4: Integration
- [ ] Create `useCloudSync` hook
- [ ] Integrate with existing `App.tsx` state management
- [ ] Add `CloudSyncSettings` component to settings page
- [ ] Add sync status indicator to header

### Phase 5: Polish
- [ ] Add automatic sync on app focus
- [ ] Add offline queue for failed syncs
- [ ] Add conflict resolution UI (if needed)
- [ ] Test cross-device sync end-to-end

---

## Verification Steps

After implementation, verify:

1. **Google Drive**
   - [ ] Click "Connect Google Drive" → OAuth popup appears
   - [ ] After auth, status shows "Connected"
   - [ ] Add mood entry → click "Sync Now" → no errors
   - [ ] Open app on another device → connect same account → data appears

2. **Dropbox**
   - [ ] Click "Connect Dropbox" → redirects to Dropbox
   - [ ] After auth, returns to app with "Connected" status
   - [ ] Sync works same as Google Drive

3. **Offline**
   - [ ] Disconnect internet → app still works locally
   - [ ] Reconnect → sync catches up

---

## Security Considerations

1. **Tokens**: Stored in localStorage, cleared on disconnect
2. **Scopes**: Minimal scopes requested (only app folder access)
3. **Data**: Never passes through our servers
4. **HTTPS**: Required for OAuth (enforced by providers)
