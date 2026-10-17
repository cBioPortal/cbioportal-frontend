import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { MapValues } from 'shared/lib/TypeScriptUtils';
import { PagePath } from 'shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import _ from 'lodash';
import { PatientViewPageTabs } from './PatientViewPageTabIds';
import {
    PlotsColoringParam,
    PlotsSelectionParam,
    PLOTS_TAB_URL_PARAMS,
} from 'shared/components/plots/PlotsTabUrlParameters';

/** Pathology Slides tab scope, set by pathology slide links. */
export type PathologySlideSettings = {
    stainFilter?: string;
    matchLevel?: string;
    specimenKey?: string;
};

const PATHOLOGY_SLIDE_SETTINGS_KEYS: (keyof PathologySlideSettings)[] = [
    'stainFilter',
    'matchLevel',
    'specimenKey',
];

/**
 * Older pathology slide links (including clinical event LINKOUT values in
 * imported data) set the Pathology Slides tab scope as top-level params,
 * e.g. `?stainFilter=hne&matchLevel=PART`. When the URL has no
 * `pathologySlideSettings` node, those params are read into it instead.
 */
export function pathologySlideSettingsBackwardsCompatibility(oldParams: {
    [key: string]: string | undefined;
}): { [key: string]: string | undefined } {
    if (!oldParams || oldParams.pathologySlideSettings !== undefined) {
        return oldParams;
    }
    const legacySettings = _.pickBy(
        _.pick(oldParams, PATHOLOGY_SLIDE_SETTINGS_KEYS),
        value => _.isString(value) && value !== ''
    );
    if (_.isEmpty(legacySettings)) {
        return oldParams;
    }
    return {
        ...oldParams,
        pathologySlideSettings: JSON.stringify(legacySettings),
    };
}

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    resourceUrl?: string;
    pathologySlideSettings: PathologySlideSettings;
    genomicEvolutionSettings: {
        showTimeline?: string;

        clusterHeatmap?: string;
        transposeHeatmap?: string;
        showMutationLabelsInHeatmap?: string;

        showOnlySelectedMutationsInChart?: string;
        logScaleChart?: string;
        yAxisDataRangeInChart?: string;

        showOnlySelectedMutationsInTable?: string;
    };
    plots_horz_selection: PlotsSelectionParam;
    plots_vert_selection: PlotsSelectionParam;
    plots_coloring_selection: PlotsColoringParam;
    geneset_list: any;
    generic_assay_groups: any;
};

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(
            routing,
            {
                studyId: { isSessionProp: false, isHashedProp: true },
                caseId: { isSessionProp: false, isHashedProp: true },
                sampleId: { isSessionProp: false, isHashedProp: true },
                resourceUrl: { isSessionProp: false },
                pathologySlideSettings: {
                    isSessionProp: false,
                    nestedObjectProps: {
                        stainFilter: '',
                        matchLevel: '',
                        specimenKey: '',
                    },
                },
                genomicEvolutionSettings: {
                    isSessionProp: false,
                    nestedObjectProps: {
                        showTimeline: '',

                        clusterHeatmap: '',
                        transposeHeatmap: '',
                        showMutationLabelsInHeatmap: '',

                        showOnlySelectedMutationsInChart: '',
                        logScaleChart: '',
                        yAxisDataRangeInChart: '',

                        showOnlySelectedMutationsInTable: '',
                    },
                },
                ...PLOTS_TAB_URL_PARAMS,
                geneset_list: { isSessionProp: true },
                generic_assay_groups: { isSessionProp: false },
            },
            undefined,
            undefined,
            params =>
                pathologySlideSettingsBackwardsCompatibility(
                    params
                ) as MapValues<PatientViewUrlQuery, string | undefined>
        );
        makeObservable(this);
    }

    public setActiveTab(tab: string): void {
        this.updateURL({}, `${PagePath.Patient}/${tab}`);
    }

    @computed public get activeTabId() {
        return this.pathName.split('/').pop() || PatientViewPageTabs.Summary;
    }

    /**
     * Pathology Slides tab scope from the `pathologySlideSettings` node, or
     * from legacy top-level params when the node is absent.
     */
    @computed public get pathologySlideScope(): PathologySlideSettings {
        return _.pick(
            this.query.pathologySlideSettings,
            PATHOLOGY_SLIDE_SETTINGS_KEYS
        );
    }

    public setResourceUrl(resourceUrl: string) {
        this.updateURL({ resourceUrl });
    }
}
