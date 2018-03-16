import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {observer, inject} from "mobx-react";
import {remoteData} from "../../shared/api/remoteData";
import {action, computed, observable, reaction, ObservableMap} from "mobx";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {
    ClinicalDataCountFilter, StudyViewFilter, ClinicalDataCount, ClinicalDataEqualityFilter,
    MutationCountByGene, MolecularProfileGeneFilter, CopyNumberCountByGene
} from 'shared/api/generated/CBioPortalAPIInternal';
import { PieChart } from './charts/pieChart/PieChart'
import { ClinicalAttribute } from 'shared/api/generated/CBioPortalAPI';
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";

export type ClinicalDataType= "SAMPLE" | "PATIENT";
export type ClinicalAttributeData = {[attrId:string]:ClinicalDataCount[]};
export type ClinicalAttributeDataWithMeta = {attributeId:string,clinicalDataType:ClinicalDataType,counts:ClinicalDataCount[]};
export type MutatedGenesData = MutationCountByGene[];
export type CNAGenesData = CopyNumberCountByGene[];
export class StudyViewPageStore {

    constructor(){
        this._molecularProfileGeneFilter = {
            entrezGeneIds: [],
            molecularProfileId: ''
        };
        reaction(
            () => this.molecularProfileId,
            (newProfile) => {
                this._molecularProfileGeneFilter.molecularProfileId = newProfile;
            },
            {fireImmediately: true}
        )
    }

    //TODO: make studyId, sampleAttrIds, patientAttrIds dynamic
    // @observable studyId = "hnsc_tcga";

    // @observable molecularProfileId = "hnsc_tcga_mutations";

    // @observable sampleAttrIds = ["OCT_EMBEDDED","PRIMARY_SITE","AMPLIFICATION_STATUS"];

    // @observable patientAttrIds = ["AJCC_PATHOLOGIC_TUMOR_STAGE","ICD_O_3_HISTOLOGY","SEX"];

    @observable studyId:string;

    @observable molecularProfileId:string;

    @observable sampleAttrIds:string[] = [];

    @observable patientAttrIds:string[] = [];

    @observable private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

    @observable private _molecularProfileGeneFilter:MolecularProfileGeneFilter;

    @action updateClinicalDataEqualityFilters( attributeId      : string,
                                               clinicalDataType : ClinicalDataType,
                                               value            : string) {

        let id = [clinicalDataType,attributeId].join('_');

        let clinicalDataEqualityFilter =this._clinicalDataEqualityFilterSet.get(id);

        if(clinicalDataEqualityFilter) {
            let values = clinicalDataEqualityFilter.values;
            if(_.includes(values,value)){
                values = values.filter(item => item !== value);
            } else {
                values.push(value);
            }
            if(values.length>0) {
                clinicalDataEqualityFilter.values = values;
                this._clinicalDataEqualityFilterSet.set(id, clinicalDataEqualityFilter);
            } else {
                clinicalDataEqualityFilter = {} as any;
                this._clinicalDataEqualityFilterSet.delete(id)
            }
        } else {
            clinicalDataEqualityFilter = {
                    attributeId: attributeId,
                    clinicalDataType: clinicalDataType,
                    values: [value]
            };
            this._clinicalDataEqualityFilterSet.set(id, clinicalDataEqualityFilter);
        }
    }

    @action
    updateGeneFilter(entrezGeneId: number) {
        let _index = this._molecularProfileGeneFilter.entrezGeneIds.indexOf(entrezGeneId);
        if (_index === -1) {
            this._molecularProfileGeneFilter.entrezGeneIds.push(entrezGeneId);
        } else {
            this._molecularProfileGeneFilter.entrezGeneIds.splice(_index, 1);
        }
    }

    @action
    updateCNAGeneFilter(entrezGeneId: number, alteration: number) {
        let _id = [entrezGeneId, alteration].join('_');
        let _index = this._molecularProfileGeneFilter.entrezGeneIds.indexOf(entrezGeneId);
        if (_index === -1) {
            this._molecularProfileGeneFilter.entrezGeneIds.push(entrezGeneId);
        } else {
            this._molecularProfileGeneFilter.entrezGeneIds.splice(_index, 1);
        }
    }

    @computed get filters() {
        let filters: StudyViewFilter = {} as any;
        let clinicalDataEqualityFilter= this._clinicalDataEqualityFilterSet.values();

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if(clinicalDataEqualityFilter.length>0){
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilter
        }

        if(this._molecularProfileGeneFilter && this._molecularProfileGeneFilter.entrezGeneIds.length > 0) {
            filters.mutatedGenes = [this._molecularProfileGeneFilter];
        }
        return filters;
    }

    public getClinicalDataEqualityFilters(id : string): string[] {
        let clinicalDataEqualityFilter = this._clinicalDataEqualityFilterSet.get(id)
        return clinicalDataEqualityFilter ? clinicalDataEqualityFilter.values : [];
    }

    public getMutatedGenesTableFilters(): number[] {
        return this._molecularProfileGeneFilter ? this._molecularProfileGeneFilter.entrezGeneIds : [];
    }

    public getCNAGenesTableFilters(): string[] {
        return [];
    }

    readonly clinicalAttributes = remoteData({
        invoke: () => {
            return defaultClient.getAllClinicalAttributesInStudyUsingGET({
                studyId: this.studyId
            })
        },
        default: []
    });

