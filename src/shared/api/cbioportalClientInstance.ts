import {
    CBioPortalAPI,
    ClinicalData,
    DiscreteCopyNumberData,
    Mutation,
} from 'cbioportal-ts-api-client';

const client = new CBioPortalAPI();

export function shouldSkipEmptySampleMutationFetch(parameters: {
    mutationFilter?: {
        sampleIds?: string[];
        sampleListId?: string;
    };
}) {
    const filter = parameters.mutationFilter;
    return !!(
        filter &&
        Array.isArray(filter.sampleIds) &&
        filter.sampleIds.length === 0 &&
        !filter.sampleListId
    );
}

export function shouldSkipEmptySampleDiscreteCnaFetch(parameters: {
    discreteCopyNumberFilter?: {
        sampleIds?: string[];
        sampleListId?: string;
    };
}) {
    const filter = parameters.discreteCopyNumberFilter;
    return !!(
        filter &&
        Array.isArray(filter.sampleIds) &&
        filter.sampleIds.length === 0 &&
        !filter.sampleListId
    );
}

export function shouldSkipEmptyClinicalDataFetch(parameters: {
    clinicalDataMultiStudyFilter?: {
        identifiers?: Array<{ entityId: string; studyId: string }>;
    };
}) {
    const filter = parameters.clinicalDataMultiStudyFilter;
    return !!(
        filter &&
        Array.isArray(filter.identifiers) &&
        filter.identifiers.length === 0
    );
}

const fetchMutationsInMolecularProfileUsingPOST =
    client.fetchMutationsInMolecularProfileUsingPOST.bind(client);
client.fetchMutationsInMolecularProfileUsingPOST = parameters => {
    if (shouldSkipEmptySampleMutationFetch(parameters)) {
        return Promise.resolve([] as Mutation[]);
    }
    return fetchMutationsInMolecularProfileUsingPOST(parameters);
};

const fetchDiscreteCopyNumbersInMolecularProfileUsingPOST =
    client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST.bind(client);
client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST = parameters => {
    if (shouldSkipEmptySampleDiscreteCnaFetch(parameters)) {
        return Promise.resolve([] as DiscreteCopyNumberData[]);
    }
    return fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(parameters);
};

const fetchClinicalDataUsingPOST = client.fetchClinicalDataUsingPOST.bind(
    client
);
client.fetchClinicalDataUsingPOST = parameters => {
    if (shouldSkipEmptyClinicalDataFetch(parameters)) {
        return Promise.resolve([] as ClinicalData[]);
    }
    return fetchClinicalDataUsingPOST(parameters);
};

export function getClient() {
    return client;
}

export default client;
