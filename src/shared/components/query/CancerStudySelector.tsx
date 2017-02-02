import * as _ from "lodash";
import * as React from "react";
import Dictionary = _.Dictionary;
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/CBioPortalAPI";
import "react-bootstrap-table/css/react-bootstrap-table.css";
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import classNames from "../../lib/classNames";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';
import 'react-select/dist/react-select.css';
import StudyList from "../StudyList/StudyList";
import {observer} from "../../../../node_modules/mobx-react/index";
import queryStore from "./QueryStore";
import {action, toJS, computed} from "../../../../node_modules/mobx/lib/mobx";
import memoize from "../../lib/memoize";

const styles = styles_any as {
	CancerStudySelector: string,
	cancerStudySelectorHeader: string,
	selectable: string,
	selected: string,
	selectAll: string,
	selectedCount: string,
	cancerStudyName: string,
	cancerStudySamples: string,
	matchingNodeText: string,
	nonMatchingNodeText: string,
	selectCancerStudyHeader: string,
	selectCancerStudyRow: string,
	searchTextInput: string,

	cancerStudySelectorBody: string,
	cancerTypeListContainer: string,
	cancerTypeList: string,
	cancerTypeListItem: string,
	cancerTypeListItemLabel: string,
	cancerTypeListItemCount: string,
	cancerStudyListContainer: string,
};

export type ICancerStudySelectorProps = {
	style?: React.CSSProperties;
};

@observer
export default class CancerStudySelector extends React.Component<ICancerStudySelectorProps, void>
{
	constructor(props: ICancerStudySelectorProps)
	{
		super(props);
	}

	get store() { return queryStore; }

	@memoize
	getCancerTypeListClickHandler<T>(node:CancerType)
	{
		return (event:React.MouseEvent<T>) => this.store.selectCancerType(node as CancerType, event.ctrlKey);
	}

	handleStudiesCheckbox<T>(event:React.FormEvent<T>, clickedStudyIds:string[])
	{
		if ((event.target as HTMLInputElement).checked)
			this.store.selectedStudyIds = _.union(this.store.selectedStudyIds, clickedStudyIds);
		else
			this.store.selectedStudyIds = _.difference(this.store.selectedStudyIds, clickedStudyIds);
	}

	renderCancerTypeList()
	{
		let logic = this.store.studyListLogic;
		let rootMeta = logic.getMetadata(logic.store.treeData.rootCancerType);
		let listItems = rootMeta && rootMeta.childCancerTypes.map(this.renderCancerTypeListItem);

		return (
			<ul className={styles.cancerTypeList}>
				{listItems}
			</ul>
		);
	}

	renderCancerTypeListItem = (cancerType:CancerType, arrayIndex:number) =>
	{
		let logic = this.store.studyListLogic;
		let meta = logic.getMetadata(cancerType);
		let numStudies = logic.getDescendantCancerStudies(cancerType).length;

		if (!numStudies)
			return null;

		let selected = meta.isCancerType && _.includes(this.store.selectedCancerTypeIds, cancerType.cancerTypeId);
		let highlighted = this.store.studyListLogic.isHighlighted(cancerType);
		let liClassName = classNames(
			styles.cancerTypeListItem,
			styles.selectable,
			{
				[styles.selected]: selected,
				[styles.matchingNodeText]: !!this.store.searchText && highlighted,
				[styles.nonMatchingNodeText]: !!this.store.searchText && !highlighted,
			},
		);

		return (
			<li
				key={arrayIndex}
				className={liClassName}
				onMouseDown={this.getCancerTypeListClickHandler(cancerType)}
			>
				<span className={styles.cancerTypeListItemLabel}>
					{cancerType.name}
				</span>
				<span className={styles.cancerTypeListItemCount}>
					{numStudies}
				</span>
			</li>
		);
	}

	renderStudyHeaderCheckbox = (shownStudies:CancerStudy[]) =>
	{
		let selectedStudies = this.store.selectedStudyIds.map(studyId => this.store.treeData.map_studyId_cancerStudy.get(studyId) as CancerStudy);
		let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies);
		let checked = shownAndSelectedStudies.length > 0;
		let indeterminate = checked && shownAndSelectedStudies.length != shownStudies.length;
		return (
			<LabeledCheckbox
				checked={checked}
				indeterminate={indeterminate}
				labelProps={{
					onClick: (event:React.MouseEvent<HTMLLabelElement>) => event.stopPropagation()
				}}
				inputProps={{
					onChange: event => {
						let shownStudyIds = shownStudies.map(study => study.studyId);
						this.handleStudiesCheckbox(event, shownStudyIds);
					}
				}}
			/>
		);
	}

	render()
	{
		let searchTextOptions = this.store.searchTextPresets;
		if (this.store.searchText && searchTextOptions.indexOf(this.store.searchText) < 0)
			searchTextOptions = [this.store.searchText].concat(searchTextOptions as string[]);

		let logic = this.store.studyListLogic;
		let allSelectedCheckboxProps = logic.getCheckboxProps(logic.rootCancerType);
		let allSelected = allSelectedCheckboxProps.checked && !allSelectedCheckboxProps.indeterminate;

		return (
			<FlexCol className={styles.CancerStudySelector} style={this.props.style}>
				<FlexRow padded overflow className={styles.selectCancerStudyRow}>
					<h2>Select Studies</h2>
					<span className={styles.selectedCount}>
						<b>{this.store.selectedStudyIds.length}</b> Studies Selected
					</span>
				</FlexRow>

				<FlexRow overflow className={styles.cancerStudySelectorHeader}>
						<ReactSelect
							className={styles.searchTextInput}
							value={this.store.searchText}
							autofocus={true}
							options={searchTextOptions.map(str => ({label: str, value: str}))}
							promptTextCreator={(label:string) => `Search for "${label}"`}
							placeholder='Search...'
							noResultsText={false}
							onCloseResetsInput={false}
							onInputChange={(searchText:string) => {
								this.store.searchText = searchText;
								this.store.selectedCancerTypeIds = [];
							}}
							onChange={(option:{value:string}) => {
								this.store.searchText = option ? option.value || '' : '';
								this.store.selectedCancerTypeIds = [];
							}}
						/>

						<span className={styles.selectAll} onClick={() => logic.hack_handleSelectAll(!allSelected)}>
							{allSelected ? "Deselect All" : "Select All"}
						</span>
				</FlexRow>

				<FlexRow className={styles.cancerStudySelectorBody}>
					<div className={styles.cancerTypeListContainer}>
						{this.renderCancerTypeList()}
					</div>
					<div className={styles.cancerStudyListContainer}>
						<StudyList/>
					</div>
				</FlexRow>
			</FlexCol>
		);
	}
}
