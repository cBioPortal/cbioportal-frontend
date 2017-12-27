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

import * as _ from "lodash";
import * as React from "react";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { default as LazyMobXTable, Column } from "shared/components/lazyMobXTable/LazyMobXTable";
import { IFusionTableProps } from './IFusionTableProps';
import { CancerStudy, MolecularProfile, StructuralVariant } from '../../api/generated/CBioPortalAPI';
import { getStudySummaryUrl } from '../../api/urls';
import TruncatedText from '../TruncatedText';

/**
 * Fusion table column types
 */
export enum FusionTableColumnType {
    STUDY,
    SAMPLE_ID,

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
    ANNOTATION,
    CENTER,
    CONNECTION_TYPE,
    EVENT_INFO,
    VARIANT_CLASS,
    LENGTH,
    COMMENTS,
    EXTERNAL_ANNOTATION,

    DRIVER_FILTER,
    DRIVER_FILTER_ANNOTATION,
    DRIVER_TIERS_FILTER,
    DRIVER_TIERS_FILTER_ANNOTATION,
}


export const FusionTableColumnLabels = [
    { columnType: FusionTableColumnType.STUDY, label: 'Study', attribute: 'studyId', visible: false},
    { columnType: FusionTableColumnType.SAMPLE_ID, label: 'Sample Id', attribute: 'sampleId', visible: false},

    { columnType: FusionTableColumnType.SITE1_ENTREZ_GENE_ID, label: 'Site1 Entrez Gene Id', attribute: 'site1EntrezGeneId', visible: false},
    { columnType: FusionTableColumnType.SITE1_HUGO_SYMBOL, label: 'Site1 Hugo Symbol', attribute: 'site1HugoSymbol' , visible: false },
    { columnType: FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID, label: 'Site1 Ensembl Transcript Id', attribute: 'site1EnsemblTranscriptId' , visible: false },
    { columnType: FusionTableColumnType.SITE1_EXON, label: 'Site1 Exon', attribute: 'site1Exon' , visible: false },
    { columnType: FusionTableColumnType.SITE1_CHROMOSOME, label: 'Site1 Chromosome', attribute: 'site1Chromosome' , visible: false },
    { columnType: FusionTableColumnType.SITE1_POSITION, label: 'Site1 Position', attribute: 'site1Position' , visible: false },
    { columnType: FusionTableColumnType.SITE1_DESCRIPTION, label: 'Site1 Description', attribute: 'site1Description' , visible: false },

    { columnType: FusionTableColumnType.SITE2_ENTREZ_GENE_ID, label: 'Site2 Entrez Gene Idd', attribute: 'site2EntrezGeneId' , visible: false },
    { columnType: FusionTableColumnType.SITE2_HUGO_SYMBOL, label: 'Site2 Hugo Symbol', attribute: 'site2HugoSymbol' , visible: false },
    { columnType: FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID, label: 'Site2 Ensembl Transcript Id', attribute: 'site2EnsemblTranscriptId' , visible: false },
    { columnType: FusionTableColumnType.SITE2_EXON, label: 'Site2 Exon', attribute: 'site2Exon' , visible: false },
    { columnType: FusionTableColumnType.SITE2_CHROMOSOME, label: 'Site2 Chromosome', attribute: 'site2Chromosome' , visible: false },
    { columnType: FusionTableColumnType.SITE2_POSITION, label: 'Site2 Position', attribute: 'site2Position' , visible: false },
    { columnType: FusionTableColumnType.SITE2_DESCRIPTION, label: 'Site2 Description', attribute: 'site2Description' , visible: false },
    { columnType: FusionTableColumnType.SITE2_EFFECT_ON_FRAME, label: 'Site2 Effect on Frame', attribute: 'site2EffectOnFrame' , visible: false },

    { columnType: FusionTableColumnType.NCBI_BUILD, label: 'NCBI Build', attribute: 'ncbiBuild' , visible: false },
    { columnType: FusionTableColumnType.DNA_SUPPORT, label: 'DNA Support', attribute: 'dnaSupport' , visible: false },
    { columnType: FusionTableColumnType.RNA_SUPPORT, label: 'RNA Support', attribute: 'rnaSupport' , visible: false },

    { columnType: FusionTableColumnType.NORMAL_READ_COUNT, label: 'Normal Read Count', attribute: 'normalReadCount' , visible: false },
    { columnType: FusionTableColumnType.TUMOR_READ_COUNT, label: 'Tumor Read Count', attribute: 'tumorReadCount' , visible: false },
    { columnType: FusionTableColumnType.NORMAL_VARIANT_COUNT, label: 'Normal Variant Count', attribute: 'normalVariantCount' , visible: false },
    { columnType: FusionTableColumnType.TUMOR_VARIANT_COUNT, label: 'Tumor Variant Count', attribute: 'tumorVariantCount' , visible: false },
    { columnType: FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT, label: 'Normal Paired End Read Count', attribute: 'normalPairedEndReadCount' , visible: false },
    { columnType: FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT, label: 'Tumor Paired End Read Count', attribute: 'tumorPairedEndReadCount' , visible: false },
    { columnType: FusionTableColumnType.NORMAL_SPLIT_READ_COUNT, label: 'Normal Split Read Count', attribute: 'normalSplitReadCount' , visible: false },
    { columnType: FusionTableColumnType.TUMOR_SPLIT_READ_COUNT, label: 'Tumor Split Read Count', attribute: 'tumorSplitReadCount' , visible: false },

    { columnType: FusionTableColumnType.BREAKPOINT_TYPE, label: 'Breakpoint Type', attribute: 'breakpointType' , visible: false },
    { columnType: FusionTableColumnType.ANNOTATION, label: 'Annotation', attribute: 'annotation' , visible: false },
    { columnType: FusionTableColumnType.CENTER, label: 'Center', attribute: 'center' , visible: false },
    { columnType: FusionTableColumnType.CONNECTION_TYPE, label: 'Connection Type', attribute: 'connectionType' , visible: false },
    { columnType: FusionTableColumnType.EVENT_INFO, label: 'Event Info', attribute: 'eventInfo' , visible: false },
    { columnType: FusionTableColumnType.VARIANT_CLASS, label: 'Variant Class', attribute: 'variantClass' , visible: false },
    { columnType: FusionTableColumnType.LENGTH, label: 'Length', attribute: 'length' , visible: false },
    { columnType: FusionTableColumnType.COMMENTS, label: 'Comments', attribute: 'comments' , visible: false },
    { columnType: FusionTableColumnType.EXTERNAL_ANNOTATION, label: 'External Annotation', attribute: 'externalAnnotation' , visible: false },

    { columnType: FusionTableColumnType.DRIVER_FILTER, label: 'Driver Filter', attribute: 'driverFilter' , visible: false },
    { columnType: FusionTableColumnType.DRIVER_FILTER_ANNOTATION, label: 'Driver Filter Annotation', attribute: 'driverFilterAnn' , visible: false },
    { columnType: FusionTableColumnType.DRIVER_TIERS_FILTER, label: 'Driver Tiers Filter', attribute: 'driverTiersFilter' , visible: false },
    { columnType: FusionTableColumnType.DRIVER_TIERS_FILTER_ANNOTATION, label: 'Driver Tiers Filter Annotation', attribute: 'driverTiersFilterAnn' , visible: false },
];

