/* eslint camelcase: "off" */
// Heavily dependent on OQL PEGjs specification
import * as _ from 'lodash';
import oql_parser from './oql-parser';
import {annotateAlterationTypes} from "./annotateAlterationTypes";

function isDatatypeStatement(line) {
    return line.gene !== undefined && line.gene.toUpperCase() === 'DATATYPES';
}
function isMergedTrackLine(line) {
    return line.list !== undefined;
}

export function isMergedTrackFilter(oqlFilter) {
    return oqlFilter.list !== undefined;
}

function parseMergedTrackOQLQuery(oql_query, opt_default_oql = '') {
    /* In: - oql_query, a string, an OQL query
     - opt_default_oql, a string, default OQL to add to any empty line
     Out: An array, with each element being a parsed single-gene or
     merged-track OQL line, with all 'DATATYPES' lines applied to subsequent
     lines and removed.
     */

    /* In:
    *     - oql_lines:
    *         (DatatypeStatement | MergedTrackLine | SingleGeneLine)[]
    *     - intial_dt: Alterations
    * Out:
    *     (SingleGeneLine|MergedTrackLine)[]
    */
    function applyDatatypes(oql_lines, initial_dt) {
        /* In:
         *     - dt_state: Alterations
         *     - line: DatatypeStatement | MergedTrackLine | SingleGeneLine
         * Out:
         *     {
         *         dt_state: Alterations,
         *         query_line: [SingleGeneLine|MergedTrackLine] | []
         *     }
         */
        function evaluateDt(dt_state, line) {
            if (isDatatypeStatement(line)) {
                return {
                    dt_state: line.alterations,
                    query_line: []
                };
            } else if (isMergedTrackLine(line)) {
                const applied_list = applyDatatypes(line.list, dt_state);
                return {
                    dt_state,
                    query_line: [_.assign({}, line, { list: applied_list })]
                };
            } else {
                const applied_alterations = line.alterations || dt_state;
                return {
                    dt_state,
                    query_line: [_.assign({}, line, { alterations: applied_alterations })]
                };
            }
        }

        /* In:
        *     - current_result:
        *         {
        *             dt_state: Alterations,
        *             query: (SingleGeneLine|MergedTrackLine)[]
        *         }
        *     - line: OQLQueryLine
        * Out:
        *     {
        *         dt_state: Alterations,
        *         query: (SingleGeneLine|MergedTrackLine)[]
        *     }
        */
        function appendDtResult({ dt_state, query }, line) {
            const { dt_state: new_dt_state, query_line } = evaluateDt(dt_state, line);
            return {
                dt_state: new_dt_state,
                query: query.concat(query_line)
            };
        }

        return oql_lines.reduce(
            appendDtResult,
            { dt_state: initial_dt, query: [] }
        ).query;
    }

    const parsed = oql_parser.parse(oql_query);
    let parsed_with_datatypes = applyDatatypes(parsed, false);
    if (opt_default_oql.length > 0) {
        const default_alterations = oql_parser.parse(`DUMMYGENE:${opt_default_oql};`)[0].alterations;
        parsed_with_datatypes = applyDatatypes(parsed_with_datatypes, default_alterations);
    }
    return parsed_with_datatypes;
}

export function parseOQLQuery(oql_query, opt_default_oql = '') {
    /* In: - oql_query, a string, an OQL query
     - opt_default_oql, a string, default OQL to add to any empty line
     Out: An array, with each element being a parsed single-gene OQL line,
     with all 'DATATYPES' lines applied to subsequent lines and removed.
     */

    /* In: SingleGeneLine | MergedTrackLine
     * Out: SingleGeneLine[]
     */
    function extractGeneLines(line) {
        return (isMergedTrackLine(line)
            ? line.list
            : [line]
        );
    }

    const parsed_with_datatypes = parseMergedTrackOQLQuery(oql_query, opt_default_oql);
    return _.flatMap(parsed_with_datatypes, extractGeneLines);
}

