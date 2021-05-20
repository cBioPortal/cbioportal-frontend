import { getPatientViewUrl, getSampleViewUrl } from '../../api/urls';
import $ from 'jquery';
import {
    NumericGeneMolecularData,
    GenePanel,
    GenePanelData,
    MolecularProfile,
    Mutation,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import client from 'shared/api/cbioportalClientInstance';
import {
    ClinicalTrackSpec,
    GeneticTrackDatum,
    IBaseHeatmapTrackSpec,
    ICategoricalTrackSpec,
    IHeatmapTrackSpec,
} from './Oncoprint';
import {
    AnnotatedExtendedAlteration,
    ExtendedAlteration,
    AlterationTypeConstants,
    CustomDriverNumericGeneMolecularData,
} from '../../../pages/resultsView/ResultsViewPageStore';
import _ from 'lodash';
import { alterationTypeToProfiledForText } from './ResultsViewOncoprintUtils';
import { isNotGermlineMutation } from '../../lib/MutationUtils';
import ListIndexedMap, {
    ListIndexedMapOfCounts,
} from '../../lib/ListIndexedMap';

const hotspotsImg = require('../../../rootImages/cancer-hotspots.svg');
const oncokbImg = require('../../../rootImages/oncokb-oncogenic-1.svg');
const customDriverImg = require('../../../rootImages/driver.png');
const customDriverTiersImg = require('../../../rootImages/driver_tiers.png');

export const TOOLTIP_DIV_CLASS = 'oncoprint__tooltip';

const tooltipTextElementNaN = 'N/A';
import './styles.scss';
import { deriveDisplayTextFromGenericAssayType } from 'pages/resultsView/plots/PlotsTabUtils';
import { PUTATIVE_DRIVER } from 'shared/lib/StoreUtils';

function sampleViewAnchorTag(study_id: string, sample_id: string) {
    return `<a class="nobreak" href="${getSampleViewUrl(
        study_id,
        sample_id
    )}" target="_blank">${sample_id}</a>`;
}
function patientViewAnchorTag(study_id: string, patient_id: string) {
    return `<a class="nobreak" href="${getPatientViewUrl(
        study_id,
        patient_id
    )}" target="_blank">${patient_id}</a>`;
}

function makeGenePanelPopupLink(
    gene_panel_id: string,
    profiled: boolean,
    numSamples?: number
) {
    let anchor = $(
        `<span class="nobreak"><a href="#" ${
            !profiled ? 'style="color:red;"' : ''
        } oncontextmenu="return false;">${gene_panel_id}</a>${
            numSamples ? ` (${numSamples})` : ''
        }</span>`
    );
    anchor.ready(() => {
        anchor.click(function() {
            client
                .getGenePanelUsingGET({ genePanelId: gene_panel_id })
                .then((panel: GenePanel) => {
                    const genes = panel.genes
                        .map(function(g) {
                            return g.hugoGeneSymbol;
                        })
                        .sort();
                    const popup = open('', '_blank', 'width=500,height=500');
                    if (popup) {
                        const div = popup.document.createElement('div');
                        popup.document.body.appendChild(div);

                        $(
                            `<h3 style="text-align:center;">${gene_panel_id}</h3><br>`
                        ).appendTo(div);
                        $(`<span>${genes.join('<br>')}</span>`).appendTo(div);
                    }
                });
        });
    });
    return anchor;
}

export function linebreakGenesetId(genesetId: string): string {
    return (
        // encode the string as the textual contents of an HTML element
        $('<div>')
            .text(genesetId)
            .html()
            // Include zero-width spaces to allow line breaks after punctuation in
            // (typically long) gs names
            .replace(/_/g, '_&#8203;')
            .replace(/\./g, '.&#8203;')
    );
}

export function makeCategoricalTrackTooltip(
    track: ICategoricalTrackSpec,
    link_id?: boolean
) {
    return function(dataUnderMouse: any[]) {
        let ret = '';
        let attr_val_counts: { [attr_val: string]: number } = {};
        for (const d of dataUnderMouse) {
            if (d.attr_val_counts) {
                for (const key of Object.keys(d.attr_val_counts)) {
                    attr_val_counts[key] = attr_val_counts[key] || 0;
                    attr_val_counts[key] += d.attr_val_counts[key];
                }
            }
        }
        const attr_vals = Object.keys(attr_val_counts);
        if (attr_vals.length > 1) {
            ret += track.label + ':<br>';
            for (let i = 0; i < attr_vals.length; i++) {
                const val = attr_vals[i];
                ret +=
                    '<span class="nobreak"><b>' +
                    val +
                    '</b>: ' +
                    attr_val_counts[val] +
                    ` sample${
                        attr_val_counts[val] === 1 ? '' : 's'
                    }</span><br>`;
            }
        } else if (attr_vals.length === 1) {
            let displayVal = attr_vals[0];
            ret +=
                track.label +
                ': <span class="nobreak"><b>' +
                displayVal +
                `</b>${
                    dataUnderMouse.length > 1
                        ? ` (${attr_val_counts[attr_vals[0]]} samples)`
                        : ''
                }</span><br>`;
        }
        let naCount = 0;
        for (const d of dataUnderMouse) {
            if (d.na) {
                naCount += 1;
            }
        }
        if (naCount > 0) {
            ret += `${track.label}: <b>N/A</b>${
                dataUnderMouse.length > 1 ? ` (${naCount} samples)` : ''
            }<br/>`;
        }
        return $('<div>')
            .addClass(TOOLTIP_DIV_CLASS)
            .append(getCaseViewElt(dataUnderMouse, !!link_id))
            .append('<br/>')
            .append(ret);
    };
}

export function makeClinicalTrackTooltip(
    track: ClinicalTrackSpec,
    link_id?: boolean
) {
    return function(dataUnderMouse: any[]) {
        let ret = '';
        if (track.datatype === 'counts') {
            const d = dataUnderMouse[0];
            for (let i = 0; i < track.countsCategoryLabels.length; i++) {
                ret +=
                    '<span class="nobreak" style="color:' +
                    track.countsCategoryFills[i] +
                    ';font-weight:bold;">' +
                    track.countsCategoryLabels[i] +
                    '</span>: ' +
                    d.attr_val_counts[track.countsCategoryLabels[i]] +
                    '<br>';
            }
        } else {
            let attr_val_counts: { [attr_val: string]: number } = {};
            for (const d of dataUnderMouse) {
                if (d.attr_val_counts) {
                    for (const key of Object.keys(d.attr_val_counts)) {
                        attr_val_counts[key] = attr_val_counts[key] || 0;
                        attr_val_counts[key] += d.attr_val_counts[key];
                    }
                }
            }
            const attr_vals = Object.keys(attr_val_counts);
            if (track.datatype === 'number') {
                // average
                let sum = 0;
                let count = 0;
                for (const attr_val of attr_vals) {
                    const numSamplesWithVal = attr_val_counts[attr_val];
                    sum += numSamplesWithVal * parseFloat(attr_val);
                    count += numSamplesWithVal;
                }
                let displayVal = (sum / count).toFixed(2);
                if (displayVal.substring(displayVal.length - 3) === '.00') {
                    displayVal = displayVal.substring(0, displayVal.length - 3);
                }
                ret +=
                    track.label +
                    ': <span class="nobreak"><b>' +
                    displayVal +
                    `${
                        count > 1 ? ` (average of ${count} values)` : ''
                    }</b></span><br>`;
            } else {
                if (attr_vals.length > 1) {
                    ret += track.label + ':<br>';
                    for (let i = 0; i < attr_vals.length; i++) {
                        const val = attr_vals[i];
                        ret +=
                            '<span class="nobreak"><b>' +
                            val +
                            '</b>: ' +
                            attr_val_counts[val] +
                            ` sample${
                                attr_val_counts[val] === 1 ? '' : 's'
                            }</span><br>`;
                    }
                } else if (attr_vals.length === 1) {
                    let displayVal = attr_vals[0];
                    ret +=
                        track.label +
                        ': <span class="nobreak"><b>' +
                        displayVal +
                        `</b>${
                            dataUnderMouse.length > 1
                                ? ` (${attr_val_counts[attr_vals[0]]} samples)`
                                : ''
                        }</span><br>`;
                }
            }
        }
        let naCount = 0;
        for (const d of dataUnderMouse) {
            if (d.na) {
                naCount += 1;
            }
        }
        if (naCount > 0 && track.na_tooltip_value) {
            ret += `${track.label}: <b>${track.na_tooltip_value}</b>${
                dataUnderMouse.length > 1 ? ` (${naCount} samples)` : ''
            }<br/>`;
        }
        return $('<div>')
            .addClass(TOOLTIP_DIV_CLASS)
            .append(getCaseViewElt(dataUnderMouse, !!link_id))
            .append('<br/>')
            .append(ret);
    };
}
export function makeHeatmapTrackTooltip(
    trackSpec: Pick<
        IBaseHeatmapTrackSpec,
        'tooltipValueLabel' | 'molecularAlterationType'
    >,
    link_id?: boolean
) {
    return function(dataUnderMouse: any[]) {
        let data_header = '';
        let valueTextElement = tooltipTextElementNaN;
        let categoryTextElement = '';

        if (trackSpec.tooltipValueLabel) {
            data_header = `${trackSpec.tooltipValueLabel}: `;
        } else {
            switch (trackSpec.molecularAlterationType) {
                case AlterationTypeConstants.MRNA_EXPRESSION:
                    data_header = 'MRNA: ';
                    break;
                case AlterationTypeConstants.PROTEIN_LEVEL:
                    data_header = 'PROT: ';
                    break;
                case AlterationTypeConstants.METHYLATION:
                    data_header = 'METHYLATION: ';
                    break;
                case AlterationTypeConstants.GENERIC_ASSAY:
                    // track for GENERIC_ASSAY type always has the genericAssayType
                    data_header = `${deriveDisplayTextFromGenericAssayType(
                        (trackSpec as IHeatmapTrackSpec).genericAssayType!
                    )}: `;
                    break;
                default:
                    data_header = 'Value: ';
                    break;
            }
        }

        let profileDataSum = 0;
        const profileCategories: string[] = [];
        let profileDataCount = 0;
        let categoryCount = 0;
        for (const d of dataUnderMouse) {
            if (
                d.profile_data !== null &&
                typeof d.profile_data !== 'undefined'
            ) {
                if (
                    trackSpec.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY &&
                    d.category
                ) {
                    profileCategories.push(d.category);
                    categoryCount += 1;
                } else {
                    profileDataSum += d.profile_data;
                    profileDataCount += 1;
                }
            }
        }

        if (profileDataCount > 0) {
            const profileDisplayValue = (
                profileDataSum / profileDataCount
            ).toFixed(2);
            if (profileDataCount === 1) {
                valueTextElement = profileDisplayValue;
            } else {
                valueTextElement = `${profileDisplayValue} (average of ${profileDataCount} values)`;
            }
        }

        if (categoryCount > 0) {
            if (profileDataCount === 0 && categoryCount === 1) {
                categoryTextElement = profileCategories[0];
            } else if (profileDataCount > 0 && categoryCount === 1) {
                categoryTextElement = `${profileCategories[0]}`;
            } else {
                categoryTextElement = `${_.uniq(profileCategories).join(
                    ', '
                )} (${categoryCount} data points)`;
            }
        }

        let ret = data_header;
        if (valueTextElement !== tooltipTextElementNaN || categoryCount === 0) {
            ret += '<b>' + valueTextElement + '</b>';
        }
        if (valueTextElement !== tooltipTextElementNaN && categoryCount > 0) {
            ret += ' and ';
        }
        if (categoryCount > 0) {
            ret += '<b>' + categoryTextElement + '</b>';
        }
        ret += '<br />';
        return $('<div>')
            .addClass(TOOLTIP_DIV_CLASS)
            .append(getCaseViewElt(dataUnderMouse, !!link_id))
            .append('<br/>')
            .append(ret);
    };
}

export function makeGeneticTrackTooltip_getCoverageInformation(
    profiled_in:
        | { genePanelId?: string; molecularProfileId: string }[]
        | undefined,
    not_profiled_in:
        | { genePanelId?: string; molecularProfileId: string }[]
        | undefined,
    alterationTypesInQuery?: string[],
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    }
): {
    dispProfiledGenePanelIds: string[];
    dispNotProfiledGenePanelIds: string[];
    dispProfiledIn: string[] | undefined;
    dispNotProfiledIn: string[] | undefined;
    dispAllProfiled: boolean;
    dispNotProfiled: boolean;
} {
    let dispProfiledGenePanelIds: string[] = [];
    let dispProfiledGenePanelIdsMap: { [genePanelId: string]: string } = {};
    let dispProfiledIn: string[] | undefined = undefined;
    let dispProfiledInMap: { [molecularProfileId: string]: string } = {};
    let dispNotProfiledIn: string[] | undefined = undefined;
    let dispNotProfiledGenePanelIds: string[] = [];
    let profiledInTypes: { [type: string]: string } | undefined = undefined;
    if (profiled_in) {
        dispProfiledGenePanelIds = _.uniq(
            (profiled_in.map(x => x.genePanelId) as (
                | string
                | undefined
            )[]).filter(x => !!x) as string[]
        );
        dispProfiledIn = _.uniq(profiled_in.map(x => x.molecularProfileId));
        if (molecularProfileIdToMolecularProfile) {
            profiledInTypes = _.keyBy(
                dispProfiledIn,
                molecularProfileId =>
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .molecularAlterationType
            );
        }
        dispProfiledInMap = _.keyBy(dispProfiledIn);
        dispProfiledGenePanelIdsMap = _.keyBy(dispProfiledGenePanelIds);
    }
    if (not_profiled_in) {
        dispNotProfiledIn = _.uniq(
            not_profiled_in.map(x => x.molecularProfileId)
        ).filter(x => !dispProfiledInMap[x]); // filter out profiles in profiled_in to avoid confusing tooltip (this occurs e.g. w multiple samples, one profiled one not)
        if (
            profiledInTypes &&
            alterationTypesInQuery &&
            molecularProfileIdToMolecularProfile
        ) {
            let notProfiledInTypes = _.keyBy(
                dispNotProfiledIn,
                molecularProfileId =>
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .molecularAlterationType
            );
            // add an entry to 'not profiled in' for each alteration type in the query iff the sample is not profiled in a profile of that type, and that type is not already accounted for.
            // This is for the case of multiple study query - eg one study has CNA profile, the other doesnt, and we want to show in a tooltip from the other study that
            //      the sample is not profiled for CNA. If the study actually has a CNA profile, then we wont show "not profiled for copy number alterations" because
            //      that will be filtered out below because its in profiledInTypes or notProfiledInTypes. Otherwise, CNA will be in alterationTypesInQuery,
            //      and it wont be covered in profiledInTypes or notProfiledInTypes, so it will make sense to say "copy number alterations" in that generality.
            dispNotProfiledIn = dispNotProfiledIn.concat(
                alterationTypesInQuery
                    .filter(t => !profiledInTypes![t] && !notProfiledInTypes[t])
                    .map(t => alterationTypeToProfiledForText[t])
            );
        }
        dispNotProfiledGenePanelIds = _.uniq(
            not_profiled_in.map(x => x.genePanelId)
        ).filter(x => !!x && !dispProfiledGenePanelIdsMap[x]) as string[];
    }
    const dispAllProfiled = !!(
        dispProfiledIn &&
        dispProfiledIn.length &&
        dispNotProfiledIn &&
        !dispNotProfiledIn.length
    );
    const dispNotProfiled = !!(
        dispNotProfiledIn &&
        dispNotProfiledIn.length &&
        dispProfiledIn &&
        !dispProfiledIn.length
    );
    return {
        dispProfiledGenePanelIds,
        dispNotProfiledGenePanelIds,
        dispProfiledIn,
        dispNotProfiledIn,
        dispAllProfiled,
        dispNotProfiled,
    };
}

