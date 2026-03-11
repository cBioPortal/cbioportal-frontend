import * as $ from 'jquery';
import {
    GeneticAlterationRuleParams,
    IGeneticAlterationRuleSetParams,
    RuleSetParams,
    RuleSetType,
} from 'oncoprintjs';
import { DEFAULT_GREY, hexToRGBA } from 'shared/lib/Colors';
import { ASCN_ONCOPRINT_CN_COLORS } from 'shared/lib/ASCNUtils';
import _ from 'lodash';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    MRNA_COLOR_HIGH,
    MRNA_COLOR_LOW,
    STRUCTURAL_VARIANT_COLOR,
    MUT_COLOR_GERMLINE,
    MUT_COLOR_INFRAME,
    MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_OTHER,
    MUT_COLOR_OTHER_PASSENGER,
    MUT_COLOR_PROMOTER,
    MUT_COLOR_PROMOTER_PASSENGER,
    MUT_COLOR_SPLICE,
    MUT_COLOR_SPLICE_PASSENGER,
    MUT_COLOR_TRUNC,
    MUT_COLOR_TRUNC_PASSENGER,
    PROT_COLOR_HIGH,
    PROT_COLOR_LOW,
    STRUCTURAL_VARIANT_PASSENGER_COLOR,
} from 'cbioportal-frontend-commons';
// Feed this in as

const MUTATION_LEGEND_ORDER = 0;
const STRUCTURAL_VARIANT_LEGEND_ORDER = 1;
const GERMLINE_LEGEND_ORDER = 2;
const AMP_LEGEND_ORDER = 10;
const GAIN_LEGEND_ORDER = 11;
const HOMDEL_LEGEND_ORDER = 12;
const HETLOSS_LEGEND_ORDER = 13;
const MRNA_HIGH_LEGEND_ORDER = 20;
const MRNA_LOW_LEGEND_ORDER = 21;
const PROT_HIGH_LEGEND_ORDER = 31;
const PROT_LOW_LEGEND_ORDER = 32;

enum ShapeId {
    defaultGrayRectangle = 'defaultGrayRectangle',

    ampRectangle = 'ampRectangle',
    gainRectangle = 'gainRectangle',
    homdelRectangle = 'homdelRectangle',
    hetlossRectangle = 'hetlossRectangle',

    mrnaHighRectangle = 'mrnaHighRectangle',
    mrnaLowRectangle = 'mrnaLowRectangle',

    protHighRectangle = 'protHighRectangle',
    protLowRectangle = 'protLowRectangle',

    structuralVariantDriverRectangle = 'structuralVariantDriverRectangle',
    structuralVariantVUSRectangle = 'structuralVariantVUSRectangle',

    germlineRectangle = 'germlineRectangle',

    clonalIndicatorRectangle = 'clonalIndicatorRectangle',
    subclonalIndicatorRectangle = 'subclonalIndicatorRectangle',

    ascnCNBlueRectangle = 'ascnCNBlueRectangle',
    ascnCNLightBlueRectangle = 'ascnCNLightBlueRectangle',
    ascnCNLightPurpleRectangle = 'ascnCNLightPurpleRectangle',
    ascnCNPurpleRectangle = 'ascnCNPurpleRectangle',
    ascnCNWhiteRectangle = 'ascnCNWhiteRectangle',
    ascnCNPinkRectangle = 'ascnCNPinkRectangle',
    ascnCNRedRectangle = 'ascnCNRedRectangle',

    missenseMutationDriverRectangle = 'missenseMutationDriverRectangle',
    missenseMutationVUSRectangle = 'missenseMutationVUSRectangle',
    otherMutationDriverRectangle = 'otherMutationDriverRectangle',
    otherMutationVUSRectangle = 'otherMutationVUSRectangle',
    promoterMutationDriverRectangle = 'promoterMutationDriverRectangle',
    promoterMutationVUSRectangle = 'promoterMutationVUSRectangle',
    truncatingMutationDriverRectangle = 'truncatingMutationDriverRectangle',
    truncatingMutationVUSRectangle = 'truncatingMutationVUSRectangle',
    inframeMutationDriverRectangle = 'inframeMutationDriverRectangle',
    inframeMutationVUSRectangle = 'inframeMutationVUSRectangle',
    spliceMutationDriverRectangle = 'spliceMutationDriverRectangle',
    spliceMutationVUSRectangle = 'spliceMutationVUSRectangle',
}

