import type { EntriesMap } from "../../utils/types";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface StorageProvider {
  readonly name: "localStorage" | "googleDrive" | "dropbox";
  readonly displayName: string;

  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): void;
  load(): Promise<EntriesMap>;
  save(entries: EntriesMap): Promise<void>;
  getLastSyncTime(): Date | null;
}

export interface CloudSyncState {
  provider: StorageProvider | null;
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
}
