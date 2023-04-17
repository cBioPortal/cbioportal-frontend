/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import { labelMobxPromises, MobxPromise } from 'mobxpromise';
import { computed, makeObservable } from 'mobx';
import { StructuralVariantExt } from '../../../shared/model/Fusion';
import ResultViewFusionMapperDataStore from './ResultViewFusionMapperDataStore';
import {
    CancerStudy,
    Gene,
    MolecularProfile,
    SampleIdentifier,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { IOncoKbData } from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';

export class ResultViewFusionMapperStore {
    constructor(
        public gene: Gene,
        public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
        public molecularProfileIdToMolecularProfile: MobxPromise<{
            [molecularProfileId: string]: MolecularProfile;
        }>,
        public samples: MobxPromise<SampleIdentifier[]>,
        public fusions: StructuralVariantExt[],
        public uniqueSampleKeyToTumorType: {
            [uniqueSampleKey: string]: string;
        },
        public structuralVariantOncoKbData: MobxPromise<IOncoKbData | Error>,
        public oncoKbCancerGenes: MobxPromise<CancerGene[] | Error>,
        public usingPublicOncoKbInstance: boolean
    ) {
        makeObservable(this);
        labelMobxPromises(this);
    }

    @computed
    get fusionMolecularProfile(): MolecularProfile | undefined {
        const molecularProfiles = this.molecularProfileIdToMolecularProfile
            .result;
        if (molecularProfiles) {
            let fusionMolecularProfile;
            let _keys = Object.keys(molecularProfiles);
            _keys.forEach(profileKey => {
                if (molecularProfiles[profileKey].datatype === 'SV') {
                    fusionMolecularProfile = molecularProfiles[profileKey];
                }
            });
            return fusionMolecularProfile;
        }
    }

    @computed
    get dataStore(): ResultViewFusionMapperDataStore {
        const fusionData = (
            this.fusions || []
        ).map((fusion: StructuralVariant) => [fusion]);
        return new ResultViewFusionMapperDataStore(fusionData);
    }
}
