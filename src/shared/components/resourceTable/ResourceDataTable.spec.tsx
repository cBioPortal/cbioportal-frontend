import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { ResourceDataTable } from './ResourceDataTable';
import { ResourceColumnInfo } from 'shared/api/resourceTableClient';
import { ResourceTableStore } from './ResourceTableStore';
import { observable, runInAction } from 'mobx';
import { act } from 'react-dom/test-utils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ServerDrivenTable from 'shared/components/serverDrivenTable/ServerDrivenTable';

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
                distinctValueCounts: {},
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
            headerText({
                // A resource with no override, so the default is what is under test.
                activeResourceId: 'IDC_SLIM',
                activeResourceLabel: 'Slide Microscopy',
            } as any),
            '3074 Slide Microscopies'
        );
    });

    it('names the resource without pluralizing it when its rows are not instances of it', () => {
        // CyCIF is a technique; its 12 rows are regions of one slide, not twelve "CyCIFs".
        const text = headerText({
            activeResourceId: 'CYCIF',
            activeResourceLabel: 'CyCIF',
            totalRowCount: 12,
            filteredPatientCount: 1,
            filteredSampleCount: 12,
        } as any);
        // The fixture has no rows on the page, so only the total is asserted, not the range.
        assert.include(text, 'of 12·CyCIF·');
        assert.notInclude(text, 'CyCIFs');
        assert.include(text, '1 patient / 12 samples');
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

    const visibilityOf = (
        columnId: string,
        distinctValueCounts: Record<string, number>
    ) => {
        const table = tableWith({ distinctValueCounts } as any);
        return table.tableColumns.find(c => c.id === columnId)?.visible;
    };

    it('hides a builtin column whose value is the same in every row', () => {
        // In a single-resource tab "Resource Type" is always the resource's own name, "Scope" is
        // usually one entity type, and "Details" is often blank throughout — none of which tells
        // the user anything.
        const single = {
            resourceDisplayName: 1,
            resourceType: 1,
            displayName: 1,
        };

        assert.isFalse(!!visibilityOf('resourceType', single));
        assert.isFalse(!!visibilityOf('resourceScope', single));
        assert.isFalse(!!visibilityOf('description', single));
    });

    it('keeps a builtin column that actually varies', () => {
        const varied = {
            resourceDisplayName: 3,
            resourceType: 2,
            displayName: 47,
        };

        assert.isTrue(!!visibilityOf('resourceType', varied));
        assert.isTrue(!!visibilityOf('resourceScope', varied));
        assert.isTrue(!!visibilityOf('description', varied));
    });

    it('keeps builtin columns visible when the backend sent no counts', () => {
        // Older responses have no distinctValueCounts; no column should disappear.
        assert.isTrue(!!visibilityOf('resourceType', {}));
        assert.isTrue(!!visibilityOf('description', {}));
    });

    it('downloads the link column as the URL behind it', () => {
        // The cell renders "Open in new window", which is meaningless in an exported file.
        const table = tableWith({});
        const link = table.tableColumns.find(c => c.id === 'link');

        assert.isDefined(link);
        assert.equal(link!.name, 'Link');
        assert.equal(
            link!.download!({ url: 'https://example.com/slide.dcm' } as any),
            'https://example.com/slide.dcm'
        );
    });
});

describe('ResourceDataTable loading state', () => {
    const storeFor = (ready: boolean) =>
        observable(
            {
                columns: [],
                facets: {},
                facetRanges: {},
                distinctValueCounts: {},
                rowsForDisplay: [],
                tabsForDisplay: [{ id: 'SLIDE', label: 'Slide' }],
                totalRowCount: 0,
                pageNumber: 0,
                pageSize: 25,
                sortDirection: 'asc',
                activeResourceId: 'SLIDE',
                tabs: { isPending: false, isError: false, isComplete: true },
                tableData: { isPending: !ready, isError: false },
                isTableReady: ready,
                setPage: () => undefined,
                setPageSize: () => undefined,
                setSearchTerm: () => undefined,
            },
            {},
            { deep: false }
        );

    const render = (store: any) =>
        mount(
            <ResourceDataTable
                store={store as ResourceTableStore}
                hideTabs={true}
                scopedResourceId="SLIDE"
            />
        );

    it('waits for rows and columns before drawing the table', () => {
        // Both pages render their own tab strip and pass hideTabs, so this is the only guard
        // they get.
        const wrapper = render(storeFor(false));

        assert.lengthOf(wrapper.find(LoadingIndicator), 1);
        assert.lengthOf(wrapper.find(ServerDrivenTable), 0);
    });

    it('keeps the table in place while a later page loads', () => {
        // Paging, sorting and filtering re-fetch. Replacing the table each time would make it
        // disappear and come back; ServerDrivenTable dims itself instead.
        const store = storeFor(true);
        const wrapper = render(store);
        assert.lengthOf(wrapper.find(ServerDrivenTable), 1);

        act(() =>
            runInAction(() => {
                store.isTableReady = false;
                store.tableData = { isPending: true, isError: false };
            })
        );
        wrapper.update();

        assert.lengthOf(wrapper.find(ServerDrivenTable), 1);
        assert.isTrue(wrapper.find(ServerDrivenTable).prop('isLoading'));
    });

    it('goes back to the loading indicator when the resource changes', () => {
        const store = storeFor(true);
        const wrapper = render(store);

        act(() =>
            runInAction(() => {
                store.activeResourceId = 'REPORT';
                store.isTableReady = false;
            })
        );
        wrapper.update();

        assert.lengthOf(wrapper.find(ServerDrivenTable), 0);
        assert.lengthOf(wrapper.find(LoadingIndicator), 1);
    });

    it('reports an error from either request', () => {
        const store = storeFor(true);
        const wrapper = render(store);

        act(() =>
            runInAction(() => {
                store.tableData = { isPending: false, isError: true };
            })
        );
        wrapper.update();

        assert.include(wrapper.text(), 'Error loading resources.');
    });
});

describe('ResourceDataTable view action', () => {
    const row = {
        key: 'k',
        studyId: 'study',
        resourceId: 'CYCIF',
        patientId: 'Pt-8',
        patientStableId: 'Pt-8',
        sampleId: 'S1',
        sampleStableId: 'S1',
        resourceType: 'CyCIF',
        resourceScope: 'SAMPLE',
        description: '',
        url: 'https://example.com/a',
        metadata: {},
    } as any;

    const table = (props: any = {}) =>
        new ResourceDataTable({
            store: {
                columns: [],
                facets: {},
                facetRanges: {},
                distinctValueCounts: {},
                rowsForDisplay: [row],
            } as any,
            ...props,
        });

    it('offers no view action on a page that only links out', () => {
        // The study view keeps the plain table.
        const ids = table().tableColumns.map(c => c.id);
        assert.notInclude(ids, 'view');
    });

    it('places it immediately left of the link out', () => {
        const ids = table({ onOpenResource: () => undefined }).tableColumns.map(
            c => c.id
        );
        assert.equal(ids[ids.indexOf('link') - 1], 'view');
    });

    it('hands the clicked row to the page', () => {
        const opened: any[] = [];
        const column = table({
            onOpenResource: (r: any) => opened.push(r),
        }).tableColumns.find(c => c.id === 'view');

        const cell: any = column!.render(row);
        cell.props.onClick();

        assert.deepEqual(opened, [row]);
    });
});