export function doesQueryContainOQL(oql_query) {
    /* In: oql_query, a string, an OQL query (which could just be genes with no specified alterations)
        Out: boolean, true iff the query has explicit OQL (e.g. `BRCA1: MUT` as opposed to just `BRCA1`)
     */

    const parsedQuery = parseOQLQuery(oql_query);
    let ret = false;
    for (const singleGeneQuery of parsedQuery) {
        if (singleGeneQuery.alterations !== false) {
            ret = true;
            break;
        }
    }
    return ret;
}

export function doesQueryContainMutationOQL(oql_query) {
    /* In: oql_query, a string, an OQL query (which could just be genes with no specified alterations)
     Out: boolean, true iff the query has explicit mutation OQL (e.g. `BRCA1: MISSENSE` or `BRCA: _GERMLINE` as opposed to just `BRCA1` or `BRCA1: MUT`)
     */

    const parsedQuery = parseOQLQuery(oql_query);
    let ret = false;
    for (const singleGeneQuery of parsedQuery) {
        if (singleGeneQuery.alterations !== false) {
            for (const alteration of singleGeneQuery.alterations) {
                if (alteration.alteration_type === "mut" &&
                    (alteration.constr_rel !== undefined || (alteration.modifiers.length > 0))) {
                    // nontrivial mutation specification
                    ret = true;
                    break;
                } else if (alteration.alteration_type === "any") {
                    // any DRIVER specification, which includes mutation
                    if (alteration.modifiers.indexOf("DRIVER") > -1) {
                        ret = true;
                        break;
                    }
                }
            }
            if (ret) {
                break;
            }
        }
    }
    return ret;
}

export function parsedOQLAlterationToSourceOQL(alteration) {
    switch (alteration.alteration_type) {
        case "cna":
            var ret;
            if (alteration.constr_rel === "=") {
                ret = alteration.constr_val;
            } else {
                ret = ["CNA",alteration.constr_rel,alteration.constr_val].join("");
            }
            ret += alteration.modifiers.map(function(modifier) { return "_"+modifier; }).join("");
            return ret;
        case "mut":
            var ret;
            if (alteration.constr_rel) {
                if (alteration.constr_type === "position") {
                    ret = ["MUT",alteration.constr_rel,alteration.info.amino_acid,alteration.constr_val].join("");
                } else {
                    ret = ["MUT",alteration.constr_rel,alteration.constr_val].join("");
                }
            } else {
                ret = "MUT";
            }
            ret += alteration.modifiers.map(function(modifier) { return "_"+modifier; }).join("");
            return ret;
        case "exp":
            return "EXP" + alteration.constr_rel + alteration.constr_val;
        case "prot":
            return "PROT" + alteration.constr_rel + alteration.constr_val;
        case "fusion":
            return "FUSION" + alteration.modifiers.map(function(modifier) { return "_"+modifier; }).join("");
        case "any":
            return alteration.modifiers.join("_");
    }
};
export function unparseOQLQueryLine(parsed_oql_query_line) {
    var ret = "";
    var gene = parsed_oql_query_line.gene;
    var alterations = parsed_oql_query_line.alterations;
    ret += gene;
    if (alterations.length > 0) {
        ret += ": " + alterations.map(parsedOQLAlterationToSourceOQL).join(" ");
    }
    ret += ";";
    return ret;
};