const shapeBank = {
    [ShapeId.defaultGrayRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(DEFAULT_GREY),
        z: 1,
    },
    [ShapeId.ampRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(CNA_COLOR_AMP),
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.gainRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(CNA_COLOR_GAIN),
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.homdelRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(CNA_COLOR_HOMDEL),
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.hetlossRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(CNA_COLOR_HETLOSS),
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.mrnaHighRectangle]: {
        type: 'rectangle',
        fill: [0, 0, 0, 0] as [number, number, number, number],
        stroke: hexToRGBA(MRNA_COLOR_HIGH),
        'stroke-width': 2,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 3,
    },
    [ShapeId.mrnaLowRectangle]: {
        type: 'rectangle',
        fill: [0, 0, 0, 0] as [number, number, number, number],
        stroke: hexToRGBA(MRNA_COLOR_LOW),
        'stroke-width': 2,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 3,
    },
    [ShapeId.protHighRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(PROT_COLOR_HIGH),
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        z: 4,
    },
    [ShapeId.protLowRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(PROT_COLOR_LOW),
        x: 0,
        y: 80,
        width: 100,
        height: 20,
        z: 4,
    },
    [ShapeId.structuralVariantDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(STRUCTURAL_VARIANT_COLOR),
        x: 0,
        y: 20,
        width: 100,
        height: 60,
        z: 5,
    },
    [ShapeId.structuralVariantVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(STRUCTURAL_VARIANT_PASSENGER_COLOR),
        x: 0,
        y: 20,
        width: 100,
        height: 60,
        z: 5,
    },
    [ShapeId.germlineRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_GERMLINE),
        x: 0,
        y: 46,
        width: 100,
        height: 8,
        z: 7,
    },
    [ShapeId.clonalIndicatorRectangle]: {
        type: 'rectangle',
        fill: [0, 119, 182, 1] as [number, number, number, number],
        x: 0,
        y: 0,
        width: 100,
        height: 16.67,
        z: 8,
    },
    [ShapeId.subclonalIndicatorRectangle]: {
        type: 'rectangle',
        fill: [255, 140, 0, 1] as [number, number, number, number],
        x: 0,
        y: 0,
        width: 100,
        height: 16.67,
        z: 8,
    },
    // ASCN CN call indicator — full cell, same size/placement as amp/homdel
    [ShapeId.ascnCNBlueRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.BLUE) as [
            number,
            number,
            number,
            number
        ],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.ascnCNLightBlueRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.LIGHT_BLUE) as [
            number,
            number,
            number,
            number
        ],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.ascnCNLightPurpleRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.LIGHT_PURPLE) as [
            number,
            number,
            number,
            number
        ],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.ascnCNPurpleRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.PURPLE) as [
            number,
            number,
            number,
            number
        ],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.ascnCNWhiteRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.WHITE) as [
            number,
            number,
            number,
            number
        ],
        stroke: hexToRGBA('#cccccc') as [number, number, number, number],
        'stroke-width': 0.5,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.ascnCNPinkRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.PINK) as [
            number,
            number,
            number,
            number
        ],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.ascnCNRedRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(ASCN_ONCOPRINT_CN_COLORS.RED) as [
            number,
            number,
            number,
            number
        ],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.spliceMutationDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_SPLICE),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.spliceMutationVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_SPLICE_PASSENGER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.missenseMutationDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_MISSENSE),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.missenseMutationVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_MISSENSE_PASSENGER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.otherMutationDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_OTHER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.otherMutationVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_OTHER_PASSENGER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.promoterMutationDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_PROMOTER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.promoterMutationVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_PROMOTER_PASSENGER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.truncatingMutationDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_TRUNC),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.truncatingMutationVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_TRUNC_PASSENGER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.inframeMutationDriverRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_INFRAME),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.inframeMutationVUSRectangle]: {
        type: 'rectangle',
        fill: hexToRGBA(MUT_COLOR_INFRAME_PASSENGER),
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
};

