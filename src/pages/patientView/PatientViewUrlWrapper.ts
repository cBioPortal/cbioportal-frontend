import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { PagePath } from 'shared/enums/PagePaths';

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    genomicEvolutionSettings: {
        clusterHeatmap?: string;
        transposeHeatmap?: string;
        showMutationLabelsInHeatmap?: string;

        showOnlySelectedMutationsInChart?: string;
        logScaleChart?: string;
        yAxisDataRangeInChart?: string;

        showOnlySelectedMutationsInTable?: string;
    };
};

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            studyId: { isSessionProp: false },
            caseId: { isSessionProp: false },
            sampleId: { isSessionProp: false },
            genomicEvolutionSettings: {
                isSessionProp: false,
                nestedObjectProps: {
                    clusterHeatmap: '',
                    transposeHeatmap: '',
                    showMutationLabelsInHeatmap: '',

                    showOnlySelectedMutationsInChart: '',
                    logScaleChart: '',
                    yAxisDataRangeInChart: '',

                    showOnlySelectedMutationsInTable: '',
                },
            },
        });
    }

    public setTab(tab: string): void {
        this.updateURL({}, `${PagePath.Patient}/${tab}`);
    }
}
