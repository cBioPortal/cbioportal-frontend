import { assert } from 'chai';
import _ from 'lodash';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import {
    convertScatterDataToDownloadData,
    downSampling,
    filterScatterData,
    getDownloadContent,
    getSurvivalSummaries,
    getLineData,
    getMedian,
    getScatterData,
    getScatterDataWithOpacity,
    getStats,
    ScatterData,
    parseSurvivalData,
    getSurvivalStatusBoolean,
    isNullSurvivalClinicalDataValue,
    createSurvivalAttributeIdsDict,
} from './SurvivalUtil';

const exampleAlteredPatientSurvivals = [
    {
        uniquePatientKey: 'TCGA-OR-A5J2',
        patientId: 'TCGA-OR-A5J2',
        studyId: 'acc_tcga',
        months: 0.09,
        status: true,
    },
    {
        uniquePatientKey: 'TCGA-OR-A5J1',
        patientId: 'TCGA-OR-A5J1',
        studyId: 'acc_tcga',
        months: 5.09,
        status: false,
    },
];

const exampleUnalteredPatientSurvivals = [
    {
        uniquePatientKey: 'TCGA-OR-A5J3',
        patientId: 'TCGA-OR-A5J3',
        studyId: 'acc_tcga',
        months: 0,
        status: false,
    },
    {
        uniquePatientKey: 'TCGA-2F-A9KP',
        patientId: 'TCGA-2F-A9KP',
        studyId: 'blca_tcga',
        months: 0.13,
        status: false,
    },
    {
        uniquePatientKey: 'TCGA-2F-A9KO',
        patientId: 'TCGA-2F-A9KO',
        studyId: 'blca_tcga',
        months: 63.83,
        status: true,
    },
    {
        uniquePatientKey: 'TCGA-2F-A9KQ',
        patientId: 'TCGA-2F-A9KQ',
        studyId: 'blca_tcga',
        months: 182.19,
        status: true,
    },
];

const allScatterData: ScatterData[] = [
    {
        x: 0,
        y: 10,
        patientId: '',
        uniquePatientKey: '',
        studyId: '',
        status: true,
    },
    {
        x: 0.5,
        y: 9,
        patientId: '',
        uniquePatientKey: '',
        studyId: '',
        status: true,
    },
    {
        x: 1,
        y: 8,
        patientId: '',
        uniquePatientKey: '',
        studyId: '',
        status: true,
    },
    {
        x: 0,
        y: 10,
        patientId: '',
        uniquePatientKey: '',
        studyId: '',
        status: true,
    },
    {
        x: 0,
        y: 10,
        patientId: '',
        uniquePatientKey: '',
        studyId: '',
        status: true,
    },
];

// data from gbm_columbia_2019 study
const cbioExamplePatientSurvivals = [
    {
        months: 1.4,
        status: false,
    },
    {
        months: 4.3,
        status: false,
    },
    {
        months: 4.5,
        status: false,
    },
    {
        months: 8,
        status: false,
    },
    {
        months: 8.9,
        status: true,
    },
    {
        months: 9.2,
        status: false,
    },
    {
        months: 13.1,
        status: false,
    },
    {
        months: 14.4,
        status: true,
    },
    {
        months: 14.8,
        status: false,
    },
    {
        months: 14.8,
        status: false,
    },
    {
        months: 15.3,
        status: false,
    },
    {
        months: 15.9,
        status: false,
    },
    {
        months: 19.6,
        status: false,
    },
    {
        months: 20.6,
        status: true,
    },
    {
        months: 23,
        status: false,
    },
    {
        months: 23,
        status: false,
    },
    {
        months: 24,
        status: true,
    },
    {
        months: 25.4,
        status: true,
    },
    {
        months: 26.6,
        status: true,
    },
    {
        months: 31.3,
        status: false,
    },
    {
        months: 34,
        status: false,
    },
    {
        months: 36.6,
        status: true,
    },
    {
        months: 36.9,
        status: false,
    },
    {
        months: 43.1,
        status: false,
    },
    {
        months: 45.4,
        status: true,
    },
    {
        months: 45.6,
        status: false,
    },
    {
        months: 46.5,
        status: true,
    },
    {
        months: 46.8,
        status: true,
    },
    {
        months: 55.6,
        status: false,
    },
] as PatientSurvival[];

// ground truth from R survival package
/*
library(survival)
time = c(1.4,4.3,4.5,8,8.9,9.2,13.1,14.4,14.8,14.8,15.3,15.9,19.6,20.6,23,23,24,25.4,26.6,31.3,34,36.6,36.9,43.1,45.4,45.6,46.5,46.8,55.6)
status = c(1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,2,2,2,1,1,2,1,1,2,1,2,2,1)
summary(survfit(Surv(time, status) ~ 1))
*/
const cbioExampleSurvivalSummaries = [
    {
        survivalFunctionEstimate: 1,
    },
    {
        survivalFunctionEstimate: 1,
    },
    {
        survivalFunctionEstimate: 1,
    },
    {
        survivalFunctionEstimate: 1,
    },
    {
        survivalFunctionEstimate: 0.96,
        standardError: 0.03919183588453085,
        low95ConfidenceInterval: 0.8861782272999308,
        high95ConfidenceInterval: 1,
    },
    {
        survivalFunctionEstimate: 0.96,
    },
    {
        survivalFunctionEstimate: 0.96,
    },
    {
        survivalFunctionEstimate: 0.9163636363636364,
        standardError: 0.05671964347934269,
        low95ConfidenceInterval: 0.8116737574073527,
        high95ConfidenceInterval: 1,
    },
    {
        survivalFunctionEstimate: 0.9163636363636364,
    },
    {
        survivalFunctionEstimate: 0.9163636363636364,
    },
    {
        survivalFunctionEstimate: 0.9163636363636364,
    },
    {
        survivalFunctionEstimate: 0.9163636363636364,
    },
    {
        survivalFunctionEstimate: 0.9163636363636364,
    },
    {
        survivalFunctionEstimate: 0.8590909090909091,
        standardError: 0.07682903121584796,
        low95ConfidenceInterval: 0.7209674254729507,
        high95ConfidenceInterval: 1,
    },
    {
        survivalFunctionEstimate: 0.8590909090909091,
    },
    {
        survivalFunctionEstimate: 0.8590909090909091,
    },
    {
        survivalFunctionEstimate: 0.7930069930069931,
        standardError: 0.09518757265448993,
        low95ConfidenceInterval: 0.6267641342567718,
        high95ConfidenceInterval: 1,
    },
    {
        survivalFunctionEstimate: 0.7269230769230769,
        standardError: 0.10778053305175259,
        low95ConfidenceInterval: 0.5436022117301463,
        high95ConfidenceInterval: 0.9720658753052113,
    },
    {
        survivalFunctionEstimate: 0.6608391608391608,
        standardError: 0.11649295252831449,
        low95ConfidenceInterval: 0.4677843335458505,
        high95ConfidenceInterval: 0.9335678114491659,
    },
    {
        survivalFunctionEstimate: 0.6608391608391608,
    },
    {
        survivalFunctionEstimate: 0.6608391608391608,
    },
    {
        survivalFunctionEstimate: 0.5782342657342657,
        standardError: 0.12790863672863112,
        low95ConfidenceInterval: 0.37481184465886863,
        high95ConfidenceInterval: 0.8920605654113074,
    },
    {
        survivalFunctionEstimate: 0.5782342657342657,
    },
    {
        survivalFunctionEstimate: 0.5782342657342657,
    },
    {
        survivalFunctionEstimate: 0.4625874125874126,
        standardError: 0.1454996635668725,
        low95ConfidenceInterval: 0.24972477313930544,
        high95ConfidenceInterval: 0.8568918157148447,
    },
    {
        survivalFunctionEstimate: 0.4625874125874126,
    },
    {
        survivalFunctionEstimate: 0.3083916083916084,
        standardError: 0.15893348873798227,
        low95ConfidenceInterval: 0.11231173743871747,
        high95ConfidenceInterval: 0.8467982625436375,
    },
    {
        survivalFunctionEstimate: 0.1541958041958042,
        standardError: 0.13491899968648588,
        low95ConfidenceInterval: 0.0277513466677814,
        high95ConfidenceInterval: 0.8567636848843272,
    },
    {
        survivalFunctionEstimate: 0.1541958041958042,
    },
];

