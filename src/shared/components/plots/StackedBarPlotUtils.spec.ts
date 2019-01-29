import chai, {assert, expect} from "chai";
import { makePlotData, makeBarSpecs } from "./StackedBarPlotUtils";
import _ from "lodash";
import deepEqualInAnyOrder from "deep-equal-in-any-order";
chai.use(deepEqualInAnyOrder);

describe("StackedBarPlotUtils", ()=>{
    let singleValueHorzBarsData:any[];
    let singleValueVertBarsData:any[];
    let multipleValueHorzBarsData:any[];
    let multipleValueVertBarsData:any[];
    beforeEach(()=>{
        singleValueVertBarsData = [
            { minorCategory: "categoryC", counts:[
                { majorCategory: "categoryA", count:2},
                { majorCategory: "categoryB", count:1},
                { majorCategory: "categoryE", count:0},
            ]},
            { minorCategory: "categoryD", counts:[
                { majorCategory: "categoryA", count:1},
                { majorCategory: "categoryB", count:0},
                { majorCategory: "categoryE", count:1}
            ]}
        ];

        singleValueHorzBarsData = [
            { minorCategory: "categoryA", counts:[
                { majorCategory: "categoryC", count:2},
                { majorCategory: "categoryD", count:1},
            ]},
            { minorCategory: "categoryB", counts:[
                { majorCategory: "categoryC", count:1},
                { majorCategory: "categoryD", count:0},
            ]},
            { minorCategory: "categoryE", counts:[
                { majorCategory: "categoryC", count:0},
                { majorCategory: "categoryD", count:1},
            ]},
        ];

        multipleValueVertBarsData = [
            { minorCategory: "categoryC", counts:[
                { majorCategory: "categoryA", count:2},
                { majorCategory: "categoryB", count:3},
                { majorCategory: "categoryE", count:2},
            ]},
            { minorCategory: "categoryD", counts:[
                { majorCategory: "categoryA", count:2},
                { majorCategory: "categoryB", count:2},
                { majorCategory: "categoryE", count:2}
            ]}
        ];

        multipleValueHorzBarsData = [
            { minorCategory: "categoryA", counts:[
                { majorCategory: "categoryC", count:2},
                { majorCategory: "categoryD", count:2},
            ]},
            { minorCategory: "categoryB", counts:[
                { majorCategory: "categoryC", count:3},
                { majorCategory: "categoryD", count:2},
            ]},
            { minorCategory: "categoryE", counts:[
                { majorCategory: "categoryC", count:2},
                { majorCategory: "categoryD", count:2},
            ]},
        ];
    });

    describe("makePlotData", ()=>{
        let singleValueHorzData:any[];
        let singleValueVertData:any[];
        let multipleValueHorzData:any[];
        let multipleValueVertData:any[];
        beforeEach(()=>{
            singleValueHorzData = [{
                uniqueSampleKey: "sampleA",
                value: "categoryA"
            }, {
                uniqueSampleKey: "sampleB",
                value: "categoryA"
            }, {
                uniqueSampleKey: "sampleC",
                value: "categoryB"
            }, {
                uniqueSampleKey: "sampleD",
                value: "categoryE"
            },{
                uniqueSampleKey: "sampleE",
                value:"categoryA"
            }];
            singleValueVertData = [{
                uniqueSampleKey: "sampleA",
                value: "categoryC"
            }, {
                uniqueSampleKey: "sampleB",
                value: "categoryD"
            }, {
                uniqueSampleKey: "sampleC",
                value: "categoryC"
            }, {
                uniqueSampleKey: "sampleD",
                value: "categoryD"
            }, {
                uniqueSampleKey: "sampleE",
                value: "categoryC"
            }];

            multipleValueHorzData = [{
                uniqueSampleKey: "sampleA",
                value: ["categoryA", "categoryB", "categoryE"]
            }, {
                uniqueSampleKey: "sampleB",
                value: "categoryA"
            }, {
                uniqueSampleKey: "sampleC",
                value: "categoryB"
            }, {
                uniqueSampleKey: "sampleD",
                value: ["categoryB", "categoryE"]
            },{
                uniqueSampleKey: "sampleE",
                value:"categoryA"
            }];
            multipleValueVertData = [{
                uniqueSampleKey: "sampleA",
                value: ["categoryC", "categoryD"]
            }, {
                uniqueSampleKey: "sampleB",
                value: "categoryD"
            }, {
                uniqueSampleKey: "sampleC",
                value: "categoryC"
            }, {
                uniqueSampleKey: "sampleD",
                value: ["categoryD", "categoryC"]
            }, {
                uniqueSampleKey: "sampleE",
                value: "categoryC"
            }];
        });
        it("returns correct result for empty input", ()=>{
            assert.deepEqual(makePlotData([] ,[], true), [])
        });
        it("returns correct result for nonempty input, single values, vertical bars", ()=>{
            (expect(makePlotData(singleValueHorzData, singleValueVertData, false))
            .to.deep as any).equalInAnyOrder(singleValueVertBarsData);
        });
        it("returns correct result for nonempty input, single values, horizontal bars", ()=>{
            (expect(makePlotData(singleValueHorzData, singleValueVertData, true))
            .to.deep as any).equalInAnyOrder(singleValueHorzBarsData);
        });
        it("returns correct result for nonempty input, multiple values, vertical bars", ()=>{
            (expect(makePlotData(multipleValueHorzData, multipleValueVertData, false))
            .to.deep as any).equalInAnyOrder(multipleValueVertBarsData);
        });
        it("returns correct result for nonempty input, multiple values, horizontal bars", ()=>{
            (expect(makePlotData(multipleValueHorzData, multipleValueVertData, true))
            .to.deep as any).equalInAnyOrder(multipleValueHorzBarsData);
        });
    });

    describe("makeBarSpecs", ()=>{
        let categoryOrder = {
            categoryA: 1,
            categoryB: 0,
            categoryE: 2,

            categoryC: 4,
            categoryD: 3
        }
        let colors = {
            "categoryA": "colorA",
            "categoryB": "colorB",
            "categoryC": "colorC",
            "categoryD": "colorD",
            "categoryE": "colorE",
        };
        let getColor = (category:string)=>{
            return (colors as any)[category];
        };
        let categoryCoord = (categoryIndex:number)=>25*categoryIndex;
        it("returns correct result for empty input", ()=>{
            assert.deepEqual(makeBarSpecs([], undefined, undefined, getColor, categoryCoord, false), []);
        });
        it("returns correct results for singleValueVertBarsData (note output arrays given in reverse order bc its vertical bars)", ()=>{
            assert.deepEqual(makeBarSpecs(
                singleValueVertBarsData, undefined, undefined, getColor, categoryCoord, false
            ), [{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 0, x: 25, y:0
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 1, x: 50, y:1
                }]
            },{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 1, x: 25, y:1
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 0, x: 50, y:0
                }]
            }], "no given order (alphabetical both)");

            assert.deepEqual(makeBarSpecs(
                singleValueVertBarsData, categoryOrder, undefined, getColor, categoryCoord, false
            ), [{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 1, x: 25, y:1
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 0, x: 50, y:0
                }]
            },{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 0, x: 25, y:0
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 1, x: 50, y:1
                }]
            }], "given minor order (alphabetical major)");

            assert.deepEqual(makeBarSpecs(
                singleValueVertBarsData, undefined, categoryOrder, getColor, categoryCoord, false
            ), [{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 0, x: 0, y:0
                },{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 1, x: 25, y:1
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 1, x: 50, y:1
                }]
            },{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 0, x: 50, y:0
                }]
            }], "given major order (alphabetical minor)");

            assert.deepEqual(makeBarSpecs(
                singleValueVertBarsData, categoryOrder, categoryOrder, getColor, categoryCoord, false
            ), [{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 0, x: 50, y:0
                }]
            },{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 0, x: 0, y:0
                },{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 1, x: 25, y:1
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 1, x: 50, y:1
                }]
            }], "given minor and major order");
        });
        it("returns correct results for singleValueHorzBarsData", ()=>{
            assert.deepEqual(makeBarSpecs(
                singleValueHorzBarsData, undefined, undefined, getColor, categoryCoord, true
            ), [{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 1, x: 25, y:1
                }]
            },{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 0, x: 25, y:0
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 0, x: 0, y:0
                },{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 1, x: 25, y:1
                }]
            }], "no given order (alphabetical both)");

            assert.deepEqual(makeBarSpecs(
                singleValueHorzBarsData, categoryOrder, undefined, getColor, categoryCoord, true
            ), [{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 0, x: 25, y:0
                }]
            },{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 1, x: 25, y:1
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 0, x: 0, y:0
                },{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 1, x: 25, y:1
                }]
            }], "given minor order (alphabetical major)");

            assert.deepEqual(makeBarSpecs(
                singleValueHorzBarsData, undefined, categoryOrder, getColor, categoryCoord, true
            ), [{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 0, x: 0, y:0
                },{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 1, x: 25, y:1
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 0, x: 25, y:0
                }]
            }], "given major order (alphabetical minor)");

            assert.deepEqual(makeBarSpecs(
                singleValueHorzBarsData, categoryOrder, categoryOrder, getColor, categoryCoord, true
            ), [{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 0, x: 0, y:0
                },{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 1, x: 25, y:1
                }]
            },{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 1, x: 0, y:1
                },{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 0, x: 25, y:0
                }]
            }], "given minor and major order");
        });
        it("returns correct results for multipleValueVertBarsData (note output arrays given in reverse order bc its vertical bars)", ()=>{
            assert.deepEqual(makeBarSpecs(
                multipleValueVertBarsData, undefined, undefined, getColor, categoryCoord, false
            ), [{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 2, x: 50, y:2
                }]
            },{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 3, x: 25, y:3
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 2, x: 50, y:2
                }]
            }], "no given order (alphabetical both)");

            assert.deepEqual(makeBarSpecs(
                multipleValueVertBarsData, categoryOrder, undefined, getColor, categoryCoord, false
            ), [{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 3, x: 25, y:3
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 2, x: 50, y:2
                }]
            },{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 2, x: 50, y:2
                }]
            }], "given minor order (alphabetical major)");

            assert.deepEqual(makeBarSpecs(
                multipleValueVertBarsData, undefined, categoryOrder, getColor, categoryCoord, false
            ), [{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 2, x: 50, y:2
                }]
            },{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 3, x: 0, y:3
                },{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 2, x: 50, y:2
                }]
            }], "given major order (alphabetical minor)");

            assert.deepEqual(makeBarSpecs(
                multipleValueVertBarsData, categoryOrder, categoryOrder, getColor, categoryCoord, false
            ), [{
                fill: "colorC",
                data:[{
                    majorCategory: "categoryB", minorCategory:"categoryC",
                    count: 3, x: 0, y:3
                },{
                    majorCategory: "categoryA", minorCategory:"categoryC",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryC",
                    count: 2, x: 50, y:2
                }]
            },{
                fill: "colorD",
                data: [{
                    majorCategory: "categoryB", minorCategory:"categoryD",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryA", minorCategory:"categoryD",
                    count: 2, x: 25, y:2
                },{
                    majorCategory: "categoryE", minorCategory:"categoryD",
                    count: 2, x: 50, y:2
                }]
            }], "given minor and major order");
        });
        it("returns correct results for multipleValueHorzBarsData", ()=>{
            assert.deepEqual(makeBarSpecs(
                multipleValueHorzBarsData, undefined, undefined, getColor, categoryCoord, true
            ), [{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 3, x: 0, y:3
                },{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 2, x: 25, y:2
                }]
            }], "no given order (alphabetical both)");

            assert.deepEqual(makeBarSpecs(
                multipleValueHorzBarsData, categoryOrder, undefined, getColor, categoryCoord, true
            ), [{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 3, x: 0, y:3
                },{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 2, x: 25, y:2
                }]
            }], "given minor order (alphabetical major)");

            assert.deepEqual(makeBarSpecs(
                multipleValueHorzBarsData, undefined, categoryOrder, getColor, categoryCoord, true
            ), [{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 3, x: 25, y:3
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 2, x: 25, y:2
                }]
            }], "given major order (alphabetical minor)");

            assert.deepEqual(makeBarSpecs(
                multipleValueHorzBarsData, categoryOrder, categoryOrder, getColor, categoryCoord, true
            ), [{
                fill: "colorB",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryB",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryC", minorCategory:"categoryB",
                    count: 3, x: 25, y:3
                }]
            },{
                fill: "colorA",
                data: [{
                    majorCategory: "categoryD", minorCategory:"categoryA",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryC", minorCategory:"categoryA",
                    count: 2, x: 25, y:2
                }]
            },{
                fill: "colorE",
                data:[{
                    majorCategory: "categoryD", minorCategory:"categoryE",
                    count: 2, x: 0, y:2
                },{
                    majorCategory: "categoryC", minorCategory:"categoryE",
                    count: 2, x: 25, y:2
                }]
            }], "given minor and major order");
        });
    });
});