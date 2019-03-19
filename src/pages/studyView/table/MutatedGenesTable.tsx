import * as React from "react";
import {GeneIdentifier, MutatedGenesData, MutationCountByGeneWithCancerGene} from "pages/studyView/StudyViewPageStore";
import { observer } from "mobx-react";
import styles from "./tables.module.scss";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";
import MobxPromise from "mobxpromise";
import { If } from "react-if";
import * as _ from "lodash";
import classnames from "classnames";
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import FixedHeaderTable from "./FixedHeaderTable";
import { action, computed, IReactionDisposer, observable, reaction } from "mobx";
import autobind from "autobind-decorator";
import {
    correctMargin,
    correctColumnWidth,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel,
    getFrequencyStr,
    getQValue
} from "../StudyViewUtils";
import {Column, SortDirection} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import { DEFAULT_SORTING_COLUMN } from "../StudyViewConfig";
import { GenePanelToGene } from "shared/api/generated/CBioPortalAPI";
import { GenePanelModal, GenePanelList } from "./GenePanelModal";
import {getFreqColumnRender, getGeneColumnHeaderRender} from "pages/studyView/TableUtils";
import {GeneCell} from "pages/studyView/table/GeneCell";

export interface IMutatedGenesTablePros {
    promise: MobxPromise<MutationCountByGeneWithCancerGene[]>;
    width: number;
    height: number;
    filters: number[];
    onUserSelection: (value: GeneIdentifier[]) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[];
    cancerGeneFilterEnabled?: boolean;
}

type MutatedGenesTableUserSelectionWithIndex = {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    rowIndex: number;
};

enum ColumnKey {
    GENE = "Gene",
    NUMBER_MUTATIONS = "# Mut",
    NUMBER = "#",
    FREQ = "Freq"
}

class MutatedGenesTableComponent extends FixedHeaderTable<MutationCountByGeneWithCancerGene> {}

