import * as React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import { ClinicalData, Mutation } from 'cbioportal-ts-api-client';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import SampleManager from 'pages/patientView/SampleManager';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import { ASCNAttributes } from 'shared/enums/ASCNEnums';
import ASCNCopyNumberElement from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import { ASCNCopyNumberValueEnum } from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

// Searches all clinical attributes for any with "WGD" in the ID (case-insensitive),
// handling studies that use ASCN_WGD, WGD, or other naming conventions.
function findWGDEntry(
    clinicalData: ClinicalData[] | undefined
): ClinicalData | undefined {
    if (!clinicalData) return undefined;
    return clinicalData.find(cd =>
        cd.clinicalAttributeId.toUpperCase().includes('WGD')
    );
}

// Normalizes the raw WGD clinical value to the 'WGD' / 'no WGD' strings
// expected by ASCNCopyNumberElement's call table.
function normalizeWGDValue(rawValue: string): string {
    const v = rawValue.trim().toUpperCase();
    if (
        v === 'WGD' ||
        v === 'YES' ||
        v === 'TRUE' ||
        v === '1' ||
        v === 'YES_WGD'
    ) {
        return ASCNCopyNumberValueEnum.WGD; // 'WGD'
    }
    if (
        v === 'NO_WGD' ||
        v === 'NO' ||
        v === 'FALSE' ||
        v === '0' ||
        v === 'NOWGD'
    ) {
        return 'no WGD';
    }
    return ASCNCopyNumberValueEnum.NA;
}

function getWGDForSample(
    clinicalDataMap: { [sampleId: string]: ClinicalData[] } | undefined,
    sampleId: string
): string {
    if (!clinicalDataMap || !(sampleId in clinicalDataMap)) {
        return ASCNCopyNumberValueEnum.NA;
    }
    const entry = findWGDEntry(clinicalDataMap[sampleId]);
    return entry ? normalizeWGDValue(entry.value) : ASCNCopyNumberValueEnum.NA;
}

function getWGDRawForSample(
    clinicalDataMap: { [sampleId: string]: ClinicalData[] } | undefined,
    sampleId: string
): string {
    if (!clinicalDataMap || !(sampleId in clinicalDataMap)) {
        return ASCNCopyNumberValueEnum.NA;
    }
    const entry = findWGDEntry(clinicalDataMap[sampleId]);
    return entry ? entry.value : ASCNCopyNumberValueEnum.NA;
}

interface IASCNTabProps {
    store: PatientViewPageStore;
    sampleManager: SampleManager | null;
}

@observer
export default class ASCNTab extends React.Component<IASCNTabProps, {}> {
    @computed get mutationsWithASCN(): Mutation[][] {
        return this.props.store.mergedMutationDataIncludingUncalled.filter(
            mutations =>
                mutations.some(
                    m =>
                        hasASCNProperty(
                            m,
                            ASCNAttributes.TOTAL_COPY_NUMBER_STRING
                        ) ||
                        hasASCNProperty(m, ASCNAttributes.ASCN_METHOD_STRING)
                )
        );
    }

    private formatNumber(value: number | undefined): string {
        if (value === undefined || value === null) return 'NA';
        return Number.isInteger(value) ? String(value) : value.toFixed(3);
    }

