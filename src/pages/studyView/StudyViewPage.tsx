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
    Sample,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataSingleStudyFilter,
    MolecularProfile,
    Patient
} from 'shared/api/generated/CBioPortalAPI';
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";
import {ResultsViewPageStore} from 'pages/resultsView/ResultsViewPageStore';
import {Chart} from 'pages/studyView/charts/Chart';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import {getPatientSurvivals} from "../resultsView/SurvivalStoreHelper";
import {PatientSurvival} from "../../shared/model/PatientSurvival";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";

export type ClinicalDataType = "SAMPLE" | "PATIENT";
export type ClinicalAttributeData = { [attrId: string]: ClinicalDataCount[] };
export type ClinicalAttributeDataWithMeta = { attributeId: string, clinicalDataType: ClinicalDataType, counts: ClinicalDataCount[] };
export type MutatedGenesData = MutationCountByGene[];
export type CNAGenesData = CopyNumberCountByGene[];
export type SurvivalType = {
    id: string,
    associatedAttrs: string[],
    filter: string[],
    alteredGroup: PatientSurvival[]
    unalteredGroup: PatientSurvival[]
}

export class StudyViewPageStore {

    constructor() {
    }

    @observable studyId: string;

    @observable sampleAttrIds: string[] = [];

    @observable patientAttrIds: string[] = [];

    @observable private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

    @observable private _mutatedGeneFilter: MutationGeneFilter;

    @observable private _cnaGeneFilter: CopyNumberGeneFilter;

    @action
    updateClinicalDataEqualityFilters(attributeId: string,
                                      clinicalDataType: ClinicalDataType,
                                      values: string[]) {

        let id = [clinicalDataType, attributeId].join('_');

        if (values.length > 0) {
            let clinicalDataEqualityFilter = {
                attributeId: attributeId,
                clinicalDataType: clinicalDataType,
                values: values
            };
            this._clinicalDataEqualityFilterSet.set(id, clinicalDataEqualityFilter);

        } else {
            this._clinicalDataEqualityFilterSet.delete(id)
        }
    }

    @action
    updateGeneFilter(entrezGeneId: number) {
        let mutatedGeneFilter = this._mutatedGeneFilter
        if (!mutatedGeneFilter) {
            mutatedGeneFilter = {molecularProfileId: this.mutationProfileId, entrezGeneIds: []}
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
        if (!_cnaGeneFilter) {
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

    @computed
    get filters() {
        let filters: StudyViewFilter = {} as any;
        let clinicalDataEqualityFilter = this._clinicalDataEqualityFilterSet.values();

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if (clinicalDataEqualityFilter.length > 0) {
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilter
        }

        if (this._mutatedGeneFilter && this._mutatedGeneFilter.entrezGeneIds.length > 0) {
            filters.mutatedGenes = [this._mutatedGeneFilter];
        }

        if (this._cnaGeneFilter && this._cnaGeneFilter.alterations.length > 0) {
            filters.cnaGenes = [this._cnaGeneFilter];
        }

        filters.sampleIds = [];
        return filters;
    }

    public getClinicalDataEqualityFilters(id: string): string[] {
        let clinicalDataEqualityFilter = this._clinicalDataEqualityFilterSet.get(id)
        return clinicalDataEqualityFilter ? clinicalDataEqualityFilter.values : [];
    }

    public getMutatedGenesTableFilters(): number[] {
        return this._mutatedGeneFilter ? this._mutatedGeneFilter.entrezGeneIds : [];
    }

    public getCNAGenesTableFilters(): CopyNumberGeneFilterElement[] {
        return this._cnaGeneFilter ? this._cnaGeneFilter.alterations : [];
    }

    private getPatientBySample(sample: Sample): Patient {
        return {
            patientId: sample.patientId,
            studyId: sample.studyId,
            uniquePatientKey: sample.patientId,
            uniqueSampleKey: sample.sampleId
        };
    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        invoke: async () => {
            return await defaultClient.getAllMolecularProfilesInStudyUsingGET({
                studyId: this.studyId
            });
        },
        default: []
    });

    readonly studyMetaData = remoteData({
        invoke: async() => defaultClient.getStudyUsingGET({studyId: this.studyId})
    });

    @computed
    get mutationProfileId(): string {
        var i;
        let molecularProfiles = this.molecularProfiles.result
        for (i = 0; i < molecularProfiles.length; i++) {
            if (molecularProfiles[i].molecularAlterationType === "MUTATION_EXTENDED") {
                return molecularProfiles[i].molecularProfileId
            }
        }
        return '';
    }

    @computed
    get cnaProfileId(): string {
        var i;
        let molecularProfiles = this.molecularProfiles.result
        for (i = 0; i < molecularProfiles.length; i++) {
            if (molecularProfiles[i].molecularAlterationType === "COPY_NUMBER_ALTERATION" && molecularProfiles[i].datatype === "DISCRETE") {
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
                let tag = obj.patientAttribute ? "PATIENT_" : "SAMPLE_";
                result[tag + obj.clinicalAttributeId] = obj
                return result;
            }, {} as any)

            let sampleData: ClinicalAttributeData = this.initialSampleAttributesData.result

            let patientData: ClinicalAttributeData = this.initialPatientAttributesData.result

            let filterSampleAttributes: ClinicalAttribute[] = _.reduce(sampleData, function (result, value, key) {
                //check if number of visible charts <10 and number of slices >1 and <10
                if (result.length < 10 && value.length > 1 && value.length < 10) {
                    if (attribureSet["SAMPLE_" + key]) {
                        result.push(attribureSet["SAMPLE_" + key]);
                    }
                }
                return result;
            }, [] as any)

            let filterPatientAttributes: ClinicalAttribute[] = _.reduce(patientData, function (result, value, key) {
                //check if number of visible charts <10 and number of slices >1 and <10
                if (result.length < 10 && value.length > 1 && value.length < 10) {
                    if (attribureSet["PATIENT_" + key]) {
                        result.push(attribureSet["PATIENT_" + key]);
                    }
                }
                return result;
            }, [] as any)
            //END

            return [...filterSampleAttributes, ...filterPatientAttributes]
        },
        default: []
    });

