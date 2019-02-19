import {getPatientViewUrl, getSampleViewUrl} from "../../api/urls";
import $ from "jquery";
import {
    NumericGeneMolecularData, GenePanel, GenePanelData, MolecularProfile,
    Mutation
} from "../../api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {ClinicalTrackSpec, GeneticTrackDatum} from "./Oncoprint";
import {
    AnnotatedExtendedAlteration, AnnotatedMutation, AnnotatedNumericGeneMolecularData,
    ExtendedAlteration,
    AlterationTypeConstants
} from "../../../pages/resultsView/ResultsViewPageStore";
import _ from "lodash";
import {alterationTypeToProfiledForText} from "./ResultsViewOncoprintUtils";
import {isNotGermlineMutation} from "../../lib/MutationUtils";

export const TOOLTIP_DIV_CLASS = "oncoprint__tooltip";

function sampleViewAnchorTag(study_id:string, sample_id:string) {
    return `<a href="${getSampleViewUrl(study_id, sample_id)}" target="_blank">${sample_id}</a>`;
}
function patientViewAnchorTag(study_id:string, patient_id:string) {
    return `<a href="${getPatientViewUrl(study_id, patient_id)}" target="_blank">${patient_id}</a>`;
};

function makeGenePanelPopupLink(gene_panel_id:string, profiled:boolean) {
    let anchor = $(`<a href="#" ${!profiled ? 'style="color:red;"': ""} oncontextmenu="return false;">${gene_panel_id}</a>`);
    anchor.ready(()=>{
        anchor.click(function() {
            client.getGenePanelUsingGET({ genePanelId: gene_panel_id }).then((panel:GenePanel)=>{
                const genes = panel.genes.map(function(g) { return g.hugoGeneSymbol; }).sort();
                const popup = open("", "_blank", "width=500,height=500");
                if (popup) {
                    const div = popup.document.createElement("div");
                    popup.document.body.appendChild(div);

                    $(`<h3 style="text-align:center;">${gene_panel_id}</h3><br>`).appendTo(div);
                    $(`<span>${genes.join("<br>")}</span>`).appendTo(div);
                }
            });
        });
    });
    return anchor;
}

export function linebreakGenesetId(
    genesetId: string
): string {
    return (
        // encode the string as the textual contents of an HTML element
        $('<div>').text(genesetId).html()
        // Include zero-width spaces to allow line breaks after punctuation in
        // (typically long) gs names
        .replace(/_/g, '_&#8203;')
        .replace(/\./g, '.&#8203;')
    );
}

export function makeClinicalTrackTooltip(track:ClinicalTrackSpec, link_id?:boolean) {
    return function(d:any) {
        let ret = '';
        if (track.datatype === "counts") {
            for (let i=0; i<track.countsCategoryLabels.length; i++) {
                ret += '<span style="color:' + track.countsCategoryFills[i] + ';font-weight:bold;">'+track.countsCategoryLabels[i]+'</span>: '+d.attr_val_counts[track.countsCategoryLabels[i]]+'<br>';
            }
        } else {
            const attr_vals = ((d.attr_val_counts && Object.keys(d.attr_val_counts)) || []);
            if (attr_vals.length > 1) {
                ret += track.label+':<br>';
                for (let i = 0; i < attr_vals.length; i++) {
                    const val = attr_vals[i];
                    ret += '<b>' + val + '</b>: ' + d.attr_val_counts[val] + '<br>';
                }
            } else if (attr_vals.length === 1) {
                let displayVal = attr_vals[0];
                if (track.datatype === "number") {
                    displayVal = parseFloat(attr_vals[0]).toFixed(2);
                    if (displayVal.substring(displayVal.length-3) === ".00") {
                        displayVal = displayVal.substring(0, displayVal.length-3);
                    }
                }
                ret += track.label+': <b>' + displayVal + '</b><br>';
            }
        }
        if (d.na && track.na_tooltip_value) {
            ret += `${track.label}: <b>${track.na_tooltip_value}</b><br/>`;
        }
        ret += '<span>'+(d.sample ? "Sample" : "Patient")+": ";
        ret += (link_id ? (d.sample? sampleViewAnchorTag(d.study_id, d.sample) : patientViewAnchorTag(d.study_id, d.patient))
            : (d.sample ? d.sample : d.patient));
        ret += '</span>';
        return $('<div>').addClass(TOOLTIP_DIV_CLASS).append(ret);
    };
}
export function makeHeatmapTrackTooltip(genetic_alteration_type:MolecularProfile["molecularAlterationType"], link_id?:boolean) {
    return function (d:any) {
        let data_header = '';
        let profile_data = 'N/A';
        switch(genetic_alteration_type) {
            case AlterationTypeConstants.MRNA_EXPRESSION:
                data_header = 'MRNA: ';
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                data_header = 'PROT: ';
                break;
            case AlterationTypeConstants.METHYLATION:
                data_header = 'METHYLATION: ';
                break;
            case AlterationTypeConstants.TREATMENT_RESPONSE:
                data_header = 'TREATMENT: ';
                break;
        }
        if ((d.profile_data !== null) && (typeof d.profile_data !== "undefined")) {
            profile_data = d.category || d.profile_data.toFixed(2);
        }
        let ret = data_header + '<b>' + profile_data + '</b><br>';
        ret += (d.sample ? (link_id ? sampleViewAnchorTag(d.study, d.sample) : d.sample) : (link_id ? patientViewAnchorTag(d.study, d.patient) : d.patient));
        return $('<div>').addClass(TOOLTIP_DIV_CLASS).append(ret);
    };
};

