import {assert} from 'chai';
import {shallow, mount} from "enzyme";
import * as React from "react";
import * as _ from 'lodash';
import {CancerSummaryChart, HORIZONTAL_SCROLLING_THRESHOLD} from "./CancerSummaryChart";

describe('CancerSummaryChart', () => {


    it("Allows chart container to be horizontally scrolled when bar threshold is reached", () => {

        const method: () => any = Object.getOwnPropertyDescriptor(CancerSummaryChart.prototype, 'overflowStyle')!.get!;


        let result = method.bind({props: {xLabels: Array(HORIZONTAL_SCROLLING_THRESHOLD)}}).call();
        assert.equal(result.width, 'auto');

        result = method.bind({props: {xLabels: Array(HORIZONTAL_SCROLLING_THRESHOLD + 1)}}).call();
        assert.equal(result.width, '100%');

    });


    it('#legendData only includes alteration types which are present in query', () => {

        const props = {
            "data": [[{
                "alterationType": "multiple",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 27.066115702479337
            }, {
                "alterationType": "multiple",
                "x": "Lung Adenocarcinoma",
                "y": 13.18181818181818
            }], [{
                "alterationType": "protExpressionDown",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0
            }, {
                "alterationType": "protExpressionDown",
                "x": "Lung Adenocarcinoma",
                "y": 0
            }], [{
                "alterationType": "protExpressionUp",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0
            }, {
                "alterationType": "protExpressionUp",
                "x": "Lung Adenocarcinoma",
                "y": 0
            }], [{
                "alterationType": "mrnaExpressionDown",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0
            }, {
                "alterationType": "mrnaExpressionDown",
                "x": "Lung Adenocarcinoma",
                "y": 0
            }], [{
                "alterationType": "mrnaExpressionUp",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0
            }, {"alterationType": "mrnaExpressionUp", "x": "Lung Adenocarcinoma", "y": 0}], [{
                "alterationType": "hetloss",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0
            }, {"alterationType": "hetloss", "x": "Lung Adenocarcinoma", "y": 0}], [{
                "alterationType": "homdel",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 3.71900826446281
            }, {
                "alterationType": "homdel",
                "x": "Lung Adenocarcinoma",
                "y": 8.181818181818182
            }], [{"alterationType": "gain", "x": "Lung Squamous Cell Carcinoma", "y": 0}, {
                "alterationType": "gain",
                "x": "Lung Adenocarcinoma",
                "y": 0
            }], [{
                "alterationType": "amp",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0.4132231404958678
            }, {"alterationType": "amp", "x": "Lung Adenocarcinoma", "y": 5.909090909090909}], [{
                "alterationType": "fusion",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 0
            }, {"alterationType": "fusion", "x": "Lung Adenocarcinoma", "y": 0}], [{
                "alterationType": "mutated",
                "x": "Lung Squamous Cell Carcinoma",
                "y": 60.33057851239669
            }, {"alterationType": "mutated", "x": "Lung Adenocarcinoma", "y": 42.42424242424242}]],
            "countsByGroup": {
                "Lung Adenocarcinoma": {
                    "sampleTotal": 660,
                    "alterationTotal": 547,
                    "alterationTypeCounts": {
                        "mutated": 280,
                        "amp": 39,
                        "homdel": 54,
                        "hetloss": 0,
                        "gain": 0,
                        "fusion": 0,
                        "mrnaExpressionUp": 0,
                        "mrnaExpressionDown": 0,
                        "protExpressionUp": 0,
                        "protExpressionDown": 0,
                        "multiple": 87
                    },
                    "alteredSampleCount": 460,
                    "parentCancerType": "Non-Small Cell Lung Cancer"
                },
                "Lung Squamous Cell Carcinoma": {
                    "sampleTotal": 484,
                    "alterationTotal": 574,
                    "alterationTypeCounts": {
                        "mutated": 292,
                        "amp": 2,
                        "homdel": 18,
                        "hetloss": 0,
                        "gain": 0,
                        "fusion": 0,
                        "mrnaExpressionUp": 0,
                        "mrnaExpressionDown": 0,
                        "protExpressionUp": 0,
                        "protExpressionDown": 0,
                        "multiple": 131
                    },
                    "alteredSampleCount": 443,
                    "parentCancerType": "Non-Small Cell Lung Cancer"
                }
            },
            "representedAlterations": {"multiple": true, "homdel": true, "amp": true, "mutated": true},
            "alterationTypes": {
                "multiple": "Multiple Alterations",
                "protExpressionDown": "Protein Downregulation",
                "protExpressionUp": "Protein Upregulation",
                "mrnaExpressionDown": "mRNA Downregulation",
                "mrnaExpressionUp": "mRNA Upregulation",
                "hetloss": "Shallow Deletion",
                "homdel": "Deep Deletion",
                "gain": "Gain",
                "amp": "Amplification",
                "fusion": "Fusion",
                "mutated": "Mutation"
            },
            "isPercentage": true,
            "colors": {
                "mutated": "#008000",
                "amp": "#ff0000",
                "homdel": "rgb(0,0,255)",
                "hetloss": "#000",
                "gain": "rgb(255,182,193)",
                "fusion": "#8B00C9",
                "mrnaExpressionUp": "#FF989A",
                "mrnaExpressionDown": "#529AC8",
                "protExpressionUp": "#FF989A",
                "protExpressionDown": "#E0FFFF",
                "multiple": "#666"
            },
            "xLabels": ["Lung Squamous Cell Carcinoma", "Lung Adenocarcinoma"]
        };

        const instance = shallow(<CancerSummaryChart {...props} />).instance() as CancerSummaryChart;

        const result = [
            {"name":"Mutation","symbol":{"fill":"#008000"}},
            {"name":"Amplification","symbol":{"fill":"#ff0000"}},
            {"name":"Deep Deletion","symbol":{"fill":"rgb(0,0,255)"}},
            {"name":"Multiple Alterations","symbol":{"fill":"#666"}}
        ];

        assert.deepEqual( instance.legendData, result, 'represented alterations present in legendData');

        delete instance.props.representedAlterations['mutated'];

        assert.deepEqual( instance.legendData, result.slice(1), 'mutations no longer present be no longer in represented alterations');


    });




});
