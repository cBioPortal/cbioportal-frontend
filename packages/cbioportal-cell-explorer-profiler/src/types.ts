import type { ReactNode, ReactElement } from "react";

export interface ChunkInfo {
  arrayShape: number[];
  chunkShape: number[];
  dtype: string;
  sharded: boolean;
}

export interface FetchInfo {
  requests: number;
  bytes: number;
}

export interface ProfileEntry {
  id: number;
  method: string;
  key: string;
  label?: string;
  cacheHit: boolean;
  aborted?: boolean;
  startTime: number;
  duration: number;
  chunks?: ChunkInfo;
  fetches?: FetchInfo;
}

export interface ProfileSession {
  url: string;
  timestamp: number;
  nObs: number;
  nVar: number;
  entries: ProfileEntry[];
}

export type RenderLink = (children: ReactNode) => ReactElement;

export interface ImportResult {
  success: boolean;
  count?: number;
  error?: string;
}