export function makeGeneticTrackTooltip_getCoverageInformation(
    profiled_in: {genePanelId?:string, molecularProfileId:string}[]|undefined,
    not_profiled_in: {genePanelId?:string, molecularProfileId:string}[]|undefined,
    alterationTypesInQuery?: string[],
    molecularProfileIdToMolecularProfile?: {[molecularProfileId:string]:MolecularProfile}
):{
    dispProfiledGenePanelIds: string[];
    dispNotProfiledGenePanelIds: string[];
    dispProfiledIn: string[]|undefined;
    dispNotProfiledIn: string[]|undefined;
    dispAllProfiled:boolean;
    dispNotProfiled:boolean;
} {
    let dispProfiledGenePanelIds:string[] = [];
    let dispProfiledGenePanelIdsMap:{[genePanelId:string]:string} = {};
    let dispProfiledIn:string[]|undefined = undefined;
    let dispProfiledInMap:{[molecularProfileId:string]:string} = {};
    let dispNotProfiledIn:string[]|undefined = undefined;
    let dispNotProfiledGenePanelIds:string[] = [];
    let profiledInTypes:{[type:string]:string}|undefined = undefined;
    if (profiled_in) {
        dispProfiledGenePanelIds = _.uniq((profiled_in.map(x=>x.genePanelId) as (string|undefined)[]).filter(x=>!!x) as string[]);
        dispProfiledIn = _.uniq(profiled_in.map(x=>x.molecularProfileId));
        if (molecularProfileIdToMolecularProfile) {
            profiledInTypes = _.keyBy(dispProfiledIn, molecularProfileId=>molecularProfileIdToMolecularProfile[molecularProfileId].molecularAlterationType);
        }
        dispProfiledInMap = _.keyBy(dispProfiledIn);
        dispProfiledGenePanelIdsMap = _.keyBy(dispProfiledGenePanelIds);
    }
    if (not_profiled_in) {
        dispNotProfiledIn = _.uniq(not_profiled_in.map(x=>x.molecularProfileId)).filter(x=>!dispProfiledInMap[x]); // filter out profiles in profiled_in to avoid confusing tooltip (this occurs e.g. w multiple samples, one profiled one not)
        if (profiledInTypes && alterationTypesInQuery && molecularProfileIdToMolecularProfile) {
            let notProfiledInTypes = _.keyBy(dispNotProfiledIn, molecularProfileId=>molecularProfileIdToMolecularProfile[molecularProfileId].molecularAlterationType);
            // add an entry to 'not profiled in' for each alteration type in the query iff the sample is not profiled in a profile of that type, and that type is not already accounted for.
            // This is for the case of multiple study query - eg one study has CNA profile, the other doesnt, and we want to show in a tooltip from the other study that
            //      the sample is not profiled for CNA. If the study actually has a CNA profile, then we wont show "not profiled for copy number alterations" because
            //      that will be filtered out below because its in profiledInTypes or notProfiledInTypes. Otherwise, CNA will be in alterationTypesInQuery,
            //      and it wont be covered in profiledInTypes or notProfiledInTypes, so it will make sense to say "copy number alterations" in that generality.
            dispNotProfiledIn = dispNotProfiledIn.concat(alterationTypesInQuery.filter(t=>(!profiledInTypes![t] && !notProfiledInTypes[t])).map(t=>alterationTypeToProfiledForText[t]));
        }
        dispNotProfiledGenePanelIds = _.uniq(not_profiled_in.map(x=>x.genePanelId)).filter(x=>(!!x && !dispProfiledGenePanelIdsMap[x])) as string[] ;
    }
    const dispAllProfiled = !!(dispProfiledIn && dispProfiledIn.length && dispNotProfiledIn && !dispNotProfiledIn.length);
    const dispNotProfiled = !!(dispNotProfiledIn && dispNotProfiledIn.length && dispProfiledIn && !dispProfiledIn.length);
    return {
        dispProfiledGenePanelIds, dispNotProfiledGenePanelIds, dispProfiledIn, dispNotProfiledIn, dispAllProfiled, dispNotProfiled
    };
}

