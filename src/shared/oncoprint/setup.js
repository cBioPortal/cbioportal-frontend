import URL from './url';

import utils from './utils';

import State from './state';

import ClinicalData from './clinicalData';

import qs from './querySession';

var QuerySession = qs();

export function createCBioPortalOncoprintWithToolbar(ctr_selector, toolbar_selector) {

    $(ctr_selector).css({'position': 'relative'});

    var oncoprint = new window.Oncoprint(ctr_selector, 1050);

    window.oncoprint = oncoprint;

    var clinical_attrs = utils.objectValues(State.clinical_tracks);

    $.when(QuerySession.getOncoprintPatientGenomicEventData(true),
        ClinicalData.getPatientData(clinical_attrs),
        QuerySession.getPatientIds())
        .then(function(oncoprint_data_by_line, clinical_data){
            State.addGeneticTracks(oncoprint_data_by_line);

            doIt(oncoprint_data_by_line, clinical_data, State.genetic_alteration_tracks, State.clinical_tracks)
        });

    function doIt(oncoprint_data_by_line, clinical_data, genetic_alteration_tracks, clinical_tracks) {

        oncoprint.suppressRendering();
        oncoprint.hideIds([], true);
        oncoprint.keepSorted(false);

        var total_tracks_to_add = Object.keys(genetic_alteration_tracks).length
            + Object.keys(clinical_tracks).length;

        Object.keys(genetic_alteration_tracks).forEach(function (track_line, i) {
            var track_id = genetic_alteration_tracks[track_line];
            var track_data = oncoprint_data_by_line[track_line].oncoprint_data;

            oncoprint.setTrackData(track_id, track_data, 'uid');

        });

        Object.keys(clinical_tracks).forEach(function (track_id, i) {
            var attr = clinical_tracks[track_id];
            oncoprint.setTrackData(track_id, clinical_data[attr.attr_id], 'uid');

            oncoprint.setTrackInfo(track_id, "");

        });

        oncoprint.keepSorted();

        oncoprint.releaseRendering();

    }

}
