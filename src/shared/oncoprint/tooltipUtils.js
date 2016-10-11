var tooltipUtils = {
    'sampleViewAnchorTag': function (study_id, sample_id) {
        var href = cbio.util.getLinkToSampleView(study_id, sample_id);
        return '<a href="' + href + '" target="_blank">' + sample_id + '</a>';
    },
    'patientViewAnchorTag': function(study_id, patient_id) {
        var href = cbio.util.getLinkToPatientView(study_id, patient_id);
        return '<a href="' + href + '" target="_blank">' + patient_id + '</a>';
    },
    'makeGeneticTrackTooltip':function(data_type, link_id) {
        var listOfTooltipDataToHTML = function(tooltip_data) {
            var ret = [];
            for (var i=0; i<tooltip_data.length; i++) {
                var new_ret_elt = '';
                var tooltip_datum = tooltip_data[i];
                new_ret_elt += tooltip_datum.amino_acid_change;
                if (tooltip_datum.cancer_hotspots_hotspot) {
                    new_ret_elt += ' <img src="images/oncokb-flame.svg" title="Hotspot" style="height:11px; width:11px;"/>';
                }
                if (tooltip_datum.oncokb_oncogenic) {
                    new_ret_elt += ' <img src="images/oncokb-oncogenic-1.svg" title="'+tooltip_datum.oncokb_oncogenic+'" style="height:11px; width:11px;"/>';
                }
                ret.push(new_ret_elt);
            }
            return ret.join(", ");
        };
        return function (d) {
            var ret = '';
            var mutations = [];
            var cna = [];
            var mrna = [];
            var prot = [];
            var fusions = [];
            for (var i=0; i<d.data.length; i++) {
                var datum = d.data[i];
                if (datum.genetic_alteration_type === "MUTATION_EXTENDED") {
                    var tooltip_datum = {'amino_acid_change': datum.amino_acid_change};
                    if (datum.cancer_hotspots_hotspot) {
                        tooltip_datum.cancer_hotspots_hotspot = true;
                    }
                    if (typeof datum.oncokb_oncogenic !== "undefined" && ["Likely Oncogenic", "Oncogenic"].indexOf(datum.oncokb_oncogenic) > -1) {
                        tooltip_datum.oncokb_oncogenic = datum.oncokb_oncogenic;
                    }
                    (datum.oncoprint_mutation_type === "fusion" ? fusions : mutations).push(tooltip_datum);
                } else if (datum.genetic_alteration_type === "COPY_NUMBER_ALTERATION") {
                    var disp_cna = {'-2': 'HOMODELETED', '-1': 'HETLOSS', '1': 'GAIN', '2': 'AMPLIFIED'};
                    if (disp_cna.hasOwnProperty(datum.profile_data)) {
                        cna.push(disp_cna[datum.profile_data]);
                    }
                } else if (datum.genetic_alteration_type === "MRNA_EXPRESSION" || datum.genetic_alteration_type === "PROTEIN_LEVEL") {
                    if (datum.oql_regulation_direction) {
                        (datum.genetic_alteration_type === "MRNA_EXPRESSION" ? mrna : prot)
                            .push(datum.oql_regulation_direction === 1 ? "UPREGULATED" : "DOWNREGULATED");
                    }
                }
            }
            if (fusions.length > 0) {
                ret += "Fusion: <b>" + listOfTooltipDataToHTML(fusions) +"</b><br>";
            }
            if (mutations.length > 0) {
                ret += 'Mutation: <b>' + listOfTooltipDataToHTML(mutations) +'</b><br>';
            }
            if (cna.length > 0) {
                ret += 'Copy Number Alteration: <b>'+cna.join(", ")+'</b><br>';
            }
            if (mrna.length > 0) {
                ret += 'MRNA: <b>' + mrna.join(", ") + '</b><br>';
            }
            if (prot.length > 0) {
                ret += 'PROT: <b>' + prot.join(", ") + '</b><br>';
            }
            ret += (data_type === 'sample' ? (link_id ? tooltipUtils.sampleViewAnchorTag(d.study_id, d.sample) : d.sample) : (link_id ? tooltipUtils.patientViewAnchorTag(d.study_id, d.patient) : d.patient));
            return ret;
        }
    },
    'makeClinicalTrackTooltip':function(attr, data_type, link_id) {
        return function(d) {
            var ret = '';
            if (attr.attr_id === "NO_CONTEXT_MUTATION_SIGNATURE") {
                for (var i=0; i<attr.categories.length; i++) {
                    ret += '<span style="color:' + attr.fills[i] + ';font-weight:bold;">'+attr.categories[i]+'</span>: '+d.attr_val_counts[attr.categories[i]]+'<br>';
                }
            } else {
                var attr_vals = ((d.attr_val_counts && Object.keys(d.attr_val_counts)) || []);
                if (attr_vals.length > 1) {
                    ret += 'values:<br>';
                    for (var i = 0; i < attr_vals.length; i++) {
                        var val = attr_vals[i];
                        ret += '<b>' + val + '</b>: ' + d.attr_val_counts[val] + '<br>';
                    }
                } else if (attr_vals.length === 1) {
                    ret += 'value: <b>' + attr_vals[0] + '</b><br>';
                }
            }
            ret += (link_id ? (data_type === 'sample' ? tooltipUtils.sampleViewAnchorTag(d.study_id, d.sample) : tooltipUtils.patientViewAnchorTag(d.study_id, d.patient))
                : (data_type === 'sample' ? d.sample : d.patient));
            return ret;
        };
    }
};

export default tooltipUtils;