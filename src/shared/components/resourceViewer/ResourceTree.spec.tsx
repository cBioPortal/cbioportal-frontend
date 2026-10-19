import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import ResourceTree from './ResourceTree';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';

describe('ResourceTree', () => {
    const row = (
        resourceId: string,
        resourceType: string,
        sampleId: string
    ): IResourceTableRow =>
        ({
            key: `${resourceId}-${sampleId}`,
            studyId: 'study',
            patientId: 'Pt-8',
            sampleId,
            resourceType,
            resourceScope: 'SAMPLE',
            resourceId,
            description: '',
            url: `https://example.com/${resourceId}/${sampleId}`,
            metadata: {},
        } as IResourceTableRow);

    // The order the backend returns: grouped by resource, then patient and sample.
    const rows = [
        row('CYCIF', 'CyCIF', 'S1'),
        row('CYCIF', 'CyCIF', 'S2'),
        row('IDC_OHIF_CT', 'Computed Tomography', 'S1'),
    ];

    const tree = (props: any = {}) =>
        mount(
            <ResourceTree rows={rows} onSelect={() => undefined} {...props} />
        );

    it('groups the rows by resource', () => {
        const labels = tree()
            .find('[data-test="ResourceTree"]')
            .first()
            .find('div')
            .filterWhere(n => /CyCIF|Computed Tomography/.test(n.text()))
            .map(n => n.text());

        assert.isTrue(labels.some(l => l.includes('CyCIF')));
        assert.isTrue(labels.some(l => l.includes('Computed Tomography')));
    });

    it('lists every row as a leaf', () => {
        assert.equal(tree().find('[data-test="ResourceTreeLeaf"]').length, 3);
    });

    it('marks only the selected leaf', () => {
        const marked = tree({ selectedKey: 'CYCIF-S2' })
            .find('[data-test="ResourceTreeLeaf"]')
            .map((n: any) => n.prop('data-test-selected'));

        assert.deepEqual(marked, [undefined, 'true', undefined]);
    });

    it('reports the row that was clicked, across resource boundaries', () => {
        // The point of the tree: reaching the CT without leaving the slide tab.
        const picked: IResourceTableRow[] = [];
        tree({ onSelect: (r: IResourceTableRow) => picked.push(r) })
            .find('[data-test="ResourceTreeLeaf"]')
            .at(2)
            .simulate('click');

        assert.equal(picked.length, 1);
        assert.equal(picked[0].resourceId, 'IDC_OHIF_CT');
    });

    it('renders nothing when the patient has no resources', () => {
        assert.isFalse(
            tree({ rows: [] })
                .find('[data-test="ResourceTree"]')
                .exists()
        );
    });
});
