import {getPatientViewUrl, getSampleViewUrl} from "../../api/urls";
import $ from "jquery";
import {GenePanel, MolecularProfile, Mutation} from "../../api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {ClinicalTrackSpec} from "./Oncoprint";

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
                const div = popup.document.createElement("div");
                popup.document.body.appendChild(div);

                $(`<h3 style="text-align:center;">${gene_panel_id}</h3><br>`).appendTo(div);
                $(genes.join("<br>")).appendTo(div);
            });
        });
    });
    return anchor;
}
export function makeClinicalTrackTooltip(track:ClinicalTrackSpec<any>, link_id?:boolean) {
    return function(d:any) {
        let ret = '';
        if (track.datatype === "counts") {
            for (let i=0; i<track.countsCategoryLabels.length; i++) {
                ret += '<span style="color:' + track.countsCategoryFills[i] + ';font-weight:bold;">'+track.countsCategoryLabels[i]+'</span>: '+d.attr_val_counts[track.countsCategoryLabels[i]]+'<br>';
            }
        } else {
            const attr_vals = ((d.attr_val_counts && Object.keys(d.attr_val_counts)) || []);
            if (attr_vals.length > 1) {
                ret += 'values:<br>';
                for (let i = 0; i < attr_vals.length; i++) {
                    const val = attr_vals[i];
                    ret += '<b>' + val + '</b>: ' + d.attr_val_counts[val] + '<br>';
                }
            } else if (attr_vals.length === 1) {
                ret += 'value: <b>' + attr_vals[0] + '</b><br>';
            }
        }
        ret += (link_id ? (d.sample? sampleViewAnchorTag(d.study_id, d.sample) : patientViewAnchorTag(d.study_id, d.patient))
            : (d.sample ? d.sample : d.patient));
        return ret;
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
            profile_data = d.profile_data.toString();
        }
        let ret = data_header + '<b>' + profile_data + '</b><br>';
        ret += (d.sample ? (link_id ? sampleViewAnchorTag(d.study, d.sample) : d.sample) : (link_id ? patientViewAnchorTag(d.study, d.patient) : d.patient));
        return ret;
    };
};
export function makeGeneticTrackTooltip(showBinaryCustomDriverAnnotation?:boolean, showTiersCustomDriverAnnotation?:boolean, link_id?:boolean) {
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
            if (d.driver_filter && showBinaryCustomDriverAnnotation) {
                ret.append('<img src="images/driver.png" title="'+d.driver_filter+': '+d.driver_filter_annotation+'" alt="driver filter" style="height:11px; width:11px;margin-left:3px"/>');
            }
            //If we have data for the class custom driver annotations, append an icon to the tooltip with the annotation information
            if (d.driver_tiers_filter && showTiersCustomDriverAnnotation) {
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
    };
    const oncogenic = ["likely oncogenic", "predicted oncogenic", "oncogenic"];
    return function (d:any) {
        const ret = $('<div>');
        let mutations:any[] = [];
        let cna:any[] = [];
        const mrna:any[] = [];
        const prot:any[] = [];
        let fusions:any[] = [];
        for (let i = 0; i < d.data.length; i++) {
            const datum = d.data[i];
            if (datum.genetic_alteration_type === "MUTATION_EXTENDED") {
                const tooltip_datum:any = {'amino_acid_change': datum.amino_acid_change, 'driver_filter': datum.driver_filter,
                    'driver_filter_annotation': datum.driver_filter_annotation, 'driver_tiers_filter': datum.driver_tiers_filter,
                    'driver_tiers_filter_annotation': datum.driver_tiers_filter_annotation};
                if (datum.cancer_hotspots_hotspot) {
                    tooltip_datum.cancer_hotspots_hotspot = true;
                }
                if (typeof datum.oncokb_oncogenic !== "undefined" && oncogenic.indexOf(datum.oncokb_oncogenic) > -1) {
                    tooltip_datum.oncokb_oncogenic = datum.oncokb_oncogenic;
                }
                (datum.oncoprint_mutation_type === "fusion" ? fusions : mutations).push(tooltip_datum);
            } else if (datum.genetic_alteration_type === "COPY_NUMBER_ALTERATION") {
                const disp_cna:{[integerCN:string]:string} = {'-2': 'HOMODELETED', '-1': 'HETLOSS', '1': 'GAIN', '2': 'AMPLIFIED'};
                if (disp_cna.hasOwnProperty(datum.profile_data)) {
                    const tooltip_datum:any = {
                        cna: disp_cna[datum.profile_data]
                    };
                    if (typeof datum.oncokb_oncogenic !== "undefined" && oncogenic.indexOf(datum.oncokb_oncogenic) > -1) {
                        tooltip_datum.oncokb_oncogenic = datum.oncokb_oncogenic;
                    }
                    cna.push(tooltip_datum);
                }
            } else if (datum.genetic_alteration_type === "MRNA_EXPRESSION" || datum.genetic_alteration_type === "PROTEIN_LEVEL") {
                if (datum.oql_regulation_direction) {
                    (datum.genetic_alteration_type === "MRNA_EXPRESSION" ? mrna : prot)
                        .push(datum.oql_regulation_direction === 1 ? "UPREGULATED" : "DOWNREGULATED");
                }
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
        if (typeof d.coverage !== "undefined") {
            ret.append("Coverage: ");
            var coverage_elts = d.coverage.filter(function (x:string) {
                return x !== "1"; //code for whole-exome seq
            }).map(function (id:string) {
                return makeGenePanelPopupLink(id);
            });
            if (d.coverage.indexOf("1") > -1) {
                coverage_elts.push("Whole-Exome Sequencing");
            }
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
        ret.append((d.sample ? (link_id ? sampleViewAnchorTag(d.study_id, d.sample) : d.sample) : (link_id ? patientViewAnchorTag(d.study_id, d.patient) : d.patient)));
        return ret;
    };
}