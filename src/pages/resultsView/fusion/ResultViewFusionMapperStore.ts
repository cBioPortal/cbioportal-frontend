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
    CancerStudy,
    Gene,
    MolecularProfile,
    SampleIdentifier,
    StructuralVariant
} from '../../../shared/api/generated/CBioPortalAPI';
import { cached, labelMobxPromises, MobxPromise } from "mobxpromise";
import { computed } from 'mobx';
import {remoteData, PfamDomain, PfamDomainRange, EnsemblTranscript} from "cbioportal-frontend-commons";
import { fetchEnsemblTranscriptsByEnsemblFilter, fetchPfamDomainData } from '../../../shared/lib/StoreUtils';
import * as _ from 'lodash';
import { EnsemblTranscriptExt, StructuralVariantExt } from '../../../shared/model/Fusion';
import ResultViewFusionMapperDataStore from './ResultViewFusionMapperDataStore';
import { ExonsChartStore } from '../../../shared/components/exonsCharts/ExonsChartStore';

export const FUS_GENE_COLORSCALE = ['#097AFF', '#3B9CFF', '#28a9ff', '#84B7DF', '#92C8E8', '#68ACEA', '#4eb7d9'];
export const REF_GENE_COLORSCALE = ['#88C542', '#99c556', '#a0cf31', '#7ba237', '#47cb4a', '#008828', '#005623'];

export class ResultViewFusionMapperStore {

    constructor(public gene: Gene,
                public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
                public molecularProfileIdToMolecularProfile: MobxPromise<{ [molecularProfileId: string]: MolecularProfile }>,
                public samples: MobxPromise<SampleIdentifier[]>,
                public fusions: StructuralVariantExt[]) {
        labelMobxPromises(this);
    }

    static addColor (transcripts: EnsemblTranscriptExt[], geneSymbol: string) {
        const fusionTranscripts: EnsemblTranscriptExt[] = [];
        return transcripts.map(t => {
            // Check if transcript is reference gene, if yes then mark it
            const isReferenceGene = t.hugoSymbols.indexOf(geneSymbol) >= 0;
            // add color based on if transcript is reference gene or not
            const fillColor = isReferenceGene ?
                REF_GENE_COLORSCALE[0] : FUS_GENE_COLORSCALE[fusionTranscripts.length % FUS_GENE_COLORSCALE.length];
            const newTranscript = Object.assign({}, t, {
                isReferenceGene,
                fillColor,
            });
            if (!isReferenceGene) {
                const countRef = fusionTranscripts.filter(ref => {
                    return ref['geneId'] === newTranscript['geneId']
                });
                if (countRef.length === 0) {
                    fusionTranscripts.push(newTranscript)
                }
            }
            return newTranscript;
        });
    };

    readonly ensemblTranscripts = remoteData({
        invoke: async () => {
            // Collect all transcript id's from the fusion data
            const transcriptIds = new Set();
            this.fusions.forEach((fusion: StructuralVariant) => {
                transcriptIds.add(fusion.site1EnsemblTranscriptId);
                transcriptIds.add(fusion.site2EnsemblTranscriptId);
            });
            // Fetch ensembl transcript data with transcript ids as request params
            return await fetchEnsemblTranscriptsByEnsemblFilter({'transcriptIds':  Array.from(transcriptIds)})
                .then( result => ResultViewFusionMapperStore.addColor(result, this.gene.hugoGeneSymbol));
        }
    }, []);

    get exonsChartStore(): ExonsChartStore {
        return new ExonsChartStore(
            this.gene,
            this.ensemblTranscripts,
            this.pfamDomainData,
            this.dataStore
        )
    }

    readonly pfamDomainData = remoteData<PfamDomain[] | undefined>({
        await: () => [
            this.ensemblTranscripts
        ],
        invoke: () => {
            // get all pfam domain ids from requested transcripts
            const pFamDomainIds: string[] = this.ensemblTranscripts.result
                .map((t: EnsemblTranscript) => t.pfamDomains)
                .reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
                .map((pfam: PfamDomainRange) => pfam.pfamDomainId);
            // fetch the data with pfam domain ids as request params
            return fetchPfamDomainData(pFamDomainIds);
        }
    }, []);

    @computed
    get fusionCounts(): { [fusionLabel: string]: number } {
        return _.countBy(this.fusions, (d) => d.label);
    }

    @computed
    get fusionMolecularProfile(): MolecularProfile | undefined {
        const molecularProfiles = this.molecularProfileIdToMolecularProfile.result;
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

    @cached
    get dataStore(): ResultViewFusionMapperDataStore {
        const fusionData = (this.fusions || [])
            .map((fusion: StructuralVariant) => [fusion]);
        return new ResultViewFusionMapperDataStore(fusionData);
    }
}
