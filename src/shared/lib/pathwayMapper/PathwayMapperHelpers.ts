// Calculates truncated version of gene string without truncating gene names.
// That is, instead of truncating a gene name, removes it all.
// For example, if the gene string is MDM2 CDKN2A, instead of truncating it as "MDM2 CKDN ...",
// produces "MDM2 ..."
export function truncateGeneList(
    genesMatched: string[],
    lengthThreshold: number
) {
    let runningLength = 0;
    let geneStr = '';

    for (const geneName of genesMatched) {
        runningLength += geneName.length;
        if (runningLength < lengthThreshold) {
            geneStr += geneName + ' ';
            runningLength++; //Whitespace is added
        } else {
            return geneStr + '...';
        }
    }

    return geneStr.trim();
}
