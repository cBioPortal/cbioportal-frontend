import { assert } from 'chai';
import {indexHotspots} from "./CancerHotspotsUtils";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {isRecurrentHotspot, is3dHotspot} from './AnnotationUtils';
import {initMutation} from "test/MutationMockUtils";

describe('AnnotationUtils', () => {

    const hotspotMutation1 = initMutation({
        gene: {
            hugoGeneSymbol: "TP53",
            chromosome: "17",
        },
        startPosition: 66,
        endPosition: 66,
        referenceAllele: "A",
        variantAllele: "T",
        proteinPosStart: 273,
        proteinPosEnd: 273,
        proteinChange: "R273C",
        mutationType: "missense"
    });

    const hotspotMutation2 = initMutation({
        gene: {
            hugoGeneSymbol: "TP53",
            chromosome: "17"
        },
        startPosition: 66,
        endPosition: 66,
        referenceAllele: "A",
        variantAllele: "T",
        proteinPosStart: 273,
        proteinChange: "R273A",
        mutationType: "missense"
    });

    const hotspotMutation3 = initMutation({
        gene: {
            hugoGeneSymbol: "PIK3CA",
            chromosome: "3"
        },
        startPosition: 666,
        endPosition: 668,
        referenceAllele: "G",
        variantAllele: "CAT",
        proteinPosStart: 38,
        proteinPosEnd: 40,
        proteinChange: "R38H",
        mutationType: "in_frame_del"
    });

    const hotspot3dMutation = initMutation({
        gene: {
            hugoGeneSymbol: "SMURF1",
            chromosome: "4"
        },
        startPosition: 111,
        endPosition: 111,
        referenceAllele: "T",
        variantAllele: "C",
        proteinPosStart: 101,
        proteinPosEnd: 101,
        proteinChange: "R101N",
        mutationType: "missense"
    });

    const notHotspotMutation = initMutation({
        gene: {
            hugoGeneSymbol: "SMURF1",
            chromosome: "4"
        },
        startPosition: 222,
        endPosition: 222,
        referenceAllele: "T",
        variantAllele: "C",
        proteinPosStart: 202,
        proteinPosEnd: 202,
        proteinChange: "R101F",
        mutationType: "non_sense"
    });

    const hotspots = [
        {
            genomicLocation: {
                chromosome: "17",
                start: 66,
                end: 66,
                referenceAllele: "A",
                variantAllele: "T"
            },
            variant: "17:g.66A>T",
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
            variant: "3:g.666G>CAT",
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
        }
    ];

    const hotspots3d = [
        {
            genomicLocation: {
                chromosome: "4",
                start: 111,
                end: 111,
                referenceAllele: "T",
                variantAllele: "C"
            },
            variant: "4:g.111T>C",
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
    let hotspot3dIndex: IHotspotIndex;

    before(() => {
        hotspotIndex = indexHotspots(hotspots);
        hotspot3dIndex = indexHotspots(hotspots3d);
    });

    it('checks if a mutation is a hotspot mutation', () => {
        assert.isTrue(isRecurrentHotspot(hotspotMutation1, hotspotIndex),
            "TP53 R273C should be a recurrent hotspot mutation.");

        assert.isTrue(isRecurrentHotspot(hotspotMutation2, hotspotIndex),
            "TP53 R273A should be a recurrent hotspot mutation.");

        assert.isTrue(isRecurrentHotspot(hotspotMutation3, hotspotIndex),
            "PIK3CA R38H should be a recurrent hotspot mutation.");

        assert.isFalse(isRecurrentHotspot(notHotspotMutation, hotspotIndex),
            "SMURF1 R101F should not be a recurrent hotspot mutation.");

        assert.isFalse(isRecurrentHotspot(hotspot3dMutation, hotspotIndex),
            "SMURF1 R101N should not be a recurrent hotspot mutation.");

        assert.isFalse(is3dHotspot(notHotspotMutation, hotspot3dIndex),
            "SMURF1 R101F should not be a 3d hotspot mutation.");

        assert.isTrue(is3dHotspot(hotspot3dMutation, hotspot3dIndex),
            "SMURF1 R101N should be a 3d hotspot mutation.");
    });

    after(() => {

    });

});