/* For the methods isDatumWantedByOQL, ..., the AccessorsForOqlFilter argument is as follows:
 * null always means the accessor does not apply to the given element. for example, `cna` applied to a mutation should give null
 * AccessorsForOqlFilter = {
 *	'gene': function(d) {
 *	    // returns lower case gene symbol
 *	},
 *	'cna': function(d) {
 *	    // returns 'amp', 'homdel', 'hetloss', or 'gain',
 *	    //  or null
 *	},
 *	'mut_type': function(d) {
 *	    // returns 'missense', 'nonsense', 'nonstart', 'nonstop', 'frameshift', 'inframe', 'splice', 'trunc', or 'promoter'
 *	    //  or null
 *	},
 *	'mut_position': function(d) {
 *	    // returns a 2-element array of integers, the start position to the end position
 *	    // or null
 *	},
 *  'mut_status': function(d) {
 *      // returns "germline" or "somatic"
 *      // or null
 *  },
 *	'mut_amino_acid_change': function(d) {
 *	    // returns a string, the amino acid change,
 *	    // or null
 *	},
 *	'exp': function(d) {
 *	    // returns a double, mrna expression,
 *	    // or null
 *	},
 *	'prot': function(d) {
 *	    // returns a double, protein expression,
 *	    // or null
 *	},
 *	'fusion': function(d) {
 *	    // returns true, false, or null
 *	},
 *  'is_driver': function(d) {
 *      // returns true, false, or null
 *  },
 * }
 */
var isDatumWantedByOQL = function (parsed_oql_query, datum, accessors) {
    /*  In: - parsed_oql_query, the result of parseOQLQuery above
     *	- datum, a datum
     *	- AccessorsForOqlFilter, an object as described above with methods that apply to datum
     *  Out: Boolean, whether datum is wanted by this OQL query
     */
    var gene = accessors.gene(datum).toUpperCase();
    // if the datum doesn't have a gene associated with it, it's unwanted.
    if (!gene) {
        return false;
    }
    // Otherwise, a datum is wanted if it's wanted by at least one line.
    return parsed_oql_query
        .map(function(query_line) {
            return isDatumWantedByOQLLine(query_line, datum, gene, accessors);
        })
        .reduce(function(acc, next) {
            return acc || next;
        }, false);
};

var isDatumWantedByOQLLine = function(query_line, datum, datum_gene, accessors) {
    /*  Helper method for isDatumWantedByOQL
     *  In: - query_line, one element of a parseOQLQuery output array
     *	- datum, see isDatumWantedByOQL
     *	- datum_gene, the lower case gene in datum - passed instead of reaccessed as an optimization
     *	- AccessorsForOqlFilter, see isDatumWantedByOQL
     */
    var line_gene = query_line.gene.toUpperCase();
    // If the line doesn't have the same gene, the datum is not wanted by this line
    if (line_gene !== datum_gene) {
        return false;
    }
    // Otherwise, a datum is wanted iff it's wanted by at least one command.
    if (!query_line.alterations) {
        return 1;
    }
    return (query_line.alterations
        .map(function(alteration_cmd) {
            return isDatumWantedByOQLAlterationCommand(alteration_cmd, datum, accessors);
        })
        .reduce(function(acc, next) {
            if (next === 1) {
                // if it's wanted by this command, its wanted
                return 1;
            } else if (next === 0) {
                // if this command doesn't address it, go with what currently decided
                return acc;
            } else if (next === -1) {
                // if this command addresses and rejects it, then if its
                //  not already wanted, then for now its unwanted
                if (acc === 1) {
                    return 1;
                } else {
                    return -1;
                }
            }
        }, -1) // start off with unwanted
    === 1);
};

var isDatumWantedByOQLAlterationCommand = function(alt_cmd, datum, accessors) {
    /*  Helper method for isDatumWantedByOQLLine
     *  In: - alt_cmd, a parsed oql alteration
     *	- datum, see isDatumWantedByOQL
     *	- AccessorsForOqlFilter, see isDatumWantedByOQL
     *  Out: 1 if the datum is addressed by this command and wanted,
     *	0 if the datum is not addressed by this command,
     *	-1 if the datum is addressed by this command and rejected
     */
    switch (alt_cmd.alteration_type) {
        case "cna":
            return isDatumWantedByOQLCNACommand(alt_cmd, datum, accessors);
        case "mut":
            return isDatumWantedByOQLMUTCommand(alt_cmd, datum, accessors);
        case "exp":
        case "prot":
            return isDatumWantedByOQLEXPOrPROTCommand(alt_cmd, datum, accessors);
        case "fusion":
            return isDatumWantedByFUSIONCommand(alt_cmd, datum, accessors);
        case "any":
            return isDatumWantedByAnyTypeWithModifiersCommand(alt_cmd, datum, accessors);
    }
    return 0;
};

