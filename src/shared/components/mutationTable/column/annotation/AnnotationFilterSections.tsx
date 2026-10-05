import * as React from 'react';
import {
    levelIconClassNames,
    oncogenicityIconClassNames,
    OncoKbHelper,
} from 'oncokb-frontend-commons';
import { SectionedFilterSection } from 'shared/components/sectionedFilterMenu/SectionedFilterMenu';
import { cancerHotspotsData, civicData } from './AnnotationHeader';
import {
    AnnotationFilterSource,
    annotationOptionId,
    CivicOption,
    HotspotOption,
    OncogenicityOption,
} from './AnnotationFilterUtils';

function levelOptions(levels: string[], hideIfEmpty: boolean) {
    return levels.map(level => ({
        id: annotationOptionId(AnnotationFilterSource.LEVEL, `LEVEL_${level}`),
        label: `Level ${level}`,
        icon: <i className={levelIconClassNames(level)} />,
        hideIfEmpty,
    }));
}

/**
 * Sections of the annotation column filter: OncoKB oncogenicity and highest
 * level, Cancer Hotspots and CIViC.
 */
export function getAnnotationFilterSections(props: {
    showOncoKb?: boolean;
    showHotspot?: boolean;
    showCivic?: boolean;
}): SectionedFilterSection[] {
    const sections: SectionedFilterSection[] = [];
    if (props.showOncoKb) {
        const oncogenicity = (value: OncogenicityOption, label: string) => ({
            id: annotationOptionId(AnnotationFilterSource.ONCOGENICITY, value),
            label,
            icon: <i className={oncogenicityIconClassNames(value)} />,
        });
        sections.push(
            {
                id: AnnotationFilterSource.ONCOGENICITY,
                title: 'OncoKB oncogenicity',
                options: [
                    oncogenicity(
                        OncogenicityOption.ONCOGENIC,
                        'Oncogenic / Likely Oncog. / Resistance'
                    ),
                    oncogenicity(OncogenicityOption.NEUTRAL, 'Likely Neutral'),
                    oncogenicity(
                        OncogenicityOption.INCONCLUSIVE,
                        'Inconclusive'
                    ),
                    oncogenicity(OncogenicityOption.VUS, 'VUS'),
                    oncogenicity(OncogenicityOption.UNKNOWN, 'Unknown'),
                    {
                        ...oncogenicity(
                            OncogenicityOption.PATHOGENIC,
                            'Pathogenic / Likely Pathogenic (germline)'
                        ),
                        hideIfEmpty: true,
                    },
                ],
            },
            {
                id: AnnotationFilterSource.LEVEL,
                title: "OncoKB highest level (for the sample's cancer type)",
                options: [
                    ...levelOptions(OncoKbHelper.TX_LEVELS, false),
                    ...levelOptions(OncoKbHelper.DX_LEVELS, true),
                    ...levelOptions(OncoKbHelper.PX_LEVELS, true),
                ],
            }
        );
    }
    if (props.showHotspot) {
        const hotspot = (
            value: HotspotOption,
            index: number,
            label: string
        ) => ({
            id: annotationOptionId(AnnotationFilterSource.HOTSPOT, value),
            label,
            icon: cancerHotspotsData[index].legend,
        });
        sections.push({
            id: AnnotationFilterSource.HOTSPOT,
            title: 'Cancer Hotspots',
            options: [
                hotspot(
                    HotspotOption.RECURRENT,
                    0,
                    'Recurrent (or recurrent + 3D) hotspot'
                ),
                hotspot(HotspotOption.CLUSTERED_3D, 1, '3D clustered hotspot'),
                hotspot(HotspotOption.NONE, 2, 'Not a known hotspot'),
            ],
        });
    }
    if (props.showCivic) {
        const civic = (value: CivicOption, index: number, label: string) => ({
            id: annotationOptionId(AnnotationFilterSource.CIVIC, value),
            label,
            icon: civicData[index].legend,
        });
        sections.push({
            id: AnnotationFilterSource.CIVIC,
            title: 'CIViC',
            options: [
                civic(
                    CivicOption.WITH_VARIANTS,
                    0,
                    'In CIViC, with oncogenic activity info'
                ),
                civic(
                    CivicOption.NO_VARIANTS,
                    1,
                    'In CIViC, no oncogenic activity info'
                ),
                civic(CivicOption.NONE, 2, 'Not in CIViC'),
            ],
        });
    }
    return sections;
}
