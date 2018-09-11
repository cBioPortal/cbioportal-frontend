import _ from "lodash";
import {SingleGeneQuery} from "shared/lib/oql/oql-parser";
import {unparseOQLQueryLine} from "shared/lib/oql/oqlfilter";
import {StudyViewFilter} from "shared/api/generated/CBioPortalAPIInternal";
import {Gene, Sample} from "shared/api/generated/CBioPortalAPI";
import * as React from "react";
import {getSampleViewUrl, getStudySummaryUrl} from "../../shared/api/urls";
import {IStudyViewScatterPlotData} from "./charts/scatterPlot/StudyViewScatterPlot";
import {StudyWithSamples} from "pages/studyView/StudyViewPageStore";
import {ClinicalDataType} from "./StudyViewPageStore";
import {ClinicalAttribute} from "../../shared/api/generated/CBioPortalAPI";

//TODO:cleanup
export const COLORS = [
    '#2986e2', '#dc3912', '#f88508', '#109618',
    '#990099', '#0099c6', '#dd4477', '#66aa00',
    '#b82e2e', '#316395', '#994499', '#22aa99',
    '#aaaa11', '#6633cc', '#e67300', '#8b0707',
    '#651067', '#329262', '#5574a6', '#3b3eac',
    '#b77322', '#16d620', '#b91383', '#f4359e',
    '#9c5935', '#a9c413', '#2a778d', '#668d1c',
    '#bea413', '#0c5922', '#743411', '#743440',
    '#9986e2', '#6c3912', '#788508', '#609618',
    '#790099', '#5099c6', '#2d4477', '#76aa00',
    '#882e2e', '#916395', '#794499', '#92aa99',
    '#2aaa11', '#5633cc', '#667300', '#100707',
    '#751067', '#229262', '#4574a6', '#103eac',
    '#177322', '#66d620', '#291383', '#94359e',
    '#5c5935', '#29c413', '#6a778d', '#868d1c',
    '#5ea413', '#6c5922', '#243411', '#103440',
    '#2886e2', '#d93912', '#f28508', '#110618',
    '#970099', '#0109c6', '#d10477', '#68aa00',
    '#b12e2e', '#310395', '#944499', '#24aa99',
    '#a4aa11', '#6333cc', '#e77300', '#820707',
    '#610067', '#339262', '#5874a6', '#313eac',
    '#b67322', '#13d620', '#b81383', '#f8359e',
    '#935935', '#a10413', '#29778d', '#678d1c',
    '#b2a413', '#075922', '#763411', '#773440',
    '#2996e2', '#dc4912', '#f81508', '#104618',
    '#991099', '#0049c6', '#dd2477', '#663a00',
    '#b84e2e', '#312395', '#993499', '#223a99',
    '#aa1a11', '#6673cc', '#e66300', '#8b5707',
    '#656067', '#323262', '#5514a6', '#3b8eac',
    '#b71322', '#165620', '#b99383', '#f4859e',
    '#9c4935', '#a91413', '#2a978d', '#669d1c',
    '#be1413', '#0c8922', '#742411', '#744440',
    '#2983e2', '#dc3612', '#f88808', '#109518',
    '#990599', '#0092c6', '#dd4977', '#66a900',
    '#b8282e', '#316295', '#994199', '#22a499',
    '#aaa101', '#66310c', '#e67200', '#8b0907',
    '#651167', '#329962', '#5573a6', '#3b37ac',
    '#b77822', '#16d120', '#b91783', '#f4339e',
    '#9c5105', '#a9c713', '#2a710d', '#66841c',
    '#bea913', '#0c5822', '#743911', '#743740',
    '#298632', '#dc3922', '#f88588', '#109658',
    '#990010', '#009916', '#dd4447', '#66aa60',
    '#b82e9e', '#316365', '#994489', '#22aa69',
    '#aaaa51', '#66332c', '#e67390', '#8b0777',
    '#651037', '#329232', '#557486', '#3b3e4c',
    '#b77372', '#16d690', '#b91310', '#f4358e',
    '#9c5910', '#a9c493', '#2a773d', '#668d5c',
    '#bea463', '#0c5952', '#743471', '#743450',
    '#2986e3', '#dc3914', '#f88503', '#109614',
    '#990092', '#0099c8', '#dd4476', '#66aa04',
    '#b82e27', '#316397', '#994495', '#22aa93',
    '#aaaa14', '#6633c1', '#e67303', '#8b0705',
    '#651062', '#329267', '#5574a1', '#3b3ea5'
];

export const NA_COLOR = '#CCCCCC';
export const UNSELECTED_COLOR = '#808080';
export const NA_DATA = "NA";

