import { action, computed, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import * as _ from 'lodash';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import autobind from 'autobind-decorator';

export type SiteError = {
    errorObj: any;
    dismissed: boolean;
    title?: string;
    mode?: 'dialog' | 'screen';
    customMessage?: string;
};

export class AppStore {
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

    @computed get undismissedSiteErrors(): SiteError[] {
        return _.filter(this.siteErrors.slice(), err => !err.dismissed);
    }

    @computed get isErrorCondition() {
        // does it have at least one error of type screen (total failure as opposed to recoverable
        // which we will represent as dialog
        return this.undismissedSiteErrors.length > 0;
    }

    @computed get dialogErrors() {
        return _.filter(
            () => this.undismissedSiteErrors,
            (err: SiteError) => err.mode === 'dialog'
        );
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

    @autobind
    handleServiceError(error: SiteError): void {
        if (
            error.errorObj.status &&
            parseInt(error.errorObj.status) &&
            parseInt(error.errorObj.status) >= 400
        ) {
            error.dismissed = false;
            this.siteErrors.push(error);
        }
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
