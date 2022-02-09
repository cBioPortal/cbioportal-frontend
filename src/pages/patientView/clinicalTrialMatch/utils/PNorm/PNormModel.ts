import { RankingDimensionName, RankingDimension } from './RankingDimension';

export class PNormModel {
    private p: number;
    private dimensions: RankingDimension[];
    private rank: number;

    constructor(pValue: number, dimensions: RankingDimension[]) {
        this.p = pValue;
        this.dimensions = dimensions;
        this.rank = this.calculateRank();
    }

    private calculateRank(): number {
        var res = 0;
        var n = this.dimensions.length;
        var weight = 0;
        var currentRankingDimension: RankingDimension;
        var a = 0;

        if (n == 0) {
            return 0;
        }

        for (var i = 0; i < n; i++) {
            currentRankingDimension = this.dimensions[i];
            weight =
                currentRankingDimension.getDocumentWeight() *
                currentRankingDimension.getQueryWeight();
            a += Math.pow(1 - weight, n);
        }

        return 1 - Math.pow((1 / n) * a, 1 / this.p);
    }

    public getRank(): number {
        return this.rank;
    }

    public getExplanations(): string[] {
        var res: string[] = [];
        for (var i = 0; i < this.dimensions.length; i++) {
            var dimension: RankingDimension = this.dimensions[i];
            var expl: string = dimension.getExplanation();
            if (expl != '') {
                res.push(expl);
            }
        }
        return res;
    }
}
