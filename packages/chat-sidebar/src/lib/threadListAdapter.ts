import { createLocalStorageAdapter } from '@assistant-ui/core/react';
import { RemoteThreadListAdapter } from '@assistant-ui/react';
import { useThreadHistoryAdapters } from './threadHistoryAdapter';
import { PREFIX, storage } from './threadStorage';
import { titleAdapter } from './titleAdapter';

// createLocalStorageAdapter lives on the @assistant-ui/core/react subpath —
// @assistant-ui/react does not re-export it. It owns the chat list itself
// (listing, titles, rename, archive, delete, and serializing those writes);
// only its message persistence is replaced, because it stores assistant-ui's
// own message shape while useAISDKRuntime requires the AI SDK format through
// `withFormat`. Both write `<PREFIX>messages:<id>`, so its delete still cleans
// up after ours.
const base = createLocalStorageAdapter({
    storage,
    prefix: PREFIX,
    titleGenerator: titleAdapter,
});

// One instance for the app's lifetime: a new adapter reference tears the list
// down and reloads it. The runtime calls `unstable_useAdapters` once per
// mounted thread, background ones included, so each gets the history adapter.
export const threadListAdapter: RemoteThreadListAdapter = {
    ...base,
    unstable_useAdapters: useThreadHistoryAdapters,
};