type FusionTableColumn = Column<StructuralVariant[]> & {
    order?: number,
    shouldExclude?: () => boolean
};

export class FusionTableComponent extends LazyMobXTable<StructuralVariant[]> {
}

@observer
export default class FusionTable<P extends IFusionTableProps> extends React.Component<P, {}> {
    @observable protected _columns: { [columnEnum: number]: FusionTableColumn };

    public static defaultProps = {
        initialItemsPerPage: 25,
        showCountHeader: true,
        paginationProps: {itemsPerPageOptions: [25, 50, 100]},
        initialSortColumn: "Sample Id",
        initialSortDirection: "desc",
        itemsLabel: "Fusion",
        itemsLabelPlural: "Fusions"
    };

    constructor(props: P) {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    private defaultFilter(data: StructuralVariant[], dataField: string, filterStringUpper: string): boolean {
        if (data.length) {
            return data.reduce((match: boolean, next: StructuralVariant) => {
                let val:string = (next as any)[dataField];
                if (val && typeof val === 'string') {
                    return match || ((val.toUpperCase().indexOf(filterStringUpper) > -1));
                } else {
                    return match;
                }
            }, false);
        } else {
            return false;
        }
    }

    /**
     * Render table columns
     * @param label
     * @returns {(d: StructuralVariant[]) => any}
     */
    private renderColumnFn(label: any,
                           molecularProfileIdToMolecularProfile?: { [molecularProfileId: string]: MolecularProfile },
                           studyIdToStudy?: { [studyId: string]: CancerStudy }) {
        let _renderColumnFn = (d: StructuralVariant[]) => {
            return <span>{d[0][label.attribute]}</span>;
        };

        if (label.columnType === FusionTableColumnType.SAMPLE_ID && this.props.fusionMolecularProfile) {
            _renderColumnFn = (d: StructuralVariant[]) => {

                if (!molecularProfileIdToMolecularProfile || !studyIdToStudy)
                    return <span/>;

                const molecularProfileId = d[0].studyId + '_structural_variants';
                const geneticProfile = molecularProfileIdToMolecularProfile[molecularProfileId];


                const study = studyIdToStudy[geneticProfile.studyId];
                let linkToPatientView: string = `#/patient?sampleId=${d[0][label.attribute]}&studyId=${study.studyId}`;

                /**
                 * HACK to deal with having mutation mapper on index.do
                 * Change it to case.do
                 * https://github.com/cBioPortal/cbioportal/issues/2783
                 */
                const indexLocation: number = window.location.href.search('index.do');

                if (indexLocation > -1) {
                    linkToPatientView = window.location.href.substring(0, indexLocation) + 'case.do' + linkToPatientView;
                }
                // END HACK

                return <a href={linkToPatientView} target='_blank'>{d[0][label.attribute]}</a>
            }
        }

        if (label.columnType === FusionTableColumnType.STUDY && this.props.studyIdToStudy) {
            _renderColumnFn = (d: StructuralVariant[]) => {
                if (!molecularProfileIdToMolecularProfile || !studyIdToStudy)
                    return <span/>;

                const molecularProfileId = d[0].studyId + '_structural_variants';
                const geneticProfile = molecularProfileIdToMolecularProfile[molecularProfileId];

                if (!geneticProfile)
                    return <span/>;

                const study = studyIdToStudy[geneticProfile.studyId];
                return (
                    <a href={getStudySummaryUrl(study.studyId)} target="_blank">
                        <TruncatedText
                            text={study.name}
                            tooltip={<div style={{maxWidth: 300}} dangerouslySetInnerHTML={{
                                __html: `${study.name}: ${study.description}`
                            }}/>}
                            maxLength={16}
                        />
                    </a>
                );
            }
        }

        return _renderColumnFn;
    }

    protected generateColumns() {

        let visibleColumns = [
            FusionTableColumnType.SAMPLE_ID,
            FusionTableColumnType.ANNOTATION,
            FusionTableColumnType.SITE1_HUGO_SYMBOL,
            FusionTableColumnType.SITE2_HUGO_SYMBOL,
            FusionTableColumnType.SITE1_EXON,
            FusionTableColumnType.SITE2_EXON,
            FusionTableColumnType.RNA_SUPPORT,
            FusionTableColumnType.TUMOR_VARIANT_COUNT,
        ];

        this._columns = {};

        if (this.props.studyIdToStudy) {
            let studyObject = Object.assign({}, this.props.studyIdToStudy);
            if (Object.keys(studyObject).length > 1) { // when there are more than one study, show study column.
                visibleColumns.push(FusionTableColumnType.STUDY);
            }
        }

        FusionTableColumnLabels.forEach(label => {
            this._columns[label.columnType] = {
                name: label.label,
                render: this.renderColumnFn(
                    label,
                    this.props.molecularProfileIdToMolecularProfile,
                    this.props.studyIdToStudy
                ),
                download: (d => d[0][label.attribute]),
                sortBy: (d: StructuralVariant[]) => d.map(m => m[label.attribute]),
                filter: (d: StructuralVariant[], filterString: string, filterStringUpper: string) =>
                    this.defaultFilter(d, label.attribute, filterStringUpper),
                visible: visibleColumns.indexOf(label.columnType) > -1
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
        return this.orderedColumns.reduce((columns: Column<StructuralVariant[]>[], next: FusionTableColumnType) => {
            let column = this._columns[next];

            if (column && // actual column definition may be missing for a specific enum
                (!column.shouldExclude || !column.shouldExclude())) {
                columns.push(column);
            }

            return columns;
        }, []);
    }

    public render() {
        return (
            <FusionTableComponent
                columns={this.columns}
                dataStore={this.props.dataStore}
                downloadDataFetcher={this.props.downloadDataFetcher}
                initialItemsPerPage={this.props.initialItemsPerPage}
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
