import { getServerConfig } from 'config/config';
// TECH: parseCustomButtonConfigs() is a static factory function to create CustomButtonConfig objects.  We don't include
//  that method here to avoid an issue importing getServerConfig in the unit tests.
import { CustomButtonConfig } from './CustomButtonConfig';
import { ICustomButtonConfig } from './ICustomButton';

/**
 * Lazy initialization from a JSON file configured on the server, which may define an array of CustomButtonConfig objects.
 * @returns The CustomButtonConfigs from the server configuration.
 */
export const getCustomButtonConfigs = (() => {
    let customButtons: ICustomButtonConfig[] | undefined = undefined;

    return (): ICustomButtonConfig[] => {
        if (!customButtons) {
            // Initialize
            const customButtonsJson = getServerConfig().custom_buttons_json;
            customButtons = CustomButtonConfig.parseCustomButtonConfigs(
                customButtonsJson
            );
        }
        return customButtons;
    };
})();
