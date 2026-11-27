import { remoteData } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import sessionServiceClient from 'shared/api/sessionServiceInstance';
import comparisonClient from 'shared/api/comparisonGroupClientInstance';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import {
    VirtualStudy,
    Group,
} from 'shared/api/session-service/sessionServiceModels';
import { DataAccessToken } from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import { getServerConfig } from 'config/config';
import { SUPPORTED_DAT_METHODS } from 'shared/constants';
import { UserRoleStore } from './UserRoleStore';

export class AccountPageStore {
    public readonly userRoleStore = new UserRoleStore();

    readonly virtualStudies = remoteData<VirtualStudy[]>({
        invoke: () => sessionServiceClient.getUserVirtualStudies(),
        onError: () => {},
        default: [],
    });

    // comparison groups are only retrievable per-study, so we derive the
    // candidate study ids from the user's saved virtual studies
    readonly comparisonGroups = remoteData<Group[]>({
        await: () => [this.virtualStudies],
        invoke: async () => {
            const studyIds = _.uniq(
                _.flatMap(this.virtualStudies.result, vs =>
                    vs.data.studies.map(s => s.id)
                )
            );
            if (studyIds.length === 0) {
                return [];
            }
            return comparisonClient.getGroupsForStudies(studyIds);
        },
        onError: () => {},
        default: [],
    });

    public get dataAccessTokenSupported(): boolean {
        return (
            getServerConfig().authenticationMethod !== 'optional_oauth2' &&
            SUPPORTED_DAT_METHODS.includes(getServerConfig().dat_method)
        );
    }

    readonly dataAccessTokens = remoteData<DataAccessToken[]>({
        invoke: async () => {
            if (!this.dataAccessTokenSupported) {
                return [];
            }
            return internalClient.getAllDataAccessTokensUsingGET({});
        },
        onError: () => {},
        default: [],
    });

    public get totalVirtualStudySamples(): number {
        return _.sumBy(this.virtualStudies.result, vs =>
            _.sumBy(vs.data.studies, s => s.samples.length)
        );
    }
}
