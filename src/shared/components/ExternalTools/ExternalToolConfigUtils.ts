import { ExternalToolConfig } from './ExternalToolConfig';
import { FontDetector } from './utils/FontDetector';

function checkToolRequirementsPlatform(toolConfig: ExternalToolConfig): boolean {
    console.log('checkToolRequirementsPlatform: ' + toolConfig.required_platform);

    if (!toolConfig.required_platform) {
        return true;
    }

    return navigator.userAgent.indexOf(toolConfig.required_platform) >= 0;
}

// TECH: uses localStorage as cache so does not have to recompute
function checkToolRequirementsFontFamily(toolConfig: ExternalToolConfig): boolean {
    const fontFamily = toolConfig.required_installed_font_family;
    console.log('checkToolRequirementsFontFamily: ' + fontFamily);

    if (!fontFamily) {
        return true;
    }

    const detector = new FontDetector();
    const result = detector.detect(fontFamily);
    return result;
}

function computeIsExternalToolAvaialble(toolConfig: ExternalToolConfig) : boolean {
    // compute
    if (!checkToolRequirementsPlatform(toolConfig)) {
        return false;
    }

    if (!checkToolRequirementsFontFamily(toolConfig)) {
        return false;
    }   

    return true;
}

// OPTIMIZE: pass store
export function isExternalToolAvailable(toolConfig: ExternalToolConfig) : boolean {
    console.log('isExternalToolAvailable: ' + toolConfig.name);

    // check store
    const groupComparisonPage = (window as any).groupComparisonPage;
    try {
        if (groupComparisonPage) {
            var resultCached = groupComparisonPage.store.isExternalToolAvailable(toolConfig.id);
            if (resultCached !== undefined) {
                console.log('isExternalToolAvailable.Cache:' + resultCached);
                return resultCached;
            }
        }
    } catch (e) {
        console.error('isExternalToolAvailable.GetCache.Exception:', e);
    }

    // compute and store the value
    var resultComputed = computeIsExternalToolAvaialble(toolConfig);
    console.log('isExternalToolAvailable.Computed:' + resultComputed);
    try {
        if (groupComparisonPage) {
            groupComparisonPage.store.setIsExternalToolAvailable(toolConfig.id, resultComputed);
            console.log('stored');
        }
    } catch (e) {
        console.error('isExternalToolAvailable.SetCache.Exception:', e);
    }

    return resultComputed;
}
