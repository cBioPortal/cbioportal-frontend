import CohortColumnFormatter from './CohortColumnFormatter';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {CopyNumberCount} from "shared/api/generated/CBioPortalAPIInternal";
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';

describe('CohortColumnFormatter', () => {

    const copyNumberData:DiscreteCopyNumberData[] = [
        {
            alteration: -2,
            entrezGeneId: 0,
            gene: {
                chromosome: "22",
                cytoband: "",
                entrezGeneId: 0,
                hugoGeneSymbol: "BRCA2",
                length: -1,
                type: ""
            },
            geneticProfileId: "alterations",
            sampleId: "SAMPLE_01"
        },
        {
            alteration: 2,
            entrezGeneId: 1,
            gene: {
                chromosome: "20",
                cytoband: "",
                entrezGeneId: 1,
                hugoGeneSymbol: "SMURF2",
                length: -1,
                type: ""
            },
            geneticProfileId: "alterations",
            sampleId: "SAMPLE_02"
        }
    ];

    const copyNumberCountData:CopyNumberCount[] = [
        {
            alteration: -2,
            entrezGeneId: 0,
            geneticProfileId: "alterations",
            numberOfSamples: 100,
            numberOfSamplesWithAlterationInGene: 61
        },
        {
            alteration: 2,
            entrezGeneId: 1,
            geneticProfileId: "alterations",
            numberOfSamples: 200,
            numberOfSamplesWithAlterationInGene: 1
        }
    ];

    const tooltips: Array<ReactWrapper<any, any>> = [];

    before(() => {
        tooltips.push(mount(CohortColumnFormatter.tooltipContent(copyNumberData[0], copyNumberCountData[0])));
        tooltips.push(mount(CohortColumnFormatter.tooltipContent(copyNumberData[1], copyNumberCountData[1])));
    });

    it('generates the tooltip text properly', () => {
        assert.equal(tooltips[0].text(), "61 samples (61.0%) in this study have deleted BRCA2");
        assert.equal(tooltips[1].text(), "1 sample (0.5%) in this study has amplified SMURF2");
    });

    it('calculates the sort value correctly', () => {
        assert.equal(CohortColumnFormatter.getSortValue(copyNumberData[0], copyNumberCountData), 61);
        assert.equal(CohortColumnFormatter.getSortValue(copyNumberData[1], copyNumberCountData), 1);
    });

    after(() => {

    });
});
