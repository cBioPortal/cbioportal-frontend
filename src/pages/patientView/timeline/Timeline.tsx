import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import 'jquery-migrate';
require( 'datatables.net' );
import {buildTimeline} from './legacy.js';
import 'qtip2';
import 'qtip2/dist/jquery.qtip.css';

import './styles.scss';
import SampleManager from "../sampleManager";

import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import {ClinicalEvent, ClinicalEventData} from "../../../shared/api/generated/CBioPortalAPI";

interface ITimelineProps {
    sampleManager:SampleManager;
    store:PatientViewPageStore
}

export default class Timeline extends React.Component<ITimelineProps, {}> {

    shouldComponentUpdate() {
        return false;
    }

    componentDidMount() {

        let clinicalDataMap = this.props.store.patientViewData.result.samples!.reduce((memo:any,item)=>{
            memo[item.id] = item.clinicalData.reduce((innerMemo:any,innerItem)=>{
                innerMemo[innerItem.clinicalAttributeId] = innerItem.value;
                return innerMemo;
            },{})
            return memo;
        },{});

        let caseIds = this.props.sampleManager.getSampleIdsInOrder();

        let params = {
            cancer_study_id: this.props.store.studyId,
            patient_id: this.props.store.patientId
        };

        let patientInfo = this.props.store.patientViewData.result!.patient!.clinicalData.reduce((memo:any, item)=>{
            memo[item.clinicalAttributeId] = item.value;
            return memo;
        },{});

        let caseMetaData = {
            "color": this.props.sampleManager.sampleColors,
            "label": this.props.sampleManager.sampleLabels,
            "index": this.props.sampleManager.sampleIndex
        };

        let timelineData = this.props.store.clinicalEvents.result.map((eventData:ClinicalEvent) => {
           return {
               eventType: eventData.eventType,
               patientId: eventData.patientId,
               startDate: _.isUndefined(eventData.startNumberOfDaysSinceDiagnosis) ? null : eventData.startNumberOfDaysSinceDiagnosis,
               stopDate: _.isUndefined(eventData.endNumberOfDaysSinceDiagnosis) ? null : eventData.endNumberOfDaysSinceDiagnosis,
               eventData: eventData.attributes.reduce((memo:any, evData: ClinicalEventData) => {
                   memo[evData.key] = evData.value;
                   return memo;
               }, {})
           }
        });

        buildTimeline(params, caseIds, patientInfo, clinicalDataMap, caseMetaData, timelineData);

    }

    public render() {

        return (
            <div id="timeline-container">
                <div id="timeline"></div>
            </div>
        )
    }


}