const non_mutation_rule_params: GeneticAlterationRuleParams = {
    // Default: gray rectangle
    always: {
        shapes: [shapeBank[ShapeId.defaultGrayRectangle]],
        legend_label: 'No alterations',
        legend_order: Number.POSITIVE_INFINITY, // put at the end always
    },
    conditional: {
        // Copy number alteration
        disp_cna: {
            'amp_rec,amp': {
                shapes: [shapeBank[ShapeId.ampRectangle]],
                legend_label: 'Amplification',
                legend_order: AMP_LEGEND_ORDER,
            },
            'gain_rec,gain': {
                shapes: [shapeBank[ShapeId.gainRectangle]],
                legend_label: 'Gain',
                legend_order: GAIN_LEGEND_ORDER,
            },
            'homdel_rec,homdel': {
                shapes: [shapeBank[ShapeId.homdelRectangle]],
                legend_label: 'Deep Deletion',
                legend_order: HOMDEL_LEGEND_ORDER,
            },
            'hetloss_rec,hetloss': {
                shapes: [shapeBank[ShapeId.hetlossRectangle]],
                legend_label: 'Shallow Deletion',
                legend_order: HETLOSS_LEGEND_ORDER,
            },
        },
        // mRNA regulation
        disp_mrna: {
            // Light red outline for High
            high: {
                shapes: [shapeBank[ShapeId.mrnaHighRectangle]],
                legend_label: 'mRNA High',
                legend_order: MRNA_HIGH_LEGEND_ORDER,
            },
            // Light blue outline for downregulation
            low: {
                shapes: [shapeBank[ShapeId.mrnaLowRectangle]],
                legend_label: 'mRNA Low',
                legend_order: MRNA_LOW_LEGEND_ORDER,
            },
        },
        // protein expression regulation
        disp_prot: {
            // small up arrow for upregulated
            high: {
                shapes: [shapeBank[ShapeId.protHighRectangle]],
                legend_label: 'Protein High',
                legend_order: PROT_HIGH_LEGEND_ORDER,
            },
            // small down arrow for upregulated
            low: {
                shapes: [shapeBank[ShapeId.protLowRectangle]],
                legend_label: 'Protein Low',
                legend_order: PROT_LOW_LEGEND_ORDER,
            },
        },
    },
};

const CLONAL_LEGEND_ORDER = -1; // show before mutations in legend
const ASCN_CN_LEGEND_ORDER = -2; // show before clonal in legend

