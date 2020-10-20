import { action, computed, observable, makeObservable } from 'mobx';
import {
    addServiceErrorHandler,
    getBrowserWindow,
    remoteData,
} from 'cbioportal-frontend-commons';
import { initializeAPIClients } from './config/config';
import * as _ from 'lodash';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { sendSentryMessage } from './shared/lib/tracking';

export type SiteError = {
    errorObj: any;
    dismissed: boolean;
    title?: string;
};

export class AppStore {
    constructor() {
        makeObservable<AppStore, '_appReady'>(this);
        getBrowserWindow().me = this;
        addServiceErrorHandler((error: any) => {
            try {
                sendSentryMessage('ERRORHANDLER:' + error);
            } catch (ex) {}

            if (error.status && /400|500|403/.test(error.status)) {
                sendSentryMessage('ERROR DIALOG SHOWN:' + error);
                this.siteErrors.push({ errorObj: error, dismissed: false });
            }
        });
    }

    @observable private _appReady = false;

    @observable siteErrors: SiteError[] = [];

    @observable userName: string | undefined;

    @observable authMethod: string | undefined;

    @computed get isLoggedIn() {
        return _.isString(this.userName) && this.userName !== 'anonymousUser';
    }

    @computed get logoutUrl() {
        if (this.authMethod === 'saml') {
            return 'saml/logout';
        } else {
            return 'j_spring_security_logout';
        }
    }

    @computed get undismissedSiteErrors() {
        return _.filter(this.siteErrors.slice(), err => !err.dismissed);
    }

    @computed get isErrorCondition() {
        return this.undismissedSiteErrors.length > 0;
    }

    @action
    public dismissErrors() {
        this.siteErrors = this.siteErrors.map(err => {
            err.dismissed = true;
            return err;
        });
    }

    @action
    public setAppReady() {
        this._appReady = true;
    }

    public get appReady() {
        return this._appReady;
    }

    readonly portalVersion = remoteData<string | undefined>({
        invoke: async () => {
            const portalVersionResult = await internalClient.getInfoUsingGET(
                {}
            );
            if (portalVersionResult && portalVersionResult.portalVersion) {
                let version = undefined;

                // try getting version from branch name assume like release-x.y.z
                if (
                    portalVersionResult.gitBranch &&
                    portalVersionResult.gitBranch.startsWith('release-')
                ) {
                    let branchVersion = portalVersionResult.gitBranch.split(
                        '-'
                    )[1];
                    if (branchVersion.split('.').length == 3) {
                        version = branchVersion;
                    }
                }

                // if branch name does not contain version name, use
                // portalVersion
                if (version === undefined) {
                    version = portalVersionResult.portalVersion.split('-')[0];
                }

                // add v prefix if missing
                if (version !== undefined && !version.startsWith('v')) {
                    version = `v${version}`;
                }
                return Promise.resolve(version);
            }
            return undefined;
        },
    });
}
