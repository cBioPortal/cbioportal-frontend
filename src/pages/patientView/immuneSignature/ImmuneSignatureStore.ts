import _ from 'lodash';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    GenericAssayData,
    GenericAssayDataMultipleStudyFilter,
    SampleMolecularIdentifier,
} from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import { GenericAssayTypeConstants } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
// Imported for its type only (used as a constructor-param annotation, which is
// erased at runtime) so this does not create a runtime import cycle.
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { getImmuneSignature, ImmuneSignature } from './ImmuneSignatureUtils';

export class ImmuneSignatureStore {
    constructor(private parentStore: PatientViewPageStore) {}

    readonly genericAssayData = remoteData<GenericAssayData[]>(
        {
            await: () => [
                this.parentStore.samples,
                this.parentStore.molecularProfilesInStudy,
            ],
            invoke: async () => {
                const profileIds = this.parentStore.molecularProfilesInStudy.result
                    .filter(
                        profile =>
                            profile.genericAssayType ===
                            GenericAssayTypeConstants.ISIG_PROBABILITY
                    )
                    .map(profile => profile.molecularProfileId);
                if (profileIds.length === 0) {
                    return [];
                }
                const sampleMolecularIdentifiers = _.flatMap(
                    profileIds,
                    molecularProfileId =>
                        this.parentStore.samples.result.map(
                            sample =>
                                ({
                                    molecularProfileId,
                                    sampleId: sample.sampleId,
                                } as SampleMolecularIdentifier)
                        )
                );
                return getClient().fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(
                    {
                        genericAssayDataMultipleStudyFilter: {
                            sampleMolecularIdentifiers,
                        } as GenericAssayDataMultipleStudyFilter,
                    }
                );
            },
        },
        []
    );

    readonly immuneSignatureBySample = remoteData<
        Record<string, ImmuneSignature>
    >(
        {
            await: () => [
                this.parentStore.clinicalDataGroupedBySample,
                this.genericAssayData,
            ],
            invoke: async () => {
                const genericAssayDataBySampleId = _.groupBy(
                    this.genericAssayData.result,
                    d => d.sampleId
                );
                const result: Record<string, ImmuneSignature> = {};
                this.parentStore.clinicalDataGroupedBySample.result.forEach(
                    sample => {
                        const signature = getImmuneSignature(
                            sample.clinicalData,
                            genericAssayDataBySampleId[sample.id]
                        );
                        if (signature) {
                            result[sample.id] = signature;
                        }
                    }
                );
                return result;
            },
        },
        {}
    );
}
