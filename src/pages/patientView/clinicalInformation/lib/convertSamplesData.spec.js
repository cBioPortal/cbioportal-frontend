import exampleState from "./../mock/exampleState.json";
import convertSampleData from "./convertSamplesData";
import {assert} from "chai";
import {size} from "lodash";

describe('', () => {
    it('api data is properly transformed into table data', () => {

        const result = convertSampleData(exampleState);

        assert.equal(result.columns.length, 4);

        assert.equal(result.items['CANCER_TYPE']['P04_Pri'], 'Glioma');

    });
});