var isDatumWantedByAnyTypeWithModifiersCommand = function(alt_cmd, datum, accessors) {
    // if any modifier is false, its not wanted (-1)
    // else if any modifier is true, its wanted (1)
    // else its not addressed (0)
    var isWantedBySome = false;
    var isUnwantedBySome = false;

    for (var i=0; i<alt_cmd.modifiers.length; i++) {
        var modifier = alt_cmd.modifiers[i];
        var datumWanted = null;
        switch (modifier) {
            case "DRIVER":
            default:
                datumWanted = isDatumWantedByOQLAlterationModifier(modifier, datum, accessors);
        }
        if (datumWanted === true) {
            isWantedBySome = true;
        } else if (datumWanted === false) {
            isUnwantedBySome = true;
            break;
        }
    };

    if (isUnwantedBySome) {
        return -1;
    } else if (isWantedBySome) {
        return 1;
    } else {
        return 0;
    }
};

// this command can ONLY return null or TRUE
var isDatumWantedByFUSIONCommand = function(alt_cmd, datum, accessors) {
    /* Helper method for isDatumWantedByOQLAlterationCommand
     * In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var d_fusion = accessors.fusion(datum); // null || true
    if (d_fusion === null) {
        // If no fusion data, it's not addressed
        return 0;
    } else {
        var match = true;
        // now filter by modifiers with AND logic
        for (var i=0; i<alt_cmd.modifiers.length; i++) {
            const datumWanted = isDatumWantedByOQLAlterationModifier(alt_cmd.modifiers[i], datum, accessors);
            if (datumWanted !== null) {
                match = match && datumWanted;
            }
        }
        return 2 * (+match) - 1; // map 0,1 to -1,1
    }
};

var isDatumWantedByOQLCNACommand = function(alt_cmd, datum, accessors) {
    /*  Helper method for isDatumWantedByOQLAlterationCommand
     *  In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var d_cna = accessors.cna(datum);
    if (!d_cna) {
        // If no cna data on the datum, it's not addressed
        return 0;
    } else {
        // Otherwise, return -1 if it doesnt match, 1 if it matches
        var match = true;
        if (alt_cmd.constr_rel === "=") {
            match = (d_cna === alt_cmd.constr_val.toLowerCase());
        } else if (alt_cmd.constr_rel) {
            var integer_copy_number = {"amp":2, "gain":1, "hetloss":-1, "homdel":-2};
            var d_int_cna = integer_copy_number[d_cna];
            var alt_int_cna = integer_copy_number[alt_cmd.constr_val.toLowerCase()];
            if (alt_cmd.constr_rel === ">") {
                match = (d_int_cna > alt_int_cna);
            } else if (alt_cmd.constr_rel === ">=") {
                match = (d_int_cna >= alt_int_cna);
            } else if (alt_cmd.constr_rel === "<") {
                match = (d_int_cna < alt_int_cna);
            } else if (alt_cmd.constr_rel === "<=") {
                match = (d_int_cna <= alt_int_cna);
            }
        }

        // now filter by modifiers with AND logic
        for (var i=0; i<alt_cmd.modifiers.length; i++) {
            const datumWanted = isDatumWantedByOQLAlterationModifier(alt_cmd.modifiers[i], datum, accessors);
            if (datumWanted !== null) {
                match = match && datumWanted;
            }
        }
        return 2 * (+match) - 1; // map 0,1 to -1,1
    }
};
var isDatumWantedByOQLMUTCommand = function(alt_cmd, datum, accessors) {
    /*  Helper method for isDatumWantedByOQLAlterationCommand
     *  In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var d_mut_type = accessors.mut_type(datum);
    if (!d_mut_type) {
        // If no mut data on the datum, it's not addressed
        return 0;
    } else {

        d_mut_type = d_mut_type.toLowerCase();

        var matches = false;
        // If no constraint relation ('=' or '!='), then every mutation matches
        if (!alt_cmd.constr_rel) {
            matches = true;
        }
        // Decide based on what type of mutation specification
        if (alt_cmd.constr_type === 'class') {
            // Matching on type
            var target_type = alt_cmd.constr_val.toLowerCase();
            // It matches if the type of mutation matches, or if
            //  the target is truncating and the mutation is anything but missense or inframe
            matches = (d_mut_type === target_type) ||
                (target_type === 'trunc' && d_mut_type !== 'missense' && d_mut_type !== 'inframe');
            if (alt_cmd.constr_rel === '!=') {
                // If '!=', then we want 1 if it DOESNT match
                matches = !matches;
            }
        } else if (alt_cmd.constr_type === 'position') {
            // Matching on position
            var d_mut_range = accessors.mut_position(datum);
            if (!d_mut_range) {
                // If no position data, reject
                return -1;
            }
            var target_position = alt_cmd.constr_val;
            matches = (target_position >= d_mut_range[0] && target_position <= d_mut_range[1]);
            if (alt_cmd.constr_rel === '!=') {
                matches = !matches;
            }
        } else if (alt_cmd.constr_type === 'name') {
            // Matching on amino acid change code
            var d_mut_name = accessors.mut_amino_acid_change(datum).toLowerCase();
            if (!d_mut_name) {
                // If no amino acid change data, reject
                return -1;
            }
            var target_name = alt_cmd.constr_val.toLowerCase();
            matches = (target_name === d_mut_name);
            if (alt_cmd.constr_rel === '!=') {
                matches = !matches;
            }
        }

        // now filter by modifiers with AND logic
        for (var i=0; i<alt_cmd.modifiers.length; i++) {
            const datumWanted = isDatumWantedByOQLMutationModifier(alt_cmd.modifiers[i], datum, accessors);
            if (datumWanted !== null) {
                matches = matches && datumWanted;
            }
        }

        return 2*(+matches) - 1; // return 1 if true, -1 if false
    }

};

var isDatumWantedByOQLMutationModifier = function(modifier, datum, accessors) {
    switch (modifier) {
        case "GERMLINE":
        case "SOMATIC":
            return accessors.mut_status(datum) === modifier.toLowerCase();
        default:
            return isDatumWantedByOQLAlterationModifier(modifier, datum, accessors);
    }
};

var isDatumWantedByOQLAlterationModifier = function(modifier, datum, accessors) {
    switch (modifier) {
        case "DRIVER":
            return accessors.is_driver(datum);
        default:
            return false;
    }
};

var isDatumWantedByOQLEXPOrPROTCommand = function(alt_cmd, datum, accessors) {
    /*  Helper method for isDatumWantedByOQLAlterationCommand
     *  In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var level = accessors[(alt_cmd.alteration_type === "exp" ? 'exp' : 'prot')](datum);
    if (level === null) {
        // If no data, it's not addressed
        return 0;
    } else {
        // Otherwise, check it in relation to target
        var target_level = alt_cmd.constr_val;
        var target_rel = alt_cmd.constr_rel;
        var match;
        var direction = undefined;
        if ((target_rel === '<' && level < target_level) || (target_rel === '<=' && level <= target_level)) {
            match = 1;
            direction = -1;
        } else if ((target_rel === '>' && level > target_level) || (target_rel === '>=' && level >= target_level)) {
            match = 1;
            direction = 1;
        } else {
            match = -1;
        }

        if (match > 0) {
            datum.alterationSubType = (direction && (direction > 0)) ? 'up' : 'down';
        }

        return match;
    }
};

function filterData(oql_query, data, _accessors, opt_default_oql = '', opt_by_oql_line) {
    /* In:	- oql_query, a string
     *	- data, a list of data
     *	- AccessorsForOqlFilter, AccessorsForOqlFilter as defined above,
     *	- opt_default_oql, an optional argument, string, default oql to insert to empty oql lines
     *	- opt_by_oql_line, optional argument, boolean or string, see Out for description
     *  Out: the given data, filtered by the given oql query.
     *    * If opt_by_oql_line is 'mergedtrack', then the result is
     *      a list of objects having either a .data or .list property,
     *      corresponding to single-gene and merged-track lines in
     *      the OQL query respectively. out[i].data is the result of filtering
     *      the given data by oql_query line i (after removing 'DATATYPES' lines)
     *      or out[i].list is an array of such objects for the lines within the
     *      merged track expression. Both objects have additional metadata
     *      as listed in oqlfilter.d.ts.
     *    * If opt_by_oql_line is 'gene' or true, then the result is just
     *      a list of objects where out[i].data corresponds to gene i after
     *      flattening merged track queries.
     *    * If opt_by_oql_line is false or absent, then the result is
     *      a flat list of the data that is wanted by at least one oql line.
     */
    data = $.extend(true, [], data); // deep copy, because of any modifications it will make during filtration
    var null_fn = function () {
        return null;
    };

    // var required_accessors = ['gene', 'cna', 'mut_type', 'mut_position',
    //     'mut_amino_acid_change', 'exp', 'prot', 'fusion'];
    // default every non-given accessor function to null
    var accessors = _accessors;
    // for (var i = 0; i < required_accessors.length; i++) {
    //     AccessorsForOqlFilter[required_accessors[i]] = _accessors[required_accessors[i]] || null_fn;
    // }

    for (var i=0; i<data.length; i++) {
        data[i].molecularProfileAlterationType = accessors.molecularAlterationType(data[i].molecularProfileId);
        annotateAlterationTypes(data[i], accessors);
    }

    function applyToGeneLines(geneLineFunction) {
        return (line) => {
            if (isMergedTrackLine(line)) {
                return {
                    ...line,
                    list: line.list.map(applyToGeneLines(geneLineFunction))
                };
            } else {
                return geneLineFunction(line);
            }
        };
    }

    const queryParsingFunction = (
        opt_by_oql_line === 'mergedtrack'
        ? parseMergedTrackOQLQuery
        : parseOQLQuery
    );
    const parsed_query = queryParsingFunction(oql_query, opt_default_oql).map(
        applyToGeneLines(
            q_line => ({ ...q_line, gene: q_line.gene.toUpperCase() })
        )
    );

    if (opt_by_oql_line) {
        return parsed_query.map(applyToGeneLines(
            query_line => ({
                gene: query_line.gene,
                parsed_oql_line: query_line,
                oql_line: unparseOQLQueryLine(query_line),
                data: data.filter(datum =>
                    isDatumWantedByOQLLine(query_line, datum, accessors.gene(datum).toUpperCase(), accessors)
                )
            })
        ));
    } else {
        return data.filter(function (datum) {
            return isDatumWantedByOQL(parsed_query, datum, accessors);
        });
    }
};



