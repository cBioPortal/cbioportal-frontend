import {TrackSortComparator} from "oncoprintjs";
import {ClinicalTrackSpec, GeneticTrackDatum} from "./Oncoprint";
function makeComparatorMetric(array_spec:(string|string[]|undefined|boolean)[]) {
    let metric:{[s:string]:number} = {};
    for (let i=0; i<array_spec.length; i++) {
        const equiv_values = ([] as any[]).concat(array_spec[i]);
        for (let j=0; j<equiv_values.length; j++) {
            metric[equiv_values[j]] = i;
        }
    }
    return metric;
};

function sign(x:number):0|-1|1 {
    if (x > 0) {
        return 1;
    } else if (x < 0) {
        return -1;
    } else {
        return 0;
    }
};

export function getGeneticTrackSortComparator(sortByMutationType?: boolean, sortByDrivers?: boolean): { preferred:TrackSortComparator<GeneticTrackDatum>, mandatory:TrackSortComparator<GeneticTrackDatum> } {
    const cna_order = makeComparatorMetric(['amp', 'homdel', 'gain', 'hetloss', 'diploid', undefined]);
    const mut_order = (function () {
        let _order:{[s:string]:number};
        if (!sortByMutationType && !sortByDrivers) {
            return function (m:any) {
                return (({'true': 1, 'false': 2}) as {[bool:string]:number})[(!!m)+""];
            }
        } else if (!sortByMutationType && sortByDrivers) {
            _order = makeComparatorMetric([['inframe_rec', 'missense_rec', 'promoter_rec', 'trunc_rec', 'inframe', 'promoter', 'trunc',], 'missense', undefined]);
        } else if (sortByMutationType && !sortByDrivers) {
            _order = makeComparatorMetric([['trunc', 'trunc_rec'], ['inframe', 'inframe_rec'], ['promoter', 'promoter_rec'], ['missense', 'missense_rec'], undefined, true, false]);
        } else if (sortByMutationType && sortByDrivers) {
            _order = makeComparatorMetric(['trunc_rec', 'inframe_rec', 'promoter_rec', 'missense_rec', 'trunc', 'inframe', 'promoter', 'missense', undefined, true, false]);
        }
        return function (m:any) {
            return _order[m];
        }
    })();
    const regulation_order = makeComparatorMetric(['up', 'down', undefined]);

    function mandatory(d1:GeneticTrackDatum, d2:GeneticTrackDatum):0|1|-1 {
        // Test fusion
        if (d1.disp_fusion && !d2.disp_fusion) {
            return -1;
        } else if (!d1.disp_fusion && d2.disp_fusion) {
            return 1;
        }

        // Next, CNA
        const cna_diff = sign(cna_order[d1.disp_cna+""] - cna_order[d2.disp_cna + ""]);
        if (cna_diff !== 0) {
            return cna_diff;
        }

        // Next, mutation type
        const mut_type_diff = sign(mut_order(d1.disp_mut) - mut_order(d2.disp_mut));
        if (mut_type_diff !== 0) {
            return mut_type_diff;
        }

        // Next, mrna expression
        const mrna_diff = sign(regulation_order[d1.disp_mrna+""] - regulation_order[d2.disp_mrna+""]);
        if (mrna_diff !== 0) {
            return mrna_diff;
        }

        // Next, protein expression
        const rppa_diff = sign(regulation_order[d1.disp_prot+""] - regulation_order[d2.disp_prot+""]);
        if (rppa_diff !== 0) {
            return rppa_diff;
        }

        // If we reach this point, there's no order difference
        return 0;
    }
    function preferred(d1:GeneticTrackDatum, d2:GeneticTrackDatum):0|1|-1 {
        // First, test if either is not sequenced
        const ns_diff = sign(+(!!d1.na) - (+(!!d2.na)));
        if (ns_diff !== 0) {
            return ns_diff;
        }

        return mandatory(d1, d2);
    };
    return {
        preferred: preferred,
        mandatory: mandatory
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
function stringClinicalComparator(d1:any, d2:any) {
    if (d1.na && d2.na) {
        return 0;
    } else if (d1.na && !d2.na) {
        return 2;
    } else if (!d1.na && d2.na) {
        return -2;
    } else {
        return d1.attr_val.localeCompare(d2.attr_val);
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

export function getClinicalTrackSortComparator(track:ClinicalTrackSpec<any>) {
    if (track.datatype === "number") {
        return makeNumericalComparator(track.valueKey);
    } else if (track.datatype === "string") {
        return stringClinicalComparator;
    } else if (track.datatype === "counts") {
        return makeCountsMapClinicalComparator(track.countsCategoryLabels);
    }
}

export const heatmapTrackSortComparator = makeNumericalComparator("profile_data");