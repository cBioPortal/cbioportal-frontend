export function getAlphaFoldEntryUrl(uniprotId: string): string {
    return `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(
        uniprotId
    )}`;
}
