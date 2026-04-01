import type { StorageProvider } from "./types";
import type { EntriesMap } from "../../utils/types";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";
const DATA_FILE_NAME = "mood-tracker-data.json";

const TOKEN_KEY = "mood-tracker.google.token";
const TOKEN_EXPIRY_KEY = "mood-tracker.google.expiry";

export class GoogleDriveProvider implements StorageProvider {
  readonly name = "googleDrive" as const;
  readonly displayName = "Google Drive";

  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private accessToken: string | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
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
          const expiry = Date.now() + response.expires_in * 1000;
          localStorage.setItem(TOKEN_KEY, response.access_token);
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
          gapi.client.setToken({ access_token: response.access_token });
          resolve();
        },
      });
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
    if (!this.accessToken) throw new Error("Not connected to Google Drive");

    const fileId = await this.findDataFile();
    if (!fileId) return {};

    const response = await gapi.client.drive.files.get({ fileId, alt: "media" });
    this.lastSyncTime = new Date();
    return JSON.parse(response.body) as EntriesMap;
  }

  async save(entries: EntriesMap): Promise<void> {
    if (!this.accessToken) throw new Error("Not connected to Google Drive");

    const content = JSON.stringify(entries);
    const fileId = await this.findDataFile();

    if (fileId) {
      await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: "PATCH",
        params: { uploadType: "media" },
        body: content,
      });
    } else {
      const metadata = { name: DATA_FILE_NAME, parents: ["appDataFolder"] };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([content], { type: "application/json" }));
      await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
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
      spaces: "appDataFolder",
      q: `name = '${DATA_FILE_NAME}'`,
      fields: "files(id)",
    });
    const files = response.result.files;
    return files && files.length > 0 ? (files[0].id ?? null) : null;
  }

  private loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== "undefined" && google.accounts) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== "undefined" && gapi.client) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        gapi.load("client", async () => {
          await gapi.client.init({});
          await gapi.client.load("drive", "v3");
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}
