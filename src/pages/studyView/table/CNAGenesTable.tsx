import * as React from "react";
import * as _ from "lodash";
import {CopyNumberAlterationIdentifier, CopyNumberCountByGeneWithCancerGene} from "pages/studyView/StudyViewPageStore";
import { action, computed, IReactionDisposer, observable, reaction } from "mobx";
import { observer } from "mobx-react";
import styles from "./tables.module.scss";
import {
    CopyNumberGeneFilterElement,
    GenePanelToGene
} from "shared/api/generated/CBioPortalAPIInternal";
import MobxPromise from "mobxpromise";
import { If } from "react-if";
import classnames from "classnames";
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import FixedHeaderTable from "./FixedHeaderTable";
import autobind from "autobind-decorator";
import {
    correctColumnWidth,
    correctMargin,
    getCNAByAlteration,
    getCNAColorByAlteration,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel,
    getFrequencyStr,
    getQValue
} from "../StudyViewUtils";
import { SortDirection } from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import { DEFAULT_SORTING_COLUMN } from "../StudyViewConfig";
import { GenePanelModal, GenePanelList } from "./GenePanelModal";
import {getFreqColumnRender, getGeneColumnHeaderRender} from "pages/studyView/TableUtils";
import {GeneCell} from "pages/studyView/table/GeneCell";
import {IMutatedGenesTablePros} from "pages/studyView/table/MutatedGenesTable";

export type CNAGenesTableUserSelectionWithIndex = CopyNumberAlterationIdentifier & {
    rowIndex: number;
};

export interface ICNAGenesTablePros {
    promise: MobxPromise<CopyNumberCountByGeneWithCancerGene[]>;
    width: number;
    height: number;
    filters: CopyNumberGeneFilterElement[];
    onUserSelection: (selection: CopyNumberAlterationIdentifier[]) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[];
    cancerGeneFilterEnabled?: boolean;
}

class CNAGenesTableComponent extends FixedHeaderTable<CopyNumberCountByGeneWithCancerGene> {}

enum ColumnKey {
    GENE = "Gene",
    CYTOBAND = "Cytoband",
    CNA = "CNA",
    NUMBER = "#",
    FREQ = "Freq"
}

@observer
export class CNAGenesTable extends React.Component<ICNAGenesTablePros, {}> {
    @observable private preSelectedRows: CNAGenesTableUserSelectionWithIndex[] = [];
    @observable private sortBy: string = ColumnKey.FREQ;
    @observable private sortDirection: SortDirection;
    @observable private cancerGeneFilterIconEnabled = true;

    @observable private modalSettings: {
        modalOpen: boolean;
        modalPanelName: string;
        modalPanelGenes: GenePanelToGene[];
    } = {
        modalOpen: false,
        modalPanelName: "",
        modalPanelGenes: []
    };

    public static defaultProps = {
        cancerGeneFilterEnabled: false
    };

    @autobind
    @action
    toggleModal(panelName: string, genes: GenePanelToGene[]) {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
        if (!this.modalSettings.modalOpen) {
            return;
        }
        this.modalSettings.modalPanelName = panelName;
        this.modalSettings.modalPanelGenes = genes;
    }

    @autobind
    @action
    closeModal() {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
    }

    @computed
    get columnsWidth() {
        return {
            [ColumnKey.GENE]: correctColumnWidth(this.props.width * 0.25),
            [ColumnKey.CYTOBAND]: correctColumnWidth(this.props.width * 0.25),
            [ColumnKey.CNA]: correctColumnWidth(this.props.width * 0.14),
            [ColumnKey.NUMBER]: correctColumnWidth(this.props.width * 0.18),
            [ColumnKey.FREQ]: correctColumnWidth(this.props.width * 0.18)
        };
    }

    @autobind
    toggleCancerGeneFilter(event:any) {
        event.stopPropagation();
        this.cancerGeneFilterIconEnabled=!this.cancerGeneFilterIconEnabled;
    }

    @computed get isFilteredByCancerGeneList() {
        return this.props.cancerGeneFilterEnabled! && this.cancerGeneFilterIconEnabled;
    }

    @computed get tableData() {
        return this.isFilteredByCancerGeneList ? _.filter(this.props.promise.result, data => data.isCancerGene) : (this.props.promise.result || []);
    }

