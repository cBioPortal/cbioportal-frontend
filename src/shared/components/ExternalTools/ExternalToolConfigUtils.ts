import { ExternalToolConfig } from './ExternalToolConfig';
import { FontDetector } from './utils/FontDetector';

function checkToolRequirementsPlatform(
    toolConfig: ExternalToolConfig
): boolean {
    if (!toolConfig.required_platform) {
        return true;
    }

    return navigator.userAgent.indexOf(toolConfig.required_platform) >= 0;
}

// TECH: uses localStorage as cache so does not have to recompute
function checkToolRequirementsFontFamily(
    toolConfig: ExternalToolConfig
): boolean {
    const fontFamily = toolConfig.required_installed_font_family;

    if (!fontFamily) {
        return true;
    }

    const detector = new FontDetector();
    const result = detector.detect(fontFamily);
    return result;
}

function computeIsExternalToolAvaialble(
    toolConfig: ExternalToolConfig
): boolean {
    // compute
    if (!checkToolRequirementsPlatform(toolConfig)) {
        return false;
    }

    if (!checkToolRequirementsFontFamily(toolConfig)) {
        return false;
    }

    return true;
}

// OPTIMIZE: cache in store so not recomputed too often, but need a store that is invalidated whenever the user refreshes the page, or add an expiration time
export function isExternalToolAvailable(
    toolConfig: ExternalToolConfig
): boolean {
    var resultComputed = computeIsExternalToolAvaialble(toolConfig);
    // console.log(toolConfig.id + '.isExternalToolAvailable.Computed:' + resultComputed);
    return resultComputed;
}
