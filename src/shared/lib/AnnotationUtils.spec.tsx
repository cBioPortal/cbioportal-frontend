import {IHotspotIndex} from "pages/patientView/mutation/column/AnnotationColumnFormatter";
import {isHotspot, indexHotspots, is3dHotspot} from './AnnotationUtils';
import {initMutation} from "test/MutationMockUtils";
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('AnnotationUtils', () => {

    const hotspotMutation1 = initMutation({
        gene: {
            hugoGeneSymbol: "TP53"
        },
        proteinPosStart: 273,
        proteinPosEnd: 273,
        proteinChange: "R273C",
        mutationType: "missense"
    });

    const hotspotMutation2 = initMutation({
        gene: {
            hugoGeneSymbol: "TP53"
        },
        proteinPosStart: 273,
        proteinChange: "R273A",
        mutationType: "missense"
    });

    const hotspotMutation3 = initMutation({
        gene: {
            hugoGeneSymbol: "PIK3CA"
        },
        proteinPosStart: 38,
        proteinPosEnd: 40,
        proteinChange: "R38H",
        mutationType: "in_frame_del"
    });

    const hotspot3dMutation = initMutation({
        gene: {
            hugoGeneSymbol: "SMURF1"
        },
        proteinPosStart: 101,
        proteinPosEnd: 101,
        proteinChange: "R101N",
        mutationType: "non_sense"
    });

    const hotspots = [
        {
            type: "single residue",
            hugoSymbol: "TP53",
            residue: "R273"
        },
        {
            type: "in-frame indel",
            hugoSymbol: "PIK3CA",
            residue: "38-40"
        }
    ];

    const hotspots3d = [
        {
            type: "3d",
            hugoSymbol: "SMURF1",
            residue: "R101"
        }
    ];

    let hotspotIndex: IHotspotIndex;
    let hotspot3dIndex: IHotspotIndex;

    before(() => {
        hotspotIndex = indexHotspots(hotspots);
        hotspot3dIndex = indexHotspots(hotspots3d);
    });

    it('properly creates hotspot index', () => {
        assert.equal(hotspotIndex["TP53"]["single residue"].hotspotMutations.length, 1,
            "Only one TP53 single-residue hotspot mutation should be indexed.");

        assert.equal(hotspotIndex["PIK3CA"]["in-frame indel"].hotspotMutations.length, 1,
            "Only one PIK3CA in-frame indel hotspot mutation should be indexed.");

        assert.equal(hotspot3dIndex["SMURF1"]["3d"].hotspotMutations.length, 1,
            "Only one SMURF1 3d hotspot mutation should be indexed.");
    });

    it('checks if a mutation is a hotspot mutation', () => {
        assert.isTrue(isHotspot(hotspotMutation1, hotspotIndex),
            "TP53 R273C should be a hotspot mutation.");

        assert.isTrue(isHotspot(hotspotMutation2, hotspotIndex),
            "TP53 R273A should be a hotspot mutation.");

        assert.isTrue(isHotspot(hotspotMutation3, hotspotIndex),
            "PIK3CA R38H should be a hotspot mutation.");

        assert.isFalse(isHotspot(hotspot3dMutation, hotspotIndex),
            "SMURF1 R101N should not be a hotspot mutation.");

        assert.isTrue(is3dHotspot(hotspot3dMutation, hotspot3dIndex),
            "SMURF1 R101N should be a 3d hotspot mutation.");
    });

    after(() => {

    });

});
