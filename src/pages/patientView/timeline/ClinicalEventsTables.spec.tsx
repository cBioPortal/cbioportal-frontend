import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount, ReactWrapper } from 'enzyme';
import { assert } from 'chai';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import ClinicalEventsTables from './ClinicalEventsTables';

function event(label: string, start: number, stop?: number): ClinicalEvent {
    return {
        studyId: 'study',
        patientId: 'patient',
        uniquePatientKey: 'patient-key',
        eventType: 'TREATMENT',
        startNumberOfDaysSinceDiagnosis: start,
        endNumberOfDaysSinceDiagnosis: stop,
        attributes: [
            { clinicalEventId: 1, key: 'EVENT_ID', value: label },
            { clinicalEventId: 1, key: 'VALUE', value: start.toString() },
            { clinicalEventId: 1, key: 'STYLE_COLOR', value: 'red' },
        ],
    } as ClinicalEvent;
}

describe('ClinicalEventsTables', () => {
    let wrapper: ReactWrapper;
    let events: ClinicalEvent[];
    let originalEvents: string;

    beforeEach(() => {
        events = [
            event('two', 2, 100),
            event('ten', 10, 2),
            event('hundred', 100, 10),
            event('negative', -2, -2),
            event('zero', 0, 0),
            event('two again', 2, 100),
            event('missing stop', 5),
        ];
        originalEvents = JSON.stringify(events);
        wrapper = mount(<ClinicalEventsTables clinicalEvents={events} />);
    });

    afterEach(() => {
        assert.equal(JSON.stringify(events), originalEvents);
        act(() => wrapper.unmount());
    });

    function headers() {
        return wrapper.find('th').map(header => header.text());
    }

    function values(column: string) {
        const columnIndex = headers().indexOf(column);
        assert.isAtLeast(columnIndex, 0);
        return wrapper.find('tbody tr').map(row =>
            row
                .find('td')
                .at(columnIndex)
                .text()
        );
    }

    function sort(column: string) {
        act(() => {
            wrapper
                .find('th span')
                .filterWhere(header => header.text() === column)
                .first()
                .simulate('click');
        });
        wrapper.update();
    }

    it('sorts start days numerically in both directions with stable equal days', () => {
        sort('START_DATE');
        assert.deepEqual(values('EVENT_ID'), [
            'negative',
            'zero',
            'two',
            'two again',
            'missing stop',
            'ten',
            'hundred',
        ]);
        sort('START_DATE');
        assert.deepEqual(values('EVENT_ID'), [
            'hundred',
            'ten',
            'missing stop',
            'two',
            'two again',
            'zero',
            'negative',
        ]);
    });

    it('sorts stop days numerically and leaves missing days last in both directions', () => {
        sort('STOP_DATE');
        assert.deepEqual(values('EVENT_ID'), [
            'negative',
            'zero',
            'ten',
            'hundred',
            'two',
            'two again',
            'missing stop',
        ]);
        sort('STOP_DATE');
        assert.deepEqual(values('EVENT_ID'), [
            'two',
            'two again',
            'hundred',
            'ten',
            'zero',
            'negative',
            'missing stop',
        ]);
    });

    it('keeps numeric-looking text attributes in lexical order', () => {
        sort('VALUE');
        assert.deepEqual(values('EVENT_ID'), [
            'negative',
            'zero',
            'ten',
            'hundred',
            'two',
            'two again',
            'missing stop',
        ]);
        sort('VALUE');
        assert.deepEqual(values('EVENT_ID'), [
            'missing stop',
            'two',
            'two again',
            'hundred',
            'ten',
            'zero',
            'negative',
        ]);
    });

    it('preserves displayed and downloaded day strings and hidden columns', () => {
        assert.deepEqual(headers(), [
            'START_DATE',
            'STOP_DATE',
            'EVENT_TYPE',
            'EVENT_ID',
            'VALUE',
        ]);
        assert.deepEqual(values('START_DATE'), [
            '2',
            '10',
            '100',
            '-2',
            '0',
            '2',
            '5',
        ]);
        assert.deepEqual(values('STOP_DATE'), [
            '100',
            '2',
            '10',
            '-2',
            '0',
            '100',
            '',
        ]);
        const table = wrapper.findWhere(
            node => node.instance() instanceof LazyMobXTable
        );
        assert.equal(table.length, 1);
        const download = (table.instance() as LazyMobXTable<{}>).getDownloadData();
        assert.include(download, '2\t100\tTREATMENT\ttwo\t2');
        assert.include(download, '-2\t-2\tTREATMENT\tnegative\t-2');
        assert.include(download, '0\t0\tTREATMENT\tzero\t0');
        assert.include(download, '5\t\tTREATMENT\tmissing stop\t5');
        assert.notInclude(download, 'STYLE_COLOR');
        assert.notInclude(download, 'PATIENT_ID');
    });
});
