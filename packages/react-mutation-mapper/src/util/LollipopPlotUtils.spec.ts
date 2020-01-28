import { assert } from 'chai';

import { lollipopLabelText } from './LollipopPlotUtils';
import { Mutation } from '../model/Mutation';

describe('LollipopPlotUtils', () => {
    let mutationsAtPosition: Mutation[];

    beforeAll(() => {
        mutationsAtPosition = [
            {
                proteinChange: 'G12A',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12C',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12C',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12C',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12N',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12N',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12S',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12R',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'GG12AC',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'GG12DC',
                proteinPosStart: 12,
            },
        ];
    });

    describe('lollipopLabelText', () => {
        it('generates lollipop labels wrt different size selections', () => {
            assert.equal(
                lollipopLabelText(mutationsAtPosition),
                'G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, -1),
                'G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 0),
                'G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC'
            );

            assert.equal(
                lollipopLabelText(mutationsAtPosition, 1),
                'G12D and 8 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 2),
                'G12D/V and 7 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 3),
                'G12D/V/C and 6 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 4),
                'G12D/V/C/N and 5 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 5),
                'G12D/V/C/N/A and 4 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 6),
                'G12D/V/C/N/A/R and 3 more'
            );
        });
    });

    // TODO disabled for now due to an incompatibility with JEST
    //  See https://stackoverflow.com/questions/33269093/how-to-add-canvas-support-to-my-tests-in-jest
    // describe('lollipopLabelTextAnchor', () => {
    //     it ('determines anchor position wrt protein change position and label length', () => {
    //         assert.equal(lollipopLabelTextAnchor("G12D", 1, "arial", 10, 640, 640),
    //             "start");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 1, "arial", 10, 640, 640),
    //             "start");
    //         assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 1, "arial", 10, 640, 640),
    //             "start");
    //
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 100, "arial", 10, 640, 640),
    //             "middle");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 320, "arial", 10, 640, 640),
    //             "middle");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 540, "arial", 10, 640, 640),
    //             "middle");
    //         assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 320, "arial", 10, 640, 640),
    //             "middle");
    //
    //         assert.equal(lollipopLabelTextAnchor("G12D", 639, "arial", 10, 640, 640),
    //             "end");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 620, "arial", 10, 640, 640),
    //             "end");
    //         assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 540, "arial", 10, 640, 640),
    //             "end");
    //     });
    // });
});
