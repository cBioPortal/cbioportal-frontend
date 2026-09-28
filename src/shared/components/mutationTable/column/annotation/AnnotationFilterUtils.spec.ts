import { assert } from 'chai';
import { DEFAULT_ANNOTATION_DATA, IAnnotation } from 'react-mutation-mapper';
import { IndicatorQueryResp } from 'oncokb-frontend-commons';
import {
    countAnnotationOptions,
    getAnnotationOptionIds,
    getOncogenicityOption,
    matchesAnnotationFilter,
} from './AnnotationFilterUtils';

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

    describe('matchesAnnotationFilter', () => {
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
                matchesAnnotationFilter(vusHotspot, {
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
            assert.isTrue(matchesAnnotationFilter(oncogenicHotspot, filter));
            assert.isFalse(
                matchesAnnotationFilter(oncogenicNotHotspot, filter)
            );
        });

        it('combines sources with all or any', () => {
            const selections = ['oncogenicity:oncogenic', 'hotspot:recurrent'];
            const all = { selections, matchAll: true };
            const any = { selections, matchAll: false };
            assert.isTrue(matchesAnnotationFilter(oncogenicHotspot, all));
            assert.isFalse(matchesAnnotationFilter(oncogenicNotHotspot, all));
            assert.isFalse(matchesAnnotationFilter(vusHotspot, all));
            assert.isTrue(matchesAnnotationFilter(oncogenicNotHotspot, any));
            assert.isTrue(matchesAnnotationFilter(vusHotspot, any));
        });
    });

    it('counts annotations per option', () => {
        const counts = countAnnotationOptions([
            annotation({ oncogenic: 'Oncogenic' }, { isHotspot: true }),
            annotation({ oncogenic: 'Likely Oncogenic' }),
            annotation(),
        ]);
        assert.equal(counts.get('oncogenicity:oncogenic'), 2);
        assert.equal(counts.get('oncogenicity:unknown'), 1);
        assert.equal(counts.get('hotspot:recurrent'), 1);
        assert.equal(counts.get('hotspot:none'), 2);
    });
});