export function filterCBioPortalWebServiceData(oql_query, data, accessors, opt_default_oql) {
    /* Wrapper method for filterData that has the cBioPortal default accessor functions
     * Note that for use, the input data must have the field 'genetic_alteration_type,' which
     * takes one of the following values:
     *	- MUTATION_EXTENDED
     *	- COPY_NUMBER_ALTERATION
     *	- MRNA_EXPRESSION
     *	- PROTEIN_LEVEL
     */

    return filterData(oql_query, data, accessors, opt_default_oql);
}

export function filterCBioPortalWebServiceDataByOQLLine(oql_query, data, accessors, opt_default_oql) {
    /* Wrapper method for filterData that has the cBioPortal default accessor functions
     * Note that for use, the input data must have the field 'genetic_alteration_type,' which
     * takes one of the following values:
     *	- MUTATION_EXTENDED
     *	- COPY_NUMBER_ALTERATION
     *	- MRNA_EXPRESSION
     *	- PROTEIN_LEVEL
     */

    return filterData(oql_query, data, accessors, opt_default_oql, 'gene');
}

export function filterCBioPortalWebServiceDataByUnflattenedOQLLine(oql_query, data, accessors, opt_default_oql) {
    /* Wrapper method for filterData that has the cBioPortal default accessor functions
     * Note that for use, the input data must have the field 'genetic_alteration_type,' which
     * takes one of the following values:
     *	- MUTATION_EXTENDED
     *	- COPY_NUMBER_ALTERATION
     *	- MRNA_EXPRESSION
     *	- PROTEIN_LEVEL
     */

    return filterData(oql_query, data, accessors, opt_default_oql, 'mergedtrack');
}


