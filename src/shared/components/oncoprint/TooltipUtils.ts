import {getPatientViewUrl, getSampleViewUrl} from "../../api/urls";
import $ from "jquery";
import {
    GeneMolecularData, GenePanel, GenePanelData, MolecularProfile,
    Mutation
} from "../../api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {ClinicalTrackSpec, GeneticTrackDatum} from "./Oncoprint";
import {
    AnnotatedExtendedAlteration, AnnotatedMutation,
    ExtendedAlteration
} from "../../../pages/resultsView/ResultsViewPageStore";

export const TOOLTIP_DIV_CLASS = "oncoprint__tooltip";

function sampleViewAnchorTag(study_id:string, sample_id:string) {
    return `<a href="${getSampleViewUrl(study_id, sample_id)}" target="_blank">${sample_id}</a>`;
}
function patientViewAnchorTag(study_id:string, patient_id:string) {
    return `<a href="${getPatientViewUrl(study_id, patient_id)}" target="_blank">${patient_id}</a>`;
};

function makeGenePanelPopupLink(gene_panel_id:string) {
    let anchor = $(`<a href="#" oncontextmenu="return false;">${gene_panel_id}</a>`);
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
        if (genetic_alteration_type === "MRNA_EXPRESSION") {
            data_header = 'MRNA: ';
        } else if (genetic_alteration_type === "PROTEIN_LEVEL") {
            data_header = 'PROT: ';
        }
        if ((d.profile_data !== null) && (typeof d.profile_data !== "undefined")) {
            profile_data = d.profile_data.toFixed(2);
        }
        let ret = data_header + '<b>' + profile_data + '</b><br>';
        ret += (d.sample ? (link_id ? sampleViewAnchorTag(d.study, d.sample) : d.sample) : (link_id ? patientViewAnchorTag(d.study, d.patient) : d.patient));
        return $('<div>').addClass(TOOLTIP_DIV_CLASS).append(ret);
    };
};
export function makeGeneticTrackTooltip(
    link_id?:boolean
) {
    // TODO: all the data here is old API data
    function listOfMutationOrFusionDataToHTML(data:any[]) {
        return data.map(function(d:any) {
            var ret = $('<span>');
            ret.append('<b>'+d.amino_acid_change+'</b>');
            if (d.cancer_hotspots_hotspot) {
                ret.append('<img src="images/cancer-hotspots.svg" title="Hotspot" style="height:11px; width:11px; margin-left:3px"/>');
            }
            if (d.oncokb_oncogenic) {
                ret.append('<img src="images/oncokb-oncogenic-1.svg" title="'+d.oncokb_oncogenic+'" style="height:11px; width:11px;margin-left:3px"/>');
            }
            //If we have data for the binary custom driver annotations, append an icon to the tooltip with the annotation information
            if (d.driver_filter && d.driver_filter === "Putative_Driver") {
                ret.append('<img src="images/driver.png" title="'+d.driver_filter+': '+d.driver_filter_annotation+'" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>');
            }
            //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
            if (d.driver_tiers_filter) {
                ret.append('<img src="images/driver_tiers.png" title="'+d.driver_tiers_filter+': '+d.driver_tiers_filter_annotation+'" alt="driver tiers filter" style="height:11px; width:11px;margin-left:3px"/>');
            }
            return ret;
        });
    };
    function listOfCNAToHTML(data:any[]) {
        return data.map(function(d:any) {
            var ret = $('<span>');
            ret.append('<b>'+d.cna+'</b>');
            if (d.oncokb_oncogenic) {
                ret.append('<img src="images/oncokb-oncogenic-1.svg" title="'+d.oncokb_oncogenic+'" style="height:11px; width:11px;margin-left:3px"/>');
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
    return function (d:GeneticTrackDatum) {
        const ret = $('<div>').addClass(TOOLTIP_DIV_CLASS);
        let mutations:any[] = [];
        let cna:any[] = [];
        const mrna:("UPREGULATED"|"DOWNREGULATED")[] = [];
        const prot:("UPREGULATED"|"DOWNREGULATED")[] = [];
        let fusions:any[] = [];
        for (let i = 0; i < d.data.length; i++) {
            const datum = d.data[i];
            const molecularAlterationType = datum.molecularProfileAlterationType;
            switch (molecularAlterationType) {
                case "MUTATION_EXTENDED":
                    const tooltip_datum:any = {};
                    tooltip_datum.amino_acid_change = datum.proteinChange;
                    tooltip_datum.driver_filter = datum.driverFilter;
                    tooltip_datum.driver_filter_annotation = datum.driverFilterAnnotation;
                    tooltip_datum.driver_tiers_filter = datum.driverTiersFilter;
                    tooltip_datum.driver_tiers_filter_annotation = datum.driverTiersFilterAnnotation;
                    if (datum.isHotspot) {
                        tooltip_datum.cancer_hotspots_hotspot = true;
                    }
                    const oncokb_oncogenic = datum.oncoKbOncogenic;
                    if (oncokb_oncogenic) {
                        tooltip_datum.oncokb_oncogenic = oncokb_oncogenic;
                    }
                    (datum.alterationSubType === "fusion" ? fusions : mutations).push(tooltip_datum);
                    break;
                case "COPY_NUMBER_ALTERATION":
                    if (disp_cna.hasOwnProperty((datum as GeneMolecularData).value)) {
                        const tooltip_datum:any = {
                            cna: disp_cna[(datum as GeneMolecularData).value]
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
                        array.push("UPREGULATED");
                    } else if (direction === "down") {
                        array.push("DOWNREGULATED");
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
                    ret.append(",");
                }
                ret.append(mutations[i]);
            }
            if (d.disp_germ) {
                ret.append(generateGermlineLabel());
            }
            ret.append('<br>');
        }
        if (cna.length > 0) {
            ret.append('Copy Number Alteration: ');
            cna = listOfCNAToHTML(cna);
            for (var i = 0; i < cna.length; i++) {
                if (i > 0) {
                    ret.append(",");
                }
                ret.append(cna[i]);
            }
            ret.append('<br>');
        }
        if (mrna.length > 0) {
            ret.append('MRNA: <b>' + mrna.join(", ") + '</b><br>');
        }
        if (prot.length > 0) {
            ret.append('PROT: <b>' + prot.join(", ") + '</b><br>');
        }
        // Coverage
        let coverage_elts:any[] = (d.coverage || []).map((x:GenePanelData)=>{
            return makeGenePanelPopupLink(x.genePanelId);
        });
        if (d.wholeExomeSequenced) {
            coverage_elts.push("Whole-Exome Sequencing");
        }
        if (coverage_elts.length) {
            ret.append("Coverage: ");
            for (var i = 0; i < coverage_elts.length; i++) {
                if (i > 0) {
                    ret.append(",");
                }
                ret.append(coverage_elts[i]);
            }
            ret.append("<br>");
        }
        if (d.na) {
            ret.append('Not sequenced');
            ret.append('<br>');
        }
        let caseIdElt;
        if (d.sample) {
            caseIdElt = link_id ? sampleViewAnchorTag(d.study_id, d.sample) : d.sample;
        } else if (d.patient) {
            caseIdElt = link_id ? patientViewAnchorTag(d.study_id, d.patient) : d.patient;
        } else {
            caseIdElt = "";
        }
        ret.append(caseIdElt);
        return ret;
    };
}
