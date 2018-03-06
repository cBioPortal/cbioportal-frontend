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
import { remoteData } from '../../../shared/api/remoteData';
import { fetchEnsemblTranscriptsByEnsemblFilter, fetchPfamDomainData } from '../../../shared/lib/StoreUtils';
import { EnsemblTranscript, PfamDomain } from '../../../shared/api/generated/GenomeNexusAPI';
import * as _ from 'lodash';
import { EnsemblTranscriptExt, StructuralVariantExt } from '../../../shared/model/Fusion';
import ResultViewFusionMapperDataStore from './ResultViewFusionMapperDataStore';

export const FUS_GENE_COLORSCALE = ['#097AFF', '#3B9CFF', '#28a9ff', '#84B7DF', '#92C8E8', '#68ACEA', '#4eb7d9'];
export const REF_GENE_COLORSCALE = ['#88C542', '#99c556', '#a0cf31', '#7ba237', '#47cb4a', '#008828', '#005623'];

export class ResultViewFusionMapperStore {

    /**
     * @param {Gene} gene
     * @param {MobxPromise<{[p: string]: CancerStudy}>} studyIdToStudy
     * @param {MobxPromise<{[p: string]: MolecularProfile}>} molecularProfileIdToMolecularProfile
     * @param {MobxPromise<SampleIdentifier[]>} samples
     * @param {StructuralVariant[]} fusions
     */
    constructor(public gene: Gene,
                public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
                public molecularProfileIdToMolecularProfile: MobxPromise<{ [molecularProfileId: string]: MolecularProfile }>,
                public samples: MobxPromise<SampleIdentifier[]>,
                public fusions: StructuralVariant[]) {
        labelMobxPromises(this);
    }


    /**
     * Returns fusion data with label added as new attribute composed of site1 and site2 genes.
     * @type {MobxPromiseUnionTypeWithDefault<StructuralVariantExt[]>}
     */
    readonly fusionData = remoteData({
        invoke: async () => {
            return (<StructuralVariantExt[]> this.fusions || []).map(f => {
                // generate fusion label made of site1 and site2 genes
                f.label = `${f.site1HugoSymbol}-${f.site2HugoSymbol}`;
                return f;
            });
        }
    }, []);

    /**
     * Apply color scale to the transcript
     * @param {EnsemblTranscriptExt} d
     * @param {boolean} isRefGene
     * @param {EnsemblTranscriptExt[]} tempArr
     */
    private applyColor(d: EnsemblTranscriptExt, isRefGene: boolean, tempArr: EnsemblTranscriptExt[]) {

        const attributeName: string = isRefGene ? 'transcriptId' : 'geneId';
        const colorScale = isRefGene ? REF_GENE_COLORSCALE : FUS_GENE_COLORSCALE;

        // Repeat color when length more than color scale array
        const colorScaleIdx = tempArr.length % colorScale.length;
        d.fillColor = colorScale[colorScaleIdx];

        // collect in a temp array
        if (tempArr.filter(t => t[attributeName] === d[attributeName]).length === 0) {
            tempArr.push(d);
        }
    }

    /**
     * Returns ensembl transcripts
     * @type {MobxPromiseUnionTypeWithDefault<Array<EnsemblTranscript>>}
     */
    readonly ensemblTranscripts = remoteData({
        await: () => [
            this.fusionData,
        ],
        invoke: async () => {
            // Collect all transcript id's from the fusion data
            let transcriptIds: any = [];
            if (this.fusionData.result) {
                this.fusionData.result.forEach((fusion: StructuralVariant) => {
                    if (transcriptIds.indexOf(fusion.site1EnsemblTranscriptId) < 0) {
                        transcriptIds.push(fusion.site1EnsemblTranscriptId);
                    }
                    if (transcriptIds.indexOf(fusion.site2EnsemblTranscriptId) < 0) {
                        transcriptIds.push(fusion.site2EnsemblTranscriptId);
                    }
                });
            }
            // Fetch ensembl transcript data with transcript ids as request params
            return await fetchEnsemblTranscriptsByEnsemblFilter({'transcriptIds': transcriptIds})
                .then((result: EnsemblTranscriptExt[]) => {
                    let fusionTranscripts: EnsemblTranscriptExt[] = [];
                    let refTranscripts: EnsemblTranscriptExt[] = [];
                    return result.map(t => {
                        // Check if transcript is reference gene
                        t.isReferenceGene = t.hugoSymbols.indexOf(this.gene.hugoGeneSymbol) >= 0;
                        this.applyColor(t, t.isReferenceGene, t.isReferenceGene ? refTranscripts : fusionTranscripts);
                        return t;
                    });
                });
        }
    }, []);

    /**
     * Fetch pfam domain data
     * @type {MobxPromiseUnionTypeWithDefault<PfamDomain[]>}
     */
    readonly pfamDomainData = remoteData<PfamDomain[] | undefined>({
        await: () => [
            this.ensemblTranscripts
        ],
        invoke: async () => {
            if (this.ensemblTranscripts.result) {
                // get all pfam domain ids from requested transcripts
                let pFamDomainIds = this.ensemblTranscripts.result
                    .map(t => t.pfamDomains)
                    .reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
                    .map(t => t.pfamDomainId);
                // fetch the data with pfam domain ids as request params
                return await fetchPfamDomainData(pFamDomainIds);
            }
        }
    }, undefined);

    /**
     * Get number of occurences
     * @returns {{[p: string]: number}}
     */
    @computed
    get fusionOccurrence(): { [T: string]: number } {
        return _.countBy(this.fusionData.result, (d) => d.label);
    }

    /**
     * Get pfam domain data
     * @returns {PfamDomain[]}
     */
    @computed
    get processedPfamDomains(): PfamDomain[] {
        return this.pfamDomainData.result || [];
    }

    /**
     * get ensembl transcript
     * @returns {EnsemblTranscriptExt[]}
     */
    @computed
    get processedEnsembleTranscripts(): EnsemblTranscriptExt[] {
        return <EnsemblTranscriptExt[]> this.ensemblTranscripts.result || [];
    }

    /**
     * Get fusion molecular profile.
     * At the moment it is marked by having data type 'SV' (structural variant)
     * @returns {MolecularProfile}
     */
    @computed
    get processedFusionData(): StructuralVariant[][] {
        return (this.fusionData.result || []).map((fusion: StructuralVariant) => [fusion]);
    }

    @computed
    get fusionMolecularProfile(): MolecularProfile | undefined {
        const molecularProfiles = this.molecularProfileIdToMolecularProfile.result;
        let fusionMolecularProfile;

        if (!molecularProfiles) return;

        let _keys = Object.keys(molecularProfiles);
        _keys.forEach(profileKey => {
            if (molecularProfiles[profileKey].datatype === 'SV') {
                fusionMolecularProfile = molecularProfiles[profileKey];
            }
        });

        return fusionMolecularProfile;
    }

    /**
     *
     * @returns {ResultViewFusionMapperDataStore}
     */
    @cached
    get dataStore(): ResultViewFusionMapperDataStore {
        return new ResultViewFusionMapperDataStore(this.processedFusionData);
    }
}
