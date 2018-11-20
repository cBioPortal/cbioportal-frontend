import AppConfig from "appConfig";
import {StudyView} from "../../config/IAppConfig";
import * as _ from 'lodash';

export type StudyViewColor = {
    theme: StudyViewColorTheme,
    reservedValue: { [val: string]: string },

    na: string
    mutatedGene: string,
    deletion: string,
    amplification: string,
}

export type StudyViewColorTheme = {
    primary: string,
    secondary: string,
    tertiary: string,
    quaternary: string,

    unselectedGroup: string,
    selectedGroup: string,
    unselectedPieSlices: string,
    clinicalFilterTitle: string,
    clinicalFilterContent: string,
}

export type StudyViewThreshold = {
    pieToTable: number,
    escapeTick: number,
    rowsInTableForOneGrid: number,
    clinicalChartsPerGroup: number,
}

export type StudyViewFrontEndConfig = {
    thresholds: StudyViewThreshold,
    colors: StudyViewColor,
    alwaysShownClinicalAttributes: string[],
    defaultPriority: number,
}

export type StudyViewConfig = StudyView & StudyViewFrontEndConfig

// TODO: The priority and tableAttrs are duplicated in serverConfigDefaults.
// We need to update in next visit before the release.
const YES_COLOR = "#66AA00";
const NO_COLOR = "#666666";
const FEMALE_COLOR = '#DC3912';
const MALE_COLOR = '#2986E2';

const studyViewFrontEnd = {
    alwaysShownClinicalAttributes: ['SAMPLE_CANCER_TYPE', 'SAMPLE_CANCER_TYPE_DETAILED'],
    defaultPriority: 1,
    tableAttrs: ['SAMPLE_CANCER_TYPE', 'SAMPLE_CANCER_TYPE_DETAILED'],
    priority: {
        "SAMPLE_CANCER_TYPE": 3000,
        "SAMPLE_CANCER_TYPE_DETAILED": 2000,
        "OS_SURVIVAL": 400,
        "DFS_SURVIVAL": 300,
        "MUTATION_COUNT_CNA_FRACTION": 200,
        "MUTATED_GENES_TABLE": 90,
        "CNA_GENES_TABLE": 80,
        "STUDY_ID": 70,
        "SEQUENCED": 60,
        "HAS_CNA_DATA": 50,
        "SAMPLE_COUNT_PATIENT": 40,
        "MUTATION_COUNT": 30,
        "FRACTION_GENOME_ALTERED": 20,
        "PATIENT_GENDER": 9,
        "PATIENT_SEX": 9,
        "PATIENT_AGE": 9
    },
    thresholds: {
        pieToTable: 20,
        escapeTick: 10,
        rowsInTableForOneGrid: 8,
        clinicalChartsPerGroup: 5,
    },
    colors: {
        theme: {
            primary: '#2986E2',
            secondary: '#DC3912',
            tertiary: '#f88508',
            quaternary: '#109618',

            unselectedGroup: '#2986E2',
            selectedGroup: '#DC3912',
            unselectedPieSlices: '#808080',
            clinicalFilterTitle: '#A9A9A9',
            clinicalFilterContent: '#2986E2',
        },
        reservedValue: {
            TRUE: YES_COLOR,
            FALSE: NO_COLOR,
            YES: YES_COLOR,
            NO: NO_COLOR,
            FEMALE: FEMALE_COLOR,
            MALE: MALE_COLOR,
            F: FEMALE_COLOR,
            M: MALE_COLOR,
        },

        na: "#CCCCCC",
        mutatedGene: '#008000',
        deletion: '#0000FF',
        amplification: '#FF0000',
    }
};

_.forEach(studyViewFrontEnd.colors.reservedValue, (color, key)=>{
    // expand reservedValue entries to handle other case possibilities. eg expand TRUE to True and true
    (studyViewFrontEnd.colors.reservedValue as any)[key.toLowerCase()] = color;
    (studyViewFrontEnd.colors.reservedValue as any)[key[0] + key.slice(1).toLowerCase()] = color;
});
export const STUDY_VIEW_CONFIG: StudyViewConfig = _.assign(studyViewFrontEnd, AppConfig.serverConfig.study_view);