import { assert } from 'chai';
import {
    compareByPtmTypePriority,
    groupPtmDataByPosition,
    groupPtmDataByTypeAndPosition,
    ptmColor,
} from './PtmUtils';

describe('PtmUtils', () => {
    const ptmData = [
        {
            // 0
            ensemblTranscriptIds: [],
            position: 0,
            pubmedIds: [],
            sequence: '',
            type: 'Acetylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 1
            ensemblTranscriptIds: [],
            position: 0,
            pubmedIds: [],
            sequence: '',
            type: 'Ubiquitination',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 2
            ensemblTranscriptIds: [],
            position: 1,
            pubmedIds: [],
            sequence: '',
            type: 'Ubiquitination',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 3
            ensemblTranscriptIds: [],
            position: 1,
            pubmedIds: [],
            sequence: '',
            type: 'Acetylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 4
            ensemblTranscriptIds: [],
            position: 1,
            pubmedIds: [],
            sequence: '',
            type: 'Phosphorylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 5
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Methylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 6
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Ubiquitination',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 7
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Glutathionylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 8
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Sumoylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
    ];

    describe('compareByPtmTypePriority', () => {
        it('compares ptm types by priority', () => {
            assert.equal(
                compareByPtmTypePriority('Phosphorylation', 'Phosphorylation'),
                0,
                'identical strings should return 0'
            );
            assert.equal(
                compareByPtmTypePriority('Phosphorylation', 'Acetylation'),
                -1,
                'Phosphorylation has a higher priority than Acetylation'
            );
            assert.equal(
                compareByPtmTypePriority('Phosphorylation', 'Methylation'),
                -1,
                'Phosphorylation has a higher priority than Methylation'
            );
            assert.equal(
                compareByPtmTypePriority('Methylation', 'Acetylation'),
                1,
                'Methylation has a lower priority than Acetylation'
            );
            assert.equal(
                compareByPtmTypePriority('Ubiquitination', 'Sumoylation'),
                -1,
                'Ubiquitination has a higher priority than Sumoylation'
            );
            assert.equal(
                compareByPtmTypePriority('Unknown', 'Sumoylation'),
                1,
                'No priority defined for Unknown or Sumoylation, sort alphabetically'
            );
            assert.equal(compareByPtmTypePriority('Sumoylation', 'Sumoylation'), 0);
        });
    });

    describe('groupPtmDataByPosition', () => {
        it('groups ptm data by position', () => {
            const grouped = groupPtmDataByPosition(ptmData);

            assert.equal(grouped[0].length, 2);
            assert.equal(grouped[1].length, 3);
            assert.equal(grouped[2].length, 4);
        });
    });

    describe('groupPtmDataByTypeAndPosition', () => {
        it('groups ptm data by type and position', () => {
            const grouped = groupPtmDataByTypeAndPosition(ptmData);

            assert.equal(grouped['Acetylation'][0].length, 1);
            assert.equal(grouped['Acetylation'][1].length, 1);
            assert.equal(grouped['Ubiquitination'][0].length, 1);
            assert.equal(grouped['Ubiquitination'][1].length, 1);
            assert.equal(grouped['Ubiquitination'][2].length, 1);
            assert.equal(grouped['Phosphorylation'][1].length, 1);
            assert.equal(grouped['Methylation'][2].length, 1);
            assert.equal(grouped['Glutathionylation'][2].length, 1);
            assert.equal(grouped['Sumoylation'][2].length, 1);
        });
    });

    describe('ptmColor', () => {
        it('picks the correct color for a list of PTMs', () => {
            assert.equal(
                ptmColor(ptmData),
                '#444444',
                'mixed PTM types should have a special color'
            );
            assert.equal(ptmColor([ptmData[4]]), '#2DCF00', 'Phosphorylation: #2DCF00');
            assert.equal(ptmColor([ptmData[0], ptmData[3]]), '#5B5BFF', 'Acetylation: #5B5BFF');
            assert.equal(
                ptmColor([ptmData[1], ptmData[2], ptmData[6]]),
                '#B9264F',
                'Ubiquitination: #B9264F'
            );
            assert.equal(ptmColor([ptmData[5]]), '#EBD61D', 'Methylation: #EBD61D');
            assert.equal(ptmColor([ptmData[7]]), '#BA21E0', 'Glutathionylation (default): #BA21E0');
            assert.equal(ptmColor([ptmData[8]]), '#BA21E0', 'Sumoylation (default): #BA21E0');
        });
    });
});