    readonly initialQueriedAttributes = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            let selectedAttrIds = [...this.sampleAttrIds, ...this.patientAttrIds];
            //filter datatype === "STRING"
            let visibleClinicalAttributes = this.clinicalAttributes.result.filter(attribute => attribute.datatype === "STRING");
            if (!_.isEmpty(selectedAttrIds)) {
                visibleClinicalAttributes = visibleClinicalAttributes.filter(attribute => {
                    return _.includes(selectedAttrIds, attribute.clinicalAttributeId);
                });
            }
            return visibleClinicalAttributes;
        },
        default: []
    });

    @computed
    get selectedSampleAttributeIds() {
        let attributes = this.defaultVisibleAttributes.result;
        return attributes
            .filter(attribute => !attribute.patientAttribute)
            .map(attribute => attribute.clinicalAttributeId);
    }

    @computed
    get selectedPatientAttributeIds() {
        let attributes = this.defaultVisibleAttributes.result;
        return attributes
            .filter(attribute => attribute.patientAttribute)
            .map(attribute => attribute.clinicalAttributeId);
    }

    readonly sampleAttributesData = remoteData<ClinicalAttributeData>({
        await: () => [this.initialSampleAttributesData],
        invoke: async () => {
            if (!_.isEmpty(this.filters)) {
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    studyId: this.studyId,
                    clinicalDataType: "SAMPLE",
                    clinicalDataCountFilter: {
                        attributeIds: this.selectedSampleAttributeIds,
                        filter: this.filters
                    }
                })
            } else {
                return this.initialSampleAttributesData.result;
            }
        },
        default: {}
    });

    readonly patientAttributesData = remoteData<ClinicalAttributeData>({
        await: () => [this.initialPatientAttributesData],
        invoke: async () => {
            if (!_.isEmpty(this.filters)) {
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    studyId: this.studyId,
                    clinicalDataType: "PATIENT",
                    clinicalDataCountFilter: {
                        attributeIds: this.selectedPatientAttributeIds,
                        filter: this.filters
                    }
                })
            } else {
                return this.initialPatientAttributesData.result;
            }
        },
        default: {}
    });

    readonly allSamples = remoteData<Sample[]>({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchSampleIdsUsingPOST({
                studyId: this.studyId,
                studyViewFilter: {
                    clinicalDataEqualityFilters: [],
                    mutatedGenes: [],
                    cnaGenes: [],
                    sampleIds: []
                }
            })
        },
        default: []
    });

    readonly allPatients = remoteData<Patient[]>({
        await: () => [this.allSamples],
        invoke: async () => {
            return this.allSamples.result.map(sample => this.getPatientBySample(sample));
        },
        default: []
    });

    readonly allPatientIds = remoteData<string[]>({
        await: () => [this.allPatients],
        invoke: async () => {
            return this.allPatients.result.map(patient => patient.patientId);
        },
        default: []
    });

    readonly selectedSamples = remoteData<Sample[]>({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchSampleIdsUsingPOST({
                studyId: this.studyId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly selectedPatientIds = remoteData<string[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            return this.selectedSamples.result.map(sample => sample.patientId);
        },
        default: []
    });

    readonly unSelectedPatientIds = remoteData<string[]>({
        await: () => [this.selectedPatientIds],
        invoke: async () => {
            return this.allPatientIds.result.filter(patientId => !_.includes(this.selectedPatientIds.result, patientId));
        },
        default: []
    });

    @computed
    get hasSurvivalPlots() {

        let toReturn = {os_survival: false, dfs_survival: false};
        let osStatusFlag = false;
        let osMonthsFlag = false;
        let dfsStatusFlag = false;
        let dfsMonthsFlag = false;

        this.clinicalAttributes.result.forEach(obj => {
            if (obj.clinicalAttributeId === 'OS_STATUS') {
                osStatusFlag = true;
            } else if (obj.clinicalAttributeId === 'OS_MONTHS') {
                osMonthsFlag = true;
            } else if (obj.clinicalAttributeId === 'DFS_STATUS') {
                dfsStatusFlag = true;
            } else if (obj.clinicalAttributeId === 'DFS_MONTHS') {
                dfsMonthsFlag = true;
            }
        });

        if (osStatusFlag && osMonthsFlag) {
            toReturn.os_survival = true;
        }
        if (dfsStatusFlag && dfsMonthsFlag) {
            toReturn.dfs_survival = true;
        }
        return toReturn
    }

    readonly survivalPlotData = remoteData<SurvivalType[]>({
        await: () => [this.clinicalAttributes, this.survivalData, this.selectedPatientIds, this.unSelectedPatientIds],
        invoke: async () => {

            let survivalTypes: SurvivalType[] = [];

            if (this.hasSurvivalPlots.os_survival) {
                survivalTypes.push({
                    id: 'os_survival',
                    associatedAttrs: ['OS_STATUS', 'OS_MONTHS'],
                    filter: ['DECEASED'],
                    alteredGroup: [],
                    unalteredGroup: []
                })
            }
            if (this.hasSurvivalPlots.dfs_survival) {
                survivalTypes.push({
                    id: 'dfs_survival',
                    associatedAttrs: ['DFS_STATUS', 'DFS_MONTHS'],
                    filter: ['Recurred/Progressed', 'Recurred'],
                    alteredGroup: [],
                    unalteredGroup: []
                })
            }
            survivalTypes.forEach(survivalType => {
                survivalType.alteredGroup = getPatientSurvivals(
                    _.groupBy(this.survivalData.result, 'patientId'),
                    this.selectedPatientIds.result!, survivalType.associatedAttrs[0], survivalType.associatedAttrs[1], s => survivalType.filter.indexOf(s) !== -1);
                survivalType.unalteredGroup = getPatientSurvivals(
                    _.groupBy(this.survivalData.result, 'patientId'),
                    this.unSelectedPatientIds.result!, survivalType.associatedAttrs[0], survivalType.associatedAttrs[1], s => survivalType.filter.indexOf(s) !== -1);
            });
            return survivalTypes;
        },
        default: []
    });

    //invoked once initially
    readonly initialSampleAttributesData = remoteData<ClinicalAttributeData>({
        await: () => [this.initialQueriedAttributes],
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
        await: () => [this.initialQueriedAttributes],
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

    readonly clinicalAttributeData = remoteData<{ [attrId: string]: ClinicalAttributeDataWithMeta }>({
        await: () => [this.sampleAttributesData, this.patientAttributesData],
        invoke: async () => {

            let result: { [attrId: string]: ClinicalAttributeDataWithMeta } = _.reduce(this.sampleAttributesData.result, function (result, value, key) {
                result["SAMPLE_" + key] = {attributeId: key, clinicalDataType: "SAMPLE", counts: value}
                return result;
            }, {} as any)

            result = _.reduce(this.patientAttributesData.result, function (result, value, key) {
                result["PATIENT_" + key] = {attributeId: key, clinicalDataType: "PATIENT", counts: value}
                return result;
            }, result);
            return result;
        },
        default: {}
    });

    readonly mutatedGeneData = remoteData<MutatedGenesData>({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchMutatedGenesUsingPOST({
                molecularProfileId: this.mutationProfileId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly cnaGeneData = remoteData<CNAGenesData>({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchCNAGenesUsingPOST({
                molecularProfileId: this.cnaProfileId,
                studyViewFilter: this.filters
            })
        },
        default: []
    });

    readonly survivalData = remoteData<ClinicalData[]>({
        await: () => [this.molecularProfiles, this.allPatientIds],
        invoke: () => {
            const filter: ClinicalDataSingleStudyFilter = {
                attributeIds: ["OS_STATUS", "OS_MONTHS", "DFS_STATUS", "DFS_MONTHS"],
                ids: this.allPatientIds.result
            };
            return defaultClient.fetchAllClinicalDataInStudyUsingPOST({
                studyId: this.studyId,
                clinicalDataSingleStudyFilter: filter,
                clinicalDataType: "PATIENT"
            })
        },
        default: []
    });
}


export interface IStudyViewPageProps {
    routing: any;
    resultsViewPageStore: ResultsViewPageStore;
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method. 
// Even if this value is referenced deep within some helper method
@inject('routing')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {

    store: StudyViewPageStore;
    queryInput: HTMLInputElement;

    constructor(props: IStudyViewPageProps) {
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
                    this.store.sampleAttrIds = ('sampleAttrIds' in query ? (query.sampleAttrIds  as string).split(",") : []);
                    this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                } else {
                    let studies = this.props.resultsViewPageStore.studyIds.result
                    if (studies && studies.length > 0) {
                        this.store.studyId = studies[0];
                    }
                }
            },
            {fireImmediately: true}
        );

    }

    private onUserSelection(attrId: string,
                            clinicalDataType: ClinicalDataType,
                            values: string[]) {

        this.store.updateClinicalDataEqualityFilters(attrId, clinicalDataType, values)
    }

    private updateGeneFilter(entrezGeneId: number) {
        this.store.updateGeneFilter(entrezGeneId);
    }

    private updateCNAGeneFilter(entrezGeneId: number, alteration: number) {
        this.store.updateCNAGeneFilter(entrezGeneId, alteration);
    }

    renderAttributeChart = (clinicalAttribute: ClinicalAttribute,
                            arrayIndex: number) => {

        let attributeUID = (clinicalAttribute.patientAttribute ? "PATIENT_" : "SAMPLE_") + clinicalAttribute.clinicalAttributeId;
        let filters = this.store.getClinicalDataEqualityFilters(attributeUID)
        let data = this.store.clinicalAttributeData.result[attributeUID]
        return (<Chart
            clinicalAttribute={clinicalAttribute}
            onUserSelection={this.onUserSelection}
            filters={filters}
            data={data}
            key={arrayIndex}/>);
    };

    renderSurvivalPlot = (data: SurvivalType) => {
        return <div className={styles.survivalPlot}>
            <SurvivalChart alteredPatientSurvivals={data.alteredGroup}
                           unalteredPatientSurvivals={data.unalteredGroup}
                           title={'test'}
                           xAxisLabel="Months Survival"
                           yAxisLabel="Overall Survival"
                           totalCasesHeader="Number of Cases, Total"
                           statusCasesHeader="Number of Cases, Deceased"
                           medianMonthsHeader="Median Months Survival"
                           yLabelTooltip="Survival estimate"
                           xLabelWithEventTooltip="Time of death"
                           xLabelWithoutEventTooltip="Time of last observation"
                           showDownloadButtons={false}
                           showTable={false}
                           showLegend={false}
                           styleOpts={{
                               width: 500,
                               height: 300
                           }}
                           fileName="Overall_Survival"/>
        </div>
    }

    render() {
        let mutatedGeneData = this.store.mutatedGeneData.result;
        let cnaGeneData = this.store.cnaGeneData.result;
        let cancerStudy = this.store.studyMetaData.result!;
        return (
            <div className="studyView">
                <div className="topBanner">
                    {
                        this.store.studyMetaData.isComplete && (
                            <div className="studyViewHeader">
                                <h3>{cancerStudy.name}</h3>
                                <p dangerouslySetInnerHTML={{__html: cancerStudy.description}}></p>
                            </div>
                        )
                    }
                </div>
                <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                         className="mainTabs">

                    <MSKTab key={0} id="summaryTab" linkText="Summary">
                        <div>
                            {
                                this.store.defaultVisibleAttributes.isComplete &&
                                (
                                    <div className={styles.flexContainer}>
                                        {this.store.defaultVisibleAttributes.result.map(this.renderAttributeChart)}
                                    </div>
                                )
                            }
                            {
                                this.store.survivalPlotData.result.map(this.renderSurvivalPlot)
                            }
                            <div className={styles.flexContainer}>
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
                        </div>
                    </MSKTab>
                </MSKTabs>
            </div>
        )
    }
}
