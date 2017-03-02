import MrnaExprColumnFormatter from './MrnaExprColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {MrnaExprRankCacheType, MrnaExprRankCacheDataType} from "../../clinicalInformation/MrnaExprRankCache";
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import {MrnaPercentile} from "../../../../shared/api/CBioPortalAPIInternal";
import {Mutation} from "../../../../shared/api/CBioPortalAPI";

class TestableFormatter extends MrnaExprColumnFormatter {

    public static getData(data: Mutation[], mrnaExprData:MrnaExprRankCacheType):MrnaExprRankCacheDataType | null {
        return super.getData(data, mrnaExprData);
    }

    public static getTdValue(cacheDatum:MrnaExprRankCacheDataType | null) {
        return super.getTdValue(cacheDatum);
    }

    public static getCircleX(percentile:number, circleLeft:number, circleRight:number) {
        return super.getCircleX(percentile, circleLeft, circleRight);
    }

}

describe('MrnaExprColumnFormatter', () => {

    let cache:MrnaExprRankCacheType;
    let data:MrnaPercentile[];

    before(()=>{
        cache = {};
        data = [
            {
                entrezGeneId: 0,
                geneticProfileId: "",
                sampleId: "A",
                percentile: 50,
                zScore: 0
            },
            {
                entrezGeneId: 0,
                geneticProfileId: "",
                sampleId: "B",
                percentile: 60,
                zScore: 1
            },
            {
                entrezGeneId: 1,
                geneticProfileId: "",
                sampleId: "A",
                percentile: 30,
                zScore: -1
            },
            {
                entrezGeneId: 1,
                geneticProfileId: "",
                sampleId: "B",
                percentile: 80,
                zScore: 2
            }];

        for (const datum of data) {
            cache[datum.sampleId] = cache[datum.sampleId] || {
                fetchedWithoutGeneArgument: false,
                    geneData: {}
                };
            cache[datum.sampleId].geneData[datum.entrezGeneId] = {status: "complete", data: datum};
        }

        cache["A"].geneData[2] = {status:"error"};
        cache["B"].geneData[3] = {status:"complete", data:null};
    });

    after(()=>{

    });

    describe("getData",()=>{
        it("should get the correct data if it exists", ()=>{
            let rowData = {
                sampleId: "A",
                entrezGeneId: 0
            } as Mutation;
            assert.deepEqual(TestableFormatter.getData([rowData], cache),
                {
                    status: "complete",
                    data: {
                        entrezGeneId: 0,
                        geneticProfileId: "",
                        sampleId: "A",
                        percentile: 50,
                        zScore: 0
                    }
                });
            rowData = {
                sampleId: "B",
                entrezGeneId: 0
            } as Mutation;
            assert.deepEqual(TestableFormatter.getData([rowData], cache),
                {
                    status: "complete",
                    data: {
                        entrezGeneId: 0,
                        geneticProfileId: "",
                        sampleId: "B",
                        percentile: 60,
                        zScore: 1
                    }
                });
            rowData = {
                sampleId: "B",
                entrezGeneId: 1
            } as Mutation;
            assert.deepEqual(TestableFormatter.getData([rowData], cache),
                {
                    status: "complete",
                    data: {
                        entrezGeneId: 1,
                        geneticProfileId: "",
                        sampleId: "B",
                        percentile: 80,
                        zScore: 2
                    }
                });
            rowData = {
                sampleId: "A",
                entrezGeneId: 2
            } as Mutation;
            assert.deepEqual(TestableFormatter.getData([rowData], cache),
                {
                    status: "error",
                });
            rowData = {
                sampleId: "B",
                entrezGeneId: 3
            } as Mutation;
            assert.deepEqual(TestableFormatter.getData([rowData], cache),
                {
                    status: "complete",
                    data: null
                });
        });
        it("should return null if no data exists", ()=>{
            let rowData = {
                sampleId: "C",
                entrezGeneId: 3
            } as Mutation;
            assert(TestableFormatter.getData([rowData], cache) === null);
            rowData = {
                sampleId: "A",
                entrezGeneId: 5
            } as Mutation;
            assert(TestableFormatter.getData([rowData], cache) === null);
        });
    });

    describe("getTdValue", ()=>{
        it("should return the percentile if the data is fetched and available", ()=>{
            assert(TestableFormatter.getTdValue({
                status: "complete",
                data: data[0]
            }) === 50);
            assert(TestableFormatter.getTdValue({
                    status: "complete",
                    data: data[3]
            }) === 80);
        });
        it("should return positive infinity if the data is error or unavailable", ()=>{
            assert(TestableFormatter.getTdValue({
                status: "error"
            }) === Number.POSITIVE_INFINITY);
            assert(TestableFormatter.getTdValue(null) === Number.POSITIVE_INFINITY);
        });
    });

    describe("getCircleX", ()=>{
        it("should linearly interpolate between the given values", ()=>{
            for (let i=0; i<=100; i++) {
                assert(Math.abs(TestableFormatter.getCircleX(i, 0, 100)-i) < 0.00001);
                assert(Math.abs(TestableFormatter.getCircleX(i, 0, 50)-(i/2)) < 0.00001);
                assert(Math.abs(TestableFormatter.getCircleX(i, 50, 100)-(50 + i/2)) < 0.00001);
                assert(Math.abs(TestableFormatter.getCircleX(i, 0, 1)-(i/100)) < 0.00001);
                assert(Math.abs(TestableFormatter.getCircleX(i, 2, 4)-(2+i/50)) < 0.00001);
            }
        });
    });
});