// data from lung dataset: https://rdrr.io/cran/survival/man/lung.html
const largeExamplePatientSurvivalsFromRSurvivalPackage = [
    {
        patientId: '57',
        studyId: '1',
        uniquePatientKey: '57',
        months: 5,
        status: true,
    },
    {
        patientId: '73',
        studyId: '1',
        uniquePatientKey: '73',
        months: 11,
        status: true,
    },
    {
        patientId: '79',
        studyId: '1',
        uniquePatientKey: '79',
        months: 11,
        status: true,
    },
    {
        patientId: '108',
        studyId: '1',
        uniquePatientKey: '108',
        months: 11,
        status: true,
    },
    {
        patientId: '30',
        studyId: '1',
        uniquePatientKey: '30',
        months: 12,
        status: true,
    },
    {
        patientId: '116',
        studyId: '1',
        uniquePatientKey: '116',
        months: 13,
        status: true,
    },
    {
        patientId: '215',
        studyId: '1',
        uniquePatientKey: '215',
        months: 13,
        status: true,
    },
    {
        patientId: '111',
        studyId: '1',
        uniquePatientKey: '111',
        months: 15,
        status: true,
    },
    {
        patientId: '32',
        studyId: '1',
        uniquePatientKey: '32',
        months: 26,
        status: true,
    },
    {
        patientId: '96',
        studyId: '1',
        uniquePatientKey: '96',
        months: 30,
        status: true,
    },
    {
        patientId: '149',
        studyId: '1',
        uniquePatientKey: '149',
        months: 31,
        status: true,
    },
    {
        patientId: '35',
        studyId: '1',
        uniquePatientKey: '35',
        months: 53,
        status: true,
    },
    {
        patientId: '53',
        studyId: '1',
        uniquePatientKey: '53',
        months: 53,
        status: true,
    },
    {
        patientId: '124',
        studyId: '1',
        uniquePatientKey: '124',
        months: 54,
        status: true,
    },
    {
        patientId: '202',
        studyId: '1',
        uniquePatientKey: '202',
        months: 59,
        status: true,
    },
    {
        patientId: '64',
        studyId: '1',
        uniquePatientKey: '64',
        months: 60,
        status: true,
    },
    {
        patientId: '128',
        studyId: '1',
        uniquePatientKey: '128',
        months: 60,
        status: true,
    },
    {
        patientId: '19',
        studyId: '1',
        uniquePatientKey: '19',
        months: 61,
        status: true,
    },
    {
        patientId: '144',
        studyId: '1',
        uniquePatientKey: '144',
        months: 62,
        status: true,
    },
    {
        patientId: '56',
        studyId: '1',
        uniquePatientKey: '56',
        months: 65,
        status: true,
    },
    {
        patientId: '66',
        studyId: '1',
        uniquePatientKey: '66',
        months: 65,
        status: true,
    },
    {
        patientId: '14',
        studyId: '1',
        uniquePatientKey: '14',
        months: 71,
        status: true,
    },
    {
        patientId: '201',
        studyId: '1',
        uniquePatientKey: '201',
        months: 79,
        status: true,
    },
    {
        patientId: '22',
        studyId: '1',
        uniquePatientKey: '22',
        months: 81,
        status: true,
    },
    {
        patientId: '192',
        studyId: '1',
        uniquePatientKey: '192',
        months: 81,
        status: true,
    },
    {
        patientId: '20',
        studyId: '1',
        uniquePatientKey: '20',
        months: 88,
        status: true,
    },
    {
        patientId: '93',
        studyId: '1',
        uniquePatientKey: '93',
        months: 88,
        status: true,
    },
    {
        patientId: '127',
        studyId: '1',
        uniquePatientKey: '127',
        months: 92,
        status: true,
    },
    {
        patientId: '214',
        studyId: '1',
        uniquePatientKey: '214',
        months: 92,
        status: false,
    },
    {
        patientId: '39',
        studyId: '1',
        uniquePatientKey: '39',
        months: 93,
        status: true,
    },
    {
        patientId: '46',
        studyId: '1',
        uniquePatientKey: '46',
        months: 95,
        status: true,
    },
    {
        patientId: '82',
        studyId: '1',
        uniquePatientKey: '82',
        months: 95,
        status: true,
    },
    {
        patientId: '206',
        studyId: '1',
        uniquePatientKey: '206',
        months: 105,
        status: true,
    },
    {
        patientId: '226',
        studyId: '1',
        uniquePatientKey: '226',
        months: 105,
        status: false,
    },
    {
        patientId: '34',
        studyId: '1',
        uniquePatientKey: '34',
        months: 107,
        status: true,
    },
    {
        patientId: '104',
        studyId: '1',
        uniquePatientKey: '104',
        months: 107,
        status: true,
    },
    {
        patientId: '189',
        studyId: '1',
        uniquePatientKey: '189',
        months: 110,
        status: true,
    },
    {
        patientId: '223',
        studyId: '1',
        uniquePatientKey: '223',
        months: 116,
        status: true,
    },
    {
        patientId: '28',
        studyId: '1',
        uniquePatientKey: '28',
        months: 118,
        status: true,
    },
    {
        patientId: '36',
        studyId: '1',
        uniquePatientKey: '36',
        months: 122,
        status: true,
    },
    {
        patientId: '193',
        studyId: '1',
        uniquePatientKey: '193',
        months: 131,
        status: true,
    },
    {
        patientId: '58',
        studyId: '1',
        uniquePatientKey: '58',
        months: 132,
        status: true,
    },
    {
        patientId: '74',
        studyId: '1',
        uniquePatientKey: '74',
        months: 132,
        status: true,
    },
    {
        patientId: '200',
        studyId: '1',
        uniquePatientKey: '200',
        months: 135,
        status: true,
    },
    {
        patientId: '164',
        studyId: '1',
        uniquePatientKey: '164',
        months: 142,
        status: true,
    },
    {
        patientId: '16',
        studyId: '1',
        uniquePatientKey: '16',
        months: 144,
        status: true,
    },
    {
        patientId: '44',
        studyId: '1',
        uniquePatientKey: '44',
        months: 145,
        status: true,
    },
    {
        patientId: '179',
        studyId: '1',
        uniquePatientKey: '179',
        months: 145,
        status: true,
    },
    {
        patientId: '88',
        studyId: '1',
        uniquePatientKey: '88',
        months: 147,
        status: true,
    },
    {
        patientId: '42',
        studyId: '1',
        uniquePatientKey: '42',
        months: 153,
        status: true,
    },
    {
        patientId: '106',
        studyId: '1',
        uniquePatientKey: '106',
        months: 156,
        status: true,
    },
    {
        patientId: '155',
        studyId: '1',
        uniquePatientKey: '155',
        months: 156,
        status: true,
    },
    {
        patientId: '65',
        studyId: '1',
        uniquePatientKey: '65',
        months: 163,
        status: true,
    },
    {
        patientId: '90',
        studyId: '1',
        uniquePatientKey: '90',
        months: 163,
        status: true,
    },
    {
        patientId: '148',
        studyId: '1',
        uniquePatientKey: '148',
        months: 163,
        status: true,
    },
    {
        patientId: '10',
        studyId: '1',
        uniquePatientKey: '10',
        months: 166,
        status: true,
    },
    {
        patientId: '100',
        studyId: '1',
        uniquePatientKey: '100',
        months: 166,
        status: true,
    },
    {
        patientId: '84',
        studyId: '1',
        uniquePatientKey: '84',
        months: 167,
        status: true,
    },
    {
        patientId: '11',
        studyId: '1',
        uniquePatientKey: '11',
        months: 170,
        status: true,
    },
    {
        patientId: '210',
        studyId: '1',
        uniquePatientKey: '210',
        months: 173,
        status: false,
    },
    {
        patientId: '227',
        studyId: '1',
        uniquePatientKey: '227',
        months: 174,
        status: false,
    },
    {
        patientId: '63',
        studyId: '1',
        uniquePatientKey: '63',
        months: 175,
        status: true,
    },
    {
        patientId: '220',
        studyId: '1',
        uniquePatientKey: '220',
        months: 175,
        status: false,
    },
    {
        patientId: '80',
        studyId: '1',
        uniquePatientKey: '80',
        months: 176,
        status: true,
    },
    {
        patientId: '105',
        studyId: '1',
        uniquePatientKey: '105',
        months: 177,
        status: true,
    },
    {
        patientId: '228',
        studyId: '1',
        uniquePatientKey: '228',
        months: 177,
        status: false,
    },
    {
        patientId: '97',
        studyId: '1',
        uniquePatientKey: '97',
        months: 179,
        status: true,
    },
    {
        patientId: '159',
        studyId: '1',
        uniquePatientKey: '159',
        months: 179,
        status: true,
    },
    {
        patientId: '177',
        studyId: '1',
        uniquePatientKey: '177',
        months: 180,
        status: true,
    },
    {
        patientId: '112',
        studyId: '1',
        uniquePatientKey: '112',
        months: 181,
        status: true,
    },
    {
        patientId: '169',
        studyId: '1',
        uniquePatientKey: '169',
        months: 181,
        status: true,
    },
    {
        patientId: '154',
        studyId: '1',
        uniquePatientKey: '154',
        months: 182,
        status: true,
    },
    {
        patientId: '218',
        studyId: '1',
        uniquePatientKey: '218',
        months: 183,
        status: true,
    },
    {
        patientId: '213',
        studyId: '1',
        uniquePatientKey: '213',
        months: 185,
        status: false,
    },
    {
        patientId: '178',
        studyId: '1',
        uniquePatientKey: '178',
        months: 186,
        status: true,
    },
    {
        patientId: '224',
        studyId: '1',
        uniquePatientKey: '224',
        months: 188,
        status: false,
    },
    {
        patientId: '52',
        studyId: '1',
        uniquePatientKey: '52',
        months: 189,
        status: true,
    },
    {
        patientId: '225',
        studyId: '1',
        uniquePatientKey: '225',
        months: 191,
        status: false,
    },
    {
        patientId: '217',
        studyId: '1',
        uniquePatientKey: '217',
        months: 192,
        status: false,
    },
    {
        patientId: '167',
        studyId: '1',
        uniquePatientKey: '167',
        months: 194,
        status: true,
    },
    {
        patientId: '83',
        studyId: '1',
        uniquePatientKey: '83',
        months: 196,
        status: false,
    },
    {
        patientId: '173',
        studyId: '1',
        uniquePatientKey: '173',
        months: 197,
        status: true,
    },
    {
        patientId: '221',
        studyId: '1',
        uniquePatientKey: '221',
        months: 197,
        status: false,
    },
    {
        patientId: '122',
        studyId: '1',
        uniquePatientKey: '122',
        months: 199,
        status: true,
    },
    {
        patientId: '114',
        studyId: '1',
        uniquePatientKey: '114',
        months: 201,
        status: true,
    },
    {
        patientId: '141',
        studyId: '1',
        uniquePatientKey: '141',
        months: 201,
        status: true,
    },
    {
        patientId: '132',
        studyId: '1',
        uniquePatientKey: '132',
        months: 202,
        status: true,
    },
    {
        patientId: '204',
        studyId: '1',
        uniquePatientKey: '204',
        months: 202,
        status: false,
    },
    {
        patientId: '222',
        studyId: '1',
        uniquePatientKey: '222',
        months: 203,
        status: false,
    },
    {
        patientId: '126',
        studyId: '1',
        uniquePatientKey: '126',
        months: 207,
        status: true,
    },
    {
        patientId: '67',
        studyId: '1',
        uniquePatientKey: '67',
        months: 208,
        status: true,
    },
    {
        patientId: '4',
        studyId: '1',
        uniquePatientKey: '4',
        months: 210,
        status: true,
    },
    {
        patientId: '219',
        studyId: '1',
        uniquePatientKey: '219',
        months: 211,
        status: false,
    },
    {
        patientId: '117',
        studyId: '1',
        uniquePatientKey: '117',
        months: 212,
        status: true,
    },
    {
        patientId: '9',
        studyId: '1',
        uniquePatientKey: '9',
        months: 218,
        status: true,
    },
    {
        patientId: '212',
        studyId: '1',
        uniquePatientKey: '212',
        months: 221,
        status: false,
    },
    {
        patientId: '143',
        studyId: '1',
        uniquePatientKey: '143',
        months: 222,
        status: true,
    },
    {
        patientId: '216',
        studyId: '1',
        uniquePatientKey: '216',
        months: 222,
        status: false,
    },
    {
        patientId: '62',
        studyId: '1',
        uniquePatientKey: '62',
        months: 223,
        status: true,
    },
    {
        patientId: '207',
        studyId: '1',
        uniquePatientKey: '207',
        months: 224,
        status: false,
    },
    {
        patientId: '194',
        studyId: '1',
        uniquePatientKey: '194',
        months: 225,
        status: false,
    },
    {
        patientId: '196',
        studyId: '1',
        uniquePatientKey: '196',
        months: 225,
        status: false,
    },
    {
        patientId: '75',
        studyId: '1',
        uniquePatientKey: '75',
        months: 226,
        status: true,
    },
    {
        patientId: '151',
        studyId: '1',
        uniquePatientKey: '151',
        months: 229,
        status: true,
    },
    {
        patientId: '70',
        studyId: '1',
        uniquePatientKey: '70',
        months: 230,
        status: true,
    },
    {
        patientId: '205',
        studyId: '1',
        uniquePatientKey: '205',
        months: 235,
        status: false,
    },
    {
        patientId: '209',
        studyId: '1',
        uniquePatientKey: '209',
        months: 237,
        status: false,
    },
    {
        patientId: '92',
        studyId: '1',
        uniquePatientKey: '92',
        months: 239,
        status: true,
    },
    {
        patientId: '208',
        studyId: '1',
        uniquePatientKey: '208',
        months: 239,
        status: true,
    },
    {
        patientId: '203',
        studyId: '1',
        uniquePatientKey: '203',
        months: 240,
        status: false,
    },
    {
        patientId: '197',
        studyId: '1',
        uniquePatientKey: '197',
        months: 243,
        status: false,
    },
    {
        patientId: '94',
        studyId: '1',
        uniquePatientKey: '94',
        months: 245,
        status: true,
    },
    {
        patientId: '54',
        studyId: '1',
        uniquePatientKey: '54',
        months: 246,
        status: true,
    },
    {
        patientId: '211',
        studyId: '1',
        uniquePatientKey: '211',
        months: 252,
        status: false,
    },
    {
        patientId: '188',
        studyId: '1',
        uniquePatientKey: '188',
        months: 259,
        status: false,
    },
    {
        patientId: '166',
        studyId: '1',
        uniquePatientKey: '166',
        months: 266,
        status: false,
    },
    {
        patientId: '135',
        studyId: '1',
        uniquePatientKey: '135',
        months: 267,
        status: true,
    },
    {
        patientId: '162',
        studyId: '1',
        uniquePatientKey: '162',
        months: 268,
        status: true,
    },
    {
        patientId: '180',
        studyId: '1',
        uniquePatientKey: '180',
        months: 269,
        status: false,
    },
    {
        patientId: '195',
        studyId: '1',
        uniquePatientKey: '195',
        months: 269,
        status: true,
    },
    {
        patientId: '191',
        studyId: '1',
        uniquePatientKey: '191',
        months: 270,
        status: true,
    },
    {
        patientId: '184',
        studyId: '1',
        uniquePatientKey: '184',
        months: 272,
        status: false,
    },
    {
        patientId: '199',
        studyId: '1',
        uniquePatientKey: '199',
        months: 276,
        status: false,
    },
    {
        patientId: '198',
        studyId: '1',
        uniquePatientKey: '198',
        months: 279,
        status: false,
    },
    {
        patientId: '113',
        studyId: '1',
        uniquePatientKey: '113',
        months: 283,
        status: true,
    },
    {
        patientId: '86',
        studyId: '1',
        uniquePatientKey: '86',
        months: 284,
        status: true,
    },
    {
        patientId: '182',
        studyId: '1',
        uniquePatientKey: '182',
        months: 284,
        status: false,
    },
    {
        patientId: '170',
        studyId: '1',
        uniquePatientKey: '170',
        months: 285,
        status: true,
    },
    {
        patientId: '187',
        studyId: '1',
        uniquePatientKey: '187',
        months: 285,
        status: true,
    },
    {
        patientId: '190',
        studyId: '1',
        uniquePatientKey: '190',
        months: 286,
        status: true,
    },
    {
        patientId: '119',
        studyId: '1',
        uniquePatientKey: '119',
        months: 288,
        status: true,
    },
    {
        patientId: '158',
        studyId: '1',
        uniquePatientKey: '158',
        months: 291,
        status: true,
    },
    {
        patientId: '163',
        studyId: '1',
        uniquePatientKey: '163',
        months: 292,
        status: false,
    },
    {
        patientId: '185',
        studyId: '1',
        uniquePatientKey: '185',
        months: 292,
        status: false,
    },
    {
        patientId: '131',
        studyId: '1',
        uniquePatientKey: '131',
        months: 293,
        status: true,
    },
    {
        patientId: '176',
        studyId: '1',
        uniquePatientKey: '176',
        months: 296,
        status: false,
    },
    {
        patientId: '181',
        studyId: '1',
        uniquePatientKey: '181',
        months: 300,
        status: false,
    },
    {
        patientId: '21',
        studyId: '1',
        uniquePatientKey: '21',
        months: 301,
        status: true,
    },
    {
        patientId: '171',
        studyId: '1',
        uniquePatientKey: '171',
        months: 301,
        status: false,
    },
    {
        patientId: '47',
        studyId: '1',
        uniquePatientKey: '47',
        months: 303,
        status: true,
    },
    {
        patientId: '175',
        studyId: '1',
        uniquePatientKey: '175',
        months: 303,
        status: false,
    },
    {
        patientId: '72',
        studyId: '1',
        uniquePatientKey: '72',
        months: 305,
        status: true,
    },
    {
        patientId: '1',
        studyId: '1',
        uniquePatientKey: '1',
        months: 306,
        status: true,
    },
    {
        patientId: '7',
        studyId: '1',
        uniquePatientKey: '7',
        months: 310,
        status: true,
    },
    {
        patientId: '98',
        studyId: '1',
        uniquePatientKey: '98',
        months: 310,
        status: true,
    },
    {
        patientId: '153',
        studyId: '1',
        uniquePatientKey: '153',
        months: 315,
        status: false,
    },
    {
        patientId: '168',
        studyId: '1',
        uniquePatientKey: '168',
        months: 320,
        status: true,
    },
    {
        patientId: '156',
        studyId: '1',
        uniquePatientKey: '156',
        months: 329,
        status: true,
    },
    {
        patientId: '186',
        studyId: '1',
        uniquePatientKey: '186',
        months: 332,
        status: false,
    },
    {
        patientId: '140',
        studyId: '1',
        uniquePatientKey: '140',
        months: 337,
        status: true,
    },
    {
        patientId: '150',
        studyId: '1',
        uniquePatientKey: '150',
        months: 340,
        status: true,
    },
    {
        patientId: '60',
        studyId: '1',
        uniquePatientKey: '60',
        months: 345,
        status: true,
    },
    {
        patientId: '172',
        studyId: '1',
        uniquePatientKey: '172',
        months: 348,
        status: true,
    },
    {
        patientId: '183',
        studyId: '1',
        uniquePatientKey: '183',
        months: 350,
        status: true,
    },
    {
        patientId: '110',
        studyId: '1',
        uniquePatientKey: '110',
        months: 351,
        status: true,
    },
    {
        patientId: '133',
        studyId: '1',
        uniquePatientKey: '133',
        months: 353,
        status: true,
    },
    {
        patientId: '147',
        studyId: '1',
        uniquePatientKey: '147',
        months: 353,
        status: true,
    },
    {
        patientId: '146',
        studyId: '1',
        uniquePatientKey: '146',
        months: 356,
        status: false,
    },
    {
        patientId: '8',
        studyId: '1',
        uniquePatientKey: '8',
        months: 361,
        status: true,
    },
    {
        patientId: '78',
        studyId: '1',
        uniquePatientKey: '78',
        months: 363,
        status: true,
    },
    {
        patientId: '120',
        studyId: '1',
        uniquePatientKey: '120',
        months: 363,
        status: true,
    },
    {
        patientId: '103',
        studyId: '1',
        uniquePatientKey: '103',
        months: 364,
        status: true,
    },
    {
        patientId: '157',
        studyId: '1',
        uniquePatientKey: '157',
        months: 364,
        status: false,
    },
    {
        patientId: '24',
        studyId: '1',
        uniquePatientKey: '24',
        months: 371,
        status: true,
    },
    {
        patientId: '137',
        studyId: '1',
        uniquePatientKey: '137',
        months: 371,
        status: true,
    },
    {
        patientId: '160',
        studyId: '1',
        uniquePatientKey: '160',
        months: 376,
        status: false,
    },
    {
        patientId: '174',
        studyId: '1',
        uniquePatientKey: '174',
        months: 382,
        status: false,
    },
    {
        patientId: '161',
        studyId: '1',
        uniquePatientKey: '161',
        months: 384,
        status: false,
    },
    {
        patientId: '138',
        studyId: '1',
        uniquePatientKey: '138',
        months: 387,
        status: true,
    },
    {
        patientId: '29',
        studyId: '1',
        uniquePatientKey: '29',
        months: 390,
        status: true,
    },
    {
        patientId: '25',
        studyId: '1',
        uniquePatientKey: '25',
        months: 394,
        status: true,
    },
    {
        patientId: '142',
        studyId: '1',
        uniquePatientKey: '142',
        months: 404,
        status: false,
    },
    {
        patientId: '165',
        studyId: '1',
        uniquePatientKey: '165',
        months: 413,
        status: false,
    },
    {
        patientId: '76',
        studyId: '1',
        uniquePatientKey: '76',
        months: 426,
        status: true,
    },
    {
        patientId: '69',
        studyId: '1',
        uniquePatientKey: '69',
        months: 428,
        status: true,
    },
    {
        patientId: '109',
        studyId: '1',
        uniquePatientKey: '109',
        months: 429,
        status: true,
    },
    {
        patientId: '43',
        studyId: '1',
        uniquePatientKey: '43',
        months: 433,
        status: true,
    },
    {
        patientId: '121',
        studyId: '1',
        uniquePatientKey: '121',
        months: 442,
        status: true,
    },
    {
        patientId: '61',
        studyId: '1',
        uniquePatientKey: '61',
        months: 444,
        status: true,
    },
    {
        patientId: '152',
        studyId: '1',
        uniquePatientKey: '152',
        months: 444,
        status: false,
    },
    {
        patientId: '102',
        studyId: '1',
        uniquePatientKey: '102',
        months: 450,
        status: true,
    },
    {
        patientId: '2',
        studyId: '1',
        uniquePatientKey: '2',
        months: 455,
        status: true,
    },
    {
        patientId: '139',
        studyId: '1',
        uniquePatientKey: '139',
        months: 457,
        status: true,
    },
    {
        patientId: '145',
        studyId: '1',
        uniquePatientKey: '145',
        months: 458,
        status: false,
    },
    {
        patientId: '41',
        studyId: '1',
        uniquePatientKey: '41',
        months: 460,
        status: true,
    },
    {
        patientId: '31',
        studyId: '1',
        uniquePatientKey: '31',
        months: 473,
        status: true,
    },
    {
        patientId: '99',
        studyId: '1',
        uniquePatientKey: '99',
        months: 477,
        status: true,
    },
    {
        patientId: '134',
        studyId: '1',
        uniquePatientKey: '134',
        months: 511,
        status: false,
    },
    {
        patientId: '136',
        studyId: '1',
        uniquePatientKey: '136',
        months: 511,
        status: false,
    },
    {
        patientId: '48',
        studyId: '1',
        uniquePatientKey: '48',
        months: 519,
        status: true,
    },
    {
        patientId: '26',
        studyId: '1',
        uniquePatientKey: '26',
        months: 520,
        status: true,
    },
    {
        patientId: '115',
        studyId: '1',
        uniquePatientKey: '115',
        months: 524,
        status: true,
    },
    {
        patientId: '118',
        studyId: '1',
        uniquePatientKey: '118',
        months: 524,
        status: true,
    },
    {
        patientId: '107',
        studyId: '1',
        uniquePatientKey: '107',
        months: 529,
        status: false,
    },
    {
        patientId: '33',
        studyId: '1',
        uniquePatientKey: '33',
        months: 533,
        status: true,
    },
    {
        patientId: '130',
        studyId: '1',
        uniquePatientKey: '130',
        months: 543,
        status: false,
    },
    {
        patientId: '123',
        studyId: '1',
        uniquePatientKey: '123',
        months: 550,
        status: true,
    },
    {
        patientId: '129',
        studyId: '1',
        uniquePatientKey: '129',
        months: 551,
        status: false,
    },
    {
        patientId: '125',
        studyId: '1',
        uniquePatientKey: '125',
        months: 558,
        status: true,
    },
    {
        patientId: '101',
        studyId: '1',
        uniquePatientKey: '101',
        months: 559,
        status: false,
    },
    {
        patientId: '15',
        studyId: '1',
        uniquePatientKey: '15',
        months: 567,
        status: true,
    },
    {
        patientId: '27',
        studyId: '1',
        uniquePatientKey: '27',
        months: 574,
        status: true,
    },
    {
        patientId: '45',
        studyId: '1',
        uniquePatientKey: '45',
        months: 583,
        status: true,
    },
    {
        patientId: '95',
        studyId: '1',
        uniquePatientKey: '95',
        months: 588,
        status: false,
    },
    {
        patientId: '17',
        studyId: '1',
        uniquePatientKey: '17',
        months: 613,
        status: true,
    },
    {
        patientId: '23',
        studyId: '1',
        uniquePatientKey: '23',
        months: 624,
        status: true,
    },
    {
        patientId: '87',
        studyId: '1',
        uniquePatientKey: '87',
        months: 641,
        status: true,
    },
    {
        patientId: '49',
        studyId: '1',
        uniquePatientKey: '49',
        months: 643,
        status: true,
    },
    {
        patientId: '12',
        studyId: '1',
        uniquePatientKey: '12',
        months: 654,
        status: true,
    },
    {
        patientId: '91',
        studyId: '1',
        uniquePatientKey: '91',
        months: 655,
        status: true,
    },
    {
        patientId: '59',
        studyId: '1',
        uniquePatientKey: '59',
        months: 687,
        status: true,
    },
    {
        patientId: '55',
        studyId: '1',
        uniquePatientKey: '55',
        months: 689,
        status: true,
    },
    {
        patientId: '77',
        studyId: '1',
        uniquePatientKey: '77',
        months: 705,
        status: true,
    },
    {
        patientId: '18',
        studyId: '1',
        uniquePatientKey: '18',
        months: 707,
        status: true,
    },
    {
        patientId: '13',
        studyId: '1',
        uniquePatientKey: '13',
        months: 728,
        status: true,
    },
    {
        patientId: '40',
        studyId: '1',
        uniquePatientKey: '40',
        months: 731,
        status: true,
    },
    {
        patientId: '51',
        studyId: '1',
        uniquePatientKey: '51',
        months: 735,
        status: true,
    },
    {
        patientId: '89',
        studyId: '1',
        uniquePatientKey: '89',
        months: 740,
        status: false,
    },
    {
        patientId: '50',
        studyId: '1',
        uniquePatientKey: '50',
        months: 765,
        status: true,
    },
    {
        patientId: '81',
        studyId: '1',
        uniquePatientKey: '81',
        months: 791,
        status: true,
    },
    {
        patientId: '85',
        studyId: '1',
        uniquePatientKey: '85',
        months: 806,
        status: false,
    },
    {
        patientId: '37',
        studyId: '1',
        uniquePatientKey: '37',
        months: 814,
        status: true,
    },
    {
        patientId: '68',
        studyId: '1',
        uniquePatientKey: '68',
        months: 821,
        status: false,
    },
    {
        patientId: '71',
        studyId: '1',
        uniquePatientKey: '71',
        months: 840,
        status: false,
    },
    {
        patientId: '5',
        studyId: '1',
        uniquePatientKey: '5',
        months: 883,
        status: true,
    },
    {
        patientId: '38',
        studyId: '1',
        uniquePatientKey: '38',
        months: 965,
        status: false,
    },
    {
        patientId: '3',
        studyId: '1',
        uniquePatientKey: '3',
        months: 1010,
        status: false,
    },
    {
        patientId: '6',
        studyId: '1',
        uniquePatientKey: '6',
        months: 1022,
        status: false,
    },
];

