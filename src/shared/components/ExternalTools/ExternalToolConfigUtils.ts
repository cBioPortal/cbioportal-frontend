import { ExternalToolConfig } from './ExternalToolConfig';

// actually computes if font is installed
const computeIsInstalled = (fontFamily: string): boolean => {
    var detector = new Detector();
    return (detector.detect(fontFamily));
};

function checkToolRequirementsPlatform(toolConfig: ExternalToolConfig): boolean {
    if (!toolConfig.required_platform) {
        return true;
    }

    return navigator.userAgent.indexOf(toolConfig.required_platform) >= 0;
}

// TECH: uses localStorage as cache so does not have to recompute
function checkToolRequirementsFontFamily(toolConfig: ExternalToolConfig): boolean {
    if (!toolConfig.required_installed_font_family) {
        return true;
    }

    // check cache
    // TODO: add timeout to cache, or is F5 sufficient?
    const cacheKey = 'fontFamilyIsInstalled_' + toolConfig.required_installed_font_family;
    const cachedValue = localStorage.getItem(cacheKey);
    if (cachedValue) {
        const parsedValue = JSON.parse(cachedValue);
        if (typeof parsedValue === 'boolean') {
            //fnordtest
            console.log('IsInstalled.Cache:' + parsedValue);
            return parsedValue;
        } else {
            console.error('Unexpected cached value for fontFamilyIsInstalled');
            // fall through to recompute
        }
    }

    // compute and store in cache
    const isInstalled = computeIsInstalled(toolConfig.required_installed_font_family);
    localStorage.setItem(cacheKey, JSON.stringify(isInstalled));

    //fnordtest
    console.log('IsInstalled.Compute:' + isInstalled);

    return isInstalled;
}

export function isExternalToolAvailable(toolConfig: ExternalToolConfig) : boolean {
    if (!checkToolRequirementsPlatform(toolConfig)) {
        return false;
    }

    if (!checkToolRequirementsFontFamily(toolConfig)) {
        return false;
    }   

    return true;
}
