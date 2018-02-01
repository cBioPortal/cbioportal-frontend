export interface MutualExclusivity {
    geneA: string;
    geneB: string;
    neitherCount: number;
    aNotBCount: number;
    bNotACount: number;
    bothCount: number;
    pValue: number;
    logOddsRatio: number;
    association: string;
}