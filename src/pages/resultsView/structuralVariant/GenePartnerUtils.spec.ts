import { StructuralVariant } from 'cbioportal-ts-api-client';
import { getGenePartnerCounts } from './GenePartnerUtils';

describe('getGenePartnerCounts', () => {
    const variant = (
        site1HugoSymbol: string,
        site2HugoSymbol: string
    ): StructuralVariant =>
        ({
            site1HugoSymbol,
            site2HugoSymbol,
        } as StructuralVariant);

    it('counts partners when the query gene is on either side', () => {
        const variants = [
            variant('ALK', 'EML4'),
            variant('EML4', 'ALK'),
            variant('ALK', 'KIF5B'),
        ];

        expect(getGenePartnerCounts(variants, 'ALK')).toEqual([
            { gene: 'EML4', count: 2 },
            { gene: 'KIF5B', count: 1 },
        ]);
    });

    it('matches the query gene case-insensitively', () => {
        expect(
            getGenePartnerCounts([variant('alk', 'EML4')], 'ALK')
        ).toEqual([{ gene: 'EML4', count: 1 }]);
    });

    it('returns no partners when the query gene is absent', () => {
        expect(
            getGenePartnerCounts([variant('ALK', 'EML4')], 'BRAF')
        ).toEqual([]);
    });

    it('returns no partners for an empty query gene', () => {
        expect(getGenePartnerCounts([variant('ALK', 'EML4')], '')).toEqual(
            []
        );
    });
});