// ground truth from R survival package
/*
library(survival)
summary(survfit(Surv(time, status) ~ 1, data=lung))
*/
const largeExampleSurvivalSummaries = [
    {
        survivalFunctionEstimate: 0.9956140350877193,
        standardError: 0.004376335998553152,
        low95ConfidenceInterval: 0.9870734167405145,
        high95ConfidenceInterval: 1,
    },
    {
        survivalFunctionEstimate: 0.9912280701754386,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.9868421052631579,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.9824561403508771,
        standardError: 0.008694642592690387,
        low95ConfidenceInterval: 0.9655618970753633,
        high95ConfidenceInterval: 0.9996459788199428,
    },
    {
        survivalFunctionEstimate: 0.9780701754385964,
        standardError: 0.00969918321667634,
        low95ConfidenceInterval: 0.9592436769100913,
        high95ConfidenceInterval: 0.9972661703269686,
    },
    {
        survivalFunctionEstimate: 0.9736842105263157,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.9692982456140351,
        standardError: 0.011424649532723746,
        low95ConfidenceInterval: 0.9471630031311906,
        high95ConfidenceInterval: 0.9919507897209449,
    },
    {
        survivalFunctionEstimate: 0.9649122807017544,
        standardError: 0.012185800489276179,
        low95ConfidenceInterval: 0.9413217146007166,
        high95ConfidenceInterval: 0.9890940525514066,
    },
    {
        survivalFunctionEstimate: 0.9605263157894737,
        standardError: 0.012895584798847694,
        low95ConfidenceInterval: 0.9355810726270365,
        high95ConfidenceInterval: 0.9861366698382243,
    },
    {
        survivalFunctionEstimate: 0.956140350877193,
        standardError: 0.01356206983336428,
        low95ConfidenceInterval: 0.9299252668892969,
        high95ConfidenceInterval: 0.9830944519162026,
    },
    {
        survivalFunctionEstimate: 0.9517543859649122,
        standardError: 0.014191357445529183,
        low95ConfidenceInterval: 0.9243423391699586,
        high95ConfidenceInterval: 0.979979357017088,
    },
    {
        survivalFunctionEstimate: 0.9473684210526315,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.9429824561403508,
        standardError: 0.015356372406043017,
        low95ConfidenceInterval: 0.9133597795943134,
        high95ConfidenceInterval: 0.9735658745379081,
    },
    {
        survivalFunctionEstimate: 0.9385964912280701,
        standardError: 0.015898956972633615,
        low95ConfidenceInterval: 0.9079467094428935,
        high95ConfidenceInterval: 0.9702809252827124,
    },
    {
        survivalFunctionEstimate: 0.9342105263157895,
        standardError: 0.016418488032799494,
        low95ConfidenceInterval: 0.9025787990057462,
        high95ConfidenceInterval: 0.9669508174140794,
    },
    {
        survivalFunctionEstimate: 0.9298245614035088,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.9254385964912281,
        standardError: 0.017396561544658157,
        low95ConfidenceInterval: 0.8919624428310942,
        high95ConfidenceInterval: 0.9601711403423211,
    },
    {
        survivalFunctionEstimate: 0.9210526315789473,
        standardError: 0.017858444540481477,
        low95ConfidenceInterval: 0.8867074506937553,
        high95ConfidenceInterval: 0.9567281175710984,
    },
    {
        survivalFunctionEstimate: 0.9166666666666666,
        standardError: 0.018304070212790808,
        low95ConfidenceInterval: 0.8814842999075682,
        high95ConfidenceInterval: 0.9532532546137108,
    },
    {
        survivalFunctionEstimate: 0.9122807017543859,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.9078947368421052,
        standardError: 0.01915104821194575,
        low95ConfidenceInterval: 0.8711247066201793,
        high95ConfidenceInterval: 0.9462168239764874,
    },
    {
        survivalFunctionEstimate: 0.9035087719298245,
        standardError: 0.019554318293626145,
        low95ConfidenceInterval: 0.8659845059869966,
        high95ConfidenceInterval: 0.942659014463242,
    },
    {
        survivalFunctionEstimate: 0.8991228070175438,
        standardError: 0.019945208381001268,
        low95ConfidenceInterval: 0.8608685484842601,
        high95ConfidenceInterval: 0.9390769630537713,
    },
    {
        survivalFunctionEstimate: 0.894736842105263,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.8903508771929823,
        standardError: 0.020692632882034462,
        low95ConfidenceInterval: 0.850703906610012,
        high95ConfidenceInterval: 0.9318455908792737,
    },
    {
        survivalFunctionEstimate: 0.8859649122807016,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.8815789473684209,
        standardError: 0.02139821960592849,
        low95ConfidenceInterval: 0.8406211828565318,
        high95ConfidenceInterval: 0.9245323057435421,
    },
    {
        survivalFunctionEstimate: 0.8771929824561402,
        standardError: 0.021736606481725963,
        low95ConfidenceInterval: 0.8356080266650664,
        high95ConfidenceInterval: 0.9208474594736283,
    },
    {
        survivalFunctionEstimate: 0.8771929824561402,
    },
    {
        survivalFunctionEstimate: 0.8727849775191746,
        standardError: 0.022069805522652957,
        low95ConfidenceInterval: 0.8305833667271929,
        high95ConfidenceInterval: 0.9171308353846988,
    },
    {
        survivalFunctionEstimate: 0.868376972582209,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.8639689676452434,
        standardError: 0.022710230434161833,
        low95ConfidenceInterval: 0.8205848920812573,
        high95ConfidenceInterval: 0.9096467461895121,
    },
    {
        survivalFunctionEstimate: 0.859560962708278,
        standardError: 0.023018178956455825,
        low95ConfidenceInterval: 0.8156096611974171,
        high95ConfidenceInterval: 0.9058806973022666,
    },
    {
        survivalFunctionEstimate: 0.859560962708278,
    },
    {
        survivalFunctionEstimate: 0.8551302360963796,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.8506995094844813,
        standardError: 0.023618347014532283,
        low95ConfidenceInterval: 0.8056453359016672,
        high95ConfidenceInterval: 0.8982732515011627,
    },
    {
        survivalFunctionEstimate: 0.8462687828725829,
        standardError: 0.02390731788957698,
        low95ConfidenceInterval: 0.8006849239055442,
        high95ConfidenceInterval: 0.8944477802471132,
    },
    {
        survivalFunctionEstimate: 0.8418380562606846,
        standardError: 0.024189236295403024,
        low95ConfidenceInterval: 0.7957383140762694,
        high95ConfidenceInterval: 0.8906085083906636,
    },
    {
        survivalFunctionEstimate: 0.8374073296487863,
        standardError: 0.024464346043651622,
        low95ConfidenceInterval: 0.7908050285896571,
        high95ConfidenceInterval: 0.8867559137808481,
    },
    {
        survivalFunctionEstimate: 0.8329766030368879,
        standardError: 0.024732874338405486,
        low95ConfidenceInterval: 0.7858846221620299,
        high95ConfidenceInterval: 0.8828904417267226,
    },
    {
        survivalFunctionEstimate: 0.8285458764249896,
        standardError: 0.02499503329948401,
        low95ConfidenceInterval: 0.7809766790650879,
        high95ConfidenceInterval: 0.8790125079825091,
    },
    {
        survivalFunctionEstimate: 0.8241151498130912,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.8196844232011928,
        standardError: 0.025501024206286953,
        low95ConfidenceInterval: 0.7711966521914113,
        high95ConfidenceInterval: 0.8712207862021563,
    },
    {
        survivalFunctionEstimate: 0.8152536965892946,
        standardError: 0.02574521634972202,
        low95ConfidenceInterval: 0.7663238624353613,
        high95ConfidenceInterval: 0.8673077042000258,
    },
    {
        survivalFunctionEstimate: 0.8108229699773962,
        standardError: 0.025983761566129887,
        low95ConfidenceInterval: 0.7614621201100749,
        high95ConfidenceInterval: 0.8633835765171467,
    },
    {
        survivalFunctionEstimate: 0.8063922433654979,
        standardError: 0.026216813999113575,
        low95ConfidenceInterval: 0.7566111230778935,
        high95ConfidenceInterval: 0.8594487053200444,
    },
    {
        survivalFunctionEstimate: 0.8019615167535995,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.7975307901417011,
        standardError: 0.026667013167259244,
        low95ConfidenceInterval: 0.7469402423914959,
        high95ConfidenceInterval: 0.8515478550031967,
    },
    {
        survivalFunctionEstimate: 0.7931000635298028,
        standardError: 0.026884426256158216,
        low95ConfidenceInterval: 0.7421198366144994,
        high95ConfidenceInterval: 0.8475823980672283,
    },
    {
        survivalFunctionEstimate: 0.7886693369179044,
        standardError: 0.027096880445726126,
        low95ConfidenceInterval: 0.7373091295792802,
        high95ConfidenceInterval: 0.843607244290396,
    },
    {
        survivalFunctionEstimate: 0.7842386103060061,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.7798078836941078,
        standardError: 0.02750736905168702,
        low95ConfidenceInterval: 0.7277159159467492,
        high95ConfidenceInterval: 0.8356287421312647,
    },
    {
        survivalFunctionEstimate: 0.7753771570822094,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.7709464304703111,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.7665157038584127,
        standardError: 0.028088614549899322,
        low95ConfidenceInterval: 0.71339353405228,
        high95ConfidenceInterval: 0.8235935654254198,
    },
    {
        survivalFunctionEstimate: 0.7620849772465144,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.757654250634616,
        standardError: 0.028454215832805715,
        low95ConfidenceInterval: 0.703888089637702,
        high95ConfidenceInterval: 0.8155273145766189,
    },
    {
        survivalFunctionEstimate: 0.7532235240227176,
        standardError: 0.0286307024133906,
        low95ConfidenceInterval: 0.6991477110928089,
        high95ConfidenceInterval: 0.8114818487418157,
    },
    {
        survivalFunctionEstimate: 0.7487927974108193,
        standardError: 0.028803083404654848,
        low95ConfidenceInterval: 0.6944153581040133,
        high95ConfidenceInterval: 0.8074283595702632,
    },
    {
        survivalFunctionEstimate: 0.7487927974108193,
    },
    {
        survivalFunctionEstimate: 0.7487927974108193,
    },
    {
        survivalFunctionEstimate: 0.7443090082047664,
        standardError: 0.0289775050803304,
        low95ConfidenceInterval: 0.6896269426384071,
        high95ConfidenceInterval: 0.8033269372789578,
    },
    {
        survivalFunctionEstimate: 0.7443090082047664,
    },
    {
        survivalFunctionEstimate: 0.7397980445186769,
        standardError: 0.02915088300448111,
        low95ConfidenceInterval: 0.6848139057644397,
        high95ConfidenceInterval: 0.7991968943193706,
    },
    {
        survivalFunctionEstimate: 0.7352870808325874,
        standardError: 0.029320081732531107,
        low95ConfidenceInterval: 0.6800090367596312,
        high95ConfidenceInterval: 0.7950586860074556,
    },
    {
        survivalFunctionEstimate: 0.7352870808325874,
    },
    {
        survivalFunctionEstimate: 0.7307482716916455,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.7262094625507035,
        standardError: 0.029652399306138524,
        low95ConfidenceInterval: 0.6703565535202378,
        high95ConfidenceInterval: 0.7867159360623157,
    },
    {
        survivalFunctionEstimate: 0.7216706534097617,
        standardError: 0.029812419468637323,
        low95ConfidenceInterval: 0.665542307130596,
        high95ConfidenceInterval: 0.7825325699252303,
    },
    {
        survivalFunctionEstimate: 0.7171318442688198,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.7125930351278779,
        standardError: 0.030120508671315792,
        low95ConfidenceInterval: 0.6559371648215311,
        high95ConfidenceInterval: 0.7741424955710832,
    },
    {
        survivalFunctionEstimate: 0.708054225986936,
        standardError: 0.030268699355940832,
        low95ConfidenceInterval: 0.6511460301448384,
        high95ConfidenceInterval: 0.7699360262189463,
    },
    {
        survivalFunctionEstimate: 0.7035154168459942,
        standardError: 0.03041306399374996,
        low95ConfidenceInterval: 0.6463623694859835,
        high95ConfidenceInterval: 0.7657220857915765,
    },
    {
        survivalFunctionEstimate: 0.7035154168459942,
    },
    {
        survivalFunctionEstimate: 0.6989471349184229,
        standardError: 0.030556746434366584,
        low95ConfidenceInterval: 0.6415511474681542,
        high95ConfidenceInterval: 0.7614780198564322,
    },
    {
        survivalFunctionEstimate: 0.6989471349184229,
    },
    {
        survivalFunctionEstimate: 0.6943487985044859,
        standardError: 0.03069975624822632,
        low95ConfidenceInterval: 0.6367117813051313,
        high95ConfidenceInterval: 0.7572032874849175,
    },
    {
        survivalFunctionEstimate: 0.6943487985044859,
    },
    {
        survivalFunctionEstimate: 0.6943487985044859,
    },
    {
        survivalFunctionEstimate: 0.6896887394541202,
        standardError: 0.03084537596468369,
        low95ConfidenceInterval: 0.6318068386265672,
        high95ConfidenceInterval: 0.7528733914369057,
    },
    {
        survivalFunctionEstimate: 0.6896887394541202,
    },
    {
        survivalFunctionEstimate: 0.6849969793217793,
        standardError: 0.030990311251877862,
        low95ConfidenceInterval: 0.6268721795556091,
        high95ConfidenceInterval: 0.7485112228342844,
    },
    {
        survivalFunctionEstimate: 0.6849969793217793,
    },
    {
        survivalFunctionEstimate: 0.6802728622230084,
        standardError: 0.031134571657969453,
        low95ConfidenceInterval: 0.6219071502619764,
        high95ConfidenceInterval: 0.7441161705282586,
    },
    {
        survivalFunctionEstimate: 0.6755487451242376,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.6708246280254667,
        standardError: 0.03141077002867532,
        low95ConfidenceInterval: 0.6120011509890957,
        high95ConfidenceInterval: 0.7353020183674845,
    },
    {
        survivalFunctionEstimate: 0.6661005109266959,
        standardError: 0.0315428158924731,
        low95ConfidenceInterval: 0.6070599689817391,
        high95ConfidenceInterval: 0.7308831307078855,
    },
    {
        survivalFunctionEstimate: 0.6661005109266959,
    },
    {
        survivalFunctionEstimate: 0.6661005109266959,
    },
    {
        survivalFunctionEstimate: 0.6613084209200291,
        standardError: 0.03167781291272837,
        low95ConfidenceInterval: 0.6020464948312763,
        high95ConfidenceInterval: 0.7264037434555679,
    },
    {
        survivalFunctionEstimate: 0.6565163309133621,
        standardError: 0.03180866233964095,
        low95ConfidenceInterval: 0.5970411161533592,
        high95ConfidenceInterval: 0.7219162652195477,
    },
    {
        survivalFunctionEstimate: 0.6517242409066952,
        standardError: 0.03193541515522963,
        low95ConfidenceInterval: 0.592043732696558,
        high95ConfidenceInterval: 0.7174207963503666,
    },
    {
        survivalFunctionEstimate: 0.6517242409066952,
    },
    {
        survivalFunctionEstimate: 0.646896653937016,
        standardError: 0.03206166662641572,
        low95ConfidenceInterval: 0.5870126010017608,
        high95ConfidenceInterval: 0.7128897747011944,
    },
    {
        survivalFunctionEstimate: 0.6420690669673368,
        standardError: 0.03218379785658331,
        low95ConfidenceInterval: 0.581989509110171,
        high95ConfidenceInterval: 0.7083507181884041,
    },
    {
        survivalFunctionEstimate: 0.6420690669673368,
    },
    {
        survivalFunctionEstimate: 0.6372049073690994,
        standardError: 0.03230546711091228,
        low95ConfidenceInterval: 0.5769315524532485,
        high95ConfidenceInterval: 0.7037751571199863,
    },
    {
        survivalFunctionEstimate: 0.6372049073690994,
    },
    {
        survivalFunctionEstimate: 0.6323033311585678,
        standardError: 0.03242667957372857,
        low95ConfidenceInterval: 0.5718379060086294,
        high95ConfidenceInterval: 0.6991622947573333,
    },
    {
        survivalFunctionEstimate: 0.6323033311585678,
    },
    {
        survivalFunctionEstimate: 0.6323033311585678,
    },
    {
        survivalFunctionEstimate: 0.6323033311585678,
    },
    {
        survivalFunctionEstimate: 0.6272850507525475,
        standardError: 0.03255531817285409,
        low95ConfidenceInterval: 0.5666157347189651,
        high95ConfidenceInterval: 0.6944504199001655,
    },
    {
        survivalFunctionEstimate: 0.6222667703465271,
        standardError: 0.0326793614521676,
        low95ConfidenceInterval: 0.5614025265382906,
        high95ConfidenceInterval: 0.6897295882602112,
    },
    {
        survivalFunctionEstimate: 0.6172484899405067,
        standardError: 0.03279886154936215,
        low95ConfidenceInterval: 0.5561981787765651,
        high95ConfidenceInterval: 0.6849999026819695,
    },
    {
        survivalFunctionEstimate: 0.6172484899405067,
    },
    {
        survivalFunctionEstimate: 0.6172484899405067,
    },
    {
        survivalFunctionEstimate: 0.6121472627509158,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.6070460355613249,
        standardError: 0.033040604156857036,
        low95ConfidenceInterval: 0.54562216612668,
        high95ConfidenceInterval: 0.675384748216339,
    },
    {
        survivalFunctionEstimate: 0.6070460355613249,
    },
    {
        survivalFunctionEstimate: 0.6070460355613249,
    },
    {
        survivalFunctionEstimate: 0.6018576079069545,
        standardError: 0.03316307807140852,
        low95ConfidenceInterval: 0.5402459575191962,
        high95ConfidenceInterval: 0.6704956791511215,
    },
    {
        survivalFunctionEstimate: 0.5966691802525843,
        standardError: 0.033280584455718375,
        low95ConfidenceInterval: 0.5348794322420494,
        high95ConfidenceInterval: 0.665596934941001,
    },
    {
        survivalFunctionEstimate: 0.5966691802525843,
    },
    {
        survivalFunctionEstimate: 0.5966691802525843,
    },
    {
        survivalFunctionEstimate: 0.5966691802525843,
    },
    {
        survivalFunctionEstimate: 0.5913417768574719,
        standardError: 0.03340710850358679,
        low95ConfidenceInterval: 0.5293598558707564,
        high95ConfidenceInterval: 0.6605810644287464,
    },
    {
        survivalFunctionEstimate: 0.5860143734623595,
        standardError: 0.03352823111588733,
        low95ConfidenceInterval: 0.523850805819741,
        high95ConfidenceInterval: 0.6555546771892367,
    },
    {
        survivalFunctionEstimate: 0.5860143734623595,
    },
    {
        survivalFunctionEstimate: 0.5806380948067416,
        standardError: 0.0340641763582798,
        low95ConfidenceInterval: 0.51756900333426,
        high95ConfidenceInterval: 0.6513925582268074,
    },
    {
        survivalFunctionEstimate: 0.5752618161511236,
        standardError: 0.03417039705046685,
        low95ConfidenceInterval: 0.5120406090447435,
        high95ConfidenceInterval: 0.6462888905215171,
    },
    {
        survivalFunctionEstimate: 0.5752618161511236,
    },
    {
        survivalFunctionEstimate: 0.5752618161511236,
    },
    {
        survivalFunctionEstimate: 0.5752618161511236,
    },
    {
        survivalFunctionEstimate: 0.5697304525342859,
        standardError: 0.034286609981947755,
        low95ConfidenceInterval: 0.5063417974224839,
        high95ConfidenceInterval: 0.641054699014087,
    },
    {
        survivalFunctionEstimate: 0.5641990889174482,
        standardError: 0.03439701636125355,
        low95ConfidenceInterval: 0.5006542932252256,
        high95ConfidenceInterval: 0.6358092125499423,
    },
    {
        survivalFunctionEstimate: 0.5641990889174482,
    },
    {
        survivalFunctionEstimate: 0.5586129593242061,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.553026829730964,
        standardError: 0.034611196314734916,
        low95ConfidenceInterval: 0.4891856784392937,
        high95ConfidenceInterval: 0.6251995671214936,
    },
    {
        survivalFunctionEstimate: 0.547440700137722,
        standardError: 0.03470945223208895,
        low95ConfidenceInterval: 0.483468566398266,
        high95ConfidenceInterval: 0.6198775701177707,
    },
    {
        survivalFunctionEstimate: 0.5418545705444798,
        standardError: 0.03480188628291547,
        low95ConfidenceInterval: 0.47776278387099064,
        high95ConfidenceInterval: 0.6145442582217218,
    },
    {
        survivalFunctionEstimate: 0.5362684409512378,
        standardError: 0.034888544740775115,
        low95ConfidenceInterval: 0.4720682387892846,
        high95ConfidenceInterval: 0.6091997239590589,
    },
    {
        survivalFunctionEstimate: 0.5362684409512378,
    },
    {
        survivalFunctionEstimate: 0.5362684409512378,
    },
    {
        survivalFunctionEstimate: 0.530563457536863,
        standardError: 0.03498072048846268,
        low95ConfidenceInterval: 0.4662475248413137,
        high95ConfidenceInterval: 0.6037513712684643,
    },
    {
        survivalFunctionEstimate: 0.530563457536863,
    },
    {
        survivalFunctionEstimate: 0.530563457536863,
    },
    {
        survivalFunctionEstimate: 0.5247330898716227,
        standardError: 0.035078836686232934,
        low95ConfidenceInterval: 0.46029359503730805,
        high95ConfidenceInterval: 0.598193888802435,
    },
    {
        survivalFunctionEstimate: 0.5247330898716227,
    },
    {
        survivalFunctionEstimate: 0.5188372124573348,
        standardError: 0.03517667812489946,
        low95ConfidenceInterval: 0.4542766852783454,
        high95ConfidenceInterval: 0.5925729005122894,
    },
    {
        survivalFunctionEstimate: 0.5188372124573348,
    },
    {
        survivalFunctionEstimate: 0.5128735663371355,
        standardError: 0.03527424698955214,
        low95ConfidenceInterval: 0.44819464188879476,
        high95ConfidenceInterval: 0.5868862999764218,
    },
    {
        survivalFunctionEstimate: 0.5069099202169363,
        standardError: 0.035364610763165584,
        low95ConfidenceInterval: 0.44212660287839234,
        high95ConfidenceInterval: 0.5811857181663808,
    },
    {
        survivalFunctionEstimate: 0.500946274096737,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.49498262797653775,
        standardError: 0.03552393858864977,
        low95ConfidenceInterval: 0.4300321061475445,
        high95ConfidenceInterval: 0.5697430459168952,
    },
    {
        survivalFunctionEstimate: 0.49498262797653775,
    },
    {
        survivalFunctionEstimate: 0.48894625446462875,
        standardError: 0.03559988847679714,
        low95ConfidenceInterval: 0.42392169321299583,
        high95ConfidenceInterval: 0.5639448124087191,
    },
    {
        survivalFunctionEstimate: 0.48290988095271975,
        standardError: 0.035668480992451054,
        low95ConfidenceInterval: 0.4178255668801072,
        high95ConfidenceInterval: 0.5581323202959622,
    },
    {
        survivalFunctionEstimate: 0.48290988095271975,
    },
    {
        survivalFunctionEstimate: 0.4767970976495208,
        standardError: 0.03573694024429006,
        low95ConfidenceInterval: 0.4116558259833424,
        high95ConfidenceInterval: 0.5522464592453157,
    },
    {
        survivalFunctionEstimate: 0.4706843143463218,
        standardError: 0.03579775113174463,
        low95ConfidenceInterval: 0.40550092885053435,
        high95ConfidenceInterval: 0.5463457861851828,
    },
    {
        survivalFunctionEstimate: 0.4645715310431228,
        standardError: 0.035850952574623986,
        low95ConfidenceInterval: 0.3993607958328751,
        high95ConfidenceInterval: 0.5404303820199483,
    },
    {
        survivalFunctionEstimate: 0.45845874773992384,
        standardError: 0.035896578406260406,
        low95ConfidenceInterval: 0.39323535709118235,
        high95ConfidenceInterval: 0.534500317911449,
    },
    {
        survivalFunctionEstimate: 0.45234596443672487,
        standardError: 0.03593465748267141,
        low95ConfidenceInterval: 0.38712455237337096,
        high95ConfidenceInterval: 0.5285556555060436,
    },
    {
        survivalFunctionEstimate: 0.4462331811335259,
        standardError: 0.0359652137748168,
        low95ConfidenceInterval: 0.38102833082440773,
        high95ConfidenceInterval: 0.5225964471295707,
    },
    {
        survivalFunctionEstimate: 0.44012039783032686,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.4340076145271279,
        standardError: 0.036003829905507795,
        low95ConfidenceInterval: 0.36887947987416225,
        high95ConfidenceInterval: 0.5106345561205659,
    },
    {
        survivalFunctionEstimate: 0.4340076145271279,
    },
    {
        survivalFunctionEstimate: 0.42780750574816895,
        standardError: 0.03601938436694314,
        low95ConfidenceInterval: 0.3627281195629838,
        high95ConfidenceInterval: 0.5045632034124399,
    },
    {
        survivalFunctionEstimate: 0.42160739696921,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.4154072881902511,
        standardError: 0.036026780573364725,
        low95ConfidenceInterval: 0.35047130229413515,
        high95ConfidenceInterval: 0.49237473639640134,
    },
    {
        survivalFunctionEstimate: 0.4092071794112921,
        standardError: 0.03601862718761365,
        low95ConfidenceInterval: 0.34436582502401003,
        high95ConfidenceInterval: 0.4862576467048387,
    },
    {
        survivalFunctionEstimate: 0.4092071794112921,
    },
    {
        survivalFunctionEstimate: 0.40291168434342606,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.39661618927556,
        standardError: 0.035993900915061945,
        low95ConfidenceInterval: 0.33198754473203423,
        high95ConfidenceInterval: 0.4738262145419824,
    },
    {
        survivalFunctionEstimate: 0.39661618927556,
    },
    {
        survivalFunctionEstimate: 0.39661618927556,
    },
    {
        survivalFunctionEstimate: 0.39661618927556,
    },
    {
        survivalFunctionEstimate: 0.3900059194543007,
        standardError: 0.03599587231429703,
        low95ConfidenceInterval: 0.3254684907078876,
        high95ConfidenceInterval: 0.46734053081012517,
    },
    {
        survivalFunctionEstimate: 0.38339564963304135,
        standardError: 0.03598760867397732,
        low95ConfidenceInterval: 0.3189692057694926,
        high95ConfidenceInterval: 0.4608351574345007,
    },
    {
        survivalFunctionEstimate: 0.376785379811782,
        standardError: 0.03596910293982536,
        low95ConfidenceInterval: 0.3124896941513302,
        high95ConfidenceInterval: 0.4543100943711697,
    },
    {
        survivalFunctionEstimate: 0.376785379811782,
    },
    {
        survivalFunctionEstimate: 0.376785379811782,
    },
    {
        survivalFunctionEstimate: 0.3699347365424769,
        standardError: 0.03596158595281959,
        low95ConfidenceInterval: 0.3057590225558742,
        high95ConfidenceInterval: 0.4475802812188268,
    },
    {
        survivalFunctionEstimate: 0.36308409327317176,
        standardError: 0.03594222806552212,
        low95ConfidenceInterval: 0.29905118729308694,
        high95ConfidenceInterval: 0.4408277391615919,
    },
    {
        survivalFunctionEstimate: 0.35623345000386664,
        standardError: 0.03591101012936947,
        low95ConfidenceInterval: 0.29236621241730587,
        high95ConfidenceInterval: 0.4340524503581308,
    },
    {
        survivalFunctionEstimate: 0.3493828067345615,
        standardError: 0.03586790117688856,
        low95ConfidenceInterval: 0.28570414426005464,
        high95ConfidenceInterval: 0.42725437517843806,
    },
    {
        survivalFunctionEstimate: 0.3425321634652564,
        standardError: 0.03581285826744505,
        low95ConfidenceInterval: 0.2790650516588571,
        high95ConfidenceInterval: 0.4204334520239998,
    },
    {
        survivalFunctionEstimate: 0.33568152019595127,
        standardError: 0.035745826271872165,
        low95ConfidenceInterval: 0.2724490262978897,
        high95ConfidenceInterval: 0.41358959704213,
    },
    {
        survivalFunctionEstimate: 0.33568152019595127,
    },
    {
        survivalFunctionEstimate: 0.32868815519186895,
        standardError: 0.03567865980311079,
        low95ConfidenceInterval: 0.2656973753783507,
        high95ConfidenceInterval: 0.4066126103413402,
    },
    {
        survivalFunctionEstimate: 0.32169479018778663,
        standardError: 0.0355983259012103,
        low95ConfidenceInterval: 0.25897102459813587,
        high95ConfidenceInterval: 0.3996104899942114,
    },
    {
        survivalFunctionEstimate: 0.3147014251837043,
        standardError: 0.035504735187392486,
        low95ConfidenceInterval: 0.25227012706238167,
        high95ConfidenceInterval: 0.3925830940266845,
    },
    {
        survivalFunctionEstimate: 0.3147014251837043,
    },
    {
        survivalFunctionEstimate: 0.30754912006589286,
        standardError: 0.035410885621767876,
        low95ConfidenceInterval: 0.2454189134111102,
        high95ConfidenceInterval: 0.38540819832764783,
    },
    {
        survivalFunctionEstimate: 0.3003968149480814,
        standardError: 0.035302300636550175,
        low95ConfidenceInterval: 0.23859594694971395,
        high95ConfidenceInterval: 0.37820527793781133,
    },
    {
        survivalFunctionEstimate: 0.29324450983026995,
        standardError: 0.03517884378249515,
        low95ConfidenceInterval: 0.23180146455344525,
        high95ConfidenceInterval: 0.37097411231311905,
    },
    {
        survivalFunctionEstimate: 0.29324450983026995,
    },
    {
        survivalFunctionEstimate: 0.29324450983026995,
    },
    {
        survivalFunctionEstimate: 0.285725419834622,
        standardError: 0.03507117892971781,
        low95ConfidenceInterval: 0.2246304904641109,
        high95ConfidenceInterval: 0.3634369286689263,
    },
    {
        survivalFunctionEstimate: 0.2782063298389741,
        standardError: 0.0349449867726937,
        low95ConfidenceInterval: 0.21749493244679674,
        high95ConfidenceInterval: 0.35586466816372925,
    },
    {
        survivalFunctionEstimate: 0.27068723984332616,
        high95ConfidenceInterval: undefined,
        low95ConfidenceInterval: undefined,
        standardError: undefined,
    },
    {
        survivalFunctionEstimate: 0.2631681498476782,
        standardError: 0.03463618080446745,
        low95ConfidenceInterval: 0.20333150952710005,
        high95ConfidenceInterval: 0.3406135883972246,
    },
    {
        survivalFunctionEstimate: 0.2631681498476782,
    },
    {
        survivalFunctionEstimate: 0.2554279101462759,
        standardError: 0.03447148786841091,
        low95ConfidenceInterval: 0.19606213694096514,
        high95ConfidenceInterval: 0.33276908178012454,
    },
    {
        survivalFunctionEstimate: 0.2554279101462759,
    },
    {
        survivalFunctionEstimate: 0.2474457879542048,
        standardError: 0.034305967342543195,
        low95ConfidenceInterval: 0.1885685220104134,
        high95ConfidenceInterval: 0.32470646385453444,
    },
    {
        survivalFunctionEstimate: 0.2474457879542048,
    },
    {
        survivalFunctionEstimate: 0.23919759502239799,
        standardError: 0.03413959624884593,
        low95ConfidenceInterval: 0.18082923427967496,
        high95ConfidenceInterval: 0.31640619224216937,
    },
    {
        survivalFunctionEstimate: 0.23919759502239799,
    },
    {
        survivalFunctionEstimate: 0.23065482377159807,
        standardError: 0.033972346769089494,
        low95ConfidenceInterval: 0.17281921448594678,
        high95ConfidenceInterval: 0.30784567495782245,
    },
    {
        survivalFunctionEstimate: 0.22211205252079813,
        standardError: 0.03377112851933526,
        low95ConfidenceInterval: 0.16487347737786245,
        high95ConfidenceInterval: 0.2992219528550189,
    },
    {
        survivalFunctionEstimate: 0.21356928126999822,
        standardError: 0.0335353300482461,
        low95ConfidenceInterval: 0.1569930415979048,
        high95ConfidenceInterval: 0.2905341372963905,
    },
    {
        survivalFunctionEstimate: 0.21356928126999822,
    },
    {
        survivalFunctionEstimate: 0.20467056121708163,
        standardError: 0.033297753351091634,
        low95ConfidenceInterval: 0.14879002553329113,
        high95ConfidenceInterval: 0.2815379490578987,
    },
    {
        survivalFunctionEstimate: 0.19577184116416504,
        standardError: 0.033017698057252826,
        low95ConfidenceInterval: 0.14066683191526544,
        high95ConfidenceInterval: 0.272463759018147,
    },
    {
        survivalFunctionEstimate: 0.18687312111124846,
        standardError: 0.032694072578284675,
        low95ConfidenceInterval: 0.13262527727993964,
        high95ConfidenceInterval: 0.263310012314986,
    },
    {
        survivalFunctionEstimate: 0.17797440105833184,
        standardError: 0.032325568339826916,
        low95ConfidenceInterval: 0.12466755190264477,
        high95ConfidenceInterval: 0.2540748330151495,
    },
    {
        survivalFunctionEstimate: 0.16907568100541526,
        standardError: 0.031910630598844976,
        low95ConfidenceInterval: 0.11679626581635763,
        high95ConfidenceInterval: 0.2447559920485172,
    },
    {
        survivalFunctionEstimate: 0.16017696095249864,
        standardError: 0.031447421387508195,
        low95ConfidenceInterval: 0.10901450708250404,
        high95ConfidenceInterval: 0.23535086757362378,
    },
    {
        survivalFunctionEstimate: 0.15127824089958206,
        standardError: 0.030933772298501215,
        low95ConfidenceInterval: 0.10132591565734134,
        high95ConfidenceInterval: 0.22585639637408883,
    },
    {
        survivalFunctionEstimate: 0.14237952084666547,
        standardError: 0.030367123921965024,
        low95ConfidenceInterval: 0.09373477747084161,
        high95ConfidenceInterval: 0.21626901459100503,
    },
    {
        survivalFunctionEstimate: 0.13348080079374888,
        standardError: 0.029744447413809622,
        low95ConfidenceInterval: 0.08624614517767774,
        high95ConfidenceInterval: 0.20658458582508232,
    },
    {
        survivalFunctionEstimate: 0.1245820807408323,
        standardError: 0.029062141672599382,
        low95ConfidenceInterval: 0.07886599476473853,
        high95ConfidenceInterval: 0.1967983145082277,
    },
    {
        survivalFunctionEstimate: 0.11568336068791571,
        standardError: 0.028315896511112538,
        low95ConfidenceInterval: 0.07160143132486359,
        high95ConfidenceInterval: 0.18690464272050503,
    },
    {
        survivalFunctionEstimate: 0.10678464063499912,
        standardError: 0.027500507301544075,
        low95ConfidenceInterval: 0.06446096371590061,
        high95ConfidenceInterval: 0.1768971299560812,
    },
    {
        survivalFunctionEstimate: 0.09788592058208252,
        standardError: 0.026609618532421102,
        low95ConfidenceInterval: 0.0574548780755371,
        high95ConfidenceInterval: 0.16676831922964952,
    },
    {
        survivalFunctionEstimate: 0.09788592058208252,
    },
    {
        survivalFunctionEstimate: 0.08809732852387427,
        standardError: 0.025686047531120866,
        low95ConfidenceInterval: 0.049748804035295344,
        high95ConfidenceInterval: 0.1560065501783144,
    },
    {
        survivalFunctionEstimate: 0.07830873646566601,
        standardError: 0.024626660475457245,
        low95ConfidenceInterval: 0.04227882925118524,
        high95ConfidenceInterval: 0.14504323595188523,
    },
    {
        survivalFunctionEstimate: 0.07830873646566601,
    },
    {
        survivalFunctionEstimate: 0.067121774113428,
        standardError: 0.02351257932638617,
        low95ConfidenceInterval: 0.03378234442961183,
        high95ConfidenceInterval: 0.1333635257174429,
    },
    {
        survivalFunctionEstimate: 0.067121774113428,
    },
    {
        survivalFunctionEstimate: 0.067121774113428,
    },
    {
        survivalFunctionEstimate: 0.050341330585070995,
        standardError: 0.02285083682728731,
        low95ConfidenceInterval: 0.02067992578572794,
        high95ConfidenceInterval: 0.12254635685512923,
    },
    {
        survivalFunctionEstimate: 0.050341330585070995,
    },
    {
        survivalFunctionEstimate: 0.050341330585070995,
    },
    {
        survivalFunctionEstimate: 0.050341330585070995,
    },
];

