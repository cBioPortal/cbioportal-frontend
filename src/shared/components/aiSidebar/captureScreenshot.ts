import html2canvas from 'html2canvas';

/**
 * Captures a screenshot of the main page content, excluding the AI sidebar.
 * Returns a base64-encoded JPEG data URL.
 */
export async function capturePageScreenshot(): Promise<string> {
    // Find the main content area - try common selectors
    const mainContent =
        document.querySelector('.mainContainer') ||
        document.querySelector('#mainColumn') ||
        document.querySelector('main') ||
        document.body;

    const canvas = await html2canvas(mainContent as HTMLElement, {
        // Exclude the AI sidebar from the screenshot
        ignoreElements: element => {
            return element.classList.contains('ai-sidebar-container');
        },
        // Use reasonable defaults for performance
        scale: 1, // Don't scale up (reduces file size)
        useCORS: true, // Try to load cross-origin images
        logging: false, // Disable console logging
        backgroundColor: '#ffffff',
    });

    // Convert to JPEG with 70% quality to reduce file size
    return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * Converts a base64 data URL to a Blob for file uploads.
 */
export function dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
