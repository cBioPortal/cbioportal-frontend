/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as _ from 'lodash';
import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, computed, makeObservable } from 'mobx';
import {
    default as LazyMobXTable,
    Column,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';

import { getStudySummaryUrl } from '../../api/urls';
import { StructuralVariantExt } from '../../model/Fusion';
import { ILazyMobXTableApplicationDataStore } from '../../lib/ILazyMobXTableApplicationDataStore';
import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from '../../lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import { IPaginationControlsProps } from '../paginationControls/PaginationControls';
import { TruncatedText } from 'cbioportal-frontend-commons/src';
import {
    CancerStudy,
    MolecularProfile,
    StructuralVariant,
} from 'cbioportal-ts-api-client/src';
import styles from 'shared/components/mutationTable/column/mutationStatus.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

/**
 * Fusion table column types
 */
export enum FusionTableColumnType {
    STUDY,
    SAMPLE_ID,
    CANCER_TYPE_DETAILED,
    SITE1_ENTREZ_GENE_ID,
    SITE1_HUGO_SYMBOL,
    SITE1_ENSEMBL_TRANSCRIPT_ID,
    SITE1_EXON,
    SITE1_CHROMOSOME,
    SITE1_POSITION,
    SITE1_DESCRIPTION,
    SITE2_ENTREZ_GENE_ID,
    SITE2_HUGO_SYMBOL,
    SITE2_ENSEMBL_TRANSCRIPT_ID,
    SITE2_EXON,
    SITE2_CHROMOSOME,
    SITE2_POSITION,
    SITE2_DESCRIPTION,
    SITE2_EFFECT_ON_FRAME,
    MUTATION_STATUS,
    NCBI_BUILD,
    DNA_SUPPORT,
    RNA_SUPPORT,
    NORMAL_READ_COUNT,
    TUMOR_READ_COUNT,
    NORMAL_VARIANT_COUNT,
    TUMOR_VARIANT_COUNT,
    NORMAL_PAIRED_END_READ_COUNT,
    TUMOR_PAIRED_END_READ_COUNT,
    NORMAL_SPLIT_READ_COUNT,
    TUMOR_SPLIT_READ_COUNT,
    BREAKPOINT_TYPE,
    FUSION_DESCRIPTION,
    CENTER,
    CONNECTION_TYPE,
    EVENT_INFO,
    VARIANT_CLASS,
    LENGTH,
    COMMENTS,
}

export type FusionTableColumnProps = {
    columnType: number;
    label: string;
    attribute: string;
};

export const FusionTableColumnLabelProps: FusionTableColumnProps[] = [
    {
        columnType: FusionTableColumnType.STUDY,
        label: 'Study',
        attribute: 'studyId',
    },
    {
        columnType: FusionTableColumnType.SAMPLE_ID,
        label: 'Sample ID',
        attribute: 'sampleId',
    },
    {
        columnType: FusionTableColumnType.CANCER_TYPE_DETAILED,
        label: 'Cancer Type Detailed',
        attribute: 'cancerTypeDetailed',
    },
    {
        columnType: FusionTableColumnType.SITE1_ENTREZ_GENE_ID,
        label: 'Site1 Entrez Gene Id',
        attribute: 'site1EntrezGeneId',
    },
    {
        columnType: FusionTableColumnType.SITE1_HUGO_SYMBOL,
        label: 'Gene 1',
        attribute: 'site1HugoSymbol',
    },
    {
        columnType: FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID,
        label: 'Site1 Ensembl Transcript Id',
        attribute: 'site1EnsemblTranscriptId',
    },
    {
        columnType: FusionTableColumnType.SITE1_EXON,
        label: 'Site1 Exon',
        attribute: 'site1Exon',
    },
    {
        columnType: FusionTableColumnType.SITE1_CHROMOSOME,
        label: 'Site1 Chromosome',
        attribute: 'site1Chromosome',
    },
    {
        columnType: FusionTableColumnType.SITE1_POSITION,
        label: 'Site1 Position',
        attribute: 'site1Position',
    },
    {
        columnType: FusionTableColumnType.SITE1_DESCRIPTION,
        label: 'Site1 Description',
        attribute: 'site1Description',
    },

    {
        columnType: FusionTableColumnType.SITE2_ENTREZ_GENE_ID,
        label: 'Site2 Entrez Gene Idd',
        attribute: 'site2EntrezGeneId',
    },
    {
        columnType: FusionTableColumnType.SITE2_HUGO_SYMBOL,
        label: 'Gene 2',
        attribute: 'site2HugoSymbol',
    },
    {
        columnType: FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID,
        label: 'Site2 Ensembl Transcript Id',
        attribute: 'site2EnsemblTranscriptId',
    },
    {
        columnType: FusionTableColumnType.SITE2_EXON,
        label: 'Site2 Exon',
        attribute: 'site2Exon',
    },
    {
        columnType: FusionTableColumnType.SITE2_CHROMOSOME,
        label: 'Site2 Chromosome',
        attribute: 'site2Chromosome',
    },
    {
        columnType: FusionTableColumnType.SITE2_POSITION,
        label: 'Site2 Position',
        attribute: 'site2Position',
    },
    {
        columnType: FusionTableColumnType.SITE2_DESCRIPTION,
        label: 'Site2 Description',
        attribute: 'site2Description',
    },
    {
        columnType: FusionTableColumnType.SITE2_EFFECT_ON_FRAME,
        label: 'Effect on Frame',
        attribute: 'site2EffectOnFrame',
    },
    {
        columnType: FusionTableColumnType.MUTATION_STATUS,
        label: 'MS',
        attribute: 'svStatus',
    },
    {
        columnType: FusionTableColumnType.NCBI_BUILD,
        label: 'NCBI Build',
        attribute: 'ncbiBuild',
    },
    {
        columnType: FusionTableColumnType.DNA_SUPPORT,
        label: 'DNA Support',
        attribute: 'dnaSupport',
    },
    {
        columnType: FusionTableColumnType.RNA_SUPPORT,
        label: 'RNA Support',
        attribute: 'rnaSupport',
    },

    {
        columnType: FusionTableColumnType.NORMAL_READ_COUNT,
        label: 'Normal Read Count',
        attribute: 'normalReadCount',
    },
    {
        columnType: FusionTableColumnType.TUMOR_READ_COUNT,
        label: 'Tumor Read Count',
        attribute: 'tumorReadCount',
    },
    {
        columnType: FusionTableColumnType.NORMAL_VARIANT_COUNT,
        label: 'Normal Variant Count',
        attribute: 'normalVariantCount',
    },
    {
        columnType: FusionTableColumnType.TUMOR_VARIANT_COUNT,
        label: 'Tumor Variant Count',
        attribute: 'tumorVariantCount',
    },
    {
        columnType: FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT,
        label: 'Normal Paired End Read Count',
        attribute: 'normalPairedEndReadCount',
    },
    {
        columnType: FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT,
        label: 'Tumor Paired End Read Count',
        attribute: 'tumorPairedEndReadCount',
    },
    {
        columnType: FusionTableColumnType.NORMAL_SPLIT_READ_COUNT,
        label: 'Normal Split Read Count',
        attribute: 'normalSplitReadCount',
    },
    {
        columnType: FusionTableColumnType.TUMOR_SPLIT_READ_COUNT,
        label: 'Tumor Split Read Count',
        attribute: 'tumorSplitReadCount',
    },

    {
        columnType: FusionTableColumnType.BREAKPOINT_TYPE,
        label: 'Breakpoint Type',
        attribute: 'breakpointType',
    },
    {
        columnType: FusionTableColumnType.FUSION_DESCRIPTION,
        label: 'Fusion Description',
        attribute: 'annotation',
    },
    {
        columnType: FusionTableColumnType.CENTER,
        label: 'Center',
        attribute: 'center',
    },
    {
        columnType: FusionTableColumnType.CONNECTION_TYPE,
        label: 'Connection Type',
        attribute: 'connectionType',
    },
    {
        columnType: FusionTableColumnType.EVENT_INFO,
        label: 'Event Info',
        attribute: 'eventInfo',
    },
    {
        columnType: FusionTableColumnType.VARIANT_CLASS,
        label: 'Variant Class',
        attribute: 'variantClass',
    },
    {
        columnType: FusionTableColumnType.LENGTH,
        label: 'Length',
        attribute: 'length',
    },
    {
        columnType: FusionTableColumnType.COMMENTS,
        label: 'Comments',
        attribute: 'comments',
    },
];

export type FusionTableColumn = Column<StructuralVariant[]> & {
    order?: number;
    shouldExclude?: () => boolean;
};

export interface IFusionTableProps {
    studyIdToStudy?: Map<string, CancerStudy>;
    uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string };
    molecularProfileIdToMolecularProfile?: Map<string, MolecularProfile>;
    columns?: FusionTableColumnType[];
    dataStore?: ILazyMobXTableApplicationDataStore<StructuralVariant[]>;
    downloadDataFetcher?: ILazyMobXTableApplicationLazyDownloadDataFetcher;
    fusionMolecularProfile: MolecularProfile | undefined;
    initialItemsPerPage?: number;
    itemsLabel?: string;
    itemsLabelPlural?: string;
    userEmailAddress?: string;
    initialSortColumn?: string;
    initialSortDirection?: SortDirection;
    paginationProps?: IPaginationControlsProps;
    showCountHeader?: boolean;
}

