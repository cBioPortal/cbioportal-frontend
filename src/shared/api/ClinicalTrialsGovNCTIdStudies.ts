export interface FieldValue {
    FieldValue: string;
    NStudiesWithValue: number;
    NStudiesFoundWithValue: number;
}

export interface FieldValuesResponse {
    APIVrs: string;
    DataVrs: string;
    Expression: string;
    NStudiesAvail: number;
    NStudiesFound: number;
    MinRank: number;
    MaxRank: number;
    NStudiesUsed: number;
    Field: string;
    NUniqueValues: number;
    NUniqueValuesFound: number;
    FieldValues: FieldValue[];
}

export interface StudiesNCTIds {
    FieldValuesResponse: FieldValuesResponse;
}
