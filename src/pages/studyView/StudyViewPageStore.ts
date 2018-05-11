import * as React from 'react';
import * as _ from 'lodash';
import {remoteData} from "../../shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import {action, computed, observable} from "mobx";
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
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataSingleStudyFilter,
    MolecularProfile,
    Patient
} from 'shared/api/generated/CBioPortalAPI';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';


export enum ClinicalDataType {
    SAMPLE = "SAMPLE",
    PATIENT = "PATIENT"
}
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

    private _clinicalDataEqualityFilterSet = observable.map<ClinicalDataEqualityFilter>();

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

    //TODO:cleanup
    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {

            let selectedAttrIds = [...this.sampleAttrIds, ...this.patientAttrIds];
            let queriedAttributes = this.clinicalAttributes.result
            if (!_.isEmpty(selectedAttrIds)) {
                queriedAttributes = this.clinicalAttributes.result.filter(attribute => {
                    return _.includes(selectedAttrIds, attribute.clinicalAttributeId);
                });
            }

            let sampleAttributeCount = 0;
            let patientAttributeCount = 0;
            let filterAttributes: ClinicalAttribute[] = []
            queriedAttributes.forEach(attribute => {
                if(attribute.patientAttribute){
                    if(patientAttributeCount<10){
                        filterAttributes.push(attribute)
                        patientAttributeCount++;
                    }
                } else{
                    if(sampleAttributeCount<10){
                        filterAttributes.push(attribute)
                        sampleAttributeCount++;
                    }
                }
            });
            return filterAttributes
        },
        default: []
    });

    readonly allSamples = remoteData<Sample[]>({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return internalClient.fetchSampleIdsUsingPOST({
                studyId: this.studyId,
                studyViewFilter: {} as any
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