import Immutable from 'immutable';

export function convertSampleDataToTable(samples) {
    let rv, sampleIds, clinIds;

    // Get union of clinical attribute ids
    clinIds = samples.map(x => x.get('clinicalData'))
        .reduce((a, b) => a.concat(b))
        .map(x => x.get('id'))
        .toSet()
    sampleIds = samples.map(x => x.get('id')).sort()
    // construct rows with first column clinical attribute id and values for
    // each sample
    rv = clinIds.map(x => {
        return Immutable.List([x]).concat(
            sampleIds.map(y => samples.find(z => z.get('id') === y))
                .map(y => {
                    try {
                        return y.get('clinicalData').find(z => z.get('id') === x).get('value');
                    } catch (e) {
                        if (e instanceof TypeError) {
                            return "N/A";
                        } else {
                            throw e;
                        }
                    }
                })
        );
    });
    if (!rv) {
        rv = [];
    }

    return rv;
}