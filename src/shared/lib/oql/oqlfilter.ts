/* eslint camelcase: "off" */
// Heavily dependent on OQL PEGjs specification
import * as _ from 'lodash';
import oql_parser, {
    AminoAcid,
    AnyTypeWithModifiersCommand,
    CNACommand,
    EXPCommand,
    FUSIONCommand,
    MutationModifier,
    MUTCommand,
    PROTCommand,
} from './oql-parser';
import { annotateAlterationTypes } from './annotateAlterationTypes';
import { SingleGeneQuery, MergedGeneQuery } from './oql-parser';
import {
    AnnotatedMutation,
    ExtendedAlteration,
    AnnotatedStructuralVariant,
} from '../../../pages/resultsView/ResultsViewPageStore';
import {
    NumericGeneMolecularData,
    Mutation,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { Alteration } from 'shared/lib/oql/oql-parser';
import AccessorsForOqlFilter, {
    Datum,
    SimplifiedMutationType,
} from './AccessorsForOqlFilter';

export interface IAccessorsForOqlFilter<T> {
    // a null return for an attribute means that attribute
    //  does not apply to the given element. (i.e N/A, not applicable).
    // For example, `cna` applied to a mutation should give null

    // returns lower case gene symbol
    gene: (d: T) => string;

    // returns 'amp', 'homdel', 'hetloss', or 'gain',
    //  or null
    cna: (d: T) => 'amp' | 'homdel' | 'hetloss' | 'gain' | null;

    // returns 'missense', 'nonsense', 'nonstart', 'nonstop', 'frameshift', 'inframe', 'splice', 'trunc', or 'promoter'
    //  or null
    mut_type: (d: T) => SimplifiedMutationType | 'promoter' | null;

    // returns a 2-element array of integers, the start position to the end position
    // or null
    mut_position: (d: T) => [number, number] | null;

    // returns "germline" or "somatic"
    // or null
    mut_status: (d: T) => 'germline' | 'somatic' | null;

    // returns a string, the amino acid change,
    // or null
    mut_amino_acid_change: (d: T) => string | null;

    // returns mrna expression,
    // or null
    exp: (d: T) => number | null;

    // returns protein expression,
    // or null
    prot: (d: T) => number | null;

    // returns true, false, or null
    structuralVariant: (d: T) => boolean | null;

    // returns true, false, or null
    is_driver: (d: T) => boolean | null;
}

type OQLAlterationFilterString = string;

export type OQLLineFilterOutput<T> = {
    gene: string;
    parsed_oql_line: SingleGeneQuery;
    oql_line: string;
    data: T[];
};

export type MergedTrackLineFilterOutput<T> = {
    list: OQLLineFilterOutput<T>[];
    label?: string;
};
export type UnflattenedOQLLineFilterOutput<T> =
    | OQLLineFilterOutput<T>
    | MergedTrackLineFilterOutput<T>;

function isDatatypeStatement(line: OQLLineFilterOutput<any>) {
    return line.gene !== undefined && line.gene.toUpperCase() === 'DATATYPES';
}
function isMergedTrackLine(
    line: OQLLineFilterOutput<any> | MergedTrackLineFilterOutput<any>
): line is MergedTrackLineFilterOutput<any> {
    return (line as any).list !== undefined;
}

function isMergedGeneQuery(
    line: SingleGeneQuery | MergedGeneQuery
): line is MergedGeneQuery {
    return !!(line as any).list;
}

export function isMergedTrackFilter<T>(
    oqlFilter: UnflattenedOQLLineFilterOutput<T>
): oqlFilter is MergedTrackLineFilterOutput<T> {
    return (oqlFilter as any).list !== undefined;
}

function parseMergedTrackOQLQuery(oql_query: string, opt_default_oql = '') {
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
    function applyDatatypes(oql_lines: any, initial_dt: any) {
        /* In:
         *     - dt_state: Alterations
         *     - line: DatatypeStatement | MergedTrackLine | SingleGeneLine
         * Out:
         *     {
         *         dt_state: Alterations,
         *         query_line: [SingleGeneLine|MergedTrackLine] | []
         *     }
         */
        function evaluateDt(dt_state: any, line: any) {
            if (isDatatypeStatement(line)) {
                return {
                    dt_state: line.alterations,
                    query_line: [],
                };
            } else if (isMergedTrackLine(line)) {
                const applied_list = applyDatatypes(line.list, dt_state);
                return {
                    dt_state,
                    query_line: [_.assign({}, line, { list: applied_list })],
                };
            } else {
                const applied_alterations = line.alterations || dt_state;
                return {
                    dt_state,
                    query_line: [
                        _.assign({}, line, {
                            alterations: applied_alterations,
                        }),
                    ],
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
        function appendDtResult({ dt_state, query }: any, line: any) {
            const { dt_state: new_dt_state, query_line } = evaluateDt(
                dt_state,
                line
            );
            return {
                dt_state: new_dt_state,
                query: query.concat(query_line),
            };
        }

        return oql_lines.reduce(appendDtResult, {
            dt_state: initial_dt,
            query: [],
        }).query;
    }

    const parsed = oql_parser.parse(oql_query);
    let parsed_with_datatypes = applyDatatypes(parsed, false);
    if (opt_default_oql.length > 0) {
        const default_alterations = (oql_parser.parse(
            `DUMMYGENE:${opt_default_oql};`
        )![0] as SingleGeneQuery).alterations;
        parsed_with_datatypes = applyDatatypes(
            parsed_with_datatypes,
            default_alterations
        );
    }
    return parsed_with_datatypes;
}

export function parseOQLQuery(
    oql_query: string,
    opt_default_oql?: OQLAlterationFilterString
): SingleGeneQuery[] {
    /* In: - oql_query, a string, an OQL query
     - opt_default_oql, a string, default OQL to add to any empty line
     Out: An array, with each element being a parsed single-gene OQL line,
     with all 'DATATYPES' lines applied to subsequent lines and removed.
     */

    /* In: SingleGeneLine | MergedTrackLine
     * Out: SingleGeneLine[]
     */
    function extractGeneLines<T>(
        line: SingleGeneQuery | MergedGeneQuery
    ): SingleGeneQuery[] {
        return isMergedGeneQuery(line) ? line.list : [line];
    }

    const parsed_with_datatypes = parseMergedTrackOQLQuery(
        oql_query,
        opt_default_oql
    );
    return _.flatMap(parsed_with_datatypes, extractGeneLines);
}

export function doesQueryContainOQL(oql_query: string): boolean {
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

export function doesQueryContainMutationOQL(oql_query: string): boolean {
    /* In: oql_query, a string, an OQL query (which could just be genes with no specified alterations)
     Out: boolean, true iff the query has explicit mutation OQL (e.g. `BRCA1: MISSENSE` or `BRCA: _GERMLINE` as opposed to just `BRCA1` or `BRCA1: MUT`)
     */

    const parsedQuery = parseOQLQuery(oql_query);
    let ret = false;
    for (const singleGeneQuery of parsedQuery) {
        if (singleGeneQuery.alterations !== false) {
            for (const alteration of singleGeneQuery.alterations) {
                if (
                    alteration.alteration_type === 'mut' &&
                    (alteration.constr_rel !== undefined ||
                        alteration.modifiers.length > 0)
                ) {
                    // nontrivial mutation specification
                    ret = true;
                    break;
                } else if (alteration.alteration_type === 'any') {
                    // any DRIVER specification, which includes mutation
                    if (alteration.modifiers.indexOf('DRIVER') > -1) {
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

export function parsedOQLAlterationToSourceOQL(alteration: Alteration): string {
    let ret: string;
    switch (alteration.alteration_type) {
        case 'cna':
            if (alteration.constr_rel === '=') {
                ret = alteration.constr_val!;
            } else {
                ret = [
                    'CNA',
                    alteration.constr_rel,
                    alteration.constr_val,
                ].join('');
            }
            if (alteration.modifiers.length > 0) {
                ret += '_';
                ret += alteration.modifiers.join('_');
            }
            return ret;
        case 'mut':
            var underscoreBeforeModifiers = true;
            if (alteration.constr_rel) {
                if (alteration.constr_type === 'position') {
                    ret = [
                        'MUT',
                        alteration.constr_rel,
                        (alteration.info as any).amino_acid as AminoAcid,
                        alteration.constr_val,
                    ].join('');
                } else {
                    ret = [
                        'MUT',
                        alteration.constr_rel,
                        alteration.constr_val,
                    ].join('');
                    if (!alteration.constr_val) {
                        underscoreBeforeModifiers = false;
                    }
                }
            } else {
                ret = 'MUT';
            }
            if (underscoreBeforeModifiers && alteration.modifiers.length > 0) {
                ret += '_';
            }
            ret += alteration.modifiers.join('_');
            return ret;
        case 'exp':
            return 'EXP' + alteration.constr_rel + alteration.constr_val;
        case 'prot':
            return 'PROT' + alteration.constr_rel + alteration.constr_val;
        case 'fusion':
            return (
                'FUSION' +
                alteration.modifiers
                    .map(function(modifier) {
                        return '_' + modifier;
                    })
                    .join('')
            );
        case 'any':
            return alteration.modifiers.join('_');
    }
}
export function unparseOQLQueryLine(parsed_oql_line: SingleGeneQuery): string {
    let ret = parsed_oql_line.gene;
    const alterations = parsed_oql_line.alterations;
    if (alterations && alterations.length > 0) {
        ret += ': ' + alterations.map(parsedOQLAlterationToSourceOQL).join(' ');
        ret += ';';
    }
    return ret;
}

function isDatumWantedByOQL<T>(
    parsed_oql_query: SingleGeneQuery[],
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
): boolean {
    //  Out: Boolean, whether datum is wanted by this OQL query
    const gene = accessors.gene(datum).toUpperCase();
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
}

function isDatumWantedByOQLLine<T>(
    query_line: SingleGeneQuery,
    datum: T,
    datum_gene: string, // lower case gene in datum - passed instead of reaccessed as an optimization
    accessors: IAccessorsForOqlFilter<T>
) {
    //  Helper method for isDatumWantedByOQL
    var line_gene = query_line.gene.toUpperCase();
    // If the line doesn't have the same gene, the datum is not wanted by this line
    if (line_gene !== datum_gene) {
        return false;
    }
    // Otherwise, a datum is wanted iff it's wanted by at least one command.
    if (!query_line.alterations) {
        // if no alterations specified, then the datum is wanted
        return true;
    }
    return (
        query_line.alterations
            .map(function(alteration_cmd) {
                return isDatumWantedByOQLAlterationCommand(
                    alteration_cmd,
                    datum,
                    accessors
                );
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
            }, -1) === 1 // start off with unwanted
    );
}

function isDatumWantedByOQLAlterationCommand<T>(
    alt_cmd: Alteration,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
): number {
    /*
     *  Out: 1 if the datum is addressed by this command and wanted,
     *	0 if the datum is not addressed by this command,
     *	-1 if the datum is addressed by this command and rejected
     */
    switch (alt_cmd.alteration_type) {
        case 'cna':
            return isDatumWantedByOQLCNACommand(alt_cmd, datum, accessors);
        case 'mut':
            return isDatumWantedByOQLMUTCommand(alt_cmd, datum, accessors);
        case 'exp':
        case 'prot':
            return isDatumWantedByOQLEXPOrPROTCommand(
                alt_cmd,
                datum,
                accessors
            );
        case 'fusion':
            return isDatumWantedByFUSIONCommand(alt_cmd, datum, accessors);
        case 'any':
            return isDatumWantedByAnyTypeWithModifiersCommand(
                alt_cmd,
                datum,
                accessors
            );
    }
    return 0;
}

function isDatumWantedByAnyTypeWithModifiersCommand<T>(
    alt_cmd: AnyTypeWithModifiersCommand,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
    // if any modifier is false, its not wanted (-1)
    // else if any modifier is true, its wanted (1)
    // else its not addressed (0)
    let isWantedBySome = false;
    let isUnwantedBySome = false;

    for (var i = 0; i < alt_cmd.modifiers.length; i++) {
        var modifier = alt_cmd.modifiers[i];
        var datumWanted = null;
        switch (modifier) {
            case 'DRIVER':
                const cnaValue = accessors.cna(datum);
                datumWanted =
                    cnaValue !== 'gain' && // dont include gains or hetloss here
                    cnaValue !== 'hetloss' &&
                    isDatumWantedByOQLAlterationModifier(
                        modifier,
                        datum,
                        accessors
                    );
        }
        if (datumWanted === true) {
            isWantedBySome = true;
        } else if (datumWanted === false) {
            isUnwantedBySome = true;
            break;
        }
    }

    if (isUnwantedBySome) {
        return -1;
    } else if (isWantedBySome) {
        return 1;
    } else {
        return 0;
    }
}

// this command can ONLY return null or TRUE
function isDatumWantedByFUSIONCommand<T>(
    alt_cmd: FUSIONCommand,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
    /* Helper method for isDatumWantedByOQLAlterationCommand
     * In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var d_fusion = accessors.structuralVariant(datum); // null || true
    if (d_fusion === null) {
        // If no fusion data, it's not addressed
        return 0;
    } else {
        var match = true;
        // now filter by modifiers with AND logic
        for (var i = 0; i < alt_cmd.modifiers.length; i++) {
            const datumWanted = isDatumWantedByOQLAlterationModifier(
                alt_cmd.modifiers[i],
                datum,
                accessors
            );
            if (datumWanted !== null) {
                match = match && datumWanted;
            }
        }
        return 2 * +match - 1; // map 0,1 to -1,1
    }
}

function isDatumWantedByOQLCNACommand<T>(
    alt_cmd: CNACommand,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
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
        switch (alt_cmd.constr_rel) {
            case '=':
                match = d_cna === alt_cmd.constr_val!.toLowerCase();
                break;
            case undefined:
                break;
            default:
                var integer_copy_number = {
                    amp: 2,
                    gain: 1,
                    hetloss: -1,
                    homdel: -2,
                };
                var d_int_cna = integer_copy_number[d_cna];
                var alt_int_cna =
                    integer_copy_number[
                        alt_cmd.constr_val!.toLowerCase() as
                            | 'amp'
                            | 'gain'
                            | 'hetloss'
                            | 'homdel'
                    ];
                if (alt_cmd.constr_rel === '>') {
                    match = d_int_cna > alt_int_cna;
                } else if (alt_cmd.constr_rel === '>=') {
                    match = d_int_cna >= alt_int_cna;
                } else if (alt_cmd.constr_rel === '<') {
                    match = d_int_cna < alt_int_cna;
                } else if (alt_cmd.constr_rel === '<=') {
                    match = d_int_cna <= alt_int_cna;
                }
                break;
        }

        // now filter by modifiers with AND logic
        for (var i = 0; i < alt_cmd.modifiers.length; i++) {
            const datumWanted = isDatumWantedByOQLAlterationModifier(
                alt_cmd.modifiers[i],
                datum,
                accessors
            );
            if (datumWanted !== null) {
                match = match && datumWanted;
            }
        }
        return 2 * +match - 1; // map 0,1 to -1,1
    }
}

function isDatumWantedByOQLMUTCommand<T>(
    alt_cmd: MUTCommand<any>,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
    /*  Helper method for isDatumWantedByOQLAlterationCommand
     *  In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var d_mut_type = accessors.mut_type(datum);
    if (!d_mut_type) {
        // If no mut data on the datum, it's not addressed
        return 0;
    } else {
        d_mut_type = d_mut_type.toLowerCase() as any;

        var matches = false;
        // If no constraint relation ('=' or '!='), then every mutation matches
        // If no constraint type, then every mutation matches
        if (!alt_cmd.constr_rel || !alt_cmd.constr_type) {
            matches = true;
        }
        // Decide based on what type of mutation specification
        if (alt_cmd.constr_type === 'class') {
            // Matching on type
            var target_type = alt_cmd.constr_val.toLowerCase();
            // It matches if the type of mutation matches, or if
            //  the target is truncating and the mutation is anything but missense or inframe
            matches =
                d_mut_type === target_type ||
                (target_type === 'trunc' &&
                    d_mut_type !== 'missense' &&
                    d_mut_type !== 'inframe');
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
            matches =
                target_position >= d_mut_range[0] &&
                target_position <= d_mut_range[1];
            if (alt_cmd.constr_rel === '!=') {
                matches = !matches;
            }
        } else if (alt_cmd.constr_type === 'name') {
            // Matching on amino acid change code
            var d_mut_name = accessors.mut_amino_acid_change(datum);
            if (!d_mut_name) {
                // If no amino acid change data, reject
                return -1;
            }
            d_mut_name = d_mut_name.toLowerCase();
            var target_name = alt_cmd.constr_val.toLowerCase();
            matches = target_name === d_mut_name;
            if (alt_cmd.constr_rel === '!=') {
                matches = !matches;
            }
        }

        // now filter by modifiers with AND logic
        for (var i = 0; i < alt_cmd.modifiers.length; i++) {
            const datumWanted = isDatumWantedByOQLMutationModifier(
                alt_cmd.modifiers[i],
                datum,
                accessors
            );
            if (datumWanted !== null) {
                matches = matches && datumWanted;
            }
        }

        return 2 * +matches - 1; // return 1 if true, -1 if false
    }
}

function isDatumWantedByOQLMutationModifier<T>(
    modifier: MutationModifier,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
    switch (modifier) {
        case 'GERMLINE':
        case 'SOMATIC':
            return accessors.mut_status(datum) === modifier.toLowerCase();
        default:
            return isDatumWantedByOQLAlterationModifier(
                modifier,
                datum,
                accessors
            );
    }
}

function isDatumWantedByOQLAlterationModifier<T>(
    modifier: any,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
    switch (modifier) {
        case 'DRIVER':
            return accessors.is_driver(datum);
        default:
            return false;
    }
}

function isDatumWantedByOQLEXPOrPROTCommand<T>(
    alt_cmd: EXPCommand | PROTCommand,
    datum: T,
    accessors: IAccessorsForOqlFilter<T>
) {
    /*  Helper method for isDatumWantedByOQLAlterationCommand
     *  In/Out: See isDatumWantedByOQLAlterationCommand
     */
    var level = accessors[alt_cmd.alteration_type === 'exp' ? 'exp' : 'prot'](
        datum
    );
    if (level === null) {
        // If no data, it's not addressed
        return 0;
    } else {
        // Otherwise, check it in relation to target
        var target_level = alt_cmd.constr_val;
        var target_rel = alt_cmd.constr_rel;
        var match;
        var direction = undefined;
        if (
            (target_rel === '<' && level < target_level) ||
            (target_rel === '<=' && level <= target_level)
        ) {
            match = 1;
            direction = -1;
        } else if (
            (target_rel === '>' && level > target_level) ||
            (target_rel === '>=' && level >= target_level)
        ) {
            match = 1;
            direction = 1;
        } else {
            match = -1;
        }

        if (match > 0) {
            (datum as any).alterationSubType =
                direction && direction > 0 ? 'high' : 'low';
        }

        return match;
    }
}

function filterData<T extends Datum>(
    oql_query: string,
    data: Datum[],
    _accessors: AccessorsForOqlFilter,
    opt_default_oql = '',
    opt_by_oql_line?: any
) {
    /*
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
    var null_fn = function() {
        return null;
    };

    // var required_accessors = ['gene', 'cna', 'mut_type', 'mut_position',
    //     'mut_amino_acid_change', 'exp', 'prot', 'fusion'];
    // default every non-given accessor function to null
    var accessors = _accessors;
    // for (var i = 0; i < required_accessors.length; i++) {
    //     AccessorsForOqlFilter[required_accessors[i]] = _accessors[required_accessors[i]] || null_fn;
    // }

    for (var i = 0; i < data.length; i++) {
        (data[
            i
        ] as any).molecularProfileAlterationType = accessors.molecularAlterationType(
            data[i].molecularProfileId
        );
        annotateAlterationTypes(data[i] as any, accessors);
    }

    function applyToGeneLines(geneLineFunction: any) {
        return function(line: any): any {
            if (isMergedTrackLine(line)) {
                return {
                    ...line,
                    list: line.list.map(applyToGeneLines(geneLineFunction)),
                };
            } else {
                return geneLineFunction(line);
            }
        };
    }

    const queryParsingFunction =
        opt_by_oql_line === 'mergedtrack'
            ? parseMergedTrackOQLQuery
            : parseOQLQuery;
    const parsed_query = queryParsingFunction(oql_query, opt_default_oql).map(
        applyToGeneLines((q_line: any) => ({
            ...q_line,
            gene: q_line.gene.toUpperCase(),
        }))
    );

    if (opt_by_oql_line) {
        return parsed_query.map(
            applyToGeneLines((query_line: SingleGeneQuery) => ({
                gene: query_line.gene,
                parsed_oql_line: query_line,
                oql_line: unparseOQLQueryLine(query_line),
                data: data.filter(datum => {
                    return isDatumWantedByOQLLine(
                        query_line,
                        datum,
                        accessors.gene(datum).toUpperCase(),
                        accessors
                    );
                }),
            }))
        );
    } else {
        return data.filter(function(datum) {
            return isDatumWantedByOQL(parsed_query, datum, accessors);
        });
    }
}

export function filterCBioPortalWebServiceData<
    T extends Mutation | NumericGeneMolecularData | StructuralVariant
>(
    oql_query: string,
    data: T[],
    accessors: any,
    default_oql?: string
): (T & ExtendedAlteration)[] {
    /* Wrapper method for filterData that has the cBioPortal default accessor functions
     * Note that for use, the input data must have the field 'genetic_alteration_type,' which
     * takes one of the following values:
     *	- MUTATION_EXTENDED
     *	- COPY_NUMBER_ALTERATION
     *	- MRNA_EXPRESSION
     *	- PROTEIN_LEVEL
     */

    return filterData(oql_query, data, accessors, default_oql);
}

export function filterCBioPortalWebServiceDataByOQLLine(
    oql_query: string,
    data: (
        | AnnotatedMutation
        | NumericGeneMolecularData
        | AnnotatedStructuralVariant)[],
    accessors: any,
    default_oql?: string
): OQLLineFilterOutput<ExtendedAlteration & AnnotatedMutation>[];
export function filterCBioPortalWebServiceDataByOQLLine(
    oql_query: string,
    data: (Mutation | NumericGeneMolecularData | AnnotatedStructuralVariant)[],
    accessors: any,
    default_oql?: string
): OQLLineFilterOutput<ExtendedAlteration>[];

export function filterCBioPortalWebServiceDataByOQLLine(
    oql_query: string,
    data:
        | ((
              | AnnotatedMutation
              | NumericGeneMolecularData
              | AnnotatedStructuralVariant
          )[])
        | ((Mutation | NumericGeneMolecularData | StructuralVariant)[]),
    accessors: any,
    default_oql?: string
) {
    /* Wrapper method for filterData that has the cBioPortal default accessor functions
     * Note that for use, the input data must have the field 'genetic_alteration_type,' which
     * takes one of the following values:
     *	- MUTATION_EXTENDED
     *	- COPY_NUMBER_ALTERATION
     *	- MRNA_EXPRESSION
     *	- PROTEIN_LEVEL
     */

    return filterData(oql_query, data, accessors, default_oql, 'gene');
}

export function filterCBioPortalWebServiceDataByUnflattenedOQLLine(
    oql_query: string,
    data: (
        | AnnotatedMutation
        | NumericGeneMolecularData
        | AnnotatedStructuralVariant)[],
    accessors: any,
    default_oql?: string
): UnflattenedOQLLineFilterOutput<ExtendedAlteration & AnnotatedMutation>[] {
    /* Wrapper method for filterData that has the cBioPortal default accessor functions
     * Note that for use, the input data must have the field 'genetic_alteration_type,' which
     * takes one of the following values:
     *	- MUTATION_EXTENDED
     *	- COPY_NUMBER_ALTERATION
     *	- MRNA_EXPRESSION
     *	- PROTEIN_LEVEL
     */

    return filterData(oql_query, data, accessors, default_oql, 'mergedtrack');
}

export function uniqueGenesInOQLQuery(oql_query: string): string[] {
    var parse_result = parseOQLQuery(oql_query);
    var genes = parse_result
        .filter(function(q_line) {
            return q_line.gene.toLowerCase() !== 'datatypes';
        })
        .map(function(q_line) {
            return q_line.gene.toUpperCase();
        });
    var unique_genes_set: { [gene: string]: boolean } = {};
    for (var i = 0; i < genes.length; i++) {
        unique_genes_set[genes[i]] = true;
    }
    return Object.keys(unique_genes_set);
}