const examplePatientSurvivals = _.sortBy(
    exampleAlteredPatientSurvivals.concat(exampleUnalteredPatientSurvivals),
    s => s.months
);

const exampleAlteredEstimates = [1, 0.8];
const exampleUnalteredEstimates = [0.8, 0.8, 0.4, 0];
const exampleEstimates = exampleAlteredEstimates.concat(
    exampleUnalteredEstimates
);

const exampleAlteredSurvivalSummaries = [
    {
        survivalFunctionEstimate: 1,
    },
    {
        survivalFunctionEstimate: 0.8,
        high95ConfidenceInterval: 1,
        low95ConfidenceInterval: 0.516125760342172,
        standardError: 0.1788854381999832,
    },
];

const exampleUnalteredSurvivalSummaries = [
    {
        survivalFunctionEstimate: 0.8,
    },
    {
        survivalFunctionEstimate: 0.8,
    },
    {
        survivalFunctionEstimate: 0.4,
        high95ConfidenceInterval: 1,
        low95ConfidenceInterval: 0.09349578484597448,
        standardError: 0.29664793948382656,
    },
    {
        survivalFunctionEstimate: 0,
        high95ConfidenceInterval: NaN,
        low95ConfidenceInterval: NaN,
        standardError: NaN,
    },
];

