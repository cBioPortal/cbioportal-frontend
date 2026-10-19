import { assert } from 'chai';
import { DEFAULT_ANNOTATION_DATA, IAnnotation } from 'react-mutation-mapper';
import { IndicatorQueryResp } from 'oncokb-frontend-commons';
import {
    getAnnotationOptionIds,
    getOncogenicityOption,
} from './AnnotationFilterUtils';
import {
    countOptionIds,
    matchesSectionedFilter,
} from 'shared/components/sectionedFilterMenu/SectionedFilterUtils';

function annotation(
    indicator?: Partial<IndicatorQueryResp> & { germline?: boolean },
    other: Partial<IAnnotation> = {}
): IAnnotation {
    return {
        ...DEFAULT_ANNOTATION_DATA,
        oncoKbIndicator: indicator
            ? ({
                  ...indicator,
                  query: { germline: !!indicator.germline },
              } as any)
            : undefined,
        ...other,
    };
}

describe('AnnotationFilterUtils', () => {
    it('groups oncogenicity like the legend icons', () => {
        assert.equal(
            getOncogenicityOption(
                annotation({ oncogenic: 'Likely Oncogenic' })
            ),
            'oncogenic'
        );
        assert.equal(
            getOncogenicityOption(annotation({ oncogenic: 'Resistance' })),
            'oncogenic'
        );
        assert.equal(
            getOncogenicityOption(annotation({ oncogenic: 'Likely Neutral' })),
            'neutral'
        );
        assert.equal(
            getOncogenicityOption(
                annotation({ oncogenic: 'Unknown', vus: true })
            ),
            'vus'
        );
        assert.equal(getOncogenicityOption(annotation()), 'unknown');
        assert.equal(
            getOncogenicityOption(
                annotation({
                    germline: true,
                    pathogenic: 'Likely Pathogenic',
                } as any)
            ),
            'pathogenic'
        );
    });

    it('lists the filter options of an annotation', () => {
        assert.sameMembers(
            getAnnotationOptionIds(
                annotation(
                    {
                        oncogenic: 'Oncogenic',
                        highestSensitiveLevel: 'LEVEL_1',
                        highestDiagnosticImplicationLevel: 'LEVEL_Dx2',
                    },
                    { isHotspot: true }
                )
            ),
            [
                'oncogenicity:oncogenic',
                'level:LEVEL_1',
                'level:LEVEL_Dx2',
                'hotspot:recurrent',
                'civic:none',
            ]
        );
    });

    describe('filtering annotations', () => {
        const oncogenicHotspot = annotation(
            { oncogenic: 'Oncogenic', highestSensitiveLevel: 'LEVEL_1' },
            { isHotspot: true }
        );
        const oncogenicNotHotspot = annotation({ oncogenic: 'Oncogenic' });
        const vusHotspot = annotation(
            { oncogenic: 'Unknown', vus: true },
            { isHotspot: true }
        );

        it('matches everything without selections', () => {
            assert.isTrue(
                matchesSectionedFilter(getAnnotationOptionIds(vusHotspot), {
                    selections: [],
                    matchAll: true,
                })
            );
        });

        it('matches any selected option of a source', () => {
            const filter = {
                selections: ['level:LEVEL_1', 'level:LEVEL_2'],
                matchAll: true,
            };
            assert.isTrue(
                matchesSectionedFilter(
                    getAnnotationOptionIds(oncogenicHotspot),
                    filter
                )
            );
            assert.isFalse(
                matchesSectionedFilter(
                    getAnnotationOptionIds(oncogenicNotHotspot),
                    filter
                )
            );
        });

        it('combines sources with all or any', () => {
            const selections = ['oncogenicity:oncogenic', 'hotspot:recurrent'];
            const all = { selections, matchAll: true };
            const any = { selections, matchAll: false };
            assert.isTrue(
                matchesSectionedFilter(
                    getAnnotationOptionIds(oncogenicHotspot),
                    all
                )
            );
            assert.isFalse(
                matchesSectionedFilter(
                    getAnnotationOptionIds(oncogenicNotHotspot),
                    all
                )
            );
            assert.isFalse(
                matchesSectionedFilter(getAnnotationOptionIds(vusHotspot), all)
            );
            assert.isTrue(
                matchesSectionedFilter(
                    getAnnotationOptionIds(oncogenicNotHotspot),
                    any
                )
            );
            assert.isTrue(
                matchesSectionedFilter(getAnnotationOptionIds(vusHotspot), any)
            );
        });
    });

    it('counts annotations per option', () => {
        const counts = countOptionIds(
            [
                annotation({ oncogenic: 'Oncogenic' }, { isHotspot: true }),
                annotation({ oncogenic: 'Likely Oncogenic' }),
                annotation(),
            ].map(getAnnotationOptionIds)
        );
        assert.equal(counts.get('oncogenicity:oncogenic'), 2);
        assert.equal(counts.get('oncogenicity:unknown'), 1);
        assert.equal(counts.get('hotspot:recurrent'), 1);
        assert.equal(counts.get('hotspot:none'), 2);
    });
});