// let caseMetaData = {
//     "color": {"P04_Pri": "black", "P04_Rec1": "orange", "P04_Rec2": "orange", "P04_Rec3": "orange"},
//     "label": {"P04_Pri": 1, "P04_Rec1": 2, "P04_Rec2": 3, "P04_Rec3": 4},
//     "index": {"P04_Pri": 0, "P04_Rec1": 1, "P04_Rec2": 2, "P04_Rec3": 3},
//     "tooltip": {
//         "P04_Pri": "<tr><td><b><u><a href='case.do?cancer_study_id=lgg_ucsf_2014&sample_id=P04_Pri'>P04_Pri</a></b></u><div class='more-sample-info'><span class=\"clinical-attribute\" attr-id=\"IDH1_MUTATION\" attr-value=\"R132C\" study=\"lgg_ucsf_2014\">R132C</span><span class=\"clinical-attribute\" attr-id=\"SAMPLE_TYPE\" attr-value=\"Primary\" study=\"lgg_ucsf_2014\">Primary</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE_DETAILED\" attr-value=\"Astrocytoma\" study=\"lgg_ucsf_2014\">Astrocytoma</span><span class=\"clinical-attribute\" attr-id=\"NON_SILENT_MUTATION\" attr-value=\"TP53\" study=\"lgg_ucsf_2014\">TP53</span><span class=\"clinical-attribute\" attr-id=\"GRADE\" attr-value=\"II\" study=\"lgg_ucsf_2014\">II</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE\" attr-value=\"Glioma\" study=\"lgg_ucsf_2014\">Glioma</span><span class=\"clinical-attribute\" attr-id=\"IDH_1P19Q_SUBTYPE\" attr-value=\"Intact\" study=\"lgg_ucsf_2014\">Intact</span><span class=\"clinical-attribute\" attr-id=\"DERIVED_NORMALIZED_CASE_TYPE\" attr-value=\"primary\" study=\"lgg_ucsf_2014\">primary</span></div>",
//         "P04_Rec1": "<tr><td><b><u><a href='case.do?cancer_study_id=lgg_ucsf_2014&sample_id=P04_Rec1'>P04_Rec1</a></b></u><div class='more-sample-info'><span class=\"clinical-attribute\" attr-id=\"IDH1_MUTATION\" attr-value=\"R132C\" study=\"lgg_ucsf_2014\">R132C</span><span class=\"clinical-attribute\" attr-id=\"SAMPLE_TYPE\" attr-value=\"Recurrence\" study=\"lgg_ucsf_2014\">Recurrence</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE_DETAILED\" attr-value=\"Anaplastic Astrocytoma\" study=\"lgg_ucsf_2014\">Anaplastic Astrocytoma</span><span class=\"clinical-attribute\" attr-id=\"NON_SILENT_MUTATION\" attr-value=\"TP53\" study=\"lgg_ucsf_2014\">TP53</span><span class=\"clinical-attribute\" attr-id=\"GRADE\" attr-value=\"III\" study=\"lgg_ucsf_2014\">III</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE\" attr-value=\"Glioma\" study=\"lgg_ucsf_2014\">Glioma</span><span class=\"clinical-attribute\" attr-id=\"IDH_1P19Q_SUBTYPE\" attr-value=\"Intact\" study=\"lgg_ucsf_2014\">Intact</span><span class=\"clinical-attribute\" attr-id=\"DERIVED_NORMALIZED_CASE_TYPE\" attr-value=\"recurrence\" study=\"lgg_ucsf_2014\">recurrence</span></div>",
//         "P04_Rec2": "<tr><td><b><u><a href='case.do?cancer_study_id=lgg_ucsf_2014&sample_id=P04_Rec2'>P04_Rec2</a></b></u><div class='more-sample-info'><span class=\"clinical-attribute\" attr-id=\"IDH1_MUTATION\" attr-value=\"R132C\" study=\"lgg_ucsf_2014\">R132C</span><span class=\"clinical-attribute\" attr-id=\"SAMPLE_TYPE\" attr-value=\"Recurrence\" study=\"lgg_ucsf_2014\">Recurrence</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE_DETAILED\" attr-value=\"Anaplastic Astrocytoma\" study=\"lgg_ucsf_2014\">Anaplastic Astrocytoma</span><span class=\"clinical-attribute\" attr-id=\"NON_SILENT_MUTATION\" attr-value=\"TP53\" study=\"lgg_ucsf_2014\">TP53</span><span class=\"clinical-attribute\" attr-id=\"GRADE\" attr-value=\"III\" study=\"lgg_ucsf_2014\">III</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE\" attr-value=\"Glioma\" study=\"lgg_ucsf_2014\">Glioma</span><span class=\"clinical-attribute\" attr-id=\"IDH_1P19Q_SUBTYPE\" attr-value=\"Intact\" study=\"lgg_ucsf_2014\">Intact</span><span class=\"clinical-attribute\" attr-id=\"DERIVED_NORMALIZED_CASE_TYPE\" attr-value=\"recurrence\" study=\"lgg_ucsf_2014\">recurrence</span></div>",
//         "P04_Rec3": "<tr><td><b><u><a href='case.do?cancer_study_id=lgg_ucsf_2014&sample_id=P04_Rec3'>P04_Rec3</a></b></u><div class='more-sample-info'><span class=\"clinical-attribute\" attr-id=\"IDH1_MUTATION\" attr-value=\"R132C\" study=\"lgg_ucsf_2014\">R132C</span><span class=\"clinical-attribute\" attr-id=\"SAMPLE_TYPE\" attr-value=\"Recurrence\" study=\"lgg_ucsf_2014\">Recurrence</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE_DETAILED\" attr-value=\"Anaplastic Astrocytoma\" study=\"lgg_ucsf_2014\">Anaplastic Astrocytoma</span><span class=\"clinical-attribute\" attr-id=\"NON_SILENT_MUTATION\" attr-value=\"TP53\" study=\"lgg_ucsf_2014\">TP53</span><span class=\"clinical-attribute\" attr-id=\"GRADE\" attr-value=\"III\" study=\"lgg_ucsf_2014\">III</span><span class=\"clinical-attribute\" attr-id=\"CANCER_TYPE\" attr-value=\"Glioma\" study=\"lgg_ucsf_2014\">Glioma</span><span class=\"clinical-attribute\" attr-id=\"IDH_1P19Q_SUBTYPE\" attr-value=\"Intact\" study=\"lgg_ucsf_2014\">Intact</span><span class=\"clinical-attribute\" attr-id=\"DERIVED_NORMALIZED_CASE_TYPE\" attr-value=\"recurrence\" study=\"lgg_ucsf_2014\">recurrence</span></div>"
//     }
// };