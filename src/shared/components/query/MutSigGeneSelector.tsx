import * as _ from 'lodash';
import * as React from 'react';
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import * as styles_any from './styles.module.scss';
import {action, ObservableMap, expr, toJS, computed, observable} from "mobx";
import {observer} from "mobx-react";
import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {MutSig} from "../../api/generated/CBioPortalAPIInternal";
import {IColumnFormatterData} from "../enhancedReactTable/IColumnFormatter";
import {IColumnDefMap, IEnhancedReactTableProps} from "../enhancedReactTable/IEnhancedReactTableProps";
import {ITableHeaderControlsProps} from "../tableHeaderControls/TableHeaderControls";
import {Table, Td, TableProps} from 'reactable';
import {toPrecision} from "../../lib/FormatUtils";

const styles = styles_any as {
	MutSigGeneSelector: string,
	selectButton: string,
	selectionColumnHeader: string,
	selectionColumnCell: string,
};

class MutSigTable extends EnhancedReactTable<MutSig> {}

export interface MutSigGeneSelectorProps
{
	initialSelection: string[];
	data: MutSig[];
	onSelect: (map_geneSymbol_selected:ObservableMap<boolean>) => void;
}

@observer
export default class MutSigGeneSelector extends React.Component<MutSigGeneSelectorProps, {}>
{
	constructor(props:MutSigGeneSelectorProps)
	{
		super(props);
		this.map_geneSymbol_selected.replace(props.initialSelection.map(geneSymbol => [geneSymbol, true]));
	}

	private readonly map_geneSymbol_selected = observable.map<boolean>();

	@computed get allGenes()
	{
		return _.uniq(this.props.data.map(mutSig => mutSig.hugoGeneSymbol));
	}

	@computed get selectedGenes()
	{
		return this.allGenes.filter(symbol => this.map_geneSymbol_selected.get(symbol));
	}

	@action selectAll(selected:boolean)
	{
		for (let gene of this.allGenes)
			this.map_geneSymbol_selected.set(gene, selected);
	}

	render()
	{
		let columns:IColumnDefMap = {
			'hugoGeneSymbol': {
				priority: 1,
				dataField: 'hugoGeneSymbol',
				name: "Gene Symbol",
				sortable: true,
				filterable: true,
			},
			'numberOfMutations': {
				priority: 2,
				dataField: 'numberOfMutations',
				name: "Num Mutations",
				sortable: true,
				filterable: true,
			},
			'qValue': {
				priority: 3,
				dataField: 'qValue',
				name: "Q-Value",
				sortable: true,
				filterable: true,
				formatter: ({name, columnData: value}: IColumnFormatterData<MutSig>) => (
					<Td key={name} column={name} value={value}>
						{toPrecision(value, 2, 0.1)}
					</Td>
				),
			},
			'selected': {
				name: "Selected",
				priority: 4,
				header: (
					<div className={styles.selectionColumnHeader}>
						<span>All</span>
						<LabeledCheckbox
							checked={this.selectedGenes.length > 0}
							indeterminate={this.selectedGenes.length > 0 && this.selectedGenes.length < this.allGenes.length}
							inputProps={{
								onChange: event => this.selectAll((event.target as HTMLInputElement).checked)
							}}
						/>
					</div>
				),
				formatter: ({name, rowData: mutSig}:IColumnFormatterData<MutSig>) => (
					<Td key={name} column={name}>
						{!!(mutSig) && (
							<div className={styles.selectionColumnCell}>
								<ObservableMapCheckbox map={this.map_geneSymbol_selected} mapKey={mutSig.hugoGeneSymbol}/>
							</div>
						)}
					</Td>
				),
				sortable: false,
				filterable: false,
			},
		};

		let reactTableProps:TableProps = {
			className: "table table-striped table-border-top",
			hideFilterInput:true,
			defaultSort: columns.qValue.name,
		};

		let headerControlsProps:ITableHeaderControlsProps = {
		    // tableData?: Array<any>;
		    // className?: string;
		    // searchClassName?: string;
		    // showSearch?: boolean;
			showCopyAndDownload: false,
		    // copyDownloadClassName?: string;
		    showHideShowColumnButton: false,
		    showPagination: true,
		    // handleInput?: Function;
		    // downloadDataGenerator?: Function;
		    // downloadDataContainsHeader?: boolean;
		    // downloadFilename?: string;
		    // paginationProps?: ITablePaginationControlsProps;
		    // columnVisibilityProps?: IColumnVisibilityControlsProps;
		    // searchDelayMs?:number;
		};

		return (
			<div className={styles.MutSigGeneSelector}>
				<MutSigTable
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
class ObservableMapCheckbox extends React.Component<{map:ObservableMap<boolean>, mapKey:string, children?: React.ReactNode}, {}>
{
	render()
	{
		return (
			<LabeledCheckbox
				checked={!!this.props.map.get(this.props.mapKey)}
				inputProps={{
					onChange: event => this.props.map.set(this.props.mapKey, (event.target as HTMLInputElement).checked)
				}}
			>
				{this.props.children}
			</LabeledCheckbox>
		);
	}
}
