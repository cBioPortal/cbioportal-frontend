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

import {
    SampleIdentifier, Gene, StructuralVariant,
    MolecularProfile, CancerStudy
} from '../../../shared/api/generated/CBioPortalAPI';
import { labelMobxPromises, MobxPromise, cached } from "mobxpromise";
import FusionMapperDataStore from './FusionMapperDataStore';
import { computed } from 'mobx';
import { remoteData } from '../../../shared/api/remoteData';


export class FusionMapperStore {

    constructor(public gene: Gene,
                public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
                public molecularProfileIdToMolecularProfile: MobxPromise<{ [molecularProfileId: string]: MolecularProfile }>,
                public samples: MobxPromise<SampleIdentifier[]>,
                public fusions: StructuralVariant[]) {
        labelMobxPromises(this);
    }

    readonly fusionData = remoteData({
        invoke: async () => {
            return this.fusions;
        }
    }, []);

    @computed
    get processedFusionData(): StructuralVariant[][] {
        return (this.fusionData.result || []).map((fusion: StructuralVariant) => [fusion]);
    }

    @cached
    get dataStore(): FusionMapperDataStore {
        return new FusionMapperDataStore(this.processedFusionData);
    }
}