    readonly selectedAttributes = remoteData({
        await: ()=>[this.clinicalAttributes],
        invoke: async () => {
            let selectedAttrIds = [...this.sampleAttrIds, ...this.patientAttrIds];
            let visibleClinicalAttributes = this.clinicalAttributes.result.filter(attribute => attribute.datatype == "STRING");
            if(!_.isEmpty(selectedAttrIds)){
                visibleClinicalAttributes = visibleClinicalAttributes.filter(attribute => {
                    return _.includes(selectedAttrIds, attribute.clinicalAttributeId);
                });
            }
            return visibleClinicalAttributes;
        },
        default: []
    });

    @computed get selectedSampleAttributeIds(){
        let attributes = this.selectedAttributes.result;
        return attributes
                    .filter(attribute => !attribute.patientAttribute)
                    .map(attribute => attribute.clinicalAttributeId);
    }

    @computed get selectedPatientAttributeIds(){
        let attributes = this.selectedAttributes.result;
        return attributes
                    .filter(attribute => attribute.patientAttribute)
                    .map(attribute => attribute.clinicalAttributeId);
    }

    readonly sampleAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.selectedAttributes],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                studyId: this.studyId,
                clinicalDataType: "SAMPLE",
                clinicalDataCountFilter: {
                    attributeIds: this.selectedSampleAttributeIds,
                    filter: this.filters
                }
            })
        },
        default: {}
    });

    readonly patientAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.selectedAttributes],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                studyId: this.studyId,
                clinicalDataType: "PATIENT",
                clinicalDataCountFilter: {
                    attributeIds: this.selectedPatientAttributeIds,
                    filter: this.filters
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

    readonly mutatedGeneData = remoteData<MutatedGenesData>({
        await: ()=>[],
        invoke: () => {
            return internalClient.fetchMutatedGenesUsingPOST({
                molecularProfileId: this.molecularProfileId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly cnaGeneData = remoteData<CNAGenesData>({
        await: ()=>[],
        invoke: () => {
            return internalClient.fetchCNAGenesUsingPOST({
                molecularProfileId: this.molecularProfileId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });
}


export interface IStudyViewPageProps {
    routing: any;
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method. 
// Even if this value is referenced deep within some helper method
@inject('routing')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {

    store:StudyViewPageStore;
    queryInput:HTMLInputElement;

    constructor(props: IStudyViewPageProps){
        super();
        this.store = new StudyViewPageStore();
        this.onUserSelection = this.onUserSelection.bind(this);
        this.updateGeneFilter = this.updateGeneFilter.bind(this);

        //TODO: this should be done by a module so that it can be reused on other pages
        const reaction1 = reaction(
            () => props.routing.location.query,
            query => {
                if ('studyId' in query) {
                    this.store.studyId = query.studyId;
                    this.store.molecularProfileId = `${this.store.studyId}_mutations`;
                    this.store.sampleAttrIds  = ('sampleAttrIds'  in query ? (query.sampleAttrIds  as string).split(",") : []);
                    this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                }
            },
            { fireImmediately:true }
        );

    }

    private onUserSelection(attrId           : string,
                            clinicalDataType : ClinicalDataType,
                            value            : string) {

        this.store.updateClinicalDataEqualityFilters(attrId, clinicalDataType, value)
    }

    private updateGeneFilter(entrezGeneId: number) {
        this.store.updateGeneFilter(entrezGeneId);
    }

    private updateCNAGeneFilter(entrezGeneId: number, alteration: number) {
        this.store.updateCNAGeneFilter(entrezGeneId, alteration);
    }

    renderAttributeChart = (clinicalAttribute : ClinicalAttribute,
                            arrayIndex        : number) => {

        let attributeUID = (clinicalAttribute.patientAttribute ? "PATIENT_" : "SAMPLE_")+clinicalAttribute.clinicalAttributeId;
        let filters = this.store.getClinicalDataEqualityFilters(attributeUID)
        let data = this.store.cinicalAttributeData.result[attributeUID]
        return (
            data && <div className={styles.chart} key={arrayIndex}>
                <div className={styles.header}>
                    <span>{clinicalAttribute.displayName}</span>
                </div>
                <div className="plot">
                    <PieChart onUserSelection= {this.onUserSelection}
                              filters={filters}
                              data={data}/>
                </div>
            </div>
        );
    }

    render(){
        let mutatedGeneData = this.store.mutatedGeneData.result;
        let cnaGeneData = this.store.cnaGeneData.result;
        return (
            <div>
                {
                    (this.store.selectedAttributes.isComplete && this.store.cinicalAttributeData.isComplete) &&
                    (
                        <div  className={styles.flexContainer}>
                            {this.store.selectedAttributes.result.map(this.renderAttributeChart)}
                        </div>
                    )
                }
                {(this.store.mutatedGeneData.isComplete && <MutatedGenesTable
                    data={mutatedGeneData}
                    numOfSelectedSamples={100}
                    filters={this.store.getMutatedGenesTableFilters()}
                    toggleSelection={this.updateGeneFilter}
                />)}
                {(this.store.cnaGeneData.isComplete && <CNAGenesTable
                    data={cnaGeneData}
                    numOfSelectedSamples={100}
                    filters={this.store.getCNAGenesTableFilters()}
                    toggleSelection={this.updateCNAGeneFilter}
                />)}
            </div>
        )
    }
}
