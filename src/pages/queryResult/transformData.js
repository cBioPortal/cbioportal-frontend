import * as _ from 'lodash';

export default function (mutationData, cancerTypes)
{

    let buckets = {};

    _.forEach(mutationData['oncoprint_data'], (data)=>{

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

    // const mmmm = [
    //     {
    //         "typeOfCancer": "Colon Adenocarcinoma",
    //         "caseSetLength": 94,
    //         "alterations": {"all": 33, "mutation": 33, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0}
    //     }, {
    //         "typeOfCancer": "Colorectal Cancer",
    //         "caseSetLength": 23,
    //         "alterations": {"all": 14, "mutation": 14, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0}
    //     }, {
    //         "typeOfCancer": "Rectal Adenocarcinoma",
    //         "caseSetLength": 48,
    //         "alterations": {"all": 24, "mutation": 23, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 1}
    //     }];

    let output = [];
    _.each(buckets,(bucket, key)=>{

        let out = {
            typeOfCancer:key,
            caseSetLength: bucket.length,
        };

        out.alterations = _.reduce(bucket, (memo, item)=>{

            if (item.data.length > 0) memo.all++;
            if (item.data.length === 1) {
                memo.mutation++;
            }
            if (item.data.length > 1) {
                memo.multiple++;
            }
            return memo;

        }, {"all": 0, "mutation": 0, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0});


        output.push(out);


    });

    return output;


}