export function getCaseViewElt(
    dataUnderMouse: {
        sample?: string;
        patient: string;
        study_id: string;
    }[],
    caseViewLinkout: boolean
) {
    if (!dataUnderMouse.length) {
        return '';
    }

    let caseIdElt;
    if (dataUnderMouse[0].sample) {
        if (dataUnderMouse.length > 1) {
            caseIdElt = caseViewLinkout
                ? `<a class="nobreak" href=${getSampleViewUrl(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].sample,
                      dataUnderMouse.map(d => ({
                          studyId: d.study_id,
                          patientId: d.patient,
                      }))
                  )} target="_blank">View these ${
                      dataUnderMouse.length
                  } samples<a/>`
                : `<span class="nobreak">${dataUnderMouse.length} samples</span>`;
        } else {
            caseIdElt = caseViewLinkout
                ? sampleViewAnchorTag(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].sample
                  )
                : `<span class="nobreak">${dataUnderMouse[0].sample}</span>`;
        }
    } else if (dataUnderMouse[0].patient) {
        if (dataUnderMouse.length > 1) {
            caseIdElt = caseViewLinkout
                ? `<a class="nobreak" href=${getPatientViewUrl(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].patient,
                      dataUnderMouse.map(d => ({
                          studyId: d.study_id,
                          patientId: d.patient!,
                      }))
                  )} target="_blank">View these ${
                      dataUnderMouse.length
                  } patients<a/>`
                : `<span class="nobreak">${dataUnderMouse.length} patients</span>`;
        } else {
            caseIdElt = caseViewLinkout
                ? patientViewAnchorTag(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].patient
                  )
                : `<span class="nobreak">${dataUnderMouse[0].patient}</span>`;
        }
    } else {
        caseIdElt = '';
    }
    return caseIdElt;
}

