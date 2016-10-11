const geneticRules = {
    "genetic_rule_set_same_color_for_all_no_recurrence"
:
    {
        "type"
    :
        "gene", "legend_label"
    :
        "Genetic Alteration", "rule_params"
    :
        {
            "*"
        :
            {
                "shapes"
            :
                [{
                    "type": "rectangle",
                    "fill": "rgba(211, 211, 211, 1)",
                    "z": 1,
                    "width": "100%",
                    "height": "100%",
                    "x": "0%",
                    "y": "0%",
                    "stroke": "rgba(0,0,0,0)",
                    "stroke-width": "0"
                }], "exclude_from_legend"
            :
                true
            }
        ,
            "disp_cna"
        :
            {
                "amp"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,0,0,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Amplification"
                }
            ,
                "gain"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,182,193,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Gain"
                }
            ,
                "homdel"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0,0,255,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Deep Deletion"
                }
            ,
                "hetloss"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(143, 216, 216,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Shallow Deletion"
                }
            }
        ,
            "disp_mrna"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(255, 153, 153, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(102, 153, 204, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Downregulation"
                }
            }
        ,
            "disp_prot"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "0%",
                        "x2": "100%",
                        "y2": "33.33%",
                        "x3": "0%",
                        "y3": "33.33%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "100%",
                        "x2": "100%",
                        "y2": "66.66%",
                        "x3": "0%",
                        "y3": "66.66%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Downregulation"
                }
            }
        ,
            "disp_fusion"
        :
            {
                "true"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#8B00C9",
                        "x": "0%",
                        "y": "20%",
                        "width": "100%",
                        "height": "60%",
                        "z": 5,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Fusion"
                }
            }
        ,
            "disp_mut"
        :
            {
                "trunc,inframe,missense,promoter,trunc_rec,inframe_rec,missense_rec,promoter_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#008000",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Mutation"
                }
            }
        }
    }
,
    "genetic_rule_set_same_color_for_all_recurrence"
:
    {
        "type"
    :
        "gene", "legend_label"
    :
        "Genetic Alteration", "rule_params"
    :
        {
            "*"
        :
            {
                "shapes"
            :
                [{
                    "type": "rectangle",
                    "fill": "rgba(211, 211, 211, 1)",
                    "z": 1,
                    "width": "100%",
                    "height": "100%",
                    "x": "0%",
                    "y": "0%",
                    "stroke": "rgba(0,0,0,0)",
                    "stroke-width": "0"
                }], "exclude_from_legend"
            :
                true
            }
        ,
            "disp_cna"
        :
            {
                "amp"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,0,0,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Amplification"
                }
            ,
                "gain"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,182,193,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Gain"
                }
            ,
                "homdel"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0,0,255,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Deep Deletion"
                }
            ,
                "hetloss"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(143, 216, 216,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Shallow Deletion"
                }
            }
        ,
            "disp_mrna"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(255, 153, 153, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(102, 153, 204, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Downregulation"
                }
            }
        ,
            "disp_prot"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "0%",
                        "x2": "100%",
                        "y2": "33.33%",
                        "x3": "0%",
                        "y3": "33.33%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "100%",
                        "x2": "100%",
                        "y2": "66.66%",
                        "x3": "0%",
                        "y3": "66.66%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Downregulation"
                }
            }
        ,
            "disp_fusion"
        :
            {
                "true"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#8B00C9",
                        "x": "0%",
                        "y": "20%",
                        "width": "100%",
                        "height": "60%",
                        "z": 5,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Fusion"
                }
            }
        ,
            "disp_mut"
        :
            {
                "missense_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#008000",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Mutation (putative driver)"
                }
            ,
                "missense,inframe,inframe_rec,trunc,trunc_rec,promoter,promoter_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#53D400",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Mutation (putative passenger)"
                }
            }
        }
    }
,
    "genetic_rule_set_different_colors_no_recurrence"
