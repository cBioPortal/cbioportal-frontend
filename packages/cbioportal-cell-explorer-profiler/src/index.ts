// Storage
export { getProfileHistory, saveProfileSession, removeProfileSession,
         clearProfileHistory, exportProfileHistory, importProfileHistory } from "./storage";

// Components
export { default as ProfileBar, PROFILE_BAR_HEIGHT } from "./components/ProfileBar";
export { default as ProfilePage } from "./components/ProfilePage";

// Charts (for advanced/custom usage)
export { default as MethodBreakdownChart } from "./charts/MethodBreakdownChart";
export { default as SessionWaterfallChart } from "./charts/SessionWaterfallChart";
export { default as CacheEfficiencyChart } from "./charts/CacheEfficiencyChart";
export { default as BytesByMethodChart } from "./charts/BytesByMethodChart";
export { default as RequestsByMethodChart } from "./charts/RequestsByMethodChart";
export { default as BytesVsDurationChart } from "./charts/BytesVsDurationChart";

// Constants
export { METHOD_COLORS, DEFAULT_METHOD_COLOR } from "./constants";

// Types
export type { ProfileEntry, ProfileSession, ChunkInfo, FetchInfo, RenderLink, ImportResult } from "./types";
