import * as React from 'react';
import * as _ from 'lodash';
import { computed, observable, action } from 'mobx';
import { observer } from 'mobx-react';
import fileDownload from 'react-file-download';
import {
    AnnotatedExtendedAlteration,
    ExtendedAlteration,
    ResultsViewPageStore,
    ModifyQueryParams,
    CaseAggregatedData,
    AlterationTypeConstants,
} from '../ResultsViewPageStore';
import {
    CoverageInformation,
    getSingleGeneResultKey,
    getMultipleGeneResultKey,
} from '../ResultsViewPageStoreUtils';
import {
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
    MergedTrackLineFilterOutput,
} from 'shared/lib/oql/oqlfilter';
import FeatureTitle from 'shared/components/featureTitle/FeatureTitle';
import { SimpleCopyDownloadControls } from 'shared/components/copyDownloadControls/SimpleCopyDownloadControls';
import {
    default as GeneAlterationTable,
    IGeneAlteration,
} from './GeneAlterationTable';
import {
    default as CaseAlterationTable,
    ICaseAlteration,
} from './CaseAlterationTable';
import {
    generateCaseAlterationData,
    generateCnaData,
    generateDownloadData,
    generateGeneAlterationData,
    generateMrnaData,
    generateMutationData,
    generateMutationDownloadData,
    generateProteinData,
    hasValidData,
    hasValidStructuralVariantData,
    hasValidMutationData,
    stringify2DArray,
    generateOtherMolecularProfileData,
    generateOtherMolecularProfileDownloadData,
    generateGenericAssayProfileData,
    generateGenericAssayProfileDownloadData,
    generateStructuralVariantData,
    generateStructuralDownloadData,
} from './DownloadUtils';

import styles from './styles.module.scss';
import classNames from 'classnames';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import { WindowWidthBox } from '../../../shared/components/WindowWidthBox/WindowWidthBox';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import onMobxPromise from 'shared/lib/onMobxPromise';
import {
    MolecularProfile,
    Sample,
    CancerStudy,
    GenericAssayData,
} from 'cbioportal-ts-api-client';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import { CUSTOM_CASE_LIST_ID } from 'shared/components/query/QueryStore';
import { IVirtualStudyProps } from 'pages/studyView/virtualStudy/VirtualStudy';
import { Alteration } from 'shared/lib/oql/oql-parser';
import autobind from 'autobind-decorator';
import FontAwesome from 'react-fontawesome';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';

export interface IDownloadTabProps {
    store: ResultsViewPageStore;
}

@observer
export default class DownloadTab extends React.Component<
    IDownloadTabProps,
    {}
