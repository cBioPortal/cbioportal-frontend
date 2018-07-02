import {IHotspotIndex} from "shared/model/CancerHotspots";
import { assert } from 'chai';
import {indexHotspots} from "./CancerHotspotsUtils";

describe('CancerHotspotsUtils', () => {

    const hotspots = [
        {
            genomicLocation: {
                chromosome: "17",
                start: 66,
                end: 66,
                referenceAllele: "A",
                variantAllele: "T"
            },
            variant: "10:g.66A>T",
            hotspots: [
                {
                    type: "single residue",
                    transcriptId: "ENST00002",
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    hugoSymbol: "TP53",
                    residue: "R273",
                    aminoAcidPosition: {
                        start: 273,
                        end: 273
                    }
                }
            ]
        },
        {
            genomicLocation: {
                chromosome: "3",
                start: 666,
                end: 668,
                referenceAllele: "G",
                variantAllele: "CAT"
            },
            variant: "4:g.666G>CAT",
            hotspots: [
                {
                    type: "in-frame indel",
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 1,
                    missenseCount: 0,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: "ENST00003",
                    hugoSymbol: "PIK3CA",
                    residue: "38-40",
                    aminoAcidPosition: {
                        start: 38,
                        end: 40
                    }
                }
            ]
        },
        {
            genomicLocation: {
                chromosome: "4",
                start: 111,
                end: 111,
                referenceAllele: "T",
                variantAllele: "C"
            },
            variant: "6:g.111T>C",
            hotspots: [
                {
                    type: "3d",
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: "ENST00005",
                    hugoSymbol: "SMURF1",
                    residue: "R101",
                    aminoAcidPosition: {
                        start: 101,
                        end: 101
                    }
                }
            ]
        }
    ];


    let hotspotIndex: IHotspotIndex;

    before(() => {
        hotspotIndex = indexHotspots(hotspots);
    });

    it('properly creates hotspot index', () => {
        assert.equal(hotspotIndex["17,66,66,A,T"].hotspots.length, 1,
            "Only one TP53 single-residue hotspot mutation should be indexed.");

        assert.equal(hotspotIndex["3,666,668,G,CAT"].hotspots.length, 1,
            "Only one PIK3CA in-frame indel hotspot mutation should be indexed.");

        assert.equal(hotspotIndex["4,111,111,T,C"].hotspots.length, 1,
            "Only one SMURF1 3d hotspot mutation should be indexed.");
    });

    after(() => {

    });

});
