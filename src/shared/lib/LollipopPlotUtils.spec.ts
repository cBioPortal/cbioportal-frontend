import { assert } from 'chai';
import {initMutation} from "test/MutationMockUtils";

import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {lollipopLabelText, lollipopLabelTextAnchor} from "./LollipopPlotUtils";

describe('LollipopPlotUtils', () => {

    let mutationsAtPosition: Mutation[];

    before(() => {
        mutationsAtPosition = [
            initMutation({
                sampleId: "a1",
                proteinChange: "G12A"
            }),
            initMutation({
                sampleId: "c1",
                proteinChange: "G12C"
            }),
            initMutation({
                sampleId: "c2",
                proteinChange: "G12C"
            }),
            initMutation({
                sampleId: "c3",
                proteinChange: "G12C"
            }),
            initMutation({
                sampleId: "d1",
                proteinChange: "G12D"
            }),
            initMutation({
                sampleId: "d2",
                proteinChange: "G12D"
            }),
            initMutation({
                sampleId: "d3",
                proteinChange: "G12D"
            }),
            initMutation({
                sampleId: "d4",
                proteinChange: "G12D"
            }),
            initMutation({
                sampleId: "d5",
                proteinChange: "G12D"
            }),
            initMutation({
                sampleId: "n1",
                proteinChange: "G12N"
            }),
            initMutation({
                sampleId: "n2",
                proteinChange: "G12N"
            }),
            initMutation({
                sampleId: "v1",
                proteinChange: "G12V"
            }),
            initMutation({
                sampleId: "v2",
                proteinChange: "G12V"
            }),
            initMutation({
                sampleId: "v3",
                proteinChange: "G12V"
            }),
            initMutation({
                sampleId: "v4",
                proteinChange: "G12V"
            }),
            initMutation({
                sampleId: "s1",
                proteinChange: "G12S"
            }),
            initMutation({
                sampleId: "r1",
                proteinChange: "G12R"
            }),
            initMutation({
                sampleId: "ac1",
                proteinChange: "GG12AC"
            }),
            initMutation({
                sampleId: "dc1",
                proteinChange: "GG12DC"
            })
        ];
    });

    describe('lollipopLabelText', () => {
        it('generates lollipop labels wrt different size selections', () => {
            assert.equal(lollipopLabelText(mutationsAtPosition),
                "G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC");
            assert.equal(lollipopLabelText(mutationsAtPosition, -1),
                "G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC");
            assert.equal(lollipopLabelText(mutationsAtPosition, 0),
                "G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC");

            assert.equal(lollipopLabelText(mutationsAtPosition, 1),
                "G12D and 8 more");
            assert.equal(lollipopLabelText(mutationsAtPosition, 2),
                "G12D/V and 7 more");
            assert.equal(lollipopLabelText(mutationsAtPosition, 3),
                "G12D/V/C and 6 more");
            assert.equal(lollipopLabelText(mutationsAtPosition, 4),
                "G12D/V/C/N and 5 more");
            assert.equal(lollipopLabelText(mutationsAtPosition, 5),
                "G12D/V/C/N/A and 4 more");
            assert.equal(lollipopLabelText(mutationsAtPosition, 6),
                "G12D/V/C/N/A/R and 3 more");
        });
    });

    describe('lollipopLabelTextAnchor', () => {
        it ('determines anchor position wrt protein change position and label length', () => {
            assert.equal(lollipopLabelTextAnchor("G12D", 1, "arial", 10, 640, 640),
                "start");
            assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 1, "arial", 10, 640, 640),
                "start");
            assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 1, "arial", 10, 640, 640),
                "start");

            assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 100, "arial", 10, 640, 640),
                "middle");
            assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 320, "arial", 10, 640, 640),
                "middle");
            assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 540, "arial", 10, 640, 640),
                "middle");
            assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 320, "arial", 10, 640, 640),
                "middle");

            assert.equal(lollipopLabelTextAnchor("G12D", 639, "arial", 10, 640, 640),
                "end");
            assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 620, "arial", 10, 640, 640),
                "end");
            assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 540, "arial", 10, 640, 640),
                "end");
        });
    });
});