    @computed
    get cellMargin() {
        const maxNumberColumn = _.max(this.tableData!.map(item => item.numberOfAlteredCases));
        const localeString = maxNumberColumn === undefined ? '' : maxNumberColumn.toLocaleString();
        return {
            [ColumnKey.GENE]: 0,
            [ColumnKey.CYTOBAND]: 0,
            [ColumnKey.CNA]: 0,
            [ColumnKey.NUMBER]: correctMargin(
                (this.columnsWidth[ColumnKey.NUMBER] - 10 - (
                    getFixedHeaderTableMaxLengthStringPixel(localeString) + 20
                )) / 2),
            [ColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    this.columnsWidth[ColumnKey.FREQ],
                    getFrequencyStr(
                        _.max(this.tableData!.map(item => (item.numberOfAlteredCases / item.numberOfSamplesProfiled) * 100))!
                    )
                )
            )
        }
    }

    @computed
    get tableColumns() {
        return [
            {
                name: ColumnKey.GENE,
                headerRender: () => {
                    return getGeneColumnHeaderRender(this.cellMargin[ColumnKey.GENE], ColumnKey.GENE, this.props.cancerGeneFilterEnabled!, this.isFilteredByCancerGeneList, this.toggleCancerGeneFilter);
                },
                render: (data: CopyNumberCountByGeneWithCancerGene) => {
                    return <GeneCell
                        tableType={'cna'}
                        selectedGenes={this.props.selectedGenes}
                        hugoGeneSymbol={data.hugoGeneSymbol}
                        qValue={data.qValue}
                        isCancerGene={data.isCancerGene}
                        oncokbAnnotated={data.oncokbAnnotated}
                        isOncogene={data.oncokbOncogene}
                        isTumorSuppressorGene={data.oncokbTumorSuppressorGene}
                        onGeneSelect={this.props.onGeneSelect}
                    />
                },
                sortBy: (data: CopyNumberCountByGeneWithCancerGene) => data.hugoGeneSymbol,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: CopyNumberCountByGeneWithCancerGene,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.hugoGeneSymbol.toUpperCase().includes(filterStringUpper);
                },
                width: this.columnsWidth[ColumnKey.GENE]
            },
            {
                name: ColumnKey.CYTOBAND,
                tooltip: <span>Cytoband</span>,
                render: (data: CopyNumberCountByGeneWithCancerGene) => <span>{data.cytoband}</span>,
                sortBy: (data: CopyNumberCountByGeneWithCancerGene) => data.cytoband,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: CopyNumberCountByGeneWithCancerGene,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return _.isUndefined(data.cytoband)
                        ? false
                        : data.cytoband.toUpperCase().includes(filterStringUpper);
                },
                width: this.columnsWidth[ColumnKey.CYTOBAND]
            },
            {
                name: ColumnKey.CNA,
                tooltip: (
                    <span>
                        Copy number alteration, only amplifications and deep deletions are shown
                    </span>
                ),
                render: (data: CopyNumberCountByGeneWithCancerGene) => (
                    <span
                        style={{
                            color: getCNAColorByAlteration(data.alteration),
                            fontWeight: "bold"
                        }}
                    >
                        {getCNAByAlteration(data.alteration)}
                    </span>
                ),
                sortBy: (data: CopyNumberCountByGeneWithCancerGene) => data.alteration,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: CopyNumberCountByGeneWithCancerGene,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return getCNAByAlteration(data.alteration).includes(filterStringUpper);
                },
                width: this.columnsWidth[ColumnKey.CNA]
            },
            {
                name: ColumnKey.NUMBER,
                tooltip: <span>Number of samples with the listed copy number alteration</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: this.cellMargin[ColumnKey.NUMBER] }}>#</div>;
                },
                render: (data: CopyNumberCountByGeneWithCancerGene) => (
                    <LabeledCheckbox
                        checked={this.isChecked(data.entrezGeneId, data.alteration)}
                        disabled={this.isDisabled(data.entrezGeneId, data.alteration)}
                        onChange={event =>
                            this.togglePreSelectRow(data.entrezGeneId, data.alteration)
                        }
                        labelProps={{
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                marginLeft: this.cellMargin[ColumnKey.NUMBER],
                                marginRight: this.cellMargin[ColumnKey.NUMBER]
                            }
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox
                        }}
                    >
                        {data.numberOfAlteredCases.toLocaleString()}
                    </LabeledCheckbox>
                ),
                sortBy: (data: CopyNumberCountByGeneWithCancerGene) => data.numberOfAlteredCases,
                defaultSortDirection: "desc" as "desc",
                filter: (data: CopyNumberCountByGeneWithCancerGene, filterString: string) => {
                    return _.toString(data.numberOfAlteredCases).includes(filterString);
                },
                width: this.columnsWidth[ColumnKey.NUMBER]
            },
            {
                name: ColumnKey.FREQ,
                tooltip: <span>Percentage of samples with the listed copy number alteration</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: this.cellMargin[ColumnKey.FREQ] }}>Freq</div>;
                },
                render: (data: CopyNumberCountByGeneWithCancerGene) => {
                    return getFreqColumnRender('cna', data.numberOfSamplesProfiled, data.numberOfAlteredCases, data.matchingGenePanels, this.toggleModal)
                },
                sortBy: (data: CopyNumberCountByGeneWithCancerGene) =>
                    (data.numberOfAlteredCases / data.numberOfSamplesProfiled) * 100,
                defaultSortDirection: "desc" as "desc",
                filter: (data: CopyNumberCountByGeneWithCancerGene, filterString: string) => {
                    return _.toString(
                        getFrequencyStr(
                            (data.numberOfAlteredCases / data.numberOfSamplesProfiled) * 100
                        )
                    ).includes(filterString);
                },
                width: this.columnsWidth[ColumnKey.FREQ]
            }
        ];
    }

    @autobind
    isChecked(entrezGeneId: number, alteration: number) {
        const record = _.find(
            this.preSelectedRows,
            (row: CNAGenesTableUserSelectionWithIndex) =>
                row.entrezGeneId === entrezGeneId && row.alteration === alteration
        );
        if (_.isUndefined(record)) {
            return (
                this.selectedRows.length > 0 &&
                !_.isUndefined(
                    _.find(
                        this.selectedRows,
                        (row: CNAGenesTableUserSelectionWithIndex) =>
                            row.entrezGeneId === entrezGeneId && row.alteration === alteration
                    )
                )
            );
        } else {
            return true;
        }
    }

    @autobind
    isDisabled(entrezGeneId: number, alteration: number) {
        return !_.isUndefined(
            _.find(
                this.selectedRows,
                (row: CNAGenesTableUserSelectionWithIndex) =>
                    row.entrezGeneId === entrezGeneId && row.alteration === alteration
            )
        );
    }

    @autobind
    @action
    togglePreSelectRow(entrezGeneId: number, alteration: number) {
        const record: CNAGenesTableUserSelectionWithIndex | undefined = _.find(
            this.preSelectedRows,
            (row: CNAGenesTableUserSelectionWithIndex) =>
                row.entrezGeneId === entrezGeneId && row.alteration === alteration
        );
        if (_.isUndefined(record)) {
            let dataIndex = -1;
            // definitely there is a match
            const datum: CopyNumberCountByGeneWithCancerGene | undefined = _.find(
                this.tableData,
                (row: CopyNumberCountByGeneWithCancerGene, index: number) => {
                    const exist =
                        row.entrezGeneId === entrezGeneId && row.alteration === alteration;
                    if (exist) {
                        dataIndex = index;
                    }
                    return exist;
                }
            );

            if (!_.isUndefined(datum)) {
                this.preSelectedRows.push({
                    rowIndex: dataIndex,
                    entrezGeneId: datum.entrezGeneId,
                    alteration: datum.alteration,
                    hugoGeneSymbol: datum.hugoGeneSymbol
                });
            }
        } else {
            this.preSelectedRows = _.xorBy(this.preSelectedRows, [record], "rowIndex");
        }
    }

    @autobind
    @action
    afterSelectingRows() {
        this.props.onUserSelection(
            this.preSelectedRows.map(row => {
                return {
                    entrezGeneId: row.entrezGeneId,
                    alteration: row.alteration,
                    hugoGeneSymbol: row.hugoGeneSymbol
                };
            })
        );
        this.preSelectedRows = [];
    }

    @computed
    get selectedRows() {
        if (this.props.filters.length === 0) {
            return [];
        } else {
            return _.reduce(
                this.tableData,
                (
                    acc: CNAGenesTableUserSelectionWithIndex[],
                    row: CopyNumberCountByGeneWithCancerGene,
                    index: number
                ) => {
                    if (
                        _.some(this.props.filters, {
                            entrezGeneId: row.entrezGeneId,
                            alteration: row.alteration
                        })
                    ) {
                        acc.push({
                            rowIndex: index,
                            entrezGeneId: row.entrezGeneId,
                            alteration: row.alteration,
                            hugoGeneSymbol: row.hugoGeneSymbol
                        });
                    }
                    return acc;
                },
                []
            );
        }
    }

    @autobind
    isSelectedRow(data: CopyNumberCountByGeneWithCancerGene) {
        return !_.isUndefined(
            _.find(_.union(this.selectedRows, this.preSelectedRows), function(row) {
                return row.entrezGeneId === data.entrezGeneId && row.alteration === data.alteration;
            })
        );
    }

    @autobind
    @action
    afterSorting(sortBy: string, sortDirection: SortDirection) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public render() {
        return (
            <div data-test='cna-genes-table'>
                {this.props.promise.isComplete && (
                    <CNAGenesTableComponent
                        width={this.props.width}
                        height={this.props.height}
                        data={this.tableData}
                        columns={this.tableColumns}
                        showSelectSamples={true && this.preSelectedRows.length > 0}
                        afterSelectingRows={this.afterSelectingRows}
                        isSelectedRow={this.isSelectedRow}
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                    />
                )}
                <GenePanelModal
                    show={this.modalSettings.modalOpen}
                    genes={this.modalSettings.modalPanelGenes}
                    panelName={this.modalSettings.modalPanelName}
                    hide={this.closeModal}
                />
            </div>
        );
    }
}
