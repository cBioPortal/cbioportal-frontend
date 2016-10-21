import mockData from './mockData/oncoprintData';
import cancerTypes from './mockData/cancerTypes';
import * as _ from 'lodash';

var buckets = {};

_.forEach(mockData['oncoprint_data'], (data)=>{

    let type = _.find(cancerTypes,{ sample_id: data.patient + '-01' })['attr_val'];

    let bucket;
    if (type in buckets) {
        bucket = buckets[type];
    } else {
        buckets[type] = [];
        bucket = buckets[type];
    }

    bucket.push(data);

});



const mmmm = [
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


console.log(_.filter(buckets['Colorectal Cancer'],(item)=>item.data.length === 0).length);

