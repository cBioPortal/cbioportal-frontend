import URL from './url';

import utils from './utils';

import State from './state';

import ClinicalData from './clinicalData';

import qs from './querySession';

var QuerySession = qs();

export function createCBioPortalOncoprintWithToolbar(ctr_selector, toolbar_selector) {

    $(ctr_selector).css({'position': 'relative'});

    var oncoprint = new window.Oncoprint(ctr_selector, 1050);

    (function initOncoprint() {

        var def = new $.Deferred();
        oncoprint.setCellPaddingOn(State.cell_padding_on);
        $.when(QuerySession.getOncoprintSampleGenomicEventData()).then(function (oncoprint_data) {
            State.addGeneticTracks(oncoprint_data);
        }).fail(function () {
            def.reject();
        }).then(function () {
            (function fetchClinicalAttributes() {
                QuerySession.getClinicalAttributes().then(function (attrs) {
                    State.unused_clinical_attributes = attrs;
                    State.clinical_attributes_fetched.resolve();
                    def.resolve();
                }).fail(function () {
                    def.reject();
                    State.clinical_attributes_fetched.reject();
                });
            })();
        })
        return def.promise();
    })().then(function () {
        var populate_data_promise = State.setDataType(State.using_sample_data ? 'sample' : 'patient');

        $.when(QuerySession.getPatientIds(), QuerySession.getAlteredSamples(), QuerySession.getAlteredPatients(), QuerySession.getCaseUIDMap(), populate_data_promise).then(function (patient_ids, altered_samples, altered_patients, case_uid_map) {
            if ((State.using_sample_data ? window.QuerySession.getSampleIds() : patient_ids).length > 200) {
                // TODO: assume multiple studies
                var study_id = QuerySession.getCancerStudyIds()[0];
                var getUID = function (id) {
                    return case_uid_map[study_id][id];
                };
                oncoprint.setHorzZoomToFit(State.using_sample_data ? altered_samples.map(getUID) : altered_patients.map(getUID));
            }
            oncoprint.scrollTo(0);
        });

        return populate_data_promise;
    });

    window.oncoprint = oncoprint;


    var oncoprintDatumIsAltered = function(datum) {
        return ['disp_mut', 'disp_cna', 'disp_mrna', 'disp_prot', 'disp_fusion']
            .map(function(x) { return (typeof datum[x] !== "undefined"); })
            .reduce(function(x,y) { return x || y; }, false);
    };


    var clinical_attrs = utils.objectValues(State.clinical_tracks);

    $.when(QuerySession.getOncoprintPatientGenomicEventData(true),
        ClinicalData.getPatientData(clinical_attrs),
        QuerySession.getPatientIds())
        .then(doIt);

    function doIt(oncoprint_data_by_line,
                  clinical_data,
                  patient_ids) {


            oncoprint.suppressRendering();
            oncoprint.hideIds([], true);
            oncoprint.keepSorted(false);

            var total_tracks_to_add = Object.keys(State.genetic_alteration_tracks).length
                + Object.keys(State.clinical_tracks).length;

            utils.timeoutSeparatedLoop(Object.keys(State.genetic_alteration_tracks), function (track_line, i) {
                var track_id = State.genetic_alteration_tracks[track_line];
                var track_data = oncoprint_data_by_line[track_line].oncoprint_data;

                oncoprint.setTrackData(track_id, track_data, 'uid');
                oncoprint.setTrackInfo(track_id, utils.proportionToPercentString(track_data.filter(oncoprintDatumIsAltered).length/patient_ids.length));


            }).then(function() {
                return utils.timeoutSeparatedLoop(Object.keys(State.clinical_tracks), function(track_id, i) {
                    var attr = State.clinical_tracks[track_id];
                    oncoprint.setTrackData(track_id, clinical_data[attr.attr_id], 'uid');

                    oncoprint.setTrackInfo(track_id, "");

                });
            }).then(function () {
                oncoprint.keepSorted();
                if (State.unaltered_cases_hidden) {
                    oncoprint.hideIds(State.getUnalteredIds(), true);
                }
                oncoprint.releaseRendering();

                oncoprint.updateHorzZoomToFitIds(State.getAlteredIds());
            });
        }



    //});

}