export function updateGeneQuery(geneQueries: SingleGeneQuery[], selectedGene: string): string {

    let updatedQueries = _.filter(geneQueries,query=> query.gene !== selectedGene)
    if(updatedQueries.length === geneQueries.length){
        updatedQueries.push({
            gene: selectedGene,
            alterations: false
        })
    }
    return updatedQueries.map(query=>unparseOQLQueryLine(query)).join('\n');

}
export function makeMutationCountVsCnaTooltip(sampleToAnalysisGroup?:{[sampleKey:string]:string}, analysisClinicalAttribute?:ClinicalAttribute) {
    return (d: { data: Pick<IStudyViewScatterPlotData, "x" | "y" | "studyId" | "sampleId" | "patientId" | "uniqueSampleKey">[] })=>{
        const rows = [];
        const MAX_SAMPLES = 3;
        const borderStyle = {borderTop: "1px solid black"};
        for (let i = 0; i < Math.min(MAX_SAMPLES, d.data.length); i++) {
            const datum = d.data[i];
            rows.push(
                <tr key={`${datum.studyId}_${datum.sampleId}`} style={i > 0 ? borderStyle : {}}>
                    <td style={{padding: 5}}>
                        <span>Cancer Study: <a target="_blank" href={getStudySummaryUrl(datum.studyId)}>{datum.studyId}</a></span><br/>
                        <span>Sample ID: <a target="_blank"
                                            href={getSampleViewUrl(datum.studyId, datum.sampleId)}>{datum.sampleId}</a></span><br/>
                        <span>CNA Fraction: {datum.x}</span><br/>
                        <span>Mutation Count: {datum.y}</span>
                        {!!analysisClinicalAttribute && !!sampleToAnalysisGroup && (
                            <div>
                                {analysisClinicalAttribute.displayName}: {sampleToAnalysisGroup[datum.uniqueSampleKey]}
                            </div>
                        )}
                    </td>
                </tr>
            );
        }
        if (d.data.length > 1) {
            rows.push(
                <tr key="see all" style={borderStyle}>
                    <td style={{padding: 5}}>
                        <a target="_blank" href={getSampleViewUrl(d.data[0].studyId, d.data[0].sampleId, d.data)}>View
                            all {d.data.length} patients included in this dot.</a>
                    </td>
                </tr>
            );
        }
        return (
            <div>
                <table>
                    {rows}
                </table>
            </div>
        );
    };
}

export function isSelected(datum: { uniqueSampleKey: string }, selectedSamples: { [uniqueSampleKey: string]: any }) {
    return datum.uniqueSampleKey in selectedSamples;
}

export function getPriority(priorities: number[]): number {
    let priority = 0;
    _.some(priorities, _priority => {
        if (_priority === 0) {
            priority = 0;
            return true;
        }
        priority = (_priority + priority) / 2;
    });
    return priority;
}

export function isPreSelectedClinicalAttr(attr: string): boolean {
    let result = attr.match(/(os_survival)|(dfs_survival)|(mut_cnt_vs_cna)|(mutated_genes)|(cna_details)|(^age)|(gender)|(sex)|(os_status)|(os_months)|(dfs_status)|(dfs_months)|(race)|(ethnicity)|(sample_type)|(histology)|(tumor_type)|(subtype)|(tumor_site)|(mutation_count)|(copy_number_alterations)|(.*(site|grade|stage).*)/i);
    return _.isArray(result) && result.length > 0;
}

export function getClinicalAttributeUniqueKey(attr: ClinicalAttribute): string {
    const clinicalDataType: ClinicalDataType = attr.patientAttribute ? 'PATIENT' : 'SAMPLE';
    const uniqueKey = clinicalDataType + '_' + attr.clinicalAttributeId;
    return uniqueKey;
}

export function getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
}

