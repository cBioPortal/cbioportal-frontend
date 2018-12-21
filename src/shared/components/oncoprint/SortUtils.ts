import {TrackSortComparator,TrackSortVector} from "oncoprintjs";
import {ClinicalTrackSpec, GeneticTrackDatum} from "./Oncoprint";
import naturalSort from 'javascript-natural-sort';

/**
 * Make comparator metric
 * @param {(string | string[] | boolean)[]} array_spec
 * @returns {{[p: string]: number}}
 */
function makeComparatorMetric(array_spec: (string | string[] | undefined | boolean)[]) {
    let metric: { [s: string]: number } = {};
    for (let i = 0; i < array_spec.length; i++) {
        const equiv_values = ([] as any[]).concat(array_spec[i]);
        for (let j = 0; j < equiv_values.length; j++) {
            metric[equiv_values[j]] = i;
        }
    }
    return metric;
};

/**
 * Get sign of a number
 * @param {number} x
 * @returns {any | any | any}
 */
function sign(x: number): 0 | -1 | 1 {
    if (x > 0) {
        return 1;
    } else if (x < 0) {
        return -1;
    } else {
        return 0;
    }
};

export function getGeneticTrackSortComparator(sortByMutationType?: boolean, sortByDrivers?: boolean): {
    preferred:TrackSortVector<GeneticTrackDatum>,
    mandatory:TrackSortVector<GeneticTrackDatum>,
    isVector: true
} {
    const cna_order = makeComparatorMetric(['amp', 'homdel', 'gain', 'hetloss', 'diploid', undefined]);
    const mut_order = (function () {
        let _order: { [s: string]: number };
        if (!sortByMutationType && !sortByDrivers) {
            return function (m: any) {
                return (({'true': 1, 'false': 2}) as { [bool: string]: number })[(!!m) + ""];
            }
        } else if (!sortByMutationType && sortByDrivers) {
            _order = makeComparatorMetric([['inframe_rec', 'missense_rec', 'promoter_rec', 'trunc_rec', 'other_rec'], ['inframe', 'missense', 'promoter', 'trunc', 'other'], undefined]);
        } else if (sortByMutationType && !sortByDrivers) {
            _order = makeComparatorMetric([['trunc', 'trunc_rec'], ['inframe', 'inframe_rec'], ['promoter', 'promoter_rec'], ['missense', 'missense_rec'], ['other', 'other_rec'], undefined, true, false]);
        } else if (sortByMutationType && sortByDrivers) {
            _order = makeComparatorMetric(['trunc_rec', 'inframe_rec', 'promoter_rec', 'missense_rec', 'other_rec', 'trunc', 'inframe', 'promoter', 'missense', 'other', undefined, true, false]);
        }
        return function (m: any) {
            return _order[m];
        }
    })();
    const regulation_order = makeComparatorMetric(['up', 'down', undefined]);
    const germline_order = makeComparatorMetric([true, false, undefined]); // germline mutation is prioritized

    function mandatoryHelper(d:GeneticTrackDatum):number[] {
        const vector = [];

        // Test fusion
        if (d.disp_fusion) {
            vector.push(0);
        } else {
            vector.push(1);
        }

        // Next, CNA
        vector.push(cna_order[d.disp_cna+""]);

        // Next, mutation
        // Mutation type
        vector.push(mut_order(d.disp_mut));
        // Germline status
        vector.push(germline_order[d.disp_germ + ""]);

        // Next, mrna expression
        vector.push(regulation_order[d.disp_mrna+""]);

        // Next, protein expression
        vector.push(regulation_order[d.disp_prot+""]);

        return vector;
    }

    function mandatory(d:GeneticTrackDatum):number[] {
        return mandatoryHelper(d);
    }
    function preferred(d:GeneticTrackDatum):(number|string)[] {
        // First, test if not sequenced
        // Last, use sample/patient id
        return [+(!!d.na)].concat(mandatoryHelper(d)).concat(
            [d.sample ? d.sample : d.patient!] as any
        );
    };
    return {
        preferred,
        mandatory,
        isVector: true
    };
}

function makeNumericalComparator(value_key:string) {
    return function (d1:any, d2:any) {
        if (d1.na && d2.na) {
            return 0;
        } else if (d1.na && !d2.na) {
            return 2;
        } else if (!d1.na && d2.na) {
            return -2;
        } else {
            return (d1[value_key] < d2[value_key] ? -1 : (d1[value_key] === d2[value_key] ? 0 : 1));
        }
    };
}
export function stringClinicalComparator(d1:any, d2:any) {
    if (d1.na && d2.na) {
        return 0;
    } else if (d1.na && !d2.na) {
        return 2;
    } else if (!d1.na && d2.na) {
        return -2;
    } else {
        return naturalSort(d1.attr_val, d2.attr_val);
    }
}
function makeCountsMapClinicalComparator(categories:string[]) {
    return function (d1:any, d2:any) {
        if (d1.na && d2.na) {
            return 0;
        } else if (d1.na && !d2.na) {
            return 2;
        } else if (!d1.na && d2.na) {
            return -2;
        } else {
            var d1_total = 0;
            var d2_total = 0;
            for (var i = 0; i < categories.length; i++) {
                d1_total += (d1.attr_val[categories[i]] || 0);
                d2_total += (d2.attr_val[categories[i]] || 0);
            }
            if (d1_total === 0 && d2_total === 0) {
                return 0;
            } else if (d1_total === 0) {
                return 1;
            } else if (d2_total === 0) {
                return -1;
            } else {
                var d1_max_category = 0;
                var d2_max_category = 0;
                for (var i=0; i<categories.length; i++) {
                    if (d1.attr_val[categories[i]] > d1.attr_val[categories[d1_max_category]]) {
                        d1_max_category = i;
                    }
                    if (d2.attr_val[categories[i]] > d2.attr_val[categories[d2_max_category]]) {
                        d2_max_category = i;
                    }
                }
                if (d1_max_category < d2_max_category) {
                    return -1;
                } else if (d1_max_category > d2_max_category) {
                    return 1;
                } else {
                    var cmp_category = categories[d1_max_category];
                    var d1_prop = d1.attr_val[cmp_category]/d1_total;
                    var d2_prop = d2.attr_val[cmp_category]/d2_total;
                    return sign(d1_prop - d2_prop);
                }
            }
        }
    }
}

export function alphabeticalDefault(comparator:(d1:any, d2:any)=>number) {
    return function(d1:any, d2:any) {
        const cmp = comparator(d1, d2);
        if (cmp === 0) {
            if (d1.sample) {
                return naturalSort(d1.sample, d2.sample);
            } else {
                return naturalSort(d1.patient, d2.patient);
            }
        } else {
            return cmp;
        }
    };
}

export function getClinicalTrackSortComparator(track:ClinicalTrackSpec) {
    if (track.datatype === "number") {
        const comparator = makeNumericalComparator("attr_val");
        return {
            preferred: alphabeticalDefault(comparator),
            mandatory: comparator
        };
    } else if (track.datatype === "string") {
        return {
            preferred: alphabeticalDefault(stringClinicalComparator),
            mandatory: stringClinicalComparator
        };
    } else if (track.datatype === "counts") {
        const comparator = makeCountsMapClinicalComparator(track.countsCategoryLabels);
        return {
            preferred: alphabeticalDefault(comparator),
            mandatory: comparator
        };
    }
}

export const heatmapTrackSortComparator = (()=>{
    const comparator = makeNumericalComparator("profile_data");
    return {
        preferred: alphabeticalDefault(comparator),
        mandatory: comparator
    };

})();