const exampleSurvivalSummaries = exampleAlteredSurvivalSummaries.concat(
    exampleUnalteredSurvivalSummaries
);

describe('SurvivalUtil', () => {
    describe('#getSurvivalSummaries()', () => {
        it('returns empty list for empty list', () => {
            assert.deepEqual(getSurvivalSummaries([]), []);
        });

        it('returns correct survival summaries for the example data, compare with R survival package result', () => {
            assert.deepEqual(
                getSurvivalSummaries(examplePatientSurvivals),
                exampleSurvivalSummaries
            );
        });

        it('returns correct survival summaries for the example data from cbioportal, compare with R survival package result', () => {
            assert.deepEqual(
                getSurvivalSummaries(cbioExamplePatientSurvivals),
                cbioExampleSurvivalSummaries
            );
        });

        it('returns correct survival summaries for the large example data from R survival package, compare with R survival package result', () => {
            assert.deepEqual(
                getSurvivalSummaries(
                    largeExamplePatientSurvivalsFromRSurvivalPackage
                ),
                largeExampleSurvivalSummaries
            );
        });
    });

    describe('#getMedian()', () => {
        it('returns NA for empty list', () => {
            assert.equal(getMedian([], []), 'NA');
        });

        it('returns 63.83 for the example data', () => {
            assert.equal(
                getMedian(examplePatientSurvivals, exampleSurvivalSummaries),
                '63.83 (63.83 - NA)'
            );
        });
    });

    describe('#getLineData()', () => {
        it('returns [{x: 0, y: 100}] for empty list', () => {
            assert.deepEqual(getLineData([], []), [{ x: 0, y: 100 }]);
        });

        it('returns correct line data for the example data', () => {
            assert.deepEqual(
                getLineData(examplePatientSurvivals, exampleEstimates),
                [
                    { x: 0, y: 100 },
                    { x: 0, y: 100 },
                    { x: 0.09, y: 80 },
                    { x: 0.13, y: 80 },
                    { x: 5.09, y: 80 },
                    { x: 63.83, y: 40 },
                    { x: 182.19, y: 0 },
                ]
            );
        });
    });

    describe('#getScatterData()', () => {
        it('returns empty list for empty list', () => {
            assert.deepEqual(getScatterData([], []), []);
        });

        it('returns correct scatter data for the example data', () => {
            assert.deepEqual(
                getScatterData(examplePatientSurvivals, exampleEstimates),
                [
                    {
                        x: 0,
                        y: 100,
                        patientId: 'TCGA-OR-A5J3',
                        uniquePatientKey: 'TCGA-OR-A5J3',
                        studyId: 'acc_tcga',
                        status: false,
                    },
                    {
                        x: 0.09,
                        y: 80,
                        patientId: 'TCGA-OR-A5J2',
                        uniquePatientKey: 'TCGA-OR-A5J2',
                        studyId: 'acc_tcga',
                        status: true,
                    },
                    {
                        x: 0.13,
                        y: 80,
                        patientId: 'TCGA-2F-A9KP',
                        uniquePatientKey: 'TCGA-2F-A9KP',
                        studyId: 'blca_tcga',
                        status: false,
                    },
                    {
                        x: 5.09,
                        y: 80,
                        patientId: 'TCGA-OR-A5J1',
                        uniquePatientKey: 'TCGA-OR-A5J1',
                        studyId: 'acc_tcga',
                        status: false,
                    },
                    {
                        x: 63.83,
                        y: 40,
                        patientId: 'TCGA-2F-A9KO',
                        uniquePatientKey: 'TCGA-2F-A9KO',
                        studyId: 'blca_tcga',
                        status: true,
                    },
                    {
                        x: 182.19,
                        y: 0,
                        patientId: 'TCGA-2F-A9KQ',
                        uniquePatientKey: 'TCGA-2F-A9KQ',
                        studyId: 'blca_tcga',
                        status: true,
                    },
                ]
            );
        });
    });

    describe('#getScatterDataWithOpacity()', () => {
        it('returns empty list for empty list', () => {
            assert.deepEqual(getScatterDataWithOpacity([], []), []);
        });

        it('returns correct scatter data with opacity for the example data', () => {
            assert.deepEqual(
                getScatterDataWithOpacity(
                    examplePatientSurvivals,
                    exampleEstimates
                ),
                [
                    {
                        x: 0,
                        y: 100,
                        patientId: 'TCGA-OR-A5J3',
                        uniquePatientKey: 'TCGA-OR-A5J3',
                        studyId: 'acc_tcga',
                        status: false,
                        opacity: 1,
                    },
                    {
                        x: 0.09,
                        y: 80,
                        patientId: 'TCGA-OR-A5J2',
                        uniquePatientKey: 'TCGA-OR-A5J2',
                        studyId: 'acc_tcga',
                        status: true,
                        opacity: 0,
                    },
                    {
                        x: 0.13,
                        y: 80,
                        patientId: 'TCGA-2F-A9KP',
                        uniquePatientKey: 'TCGA-2F-A9KP',
                        studyId: 'blca_tcga',
                        status: false,
                        opacity: 1,
                    },
                    {
                        x: 5.09,
                        y: 80,
                        patientId: 'TCGA-OR-A5J1',
                        uniquePatientKey: 'TCGA-OR-A5J1',
                        studyId: 'acc_tcga',
                        status: false,
                        opacity: 1,
                    },
                    {
                        x: 63.83,
                        y: 40,
                        patientId: 'TCGA-2F-A9KO',
                        uniquePatientKey: 'TCGA-2F-A9KO',
                        studyId: 'blca_tcga',
                        status: true,
                        opacity: 0,
                    },
                    {
                        x: 182.19,
                        y: 0,
                        patientId: 'TCGA-2F-A9KQ',
                        uniquePatientKey: 'TCGA-2F-A9KQ',
                        studyId: 'blca_tcga',
                        status: true,
                        opacity: 0,
                    },
                ]
            );
        });
    });

    describe('#getStats()', () => {
        it('returns [0, 0, "NA"] for empty list', () => {
            assert.deepEqual(getStats([], []), [0, 0, 'NA']);
        });

        it('returns correct stats for the example data', () => {
            assert.deepEqual(
                getStats(examplePatientSurvivals, exampleSurvivalSummaries),
                [6, 3, '63.83 (63.83 - NA)']
            );
        });
    });

    describe('#getDownloadContent()', () => {
        it('returns correct download content for the example data', () => {
            const data = [];
            data.push({
                scatterData: getScatterData(
                    exampleAlteredPatientSurvivals,
                    exampleAlteredEstimates
                ),
                title: 'test_altered_title',
            });
            data.push({
                scatterData: getScatterData(
                    exampleUnalteredPatientSurvivals,
                    exampleUnalteredEstimates
                ),
                title: 'test_unaltered_title',
            });

            const targetDownloadContent =
                'test_main_title\n\ntest_altered_title\nCase ID\tStudy ID\t' +
                'Number at Risk\tStatus\tSurvival Rate\tTime (months)\nTCGA-OR-A5J2\tacc_tcga\t2\t' +
                'deceased\t1\t0.09\nTCGA-OR-A5J1\tacc_tcga\t1\tcensored\t0.8\t5.09\n\ntest_unaltered_title\nCase ID\tStudy ID\tNumber at Risk\tStatus\tSurvival Rate\tTime (months)\nTCGA-OR-A5J3\t' +
                'acc_tcga\t4\tcensored\t0.8\t0\nTCGA-2F-A9KP\tblca_tcga\t3\tcensored\t' +
                '0.8\t0.13\nTCGA-2F-A9KO\tblca_tcga\t2\tdeceased\t0.4\t63.83\nTCGA-2F-A9KQ\tblca_tcga\t1\tdeceased\t0\t182.19';

            assert.equal(
                getDownloadContent(data, 'test_main_title'),
                targetDownloadContent
            );
        });
    });

    describe('#convertScatterDataToDownloadData()', () => {
        it('returns empty list for empty list', () => {
            assert.deepEqual(
                convertScatterDataToDownloadData(getScatterData([], [])),
                []
            );
        });

        it('returns correct download data for the example data', () => {
            assert.deepEqual(
                convertScatterDataToDownloadData(
                    getScatterData(examplePatientSurvivals, exampleEstimates)
                ),
                [
                    {
                        'Time (months)': 0,
                        'Survival Rate': 1,
                        'Case ID': 'TCGA-OR-A5J3',
                        'Study ID': 'acc_tcga',
                        Status: 'censored',
                        'Number at Risk': 6,
                    },
                    {
                        'Time (months)': 0.09,
                        'Survival Rate': 0.8,
                        'Case ID': 'TCGA-OR-A5J2',
                        'Study ID': 'acc_tcga',
                        Status: 'deceased',
                        'Number at Risk': 5,
                    },
                    {
                        'Time (months)': 0.13,
                        'Survival Rate': 0.8,
                        'Case ID': 'TCGA-2F-A9KP',
                        'Study ID': 'blca_tcga',
                        Status: 'censored',
                        'Number at Risk': 4,
                    },
                    {
                        'Time (months)': 5.09,
                        'Survival Rate': 0.8,
                        'Case ID': 'TCGA-OR-A5J1',
                        'Study ID': 'acc_tcga',
                        Status: 'censored',
                        'Number at Risk': 3,
                    },
                    {
                        'Time (months)': 63.83,
                        'Survival Rate': 0.4,
                        'Case ID': 'TCGA-2F-A9KO',
                        'Study ID': 'blca_tcga',
                        Status: 'deceased',
                        'Number at Risk': 2,
                    },
                    {
                        'Time (months)': 182.19,
                        'Survival Rate': 0,
                        'Case ID': 'TCGA-2F-A9KQ',
                        'Study ID': 'blca_tcga',
                        Status: 'deceased',
                        'Number at Risk': 1,
                    },
                ]
            );
        });
    });

    describe('#downSampling()', () => {
        it('return empty list for empty list', () => {
            assert.deepEqual(
                downSampling([], {
                    xDenominator: 100,
                    yDenominator: 100,
                    threshold: 100,
                }),
                []
            );
        });

        it('when any denominator is 0, return the full data', () => {
            let opts = {
                xDenominator: 0,
                yDenominator: 100,
                threshold: 100,
            };
            assert.deepEqual(
                downSampling(allScatterData, opts),
                allScatterData
            );
        });

        it('when any denominator is negative value, return the full data', () => {
            let opts = {
                xDenominator: -1,
                yDenominator: 100,
                threshold: 100,
            };
            assert.deepEqual(
                downSampling(allScatterData, opts),
                allScatterData
            );
        });

        it('Remove the dot which too close from the last dot', () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 2.5
            assert.deepEqual(
                downSampling(
                    [
                        {
                            x: 0,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 2,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 10,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                    ],
                    {
                        xDenominator: 4,
                        yDenominator: 4,
                        threshold: 100,
                    }
                ),
                [
                    {
                        x: 0,
                        y: 10,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        opacity: 1,
                        status: true,
                    },
                    {
                        x: 10,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                ]
            );
        });

        it('Remove the dot which too close from the last dot, ignore the status', () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 2.5
            assert.deepEqual(
                downSampling(
                    [
                        {
                            x: 0,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 2,
                            y: 10,
                            opacity: 0,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: false,
                        },
                        {
                            x: 10,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                    ],
                    {
                        threshold: 100,
                        xDenominator: 4,
                        yDenominator: 4,
                    }
                ),
                [
                    {
                        x: 0,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                    {
                        x: 10,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                ]
            );
        });

        it('Remove the dot when the distance from last dot equals to the threshold', () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 2
            assert.deepEqual(
                downSampling(
                    [
                        {
                            x: 0,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 2,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 10,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                    ],
                    {
                        threshold: 100,
                        xDenominator: 5,
                        yDenominator: 5,
                    }
                ),
                [
                    {
                        x: 0,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                    {
                        x: 10,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                ]
            );
        });

        it('when a hidden dot between two visualized dots, the distance between two vis dots should be calculated separately from the hidden dot', () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 1.25
            assert.deepEqual(
                downSampling(
                    [
                        {
                            x: 0,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 1,
                            y: 10,
                            opacity: 0,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: false,
                        },
                        {
                            x: 2,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                        {
                            x: 10,
                            y: 10,
                            opacity: 1,
                            patientId: '',
                            uniquePatientKey: '',
                            studyId: '',
                            status: true,
                        },
                    ],
                    {
                        threshold: 100,
                        xDenominator: 8,
                        yDenominator: 8,
                    }
                ),
                [
                    {
                        x: 0,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                    {
                        x: 2,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                    {
                        x: 10,
                        y: 10,
                        opacity: 1,
                        patientId: '',
                        uniquePatientKey: '',
                        studyId: '',
                        status: true,
                    },
                ]
            );
        });
    });

    describe('filterScatterData()', () => {
        it('Return full data if the filers are undefined', () => {
            let testData = {
                altered: {
                    numOfCases: allScatterData.length,
                    line: [],
                    scatter: allScatterData,
                    scatterWithOpacity: allScatterData,
                },
            };
            assert.deepEqual(
                filterScatterData(testData, undefined, {
                    xDenominator: 100,
                    yDenominator: 100,
                    threshold: 100,
                }),
                testData
            );
        });

        it('return correct data after filtering and down sampling', () => {
            let testScatterData = [
                {
                    x: 0,
                    y: 10,
                    patientId: '',
                    uniquePatientKey: '',
                    studyId: '',
                    status: true,
                },
                {
                    x: 0.5,
                    y: 9,
                    patientId: '',
                    uniquePatientKey: '',
                    studyId: '',
                    status: true,
                },
                {
                    x: 1,
                    y: 8,
                    patientId: '',
                    uniquePatientKey: '',
                    studyId: '',
                    status: true,
                },
            ];
            let testData = {
                altered: {
                    numOfCases: testScatterData.length,
                    line: [],
                    scatter: testScatterData,
                    scatterWithOpacity: testScatterData,
                },
            };
            var result = filterScatterData(
                testData,
                { x: [0, 10], y: [9, 10] },
                {
                    xDenominator: 2,
                    yDenominator: 2,
                    threshold: 2,
                }
            );
            assert.deepEqual(result.altered.numOfCases, 2);
            assert.deepEqual(result.altered.scatter[1], {
                x: 0.5,
                y: 9,
                patientId: '',
                uniquePatientKey: '',
                studyId: '',
                status: true,
            });
        });
    });

    describe('parseSurvivalData()', () => {
        it('survival data do not has boolean status', () => {
            let testData = {
                status: undefined,
                label: 'unknown',
            };
            assert.deepEqual(parseSurvivalData('unknown'), testData);
        });

        it('survival data has boolean status', () => {
            let testData1 = {
                status: '0',
                label: 'LIVING',
            };
            assert.deepEqual(parseSurvivalData('0:LIVING'), testData1);

            let testData2 = {
                status: '1',
                label: 'DECEASED',
            };
            assert.deepEqual(parseSurvivalData('1:DECEASED'), testData2);
        });
    });

    describe('getSurvivalStatusBoolean()', () => {
        it('survival data do not has boolean status, return false', () => {
            const survivalStatus = 'unknown';
            const prefix = 'OS';
            assert.equal(
                getSurvivalStatusBoolean(survivalStatus, prefix),
                false
            );
        });

        it('survival data has boolean status, return status', () => {
            const survivalStatus1 = '1:DECEASED';
            const prefix1 = 'OS';
            const survivalStatus2 = '0:Recurred/Progressed';
            const prefix2 = 'DFS';
            const survivalStatus3 = '1:Event';
            const prefix3 = 'EFS';
            assert.equal(
                getSurvivalStatusBoolean(survivalStatus1, prefix1),
                true
            );
            assert.equal(
                getSurvivalStatusBoolean(survivalStatus2, prefix2),
                false
            );
            assert.equal(
                getSurvivalStatusBoolean(survivalStatus3, prefix3),
                true
            );
        });
    });

    describe('isNullSurvivalClinicalDataValue()', () => {
        it('return true for all null values', () => {
            const nullValues = [
                '[not applicable]',
                '[not available]',
                '[pending]',
                '[discrepancy]',
                '[completed]',
                '[null]',
                '',
                'na',
            ];
            const nullValuesIgnoreCaseAndNotTrimmed = [
                '[Not Applicable]  ',
                '  [Not Available]',
                '[Pending]',
                '[Discrepancy]',
                '  [Completed]',
                '[NULL]  ',
                'NA',
            ];
            nullValues.forEach(nullValue => {
                assert.equal(isNullSurvivalClinicalDataValue(nullValue), true);
            });
            nullValuesIgnoreCaseAndNotTrimmed.forEach(nullValue => {
                assert.equal(isNullSurvivalClinicalDataValue(nullValue), true);
            });
        });

        it('return false for not null values', () => {
            const values = [
                'DECEASED',
                'LIVING',
                'Progressed',
                'Recurred/Progressed',
            ];
            values.forEach(value => {
                assert.equal(isNullSurvivalClinicalDataValue(value), false);
            });
        });
    });

    describe('createSurvivalAttributeIdsDict()', () => {
        it('return empty values for empty list', () => {
            const emptyList: string[] = [];
            const emptyDict: {
                [id: string]: string;
            } = {};
            assert.deepEqual(
                createSurvivalAttributeIdsDict(emptyList),
                emptyDict
            );
        });

        it('return attribute ids', () => {
            const prefixList = ['OS', 'DFS', 'PFS'];
            const result = {
                OS_MONTHS: 'OS_MONTHS',
                OS_STATUS: 'OS_STATUS',
                DFS_MONTHS: 'DFS_MONTHS',
                DFS_STATUS: 'DFS_STATUS',
                PFS_MONTHS: 'PFS_MONTHS',
                PFS_STATUS: 'PFS_STATUS',
            };
            assert.deepEqual(
                createSurvivalAttributeIdsDict(prefixList),
                result
            );
        });

        it('do not return months attributes if months get excluded', () => {
            const prefixList = ['OS', 'DFS', 'PFS'];
            const result = {
                OS_STATUS: 'OS_STATUS',
                DFS_STATUS: 'DFS_STATUS',
                PFS_STATUS: 'PFS_STATUS',
            };
            assert.deepEqual(
                createSurvivalAttributeIdsDict(prefixList, true),
                result
            );
        });

        it('do not return status attributes if status get excluded', () => {
            const prefixList = ['OS', 'DFS', 'PFS'];
            const result = {
                OS_MONTHS: 'OS_MONTHS',
                DFS_MONTHS: 'DFS_MONTHS',
                PFS_MONTHS: 'PFS_MONTHS',
            };
            assert.deepEqual(
                createSurvivalAttributeIdsDict(prefixList, false, true),
                result
            );
        });
    });
});
