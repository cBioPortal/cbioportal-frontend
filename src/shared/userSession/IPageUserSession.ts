import { PageSettingsData } from 'shared/api/session-service/sessionServiceModels';
import { PageSettingsIdentifier } from 'shared/userSession/PageSettingsIdentifier';

export interface IPageUserSession<T extends PageSettingsData> {
    /**
     * Session saving is possible when:
     * - user is logged in;
     * - sessions are enabled
     */
    readonly canSaveSession: boolean;

    /**
     * Changes exist between local and remote userSettings
     */
    isDirty: boolean;

    id: PageSettingsIdentifier;

    userSettings: T | undefined;

    /**
     * Update remote user session with local changes
     */
    saveUserSession: () => void;
}
