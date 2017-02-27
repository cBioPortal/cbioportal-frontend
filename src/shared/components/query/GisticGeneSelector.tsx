import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import queryStore from "./QueryStore";
import {ObservableMap, expr, toJS, computed, observable} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/index";
import {Gistic} from "../../api/CBioPortalAPIInternal";
import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {ITableHeaderControlsProps} from "../tableHeaderControls/TableHeaderControls";
import {TableProps} from "reactable";
import {IColumnFormatterData} from "../enhancedReactTable/IColumnFormatter";
import {Td} from "reactable";
import classNames from "../../lib/classNames";
import {IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";

const styles = styles_any as {
	GisticGeneSelector: string,
	GisticGeneToggles: string,
	GeneToggle: string,
	selected: string,
	notSelected: string,
	simulateHovered: string,
	someGenes: string,
	showMoreLess: string,
	moreGenes: string,
	selectButton: string,
};

const DEFAULT_NUM_GENES_SHOWN = 5;

class GisticTable extends EnhancedReactTable<Gistic> {}

export interface GisticGeneSelectorProps
{
	initialSelection: string[];
	data: Gistic[];
	onSelect: (map_geneSymbol_selected:ObservableMap<boolean>) => void;
}

function getGeneSymbols(gistic?:Gistic)
{
	if (gistic)
		return gistic.genes.map(gene => gene.hugoGeneSymbol);
	return [];
}

@observer
export default class GisticGeneSelector extends React.Component<GisticGeneSelectorProps, {}>
{
	constructor(props:GisticGeneSelectorProps)
	{
		super(props);
		this.map_geneSymbol_selected.replace(props.initialSelection.map(geneSymbol => [geneSymbol, true]));
	}

	map_geneSymbol_selected = observable.map<boolean>();

	render()
	{
		let columns:IColumnDefMap = {
			'amp': {
				dataField: 'amp',
				name: "Amp Del",
				priority: 1,
				sortable: true,
				filterable: true
			},
			'chromosome': {
				dataField: 'chromosome',
				name: "Chr",
				priority: 2,
				sortable: true,
				filterable: true
			},
			'cytoband': {
				dataField: 'cytoband',
				name: "Cytoband",
				priority: 3,
				sortable: true,
				filterable: true
			},
			'#': {
				name: "#",
				priority: 4,
				downloader: (data:IColumnFormatterData<Gistic>) => data.rowData ? data.rowData.genes.length + '' : '0',
				sortable: true,
				filterable: true
			},
			'genes': {
				name: "Genes",
				priority: 5,
				downloader: (data:IColumnFormatterData<Gistic>) => getGeneSymbols(data.rowData).join(' '),
				formatter: (data:IColumnFormatterData<Gistic>) => (
					<Td key={data.name} column={data.name}>
						<GisticGeneToggles
							gistic={data.rowData}
							map_geneSymbol_selected={this.map_geneSymbol_selected}
						/>
					</Td>
				),
				sortable: true,
				filterable: true
			},
			'qValue': {
				dataField: 'qValue',
				name: "Q Value",
				priority: 6,
				sortable: true,
				filterable: true
			},
		};

		let reactTableProps:TableProps = {
			className: "table table-striped table-border-top",
			hideFilterInput:true
		};

		let headerControlsProps:ITableHeaderControlsProps = {
		    // tableData?: Array<any>;
		    // className?: string;
		    // searchClassName?: string;
		    // showSearch?: boolean;
			showCopyAndDownload: false,
		    // copyDownloadClassName?: string;
		    showHideShowColumnButton: false,
		    showPagination: true
		    // handleInput?: Function;
		    // downloadDataGenerator?: Function;
		    // downloadDataContainsHeader?: boolean;
		    // downloadFilename?: string;
		    // paginationProps?: ITablePaginationControlsProps;
		    // columnVisibilityProps?: IColumnVisibilityControlsProps;
		    // searchDelayMs?:number;
		};

		return (
			<div className={styles.GisticGeneSelector}>
				<span>
					{'Click on a gene to '}
					<span className={classNames(styles.GeneToggle, styles.selected, styles.simulateHovered)}>
						{'select'}
					</span>
					{' it.'}
				</span>
				<GisticTable
					itemsName="genes"
					reactTableProps={reactTableProps}
					initItemsPerPage={10}
					headerControlsProps={headerControlsProps}
					columns={columns}
					rawData={this.props.data}
				/>
				<button className={styles.selectButton} onClick={() => this.props.onSelect(this.map_geneSymbol_selected)}>
					Select
				</button>
			</div>
		);
	}
}

@observer
class GisticGeneToggles extends React.Component<{gistic?:Gistic, map_geneSymbol_selected:ObservableMap<boolean>}, {}>
{
	@observable showAll = false;

	renderGeneToggles(genes:string[])
	{
		return genes.map(gene => (
			<GeneToggle
				key={gene}
				map_geneSymbol_selected={this.props.map_geneSymbol_selected}
				geneSymbol={gene}
			/>
		));
	}

	render()
	{
		let allGenes = getGeneSymbols(this.props.gistic);
		let someGenes = allGenes.slice(0, DEFAULT_NUM_GENES_SHOWN);
		let moreGenes = allGenes.slice(DEFAULT_NUM_GENES_SHOWN);
		return (
			<div className={styles.GisticGeneToggles}>
				<div className={styles.someGenes}>
					{this.renderGeneToggles(someGenes)}
					{!!(moreGenes.length) && (
						<a className={styles.showMoreLess} onClick={() => this.showAll = !this.showAll}>
							{this.showAll ? 'less' : `+${moreGenes.length} more`}
						</a>
					)}
				</div>
				<div className={styles.moreGenes}>
					{this.showAll && this.renderGeneToggles(moreGenes)}
				</div>
			</div>
		);
	}
}

@observer
class GeneToggle extends React.Component<{map_geneSymbol_selected:ObservableMap<boolean>, geneSymbol:string}, {}>
{
	render()
	{
		let selected = !!this.props.map_geneSymbol_selected.get(this.props.geneSymbol);
		return (
			<span
				className={classNames(styles.GeneToggle, selected ? styles.selected : styles.notSelected)}
				onClick={event => this.props.map_geneSymbol_selected.set(this.props.geneSymbol, !selected)}
			>
				{this.props.geneSymbol}
			</span>
		);
	}
}
