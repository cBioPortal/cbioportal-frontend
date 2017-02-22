import CancerHotspots from './CancerHotspots';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('CancerHotspots', () => {

    const hotspotMutation1 = {
        gene: {
            hugoGeneSymbol: "TP53"
        },
        proteinPosStart: 273,
        proteinPosEnd: 273,
        proteinChange: "R273C"
    };

    const hotspotMutation2 = {
        gene: {
            hugoGeneSymbol: "PIK3CA"
        },
        proteinPosStart: 38,
        proteinPosEnd: 40,
        proteinChange: "R38H"
    };

    const notHotspotMutation = {
        gene: {
            hugoGeneSymbol: "SMURF1"
        },
        proteinPosStart: 101,
        proteinPosEnd: 101,
        proteinChange: "R101N"
    };

    const map = {
        "TP53_273": true,
        "PIK3CA_38_40": true
    };

    before(()=>{

    });

    it('isHotspots function', () => {
        assert.isTrue(CancerHotspots.isHotspot(hotspotMutation1, map),
            "TP53 R273C should be a hotspot mutation.");

        assert.isTrue(CancerHotspots.isHotspot(hotspotMutation2, map),
            "PIK3CA R38H should be a hotspot mutation.");

        assert.isFalse(CancerHotspots.isHotspot(notHotspotMutation, map),
            "SMURF1 R101N should not be a hotspot mutation.");
    });

    after(()=>{

    });

});
