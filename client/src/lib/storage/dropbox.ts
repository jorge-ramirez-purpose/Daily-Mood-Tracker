import { Dropbox, DropboxAuth } from "dropbox";
import type { StorageProvider } from "./types";
import type { EntriesMap } from "../../utils/types";

const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID as string;
const DATA_FILE_PATH = "/mood-tracker-data.json";

const TOKEN_KEY = "mood-tracker.dropbox.token";
const CODE_VERIFIER_KEY = "mood-tracker.dropbox.verifier";

export class DropboxProvider implements StorageProvider {
  readonly name = "dropbox" as const;
  readonly displayName = "Dropbox";

  private dbxAuth: DropboxAuth;
  private dbx: Dropbox | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
    this.dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });
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
    const redirectUri = `${window.location.origin}/auth/dropbox/callback`;
    const authUrl = await this.dbxAuth.getAuthenticationUrl(
      redirectUri,
      undefined,
      "code",
      "offline",
      undefined,
      undefined,
      true // usePKCE
    );
    const codeVerifier = this.dbxAuth.getCodeVerifier();
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    window.location.href = authUrl.toString();
  }

  async handleAuthCallback(code: string): Promise<void> {
    const redirectUri = `${window.location.origin}/auth/dropbox/callback`;
    const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    if (!codeVerifier) throw new Error("Missing PKCE code verifier");

    this.dbxAuth.setCodeVerifier(codeVerifier);
    const response = await this.dbxAuth.getAccessTokenFromCode(redirectUri, code);
    const result = response.result as { access_token: string };
    const accessToken = result.access_token;

    localStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    this.dbxAuth.setAccessToken(accessToken);
    this.dbx = new Dropbox({ auth: this.dbxAuth });
  }

  disconnect(): void {
    this.dbxAuth.setAccessToken("");
    this.dbx = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  async load(): Promise<EntriesMap> {
    if (!this.dbx) throw new Error("Not connected to Dropbox");

    try {
      const response = await this.dbx.filesDownload({ path: DATA_FILE_PATH });
      const blob = (response.result as { fileBlob: Blob }).fileBlob;
      const text = await blob.text();
      this.lastSyncTime = new Date();
      return JSON.parse(text) as EntriesMap;
    } catch (error: unknown) {
      const err = error as { error?: { error?: { ".tag"?: string; path?: { ".tag"?: string } } } };
      if (err?.error?.error?.[".tag"] === "path" && err?.error?.error?.path?.[".tag"] === "not_found") {
        return {};
      }
      throw error;
    }
  }

  async save(entries: EntriesMap): Promise<void> {
    if (!this.dbx) throw new Error("Not connected to Dropbox");

    await this.dbx.filesUpload({
      path: DATA_FILE_PATH,
      contents: JSON.stringify(entries, null, 2),
      mode: { ".tag": "overwrite" },
    });

    this.lastSyncTime = new Date();
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}
