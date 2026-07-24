const DEFAULT_PDB_URI = 'https://files.rcsb.org/view/';

function normalizePdbUri(pdbUri?: string): string {
    return (pdbUri ?? DEFAULT_PDB_URI).replace(/\/$/, '');
}

/** Returns true when the 3Dmol viewer has at least one atom after a load attempt. */
export function viewerHasStructureAtoms(viewer: any): boolean {
    if (!viewer || typeof viewer.selectedAtoms !== 'function') {
        return false;
    }

    const atoms = viewer.selectedAtoms({});

    return Array.isArray(atoms) && atoms.length > 0;
}

/**
 * Preflight check that a PDB entry can be fetched (bcif.gz or legacy .pdb).
 * Mirrors 3Dmol download fallbacks so we can surface errors in the UI.
 */
export async function verifyPdbStructureAvailable(
    pdbId: string,
    pdbUri?: string
): Promise<void> {
    const id = pdbId.toUpperCase();

    if (!/^[1-9][A-Za-z0-9]{3}$/.test(id)) {
        throw new Error(`Invalid PDB ID: ${pdbId}`);
    }

    const bcifUrl = `https://models.rcsb.org/${id}.bcif.gz`;

    try {
        const bcifResponse = await fetch(bcifUrl);

        if (bcifResponse.ok) {
            return;
        }
    } catch {
        // fall through to legacy PDB URL
    }

    const legacyUrl = `${normalizePdbUri(pdbUri)}/${id}.pdb`;
    const pdbResponse = await fetch(legacyUrl);

    if (!pdbResponse.ok) {
        throw new Error(
            `PDB structure ${id} could not be loaded (${pdbResponse.status}).`
        );
    }
}
