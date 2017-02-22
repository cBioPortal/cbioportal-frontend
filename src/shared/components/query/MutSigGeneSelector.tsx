import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import queryStore from "./QueryStore";
import {toJS, computed} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/index";
import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {MutSig} from "../../api/CBioPortalAPIInternal";
import {IColumnFormatterData} from "../enhancedReactTable/IColumnFormatter";
import {IColumnDefMap, IEnhancedReactTableProps} from "../enhancedReactTable/IEnhancedReactTableProps";
import {ITableHeaderControlsProps} from "../tableHeaderControls/TableHeaderControls";
import {Table, Td, TableProps} from 'reactable';

const styles = styles_any as {
	MutSigGeneSelector: string,
};

class MutSigTable extends EnhancedReactTable<MutSig> {};

@observer
export default class MutSigGeneSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	formatSelected = (data:IColumnFormatterData<MutSig>) =>
	{
		let selected = _.includes(this.store.geneIds, data.rowData && data.rowData.hugoGeneSymbol);
		let text = selected + '';
		return (
			<Td key={data.name} column={data.name} value={text}>
				{text}
			</Td>
		);
	}

	downloadSelected = (data:IColumnFormatterData<MutSig>):string =>
	{
		return data.columnData + '';
	}

	onVisibleRowsChange = (data:MutSig[]) =>
	{
		console.log('onVisibleRowsChange', data);
	}

	render()
	{
		let columns:IColumnDefMap = {
			'hugoGeneSymbol': {
				dataField: 'hugoGeneSymbol',
				name: "Gene Symbol",
				priority: 1,
				sortable: true,
				filterable: true
			},
			'numberOfMutations': {
				dataField: 'numberOfMutations',
				name: "Num Mutations",
				priority: 2,
				sortable: true,
				filterable: true
			},
			'qValue': {
				dataField: 'qValue',
				name: "Q-Value",
				priority: 3,
				sortable: true,
				filterable: true
			},
			'selected': {
				name: "All",
				priority: 4,
				formatter: this.formatSelected,
				downloader: this.downloadSelected,
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
		    // showPagination?:boolean;
		    // handleInput?: Function;
		    // downloadDataGenerator?: Function;
		    // downloadDataContainsHeader?: boolean;
		    // downloadFilename?: string;
		    // paginationProps?: ITablePaginationControlsProps;
		    // columnVisibilityProps?: IColumnVisibilityControlsProps;
		    // searchDelayMs?:number;
		}

		return (
			<div className={styles.MutSigGeneSelector}>
				<MutSigTable
					itemsName="mutations"
					reactTableProps={reactTableProps}
					initItemsPerPage={10}
					headerControlsProps={headerControlsProps}
					columns={columns}
					rawData={this.store.mutSigForSingleStudy.result}
					onVisibleRowsChange={this.onVisibleRowsChange}
				/>
			</div>
		);
	}
}