> {
    constructor(props: IDownloadTabProps) {
        super(props);

        this.handleMutationDownload = this.handleMutationDownload.bind(this);
        this.handleTransposedMutationDownload = this.handleTransposedMutationDownload.bind(
            this
        );
        this.handleCnaDownload = this.handleCnaDownload.bind(this);
        this.handleTransposedCnaDownload = this.handleTransposedCnaDownload.bind(
            this
        );
        this.handleMrnaDownload = this.handleMrnaDownload.bind(this);
        this.handleTransposedMrnaDownload = this.handleTransposedMrnaDownload.bind(
            this
        );
        this.handleProteinDownload = this.handleProteinDownload.bind(this);
        this.handleTransposedProteinDownload = this.handleTransposedProteinDownload.bind(
            this
        );
    }

    readonly geneAlterationData = remoteData<IGeneAlteration[]>({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine,
            this.props.store.filteredSequencedSampleKeysByGene,
        ],
        invoke: () =>
            Promise.resolve(
                generateGeneAlterationData(
                    this.props.store.oqlFilteredCaseAggregatedDataByOQLLine
                        .result!,
                    this.props.store.filteredSequencedSampleKeysByGene.result!
                )
            ),
    });

    readonly geneAlterationDataByGene = remoteData<{
        [gene: string]: IGeneAlteration;
    }>({
        await: () => [this.geneAlterationData],
        invoke: () =>
            Promise.resolve(_.keyBy(this.geneAlterationData.result!, 'gene')),
    });

    readonly caseAlterationData = remoteData<ICaseAlteration[]>({
        await: () => [
            this.props.store.selectedMolecularProfiles,
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine,
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.props.store.coverageInformation,
            this.props.store.filteredSamples,
            this.geneAlterationDataByGene,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],
        invoke: () =>
            Promise.resolve(
                generateCaseAlterationData(
                    this.props.store.oqlText,
                    this.props.store.selectedMolecularProfiles.result!,
                    this.props.store.oqlFilteredCaseAggregatedDataByOQLLine
                        .result!,
                    this.props.store
                        .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine
                        .result!,
                    this.props.store.coverageInformation.result!,
                    this.props.store.filteredSamples.result!,
                    this.geneAlterationDataByGene.result!,
                    this.props.store.molecularProfileIdToMolecularProfile
                        .result!
                )
            ),
    });

    readonly mutationData = remoteData<{ [key: string]: ExtendedAlteration[] }>(
        {
            await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
            invoke: () => {
                return Promise.resolve(
                    generateMutationData(
                        this.props.store.nonOqlFilteredCaseAggregatedData
                            .result!
                    )
                );
            },
        }
    );

    readonly mutationDownloadData = remoteData<string[][]>({
        await: () => [
            this.mutationData,
            this.props.store.samples,
            this.props.store.genes,
        ],
        invoke: () =>
            Promise.resolve(
                generateMutationDownloadData(
                    this.mutationData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!
                )
            ),
    });

    readonly allOtherMolecularProfileDataGroupByProfileName = remoteData<{
        [profileName: string]: { [key: string]: ExtendedAlteration[] };
    }>({
        await: () => [
            this.props.store.nonSelectedDownloadableMolecularData,
            this.props.store
                .nonSelectedDownloadableMolecularProfilesGroupByName,
        ],
        invoke: () => {
            const profileNames = _.keys(
                this.props.store
                    .nonSelectedDownloadableMolecularProfilesGroupByName.result
            );
            if (
                this.props.store.doNonSelectedDownloadableMolecularProfilesExist
            ) {
                const data = {
                    samples: _.groupBy(
                        this.props.store.nonSelectedDownloadableMolecularData
                            .result!,
                        data => data.uniqueSampleKey
                    ),
                } as CaseAggregatedData<ExtendedAlteration>;
                const allOtherMolecularProfileDataGroupByProfileName: {
                    [profileName: string]: {
                        [key: string]: ExtendedAlteration[];
                    };
                } = _.reduce(
                    profileNames,
                    (
                        allOtherMolecularProfileDataGroupByProfileName,
                        profileName
                    ) => {
                        allOtherMolecularProfileDataGroupByProfileName[
                            profileName
                        ] = generateOtherMolecularProfileData(
                            this.props.store.nonSelectedDownloadableMolecularProfilesGroupByName.result[
                                profileName
                            ].map(profile => profile.molecularProfileId),
                            data
                        );
                        return allOtherMolecularProfileDataGroupByProfileName;
                    },
                    {} as {
                        [profileName: string]: {
                            [key: string]: ExtendedAlteration[];
                        };
                    }
                );
                return Promise.resolve(
                    allOtherMolecularProfileDataGroupByProfileName
                );
            }
            return Promise.resolve({});
        },
    });

    readonly allOtherMolecularProfileDownloadDataGroupByProfileName = remoteData<{
        [key: string]: string[][];
    }>({
        await: () => [
            this.allOtherMolecularProfileDataGroupByProfileName,
            this.props.store.samples,
            this.props.store.genes,
        ],
        invoke: () =>
            Promise.resolve(
                _.mapValues(
                    this.allOtherMolecularProfileDataGroupByProfileName.result,
                    otherMolecularProfileData => {
                        return generateOtherMolecularProfileDownloadData(
                            otherMolecularProfileData,
                            this.props.store.samples.result!,
                            this.props.store.genes.result!
                        );
                    }
                )
            ),
    });

    readonly genericAssayProfileDownloadDataGroupByProfileIdSuffix = remoteData<{
        [key: string]: string[][];
    }>({
        await: () => [
            this.props.store.samples,
            this.props.store.genericAssayEntityStableIdsGroupByProfileIdSuffix,
            this.props.store.genericAssayDataGroupByProfileIdSuffix,
            this.props.store.genericAssayProfilesGroupByProfileIdSuffix,
        ],
        invoke: () => {
            const genericAssayProfileDataGroupByProfileIdSuffix = _.mapValues(
                this.props.store.genericAssayDataGroupByProfileIdSuffix.result,
                (genericAssayProfileData, profileIdSuffix) => {
                    const data = {
                        samples: _.groupBy(
                            genericAssayProfileData,
                            data => data.uniqueSampleKey
                        ),
                    } as CaseAggregatedData<GenericAssayData>;
                    return generateGenericAssayProfileData(
                        this.props.store.genericAssayProfilesGroupByProfileIdSuffix.result![
                            profileIdSuffix
                        ].map(profile => profile.molecularProfileId),
                        data
                    );
                }
            );

            return Promise.resolve(
                _.mapValues(
                    genericAssayProfileDataGroupByProfileIdSuffix,
                    (genericAssayProfileData, profileIdSuffix) => {
                        return generateGenericAssayProfileDownloadData(
                            genericAssayProfileData,
                            this.props.store.samples.result!,
                            this.props.store
                                .genericAssayEntityStableIdsGroupByProfileIdSuffix
                                .result![profileIdSuffix]
                        );
                    }
                )
            );
        },
    });

    readonly mrnaData = remoteData<{ [key: string]: ExtendedAlteration[] }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateMrnaData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly mrnaDownloadData = remoteData<string[][]>({
        await: () => [
            this.mrnaData,
            this.props.store.samples,
            this.props.store.genes,
        ],
        invoke: () =>
            Promise.resolve(
                generateDownloadData(
                    this.mrnaData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!
                )
            ),
    });

    readonly proteinData = remoteData<{ [key: string]: ExtendedAlteration[] }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateProteinData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly proteinDownloadData = remoteData<string[][]>({
        await: () => [
            this.proteinData,
            this.props.store.samples,
            this.props.store.genes,
        ],
        invoke: () =>
            Promise.resolve(
                generateDownloadData(
                    this.proteinData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!
                )
            ),
    });

    readonly cnaData = remoteData<{ [key: string]: ExtendedAlteration[] }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateCnaData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly cnaDownloadData = remoteData<string[][]>({
        await: () => [
            this.cnaData,
            this.props.store.samples,
            this.props.store.genes,
        ],
        invoke: () =>
            Promise.resolve(
                generateDownloadData(
                    this.cnaData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!
                )
            ),
    });

    readonly structuralVariantData = remoteData<{
        [key: string]: ExtendedAlteration[];
    }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateStructuralVariantData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly structuralVariantDownloadData = remoteData<string[][]>({
        await: () => [
            this.structuralVariantData,
            this.props.store.samples,
            this.props.store.genes,
        ],
        invoke: () =>
            Promise.resolve(
                generateStructuralDownloadData(
                    this.structuralVariantData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!
                )
            ),
    });

    readonly alteredCaseAlterationData = remoteData<ICaseAlteration[]>({
        await: () => [this.caseAlterationData],
        invoke: () =>
            Promise.resolve(
                this.caseAlterationData.result!.filter(
                    caseAlteration => caseAlteration.altered
                )
            ),
    });

    readonly unalteredCaseAlterationData = remoteData<ICaseAlteration[]>({
        await: () => [this.caseAlterationData],
        invoke: () =>
            Promise.resolve(
                this.caseAlterationData.result!.filter(
                    caseAlteration => !caseAlteration.altered
                )
            ),
    });

    readonly sampleMatrix = remoteData<string[][]>({
        await: () => [this.caseAlterationData],
        invoke: () => {
            let result: string[][] = [];
            _.map(this.caseAlterationData.result!, caseAlteration => {
                // if writing the first line, add titles
                if (_.isEmpty(result)) {
                    const titleMap = _.keys(caseAlteration.oqlDataByGene);
                    result.push(['studyID:sampleId', 'Altered', ...titleMap]);
                }
                // get altered infomation by gene
                const genesAlteredData = _.map(
                    caseAlteration.oqlDataByGene,
                    oqlData => {
                        return _.isEmpty(oqlData.alterationTypes) ? '0' : '1';
                    }
                );
                result.push([
                    `${caseAlteration.studyId}:${caseAlteration.sampleId}`,
                    caseAlteration.altered ? '1' : '0',
                    ...genesAlteredData,
                ]);
            });
            return Promise.resolve(result);
        },
    });

    readonly sampleMatrixText = remoteData<string>({
        await: () => [this.sampleMatrix],
        invoke: () =>
            Promise.resolve(stringify2DArray(this.sampleMatrix.result!)),
    });

    readonly oqls = remoteData<
        OQLLineFilterOutput<AnnotatedExtendedAlteration>[]
    >({
        await: () => [this.props.store.oqlFilteredCaseAggregatedDataByOQLLine],
        invoke: () =>
            Promise.resolve(
                this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.result!.map(
                    data => data.oql
                )
            ),
    });

    readonly trackLabels = remoteData({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
        ],
        invoke: () => {
            const labels: string[] = [];
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                (data, index) => {
                    // mergedTrackOqlList is undefined means the data is for single track / oql
                    if (data.mergedTrackOqlList === undefined) {
                        labels.push(
                            getSingleGeneResultKey(
                                index,
                                this.props.store.oqlText,
                                data.oql as OQLLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            )
                        );
                    }
                    // or data is for merged track (group: list of oqls)
                    else {
                        labels.push(
                            getMultipleGeneResultKey(
                                data.oql as MergedTrackLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            )
                        );
                    }
                }
            );
            return Promise.resolve(labels);
        },
    });

    readonly trackAlterationTypesMap = remoteData({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
        ],
        invoke: () => {
            const trackAlterationTypesMap: { [label: string]: string[] } = {};
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                (data, index) => {
                    // mergedTrackOqlList is undefined means the data is for single track / oql
                    if (data.mergedTrackOqlList === undefined) {
                        const singleTrackOql = data.oql as OQLLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        const label = getSingleGeneResultKey(
                            index,
                            this.props.store.oqlText,
                            data.oql as OQLLineFilterOutput<
                                AnnotatedExtendedAlteration
                            >
                        );
                        // put types for single track into the map, key is track label
                        if (singleTrackOql.parsed_oql_line.alterations) {
                            trackAlterationTypesMap[label] = _.uniq(
                                _.map(
                                    singleTrackOql.parsed_oql_line.alterations,
                                    alteration =>
                                        alteration.alteration_type.toUpperCase()
                                )
                            );
                        }
                    }
                    // or data is for merged track (group: list of oqls)
                    else {
                        const mergedTrackOql = data.oql as MergedTrackLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        const label = getMultipleGeneResultKey(
                            data.oql as MergedTrackLineFilterOutput<
                                AnnotatedExtendedAlteration
                            >
                        );
                        // put types for merged track into the map, key is track label
                        let alterations: string[] = [];
                        _.forEach(
                            mergedTrackOql.list,
                            (
                                oql: OQLLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            ) => {
                                if (oql.parsed_oql_line.alterations) {
                                    const types: string[] = _.map(
                                        oql.parsed_oql_line.alterations,
                                        alteration =>
                                            alteration.alteration_type.toUpperCase()
                                    );
                                    alterations.push(...types);
                                }
                            }
                        );
                        trackAlterationTypesMap[label] = _.uniq(alterations);
                    }
                }
            );
            return Promise.resolve(trackAlterationTypesMap);
        },
    });

    readonly geneAlterationMap = remoteData({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
        ],
        invoke: () => {
            const geneAlterationMap: { [label: string]: Alteration[] } = {};
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                (data, index) => {
                    // mergedTrackOqlList is undefined means the data is for single track / oql
                    if (data.mergedTrackOqlList === undefined) {
                        const singleTrackOql = data.oql as OQLLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        // put types for single track into the map, key is gene name
                        if (singleTrackOql.parsed_oql_line.alterations) {
                            geneAlterationMap[singleTrackOql.gene] = _.chain(
                                singleTrackOql.parsed_oql_line.alterations
                            )
                                .union(geneAlterationMap[singleTrackOql.gene])
                                .uniq()
                                .value();
                        }
                    }
                    // or data is for merged track (group: list of oqls)
                    else {
                        const mergedTrackOql = data.oql as MergedTrackLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        // put types for merged track into the map, key is gene name
                        let alterations: string[] = [];
                        _.forEach(
                            mergedTrackOql.list,
                            (
                                oql: OQLLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            ) => {
                                if (oql.parsed_oql_line.alterations) {
                                    const types: string[] = _.map(
                                        oql.parsed_oql_line.alterations,
                                        alteration => alteration.alteration_type
                                    );
                                    geneAlterationMap[oql.gene] = _.chain(
                                        oql.parsed_oql_line.alterations
                                    )
                                        .union(geneAlterationMap[oql.gene])
                                        .uniq()
                                        .value();
                                }
                            }
                        );
                    }
                }
            );
            return Promise.resolve(geneAlterationMap);
        },
    });

    public render() {
        const status = getRemoteDataGroupStatus(
            this.geneAlterationData,
            this.caseAlterationData,
            this.oqls,
            this.trackLabels,
            this.trackAlterationTypesMap,
            this.geneAlterationMap,
            this.cnaData,
            this.mutationData,
            this.structuralVariantData,
            this.mrnaData,
            this.proteinData,
            this.unalteredCaseAlterationData,
            this.alteredCaseAlterationData,
            this.props.store.virtualStudyParams,
            this.sampleMatrixText,
            this.props.store
                .nonSelectedDownloadableMolecularProfilesGroupByName,
            this.props.store.studies,
            this.props.store.selectedMolecularProfiles,
            this.props.store.genericAssayDataGroupByProfileIdSuffix
        );

        switch (status) {
            case 'pending':
                return (
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                );
            case 'error':
                return <ErrorMessage />;
            case 'complete':
                return (
                    <WindowWidthBox data-test="downloadTabDiv" offset={60}>
                        <div className={'tabMessageContainer'}>
                            <OqlStatusBanner
                                className="download-oql-status-banner"
                                store={this.props.store}
                                tabReflectsOql={true}
                            />
                            <AlterationFilterWarning store={this.props.store} />
                            <CaseFilterWarning store={this.props.store} />
                        </div>
                        <div>
                            <FeatureTitle
                                title="Downloadable Data Files"
                                className="forceHeaderStyle h4"
                                isLoading={false}
                                style={{ marginBottom: 15 }}
                            />
                            <table
                                className={classNames(
                                    'table',
                                    'table-striped',
                                    styles.downloadCopyTable
                                )}
                            >
                                <tbody>
                                    {hasValidData(this.cnaData.result!) &&
                                        this.cnaDownloadControls()}
                                    {hasValidMutationData(
                                        this.mutationData.result!
                                    ) && this.mutationDownloadControls()}
                                    {hasValidStructuralVariantData(
                                        this.structuralVariantData.result!
                                    ) &&
                                        this.structuralVariantDownloadControls()}
                                    {hasValidData(this.mrnaData.result!) &&
                                        this.mrnaExprDownloadControls(
                                            this.props.store.selectedMolecularProfiles.result!.find(
                                                profile =>
                                                    profile.molecularAlterationType ===
                                                    AlterationTypeConstants.MRNA_EXPRESSION
                                            )!.name
                                        )}
                                    {hasValidData(this.proteinData.result!) &&
                                        this.proteinExprDownloadControls(
                                            this.props.store.selectedMolecularProfiles.result!.find(
                                                profile =>
                                                    profile.molecularAlterationType ===
                                                    AlterationTypeConstants.PROTEIN_LEVEL
                                            )!.name
                                        )}
                                    {this.alteredSamplesDownloadControls(
                                        this.alteredCaseAlterationData.result!,
                                        this.props.store.virtualStudyParams
                                            .result!
                                    )}
                                    {this.unalteredSamplesDownloadControls(
                                        this.unalteredCaseAlterationData
                                            .result!,
                                        this.props.store.virtualStudyParams
                                            .result!
                                    )}
                                    {this.sampleMatrixDownloadControls(
                                        this.sampleMatrixText.result!
                                    )}
                                    {this.props.store
                                        .doNonSelectedDownloadableMolecularProfilesExist &&
                                        this.nonSelectedProfileDownloadRow(
                                            this.props.store
                                                .nonSelectedDownloadableMolecularProfilesGroupByName
                                                .result!
                                        )}
                                    {!_.isEmpty(
                                        this.props.store
                                            .genericAssayProfilesGroupByProfileIdSuffix
                                            .result
                                    ) &&
                                        this.genericAssayProfileDownloadRows(
                                            this.props.store
                                                .genericAssayProfilesGroupByProfileIdSuffix
                                                .result!
                                        )}
                                </tbody>
                            </table>
                        </div>
                        <hr />
                        <div
                            className={styles['tables-container']}
                            data-test="dataDownloadGeneAlterationTable"
                        >
                            <FeatureTitle
                                title="Gene Alteration Frequency"
                                isLoading={false}
                                className="pull-left forceHeaderStyle h4"
                            />
                            <GeneAlterationTable
                                geneAlterationData={
                                    this.geneAlterationData.result!
                                }
                            />
                        </div>
                        <hr />
                        <div className={styles['tables-container']}>
                            <FeatureTitle
                                title="Type of Genetic Alterations Across All Samples"
                                isLoading={false}
                                className="pull-left forceHeaderStyle h4"
                            />
                            <CaseAlterationTable
                                caseAlterationData={
                                    this.caseAlterationData.result!
                                }
                                oqls={this.oqls.result!}
                                trackLabels={this.trackLabels.result!}
                                trackAlterationTypesMap={
                                    this.trackAlterationTypesMap.result!
                                }
                                geneAlterationTypesMap={
                                    this.geneAlterationMap.result!
                                }
                            />
                        </div>
                    </WindowWidthBox>
                );
            default:
                return <ErrorMessage />;
        }
    }

    private cnaDownloadControls(): JSX.Element {
        return this.downloadControlsRow(
            'Copy-number Alterations (OQL is not in effect)',
            this.handleCnaDownload,
            this.handleTransposedCnaDownload
        );
    }

    private mutationDownloadControls(): JSX.Element {
        return this.downloadControlsRow(
            'Mutations (OQL is not in effect)',
            this.handleMutationDownload,
            this.handleTransposedMutationDownload
        );
    }

    private structuralVariantDownloadControls(): JSX.Element {
        return this.downloadControlsRow(
            'Structural (OQL is not in effect)',
            this.handleStructuralVariantDownload,
            this.handleTransposedStructuralVariantDownload
        );
    }

    private mrnaExprDownloadControls(profileName: string): JSX.Element {
        return this.downloadControlsRow(
            profileName,
            this.handleMrnaDownload,
            this.handleTransposedMrnaDownload
        );
    }

    private proteinExprDownloadControls(profileName: string): JSX.Element {
        return this.downloadControlsRow(
            profileName,
            this.handleProteinDownload,
            this.handleTransposedProteinDownload
        );
    }

    private downloadControlsRow(
        profileName: string,
        handleTabDelimitedDownload: (name: string) => void,
        handleTransposedMatrixDownload: (name: string) => void
    ) {
        return (
            <tr>
                <td style={{ width: 500 }}>{profileName}</td>
                <td>
                    <a
                        onClick={event =>
                            handleTabDelimitedDownload(profileName)
                        }
                    >
                        <i
                            className="fa fa-cloud-download"
                            style={{ marginRight: 5 }}
                        />
                        Tab Delimited Format
                    </a>
                    <span style={{ margin: '0px 10px' }}>|</span>
                    <a
                        onClick={event =>
                            handleTransposedMatrixDownload(profileName)
                        }
                    >
                        <i
                            className="fa fa-cloud-download"
                            style={{ marginRight: 5 }}
                        />
                        Transposed Matrix
                    </a>
                </td>
            </tr>
        );
    }

    private nonSelectedProfileDownloadRow(
        nonSelectedDownloadableMolecularProfilesGroupByName: _.Dictionary<
            MolecularProfile[]
        >
    ) {
        const allProfileOptions = _.map(
            nonSelectedDownloadableMolecularProfilesGroupByName,
            (profiles: MolecularProfile[], profileName: string) => {
                if (this.props.store.studies.result!.length === 1) {
                    const singleStudyProfile = profiles[0];
                    return {
                        name: profileName,
                        description: singleStudyProfile.description,
                    };
                }
                return { name: profileName };
            }
        );

        return _.map(allProfileOptions, option => (
            <tr>
                <td style={{ width: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {option.name}
                        {option.description && (
                            <DefaultTooltip
                                mouseEnterDelay={0}
                                placement="right"
                                overlay={
                                    <div className={styles.tooltip}>
                                        {option.description}
                                    </div>
                                }
                            >
                                <FontAwesome
                                    className={styles.infoIcon}
                                    name="info-circle"
                                />
                            </DefaultTooltip>
                        )}
                    </div>
                </td>
                <td>
                    <div>
                        <a
                            onClick={() =>
                                this.handleOtherMolecularProfileDownload(
                                    option.name
                                )
                            }
                        >
                            <i
                                className="fa fa-cloud-download"
                                style={{ marginRight: 5 }}
                            />
                            Tab Delimited Format
                        </a>
                        <span style={{ margin: '0px 10px' }}>|</span>
                        <a
                            onClick={() =>
                                this.handleTransposedOtherMolecularProfileDownload(
                                    option.name
                                )
                            }
                        >
                            <i
                                className="fa fa-cloud-download"
                                style={{ marginRight: 5 }}
                            />
                            Transposed Matrix
                        </a>
                    </div>
                </td>
            </tr>
        ));
    }

    private genericAssayProfileDownloadRows(
        genericAssayProfilesGroupByProfileIdSuffix: _.Dictionary<
            MolecularProfile[]
        >
    ) {
        const allProfileOptions = _.map(
            genericAssayProfilesGroupByProfileIdSuffix,
            (profiles: MolecularProfile[], profileIdSuffix: string) => {
                // we are using genericAssayProfilesGroupByProfileIdSuffix
                // each group has at least one profile
                const profile = profiles[0];
                return {
                    name: profile.name,
                    description: profile.description,
                    profileIdSuffix: profileIdSuffix,
                };
            }
        );

        return _.map(allProfileOptions, option => (
            <tr>
                <td style={{ width: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {option.name}
                        {option.description && (
                            <DefaultTooltip
                                mouseEnterDelay={0}
                                placement="right"
                                overlay={
                                    <div className={styles.tooltip}>
                                        {option.description}
                                    </div>
                                }
                            >
                                <FontAwesome
                                    className={styles.infoIcon}
                                    name="info-circle"
                                />
                            </DefaultTooltip>
                        )}
                    </div>
                </td>
                <td>
                    <div>
                        <a
                            onClick={() =>
                                this.handleGenericAssayProfileDownload(
                                    option.name,
                                    option.profileIdSuffix
                                )
                            }
                        >
                            <i
                                className="fa fa-cloud-download"
                                style={{ marginRight: 5 }}
                            />
                            Tab Delimited Format
                        </a>
                        <span style={{ margin: '0px 10px' }}>|</span>
                        <a
                            onClick={() =>
                                this.handleTransposedGenericAssayProfileDownload(
                                    option.name,
                                    option.profileIdSuffix
                                )
                            }
                        >
                            <i
                                className="fa fa-cloud-download"
                                style={{ marginRight: 5 }}
                            />
                            Transposed Matrix
                        </a>
                    </div>
                </td>
            </tr>
        ));
    }

    private copyDownloadControlsRow(
        title: string,
        handleDownload: () => string,
        filename: string
    ) {
        return (
            <tr>
                <td>{title}</td>
                <td>
                    <SimpleCopyDownloadControls
                        controlsStyle="LINK"
                        downloadData={handleDownload}
                        downloadFilename={filename}
                    />
                </td>
            </tr>
        );
    }

    private copyDownloadQueryControlsRow(
        title: string,
        handleDownload: () => string,
        filename: string,
        handleQuery: () => void,
        virtualStudyParams: any
    ) {
        return (
            <tr>
                <td>{title}</td>
                <td>
                    <SimpleCopyDownloadControls
                        controlsStyle="QUERY"
                        downloadData={handleDownload}
                        downloadFilename={filename}
                        handleQuery={handleQuery}
                        virtualStudyParams={virtualStudyParams}
                    />
                </td>
            </tr>
        );
    }

    private alteredSamplesDownloadControls(
        alteredCaseAlterationData: ICaseAlteration[],
        virtualStudyParams: IVirtualStudyProps
    ) {
        const alteredSampleCaseIds = _.map(
            alteredCaseAlterationData,
            caseAlteration =>
                `${caseAlteration.studyId}:${caseAlteration.sampleId}`
        );
        const handleDownload = () => alteredSampleCaseIds.join('\n');
        const handleQuery = () =>
            this.handleQueryButtonClick(alteredSampleCaseIds);
        const alteredSamplesVirtualStudyParams = {
            user: virtualStudyParams.user,
            name: virtualStudyParams.name,
            description: virtualStudyParams.description,
            studyWithSamples: virtualStudyParams.studyWithSamples,
            selectedSamples: _.filter(
                virtualStudyParams.selectedSamples,
                (sample: Sample) =>
                    alteredSampleCaseIds.includes(
                        `${sample.studyId}:${sample.sampleId}`
                    )
            ),
            filter: virtualStudyParams.filter,
            attributesMetaSet: virtualStudyParams.attributesMetaSet,
        } as IVirtualStudyProps;

        return this.copyDownloadQueryControlsRow(
            'Altered samples: List of samples with alterations',
            handleDownload,
            'altered_samples.txt',
            handleQuery,
            alteredSamplesVirtualStudyParams
        );
    }

    private unalteredSamplesDownloadControls(
        unalteredCaseAlterationData: ICaseAlteration[],
        virtualStudyParams: IVirtualStudyProps
    ) {
        const unalteredSampleCaseIds = _.map(
            unalteredCaseAlterationData,
            caseAlteration =>
                `${caseAlteration.studyId}:${caseAlteration.sampleId}`
        );
        const handleDownload = () => unalteredSampleCaseIds.join('\n');
        const handleQuery = () =>
            this.handleQueryButtonClick(unalteredSampleCaseIds);
        const unalteredSamplesVirtualStudyParams = {
            user: virtualStudyParams.user,
            name: virtualStudyParams.name,
            description: virtualStudyParams.description,
            studyWithSamples: virtualStudyParams.studyWithSamples,
            selectedSamples: _.filter(
                virtualStudyParams.selectedSamples,
                (sample: Sample) =>
                    unalteredSampleCaseIds.includes(
                        `${sample.studyId}:${sample.sampleId}`
                    )
            ),
            filter: virtualStudyParams.filter,
            attributesMetaSet: virtualStudyParams.attributesMetaSet,
        } as IVirtualStudyProps;

        return this.copyDownloadQueryControlsRow(
            'Unaltered samples: List of samples without any alteration',
            handleDownload,
            'unaltered_samples.txt',
            handleQuery,
            unalteredSamplesVirtualStudyParams
        );
    }

    private sampleMatrixDownloadControls(sampleMatrixText: string) {
        const handleDownload = () => sampleMatrixText;

        return this.copyDownloadControlsRow(
            'Sample matrix: List of all samples where 1=altered and 0=unaltered',
            handleDownload,
            'sample_matrix.txt'
        );
    }

    private handleMutationDownload() {
        onMobxPromise(this.mutationDownloadData, data => {
            const text = this.downloadDataText(data);
            fileDownload(text, 'mutations.txt');
        });
    }

    private handleTransposedMutationDownload() {
        onMobxPromise(this.mutationDownloadData, data => {
            const text = this.downloadDataText(this.unzipDownloadData(data));
            fileDownload(text, 'mutations_transposed.txt');
        });
    }

    @autobind
    private handleStructuralVariantDownload() {
        onMobxPromise(this.structuralVariantDownloadData, data => {
            const text = this.downloadDataText(data);
            fileDownload(text, 'structural_variants.txt');
        });
    }

    private handleTransposedStructuralVariantDownload() {
        onMobxPromise(this.structuralVariantDownloadData, data => {
            const text = this.downloadDataText(this.unzipDownloadData(data));
            fileDownload(text, 'structural_variants.txt');
        });
    }

    private handleMrnaDownload(profileName: string) {
        onMobxPromise(this.mrnaDownloadData, data => {
            const text = this.downloadDataText(data);
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleTransposedMrnaDownload(profileName: string) {
        onMobxPromise(this.mrnaDownloadData, data => {
            const text = this.downloadDataText(this.unzipDownloadData(data));
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleProteinDownload(profileName: string) {
        onMobxPromise(this.proteinDownloadData, data => {
            const text = this.downloadDataText(data);
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleTransposedProteinDownload(profileName: string) {
        onMobxPromise(this.proteinDownloadData, data => {
            const text = this.downloadDataText(this.unzipDownloadData(data));
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleCnaDownload() {
        onMobxPromise(this.cnaDownloadData, data => {
            const text = this.downloadDataText(data);
            fileDownload(text, 'cna.txt');
        });
    }

    private handleTransposedCnaDownload() {
        onMobxPromise(this.cnaDownloadData, data => {
            const text = this.downloadDataText(this.unzipDownloadData(data));
            fileDownload(text, 'cna_transposed.txt');
        });
    }

    @autobind
    private handleOtherMolecularProfileDownload(profileName: string) {
        onMobxPromise(
            this.allOtherMolecularProfileDownloadDataGroupByProfileName,
            downloadDataGroupByProfileName => {
                const textMap = this.downloadDataTextGroupByKey(
                    downloadDataGroupByProfileName
                );
                fileDownload(textMap[profileName], `${profileName}.txt`);
            }
        );
    }

    @autobind
    private handleTransposedOtherMolecularProfileDownload(profileName: string) {
        onMobxPromise(
            this.allOtherMolecularProfileDownloadDataGroupByProfileName,
            downloadDataGroupByProfileName => {
                const transposedTextMap = this.downloadDataTextGroupByKey(
                    this.unzipDownloadDataGroupByKey(
                        downloadDataGroupByProfileName
                    )
                );
                fileDownload(
                    transposedTextMap[profileName],
                    `${profileName}.txt`
                );
            }
        );
    }

    @autobind
    private handleGenericAssayProfileDownload(
        profileName: string,
        profileIdSuffix: string
    ) {
        onMobxPromise(
            this.genericAssayProfileDownloadDataGroupByProfileIdSuffix,
            downloadDataGroupByProfileIdSuffix => {
                const textMap = this.downloadDataTextGroupByKey(
                    downloadDataGroupByProfileIdSuffix
                );
                fileDownload(textMap[profileIdSuffix], `${profileName}.txt`);
            }
        );
    }

    @autobind
    private handleTransposedGenericAssayProfileDownload(
        profileName: string,
        profileIdSuffix: string
    ) {
        onMobxPromise(
            this.genericAssayProfileDownloadDataGroupByProfileIdSuffix,
            downloadDataGroupByProfileIdSuffix => {
                const transposedTextMap = this.downloadDataTextGroupByKey(
                    this.unzipDownloadDataGroupByKey(
                        downloadDataGroupByProfileIdSuffix
                    )
                );
                fileDownload(
                    transposedTextMap[profileIdSuffix],
                    `${profileName}.txt`
                );
            }
        );
    }

    @action
    private handleQueryButtonClick(querySampleIds: string[]) {
        const modifyQueryParams: ModifyQueryParams = {
            selectedSampleListId: CUSTOM_CASE_LIST_ID,
            selectedSampleIds: querySampleIds,
            caseIdsMode: 'sample',
        };
        this.props.store.modifyQueryParams = modifyQueryParams;
        this.props.store.queryFormVisible = true;
    }

    private unzipDownloadDataGroupByKey(downloadDataGroupByKey: {
        [key: string]: string[][];
    }): { [key: string]: string[][] } {
        return _.mapValues(
            downloadDataGroupByKey,
            otherMolecularProfileDownloadData => {
                return _.unzip(otherMolecularProfileDownloadData);
            }
        );
    }

    private downloadDataTextGroupByKey(downloadDataGroupByKey: {
        [key: string]: string[][];
    }): { [x: string]: string } {
        return _.mapValues(downloadDataGroupByKey, downloadData => {
            return stringify2DArray(downloadData);
        });
    }

    private unzipDownloadData(downloadData: string[][]): string[][] {
        return _.unzip(downloadData);
    }

    private downloadDataText(downloadData: string[][]): string {
        return stringify2DArray(downloadData);
    }
}
