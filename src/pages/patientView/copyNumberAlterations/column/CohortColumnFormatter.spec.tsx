import CohortColumnFormatter from './CohortColumnFormatter';
import {IGisticData} from "shared/model/Gistic";
import {DiscreteCopyNumberData, CopyNumberCount, CopyNumberCountIdentifier} from "shared/api/generated/CBioPortalAPI";
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import CopyNumberCountCache from "../../clinicalInformation/CopyNumberCountCache";
import {CacheData} from "../../clinicalInformation/SampleGeneCache";

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
            sampleId: "SAMPLE_01",
            patientId: "PATIENT1"
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
            sampleId: "SAMPLE_02",
            patientId: "PATIENT1"
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

    const gisticData:IGisticData = {
        0: [
            {
                amp: false,
                qValue: 0.00023,
                peakGeneCount: 5
            }
        ],
        1: [
            {
                amp: false,
                qValue: 0.00666,
                peakGeneCount: 8
            },
            {
                amp: true,
                qValue: 0.00045,
                peakGeneCount: 4
            }
        ]
    };
    const fakeCache:CopyNumberCountCache = new CopyNumberCountCache("");

    const tooltips: Array<ReactWrapper<any, any>> = [];

    before(() => {
        tooltips.push(mount(CohortColumnFormatter.tooltipContent([copyNumberData[0]], copyNumberCountData[0])));
        tooltips.push(mount(CohortColumnFormatter.tooltipContent([copyNumberData[1]], copyNumberCountData[1])));

        sinon.stub(fakeCache, 'get', (query:CopyNumberCountIdentifier):CacheData<CopyNumberCount>|null=>{
            let cnc:CopyNumberCount|undefined = copyNumberCountData.find(x=>{
                return x.entrezGeneId === query.entrezGeneId && x.alteration === query.alteration;
            });
            if (cnc) {
                return {
                    status:"complete",
                    data: cnc
                };
            } else {
                return null;
            }
        });
    });

    it('generates the tooltip text properly', () => {
        assert.equal(tooltips[0].text(), "61 samples (61.0%) in this study have deleted BRCA2");
        assert.equal(tooltips[1].text(), "1 sample (0.5%) in this study has amplified SMURF2");
    });

    it('calculates the sort value correctly', () => {
        assert.equal(CohortColumnFormatter.getSortValue([copyNumberData[0]], fakeCache), 61);
        assert.equal(CohortColumnFormatter.getSortValue([copyNumberData[1]], fakeCache), 1);
    });

    it('picks the correct gistic summary', () => {
        let summary = CohortColumnFormatter.getGisticValue([copyNumberData[0]], gisticData);

        let qValue = summary === null ? null : summary.qValue;
        let amp = summary === null ? null : summary.amp;
        let count = summary === null ? null : summary.peakGeneCount;

        assert.isFalse(summary === null, "Gistic summary should exist");
        assert.isFalse(amp, "Gistic summary should be the one marked as not amplified for a deleted CNA");
        assert.equal(qValue, 0.00023);
        assert.equal(count, 5);

        summary = CohortColumnFormatter.getGisticValue([copyNumberData[1]], gisticData);

        qValue = summary === null ? null : summary.qValue;
        amp = summary === null ? null : summary.amp;
        count = summary === null ? null : summary.peakGeneCount;

        assert.isFalse(summary === null, "Gistic summary should exist");
        assert.isTrue(amp, "Gistic summary should be the one marked as amplified for an amplified CNA");
        assert.equal(qValue, 0.00045);
        assert.equal(count, 4);
    });

    after(() => {

    });
});
