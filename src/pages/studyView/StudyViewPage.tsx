import * as React from 'react';
import * as _ from 'lodash';
import {inject, observer} from "mobx-react";
import {remoteData} from "../../shared/api/remoteData";
import {action, computed, observable, reaction} from "mobx";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {
    ClinicalDataCount,
    ClinicalDataEqualityFilter,
    CopyNumberCountByGene,
    CopyNumberGeneFilter,
    CopyNumberGeneFilterElement,
    MutationCountByGene,
    MutationGeneFilter,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {PieChart} from './charts/pieChart/PieChart'
import {ClinicalAttribute, MolecularProfile} from 'shared/api/generated/CBioPortalAPI';
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';

export type ClinicalDataType= "SAMPLE" | "PATIENT";
export type ClinicalAttributeData = {[attrId:string]:ClinicalDataCount[]};
export type ClinicalAttributeDataWithMeta = {attributeId:string,clinicalDataType:ClinicalDataType,counts:ClinicalDataCount[]};
export type MutatedGenesData = MutationCountByGene[];
export type CNAGenesData = CopyNumberCountByGene[];
export class StudyViewPageStore {

    constructor(){
    }

    @observable studyId:string;

    @observable sampleAttrIds:string[] = [];

    @observable patientAttrIds:string[] = [];

    @observable private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

    @observable private _mutatedGeneFilter: MutationGeneFilter;

    @observable private _cnaGeneFilter: CopyNumberGeneFilter;

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
        let mutatedGeneFilter = this._mutatedGeneFilter
        if(!mutatedGeneFilter) {
            mutatedGeneFilter = { molecularProfileId : this.mutationProfileId, entrezGeneIds: []}
        } 
        let _index = mutatedGeneFilter.entrezGeneIds.indexOf(entrezGeneId);
        if (_index === -1) {
            mutatedGeneFilter.entrezGeneIds.push(entrezGeneId);
        } else {
            mutatedGeneFilter.entrezGeneIds.splice(_index, 1);
        }
        this._mutatedGeneFilter = mutatedGeneFilter
    }

    @action
    updateCNAGeneFilter(entrezGeneId: number, alteration: number) {
        let _cnaGeneFilter = this._cnaGeneFilter;
        if(!_cnaGeneFilter) {
            _cnaGeneFilter = {
                    alterations: [],
                    molecularProfileId: this.cnaProfileId
                }
        }
        var _index = -1;
        _.every(_cnaGeneFilter.alterations, (val: CopyNumberGeneFilterElement, index: number) => {
            if (val.entrezGeneId === entrezGeneId && val.alteration === alteration) {
                _index = index;
                return false;
            }
        });
        if (_index === -1) {
            _cnaGeneFilter.alterations.push({
                entrezGeneId: entrezGeneId,
                alteration: alteration
            });
        } else {
            _cnaGeneFilter.alterations.splice(_index, 1);
        }
        this._cnaGeneFilter = _cnaGeneFilter;
    }

    @computed get filters() {
        let filters: StudyViewFilter = {} as any;
        let clinicalDataEqualityFilter= this._clinicalDataEqualityFilterSet.values();

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if(clinicalDataEqualityFilter.length>0){
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilter
        }

        if(this._mutatedGeneFilter && this._mutatedGeneFilter.entrezGeneIds.length > 0) {
            filters.mutatedGenes = [this._mutatedGeneFilter];
        }

        if(this._cnaGeneFilter && this._cnaGeneFilter.alterations.length > 0) {
            filters.cnaGenes = [this._cnaGeneFilter];
        }
        return filters;
    }

    public getClinicalDataEqualityFilters(id : string): string[] {
        let clinicalDataEqualityFilter = this._clinicalDataEqualityFilterSet.get(id)
        return clinicalDataEqualityFilter ? clinicalDataEqualityFilter.values : [];
    }

    public getMutatedGenesTableFilters(): number[] {
        return this._mutatedGeneFilter ? this._mutatedGeneFilter.entrezGeneIds : [];
    }

    public getCNAGenesTableFilters(): CopyNumberGeneFilterElement[] {
        return this._cnaGeneFilter ? this._cnaGeneFilter.alterations : [];
    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
		invoke: async () => {
			return await defaultClient.getAllMolecularProfilesInStudyUsingGET({
				studyId: this.studyId
			});
		},
		default: []
    });
    
    @computed get mutationProfileId():string {
        var i;
        let molecularProfiles = this.molecularProfiles.result
        for (i=0; i<molecularProfiles.length; i++) {
            if (molecularProfiles[i].molecularAlterationType === "MUTATION_EXTENDED"){
                return molecularProfiles[i].molecularProfileId
            }
        }
        return '';
    }

    @computed get cnaProfileId():string {
        var i;
        let molecularProfiles = this.molecularProfiles.result
        for (i=0; i<molecularProfiles.length; i++) {
            if(molecularProfiles[i].molecularAlterationType === "COPY_NUMBER_ALTERATION" && molecularProfiles[i].datatype === "DISCRETE"){
                return molecularProfiles[i].molecularProfileId
            }
        }
        return '';
    }

    readonly clinicalAttributes = remoteData({
        invoke: () => {
            return defaultClient.getAllClinicalAttributesInStudyUsingGET({
                studyId: this.studyId
            })
        },
        default: []
    });

    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.initialSampleAttributesData, this.initialPatientAttributesData],
        invoke: async () => {
            let queriedAttributes = this.initialQueriedAttributes.result;

            // return visibleClinicalAttributes;
            // TODO
            // START : This is a temporary logic to dispaly only the attributes with values(slices) size >1 and <10
            let attribureSet: { [id: string]: ClinicalAttribute } = _.reduce(queriedAttributes, function (result, obj) {
                let tag = obj.patientAttribute?"PATIENT_":"SAMPLE_";
                result[tag + obj.clinicalAttributeId] = obj
                return result;
            }, {} as any)
            
            let sampleData:ClinicalAttributeData = this.initialSampleAttributesData.result

            let patientData:ClinicalAttributeData = this.initialPatientAttributesData.result

            let filterSampleAttributes:ClinicalAttribute[] = _.reduce(sampleData, function (result, value, key) {
                //check if number of visible charts <10 and number of slices >1 and <10
                if(result.length<10 && value.length>1 && value.length<10){
                    if(attribureSet["SAMPLE_"+key]){
                        result.push(attribureSet["SAMPLE_"+key]);
                    }
                }
                return result;
            }, [] as any)

            let filterPatientAttributes:ClinicalAttribute[] = _.reduce(patientData, function (result, value, key) {
                //check if number of visible charts <10 and number of slices >1 and <10
                if(result.length<10 && value.length>1 && value.length<10){
                    if(attribureSet["PATIENT_"+key]){
                        result.push(attribureSet["PATIENT_"+key]);
                    }
                }
                return result;
            } , [] as any)
            //END

            return [...filterSampleAttributes, ...filterPatientAttributes]
        },
        default: []
    });

    readonly initialQueriedAttributes = remoteData({
        await: ()=>[this.clinicalAttributes],
        invoke: async () => {
            let selectedAttrIds = [...this.sampleAttrIds, ...this.patientAttrIds];
            //filter datatype === "STRING"
            let visibleClinicalAttributes = this.clinicalAttributes.result.filter(attribute => attribute.datatype === "STRING");
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
        let attributes = this.defaultVisibleAttributes.result;
        return attributes
                    .filter(attribute => !attribute.patientAttribute)
                    .map(attribute => attribute.clinicalAttributeId);
    }

    @computed get selectedPatientAttributeIds(){
        let attributes = this.defaultVisibleAttributes.result;
        return attributes
                    .filter(attribute => attribute.patientAttribute)
                    .map(attribute => attribute.clinicalAttributeId);
    }

    readonly sampleAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.initialSampleAttributesData],
        invoke: async () => {
            if(!_.isEmpty(this.filters)){
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    studyId: this.studyId,
                    clinicalDataType: "SAMPLE",
                    clinicalDataCountFilter: {
                        attributeIds: this.selectedSampleAttributeIds,
                        filter: this.filters
                    }
                })
            } else{
                return this.initialSampleAttributesData.result;
            }
        },
        default: {}
    });

    readonly patientAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.initialPatientAttributesData],
        invoke: async () => {
            if(!_.isEmpty(this.filters)){
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    studyId: this.studyId,
                    clinicalDataType: "PATIENT",
                    clinicalDataCountFilter: {
                        attributeIds: this.selectedPatientAttributeIds,
                        filter: this.filters
                    }
                })
            } else{
                return this.initialPatientAttributesData.result;
            }
        },
        default: {}
    });


    //invoked once initially
    readonly initialSampleAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.initialQueriedAttributes],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                studyId: this.studyId,
                clinicalDataType: "SAMPLE",
                clinicalDataCountFilter: {
                    attributeIds: this.initialQueriedAttributes.result
                    .filter(attribute => !attribute.patientAttribute)
                    .map(attribute => attribute.clinicalAttributeId),
                    filter: {} as any
                }
            })
        },
        default: {}
    });

    //invoked once initially
    readonly initialPatientAttributesData = remoteData<ClinicalAttributeData>({
        await: ()=>[this.initialQueriedAttributes],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                studyId: this.studyId,
                clinicalDataType: "PATIENT",
                clinicalDataCountFilter: {
                    attributeIds: this.initialQueriedAttributes.result
                    .filter(attribute => attribute.patientAttribute)
                    .map(attribute => attribute.clinicalAttributeId),
                    filter: {} as any
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
        await: ()=>[this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchMutatedGenesUsingPOST({
                molecularProfileId: this.mutationProfileId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly cnaGeneData = remoteData<CNAGenesData>({
        await: ()=>[this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchCNAGenesUsingPOST({
                molecularProfileId: this.cnaProfileId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });
}


export interface IStudyViewPageProps {
    routing: any;
    resultsViewPageStore:ResultsViewPageStore;
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
        this.updateCNAGeneFilter = this.updateCNAGeneFilter.bind(this);

        //TODO: this should be done by a module so that it can be reused on other pages
        const reaction1 = reaction(
            () => props.routing.location.query,
            query => {
                if ('studyId' in query) {
                    this.store.studyId = query.studyId;
                    this.store.sampleAttrIds  = ('sampleAttrIds'  in query ? (query.sampleAttrIds  as string).split(",") : []);
                    this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                } else {
                    let studies = this.props.resultsViewPageStore.studyIds.result
                    if(studies && studies.length>0){
                        this.store.studyId = studies[0];
                    }
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
            <div style={{overflowY: "scroll", border:"1px solid #cccccc"}}>
                {
                    this.store.defaultVisibleAttributes.isComplete &&
                    (
                        <div  className={styles.flexContainer}>
                            {this.store.defaultVisibleAttributes.result.map(this.renderAttributeChart)}
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