export function getVirtualStudyDescription(
                                            studyWithSamples: StudyWithSamples[],
                                            selectedSamples: Sample[],
                                            filter: StudyViewFilter,
                                            attributeNamesSet: { [id: string]: string },
                                            genes: Gene[],
                                            user?: string) {
    let selectedSampleSet = _.groupBy(selectedSamples, (sample: Sample) => sample.studyId);
    let descriptionLines: string[] = [];

    let entrezIdSet: { [id: string]: string } = _.reduce(genes, (acc: { [id: string]: string }, next) => {
        acc[next.entrezGeneId] = next.hugoGeneSymbol
        return acc
    }, {})
    //add to samples and studies count
    descriptionLines.push(
        selectedSamples.length +
        " sample" + (selectedSamples.length > 1 ? 's' : '') +
        " from " +
        Object.keys(selectedSampleSet).length +
        " " +
        (Object.keys(selectedSampleSet).length > 1 ? 'studies:' : 'study:'));
    //add individual studies sample count
    studyWithSamples.forEach(studyObj => {
        let selectedUniqueSampleKeys = _.map(selectedSampleSet[studyObj.studyId] || [], sample => sample.uniqueSampleKey);
        let studySelectedSamples = _.intersection(studyObj.uniqueSampleKeys, selectedUniqueSampleKeys);
        if (studySelectedSamples.length > 0) {
            descriptionLines.push("- " + studyObj.name + " (" + studySelectedSamples.length + " samples)")
        }
    })
    //add filters
    let filterLines: string[] = [];
    if (!_.isEmpty(filter)) {
        if (filter.cnaGenes && filter.cnaGenes.length > 0) {
            filterLines.push('- CNA Genes:')
            filterLines = filterLines.concat(filter.cnaGenes.map(cnaGene => {

                return cnaGene.alterations.map(alteration => {
                    let geneSymbol = entrezIdSet[alteration.entrezGeneId] || alteration.entrezGeneId
                    return geneSymbol + "-" + (alteration.alteration === -2 ? 'DEL' : 'AMP')
                }).join(', ').trim();
            }).map(line => '  - ' + line));
        }
        if (filter.mutatedGenes && filter.mutatedGenes.length > 0) {
            filterLines.push('- Mutated Genes:')
            filterLines = filterLines.concat(filter.mutatedGenes.map(mutatedGene => {
                return mutatedGene.entrezGeneIds.map(entrezGeneId => {
                    return entrezIdSet[entrezGeneId] || entrezGeneId;
                }).join(', ').trim();
            }).map(line => '  - ' + line));
        }
        if (filter.clinicalDataEqualityFilters && filter.clinicalDataEqualityFilters.length > 0) {
            filterLines = filterLines.concat(
                filter.clinicalDataEqualityFilters.map(clinicalDataEqualityFilter => {
                    let name = attributeNamesSet[clinicalDataEqualityFilter.clinicalDataType + '_' + clinicalDataEqualityFilter.attributeId] || clinicalDataEqualityFilter.attributeId;
                    return `  - ${name}: ${clinicalDataEqualityFilter.values.join(', ')}`;
                }));
        }
        /*
           TODO: currently sampleIdentifiers includes both custom cases and scatter
           need to update this once the filter handled properly
        */
        if (filter.sampleIdentifiers && filter.sampleIdentifiers.length > 0) {
            filterLines.push('- Select by IDs: ' + filter.sampleIdentifiers.length + ' samples');
        }
    }
    if (filterLines.length > 0) {
        descriptionLines.push('');
        descriptionLines.push('Filters:');
        descriptionLines = descriptionLines.concat(filterLines);
    }
    descriptionLines.push('');
    //add creation and user name
    descriptionLines.push('Created on ' + getCurrentDate() + (user ? ' by ' + user : ''));
    return descriptionLines.join('\n');
}

export function isFiltered(filter: StudyViewFilter, includeSampleIdentifiers:boolean = false) {
    return !(_.isEmpty(filter) || (
        _.isEmpty(filter.clinicalDataEqualityFilters) &&
        _.isEmpty(filter.clinicalDataIntervalFilters) &&
        _.isEmpty(filter.cnaGenes) &&
        _.isEmpty(filter.mutatedGenes)
        //&& (includeSampleIdentifiers?_.isEmpty(filter.sampleIdentifiers):true)
    ));
}

export function makePatientToClinicalAnalysisGroup(
    samples:Pick<Sample, "uniqueSampleKey"|"uniquePatientKey">[],
    sampleToAnalysisGroup:{[sampleKey:string]:string}
) {
    // only include a patient if all its samples are in the same analysis group
    const badPatients:{[patientKey:string]:boolean} = {};
    return _.reduce(samples, (map, sample)=>{
        const patientKey = sample.uniquePatientKey;
        if (!(patientKey in badPatients)) {
            // weve not already determined that not all this patients samples are in the same group

            const sampleGroup = sampleToAnalysisGroup[sample.uniqueSampleKey];
            if (patientKey in map) {
                if (map[patientKey] !== sampleGroup) {
                    // this means that weve seen another sample for this patient thats not
                    //  in the same group. therefore, not all this patients samples are in
                    //  the same group, so we're going to omit it
                    delete map[patientKey];
                    badPatients[patientKey] = true;
                } // otherwise, we already have the right group, so dont do anything
            } else {
                // this is the first sample weve seen from this patient
                map[patientKey] = sampleGroup;
            }
        }
        return map;
    }, {} as {[patientKey:string]:string});
}