export enum RankingDimensionName {
    Age,
    Sex,
    Condition,
    Distance,
    Query,
    None,
}

export class RankingDimension {
    private dimensionName: RankingDimensionName;
    private queryWeight: number;
    private documentWeight: number;
    private explanation: string;
    private documentValue: number;

    constructor(
        dimensionName: RankingDimensionName,
        queryWeight: number,
        documentWeight: number,
        explanation: string,
        documentValue: number
    ) {
        this.dimensionName = dimensionName;
        this.queryWeight = queryWeight;
        this.documentWeight = documentWeight;
        this.explanation = explanation;
        this.documentValue = documentValue;
    }

    public getDimensionName(): RankingDimensionName {
        return this.dimensionName;
    }

    public getQueryWeight(): number {
        return this.queryWeight;
    }

    public getDocumentWeight(): number {
        return this.documentWeight;
    }

    public getExplanation(): string {
        if (this.documentWeight != 0) {
            return this.explanation;
        }
        return '';
    }

    public getDocumentValue(): number {
        return this.documentValue;
    }

    public setDimensionName(value: RankingDimensionName) {
        this.dimensionName = value;
    }

    public setQueryWeight(value: number) {
        this.queryWeight = value;
    }

    public setDocumentWeight(value: number) {
        this.documentWeight = value;
    }

    public setExplanation(value: string) {
        this.explanation = value;
    }

    public set DocumentValue(value: number) {
        this.documentValue = value;
    }
}
