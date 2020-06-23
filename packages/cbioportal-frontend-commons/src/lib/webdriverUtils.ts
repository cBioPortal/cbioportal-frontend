export function isWebdriver() {
    return window.navigator.webdriver;
}

export function isLocalDBServer() {
    try {
        return (
            (window as any).frontendConfig.serverConfig.app_name ===
            'localdbe2e'
        );
    } catch (ex) {
        return false;
    }
}
