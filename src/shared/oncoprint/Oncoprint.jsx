import React from 'react';
import utils from './utils';
import './oncoprint-bundle';
import State from './state';
import qs from './querySession';
import { actionCreators, mapStateToProps } from '../../pages/queryResult/duck';
import ClinicalData from './clinicalData';
import { createCBioPortalOncoprintWithToolbar } from 'shared/oncoprint/setup';
import { connect } from 'react-redux';

var QuerySession = qs();

class Oncoprint extends React.Component {

    componentDidMount() {

        let ctrSelector = '.oncoprint';
        $(ctrSelector).css({'position': 'relative'});

        var oncoprint = new window.Oncoprint(ctrSelector, 1050);
        window.oncoprint = oncoprint;

        var clinicalAttrs = utils.objectValues(State.clinical_tracks);

        $.when(QuerySession.getOncoprintPatientGenomicEventData(true),
            ClinicalData.getPatientData(clinicalAttrs),
            QuerySession.getPatientIds())
            .then(function(oncoprint_data_by_line, clinical_data){


                this.props.oncoprintDataLoaded(oncoprint_data_by_line);


            }.bind(this));
        
    }
    render() {

        console.log("rendering");
        if (this.props.status === 'complete'){
            createCBioPortalOncoprintWithToolbar(window.oncoprint, this.props.oncoprintData.toJS(), State);
        }

        return (
            <div className="oncoprint"></div>
        );
    }
}


export default connect(mapStateToProps, actionCreators)(Oncoprint)