:
    {
        "type"
    :
        "gene", "legend_label"
    :
        "Genetic Alteration", "rule_params"
    :
        {
            "*"
        :
            {
                "shapes"
            :
                [{
                    "type": "rectangle",
                    "fill": "rgba(211, 211, 211, 1)",
                    "z": 1,
                    "width": "100%",
                    "height": "100%",
                    "x": "0%",
                    "y": "0%",
                    "stroke": "rgba(0,0,0,0)",
                    "stroke-width": "0"
                }], "exclude_from_legend"
            :
                true
            }
        ,
            "disp_cna"
        :
            {
                "amp"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,0,0,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Amplification"
                }
            ,
                "gain"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,182,193,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Gain"
                }
            ,
                "homdel"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0,0,255,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Deep Deletion"
                }
            ,
                "hetloss"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(143, 216, 216,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Shallow Deletion"
                }
            }
        ,
            "disp_mrna"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(255, 153, 153, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(102, 153, 204, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Downregulation"
                }
            }
        ,
            "disp_prot"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "0%",
                        "x2": "100%",
                        "y2": "33.33%",
                        "x3": "0%",
                        "y3": "33.33%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "100%",
                        "x2": "100%",
                        "y2": "66.66%",
                        "x3": "0%",
                        "y3": "66.66%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Downregulation"
                }
            }
        ,
            "disp_fusion"
        :
            {
                "true"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#8B00C9",
                        "x": "0%",
                        "y": "20%",
                        "width": "100%",
                        "height": "60%",
                        "z": 5,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Fusion"
                }
            }
        ,
            "disp_mut"
        :
            {
                "promoter,promoter_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#FFA942",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Promoter Mutation"
                }
            ,
                "trunc,trunc_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#000000",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Truncating Mutation"
                }
            ,
                "inframe,inframe_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#708090",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Inframe Mutation"
                }
            ,
                "missense,missense_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#008000",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6
                    }], "legend_label"
                :
                    "Missense Mutation"
                }
            }
        }
    }
,
    "genetic_rule_set_different_colors_recurrence"
:
    {
        "type"
    :
        "gene", "legend_label"
    :
        "Genetic Alteration", "rule_params"
    :
        {
            "*"
        :
            {
                "shapes"
            :
                [{
                    "type": "rectangle",
                    "fill": "rgba(211, 211, 211, 1)",
                    "z": 1,
                    "width": "100%",
                    "height": "100%",
                    "x": "0%",
                    "y": "0%",
                    "stroke": "rgba(0,0,0,0)",
                    "stroke-width": "0"
                }], "exclude_from_legend"
            :
                true
            }
        ,
            "disp_cna"
        :
            {
                "amp"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,0,0,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Amplification"
                }
            ,
                "gain"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(255,182,193,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Gain"
                }
            ,
                "homdel"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0,0,255,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Deep Deletion"
                }
            ,
                "hetloss"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(143, 216, 216,1)",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 2,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Shallow Deletion"
                }
            }
        ,
            "disp_mrna"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(255, 153, 153, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "rgba(0, 0, 0, 0)",
                        "stroke": "rgba(102, 153, 204, 1)",
                        "stroke-width": "2",
                        "x": "0%",
                        "y": "0%",
                        "width": "100%",
                        "height": "100%",
                        "z": 3
                    }], "legend_label"
                :
                    "mRNA Downregulation"
                }
            }
        ,
            "disp_prot"
        :
            {
                "up"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "0%",
                        "x2": "100%",
                        "y2": "33.33%",
                        "x3": "0%",
                        "y3": "33.33%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Upregulation"
                }
            ,
                "down"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "triangle",
                        "x1": "50%",
                        "y1": "100%",
                        "x2": "100%",
                        "y2": "66.66%",
                        "x3": "0%",
                        "y3": "66.66%",
                        "fill": "rgba(0,0,0,1)",
                        "z": 4,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Protein Downregulation"
                }
            }
        ,
            "disp_fusion"
        :
            {
                "true"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#8B00C9",
                        "x": "0%",
                        "y": "20%",
                        "width": "100%",
                        "height": "60%",
                        "z": 5,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Fusion"
                }
            }
        ,
            "disp_mut"
        :
            {
                "promoter,promoter_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#FFA942",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Promoter Mutation"
                }
            ,
                "trunc,trunc_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#000000",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Truncating Mutation"
                }
            ,
                "inframe,inframe_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#708090",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Inframe Mutation"
                }
            ,
                "missense_rec"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#008000",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Missense Mutation (putative driver)"
                }
            ,
                "missense"
            :
                {
                    "shapes"
                :
                    [{
                        "type": "rectangle",
                        "fill": "#53D400",
                        "x": "0%",
                        "y": "33.33%",
                        "width": "100%",
                        "height": "33.33%",
                        "z": 6,
                        "stroke": "rgba(0,0,0,0)",
                        "stroke-width": "0"
                    }], "legend_label"
                :
                    "Missense Mutation (putative passenger)"
                }
            }
        }
    }
};

export default geneticRules;