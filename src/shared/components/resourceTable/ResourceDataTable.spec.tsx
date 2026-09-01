import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { ResourceDataTable } from './ResourceDataTable';
import { ResourceColumnInfo } from 'shared/api/resourceTableClient';
import { ResourceTableStore } from './ResourceTableStore';

describe('ResourceDataTable metadata columns', () => {
    const metadataColumn = (
        overrides: Partial<ResourceColumnInfo> & { id: string }
    ): ResourceColumnInfo => ({
        label: overrides.id,
        source: 'metadata',
        dataType: 'string',
        filterable: true,
        sortable: true,
        visibleByDefault: false,
        ...overrides,
    });

    const tableWith = (store: Partial<ResourceTableStore>) =>
        new ResourceDataTable({
            store: {
                columns: [],
                facets: {},
                facetRanges: {},
                rowsForDisplay: [],
                ...store,
            } as any,
        });

    const columns = (store: Partial<ResourceTableStore>) =>
        tableWith(store).metadataColumns;

    it('takes label, description, type and filterability from the backend columns', () => {
        const cols = columns({
            columns: [
                { id: 'patientId', label: 'Patient ID', source: 'builtin' },
                metadataColumn({
                    id: 'metadata:score',
                    label: 'Dose Score',
                    description: 'Radiation dose score',
                    dataType: 'number',
                }),
                metadataColumn({
                    id: 'metadata:operator',
                    label: 'Operator',
                    filterable: false,
                }),
            ] as ResourceColumnInfo[],
        });

        assert.deepEqual(
            cols.map(c => c.id),
            ['metadata:score', 'metadata:operator']
        );
        assert.equal(cols[0].name, 'Dose Score');
        assert.equal(cols[0].description, 'Radiation dose score');
        assert.equal(cols[0].dataType, 'number');
        assert.isTrue(cols[0].filterable);
        assert.equal(cols[1].filterable, false);
    });

    it('preserves the backend column order rather than sorting', () => {
        const cols = columns({
            columns: [
                metadataColumn({ id: 'metadata:zebra' }),
                metadataColumn({ id: 'metadata:alpha' }),
            ] as ResourceColumnInfo[],
        });

        assert.deepEqual(
            cols.map(c => c.id),
            ['metadata:zebra', 'metadata:alpha']
        );
    });

    it('keeps metadata columns hidden unless the backend says otherwise', () => {
        const cols = columns({
            columns: [
                metadataColumn({ id: 'metadata:a' }),
                metadataColumn({ id: 'metadata:b', visibleByDefault: true }),
            ] as ResourceColumnInfo[],
        });

        assert.isFalse(!!cols[0].visible);
        assert.isTrue(!!cols[1].visible);
    });

    it('falls back to facet-derived alphabetical keys when the response has no metadata columns', () => {
        // Older backends, and any response where nothing was discovered, must keep working.
        const cols = columns({
            columns: [],
            facets: { 'metadata:stain': [], 'metadata:aperture': [] } as any,
            facetRanges: { 'metadata:score': { min: 1, max: 9 } } as any,
        });

        assert.deepEqual(
            cols.map(c => c.id),
            ['metadata:aperture', 'metadata:score', 'metadata:stain']
        );
        assert.equal(cols[0].name, 'aperture');
        assert.equal(
            cols.find(c => c.id === 'metadata:score')!.dataType,
            'number'
        );
    });

    it('renders the metadata value for its own key', () => {
        const cols = columns({
            columns: [
                metadataColumn({ id: 'metadata:stain', label: 'Stain' }),
            ] as ResourceColumnInfo[],
        });

        assert.equal(
            cols[0].download!({ metadata: { stain: 'HE' } } as any),
            'HE'
        );
    });

    const headerText = (store: Partial<ResourceTableStore>) => {
        const table = tableWith({
            totalRowCount: 3074,
            pageNumber: 0,
            pageSize: 25,
            filteredPatientCount: 1084,
            filteredSampleCount: 0,
            ...store,
        });
        return mount(<div>{table.headerContent}</div>).text();
    };

    it('names the rows after the resource, pluralized', () => {
        assert.include(
            headerText({ activeResourceLabel: 'Slide Microscopy' } as any),
            '3074 Slide Microscopies'
        );
    });

    it('uses the singular form when there is one row', () => {
        assert.include(
            headerText({
                activeResourceLabel: 'CT Scan',
                totalRowCount: 1,
            } as any),
            '1 CT Scan'
        );
    });

    it('omits the sample count for a resource with no sample-linked rows', () => {
        // Patient-level resources can never report a sample count, so "0 samples" is noise.
        const text = headerText({ activeResourceLabel: 'CT Scan' } as any);

        assert.include(text, '1084 patients');
        assert.notInclude(text, 'sample');
    });

    it('shows the sample count when there is one', () => {
        assert.include(
            headerText({
                activeResourceLabel: 'H&E Slide',
                filteredSampleCount: 12,
            } as any),
            '1084 patients / 12 samples'
        );
    });

    it('falls back to the caller label before the tabs have loaded', () => {
        const table = new ResourceDataTable({
            store: {
                columns: [],
                facets: {},
                facetRanges: {},
                rowsForDisplay: [],
                totalRowCount: 3074,
                activeResourceLabel: undefined,
            } as any,
            resourceLabel: 'resources',
        });

        assert.equal(table.itemsLabel, 'resources');
    });
});
