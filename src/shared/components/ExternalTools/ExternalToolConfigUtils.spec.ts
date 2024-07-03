import { expect } from 'chai';
import { ExternalToolConfig} from './ExternalToolConfig';
import { isExternalToolAvailable } from './ExternalToolConfigUtils';

describe('checkToolRequirementsFontFamily', () => {
    const mockPropsUndefined = {
        required_installed_font_family: undefined,
    } as ExternalToolConfig;

    const mockPropsDoesNotExist = {
        required_installed_font_family: 'FooDoesNotExist',
    } as ExternalToolConfig;

    const mockPropsDoesExist = {
        required_installed_font_family: 'Arial',
    } as ExternalToolConfig;


    it('should return true if required_installed_font_family is not provided', () => {
        expect(isExternalToolAvailable(mockPropsUndefined)).to.be.true;
    });

    /* LOW: doesn't work since jest is not rendering HTML so computed width/height is always 0
    it('should return true if the required font family is installed', () => {
        expect(isExternalToolAvailable(mockPropsDoesExist)).to.be.true;
    });

    it('should return false if the required font family is not installed', () => {
        expect(isExternalToolAvailable(mockPropsDoesNotExist)).to.be.false;
    });
    */
});