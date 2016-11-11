import exampleState from './../mock/exampleState';
import convertSampleData from './convertSamplesData';
import { assert } from 'chai';
import { size } from 'lodash';
import {ClinicalData, ClinicalAttribute} from "../../../../shared/api/CBioPortalAPI";
import {ClinicalDataBySampleId} from "../getClinicalInformationData";


// data.forEach((sample: ClinicalDataBySampleId) => {
//     const sampleId = sample.id;
//
//     output.columns.push({ id: sampleId });
//
//     sample.clinicalData.forEach((dataItem) => {
//         output.items[dataItem.attrId] = output.items[dataItem.attrId] || {};
//         output.items[dataItem.attrId][sampleId] = dataItem.attrValue.toString();
//         output.items[dataItem.attrId].clinicalAttribute = dataItem.clinicalAttribute;
//         output.items[dataItem.attrId].id = dataItem.attrId;
//     });
// });


describe('', () => {
    it('api data is properly transformed into table data', () => {

        let d: ClinicalAttribute = {
            attrId: 'attr1',

            datatype: 'blah',

            description: 'blah',

            displayName: 'blah',

            patientAttribute: true

            priority: 'blah'
        };

        var data: Array<ClinicalDataBySampleId> = [
            { id:'s1', clinicalData:[{ attrId:'1', attrValue:'2', clinicalAttribute:d }] }
        ];

        const result = convertSampleData(exampleState.samples);

        assert.true(attr1 in result.items);


    });
});

