import { assert } from 'chai';
import { DEFAULT_ANNOTATION_DATA, IAnnotation } from 'react-mutation-mapper';
import { IndicatorQueryResp } from 'oncokb-frontend-commons';
import {
    annotationMatchesFilter,
    countAnnotations,
    getAnnotationFilterKeywords,
    getOncogenicityGroup,
    isAnnotationFilterKeyword,
} from './AnnotationLegendCounts';

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

describe('AnnotationLegendCounts', () => {
    it('groups oncogenicity like the legend icons', () => {
        assert.equal(
            getOncogenicityGroup(annotation({ oncogenic: 'Likely Oncogenic' })),
            'oncogenic'
        );
        assert.equal(
            getOncogenicityGroup(annotation({ oncogenic: 'Resistance' })),
            'oncogenic'
        );
        assert.equal(
            getOncogenicityGroup(annotation({ oncogenic: 'Likely Neutral' })),
            'neutral'
        );
        assert.equal(
            getOncogenicityGroup(
                annotation({ oncogenic: 'Unknown', vus: true })
            ),
            'vus'
        );
        assert.equal(getOncogenicityGroup(annotation()), 'unknown');
        assert.equal(
            getOncogenicityGroup(
                annotation({
                    germline: true,
                    pathogenic: 'Likely Pathogenic',
                } as any)
            ),
            'pathogenic'
        );
    });

    it('lists the filter keywords of an annotation', () => {
        const keywords = getAnnotationFilterKeywords(
            annotation(
                {
                    oncogenic: 'Oncogenic',
                    highestSensitiveLevel: 'LEVEL_1',
                    highestDiagnosticImplicationLevel: 'LEVEL_Dx2',
                },
                { isHotspot: true }
            )
        );
        assert.sameMembers(keywords, [
            'ONCOKB:ONCOGENIC',
            'ONCOKB:LEVEL_1',
            'ONCOKB:LEVEL_DX2',
            'HOTSPOT',
            'CIVIC:NONE',
        ]);
    });

    it('matches the search keywords', () => {
        const a = annotation(
            { oncogenic: 'Oncogenic', highestResistanceLevel: 'LEVEL_R1' },
            { is3dHotspot: true }
        );
        assert.isTrue(annotationMatchesFilter(a, 'ONCOKB:LEVEL_R1'));
        assert.isTrue(annotationMatchesFilter(a, 'HOTSPOT:3D'));
        assert.isFalse(annotationMatchesFilter(a, 'HOTSPOT'));
        assert.isFalse(annotationMatchesFilter(a, 'ONCOKB:LEVEL_1'));
        assert.isTrue(isAnnotationFilterKeyword('ONCOKB:LEVEL_R1'));
        assert.isFalse(isAnnotationFilterKeyword('E545K'));
    });

    it('counts annotations per keyword and reports pending data', () => {
        const counts = countAnnotations([
            annotation({ oncogenic: 'Oncogenic' }, { isHotspot: true }),
            annotation({ oncogenic: 'Likely Oncogenic' }),
            annotation(undefined, { oncoKbStatus: 'pending' }),
        ]);
        assert.equal(counts.total, 3);
        assert.isTrue(counts.pending);
        assert.equal(counts.byKeyword['ONCOKB:ONCOGENIC'], 2);
        assert.equal(counts.byKeyword['ONCOKB:UNKNOWN'], 1);
        assert.equal(counts.byKeyword['HOTSPOT'], 1);
        assert.equal(counts.byKeyword['HOTSPOT:NONE'], 2);
    });
});