// export function filterCBioPortalWebServiceData(oql_query, data, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction) {
//     /* Wrapper method for filterData that has the cBioPortal default accessor functions
//      * Note that for use, the input data must have the field 'genetic_alteration_type,' which
//      * takes one of the following values:
//      *	- MUTATION_EXTENDED
//      *	- COPY_NUMBER_ALTERATION
//      *	- MRNA_EXPRESSION
//      *	- PROTEIN_LEVEL
//      */
//     var cna_profile_data_to_string = {
//         "-2": "homdel",
//         "-1": "hetloss",
//         "0": null,
//         "1": "gain",
//         "2": "amp"
//     };
//     var AccessorsForOqlFilter = {
//         'gene': function(d) { return d.hugo_gene_symbol; },
//         'cna': function(d) {
//             if (d.genetic_alteration_type === 'COPY_NUMBER_ALTERATION') {
//                 return cna_profile_data_to_string[d.profile_data];
//             } else {
//                 return null;
//             }
//         },
//         'mut_type': function(d) {
//             if (d.genetic_alteration_type === 'MUTATION_EXTENDED') {
//                 if (d.simplified_mutation_type === "fusion") {
//                     return null;
//                 } else if (d.amino_acid_change.toLowerCase() === "promoter") {
//                     return "promoter";
//                 } else {
//                     return d.simplified_mutation_type;
//                 }
//             } else {
//                 return null;
//             }
//         },
//         'mut_position': function(d) {
//             if (d.genetic_alteration_type === 'MUTATION_EXTENDED') {
//                 var start = d.protein_start_position;
//                 var end = d.protein_end_position;
//                 if (start !== null && end !== null) {
//                     return [parseInt(start, 10), parseInt(end, 10)];
//                 } else {
//                     return null;
//                 }
//             } else {
//                 return null;
//             }
//         },
//         'mut_amino_acid_change': function(d) {
//             if (d.genetic_alteration_type === 'MUTATION_EXTENDED') {
//                 return d.amino_acid_change;
//             } else {
//                 return null;
//             }
//         },
//         'exp': function(d) {
//             if (d.genetic_alteration_type === 'MRNA_EXPRESSION') {
//                 return parseFloat(d.profile_data);
//             } else {
//                 return null;
//             }
//         },
//         'prot': function(d) {
//             if (d.genetic_alteration_type === 'PROTEIN_LEVEL') {
//                 return parseFloat(d.profile_data);
//             } else {
//                 return null;
//             }
//         },
//         'fusion': function(d) {
//             if (d.genetic_alteration_type === 'MUTATION_EXTENDED') {
//                 return (d.simplified_mutation_type === "fusion");
//             } else {
//                 return null;
//             }
//         }
//     };
//     return filterData(oql_query, data, AccessorsForOqlFilter, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction);
// }


export function genes(oql_query) {
    var parse_result = parseOQLQuery(oql_query);
    var genes = parse_result.filter(function (q_line) {
        return q_line.gene.toLowerCase() !== "datatypes";
    }).map(function (q_line) {
        return q_line.gene.toUpperCase();
    });
    var unique_genes_set = {};
    for (var i=0; i<genes.length; i++) {
        unique_genes_set[genes[i]] = true;
    }
    return Object.keys(unique_genes_set);
}

function isValid (oql_query) {
    var ret = true;
    try {
        oql_parser.parse(oql_query);
    } catch (e) {
        ret = false;
    }
    return ret;
}

