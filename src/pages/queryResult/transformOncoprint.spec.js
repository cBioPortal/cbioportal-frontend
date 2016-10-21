import mockData from './mockData/oncoprintData';
import cancerTypes from './mockData/cancerTypes';
import * as _ from 'lodash';

var buckets = {};


console.log(mockData.data.length)

_.forEach(mockData['altered_patients'], (sample_id)=>{

    let type = _.find(cancerTypes,{ sample_id: sample_id + '-01' })['attr_val'];

    let bucket;
    if (type in buckets) {
        bucket = buckets[type];
    } else {
        buckets[type] = [];
        bucket = buckets[type];
    }

    bucket.push({ typeOfCancer: type, caseSetLength });

});

_.forEach(mockData['unaltered_patients'], (sample_id)=>{

    let type = _.find(cancerTypes,{ sample_id: sample_id + '-01' })['attr_val'];

    let bucket;
    if (type in buckets) {
        bucket = buckets[type];
    } else {
        buckets[type] = [];
        bucket = buckets[type];
    }

    bucket.push(sample_id);

});


const mockData = [
    {
        "typeOfCancer": "Colon Adenocarcinoma",
        "caseSetLength": 94,
        "alterations": {"all": 33, "mutation": 33, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0}
    }, {
        "typeOfCancer": "Colorectal Cancer",
        "caseSetLength": 23,
        "alterations": {"all": 14, "mutation": 14, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0}
    }, {
        "typeOfCancer": "Rectal Adenocarcinoma",
        "caseSetLength": 48,
        "alterations": {"all": 24, "mutation": 23, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 1}
    }];

console.log(_.filter(mockData.data, {type:"Colorectal Cancer"}).length);

