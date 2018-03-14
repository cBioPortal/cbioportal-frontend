import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {observer} from "mobx-react";
import {remoteData} from "../../shared/api/remoteData";
import {action, computed, observable, reaction, ObservableMap} from "mobx";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import { ClinicalDataCountFilter, StudyViewFilter, ClinicalDataCount, ClinicalDataEqualityFilter } from 'shared/api/generated/CBioPortalAPIInternal';
import { PieChart } from './charts/pieChart/PieChart'
import { ClinicalAttribute } from 'shared/api/generated/CBioPortalAPI';
import styles from "./styles.module.scss";

export type ClinicalDataType= "SAMPLE" | "PATIENT";
export type ClinicalAttributeData = {[attrId:string]:ClinicalDataCount[]};
export type ClinicalAttributeDataWithMeta = {attributeId:string,clinicalDataType:ClinicalDataType,counts:ClinicalDataCount[]};
export class StudyViewPageStore {

    constructor(){

    }

    @observable studyId = "hnsc_tcga";

    @observable sampleAttrIds = ["OCT_EMBEDDED"];

    @observable patientAttrIds = ["AJCC_PATHOLOGIC_TUMOR_STAGE","ICD_O_3_HISTOLOGY"];

    @observable private _clinicalDataEqualityFilter = observable.map<ClinicalDataEqualityFilter>();

    @action updateClinicalDataEqualityFilters( attributeId      : string,
                                               clinicalDataType : ClinicalDataType,
                                               value            : string) {
        
        let id = [clinicalDataType,attributeId].join('_');

        let clinicalDataEqualityFilter =this._clinicalDataEqualityFilter.get(id);

        if(clinicalDataEqualityFilter) {
            let values = clinicalDataEqualityFilter.values;
            if(_.includes(values,value)){
                values = values.filter(item => item !== value);
            } else {
                values.push(value);
            }
            if(values.length>0) {
                clinicalDataEqualityFilter.values = values;
                this._clinicalDataEqualityFilter.set(id, clinicalDataEqualityFilter);
            } else {
                clinicalDataEqualityFilter = {} as any;
                this._clinicalDataEqualityFilter.delete(id)
            }
        } else {
            clinicalDataEqualityFilter = {
                    "attributeId": attributeId,
                    "clinicalDataType": clinicalDataType,
                    "values": [value]
            };
            this._clinicalDataEqualityFilter.set(id, clinicalDataEqualityFilter);
        }
    }

    @computed get filters() {
        let filters: StudyViewFilter = {} as any;
        let clinicalDataEqualityFilter= this._clinicalDataEqualityFilter.values()
        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if(clinicalDataEqualityFilter.length>0){
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilter
        }
        return filters;
    }

    public getClinicalDataEqualityFilters(id : string): string[] {
        let clinicalDataEqualityFilter = this._clinicalDataEqualityFilter.get(id)
        return clinicalDataEqualityFilter ? clinicalDataEqualityFilter.values : [];
    }


    readonly clinicalAttributes = remoteData({
        invoke: () => {
            return defaultClient.getAllClinicalAttributesInStudyUsingGET({
                'studyId': this.studyId
            }).then((attributes:ClinicalAttribute[])=>{
                let attributeIds = [...this.sampleAttrIds, ...this.patientAttrIds];
                return attributes.filter(attribute => {
                    return _.includes(attributeIds, attribute.clinicalAttributeId);
                });
            });
        }
    });

    readonly sampleAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.clinicalAttributes],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                'studyId': this.studyId,
                'clinicalDataType': "SAMPLE",
                'clinicalDataCountFilter': {
                    'attributeIds': this.sampleAttrIds,
                    'filter': this.filters
                }
            })
        },
        default: {}
    });

    readonly patientAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.clinicalAttributes],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                'studyId': this.studyId,
                'clinicalDataType': "PATIENT",
                'clinicalDataCountFilter': {
                    'attributeIds': this.patientAttrIds,
                    'filter': this.filters
                }
            })
        },
        default: {}
    });

    readonly cinicalAttributeData = remoteData<{ [attrId: string]: ClinicalAttributeDataWithMeta }>({
        await: () => [this.sampleAttributesData, this.patientAttributesData],
        invoke: async () => {

            let result: { [attrId: string]: ClinicalAttributeDataWithMeta } = _.reduce(this.sampleAttributesData.result, function (result, value, key) {
                result["SAMPLE_" + key] = { attributeId: key, clinicalDataType: "SAMPLE", counts: value }
                return result;
            }, {} as any)

            result = _.reduce(this.patientAttributesData.result, function (result, value, key) {
                result["PATIENT_" + key] = { attributeId: key, clinicalDataType: "PATIENT", counts: value }
                return result;
            }, result);
            return result;
        },
        default: {}
    });

}


// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method. 
// Even if this value is referenced deep within some helper method
@observer
export default class StudyViewPage extends React.Component<{}, {}> {

    store:StudyViewPageStore;
    queryInput:HTMLInputElement;

    constructor(){
        super();
        this.store = new StudyViewPageStore();
        this.onUserSelection = this.onUserSelection.bind(this);

    }

    private onUserSelection(attrId           : string,
                            clinicalDataType : ClinicalDataType,
                            value            : string) {

        this.store.updateClinicalDataEqualityFilters(attrId, clinicalDataType, value)
    }
    
    renderAttributeChart = (clinicalAttribute : ClinicalAttribute,
                            arrayIndex        : number) => {
                                
        let attributeUID = (clinicalAttribute.patientAttribute ? "PATIENT_" : "SAMPLE_")+clinicalAttribute.clinicalAttributeId
        let filters = this.store.getClinicalDataEqualityFilters(attributeUID)
        return (
            <div className={styles.chart} key={arrayIndex}>
                <div className={styles.header}>
                    <span>{clinicalAttribute.displayName}</span>
                </div>
                <div className="plot">
                    <PieChart onUserSelection= {this.onUserSelection}
                              filters={filters}
                              data={this.store.cinicalAttributeData.result[attributeUID]}/> 
                </div>
            </div>
        );
    }

    render(){
        return (
            <div>
                {
                    (this.store.clinicalAttributes.isComplete && this.store.cinicalAttributeData.isComplete) && 
                    (
                        <div  className={styles.flexContainer}>
                            {this.store.clinicalAttributes.result.map(this.renderAttributeChart)}
                        </div>
                    )
                }
            </div>
        )
    }
}
