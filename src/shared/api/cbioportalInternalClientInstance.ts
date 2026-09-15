import {
    CBioPortalAPIInternal,
    StructuralVariant,
} from 'cbioportal-ts-api-client';

const internalClient = new CBioPortalAPIInternal();

export function shouldSkipEmptySampleStructuralVariantFetch(parameters: {
    structuralVariantFilter?: {
        sampleMolecularIdentifiers?: Array<{
            molecularProfileId: string;
            sampleId: string;
        }>;
    };
}) {
    const filter = parameters.structuralVariantFilter;
    return !!(
        filter &&
        Array.isArray(filter.sampleMolecularIdentifiers) &&
        filter.sampleMolecularIdentifiers.length === 0
    );
}

const fetchStructuralVariantsUsingPOST =
    internalClient.fetchStructuralVariantsUsingPOST.bind(internalClient);
internalClient.fetchStructuralVariantsUsingPOST = parameters => {
    if (shouldSkipEmptySampleStructuralVariantFetch(parameters)) {
        return Promise.resolve([] as StructuralVariant[]);
    }
    return fetchStructuralVariantsUsingPOST(parameters);
};

export default internalClient;

export function getInternalClient() {
    return internalClient;
}