export function makeGeneticTrackTooltip(
    caseViewLinkout: boolean,
    getMolecularProfileMap?: () =>
        | { [molecularProfileId: string]: MolecularProfile }
        | undefined,
    alterationTypesInQuery?: string[]
) {
    // TODO: all the data here is old API data
    function listOfMutationDataToHTML(
        data: any[],
        multipleSamplesUnderMouse: boolean
    ) {
        const countsMap = new ListIndexedMapOfCounts();
        for (const d of data) {
            countsMap.increment(
                d.hugo_gene_symbol,
                d.amino_acid_change,
                d.cancer_hotspots_hotspot,
                d.oncokb_oncogenic,
                d.driver_filter,
                d.driver_filter_annotation,
                d.driver_tiers_filter,
                d.driver_tiers_filter_annotation,
                d.germline
            );
        }
        return countsMap
            .entries()
            .map(
                ({
                    key: [
                        hugo_gene_symbol,
                        amino_acid_change,
                        cancer_hotspots_hotspot,
                        oncokb_oncogenic,
                        driver_filter,
                        driver_filter_annotation,
                        driver_tiers_filter,
                        driver_tiers_filter_annotation,
                        germline,
                    ],
                    value: count,
                }) => {
                    var ret = $('<span>').addClass('nobreak');
                    ret.append(
                        `<b class="nobreak">${hugo_gene_symbol} ${amino_acid_change}</b>`
                    );
                    if (cancer_hotspots_hotspot) {
                        ret.append(
                            `<img src="${hotspotsImg}" title="Hotspot" style="height:11px; width:11px; margin-left:3px"/>`
                        );
                    }
                    if (oncokb_oncogenic) {
                        ret.append(
                            `<img src="${oncokbImg}" title="${oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }
                    //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
                    if (driver_filter && driver_filter === PUTATIVE_DRIVER) {
                        ret.append(
                            `<img src="${customDriverImg}" title="${driver_filter}: ${driver_filter_annotation}" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }
                    //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
                    if (driver_tiers_filter) {
                        ret.append(
                            `<img src="${customDriverTiersImg}" title="${driver_tiers_filter}: ${driver_tiers_filter_annotation}" alt="driver tiers filter" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }

                    // AT THE END, append germline symbol if necessary
                    if (germline) {
                        ret.append(generateGermlineLabel());
                    }
                    // finally, add the number of samples with this, if multipleSamplesUnderMouse
                    if (multipleSamplesUnderMouse) {
                        ret.append(`&nbsp;(${count})`);
                    }
                    return ret;
                }
            );
    }
    function listOfStructuralVariantDataToHTML(
        data: any[],
        multipleSamplesUnderMouse: boolean
    ) {
        const countsMap = new ListIndexedMapOfCounts();
        for (const d of data) {
            countsMap.increment(
                d.site1HugoSymbol,
                d.site2HugoSymbol,
                d.eventInfo,
                d.variantClass,
                d.oncokb_oncogenic
            );
        }
        return countsMap
            .entries()
            .map(
                ({
                    key: [
                        site1HugoSymbol,
                        site2HugoSymbol,
                        eventInfo,
                        variantClass,
                        oncokb_oncogenic,
                    ],
                    value: count,
                }) => {
                    var ret = $('<span>').addClass('nobreak');
                    ret.append(
                        `<b class="nobreak">${site1HugoSymbol}${
                            site2HugoSymbol ? '-' + site2HugoSymbol : ''
                        }, ${variantClass}, Event Info: ${eventInfo}</b>`
                    );
                    if (oncokb_oncogenic) {
                        ret.append(
                            `<img src="${oncokbImg}" title="${oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }

                    // finally, add the number of samples with this, if multipleSamplesUnderMouse
                    if (multipleSamplesUnderMouse) {
                        ret.append(`&nbsp;(${count})`);
                    }
                    return ret;
                }
            );
    }
    function listOfCNAToHTML(data: any[], multipleSamplesUnderMouse: boolean) {
        const countsMap = new ListIndexedMapOfCounts();
        for (const d of data) {
            countsMap.increment(
                d.hugo_gene_symbol,
                d.cna,
                d.oncokb_oncogenic,
                d.driver_filter,
                d.driver_filter_annotation,
                d.driver_tiers_filter,
                d.driver_tiers_filter_annotation
            );
        }
        return countsMap
            .entries()
            .map(
                ({
                    key: [
                        hugo_gene_symbol,
                        cna,
                        oncokb_oncogenic,
                        driver_filter,
                        driver_filter_annotation,
                        driver_tiers_filter,
                        driver_tiers_filter_annotation,
                    ],
                    value: count,
                }) => {
                    var ret = $('<span>').addClass('nobreak');
                    ret.append(
                        `<b class="nobreak">${hugo_gene_symbol} ${cna}</b>`
                    );
                    if (oncokb_oncogenic) {
                        ret.append(
                            `<img src=${oncokbImg} title="${oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }
                    //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
                    if (driver_filter && driver_filter === PUTATIVE_DRIVER) {
                        ret.append(
                            `<img src="${customDriverImg}" title="${driver_filter}: ${driver_filter_annotation}" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }
                    //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
                    if (driver_tiers_filter) {
                        ret.append(
                            `<img src="${customDriverTiersImg}" title="${driver_tiers_filter}: ${driver_tiers_filter_annotation}" alt="driver tiers filter" style="height:11px; width:11px;margin-left:3px"/>`
                        );
                    }
                    // finally, add the number of samples with this, if multipleSamplesUnderMouse
                    if (multipleSamplesUnderMouse) {
                        ret.append(`&nbsp;(${count})`);
                    }
                    return ret;
                }
            );
    }
    function listOfMRNAOrPROTToHTML(
        data: any[],
        multipleSamplesUnderMouse: boolean
    ) {
        const countsMap = new ListIndexedMapOfCounts();
        for (const d of data) {
            countsMap.increment(d.hugo_gene_symbol, d.direction);
        }
        return countsMap
            .entries()
            .map(({ key: [hugo_gene_symbol, direction], value: count }) => {
                var ret = $('<span>').addClass('nobreak');
                ret.append(
                    `<b class="nobreak">${hugo_gene_symbol} ${direction}</b>`
                );
                // finally, add the number of samples with this, if multipleSamplesUnderMouse
                if (multipleSamplesUnderMouse) {
                    ret.append(`&nbsp;(${count})`);
                }
                return ret;
            });
    }

    function generateGermlineLabel() {
        const ret = $('<small style="color: #ff0000">');
        ret.append('&nbsp;Germline');
        return ret;
    }

    const disp_cna: { [integerCN: string]: string } = {
        '-2': 'HOMODELETED',
        '-1': 'HETLOSS',
        '1': 'GAIN',
        '2': 'AMPLIFIED',
    };
    return function(
        dataUnderMouse: Pick<
            GeneticTrackDatum,
            | 'trackLabel'
            | 'data'
            | 'profiled_in'
            | 'sample'
            | 'patient'
            | 'study_id'
            | 'na'
            | 'not_profiled_in'
            | 'disp_germ'
        >[]
    ) {
        const ret = $('<div>').addClass(TOOLTIP_DIV_CLASS);
        ret.append(getCaseViewElt(dataUnderMouse, caseViewLinkout)).append(
            '<br/>'
        );
        let mutations: any[] = [];
        let cna: any[] = [];
        let mrna: any[] = [];
        let prot: any[] = [];
        let structuralVariants: any[] = [];
        // collect all data under mouse
        for (const d of dataUnderMouse) {
            for (let i = 0; i < d.data.length; i++) {
                const datum = d.data[i];
                const molecularAlterationType =
                    datum.molecularProfileAlterationType;
                const hugoGeneSymbol = datum.hugoGeneSymbol;
                switch (molecularAlterationType) {
                    case AlterationTypeConstants.MUTATION_EXTENDED: {
                        const tooltip_datum: any = {};
                        tooltip_datum.hugo_gene_symbol = hugoGeneSymbol;
                        tooltip_datum.amino_acid_change = datum.proteinChange;
                        tooltip_datum.driver_filter = datum.driverFilter;
                        tooltip_datum.driver_filter_annotation =
                            datum.driverFilterAnnotation;
                        tooltip_datum.driver_tiers_filter =
                            datum.driverTiersFilter;
                        tooltip_datum.driver_tiers_filter_annotation =
                            datum.driverTiersFilterAnnotation;
                        if (datum.isHotspot) {
                            tooltip_datum.cancer_hotspots_hotspot = true;
                        }
                        if (!isNotGermlineMutation(datum)) {
                            tooltip_datum.germline = true;
                        }
                        const oncokb_oncogenic = datum.oncoKbOncogenic;
                        if (oncokb_oncogenic) {
                            tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
                        }
                        mutations.push(tooltip_datum);
                        break;
                    }
                    case AlterationTypeConstants.STRUCTURAL_VARIANT: {
                        const tooltip_datum: any = {};
                        const structuralVariantDatum: StructuralVariant = datum as any;
                        tooltip_datum.site1HugoSymbol =
                            structuralVariantDatum.site1HugoSymbol;
                        tooltip_datum.site2HugoSymbol =
                            structuralVariantDatum.site2HugoSymbol;
                        tooltip_datum.eventInfo =
                            structuralVariantDatum.eventInfo;
                        tooltip_datum.variantClass =
                            structuralVariantDatum.variantClass;
                        const oncokb_oncogenic = datum.oncoKbOncogenic;
                        if (oncokb_oncogenic) {
                            tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
                        }
                        structuralVariants.push(tooltip_datum);
                        break;
                    }
                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                        if (
                            disp_cna.hasOwnProperty(
                                datum.value as CustomDriverNumericGeneMolecularData['value']
                            )
                        ) {
                            const tooltip_datum: any = {
                                cna:
                                    disp_cna[
                                        datum.value as CustomDriverNumericGeneMolecularData['value']
                                    ],
                                hugo_gene_symbol: hugoGeneSymbol,
                            };
                            tooltip_datum.driver_filter = datum.driverFilter;
                            tooltip_datum.driver_filter_annotation =
                                datum.driverFilterAnnotation;
                            tooltip_datum.driver_tiers_filter =
                                datum.driverTiersFilter;
                            tooltip_datum.driver_tiers_filter_annotation =
                                datum.driverTiersFilterAnnotation;
                            const oncokb_oncogenic = datum.oncoKbOncogenic;
                            if (oncokb_oncogenic) {
                                tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
                            }
                            cna.push(tooltip_datum);
                        }
                        break;
                    case AlterationTypeConstants.MRNA_EXPRESSION:
                    case AlterationTypeConstants.PROTEIN_LEVEL:
                        let direction = datum.alterationSubType;
                        let array =
                            molecularAlterationType ===
                            AlterationTypeConstants.MRNA_EXPRESSION
                                ? mrna
                                : prot;
                        if (direction === 'high') {
                            array.push({
                                hugo_gene_symbol: hugoGeneSymbol,
                                direction: 'HIGH',
                            });
                        } else if (direction === 'low') {
                            array.push({
                                hugo_gene_symbol: hugoGeneSymbol,
                                direction: 'LOW',
                            });
                        }
                        break;
                }
            }
        }
        if (structuralVariants.length > 0) {
            ret.append('Structural Variant: ');
            structuralVariants = listOfStructuralVariantDataToHTML(
                structuralVariants,
                dataUnderMouse.length > 1
            );
            for (var i = 0; i < structuralVariants.length; i++) {
                if (i > 0) {
                    ret.append(',');
                }
                ret.append(structuralVariants[i]);
            }
            ret.append('<br>');
        }
        if (mutations.length > 0) {
            ret.append('Mutation: ');
            mutations = listOfMutationDataToHTML(
                mutations,
                dataUnderMouse.length > 1
            );
            for (var i = 0; i < mutations.length; i++) {
                if (i > 0) {
                    ret.append(', ');
                }
                ret.append(mutations[i]);
            }
            ret.append('<br>');
        }
        if (cna.length > 0) {
            ret.append('Copy Number Alteration: ');
            cna = listOfCNAToHTML(cna, dataUnderMouse.length > 1);
            for (var i = 0; i < cna.length; i++) {
                if (i > 0) {
                    ret.append(', ');
                }
                ret.append(cna[i]);
            }
            ret.append('<br>');
        }
        if (mrna.length > 0) {
            ret.append('MRNA: ');
            mrna = listOfMRNAOrPROTToHTML(mrna, dataUnderMouse.length > 1);
            for (var i = 0; i < mrna.length; i++) {
                if (i > 0) {
                    ret.append(', ');
                }
                ret.append(mrna[i]);
            }
            ret.append('<br>');
        }
        if (prot.length > 0) {
            ret.append('PROT: ');
            prot = listOfMRNAOrPROTToHTML(prot, dataUnderMouse.length > 1);
            for (var i = 0; i < prot.length; i++) {
                if (i > 0) {
                    ret.append(', ');
                }
                ret.append(prot[i]);
            }
            ret.append('<br>');
        }
        // Gene panel coverage
        const molecularProfileMap =
            getMolecularProfileMap && getMolecularProfileMap();
        const profiledGenePanelCounts = new ListIndexedMapOfCounts<string>();
        const notProfiledGenePanelCounts = new ListIndexedMapOfCounts<string>();
        const profiledMolecularProfileCounts = new ListIndexedMapOfCounts<
            string
        >();
        const notProfiledMolecularProfileCounts = new ListIndexedMapOfCounts<
            string
        >();
        let allProfiledCount = 0;
        let noneProfiledCount = 0;

        for (const d of dataUnderMouse) {
            const coverageInformation = makeGeneticTrackTooltip_getCoverageInformation(
                d.profiled_in,
                d.not_profiled_in,
                alterationTypesInQuery,
                molecularProfileMap
            );
            for (const genePanelId of coverageInformation.dispProfiledGenePanelIds) {
                profiledGenePanelCounts.increment(genePanelId);
            }
            for (const genePanelId of coverageInformation.dispNotProfiledGenePanelIds) {
                notProfiledGenePanelCounts.increment(genePanelId);
            }
            if (coverageInformation.dispProfiledIn) {
                for (const molecularProfileId of coverageInformation.dispProfiledIn) {
                    profiledMolecularProfileCounts.increment(
                        molecularProfileId
                    );
                }
            }
            if (coverageInformation.dispNotProfiledIn) {
                for (const molecularProfileId of coverageInformation.dispNotProfiledIn) {
                    notProfiledMolecularProfileCounts.increment(
                        molecularProfileId
                    );
                }
            }
            if (coverageInformation.dispAllProfiled) {
                allProfiledCount += 1;
            } else if (coverageInformation.dispNotProfiled) {
                noneProfiledCount += 1;
            }
        }
        const profiledGenePanelEntries = profiledGenePanelCounts.entries();
        const notProfiledGenePanelEntries = notProfiledGenePanelCounts.entries();

        if (
            profiledGenePanelEntries.length ||
            notProfiledGenePanelEntries.length
        ) {
            ret.append('Gene Panels: ');
            let needsCommaFirst = false;
            for (const entry of profiledGenePanelEntries) {
                if (needsCommaFirst) {
                    ret.append(',&nbsp;');
                }
                needsCommaFirst = true;
                ret.append(
                    makeGenePanelPopupLink(
                        entry.key[0],
                        true,
                        dataUnderMouse.length > 1 ? entry.value : undefined
                    )
                );
            }
            for (const entry of notProfiledGenePanelEntries) {
                if (profiledGenePanelCounts.has(...entry.key)) {
                    // only add again, as "not profiled", if we didn't already add it as "profiled"
                    continue;
                }
                if (needsCommaFirst) {
                    ret.append(',&nbsp;');
                }
                needsCommaFirst = true;
                ret.append(
                    makeGenePanelPopupLink(
                        entry.key[0],
                        false,
                        dataUnderMouse.length > 1 ? entry.value : undefined
                    )
                );
            }
            ret.append('<br>');
        }

        // Molecular profile coverage
        const profiledInEntries = profiledMolecularProfileCounts.entries();
        const notProfiledInEntries = notProfiledMolecularProfileCounts.entries();

        // only show specifics if not all profiled or all unprofiled
        if (allProfiledCount === dataUnderMouse.length) {
            ret.append(
                'Profiled in all selected molecular profiles.' +
                    (dataUnderMouse.length > 1 ? ` (${allProfiledCount})` : '')
            );
            ret.append('<br>');
        } else if (noneProfiledCount === dataUnderMouse.length) {
            if (
                profiledGenePanelEntries.length ||
                notProfiledGenePanelEntries.length
            ) {
                ret.append(
                    `${dataUnderMouse[0].trackLabel} is not in the gene panels of the selected molecular profiles, but detected as a fusion partner`
                );
            } else {
                ret.append(
                    'Not profiled in selected molecular profiles.' +
                        (dataUnderMouse.length > 1
                            ? ` (${noneProfiledCount})`
                            : '')
                );
            }
            ret.append('<br>');
        } else {
            if (profiledInEntries.length) {
                ret.append(
                    'Profiled in: ' +
                        profiledInEntries
                            .map(e => {
                                const molecularProfileId = e.key[0];
                                let displayName = molecularProfileId;
                                if (
                                    molecularProfileMap &&
                                    molecularProfileId in molecularProfileMap
                                ) {
                                    displayName =
                                        molecularProfileMap[molecularProfileId]
                                            .name;
                                }
                                return `<span class="nobreak">${displayName}${
                                    dataUnderMouse.length > 1
                                        ? ` (${e.value})`
                                        : ''
                                }</span>`;
                            })
                            .join(', ')
                );
                ret.append('<br>');
            }
            if (notProfiledInEntries.length) {
                ret.append(
                    `<span class="nobreak" style='color:red; font-weight:bold'>Not profiled in: ` +
                        notProfiledInEntries
                            .map(e => {
                                const molecularProfileId = e.key[0];
                                let displayName = molecularProfileId;
                                if (
                                    molecularProfileMap &&
                                    molecularProfileId in molecularProfileMap
                                ) {
                                    displayName =
                                        molecularProfileMap[molecularProfileId]
                                            .name;
                                }
                                return `<span class="nobreak">${displayName}${
                                    dataUnderMouse.length > 1
                                        ? ` (${e.value})`
                                        : ''
                                }</span>`;
                            })
                            .join(', ') +
                        '</span>'
                );
                ret.append('<br>');
            }
            if (allProfiledCount > 0) {
                ret.append(
                    'Profiled in all selected molecular profiles.' +
                        (dataUnderMouse.length > 1
                            ? ` (${allProfiledCount})`
                            : '')
                );
                ret.append('<br>');
            }
            if (noneProfiledCount > 0) {
                ret.append(
                    'Not profiled in selected molecular profiles.' +
                        (dataUnderMouse.length > 1
                            ? ` (${noneProfiledCount})`
                            : '')
                );
                ret.append('<br>');
            }
        }
        return ret;
    };
}
