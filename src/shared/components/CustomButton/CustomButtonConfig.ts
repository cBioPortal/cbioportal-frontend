import { FontDetector } from './utils/FontDetector';
import { ICustomButtonConfig } from './ICustomButton';
import memoize from 'memoize-weak-decorator';

/**
 * Define a CustomButton to display (in CopyDownloadButtons).
 * Clicking on the button will launch it using the url_format
 */
export class CustomButtonConfig implements ICustomButtonConfig {
    id: string;
    name: string;
    tooltip: string;
    image_src: string;
    required_user_agent?: string;
    required_installed_font_family?: string;
    url_format: string;

    /**
     * Creates a new instance of the CustomButtonConfig class.
     * @param config - The configuration object for the custom button.
     */
    constructor(config: {
        id: string;
        name: string;
        tooltip: string;
        iconImageSrc: string;
        required_platform?: string;
        required_installed_font_family?: string;
        url_format: string;
    }) {
        this.id = config.id;
        this.name = config.name;
        this.tooltip = config.tooltip;
        this.image_src = config.iconImageSrc;
        this.required_user_agent = config.required_platform;
        this.required_installed_font_family =
            config.required_installed_font_family;
        this.url_format = config.url_format;
    }

    /**
     * Checks if the CustomButton is available in the current context per the defined reuqirements.
     * @returns A boolean value indicating if is available.
     */
    isAvailable(): boolean {
        var resultComputed = this.computeIsCustomButtonAvailable();
        // console.log(toolConfig.id + '.isAvailable.Computed:' + resultComputed);
        return resultComputed;
    }

    @memoize
    checkToolRequirementsPlatform(
        required_userAgent: string | undefined
    ): boolean {
        if (!required_userAgent) {
            return true;
        }

        return navigator.userAgent.indexOf(required_userAgent) >= 0;
    }

    // OPTIMIZE: want to @memoize, but if user installs font, it wouldn't be detected.
    checkToolRequirementsFontFamily(fontFamily: string | undefined): boolean {
        if (!fontFamily) {
            return true;
        }

        const detector = new FontDetector();
        const result = detector.detect(fontFamily);
        return result;
    }

    computeIsCustomButtonAvailable(): boolean {
        if (!this.checkToolRequirementsPlatform(this.required_user_agent)) {
            return false;
        }

        if (
            !this.checkToolRequirementsFontFamily(
                this.required_installed_font_family
            )
        ) {
            return false;
        }

        return true;
    }
}

/*fnordref
 */
// RFC87
//fnord move to server file
export const CustomButtonConfigDefaults: ICustomButtonConfig[] = [
    {
        id: 'avm',
        name: 'AVM for cBioPortal',
        tooltip: 'Launch AVM for cBioPortal with data (copied to clipboard)',
        image_src:
            'https://aquminmedical.com/images/content/AquminLogoSimple.png',
        required_user_agent: 'Win',
        required_installed_font_family: 'AVMInstalled',
        url_format:
            'avm://?importclipboard&-AutoMode=true&-ProjectNameHint=${studyName}&-ImportDataLength=${dataLength}',
    },

    /* TEST: uncomment to test
     * ASNEEDED: we could add a localStorage prop to enable
    {
        id: 'test',
        name: 'Test Tool',
        tooltip: 'This button shows that the Test Tool is working',
        iconImageSrc: require('../../../globalStyles/images/cbioportal_logo.png'),
        url_format:
            'https://eu.httpbin.org/anything?-StudyName=${studyName}&-ImportDataLength=${dataLength}',
    },    
     */
];
