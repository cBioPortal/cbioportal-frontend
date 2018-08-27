import {assert} from "chai";
import {makeScatterPlotData} from "./PlotsTabUtils";
import {Sample} from "../../../shared/api/generated/CBioPortalAPI";

describe("PlotsTabUtils", ()=>{
    describe("makeScatterPlotData", ()=>{
        it ("does not create data for NaN values", ()=>{
            const data = makeScatterPlotData(
                    {
                        datatype:"number",
                        data:[
                            { uniqueSampleKey:"sample1", value:NaN}, { uniqueSampleKey:"sample2", value:3},
                            { uniqueSampleKey:"sample3", value:1}
                        ],
                    },
                    {
                        datatype:"number",
                        data:[
                            { uniqueSampleKey:"sample1", value:0}, { uniqueSampleKey:"sample2", value:NaN},
                            { uniqueSampleKey:"sample3", value:4}
                        ],
                    },
                    { sample1: {sampleId:"sample1", studyId:"study"} as Sample,
                        sample2: {sampleId:"sample2", studyId:"study"} as Sample,
                        sample3: {sampleId:"sample3", studyId:"study"} as Sample
                    },
                    {}
                );
            assert.equal(data.length, 1, "only one datum - others have NaN");
            const datum:any = data[0];
            const target:any = {
                uniqueSampleKey:"sample3",
                sampleId:"sample3",
                studyId:"study",
                x:1,
                y:4,
            };
            for (const key of ["uniqueSampleKey", "sampleId", "studyId", "x", "y"]) {
                assert.equal(target[key], datum[key], key);
            }
        });
    });
});