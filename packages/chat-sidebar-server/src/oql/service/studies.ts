import { getJson } from './upstream.js';

type MolecularProfile = {
    studyId: string;
    molecularAlterationType: string;
    datatype: string;
};

export type DataTypes = {
    mutation: boolean;
    cna: boolean;
    mrna: boolean;
    protein: boolean;
    structuralVariant: boolean;
};

const HOUR = 60 * 60 * 1000;
const cache = new Map<string, { at: number; types: DataTypes | null }>();

function dataTypes(profiles: MolecularProfile[]): DataTypes {
    const any = (type: string, datatype?: string) =>
        profiles.some(
            p =>
                p.molecularAlterationType === type &&
                (!datatype || p.datatype === datatype)
        );
    return {
        mutation: any('MUTATION_EXTENDED'),
        cna: any('COPY_NUMBER_ALTERATION', 'DISCRETE'),
        mrna: any('MRNA_EXPRESSION', 'Z-SCORE'),
        protein: any('PROTEIN_LEVEL', 'Z-SCORE'),
        structuralVariant: any('STRUCTURAL_VARIANT'),
    };
}

/**
 * Which kinds of molecular data each study has, from one bulk profile request. A study id the
 * portal does not know maps to null.
 */
export async function studyDataTypes(
    portal: string,
    studyIds: string[]
): Promise<Map<string, DataTypes | null>> {
    const out = new Map<string, DataTypes | null>();
    const missing: string[] = [];
    for (const id of new Set(studyIds)) {
        const hit = cache.get(`${portal}|${id}`);
        if (hit && Date.now() - hit.at < HOUR) out.set(id, hit.types);
        else missing.push(id);
    }
    if (missing.length) {
        const profiles = await getJson<MolecularProfile[]>(
            'cBioPortal',
            `${portal}/api/molecular-profiles/fetch?projection=SUMMARY`,
            { method: 'POST', body: JSON.stringify({ studyIds: missing }) }
        );
        for (const id of missing) {
            const own = profiles.filter(p => p.studyId === id);
            const types = own.length ? dataTypes(own) : null;
            cache.set(`${portal}|${id}`, { at: Date.now(), types });
            out.set(id, types);
        }
    }
    return out;
}