    render() {
        const { store, sampleManager } = this.props;

        const isLoading =
            store.mutationData.isPending ||
            store.uncalledMutationData.isPending ||
            store.clinicalDataGroupedBySampleMap.isPending;

        if (isLoading) {
            return (
                <LoadingIndicator isLoading={true} size="big" center={true} />
            );
        }

        const clinicalDataMap = store.clinicalDataGroupedBySampleMap.result;
        const mutations = this.mutationsWithASCN;

        if (mutations.length === 0) {
            return (
                <div style={{ margin: 20 }}>
                    <div className="alert alert-info" role="alert">
                        No ASCN data available for this patient.
                    </div>
                </div>
            );
        }

        // Per-sample WGD summary
        const sampleIds = sampleManager
            ? sampleManager.getSampleIdsInOrder()
            : store.sampleIds;

        return (
            <div style={{ margin: 20 }}>
                <h4>Allele-Specific Copy Number (ASCN)</h4>

                {clinicalDataMap && sampleIds.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <strong>Whole Genome Doubling (WGD) status:</strong>
                        <span style={{ marginLeft: 10 }}>
                            {sampleIds.map((sampleId, i) => {
                                const wgdNormalized = getWGDForSample(
                                    clinicalDataMap,
                                    sampleId
                                );
                                const wgdRaw = getWGDRawForSample(
                                    clinicalDataMap,
                                    sampleId
                                );
                                const isWGD =
                                    wgdNormalized ===
                                    ASCNCopyNumberValueEnum.WGD;
                                return (
                                    <span
                                        key={sampleId}
                                        style={{ marginRight: 16 }}
                                    >
                                        {sampleManager?.getComponentForSample(
                                            sampleId,
                                            1,
                                            ''
                                        ) || sampleId}
                                        <span
                                            style={{
                                                marginLeft: 4,
                                                fontWeight: isWGD
                                                    ? 'bold'
                                                    : 'normal',
                                            }}
                                        >
                                            {wgdRaw ===
                                            ASCNCopyNumberValueEnum.NA
                                                ? 'Unknown'
                                                : wgdRaw}
                                        </span>
                                    </span>
                                );
                            })}
                        </span>
                    </div>
                )}

                <table className="table table-bordered table-striped table-condensed">
                    <thead>
                        <tr>
                            <th>Gene</th>
                            <th>Protein Change</th>
                            <th>Sample</th>
                            <th>Copy #</th>
                            <th>Total CN</th>
                            <th>Minor CN</th>
                            <th>ASCN Integer CN</th>
                            <th>Clonal</th>
                            <th>CCF Expected Copies</th>
                            <th>CCF Upper</th>
                            <th>ASCN Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mutations.map(mutationGroup => {
                            const first = mutationGroup[0];
                            const gene = first.gene?.hugoGeneSymbol;
                            const proteinChange = first.proteinChange;
                            return mutationGroup.map((mutation, i) => {
                                const ascn = mutation.alleleSpecificCopyNumber;
                                const wgd = getWGDForSample(
                                    clinicalDataMap,
                                    mutation.sampleId
                                );
                                const totalCN =
                                    ascn?.totalCopyNumber !== undefined
                                        ? String(ascn.totalCopyNumber)
                                        : hasASCNProperty(
                                              mutation,
                                              ASCNAttributes.ASCN_METHOD_STRING
                                          )
                                        ? ASCNCopyNumberValueEnum.INDETERMINATE
                                        : ASCNCopyNumberValueEnum.NA;
                                const minorCN =
                                    ascn?.minorCopyNumber !== undefined
                                        ? String(ascn.minorCopyNumber)
                                        : hasASCNProperty(
                                              mutation,
                                              ASCNAttributes.ASCN_METHOD_STRING
                                          )
                                        ? ASCNCopyNumberValueEnum.INDETERMINATE
                                        : ASCNCopyNumberValueEnum.NA;
                                const ascnIntCN =
                                    ascn?.ascnIntegerCopyNumber !== undefined
                                        ? String(ascn.ascnIntegerCopyNumber)
                                        : hasASCNProperty(
                                              mutation,
                                              ASCNAttributes.ASCN_METHOD_STRING
                                          )
                                        ? ASCNCopyNumberValueEnum.INDETERMINATE
                                        : ASCNCopyNumberValueEnum.NA;

                                return (
                                    <tr
                                        key={`${mutation.sampleId}-${gene}-${proteinChange}-${i}`}
                                    >
                                        {i === 0 && (
                                            <td
                                                rowSpan={mutationGroup.length}
                                                style={{
                                                    verticalAlign: 'middle',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {gene}
                                            </td>
                                        )}
                                        {i === 0 && (
                                            <td
                                                rowSpan={mutationGroup.length}
                                                style={{
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                {proteinChange || 'N/A'}
                                            </td>
                                        )}
                                        <td>
                                            {sampleManager?.getComponentForSample(
                                                mutation.sampleId,
                                                1,
                                                ''
                                            ) || mutation.sampleId}
                                        </td>
                                        <td>
                                            <ASCNCopyNumberElement
                                                sampleId={mutation.sampleId}
                                                wgdValue={wgd}
                                                totalCopyNumberValue={totalCN}
                                                minorCopyNumberValue={minorCN}
                                                ascnCopyNumberValue={ascnIntCN}
                                                sampleManager={sampleManager}
                                            />
                                        </td>
                                        <td>{totalCN}</td>
                                        <td>{minorCN}</td>
                                        <td>{ascnIntCN}</td>
                                        <td>{ascn?.clonal ?? 'NA'}</td>
                                        <td>
                                            {this.formatNumber(
                                                ascn?.ccfExpectedCopies
                                            )}
                                        </td>
                                        <td>
                                            {this.formatNumber(
                                                ascn?.ccfExpectedCopiesUpper
                                            )}
                                        </td>
                                        <td>{ascn?.ascnMethod ?? 'NA'}</td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
}
