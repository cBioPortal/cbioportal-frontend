import {
    ClinicalData, NumericGeneMolecularData, Mutation, MutationCount, Patient,
    Sample
} from "../api/generated/CBioPortalAPI";
import {FractionGenomeAltered, MutationSpectrum} from "../api/generated/CBioPortalAPIInternal";

export function isMutation(datum:Mutation|NumericGeneMolecularData): datum is Mutation {
    return datum.hasOwnProperty("mutationType");
}

export function isSample(datum:Sample|Patient): datum is Sample {
    return datum.hasOwnProperty("sampleId");
}

export function isSampleList(data:Sample[]|Patient[]):data is Sample[] {
    return !data.length || isSample(data[0]);
}

export function isMutationCount(
    data:ClinicalData|MutationCount|FractionGenomeAltered|MutationSpectrum
): data is MutationCount {
    return data.hasOwnProperty("mutationCount");
}