export function makeGeneticTrackTooltip(
    getMolecularProfileMap?:()=>{[molecularProfileId:string]:MolecularProfile}|undefined,
    alterationTypesInQuery?:string[],
) {
    // TODO: all the data here is old API data
    function listOfMutationOrFusionDataToHTML(data:any[]) {
        return data.map(function(d:any) {
            var ret = $('<span>');
            ret.append(`<b>${d.hugo_gene_symbol} ${d.amino_acid_change}</b>`);
            if (d.cancer_hotspots_hotspot) {
                ret.append(`<img src="${require("../../../rootImages/cancer-hotspots.svg")}" title="Hotspot" style="height:11px; width:11px; margin-left:3px"/>`);
            }
            if (d.oncokb_oncogenic) {
                ret.append(`<img src="${require("../../../rootImages/oncokb-oncogenic-1.svg")}" title="${d.oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`);
            }
            //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
            if (d.driver_filter && d.driver_filter === "Putative_Driver") {
                ret.append(`<img src="${require("../../../rootImages/driver.png")}" title="${d.driver_filter}: ${d.driver_filter_annotation}" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>`);
            }
            //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
            if (d.driver_tiers_filter) {
                ret.append(`<img src="${require("../../../rootImages/driver_tiers.png")}" title="${d.driver_tiers_filter}: ${d.driver_tiers_filter_annotation}" alt="driver tiers filter" style="height:11px; width:11px;margin-left:3px"/>`);
            }


            // AT THE END, append germline symbol if necessary
            if (d.germline) {
                ret.append(generateGermlineLabel());
            }
            return ret;
        });
    };
    function listOfCNAToHTML(data:any[]) {
        return data.map(function(d:any) {
            var ret = $('<span>');
            ret.append(`<b>${d.hugo_gene_symbol} ${d.cna}</b>`);
            if (d.oncokb_oncogenic) {
                ret.append(`<img src=${require("../../../rootImages/oncokb-oncogenic-1.svg")} title="${d.oncokb_oncogenic}" style="height:11px; width:11px;margin-left:3px"/>`);
            }
            return ret;
        });
    }

    function generateGermlineLabel() {
        const ret = $('<small style="color: #ff0000">');
        ret.append('&nbsp;Germline');
        return ret;
    }

    const disp_cna:{[integerCN:string]:string} = {'-2': 'HOMODELETED', '-1': 'HETLOSS', '1': 'GAIN', '2': 'AMPLIFIED'};
    return function (d:Pick<GeneticTrackDatum, "data"|"profiled_in"|"sample"|"patient"|"study_id"|"na"|"not_profiled_in"|"disp_germ">) {
        const ret = $('<div>').addClass(TOOLTIP_DIV_CLASS);
        let mutations:any[] = [];
        let cna:any[] = [];
        const mrna:{hugo_gene_symbol:string, direction:"UPREGULATED"|"DOWNREGULATED"}[] = [];
        const prot:typeof mrna = [];
        let fusions:any[] = [];
        for (let i = 0; i < d.data.length; i++) {
            const datum = d.data[i];
            const molecularAlterationType = datum.molecularProfileAlterationType;
            const hugoGeneSymbol = datum.hugoGeneSymbol;
            switch (molecularAlterationType) {
                case "MUTATION_EXTENDED":
                    const tooltip_datum:any = {};
                    tooltip_datum.hugo_gene_symbol = hugoGeneSymbol;
                    tooltip_datum.amino_acid_change = datum.proteinChange;
                    tooltip_datum.driver_filter = datum.driverFilter;
                    tooltip_datum.driver_filter_annotation = datum.driverFilterAnnotation;
                    tooltip_datum.driver_tiers_filter = datum.driverTiersFilter;
                    tooltip_datum.driver_tiers_filter_annotation = datum.driverTiersFilterAnnotation;
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
                    (datum.alterationSubType === "fusion" ? fusions : mutations).push(tooltip_datum);
                    break;
                case "COPY_NUMBER_ALTERATION":
                    if (disp_cna.hasOwnProperty(datum.value as AnnotatedNumericGeneMolecularData["value"])) {
                        const tooltip_datum:any = {
                            cna: disp_cna[datum.value as AnnotatedNumericGeneMolecularData["value"]],
                            hugo_gene_symbol: hugoGeneSymbol
                        };
                        const oncokb_oncogenic = datum.oncoKbOncogenic;
                        if (oncokb_oncogenic) {
                            tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
                        }
                        cna.push(tooltip_datum);
                    }
                    break;
                case "MRNA_EXPRESSION":
                case "PROTEIN_LEVEL":
                    let direction = datum.alterationSubType;
                    let array = (molecularAlterationType === "MRNA_EXPRESSION" ? mrna : prot);
                    if (direction === "up") {
                        array.push({hugo_gene_symbol: hugoGeneSymbol, direction: "UPREGULATED"});
                    } else if (direction === "down") {
                        array.push({hugo_gene_symbol: hugoGeneSymbol, direction: "DOWNREGULATED"});
                    }
                    break;
            }
        }
        if (fusions.length > 0) {
            ret.append('Fusion: ');
            fusions = listOfMutationOrFusionDataToHTML(fusions);
            for (var i = 0; i < fusions.length; i++) {
                if (i > 0) {
                    ret.append(",");
                }
                ret.append(fusions[i]);
            }
            ret.append('<br>');
        }
        if (mutations.length > 0) {
            ret.append('Mutation: ');
            mutations = listOfMutationOrFusionDataToHTML(mutations);
            for (var i = 0; i < mutations.length; i++) {
                if (i > 0) {
                    ret.append(", ");
                }
                ret.append(mutations[i]);
            }
            ret.append('<br>');
        }
        if (cna.length > 0) {
            ret.append('Copy Number Alteration: ');
            cna = listOfCNAToHTML(cna);
            for (var i = 0; i < cna.length; i++) {
                if (i > 0) {
                    ret.append(", ");
                }
                ret.append(cna[i]);
            }
            ret.append('<br>');
        }
        if (mrna.length > 0) {
            ret.append(`MRNA: <b>${mrna.map(x=>`${x.hugo_gene_symbol} ${x.direction}`).join(", ")}</b><br>`);
        }
        if (prot.length > 0) {
            ret.append(`PROT: <b>${prot.map(x=>`${x.hugo_gene_symbol} ${x.direction}`).join(", ")}</b><br>`);
        }
        // CoverageInformation
        const molecularProfileMap = getMolecularProfileMap && getMolecularProfileMap();
        const coverageInformation = makeGeneticTrackTooltip_getCoverageInformation(d.profiled_in, d.not_profiled_in, alterationTypesInQuery, molecularProfileMap);
        if (coverageInformation.dispProfiledGenePanelIds.length || coverageInformation.dispNotProfiledGenePanelIds.length) {
            ret.append("Gene Panels: ");
            let needsCommaFirst = false;
            for (let i=0; i<coverageInformation.dispProfiledGenePanelIds.length; i++) {
                if (needsCommaFirst) {
                    ret.append(",");
                }
                needsCommaFirst = true;
                ret.append(makeGenePanelPopupLink(coverageInformation.dispProfiledGenePanelIds[i], true));
            }
            for (let i=0; i<coverageInformation.dispNotProfiledGenePanelIds.length; i++) {
                if (needsCommaFirst) {
                    ret.append(",");
                }
                needsCommaFirst = true;
                ret.append(makeGenePanelPopupLink(coverageInformation.dispNotProfiledGenePanelIds[i], false));
            }
            ret.append("<br>");
        }
        if (coverageInformation.dispAllProfiled) {
            ret.append("Profiled in all selected molecular profiles.");
            ret.append("<br>");
        } else if (coverageInformation.dispNotProfiled) {
            ret.append('Not profiled in selected molecular profiles.');
            ret.append('<br>');
        } else {
            if (coverageInformation.dispProfiledIn && coverageInformation.dispProfiledIn.length) {
                ret.append("Profiled in: "+coverageInformation.dispProfiledIn.map(x=>{
                        if (molecularProfileMap && (x in molecularProfileMap)) {
                            return molecularProfileMap[x].name;
                        } else {
                            return x;
                        }
                    }).join(", "));
                ret.append("<br>");
            }
            if (coverageInformation.dispNotProfiledIn && coverageInformation.dispNotProfiledIn.length) {
                ret.append("<span style='color:red; font-weight:bold'>Not profiled in: "+coverageInformation.dispNotProfiledIn.map(x=>{
                        if (molecularProfileMap && (x in molecularProfileMap)) {
                            return molecularProfileMap[x].name;
                        } else {
                            return x;
                        }
                    }).join(", ")+"</span>");
                ret.append("<br>");
            }
        }

        let caseIdElt;
        if (d.sample) {
            caseIdElt = (d.study_id.length > 0) ? sampleViewAnchorTag(d.study_id, d.sample) : d.sample;
        } else if (d.patient) {
            caseIdElt = (d.study_id.length > 0) ? patientViewAnchorTag(d.study_id, d.patient) : d.patient;
        } else {
            caseIdElt = "";
        }
        ret.append(caseIdElt);
        return ret;
    };
}
