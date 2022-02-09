import { PNormModel } from './PNormModel';
import { RankingDimension, RankingDimensionName } from './RankingDimension';
import { DimensionBuilder } from './DimensionBuilder';

export class ClinicalTrialsPNorm extends PNormModel {
    constructor(
        ageDocumentValue: number,
        sexDocumentValue: number,
        conditionDocumentValue: number,
        distanceDocumentValue: number,
        queryFoundKeywords: string[],
        closestCity: string
    ) {
        var p: number = 2;
        var rankingDimensions: RankingDimension[] = [];
        var builder: DimensionBuilder = new DimensionBuilder();
        rankingDimensions.push(
            builder.buildRankingDimension(
                RankingDimensionName.Age,
                ageDocumentValue
            )
        );
        rankingDimensions.push(
            builder.buildRankingDimension(
                RankingDimensionName.Sex,
                sexDocumentValue
            )
        );
        rankingDimensions.push(
            builder.buildRankingDimension(
                RankingDimensionName.Condition,
                conditionDocumentValue
            )
        );
        rankingDimensions.push(
            builder.buildRankingDimensionForCity(
                RankingDimensionName.Distance,
                distanceDocumentValue,
                closestCity
            )
        );
        rankingDimensions.push(
            builder.buildRankingDimensionForKeywords(
                RankingDimensionName.Query,
                queryFoundKeywords
            )
        );
        super(p, rankingDimensions);
    }
}
