import * as $ from 'jquery';
import {
    GeneticAlterationRuleParams,
    IGeneticAlterationRuleSetParams,
    RuleSetParams,
    RuleSetType,
} from 'oncoprintjs';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    DEFAULT_GREY,
    MRNA_COLOR_HIGH,
    MRNA_COLOR_LOW,
    MUT_COLOR_FUSION,
    MUT_COLOR_GERMLINE,
    MUT_COLOR_INFRAME,
    MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_OTHER,
    MUT_COLOR_PROMOTER,
    MUT_COLOR_TRUNC,
    MUT_COLOR_TRUNC_PASSENGER,
    PROT_COLOR_HIGH,
    PROT_COLOR_LOW,
} from 'shared/lib/Colors';
import _ from 'lodash';
// Feed this in as

const MUTATION_LEGEND_ORDER = 0;
const FUSION_LEGEND_ORDER = 1;
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

    fusionRectangle = 'fusionRectangle',

    germlineRectangle = 'germlineRectangle',

    missenseMutationDriverRectangle = 'missenseMutationDriverRectangle',
    missenseMutationVUSRectangle = 'missenseMutationVUSRectangle',
    otherMutationRectangle = 'otherMutationRectangle',
    promoterMutationRectangle = 'promoterMutationRectangle',
    truncatingMutationDriverRectangle = 'truncatingMutationDriverRectangle',
    truncatingMutationVUSRectangle = 'truncatingMutationVUSRectangle',
    inframeMutationDriverRectangle = 'inframeMutationDriverRectangle',
    inframeMutationVUSRectangle = 'inframeMutationVUSRectangle',
}

const shapeBank = {
    [ShapeId.defaultGrayRectangle]: {
        type: 'rectangle',
        fill: DEFAULT_GREY,
        z: 1,
    },
    [ShapeId.ampRectangle]: {
        type: 'rectangle',
        fill: CNA_COLOR_AMP,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.gainRectangle]: {
        type: 'rectangle',
        fill: CNA_COLOR_GAIN,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.homdelRectangle]: {
        type: 'rectangle',
        fill: CNA_COLOR_HOMDEL,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.hetlossRectangle]: {
        type: 'rectangle',
        fill: CNA_COLOR_HETLOSS,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 2,
    },
    [ShapeId.mrnaHighRectangle]: {
        type: 'rectangle',
        fill: 'rgba(0, 0, 0, 0)',
        stroke: MRNA_COLOR_HIGH,
        'stroke-width': 2,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 3,
    },
    [ShapeId.mrnaLowRectangle]: {
        type: 'rectangle',
        fill: 'rgba(0, 0, 0, 0)',
        stroke: MRNA_COLOR_LOW,
        'stroke-width': 2,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        z: 3,
    },
    [ShapeId.protHighRectangle]: {
        type: 'rectangle',
        fill: PROT_COLOR_HIGH,
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        z: 4,
    },
    [ShapeId.protLowRectangle]: {
        type: 'rectangle',
        fill: PROT_COLOR_LOW,
        x: 0,
        y: 80,
        width: 100,
        height: 20,
        z: 4,
    },
    [ShapeId.fusionRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_FUSION,
        x: 0,
        y: 20,
        width: 100,
        height: 60,
        z: 5,
    },
    [ShapeId.germlineRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_GERMLINE,
        x: 0,
        y: 46,
        width: 100,
        height: 8,
        z: 7,
    },
    [ShapeId.missenseMutationDriverRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_MISSENSE,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.missenseMutationVUSRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_MISSENSE_PASSENGER,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.otherMutationRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_OTHER,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.promoterMutationRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_PROMOTER,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.truncatingMutationDriverRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_TRUNC,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.truncatingMutationVUSRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_TRUNC_PASSENGER,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.inframeMutationDriverRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_INFRAME,
        x: 0,
        y: 33.33,
        width: 100,
        height: 33.33,
        z: 6,
    },
    [ShapeId.inframeMutationVUSRectangle]: {
        type: 'rectangle',
        fill: MUT_COLOR_INFRAME_PASSENGER,
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
            // Red rectangle for amplification
            amp: {
                shapes: [shapeBank[ShapeId.ampRectangle]],
                legend_label: 'Amplification',
                legend_order: AMP_LEGEND_ORDER,
            },
            // Light red rectangle for gain
            gain: {
                shapes: [shapeBank[ShapeId.gainRectangle]],
                legend_label: 'Gain',
                legend_order: GAIN_LEGEND_ORDER,
            },
            // Blue rectangle for deep deletion
            homdel: {
                shapes: [shapeBank[ShapeId.homdelRectangle]],
                legend_label: 'Deep Deletion',
                legend_order: HOMDEL_LEGEND_ORDER,
            },
            // Light blue rectangle for shallow deletion
            hetloss: {
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
        // fusion
        disp_fusion: {
            // tall inset purple rectangle for fusion
            true: {
                shapes: [shapeBank[ShapeId.fusionRectangle]],
                legend_label: 'Fusion',
                legend_order: FUSION_LEGEND_ORDER,
            },
        },
    },
};

export const germline_rule_params = {
    // germline
    disp_germ: {
        // white stripe in the middle
        true: {
            shapes: [
                {
                    type: 'rectangle',
                    fill: MUT_COLOR_GERMLINE,
                    x: 0,
                    y: 46,
                    width: 100,
                    height: 8,
                    z: 7,
                },
            ],
            legend_label: 'Germline Mutation',
            legend_order: GERMLINE_LEGEND_ORDER,
        },
    },
};

const base_genetic_rule_set_params: Partial<IGeneticAlterationRuleSetParams> = {
    type: RuleSetType.GENE,
    legend_label: 'Genetic Alteration',
    na_legend_label: 'Not profiled',
    legend_base_color: DEFAULT_GREY,
};

export const genetic_rule_set_same_color_for_all_no_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign({}, non_mutation_rule_params.conditional, {
                disp_mut: {
                    'trunc,inframe,missense,promoter,other,trunc_rec,inframe_rec,missense_rec,promoter_rec,other_rec': {
                        shapes: [
                            shapeBank[ShapeId.missenseMutationDriverRectangle],
                        ],
                        legend_label: 'Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                },
            } as GeneticAlterationRuleParams['conditional']),
        },
    }
) as IGeneticAlterationRuleSetParams;

