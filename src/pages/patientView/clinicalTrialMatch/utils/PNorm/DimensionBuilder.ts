import { RankingDimensionName, RankingDimension } from './RankingDimension';

export class DimensionBuilder {
    private AGE_QUERY_WEIGHT = 0.2;
    private AGE_DOCUMENT_VALUE_TO_WEIGHT = 1;
    private AGE_EXPLANATION = 'Age is matching';

    private DISTANCE_QUERY_WEIGHT = 0.6;
    private DISTANCE_QUERY_DEFINITION_RANGE_UPPER = 0.1;
    private DISTANCE_QUERY_DEFINITION_RANGE_LOWER = -0.1;
    private DISTANCE_MAX_DOCUMENT_VALUE = 20000;
    private DISTANCE_DOCUMENT_WEIGHT_LOWER =
        (this.DISTANCE_QUERY_WEIGHT +
            this.DISTANCE_QUERY_DEFINITION_RANGE_LOWER) /
        this.DISTANCE_QUERY_WEIGHT;
    private DISTANCE_DOCUMENT_WEIGHT_UPPER =
        (this.DISTANCE_QUERY_WEIGHT +
            this.DISTANCE_QUERY_DEFINITION_RANGE_UPPER) /
        this.DISTANCE_QUERY_WEIGHT;
    private DISTANCE_STEPSIZE =
        (this.DISTANCE_DOCUMENT_WEIGHT_UPPER -
            this.DISTANCE_DOCUMENT_WEIGHT_LOWER) /
        this.DISTANCE_MAX_DOCUMENT_VALUE;
    private DISTANCE_EXPLANATION = 'Distance to ';

    private CONDITION_QUERY_WEIGHT = 0.8;
    private CONDITION_DOCUMENT_VALUE_TO_WEIGHT = 1;
    private CONDITION_EXPLANATION = 'Condition is matching';

    private QUERY_QUERY_WEIGHT = 1;
    private QUERY_DOCUMENT_VALUE_TO_WEIGHT = 1;
    private QUERY_EXPLANATION = 'Found keywords: ';

    private SEX_QUERY_WEIGHT = 0.4;
    private SEX_DOCUMENT_VALUE_TO_WEIGHT = 1;
    private SEX_EXPLANATION = 'Gender is matching';

    public buildRankingDimension(
        name: RankingDimensionName,
        documentValue: number
    ): RankingDimension {
        switch (name) {
            case RankingDimensionName.Age:
                return new RankingDimension(
                    name,
                    this.AGE_QUERY_WEIGHT,
                    documentValue * this.AGE_DOCUMENT_VALUE_TO_WEIGHT,
                    this.AGE_EXPLANATION,
                    documentValue
                );
            case RankingDimensionName.Condition:
                return new RankingDimension(
                    name,
                    this.CONDITION_QUERY_WEIGHT,
                    documentValue * this.CONDITION_DOCUMENT_VALUE_TO_WEIGHT,
                    this.CONDITION_EXPLANATION,
                    documentValue
                );
            case RankingDimensionName.Query:
                return new RankingDimension(
                    name,
                    this.QUERY_QUERY_WEIGHT,
                    documentValue * this.QUERY_DOCUMENT_VALUE_TO_WEIGHT,
                    this.QUERY_EXPLANATION,
                    documentValue
                );
            case RankingDimensionName.Sex:
                return new RankingDimension(
                    name,
                    this.SEX_QUERY_WEIGHT,
                    documentValue * this.SEX_DOCUMENT_VALUE_TO_WEIGHT,
                    this.SEX_EXPLANATION,
                    documentValue
                );
            default:
                return new RankingDimension(
                    RankingDimensionName.None,
                    0,
                    0,
                    '',
                    0
                );
        }
    }

    public buildRankingDimensionForKeywords(
        name: RankingDimensionName,
        additionalStrings: string[]
    ): RankingDimension {
        switch (name) {
            case RankingDimensionName.Query:
                var expl = this.QUERY_EXPLANATION;
                for (var i = 0; i < additionalStrings.length; i++) {
                    expl += additionalStrings[i] += ' ';
                }
                return new RankingDimension(
                    name,
                    this.QUERY_QUERY_WEIGHT,
                    additionalStrings.length *
                        this.QUERY_DOCUMENT_VALUE_TO_WEIGHT,
                    expl,
                    additionalStrings.length
                );
            default:
                return new RankingDimension(
                    RankingDimensionName.None,
                    0,
                    0,
                    '',
                    0
                );
        }
    }

    public buildRankingDimensionForCity(
        name: RankingDimensionName,
        documentValue: number,
        cityName: string
    ): RankingDimension {
        switch (name) {
            case RankingDimensionName.Distance:
                var explanation: string = '';

                return new RankingDimension(
                    name,
                    this.DISTANCE_QUERY_WEIGHT,
                    this.calculateDistanceWeight(documentValue),
                    this.DISTANCE_EXPLANATION +
                        cityName +
                        ' is ' +
                        documentValue.toFixed() +
                        ' km',
                    documentValue
                );
            default:
                return new RankingDimension(
                    RankingDimensionName.None,
                    0,
                    0,
                    '',
                    0
                );
        }
    }

    private calculateDistanceWeight(distance: number): number {
        var curr = distance;
        if (distance < 0) {
            return 0;
        } else {
            if (distance > this.DISTANCE_MAX_DOCUMENT_VALUE) {
                curr = this.DISTANCE_MAX_DOCUMENT_VALUE;
            }

            curr = this.DISTANCE_MAX_DOCUMENT_VALUE - curr + 1;

            return (
                this.DISTANCE_DOCUMENT_WEIGHT_LOWER +
                curr * this.DISTANCE_STEPSIZE
            );
        }
    }
}
