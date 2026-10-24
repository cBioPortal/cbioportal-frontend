import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { observable } from 'mobx';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { StudyViewPageStore } from './StudyViewPageStore';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    getOptionsByChartMetaDataType,
    SpecialChartsUniqueKeyEnum,
} from './StudyViewUtils';
import { ChartTypeEnum } from './StudyViewConfig';
import AddChartByType from './addChartButton/addChartByType/AddChartByType';

describe('Clinical Data column eligibility', () => {
    const treatmentKeys = [
        'SAMPLE_TREATMENTS',
        'PATIENT_TREATMENTS',
        'SAMPLE_TREATMENT_GROUPS',
        'PATIENT_TREATMENT_GROUPS',
        'SAMPLE_TREATMENT_TARGET',
        'PATIENT_TREATMENT_TARGET',
        'CLINICAL_EVENT_TYPE_COUNTS',
    ];
    const clinicalTreatment: ClinicalAttribute = {
        clinicalAttributeId: 'TREATMENT_TYPE',
        displayName: 'Treatment Type',
        description: 'Clinical treatment attribute',
        datatype: 'STRING',
        patientAttribute: true,
        priority: '1',
        studyId: 'test-study',
    };
    const sexAttribute: ClinicalAttribute = {
        ...clinicalTreatment,
        clinicalAttributeId: 'SEX',
        displayName: 'Sex',
    };
    let menu: ReactWrapper | undefined;

    afterEach(() => menu?.unmount());

    function createStore() {
        const cancerStudies: ChartMeta = {
            uniqueKey: SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
            displayName: 'Cancer Studies',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: false,
            description: '',
            priority: 1,
            renderWhenDataChange: false,
        };
        return Object.assign(Object.create(StudyViewPageStore.prototype), {
            _customCharts: observable.map([
                [cancerStudies.uniqueKey, cancerStudies],
            ]),
            _geneSpecificCharts: observable.map(),
            _genericAssayCharts: observable.map(),
            _XvsYCharts: observable.map(),
            _chartVisibility: observable.map(
                [
                    ...treatmentKeys,
                    clinicalTreatment.clinicalAttributeId,
                    sexAttribute.clinicalAttributeId,
                    cancerStudies.uniqueKey,
                ].map(key => [key, true] as [string, boolean])
            ),
            molecularProfiles: { result: [] },
            clinicalAttributes: { result: [clinicalTreatment, sexAttribute] },
            chartClinicalAttributes: {
                result: [clinicalTreatment, sexAttribute],
            },
            namespaceAttributes: { result: [] },
            survivalPlots: { result: [] },
            mutationProfiles: { result: [] },
            structuralVariantProfiles: { result: [] },
            cnaProfiles: { result: [] },
            shouldDisplayClinicalEventTypeCounts: { result: true },
            shouldDisplaySampleTreatments: { result: true },
            shouldDisplayPatientTreatments: { result: true },
            shouldDisplaySampleTreatmentGroups: { result: true },
            shouldDisplayPatientTreatmentGroups: { result: true },
            shouldDisplaySampleTreatmentTarget: { result: true },
            shouldDisplayPatientTreatmentTarget: { result: true },
        }) as StudyViewPageStore;
    }

    function renderMenu(
        store: StudyViewPageStore,
        eligibleCharts: { [id: string]: ChartMeta }
    ) {
        const charts = Object.values(store.chartMetaSet);
        const options = getOptionsByChartMetaDataType(
            charts,
            store.visibleAttributes.map(chart => chart.uniqueKey),
            Object.fromEntries(
                charts.map(chart => [chart.uniqueKey, ChartTypeEnum.PIE_CHART])
            ),
            undefined,
            eligibleCharts
        );
        menu = mount(
            <AddChartByType
                options={options}
                onAddAll={() => undefined}
                onClearAll={() => undefined}
                onToggleOption={() => undefined}
            />
        );
        return menu;
    }

    it.each(treatmentKeys)(
        'disables summary-only %s in the rendered column menu',
        key => {
            const store = createStore();
            const wrapper = renderMenu(
                store,
                store.chartMetaSetForClinicalData
            );
            const label = store.chartMetaSet[key].displayName;
            const checkbox = wrapper
                .find('label')
                .filterWhere(element => element.text() === label)
                .find('input');

            expect(checkbox.getDOMNode<HTMLInputElement>().checked).toBe(true);
            expect(checkbox.getDOMNode<HTMLInputElement>().disabled).toBe(true);
            expect(store.chartMetaSetForClinicalData[key]).toBeUndefined();
        }
    );

    it('keeps real clinical treatment attributes and Cancer Studies selectable', () => {
        const store = createStore();
        const wrapper = renderMenu(store, store.chartMetaSetForClinicalData);

        for (const label of ['Treatment Type', 'Sex', 'Cancer Studies']) {
            const checkbox = wrapper
                .find('label')
                .filterWhere(element => element.text() === label)
                .find('input');
            expect(checkbox.getDOMNode<HTMLInputElement>().disabled).toBe(
                false
            );
            expect(checkbox.getDOMNode<HTMLInputElement>().checked).toBe(true);
        }
        expect(
            store.visibleAttributesForClinicalData.map(chart => chart.uniqueKey)
        ).toEqual([
            clinicalTreatment.clinicalAttributeId,
            sexAttribute.clinicalAttributeId,
            SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
        ]);
    });

    it('keeps treatment and timeline charts selectable in the Summary menu', () => {
        const store = createStore();
        const wrapper = renderMenu(store, store.chartMetaSetForSummary);

        for (const key of treatmentKeys) {
            const label = store.chartMetaSet[key].displayName;
            const checkbox = wrapper
                .find('label')
                .filterWhere(element => element.text() === label)
                .find('input');
            expect(checkbox.getDOMNode<HTMLInputElement>().disabled).toBe(
                false
            );
            expect(checkbox.getDOMNode<HTMLInputElement>().checked).toBe(true);
            expect(store.chartMetaSetForSummary[key]).toBeDefined();
        }
    });
});