export const genetic_rule_set_same_color_for_all_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign({}, non_mutation_rule_params.conditional, {
                disp_mut: {
                    'missense_rec,inframe_rec,trunc_rec,promoter_rec,other_rec': {
                        shapes: [
                            shapeBank[ShapeId.missenseMutationDriverRectangle],
                        ],
                        legend_label: 'Mutation (putative driver)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    'missense,inframe,trunc,promoter,other': {
                        shapes: [
                            shapeBank[ShapeId.missenseMutationVUSRectangle],
                        ],
                        legend_label: 'Mutation (unknown significance)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                },
            } as GeneticAlterationRuleParams['conditional']),
        },
    }
) as IGeneticAlterationRuleSetParams;

export const genetic_rule_set_different_colors_no_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign({}, non_mutation_rule_params.conditional, {
                disp_mut: {
                    'other,other_rec': {
                        shapes: [shapeBank[ShapeId.otherMutationRectangle]],
                        legend_label: 'Other Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    'promoter,promoter_rec': {
                        shapes: [shapeBank[ShapeId.promoterMutationRectangle]],
                        legend_label: 'Promoter Mutation',
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
                            shapeBank[ShapeId.inframeMutationDriverRectangle],
                        ],
                        legend_label: 'Inframe Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    'missense,missense_rec': {
                        shapes: [
                            shapeBank[ShapeId.missenseMutationDriverRectangle],
                        ],
                        legend_label: 'Missense Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                },
            } as GeneticAlterationRuleParams['conditional']),
        },
    }
) as IGeneticAlterationRuleSetParams;

export const genetic_rule_set_different_colors_recurrence: IGeneticAlterationRuleSetParams = _.assign(
    {},
    base_genetic_rule_set_params,
    {
        rule_params: {
            always: non_mutation_rule_params.always,
            conditional: _.assign({}, non_mutation_rule_params.conditional, {
                disp_mut: {
                    'other,other_rec': {
                        shapes: [shapeBank[ShapeId.otherMutationRectangle]],
                        legend_label: 'Other Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    'promoter,promoter_rec': {
                        shapes: [shapeBank[ShapeId.promoterMutationRectangle]],
                        legend_label: 'Promoter Mutation',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    trunc_rec: {
                        shapes: [
                            shapeBank[
                                ShapeId.truncatingMutationDriverRectangle
                            ],
                        ],
                        legend_label: 'Truncating Mutation (putative driver)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    trunc: {
                        shapes: [
                            shapeBank[ShapeId.truncatingMutationVUSRectangle],
                        ],
                        legend_label:
                            'Truncating Mutation (unknown significance)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    inframe_rec: {
                        shapes: [
                            shapeBank[ShapeId.inframeMutationDriverRectangle],
                        ],
                        legend_label: 'Inframe Mutation (putative driver)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    inframe: {
                        shapes: [
                            shapeBank[ShapeId.inframeMutationVUSRectangle],
                        ],
                        legend_label: 'Inframe Mutation (unknown significance)',
                        legend_order: MUTATION_LEGEND_ORDER,
                    },
                    missense_rec: {
                        shapes: [
                            shapeBank[ShapeId.missenseMutationDriverRectangle],
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
            } as GeneticAlterationRuleParams['conditional']),
        },
    }
) as IGeneticAlterationRuleSetParams;
