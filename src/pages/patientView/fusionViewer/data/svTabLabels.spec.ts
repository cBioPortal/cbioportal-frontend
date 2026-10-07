import { assert } from 'chai';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import {
    cohortSvTabLabel,
    hasRnaFusion,
    patientSvTabLabel,
} from './svTabLabels';

const sv = (fields: Partial<StructuralVariant>) =>
    ({
        site1HugoSymbol: 'TMPRSS2',
        variantClass: '',
        rnaSupport: '',
        dnaSupport: '',
        molecularProfileId: 'study_structural_variants',
        ...fields,
    } as StructuralVariant);

describe('svTabLabels', () => {
    it('detects RNA fusions among DNA SVs', () => {
        assert.isFalse(hasRnaFusion([]));
        assert.isFalse(hasRnaFusion([sv({ dnaSupport: 'Yes' }), sv({})]));
        assert.isTrue(
            hasRnaFusion([sv({ dnaSupport: 'Yes' }), sv({ rnaSupport: 'Yes' })])
        );
        assert.isTrue(hasRnaFusion([sv({ variantClass: 'Fusion' })]));
    });

    it('names the tabs by data type', () => {
        assert.equal(patientSvTabLabel(true), 'Fusion Viewer');
        assert.equal(patientSvTabLabel(false), 'SV Viewer');
        assert.equal(cohortSvTabLabel(true), 'Fusion Comparison');
        assert.equal(cohortSvTabLabel(false), 'SV Comparison');
    });
});
