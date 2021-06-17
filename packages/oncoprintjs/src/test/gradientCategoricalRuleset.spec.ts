import OncoprintRuleSet, {RuleSetParams, RuleSetType} from "../js/oncoprintruleset";
import {assert} from "chai";

type Datum = {
    id:string;
    category:string|undefined;
    profile_data:number|null;
    truncation?:any;
};

describe("GradientCategoricalRuleSet", function() {

    const mixParams:RuleSetParams = {
        type: RuleSetType.GRADIENT_AND_CATEGORICAL,
        legend_label: "this is a label",
        value_key: "profile_data",
        value_range: [1,8],
        value_stop_points: [1,2,8],
        colors: [[255,0,0,1],[0,0,0,1],[0,255,0,1]],
        null_color: [224,224,224,1],
        category_key: "category"
    };

    const categoryDatum:Datum = {
        id:"a",
        category: ">8",
        profile_data: 8
    };

    const gradientDatumLargest:Datum = {
        id:"b",
        category: undefined,
        profile_data: 8
    };

    const gradientDatumSmallest:Datum = {
        id:"c",
        category: undefined,
        profile_data: 1
    };

    const naDatum:Datum = {
        id:"d",
        category: undefined,
        profile_data: null,
        truncation: undefined
    };

    it("Formats gradient value", function() {
        var mixRuleSet = OncoprintRuleSet(mixParams);
        var elements = mixRuleSet.getSpecificShapesForDatum([gradientDatumLargest, gradientDatumSmallest, naDatum], 12, 12,  undefined, "id");
        assert.equal(elements.length, 3);
        assert.deepEqual(elements[0][0].fill,[0,255,0,1]);
        assert.deepEqual(elements[1][0].fill,[255,0,0,1]);
        assert.deepEqual(elements[2][0].fill,[224,224,224,1]);
    });

    it("Formats categorical value", function() {
        var mixRuleSet = OncoprintRuleSet(mixParams);
        var elements = mixRuleSet.getSpecificShapesForDatum([categoryDatum], 12, 12, undefined, "id");
        assert.equal(elements.length, 1);
    });

    it("Suppresses duplicate No Data rules", function() {
        var mixRuleSet = OncoprintRuleSet(mixParams);
        var elements = mixRuleSet.getSpecificRulesForDatum();
        assert.equal(elements.length, 2);
    });

});
