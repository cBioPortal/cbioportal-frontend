import * as React from 'react';
import * as styles_any from './styles.module.scss';
import {ObservableMap, expr, toJS, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {Gistic} from "../../api/CBioPortalAPIInternal";
import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {ITableHeaderControlsProps} from "../tableHeaderControls/TableHeaderControls";
import {TableProps} from "reactable";
import {IColumnFormatterData} from "../enhancedReactTable/IColumnFormatter";
import {Td} from "reactable";
import classNames from "../../lib/classNames";
import {IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import {toPrecision} from "../../lib/FormatUtils";
import {getGeneSymbols, sortByCytoband} from "../../lib/GisticUtils";

const styles = styles_any as {
	GisticGeneSelector: string,
	gisticTable: string,
	GisticGeneToggles: string,
	GeneToggle: string,
	selected: string,
	notSelected: string,
	simulateHovered: string,
	someGenes: string,
	showMoreLess: string,
	moreGenes: string,
	selectButton: string,
	header: string,
	amp: string,
	del: string,
};

const DEFAULT_NUM_GENES_SHOWN = 5;

class GisticTable extends EnhancedReactTable<Gistic>
{
}

export interface GisticGeneSelectorProps
{
	initialSelection: string[];
	data: Gistic[];
	onSelect: (map_geneSymbol_selected: ObservableMap<boolean>) => void;
}

@observer
export default class GisticGeneSelector extends React.Component<GisticGeneSelectorProps, {}>
{
	constructor(props: GisticGeneSelectorProps)
	{
		super(props);
		this.map_geneSymbol_selected.replace(props.initialSelection.map(geneSymbol => [geneSymbol, true]));
	}

	map_geneSymbol_selected = observable.map<boolean>();

	render()
	{
		let columns: IColumnDefMap = {
			'amp': {
				priority: 1,
				columnDataFunction: ({rowData: gistic}: IColumnFormatterData<Gistic>) => gistic && (gistic.amp ? 'Amp' : 'Del'),
				name: "Amp Del",
				sortable: true,
				filterable: true,
				header: (
					<div className={classNames(styles.header, styles.amp, styles.del)}>
						<span className={styles.amp}>Amp</span>
						<span className={styles.del}>Del</span>
					</div>
				),
				formatter: ({name, rowData: gistic, columnData: value}: IColumnFormatterData<Gistic>) => (
					<Td key={name} column={name} value={value}>
						{!!(gistic) && (
							<div className={gistic.amp ? styles.amp : styles.del}/>
						)}
					</Td>
				)
			},
			'chromosome': {
				priority: 2,
				dataField: 'chromosome',
				name: "Chr",
				sortable: true,
				filterable: true
			},
			'cytoband': {
				priority: 3,
				dataField: 'cytoband',
				name: "Cytoband",
				sortable: sortByCytoband,
				filterable: true,
			},
			'#': {
				priority: 4,
				columnDataFunction: ({rowData: gistic}: IColumnFormatterData<Gistic>) => getGeneSymbols(gistic).length,
				name: "#",
				sortable: true,
				filterable: true,
			},
			'genes': {
				priority: 5,
				// this columnDataFunction allows quick searching by gene symbol
				columnDataFunction: ({rowData: gistic}: IColumnFormatterData<Gistic>) => getGeneSymbols(gistic).join(' '),
				name: "Genes",
				sortable: (genes1:string, genes2:string) => {
					// sort by length, then alphabetically
					return genes1.length - genes2.length
						|| +(genes1 > genes2) - +(genes1 < genes2);
				},
				filterable: true,
				formatter: ({name, rowData: gistic, columnData: value}: IColumnFormatterData<Gistic>) => (
					<Td key={name} column={name} value={value}>
						<GisticGeneToggles
							gistic={gistic}
							map_geneSymbol_selected={this.map_geneSymbol_selected}
						/>
					</Td>
				),
			},
			'qValue': {
				priority: 6,
				dataField: 'qValue',
				name: "Q Value",
				sortable: true,
				filterable: true,
				formatter: ({name, rowData: gistic, columnData: value}: IColumnFormatterData<Gistic>) => (
					<Td key={name} column={name} value={value}>
						{toPrecision(value, 2, 0.1)}
					</Td>
				),
			},
		};

		let reactTableProps: TableProps = {
			className: "table table-striped table-border-top",
			hideFilterInput: true,
			defaultSort: 'Q Value',
		};

		let headerControlsProps: ITableHeaderControlsProps = {
			showCopyAndDownload: false,
			showHideShowColumnButton: false,
			showPagination: true,
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
					className={styles.gisticTable}
					itemsName="genes"
					reactTableProps={reactTableProps}
					initItemsPerPage={10}
					headerControlsProps={headerControlsProps}
					columns={columns}
					rawData={this.props.data}
				/>
				<button
					className={styles.selectButton}
					onClick={() => this.props.onSelect(this.map_geneSymbol_selected)}
				>
					Select
				</button>
			</div>
		);
	}
}

@observer
class GisticGeneToggles extends React.Component<{gistic?: Gistic, map_geneSymbol_selected: ObservableMap<boolean>}, {}>
{
	@observable showAll = false;

	renderGeneToggles(genes: string[])
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
class GeneToggle extends React.Component<{map_geneSymbol_selected: ObservableMap<boolean>, geneSymbol: string}, {}>
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
