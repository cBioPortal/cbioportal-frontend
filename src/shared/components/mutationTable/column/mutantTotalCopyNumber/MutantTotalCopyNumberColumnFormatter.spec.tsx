import { mount } from 'enzyme';
import { assert } from 'chai';
import { ClinicalData } from 'cbioportal-ts-api-client';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { initMutation } from 'test/MutationMockUtils';
import { initClinicalData } from 'test/ClinicalDataMockUtils';
import { CLINICAL_ATTRIBUTE_ID_ENUM } from 'shared/constants';
import SampleManager from 'pages/patientView/SampleManager';
import MutantTotalCopyNumberColumnFormatter, {
    getDefaultMutantTotalCopyNumberColumnDefinition,
} from './MutantTotalCopyNumberColumnFormatter';

function mutation(sampleId: string, mutant: number, total: number) {
    return initMutation({
        sampleId,
        alleleSpecificCopyNumber: {
            ascnMethod: 'FACETS',
            expectedAltCopies: mutant,
            totalCopyNumber: total,
            minorCopyNumber: 0,
        },
    });
}

// a mutation without allele specific copy number data
function mutationWithoutAscn(sampleId: string) {
    const m = initMutation({ sampleId });
    delete (m as any).alleleSpecificCopyNumber;
    return m;
}

function wgd(sampleId: string, value: string): ClinicalData {
    return initClinicalData({
        sampleId,
        clinicalAttributeId: CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_WGD,
        value,
    });
}

function complete(map: {
    [sampleId: string]: ClinicalData[];
}): MobxPromise<{ [sampleId: string]: ClinicalData[] }> {
    return {
        result: map,
        status: 'complete' as 'complete',
        peekStatus: 'complete',
        isPending: false,
        isError: false,
        isComplete: true,
        error: undefined,
    };
}

describe('MutantTotalCopyNumberColumnFormatter', () => {
    const sampleManager = new SampleManager([], []);
    const clinicalData = complete({
        S1: [wgd('S1', 'WGD')],
        S2: [wgd('S2', 'no WGD')],
        S3: [wgd('S3', 'no WGD')],
    });

    function render(
        mutations: ReturnType<typeof mutation>[],
        sampleIds: string[],
        manager: SampleManager | null = sampleManager
    ) {
        return mount(
            MutantTotalCopyNumberColumnFormatter.renderFunction(
                mutations,
                sampleIds,
                clinicalData,
                manager
            )
        );
    }

    it('shows mutant / total copies as text for a single sample', () => {
        const cell = render([mutation('S2', 1, 2)], ['S2']);
        assert.equal(cell.text(), '1 / 2');
    });

    it('adds a WGD tag for a single whole genome doubled sample', () => {
        const cell = render([mutation('S1', 2, 4)], ['S1']);
        assert.equal(cell.text(), '2 / 4WGD');
    });

    it('draws one box per copy for each sample, filled for mutant copies', () => {
        const cell = render(
            [mutation('S2', 1, 2), mutation('S3', 1, 3)],
            ['S1', 'S2', 'S3']
        );
        const stacks = cell.find('g');
        // S1 has no value for this mutation
        assert.equal(stacks.length, 2);
        assert.equal(stacks.at(0).find('rect').length, 2);
        assert.equal(stacks.at(1).find('rect').length, 3);
        assert.equal(
            stacks
                .at(1)
                .find('rect')
                .filterWhere(r => r.prop('fill') !== 'white').length,
            1
        );
    });

    it('marks whole genome doubling on top of the stack', () => {
        const cell = render(
            [mutation('S1', 2, 4), mutation('S2', 1, 2)],
            ['S1', 'S2']
        );
        const stacks = cell.find('g');
        // four copy boxes and the WGD mark
        assert.equal(stacks.at(0).find('rect').length, 5);
        assert.equal(stacks.at(1).find('rect').length, 2);
    });

    it("caps the boxes and adds a '+' for many copies", () => {
        const cell = render(
            [mutation('S2', 1, 7), mutation('S3', 1, 2)],
            ['S2', 'S3']
        );
        const stacks = cell.find('g');
        assert.equal(stacks.at(0).find('rect').length, 4);
        assert.equal(
            stacks
                .at(0)
                .find('text')
                .text(),
            '+'
        );
    });

    it('renders nothing when no sample has copy numbers', () => {
        const cell = render([mutationWithoutAscn('S2')], ['S2']);
        assert.equal(cell.text(), '');
        assert.equal(cell.find('svg').length, 0);
    });

    it('shows a loader while the WGD data loads', () => {
        const pending = {
            ...clinicalData,
            isComplete: false,
            isPending: true,
            status: 'pending' as 'pending',
            peekStatus: 'pending' as 'pending',
        };
        const cell = mount(
            MutantTotalCopyNumberColumnFormatter.renderFunction(
                [mutation('S2', 1, 2)],
                ['S2'],
                pending,
                sampleManager
            )
        );
        assert.equal(cell.text(), '');
    });

    it('downloads mutant/total copies', () => {
        const column = getDefaultMutantTotalCopyNumberColumnDefinition(
            ['S2'],
            clinicalData
        );
        assert.deepEqual(column.download([mutation('S2', 1, 2)]), ['1/2']);
        assert.deepEqual(column.download([mutationWithoutAscn('S2')]), ['']);
    });
});
