import {
    PageSettingsData,
    PageSettingsUpdateRequest,
} from 'shared/api/session-service/sessionServiceModels';
import {
    computed,
    IReactionDisposer,
    makeAutoObservable,
    observable,
    reaction,
    toJS,
} from 'mobx';
import sessionServiceClient from 'shared/api/sessionServiceInstance';
import { AppStore } from 'AppStore';
import _ from 'lodash';
import { IPageUserSession } from 'shared/userSession/IPageUserSession';
import { PageSettingsIdentifier } from './PageSettingsIdentifier';

export class PageUserSession<T extends PageSettingsData>
    implements IPageUserSession<T> {
    private _id: PageSettingsIdentifier;
    private previousId: PageSettingsIdentifier | undefined;

    /**
     * User session as used in app, including user changes
     */
    private _userSettings: T | undefined;

    /**
     * User settings as stored in user session
     */
    private _savedUserSettings: T | undefined;

    /**
     * Saved user settings are loaded
     */
    private _isLoaded = false;

    private reactionDisposers: IReactionDisposer[] = [];

    constructor(
        private appStore: AppStore,
        private sessionServiceIsEnabled: boolean
    ) {
        makeAutoObservable(this);

        this.reactionDisposers.push(
            reaction(
                () => [this.id, this.isUserSessionEnabled],
                async () => {
                    await this.fetchSessionUserSettings();
                }
            )
        );
    }

    get isLoaded(): boolean {
        return this._isLoaded;
    }

    public get id(): PageSettingsIdentifier {
        return this._id;
    }

    @observable
    public set id(id: PageSettingsIdentifier) {
        this._id = id;
    }

    public get userSettings(): T | undefined {
        return this._userSettings;
    }

    @observable
    public set userSettings(userSettings: T | undefined) {
        this._userSettings = userSettings;
    }

    @computed
    public get isUserSessionEnabled() {
        return this.isLoggedIn && this.sessionServiceIsEnabled;
    }

    /**
     * User settings are changed but not stored in user session
     */
    @computed
    public get isDirty(): boolean {
        const dirtyUserSettings = !isEqualJs(
            this._userSettings,
            this._savedUserSettings
        );
        const dirtyId = !isEqualJs(this._id, this.previousId);
        return dirtyUserSettings || dirtyId;
    }

    public async saveUserSession() {
        if (!this.isDirty || !this.isUserSessionEnabled) {
            return;
        }
        const update = {
            ...this.id,
            ...this.userSettings,
        } as PageSettingsUpdateRequest;
        await sessionServiceClient.updateUserSettings(update);
        this._savedUserSettings = this.userSettings;
        this.previousId = this.id;
    }

    @computed
    private get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    private async fetchSessionUserSettings() {
        const shouldFetch = this.isUserSessionEnabled && this.isDirty;

        if (shouldFetch) {
            this._savedUserSettings = await sessionServiceClient.fetchPageSettings<
                T
            >(this.id, true);
            this.previousId = this.id;
            this._userSettings = this._savedUserSettings;
            this._isLoaded = true;
        }
    }

    destroy() {
        this.reactionDisposers.forEach(disposer => disposer());
    }
}

function isEqualJs(a: any, b: any) {
    return _.isEqualWith(toJS(a), toJS(b), nilIsEqual);
}

/**
 * @returns {true|undefined}
 *  true when both null or undefined;
 *  undefined to use default comparator
 */
function nilIsEqual(a: any, b: any) {
    if (_.isNil(a) && _.isNil(b)) {
        return true;
    } else {
        return undefined;
    }
}
