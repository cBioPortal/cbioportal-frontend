var makeComparatorMetric = function(array_spec) {
    var metric = {};
    for (var i=0; i<array_spec.length; i++) {
        var equiv_values = [].concat(array_spec[i]);
        for (var j=0; j<equiv_values.length; j++) {
            metric[equiv_values[j]] = i;
        }
    }
    return metric;
};

import utils from './utils';


var comparator_utils = {
    'makeGeneticComparator': function (distinguish_mutation_types, distinguish_recurrent) {
        var fusion_key = 'disp_fusion';
        var cna_key = 'disp_cna';
        var cna_order = makeComparatorMetric(['amp', 'homdel', 'gain', 'hetloss', 'diploid', undefined]);
        var mut_type_key = 'disp_mut';
        var mut_order = (function () {
            var _order;
            if (!distinguish_mutation_types && !distinguish_recurrent) {
                return function (m) {
                    return ({'true': 1, 'false': 2})[!!m];
                }
            } else if (!distinguish_mutation_types && distinguish_recurrent) {
                _order = makeComparatorMetric([['inframe_rec', 'missense_rec', 'promoter_rec'], ['inframe', 'missense', 'promoter', 'trunc', 'trunc_rec'], undefined]);
            } else if (distinguish_mutation_types && !distinguish_recurrent) {
                _order = makeComparatorMetric([['trunc', 'trunc_rec'], ['inframe','inframe_rec'], ['promoter', 'promoter_rec'], ['missense', 'missense_rec'], undefined, true, false]);
            } else if (distinguish_mutation_types && distinguish_recurrent) {
                _order = makeComparatorMetric([['trunc', 'trunc_rec'], 'inframe_rec', 'promoter_rec', 'missense_rec', 'inframe', 'promoter', 'missense',  undefined, true, false]);
            }
            return function(m) {
                return _order[m];
            }
        })();
        var mrna_key = 'disp_mrna';
        var rppa_key = 'disp_prot';
        var regulation_order = makeComparatorMetric(['up', 'down', undefined]);

        return function (d1, d2) {
            // First, test fusion
            if (d1[fusion_key] && !(d2[fusion_key])) {
                return -1;
            } else if (!(d1[fusion_key]) && d2[fusion_key]) {
                return 1;
            }

            // Next, CNA
            var cna_diff = utils.sign(cna_order[d1[cna_key]] - cna_order[d2[cna_key]]);
            if (cna_diff !== 0) {
                return cna_diff;
            }

            // Next, mutation type
            var mut_type_diff = utils.sign(mut_order(d1[mut_type_key]) - mut_order(d2[mut_type_key]));
            if (mut_type_diff !== 0) {
                return mut_type_diff;
            }

            // Next, mrna expression
            var mrna_diff = utils.sign(regulation_order[d1[mrna_key]] - regulation_order[d2[mrna_key]]);
            if (mrna_diff !== 0) {
                return mrna_diff;
            }

            // Next, protein expression
            var rppa_diff = utils.sign(regulation_order[d1[rppa_key]] - regulation_order[d2[rppa_key]]);
            if (rppa_diff !== 0) {
                return rppa_diff;
            }

            // If we reach this point, there's no order difference
            return 0;
        };
    },
    'numericalClinicalComparator': function (d1, d2) {
        if (d1.na && d2.na) {
            return 0;
        } else if (d1.na && !d2.na) {
            return 2;
        } else if (!d1.na && d2.na) {
            return -2;
        } else {
            return (d1.attr_val < d2.attr_val ? -1 : (d1.attr_val === d2.attr_val ? 0 : 1));
        }
    },
    'stringClinicalComparator': function (d1, d2) {
        if (d1.na && d2.na) {
            return 0;
        } else if (d1.na && !d2.na) {
            return 2;
        } else if (!d1.na && d2.na) {
            return -2;
        } else {
            return d1.attr_val.localeCompare(d2.attr_val);
        }
    },
    'makeCountsMapClinicalComparator': function(categories) {
        return function (d1, d2) {
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
                        return utils.sign(d1_prop - d2_prop);
                    }
                }
            }
        }
    }

};

export default comparator_utils;