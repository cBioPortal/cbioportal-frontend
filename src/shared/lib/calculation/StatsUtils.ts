import { NumericGeneMolecularData } from 'cbioportal-ts-api-client';

export function calculateStats(
    data: NumericGeneMolecularData[]
): Record<string, Record<number, { mean: number; stdDev: number }>> {
    const result: Record<string, Record<string, number[]>> = {};
    // Group values by molecularProfileId and gene
    data.forEach(({ molecularProfileId, entrezGeneId, value }) => {
        if (!result[molecularProfileId]) {
            result[molecularProfileId] = {};
        }
        if (!result[molecularProfileId][entrezGeneId]) {
            result[molecularProfileId][entrezGeneId] = [];
        }
        result[molecularProfileId][entrezGeneId].push(value);
    });

    // Compute mean and standard deviation for each group
    const stats: Record<
        string,
        Record<string, { mean: number; stdDev: number }>
    > = {};

    for (const profileId in result) {
        stats[profileId] = {};
        for (const gene in result[profileId]) {
            const values = result[profileId][gene];
            const mean =
                values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance =
                values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                values.length;
            const stdDev = Math.sqrt(variance);

            stats[profileId][gene] = { mean, stdDev };
        }
    }

    return stats;
}
