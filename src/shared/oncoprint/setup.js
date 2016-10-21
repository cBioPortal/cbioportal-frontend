import URL from './url';

import utils from './utils';

import State from './state';

import ClinicalData from './clinicalData';

import qs from './querySession';

var QuerySession = qs();

import mockData from './oncoprint_data_by_line.mock';

import * as _ from 'lodash';

//console.log(mockData[0]['oncoprint_data']);


export function createCBioPortalOncoprintWithToolbar(ctr_selector, toolbar_selector) {


    $(ctr_selector).css({'position': 'relative'});

    var oncoprint = new window.Oncoprint(ctr_selector, 1050);

    window.oncoprint = oncoprint;

    var clinical_attrs = utils.objectValues(State.clinical_tracks);

    $.when(QuerySession.getOncoprintPatientGenomicEventData(true),
        ClinicalData.getPatientData(clinical_attrs),
        QuerySession.getPatientIds())
        .then(function(oncoprint_data_by_line, clinical_data){
            doIt(oncoprint_data_by_line, clinical_data)
        });

    function doIt(oncoprint_data_by_line) {


        console.log(oncoprint_data_by_line);

        let genetic_alteration_tracks = [];

        oncoprint.suppressRendering();
        var track_ids = [];
        for (var i = 0; i < oncoprint_data_by_line.length; i++) {
            var track_params = {
                'rule_set_params': State.getGeneticRuleSetParams(),
                'label': oncoprint_data_by_line[i].gene,
                'target_group': 1,
                'sortCmpFn': State.getGeneticComparator(),
                'removable': true,
                'description': oncoprint_data_by_line[i].oql_line,
            };
            var new_track_id = oncoprint.addTracks([track_params])[0];
            track_ids.push(new_track_id);
            genetic_alteration_tracks[i] = new_track_id;
            if (State.first_genetic_alteration_track === null) {
                State.first_genetic_alteration_track = new_track_id;
            } else {
                oncoprint.shareRuleSet(State.first_genetic_alteration_track, new_track_id);
            }
        }

        oncoprint.hideIds([], true);
        oncoprint.keepSorted(false);

        var total_tracks_to_add = Object.keys(genetic_alteration_tracks).length;

        Object.keys(genetic_alteration_tracks).forEach(function (track_line, i) {
            var track_id = genetic_alteration_tracks[track_line];
            var track_data = oncoprint_data_by_line[track_line].oncoprint_data;

            oncoprint.setTrackData(track_id, track_data, 'uid');

        });


        oncoprint.keepSorted();

        oncoprint.releaseRendering();

    }

}
