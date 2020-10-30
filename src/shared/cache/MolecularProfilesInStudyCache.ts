import LazyMobXCache, { AugmentedData } from '../lib/LazyMobXCache';
import {
    MolecularProfile,
    MolecularProfileFilter,
} from 'cbioportal-ts-api-client';
import client from '../api/cbioportalClientInstance';
import * as _ from 'lodash';
import { AlterationContainerType } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { DataTypeConstants } from 'pages/resultsView/ResultsViewPageStore';

function queryToKey(studyId: string) {
    return studyId;
}

function dataToKey(molecularProfiles: MolecularProfile[], studyId: string) {
    return studyId;
}

async function fetch(
    studyIds: string[]
): Promise<AugmentedData<MolecularProfile[], string>[]> {
    let profiles: MolecularProfile[] = await client.fetchMolecularProfilesUsingPOST(
        {
            molecularProfileFilter: {
                studyIds,
            } as MolecularProfileFilter,
        }
    );

    //TODO: remove this block once data is fixed
    profiles = profiles.map(profile => {
        if (
            profile.molecularAlterationType ===
                AlterationContainerType.STRUCTURAL_VARIANT &&
            profile.datatype === DataTypeConstants.SV
        ) {
            profile.showProfileInAnalysisTab = false;
        }
        return profile;
    });
    //TODO: remove this block once data is fixed

    const profilesByStudy = _.groupBy(profiles, profile => profile.studyId);
    return studyIds.map(studyId => {
        const data = [profilesByStudy[studyId] || []];
        return {
            data,
            meta: studyId,
        };
    });
}

export default class MolecularProfilesInStudyCache extends LazyMobXCache<
    MolecularProfile[],
    string,
    string
> {
    constructor() {
        super(queryToKey, dataToKey, fetch);
    }
}