export class FusionTableComponent extends LazyMobXTable<StructuralVariant[]> {}

@observer
export default class FusionTable<
    P extends IFusionTableProps
> extends React.Component<P, {}> {
    @observable protected _columns: { [columnEnum: number]: FusionTableColumn };

    public static defaultProps = {
        initialItemsPerPage: 25,
        showCountHeader: true,
        paginationProps: { itemsPerPageOptions: [25, 50, 100] },
        initialSortColumn: 'Sample Id',
        initialSortDirection: 'desc',
        itemsLabel: 'Fusion',
        itemsLabelPlural: 'Fusions',
    };

    constructor(props: P) {
        super(props);
        makeObservable(this);
        this._columns = {};
        this.generateColumns();
    }

    private defaultFilter(
        data: StructuralVariant[],
        dataField: string,
        filterStringUpper: string
    ): boolean {
        if (data.length) {
            return data.reduce((match: boolean, next: StructuralVariant) => {
                let val: string = (next as any)[dataField];
                if (val) {
                    return (
                        match ||
                        String(val)
                            .toUpperCase()
                            .indexOf(filterStringUpper) > -1
                    );
                } else {
                    return match;
                }
            }, false);
        } else {
            return false;
        }
    }

    private renderColumnFn(
        label: FusionTableColumnProps,
        molecularProfileIdToMolecularProfile?: Map<string, MolecularProfile>,
        studyIdToStudy?: Map<string, CancerStudy>
    ) {
        let _renderColumnFn = (d: StructuralVariantExt[]) => {
            const data = d[0][label.attribute];
            return <span>{data}</span>;
        };

        if (molecularProfileIdToMolecularProfile && studyIdToStudy) {
            if (
                label.columnType === FusionTableColumnType.SAMPLE_ID &&
                this.props.fusionMolecularProfile
            ) {
                _renderColumnFn = (d: StructuralVariantExt[]) => {
                    const sampleId = d[0][label.attribute];
                    const molecularProfileId =
                        d[0].studyId + '_structural_variants';
                    const geneticProfile = molecularProfileIdToMolecularProfile.get(
                        molecularProfileId
                    );

                    if (geneticProfile) {
                        const study = studyIdToStudy.get(
                            geneticProfile.studyId
                        );
                        if (study) {
                            let linkToPatientView: string = `#/patient?sampleId=${sampleId}&studyId=${study.studyId}`;
                            // START HACK
                            // to deal with having mutation mapper on index.do
                            // Change it to case.do
                            // https://github.com/cBioPortal/cbioportal/issues/2783
                            const indexLocation: number = window.location.href.search(
                                'index.do'
                            );

                            if (indexLocation > -1) {
                                linkToPatientView =
                                    window.location.href.substring(
                                        0,
                                        indexLocation
                                    ) +
                                    'case.do' +
                                    linkToPatientView;
                            }
                            // END HACK
                            return (
                                <a href={linkToPatientView} target="_blank">
                                    {sampleId}
                                </a>
                            );
                        } else {
                            return <span>{sampleId}</span>;
                        }
                    } else {
                        return <span>{sampleId}</span>;
                    }
                };
            } else if (
                label.columnType === FusionTableColumnType.STUDY &&
                this.props.studyIdToStudy
            ) {
                _renderColumnFn = (d: StructuralVariant[]) => {
                    const molecularProfileId =
                        d[0].studyId + '_structural_variants';
                    const geneticProfile = molecularProfileIdToMolecularProfile.get(
                        molecularProfileId
                    );

                    if (!geneticProfile) return <span />;

                    const study = studyIdToStudy.get(geneticProfile.studyId);
                    return study ? (
                        <a
                            href={getStudySummaryUrl(study.studyId)}
                            target="_blank"
                        >
                            <TruncatedText
                                text={study.name}
                                tooltip={
                                    <div
                                        style={{ maxWidth: 300 }}
                                        dangerouslySetInnerHTML={{
                                            __html: `${study.name}: ${study.description}`,
                                        }}
                                    />
                                }
                                maxLength={16}
                            />
                        </a>
                    ) : (
                        <span />
                    );
                };
            }
        }

        if (
            label.columnType === FusionTableColumnType.CANCER_TYPE_DETAILED &&
            this.props.uniqueSampleKeyToTumorType
        ) {
            _renderColumnFn = (d: StructuralVariant[]) => {
                let data: string | null = null;

                if (this.props.uniqueSampleKeyToTumorType) {
                    data =
                        this.props.uniqueSampleKeyToTumorType[
                            d[0].uniqueSampleKey
                        ] || null;
                }
                return <span>{data || ''}</span>;
            };
        }

        if (label.columnType === FusionTableColumnType.MUTATION_STATUS) {
            _renderColumnFn = (d: StructuralVariant[]) => {
                const data = d[0].svStatus;
                let content: JSX.Element;
                let needTooltip = false;

                if (data.toLowerCase().indexOf('somatic') > -1) {
                    content = <span className={styles.somatic}>S</span>;
                    needTooltip = true;
                } else if (data.toLowerCase().indexOf('germline') > -1) {
                    content = <span className={styles.germline}>G</span>;
                    needTooltip = true;
                } else {
                    content = <span className={styles.unknown}>{data}</span>;
                }

                if (needTooltip) {
                    content = (
                        <DefaultTooltip
                            overlay={<span>{data}</span>}
                            placement="right"
                        >
                            {content}
                        </DefaultTooltip>
                    );
                }

                return content;
            };
        }

        return _renderColumnFn;
    }

    protected generateColumns() {
        let visibleColumns = [
            FusionTableColumnType.SAMPLE_ID,
            FusionTableColumnType.CANCER_TYPE_DETAILED,
            FusionTableColumnType.SITE1_HUGO_SYMBOL,
            FusionTableColumnType.SITE2_HUGO_SYMBOL,
            FusionTableColumnType.VARIANT_CLASS,
            FusionTableColumnType.EVENT_INFO,
            FusionTableColumnType.CONNECTION_TYPE,
        ];

        this._columns = {};
        if (this.props.studyIdToStudy && this.props.studyIdToStudy.size > 1) {
            visibleColumns.push(FusionTableColumnType.STUDY);
        }

        FusionTableColumnLabelProps.forEach(label => {
            this._columns[label.columnType] = {
                name: label.label,
                render: this.renderColumnFn(
                    label,
                    this.props.molecularProfileIdToMolecularProfile,
                    this.props.studyIdToStudy
                ),
                download: (d: StructuralVariantExt[]) => d[0][label.attribute],
                sortBy: (d: StructuralVariantExt[]) =>
                    d.map(m => m[label.attribute]),
                filter: (
                    d: StructuralVariantExt[],
                    filterString: string,
                    filterStringUpper: string
                ) => this.defaultFilter(d, label.attribute, filterStringUpper),
                visible: visibleColumns.indexOf(label.columnType) > -1,
            };
        });
    }

    @computed
    protected get orderedColumns(): FusionTableColumnType[] {
        const columns = (this.props.columns || []) as FusionTableColumnType[];
        return _.sortBy(columns, (c: FusionTableColumnType) => {
            let order: number = -1;

            if (this._columns[c] && this._columns[c].order) {
                order = this._columns[c].order as number;
            }

            return order;
        });
    }

    @computed
    protected get columns(): Column<StructuralVariant[]>[] {
        return this.orderedColumns.reduce(
            (
                columns: Column<StructuralVariant[]>[],
                next: FusionTableColumnType
            ) => {
                let column = this._columns[next];

                if (
                    column && // actual column definition may be missing for a specific enum
                    (!column.shouldExclude || !column.shouldExclude())
                ) {
                    columns.push(column);
                }

                return columns;
            },
            []
        );
    }

    public render() {
        return (
            <FusionTableComponent
                columns={this.columns}
                dataStore={this.props.dataStore}
                downloadDataFetcher={this.props.downloadDataFetcher}
                initialItemsPerPage={50}
                initialSortColumn={this.props.initialSortColumn}
                initialSortDirection={this.props.initialSortDirection}
                itemsLabel={this.props.itemsLabel}
                itemsLabelPlural={this.props.itemsLabelPlural}
                paginationProps={this.props.paginationProps}
                showCountHeader={this.props.showCountHeader}
            />
        );
    }
}
