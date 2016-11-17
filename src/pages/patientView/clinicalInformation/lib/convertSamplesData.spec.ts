import convertSampleData from './convertSamplesData';
import { assert } from 'chai';
import { size } from 'lodash';
import {ClinicalData, ClinicalAttribute} from "../../../../shared/api/CBioPortalAPI";
import {ClinicalDataBySampleId} from "../getClinicalInformationData";

let exampleState: any = require('./../mock/exampleState');

describe('', () => {
    it('api data is properly transformed into table data', () => {

        const result = convertSampleData(exampleState);

        assert.equal(result.columns.length, 4);

        assert.equal(result.items['CANCER_TYPE']['P04_Pri'], 'Glioma');

    });
});

