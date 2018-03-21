export interface MutualExclusivity {
    geneA: string;
    geneB: string;
    neitherCount: number;
    aNotBCount: number;
    bNotACount: number;
    bothCount: number;
    logOddsRatio: number;
    pValue: number;
    adjustedPValue: number,
    association: string;
}