@observer
export class MutatedGenesTable extends React.Component<IMutatedGenesTablePros, {}> {
    @observable private preSelectedRows: MutatedGenesTableUserSelectionWithIndex[] = [];
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
            [ColumnKey.GENE]: correctColumnWidth(this.props.width * 0.35),
            [ColumnKey.NUMBER_MUTATIONS]: correctColumnWidth(this.props.width * 0.25),
            [ColumnKey.NUMBER]: correctColumnWidth(this.props.width * 0.25),
            [ColumnKey.FREQ]: correctColumnWidth(this.props.width * 0.15)
        };
    }

    @computed
    get cellMargin() {
        const maxNumberMutationsColumn = _.max(this.tableData.map(item => item.totalCount));
        const maxNumberColumn = _.max(this.tableData!.map(item => item.numberOfAlteredCases));
        const localeNumberMutationsString = maxNumberMutationsColumn === undefined ? '' : maxNumberMutationsColumn.toLocaleString();
        const localeNumberString = maxNumberColumn === undefined ? '' : maxNumberColumn.toLocaleString();
        return {
            [ColumnKey.GENE]: 0,
            [ColumnKey.NUMBER_MUTATIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    this.columnsWidth[ColumnKey.NUMBER_MUTATIONS],
                    localeNumberMutationsString
                )
            ),
            [ColumnKey.NUMBER]: correctMargin(
                (this.columnsWidth[ColumnKey.NUMBER] - 10 - (
                        getFixedHeaderTableMaxLengthStringPixel(localeNumberString) + 20)
                ) / 2),
            [ColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    this.columnsWidth[ColumnKey.FREQ],
                    getFrequencyStr(_.max(this.tableData.map(item => (item.numberOfAlteredCases / item.numberOfSamplesProfiled) * 100))!)
                )
            )
        }
    }

    @autobind
    toggleCancerGeneFilter(event: any) {
        event.stopPropagation();
        this.cancerGeneFilterIconEnabled = !this.cancerGeneFilterIconEnabled;
    }

    @computed get isFilteredByCancerGeneList() {
        return this.props.cancerGeneFilterEnabled! && this.cancerGeneFilterIconEnabled;
    }

    @computed get tableData() {
        return this.isFilteredByCancerGeneList ? _.filter(this.props.promise.result, data => data.isCancerGene) : (this.props.promise.result || []);
    }

    @computed
    get tableColumns():Column<MutationCountByGeneWithCancerGene>[] {
        return [
            {
                name: ColumnKey.GENE,
                headerRender: () => {
                    return getGeneColumnHeaderRender(this.cellMargin[ColumnKey.GENE], ColumnKey.GENE, this.props.cancerGeneFilterEnabled!, this.isFilteredByCancerGeneList, this.toggleCancerGeneFilter);
                },
                render: (data: MutationCountByGeneWithCancerGene) => {
                    return <GeneCell
                        tableType={'mutation'}
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
                sortBy: (data: MutationCountByGeneWithCancerGene) => data.hugoGeneSymbol,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: MutationCountByGeneWithCancerGene,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.hugoGeneSymbol.toUpperCase().includes(filterStringUpper);
                },
                width: this.columnsWidth[ColumnKey.GENE]
            },
            {
                name: ColumnKey.NUMBER_MUTATIONS,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return (
                        <div style={{ marginLeft: this.cellMargin[ColumnKey.NUMBER_MUTATIONS] }}>
                            # Mut
                        </div>
                    );
                },
                render: (data: MutationCountByGeneWithCancerGene) => (
                    <span
                        style={{
                            flexDirection: "row-reverse",
                            display: "flex",
                            marginRight: this.cellMargin[ColumnKey.NUMBER_MUTATIONS]
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: MutationCountByGeneWithCancerGene) => data.totalCount,
                defaultSortDirection: "desc" as "desc",
                filter: (data: MutationCountByGeneWithCancerGene, filterString: string) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: this.columnsWidth[ColumnKey.NUMBER_MUTATIONS]
            },
            {
                name: ColumnKey.NUMBER,
                tooltip: <span>Number of samples with one or more mutations</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: this.cellMargin[ColumnKey.NUMBER] }}>#</div>;
                },
                render: (data: MutationCountByGeneWithCancerGene) => (
                    <LabeledCheckbox
                        checked={this.isChecked(data.entrezGeneId)}
                        disabled={this.isDisabled(data.entrezGeneId)}
                        onChange={event => this.togglePreSelectRow(data.entrezGeneId)}
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
                        <span>{data.numberOfAlteredCases.toLocaleString()}</span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: MutationCountByGeneWithCancerGene) => data.numberOfAlteredCases,
                defaultSortDirection: "desc" as "desc",
                filter: (data: MutationCountByGeneWithCancerGene, filterString: string) => {
                    return _.toString(data.numberOfAlteredCases).includes(filterString);
                },
                width: this.columnsWidth[ColumnKey.NUMBER]
            },
            {
                name: ColumnKey.FREQ,
                tooltip: <span>Percentage of samples with one or more mutations</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: this.cellMargin[ColumnKey.FREQ] }}>Freq</div>;
                },
                render: (data: MutationCountByGeneWithCancerGene) => {
                    return getFreqColumnRender('mutation', data.numberOfSamplesProfiled, data.numberOfAlteredCases, data.matchingGenePanels, this.toggleModal);
                },
                sortBy: (data: MutationCountByGeneWithCancerGene) =>
                    (data.numberOfAlteredCases / data.numberOfSamplesProfiled) * 100,
                defaultSortDirection: "desc" as "desc",
                filter: (data: MutationCountByGeneWithCancerGene, filterString: string) => {
                    return _.toString(
                        getFrequencyStr(data.numberOfAlteredCases / data.numberOfSamplesProfiled)
                    ).includes(filterString);
                },
                width: this.columnsWidth[ColumnKey.FREQ]
            }
        ];
    }

    @autobind
    isChecked(entrezGeneId: number) {
        const record = _.find(
            this.preSelectedRows,
            (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId
        );
        if (_.isUndefined(record)) {
            return (
                this.selectedRows.length > 0 &&
                !_.isUndefined(
                    _.find(
                        this.selectedRows,
                        (row: MutatedGenesTableUserSelectionWithIndex) =>
                            row.entrezGeneId === entrezGeneId
                    )
                )
            );
        } else {
            return true;
        }
    }

    @autobind
    isDisabled(entrezGeneId: number) {
        return !_.isUndefined(
            _.find(
                this.selectedRows,
                (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId
            )
        );
    }

    @autobind
    togglePreSelectRow(entrezGeneId: number) {
        const record: MutatedGenesTableUserSelectionWithIndex | undefined = _.find(
            this.preSelectedRows,
            (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId
        );
        if (_.isUndefined(record)) {
            let dataIndex = -1;
            // definitely there is a match
            const datum: MutationCountByGeneWithCancerGene | undefined = _.find(
                this.tableData,
                (row: MutationCountByGeneWithCancerGene, index: number) => {
                    const exist = row.entrezGeneId === entrezGeneId;
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
                    acc: MutatedGenesTableUserSelectionWithIndex[],
                    row: MutationCountByGeneWithCancerGene,
                    index: number
                ) => {
                    if (_.includes(this.props.filters, row.entrezGeneId)) {
                        acc.push({
                            rowIndex: index,
                            entrezGeneId: row.entrezGeneId,
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
    isSelectedRow(data: MutationCountByGeneWithCancerGene) {
        return !_.isUndefined(
            _.find(_.union(this.selectedRows, this.preSelectedRows), function(row) {
                return row.entrezGeneId === data.entrezGeneId;
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
            <>
                {this.props.promise.isComplete && (
                    <MutatedGenesTableComponent
                        width={this.props.width}
                        height={this.props.height}
                        data={this.tableData}
                        columns={this.tableColumns}
                        showSelectSamples={true && this.preSelectedRows.length > 0}
                        isSelectedRow={this.isSelectedRow}
                        afterSelectingRows={this.afterSelectingRows}
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
            </>
        );
    }
}
