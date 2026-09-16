export const DEFAULT_CHAT_SIDEBAR_WIDTH = 400;
export const MIN_CHAT_SIDEBAR_WIDTH = 320;

export function clampChatSidebarWidth(
    width: number,
    viewportWidth: number
): number {
    const maximumWidth = Math.max(0, viewportWidth);
    const minimumWidth = Math.min(MIN_CHAT_SIDEBAR_WIDTH, maximumWidth);
    return Math.min(Math.max(width, minimumWidth), maximumWidth);
}

export function readStoredChatSidebarWidth(
    storage: Pick<Storage, 'getItem'>,
    storageKey: string
): number {
    try {
        const storedWidth = Number(storage.getItem(storageKey));
        return Number.isFinite(storedWidth) && storedWidth > 0
            ? storedWidth
            : DEFAULT_CHAT_SIDEBAR_WIDTH;
    } catch {
        return DEFAULT_CHAT_SIDEBAR_WIDTH;
    }
}