export const ascn_cn_rule_params = {
    disp_ascn_cn: {
        [ASCN_ONCOPRINT_CN_COLORS.BLUE]: {
            shapes: [shapeBank[ShapeId.ascnCNBlueRectangle]],
            legend_label: 'Homozygous Deletion',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
        [ASCN_ONCOPRINT_CN_COLORS.LIGHT_BLUE]: {
            shapes: [shapeBank[ShapeId.ascnCNLightBlueRectangle]],
            legend_label: 'Heterozygous Loss / CNLOH',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
        [ASCN_ONCOPRINT_CN_COLORS.LIGHT_PURPLE]: {
            shapes: [shapeBank[ShapeId.ascnCNLightPurpleRectangle]],
            legend_label: 'CNLOH (Gain)',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
        [ASCN_ONCOPRINT_CN_COLORS.PURPLE]: {
            shapes: [shapeBank[ShapeId.ascnCNPurpleRectangle]],
            legend_label: 'AMP with LOH',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
        [ASCN_ONCOPRINT_CN_COLORS.WHITE]: {
            shapes: [shapeBank[ShapeId.ascnCNWhiteRectangle]],
            legend_label: 'Diploid',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
        [ASCN_ONCOPRINT_CN_COLORS.PINK]: {
            shapes: [shapeBank[ShapeId.ascnCNPinkRectangle]],
            legend_label: 'Gain',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
        [ASCN_ONCOPRINT_CN_COLORS.RED]: {
            shapes: [shapeBank[ShapeId.ascnCNRedRectangle]],
            legend_label: 'Amplification',
            legend_order: ASCN_CN_LEGEND_ORDER,
        },
    },
};

const clonal_rule_params = {
    disp_clonal: {
        CLONAL: {
            shapes: [shapeBank[ShapeId.clonalIndicatorRectangle]],
            legend_label: 'Clonal',
            legend_order: CLONAL_LEGEND_ORDER,
        },
        SUBCLONAL: {
            shapes: [shapeBank[ShapeId.subclonalIndicatorRectangle]],
            legend_label: 'Subclonal',
            legend_order: CLONAL_LEGEND_ORDER,
        },
    },
};

export const germline_rule_params = {
    // germline
    disp_germ: {
        // white stripe in the middle
        true: {
            shapes: [shapeBank[ShapeId.germlineRectangle]],
            legend_label: 'Germline Mutation',
            legend_order: GERMLINE_LEGEND_ORDER,
        },
    },
};

const structuralVariant_rule_params_no_recurrence = {
    // structural variant
    disp_structuralVariant: {
        // tall inset purple rectangle for structural variant
        'sv_rec,sv': {
            shapes: [shapeBank[ShapeId.structuralVariantDriverRectangle]],
            legend_label: 'Structural Variant',
            legend_order: STRUCTURAL_VARIANT_LEGEND_ORDER,
        },
    },
};

const structuralVariant_rule_params_recurrence = {
    // structural variant
    disp_structuralVariant: {
        // tall inset purple rectangle for structural variant
        sv_rec: {
            shapes: [shapeBank[ShapeId.structuralVariantDriverRectangle]],
            legend_label: 'Structural Variant (putative driver)',
            legend_order: STRUCTURAL_VARIANT_LEGEND_ORDER,
        },
        sv: {
            shapes: [shapeBank[ShapeId.structuralVariantVUSRectangle]],
            legend_label: 'Structural Variant (unknown significance)',
            legend_order: STRUCTURAL_VARIANT_LEGEND_ORDER,
        },
    },
};

const base_genetic_rule_set_params: Partial<IGeneticAlterationRuleSetParams> = {
    type: RuleSetType.GENE,
    legend_label: 'Genetic Alteration',
    na_legend_label: 'Not profiled',
    legend_base_color: hexToRGBA(DEFAULT_GREY),
};

export const genetic_rule_set_same_color_for_all_no_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign(
                {},
                non_mutation_rule_params.conditional,
                structuralVariant_rule_params_no_recurrence,
                {
                    disp_mut: {
                        'splice,trunc,inframe,missense,promoter,other,splice_rec,trunc_rec,inframe_rec,missense_rec,promoter_rec,other_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.missenseMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                    },
                } as GeneticAlterationRuleParams['conditional']
            ),
        },
    }
) as IGeneticAlterationRuleSetParams;

export const genetic_rule_set_same_color_for_all_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign(
                {},
                non_mutation_rule_params.conditional,
                structuralVariant_rule_params_recurrence,
                {
                    disp_mut: {
                        'splice_rec,missense_rec,inframe_rec,trunc_rec,promoter_rec,other_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.missenseMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        'splice,missense,inframe,trunc,promoter,other': {
                            shapes: [
                                shapeBank[ShapeId.missenseMutationVUSRectangle],
                            ],
                            legend_label: 'Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                    },
                } as GeneticAlterationRuleParams['conditional']
            ),
        },
    }
) as IGeneticAlterationRuleSetParams;

export const genetic_rule_set_different_colors_no_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign(
                {},
                non_mutation_rule_params.conditional,
                structuralVariant_rule_params_no_recurrence,
                {
                    disp_mut: {
                        'other,other_rec': {
                            shapes: [
                                shapeBank[ShapeId.otherMutationDriverRectangle],
                            ],
                            legend_label: 'Other Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        'promoter,promoter_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.promoterMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Promoter Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        'splice,splice_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.spliceMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Splice Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        'trunc,trunc_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.truncatingMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Truncating Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        'inframe,inframe_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.inframeMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Inframe Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        'missense,missense_rec': {
                            shapes: [
                                shapeBank[
                                    ShapeId.missenseMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Missense Mutation',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                    },
                } as GeneticAlterationRuleParams['conditional']
            ),
        },
    }
) as IGeneticAlterationRuleSetParams;

export const genetic_rule_set_different_colors_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign(
                {},
                non_mutation_rule_params.conditional,
                structuralVariant_rule_params_recurrence,
                {
                    disp_mut: {
                        other_rec: {
                            shapes: [
                                shapeBank[ShapeId.otherMutationDriverRectangle],
                            ],
                            legend_label: 'Other Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        other: {
                            shapes: [
                                shapeBank[ShapeId.otherMutationVUSRectangle],
                            ],
                            legend_label:
                                'Other Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        promoter_rec: {
                            shapes: [
                                shapeBank[
                                    ShapeId.promoterMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Promoter Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        promoter: {
                            shapes: [
                                shapeBank[ShapeId.promoterMutationVUSRectangle],
                            ],
                            legend_label:
                                'Promoter Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        splice_rec: {
                            shapes: [
                                shapeBank[
                                    ShapeId.spliceMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Splice Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        splice: {
                            shapes: [
                                shapeBank[ShapeId.spliceMutationVUSRectangle],
                            ],
                            legend_label:
                                'Splice Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        trunc_rec: {
                            shapes: [
                                shapeBank[
                                    ShapeId.truncatingMutationDriverRectangle
                                ],
                            ],
                            legend_label:
                                'Truncating Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        trunc: {
                            shapes: [
                                shapeBank[
                                    ShapeId.truncatingMutationVUSRectangle
                                ],
                            ],
                            legend_label:
                                'Truncating Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        inframe_rec: {
                            shapes: [
                                shapeBank[
                                    ShapeId.inframeMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Inframe Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        inframe: {
                            shapes: [
                                shapeBank[ShapeId.inframeMutationVUSRectangle],
                            ],
                            legend_label:
                                'Inframe Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        missense_rec: {
                            shapes: [
                                shapeBank[
                                    ShapeId.missenseMutationDriverRectangle
                                ],
                            ],
                            legend_label: 'Missense Mutation (putative driver)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                        missense: {
                            shapes: [
                                shapeBank[ShapeId.missenseMutationVUSRectangle],
                            ],
                            legend_label:
                                'Missense Mutation (unknown significance)',
                            legend_order: MUTATION_LEGEND_ORDER,
                        },
                    },
                } as GeneticAlterationRuleParams['conditional']
            ),
        },
    }
) as IGeneticAlterationRuleSetParams;

// ─── Clonal mutation shapes (for FACETS shape rendering) ────────────────────
// When FACETS overlay is enabled, mutation boxes change shape based on clonal
// status: upward-pointing triangle for CLONAL, ellipse for SUBCLONAL.
// The disp_mut_clonal datum field encodes "{mutType}_{CLONAL|SUBCLONAL}" or
// just "{mutType}" (fallback rectangle) when no clonal data is available.

const MUT_Y_TOP = 33.33;
const MUT_Y_BOTTOM = 66.67;
const MUT_HEIGHT = MUT_Y_BOTTOM - MUT_Y_TOP;
const MUT_Z = 6;

function clonalTriangleShape(color: string) {
    return {
        type: 'triangle',
        fill: hexToRGBA(color),
        // upward-pointing: apex at top-center, base at bottom
        x1: 50,
        y1: MUT_Y_TOP,
        x2: 0,
        y2: MUT_Y_BOTTOM,
        x3: 100,
        y3: MUT_Y_BOTTOM,
        z: MUT_Z,
    };
}

function subclonalEllipseShape(color: string) {
    return {
        type: 'ellipse',
        fill: hexToRGBA(color),
        x: 10,
        y: MUT_Y_TOP + MUT_HEIGHT * 0.05,
        width: 80,
        height: MUT_HEIGHT * 0.9,
        z: MUT_Z,
    };
}

function fallbackRectShape(color: string) {
    return {
        type: 'rectangle',
        fill: hexToRGBA(color),
        x: 0,
        y: MUT_Y_TOP,
        width: 100,
        height: MUT_HEIGHT,
        z: MUT_Z,
    };
}

function makeClonalMutRules(
    mutKey: string,
    driverColor: string,
    vusColor: string,
    legendLabel: string
) {
    return {
        [`${mutKey}_rec_CLONAL`]: {
            shapes: [clonalTriangleShape(driverColor)],
            legend_label: `${legendLabel} (putative driver, clonal)`,
            legend_order: MUTATION_LEGEND_ORDER,
        },
        [`${mutKey}_rec_SUBCLONAL`]: {
            shapes: [subclonalEllipseShape(driverColor)],
            legend_label: `${legendLabel} (putative driver, subclonal)`,
            legend_order: MUTATION_LEGEND_ORDER,
        },
        // fallback when no clonal data is available
        [`${mutKey}_rec`]: {
            shapes: [fallbackRectShape(driverColor)],
            legend_label: `${legendLabel} (putative driver)`,
            legend_order: MUTATION_LEGEND_ORDER,
        },
        [`${mutKey}_CLONAL`]: {
            shapes: [clonalTriangleShape(vusColor)],
            legend_label: `${legendLabel} (unknown significance, clonal)`,
            legend_order: MUTATION_LEGEND_ORDER,
        },
        [`${mutKey}_SUBCLONAL`]: {
            shapes: [subclonalEllipseShape(vusColor)],
            legend_label: `${legendLabel} (unknown significance, subclonal)`,
            legend_order: MUTATION_LEGEND_ORDER,
        },
        // fallback when no clonal data is available
        [mutKey]: {
            shapes: [fallbackRectShape(vusColor)],
            legend_label: `${legendLabel} (unknown significance)`,
            legend_order: MUTATION_LEGEND_ORDER,
        },
    };
}

/**
 * Returns rule params for `disp_mut_clonal` that render mutation boxes as
 * triangles (clonal) or ellipses (subclonal), keyed by mutation type and
 * driver status.  When no clonal data is present the fallback value equals
 * the plain disp_mut value and renders a rectangle (identical to normal mode).
 */
export function getClonalMutationRuleParams(
    distinguishMutationType: boolean,
    distinguishDrivers: boolean
): GeneticAlterationRuleParams['conditional'] {
    if (!distinguishMutationType) {
        if (!distinguishDrivers) {
            const allKeys = [
                'missense_rec',
                'splice_rec',
                'trunc_rec',
                'inframe_rec',
                'promoter_rec',
                'other_rec',
                'missense',
                'splice',
                'trunc',
                'inframe',
                'promoter',
                'other',
            ];
            return {
                disp_mut_clonal: {
                    [allKeys.map(k => `${k}_CLONAL`).join(',')]: {
                        shapes: [clonalTriangleShape(MUT_COLOR_MISSENSE)],
                        legend_label: 'Mutation (clonal)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [allKeys.map(k => `${k}_SUBCLONAL`).join(',')]: {
                        shapes: [subclonalEllipseShape(MUT_COLOR_MISSENSE)],
                        legend_label: 'Mutation (subclonal)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [allKeys.join(',')]: {
                        shapes: [fallbackRectShape(MUT_COLOR_MISSENSE)],
                        legend_label: 'Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                },
            } as GeneticAlterationRuleParams['conditional'];
        } else {
            const driverKeys = [
                'missense_rec',
                'splice_rec',
                'trunc_rec',
                'inframe_rec',
                'promoter_rec',
                'other_rec',
            ];
            const vusKeys = [
                'missense',
                'splice',
                'trunc',
                'inframe',
                'promoter',
                'other',
            ];
            return {
                disp_mut_clonal: {
                    [driverKeys.map(k => `${k}_CLONAL`).join(',')]: {
                        shapes: [clonalTriangleShape(MUT_COLOR_MISSENSE)],
                        legend_label: 'Mutation (putative driver, clonal)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [driverKeys.map(k => `${k}_SUBCLONAL`).join(',')]: {
                        shapes: [subclonalEllipseShape(MUT_COLOR_MISSENSE)],
                        legend_label: 'Mutation (putative driver, subclonal)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [driverKeys.join(',')]: {
                        shapes: [fallbackRectShape(MUT_COLOR_MISSENSE)],
                        legend_label: 'Mutation (putative driver)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [vusKeys.map(k => `${k}_CLONAL`).join(',')]: {
                        shapes: [
                            clonalTriangleShape(MUT_COLOR_MISSENSE_PASSENGER),
                        ],
                        legend_label: 'Mutation (unknown significance, clonal)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [vusKeys.map(k => `${k}_SUBCLONAL`).join(',')]: {
                        shapes: [
                            subclonalEllipseShape(MUT_COLOR_MISSENSE_PASSENGER),
                        ],
                        legend_label:
                            'Mutation (unknown significance, subclonal)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    [vusKeys.join(',')]: {
                        shapes: [
                            fallbackRectShape(MUT_COLOR_MISSENSE_PASSENGER),
                        ],
                        legend_label: 'Mutation (unknown significance)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                },
            } as GeneticAlterationRuleParams['conditional'];
        }
    }

    // distinguishMutationType = true: each type gets its own color.
    return {
        disp_mut_clonal: {
            ...makeClonalMutRules(
                'missense',
                MUT_COLOR_MISSENSE,
                MUT_COLOR_MISSENSE_PASSENGER,
                'Missense Mutation'
            ),
            ...makeClonalMutRules(
                'splice',
                MUT_COLOR_SPLICE,
                MUT_COLOR_SPLICE_PASSENGER,
                'Splice Mutation'
            ),
            ...makeClonalMutRules(
                'trunc',
                MUT_COLOR_TRUNC,
                MUT_COLOR_TRUNC_PASSENGER,
                'Truncating Mutation'
            ),
            ...makeClonalMutRules(
                'inframe',
                MUT_COLOR_INFRAME,
                MUT_COLOR_INFRAME_PASSENGER,
                'Inframe Mutation'
            ),
            ...makeClonalMutRules(
                'promoter',
                MUT_COLOR_PROMOTER,
                MUT_COLOR_PROMOTER_PASSENGER,
                'Promoter Mutation'
            ),
            ...makeClonalMutRules(
                'other',
                MUT_COLOR_OTHER,
                MUT_COLOR_OTHER_PASSENGER,
                'Other Mutation'
            ),
        },
    } as GeneticAlterationRuleParams['conditional'];
}
