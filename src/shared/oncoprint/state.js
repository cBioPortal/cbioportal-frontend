import URL from './url';

import qs from './querySession';

import comparator_utils from './comparitorUtils';

import utils from './utils';

import ClinicalData from './clinicalData';

import tooltip_utils from './tooltipUtils';

var QuerySession = qs();

const exp = (function () {
    var oncoprintDatumIsAltered = function(datum) {
        return ['disp_mut', 'disp_cna', 'disp_mrna', 'disp_prot', 'disp_fusion']
            .map(function(x) { return (typeof datum[x] !== "undefined"); })
            .reduce(function(x,y) { return x || y; }, false);
    };
    var populateSampleData = function() {
        var done = new $.Deferred();
        var clinical_attrs = utils.objectValues(State.clinical_tracks);
        window.LoadingBar.show();
        window.LoadingBar.msg(window.LoadingBar.DOWNLOADING_MSG);
        $.when(QuerySession.getOncoprintSampleGenomicEventData(true),
            ClinicalData.getSampleData(clinical_attrs))
            .then(function (oncoprint_data_by_line,
                            clinical_data) {

                window.LoadingBar.msg("Loading oncoprint");
                oncoprint.suppressRendering();
                oncoprint.hideIds([], true);
                oncoprint.keepSorted(false);

                var total_tracks_to_add = Object.keys(State.genetic_alteration_tracks).length
                    + Object.keys(State.clinical_tracks).length;

                utils.timeoutSeparatedLoop(Object.keys(State.genetic_alteration_tracks), function (track_line, i) {
                    var track_id = State.genetic_alteration_tracks[track_line];
                    var track_data = oncoprint_data_by_line[track_line].oncoprint_data;
                    track_data = State.colorby_knowledge ? annotateOncoprintDataWithRecurrence(State, track_data) : track_data;
                    oncoprint.setTrackData(track_id, track_data, 'uid');
                    oncoprint.setTrackInfo(track_id, utils.proportionToPercentString(track_data.filter(oncoprintDatumIsAltered).length/QuerySession.getSampleIds().length));
                    oncoprint.setTrackTooltipFn(track_id, tooltip_utils.makeGeneticTrackTooltip('sample', true));
                    window.LoadingBar.update(i / total_tracks_to_add);
                }).then(function() {
                    return utils.timeoutSeparatedLoop(Object.keys(State.clinical_tracks), function(track_id, i) {
                        var attr = State.clinical_tracks[track_id];
                        oncoprint.setTrackData(track_id, clinical_data[attr.attr_id], 'uid');
                        oncoprint.setTrackTooltipFn(track_id, tooltip_utils.makeClinicalTrackTooltip(attr, 'sample', true));
                        oncoprint.setTrackInfo(track_id, "");
                        window.LoadingBar.update((i + Object.keys(State.genetic_alteration_tracks).length) / total_tracks_to_add);
                    });
                }).then(function () {
                    oncoprint.keepSorted();
                    if (State.unaltered_cases_hidden) {
                        oncoprint.hideIds(State.getUnalteredIds(), true);
                    }
                    oncoprint.releaseRendering();
                    window.LoadingBar.msg("");
                    window.LoadingBar.hide();
                    updateAlteredPercentIndicator(State);
                    oncoprint.updateHorzZoomToFitIds(State.getAlteredIds());
                    done.resolve();
                });
            }).fail(function() {
            done.reject();
        });
        return done.promise();
    };

    var populatePatientData = function() {
        var done = new $.Deferred();
        var clinical_attrs = utils.objectValues(State.clinical_tracks);
        window.LoadingBar.show();
        window.LoadingBar.msg(window.LoadingBar.DOWNLOADING_MSG);
        $.when(QuerySession.getOncoprintPatientGenomicEventData(true),
            ClinicalData.getPatientData(clinical_attrs),
            QuerySession.getPatientIds())
            .then(function (oncoprint_data_by_line,
                            clinical_data,
                            patient_ids) {
                window.LoadingBar.msg("Loading oncoprint");
                oncoprint.suppressRendering();
                oncoprint.hideIds([], true);
                oncoprint.keepSorted(false);

                var total_tracks_to_add = Object.keys(State.genetic_alteration_tracks).length
                    + Object.keys(State.clinical_tracks).length;

                utils.timeoutSeparatedLoop(Object.keys(State.genetic_alteration_tracks), function (track_line, i) {
                    var track_id = State.genetic_alteration_tracks[track_line];
                    var track_data = oncoprint_data_by_line[track_line].oncoprint_data;
                    track_data = State.colorby_knowledge ? annotateOncoprintDataWithRecurrence(State, track_data) : track_data;
                    oncoprint.setTrackData(track_id, track_data, 'uid');
                    oncoprint.setTrackInfo(track_id, utils.proportionToPercentString(track_data.filter(oncoprintDatumIsAltered).length/patient_ids.length));
                    oncoprint.setTrackTooltipFn(track_id, tooltip_utils.makeGeneticTrackTooltip('patient', true));
                    window.LoadingBar.update(i / total_tracks_to_add);
                }).then(function() {
                    return utils.timeoutSeparatedLoop(Object.keys(State.clinical_tracks), function(track_id, i) {
                        var attr = State.clinical_tracks[track_id];
                        oncoprint.setTrackData(track_id, clinical_data[attr.attr_id], 'uid');
                        oncoprint.setTrackTooltipFn(track_id, tooltip_utils.makeClinicalTrackTooltip(attr, 'patient', true));
                        oncoprint.setTrackInfo(track_id, "");
                        window.LoadingBar.update((i + Object.keys(State.genetic_alteration_tracks).length) / total_tracks_to_add);
                    });
                }).then(function () {
                    oncoprint.keepSorted();
                    if (State.unaltered_cases_hidden) {
                        oncoprint.hideIds(State.getUnalteredIds(), true);
                    }
                    oncoprint.releaseRendering();
                    window.LoadingBar.msg("");
                    window.LoadingBar.hide();
                    updateAlteredPercentIndicator(State);
                    oncoprint.updateHorzZoomToFitIds(State.getAlteredIds());
                    done.resolve();
                });
            }).fail(function() {
            done.reject();
        });
        return done.promise();
    };

    var populateClinicalTrack = function(track_id) {
        var done = new $.Deferred();
        var attr = State.clinical_tracks[track_id];
        ClinicalData[State.using_sample_data ? 'getSampleData' : 'getPatientData'](attr).then(function(data) {
            data = data[attr.attr_id];
            oncoprint.setTrackData(track_id, data, "uid");
            oncoprint.setTrackTooltipFn(track_id, tooltip_utils.makeClinicalTrackTooltip(attr, (State.using_sample_data ? 'sample' : 'patient'), true));
            oncoprint.setTrackInfo(track_id, "");
            done.resolve();
        }).fail(function() {
            done.reject();
        });
        return done.promise();
    };

    var makeRemoveAttributeHandler = function(attr) {
        return function (track_id) {
            delete State.clinical_tracks[track_id];
            State.unuseAttribute(attr.attr_id);
            Toolbar.refreshClinicalAttributeSelector();
            if (Object.keys(State.clinical_tracks).length === 0) {
                $(toolbar_selector + ' #oncoprint-diagram-showlegend-icon').hide();
            }
        }
    };
    var setSortOrder = function(order) {
        oncoprint.setSortConfig({'type':'order', 'order':order});
    };

    var updateAlteredPercentIndicator = function(state) {
        $.when(QuerySession.getPatientIds())
            .then(function(patient_ids) {
                var altered_ids = state.getAlteredIds();
                var text = "Altered in ";
                text += altered_ids.length;
                text += " (";
                text += utils.proportionToPercentString(altered_ids.length / (state.using_sample_data ? QuerySession.getSampleIds().length : patient_ids.length));
                text +=") of ";
                text += (state.using_sample_data ? QuerySession.getSampleIds().length : patient_ids.length);
                text += " ";
                text += (state.using_sample_data ? "samples" : "cases/patients");
                $('#altered_value').text(text);
            });
    };

    var annotateOncoprintDataWithRecurrence = function(state, list_of_oncoprint_data) {
        var known_mutation_settings = QuerySession.getKnownMutationSettings();
        var isRecurrent = function(d) {
            return (known_mutation_settings.recognize_hotspot && d.cancer_hotspots_hotspot)
                || (known_mutation_settings.recognize_oncokb_oncogenic && (typeof d.oncokb_oncogenic !== "undefined") && (["likely oncogenic", "oncogenic"].indexOf(d.oncokb_oncogenic.toLowerCase()) > -1))
                || (known_mutation_settings.recognize_cbioportal_count && (typeof d.cbioportal_mutation_count !== "undefined") && d.cbioportal_mutation_count >= known_mutation_settings.cbioportal_count_thresh)
                || (known_mutation_settings.recognize_cosmic_count && (typeof d.cosmic_count !== "undefined") && d.cosmic_count >= known_mutation_settings.cosmic_count_thresh);
        };
        for (var i=0; i<list_of_oncoprint_data.length; i++) {
            var oncoprint_datum = list_of_oncoprint_data[i];
            if (typeof oncoprint_datum.disp_mut === "undefined") {
                continue;
            }
            var disp_mut = oncoprint_datum.disp_mut.toLowerCase();
            var webservice_data = oncoprint_datum.data;
            var has_known_disp_mut = false;
            for (var j=0; j<webservice_data.length; j++) {
                var datum = webservice_data[j];
                if (datum.genetic_alteration_type !== "MUTATION_EXTENDED") {
                    continue;
                }
                var mutation_type = datum.oncoprint_mutation_type.toLowerCase();
                if (mutation_type === disp_mut) {
                    if (isRecurrent(datum)) {
                        has_known_disp_mut = true;
                        break;
                    }
                }
            }
            if (has_known_disp_mut) {
                oncoprint_datum.disp_mut += "_rec";
            }
        }
        return list_of_oncoprint_data;
    };

    var State = {
        'first_genetic_alteration_track': null,
        'genetic_alteration_tracks': {}, // track_id -> gene
        'clinical_tracks': {}, // track_id -> attr

        'used_clinical_attributes': [],
        'unused_clinical_attributes': [],
        'clinical_attributes_fetched': new $.Deferred(),
        'clinical_attr_id_to_sample_data': {},
        'clinical_attr_id_to_patient_data': {},

        'cell_padding_on': true,
        'using_sample_data': (URL.getInitDataType() === 'sample'),
        'unaltered_cases_hidden': false,
        'clinical_track_legends_shown': false,
        'mutations_colored_by_type': true,
        'sorted_by_mutation_type': true,

        'patient_order_loaded': new $.Deferred(),
        'patient_order': [],

        'sortby': 'data',
        'sortby_type': true,
        'sortby_recurrence': true,

        'colorby_type': true,
        'colorby_knowledge': true,


        'sorting_by_given_order': false,
        'sorting_alphabetically': false,

        'useAttribute': function (attr_id) {
            var index = this.unused_clinical_attributes.findIndex(function (attr) {
                return attr.attr_id === attr_id;
            });
            var ret = null;
            if (index > -1) {
                var attr = this.unused_clinical_attributes[index];
                this.unused_clinical_attributes.splice(index, 1);
                this.used_clinical_attributes.push(attr);
                ret = attr;
            }
            URL.update(exp);
            return ret;
        },
        'unuseAttribute': function (attr_id) {
            var index = this.used_clinical_attributes.findIndex(function (attr) {
                return attr.attr_id === attr_id;
            });
            if (index > -1) {
                var attr = this.used_clinical_attributes[index];
                this.used_clinical_attributes.splice(index, 1);
                this.unused_clinical_attributes.push(attr);
            }
            URL.update(exp);
        },
        'refreshData': function() {
            if (this.using_sample_data) {
                return populateSampleData();
            } else {
                return populatePatientData();
            }
        },
        'setDataType': function (sample_or_patient) {
            var def = new $.Deferred();
            var self = this;
            QuerySession.getCaseUIDMap().then(function (case_uid_map) {
                // TODO: assume multiple studies
                var study_id = QuerySession.getCancerStudyIds()[0];
                var getUID = function (id) {
                    return case_uid_map[study_id][id];
                };
                var proxy_promise;
                if (sample_or_patient === 'sample') {
                    self.using_sample_data = true;
                    URL.update(exp);
                    updateAlteredPercentIndicator(self);
                    proxy_promise = populateSampleData();
                } else if (sample_or_patient === 'patient') {
                    self.using_sample_data = false;
                    URL.update(exp);
                    updateAlteredPercentIndicator(self);
                    proxy_promise = populatePatientData();
                }
                self.patient_order_loaded.then(function () {
                    var id_order = (self.using_sample_data ? QuerySession.getSampleIds() : self.patient_order).slice();
                    if (self.sorting_alphabetically) {
                        id_order = id_order.sort();
                    }
                    if (self.sorting_alphabetically || self.sorting_by_given_order) {
                        setSortOrder(id_order.map(getUID));
                    }
                    proxy_promise.then(function () {
                        def.resolve();
                    }).fail(function () {
                        def.fail();
                    });
                });
            });
            return def.promise();
        },
        'addGeneticTracks': function (oncoprint_data_by_line) {
            oncoprint.suppressRendering();
            var track_ids = [];
            for (var i = 0; i < oncoprint_data_by_line.length; i++) {
                var track_params = {
                    'rule_set_params': this.getGeneticRuleSetParams(),
                    'label': oncoprint_data_by_line[i].gene,
                    'target_group': 1,
                    'sortCmpFn': this.getGeneticComparator(),
                    'removable': true,
                    'description': oncoprint_data_by_line[i].oql_line,
                };
                var new_track_id = oncoprint.addTracks([track_params])[0];
                track_ids.push(new_track_id);
                State.genetic_alteration_tracks[i] = new_track_id;
                if (State.first_genetic_alteration_track === null) {
                    State.first_genetic_alteration_track = new_track_id;
                } else {
                    oncoprint.shareRuleSet(State.first_genetic_alteration_track, new_track_id);
                }
            }
            oncoprint.releaseRendering();
            return track_ids;
        },
        'useAndAddAttribute': function(attr_id) {
            var attr = this.useAttribute(attr_id);
            this.addClinicalTracks(attr);
        },
        'addClinicalTracks': function (attrs) {
            attrs = [].concat(attrs);
            oncoprint.suppressRendering();
            var track_ids = [];
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                var track_params;
                if (attr.attr_id === '# mutations') {
                    track_params = {
                        'rule_set_params': {
                            'type': 'bar',
                            'log_scale': true,
                            'value_key': 'attr_val',
                        }
                    };
                } else if (attr.attr_id === 'FRACTION_GENOME_ALTERED') {
                    track_params = {
                        'rule_set_params': {
                            'type': 'bar',
                            'value_key': 'attr_val',
                            'value_range': [0,1]
                        }
                    };
                } else if (attr.attr_id === 'NO_CONTEXT_MUTATION_SIGNATURE') {
                    track_params = {
                        'rule_set_params': {
                            'type': 'stacked_bar',
                            'value_key': 'attr_val_counts',
                            'categories': attr.categories,
                            'fills': attr.fills
                        }
                    };
                } else {
                    track_params = {};
                    if (attr.datatype.toLowerCase() === 'number') {
                        track_params['rule_set_params'] = {
                            'type': 'bar',
                            'value_key': 'attr_val'
                        };
                    } else {
                        track_params['rule_set_params'] = {
                            'type': 'categorical',
                            'category_key': 'attr_val'
                        };
                    }
                }

                track_params['rule_set_params']['legend_label'] = attr.display_name;
                track_params['rule_set_params']['exclude_from_legend'] = !State.clinical_track_legends_shown;
                track_params['label'] = attr.display_name;
                track_params['description'] = attr.description;
                track_params['removable'] = true;
                track_params['removeCallback'] = makeRemoveAttributeHandler(attr);
                track_params['sort_direction_changeable'] = true;
                track_params['track_info'] = "\u23f3";

                if (attr.datatype.toLowerCase() === "number") {
                    track_params['sortCmpFn'] = comparator_utils.numericalClinicalComparator;
                } else if (attr.datatype.toLowerCase() === "string") {
                    track_params['sortCmpFn'] = comparator_utils.stringClinicalComparator;
                } else if (attr.datatype.toLowerCase() === "counts_map") {
                    track_params['sortCmpFn'] = comparator_utils.makeCountsMapClinicalComparator(attr.categories);
                }

                track_params['init_sort_direction'] = 0;
                track_params['target_group'] = 0;

                var new_track_id = oncoprint.addTracks([track_params])[0];
                track_ids.push(new_track_id);
                State.clinical_tracks[new_track_id] = attr;
            }
            oncoprint.releaseRendering();
            return track_ids;
        },
        'addAndPopulateClinicalTracks': function(attrs) {
            var def = new $.Deferred();
            var track_ids = this.addClinicalTracks(attrs);
            var promises = track_ids.map(populateClinicalTrack);
            ($.when.apply(null, promises)).then(function() {
                def.resolve();
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        },
        'getGeneticComparator': function() {
            return comparator_utils.makeGeneticComparator(this.colorby_type && this.sortby_type, this.colorby_knowledge && this.sortby_recurrence);
        },
        'getGeneticRuleSetParams': function() {
            if (this.colorby_type) {
                if (this.colorby_knowledge) {
                    return window.geneticrules.genetic_rule_set_different_colors_recurrence;
                } else {
                    return window.geneticrules.genetic_rule_set_different_colors_no_recurrence;
                }
            } else {
                if (this.colorby_knowledge) {
                    return window.geneticrules.genetic_rule_set_same_color_for_all_recurrence;
                } else {
                    return window.geneticrules.genetic_rule_set_same_color_for_all_no_recurrence;
                }
            }
        },
        'getAlteredIds': function() {
            var track_ids = utils.objectValues(State.genetic_alteration_tracks);
            var altered = {};
            for (var i=0; i<track_ids.length; i++){
                var data = oncoprint.getTrackData(track_ids[i]);
                var data_id_key = oncoprint.getTrackDataIdKey(track_ids[i]);
                var altered_ids = data.filter(oncoprintDatumIsAltered).map(function(x) { return x[data_id_key]; });
                for (var j=0; j<altered_ids.length; j++) {
                    altered[altered_ids[j]] = true;
                }
            }
            return Object.keys(altered);
        },
        'getUnalteredIds': function() {
            var track_ids = utils.objectValues(State.genetic_alteration_tracks);
            var unaltered = {};
            for (var i=0; i<track_ids.length; i++){
                var data = oncoprint.getTrackData(track_ids[i]);
                var data_id_key = oncoprint.getTrackDataIdKey(track_ids[i]);
                if (i === 0) {
                    var unaltered_ids = data.filter(function (d) {
                        return !oncoprintDatumIsAltered(d);
                    }).map(function (x) {
                        return x[data_id_key];
                    });
                    for (var j = 0; j < unaltered_ids.length; j++) {
                        unaltered[unaltered_ids[j]] = true;
                    }
                } else {
                    var altered_ids = data.filter(oncoprintDatumIsAltered)
                        .map(function(x) { return x[data_id_key]; });
                    for (var j=0; j<altered_ids.length; j++) {
                        unaltered[altered_ids[j]] = false;
                    }
                }
            }
            return Object.keys(unaltered).filter(function(x) { return !!unaltered[x]; });
        },
    };

    (function loadPatientOrder(state) {
        if (state.patient_order_loaded.state() === "resolved") {
            return;
        } else {
            QuerySession.getPatientSampleIdMap().then(function(sample_to_patient) {
                var patients = QuerySession.getSampleIds().map(function(s) { return sample_to_patient[s];});
                var patient_added_to_order = {};
                var patient_order = [];
                for (var i=0; i<patients.length; i++) {
                    if (!patient_added_to_order[patients[i]]) {
                        patient_added_to_order[patients[i]] = true;
                        patient_order.push(patients[i]);
                    }
                }
                state.patient_order = patient_order;
                state.patient_order_loaded.resolve();
            });
        }
    })(State);
    return State;
})();


export default exp;
