import * as _ from "lodash";
import * as React from "react";
import Dictionary = _.Dictionary;
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/CBioPortalAPI";
import "react-bootstrap-table/css/react-bootstrap-table.css";
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import HTMLAttributes = __React.HTMLAttributes;
import classNames from "../../lib/classNames";
import {default as CancerStudyTreeData, CancerTreeNode} from "../query/CancerStudyTreeData";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';
import 'react-select/dist/react-select.css';
import StudyList from "../StudyList/StudyList";
import StudyListLogic from "../StudyList/StudyListLogic";
import {observer} from "../../../../node_modules/mobx-react/custom";
import queryStore from "./QueryStore";
import {action, toJS, computed} from "../../../../node_modules/mobx/lib/mobx";
import memoize from "../../lib/memoize";

const styles = styles_any as {
	CancerStudySelector: string,
	selectable: string,
	selected: string,
	matchingNodeText: string,
	nonMatchingNodeText: string,
	selectCancerStudyHeader: string,
	selectCancerStudyRow: string,
	searchTextInput: string,

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

	@memoize
	getCancerTypeListClickHandler(node:CancerType)
	{
		return (event:React.MouseEvent) => this.selectCancerType(node as CancerType, event);
	}

	@action selectCancerType(cancerType:CancerType, event:React.MouseEvent)
	{
		let clickedCancerTypeId = cancerType.cancerTypeId;

		if (event.ctrlKey)
		{
			if (_.includes(queryStore.selectedCancerTypeIds, clickedCancerTypeId))
				queryStore.selectedCancerTypeIds = _.difference(queryStore.selectedCancerTypeIds, [clickedCancerTypeId]);
			else
				queryStore.selectedCancerTypeIds = _.union(queryStore.selectedCancerTypeIds, [clickedCancerTypeId]);
		}
		else if (queryStore.clickAgainToDeselectSingle && _.isEqual(queryStore.selectedCancerTypeIds, [clickedCancerTypeId]))
		{
			queryStore.selectedCancerTypeIds = [];
		}
		else
		{
			queryStore.selectedCancerTypeIds = [clickedCancerTypeId];
		}
	}

	handleStudiesCheckbox(event:React.FormEvent, clickedStudyIds:string[])
	{
		if ((event.target as HTMLInputElement).checked)
			queryStore.selectedCancerStudyIds = _.union(queryStore.selectedCancerStudyIds, clickedStudyIds);
		else
			queryStore.selectedCancerStudyIds = _.difference(queryStore.selectedCancerStudyIds, clickedStudyIds);
	}

	renderCancerTypeList()
	{
		let logic = this.studyListLogic;
		let rootMeta = logic.getMetadata(logic.treeData.rootCancerType);
		let listItems = rootMeta && rootMeta.childCancerTypes.map(this.renderCancerTypeListItem);

		return (
			<ul className={styles.cancerTypeList}>
				{listItems}
			</ul>
		);
	}

	renderCancerTypeListItem = (cancerType:CancerType, arrayIndex:number) =>
	{
		let logic = this.studyListLogic;
		let meta = logic.getMetadata(cancerType);
		let numStudies = logic.getDescendantCancerStudies(cancerType).length;

		if (!numStudies)
			return null;

		let selected = meta.isCancerType && _.includes(queryStore.selectedCancerTypeIds, cancerType.cancerTypeId);
		let highlighted = this.studyListLogic.isHighlighted(cancerType);
		let liClassName = classNames(
			styles.cancerTypeListItem,
			styles.selectable,
			{
				[styles.selected]: selected,
				[styles.matchingNodeText]: !!queryStore.searchText && highlighted,
				[styles.nonMatchingNodeText]: !!queryStore.searchText && !highlighted,
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
		let logic = this.studyListLogic;
		let selectedStudies = queryStore.selectedCancerStudyIds.map(studyId => logic.treeData.map_studyId_cancerStudy.get(studyId) as CancerStudy);
		let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies);
		let checked = shownAndSelectedStudies.length > 0;
		let indeterminate = checked && shownAndSelectedStudies.length != shownStudies.length;
		return (
			<LabeledCheckbox
				checked={checked}
				indeterminate={indeterminate}
				labelProps={{
					onClick: (event:React.MouseEvent) => event.stopPropagation()
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

	@computed get treeData()
	{
		return new CancerStudyTreeData({
			cancerTypes: queryStore.cancerTypes.result || [],
			studies: queryStore.cancerStudies.result || [],
		});
	}

	@computed get studyListLogic()
	{
		return new StudyListLogic({
			treeData: this.treeData,
			state: {
				maxTreeDepth: queryStore.maxTreeDepth,
				searchText: queryStore.searchText,
				selectedCancerTypeIds: queryStore.selectedCancerTypeIds,
				selectedStudyIds: queryStore.selectedCancerStudyIds,
			},
			handleSelectedStudiesChange: selectedStudyIds => queryStore.selectedCancerStudyIds = selectedStudyIds,
		});
	}

	render()
	{
		let searchTextOptions = queryStore.searchTextPresets;
		if (queryStore.searchText && searchTextOptions.indexOf(queryStore.searchText) < 0)
			searchTextOptions = [queryStore.searchText].concat(searchTextOptions);

		return (
			<FlexCol className={styles.CancerStudySelector} padded flex={1} style={this.props.style}>
				<FlexRow padded overflow className={styles.selectCancerStudyRow}>
					<span className={styles.selectCancerStudyHeader}>Select Cancer Study:</span>
					<ReactSelect
						className={styles.searchTextInput}
						value={queryStore.searchText}
						autofocus={true}
						options={searchTextOptions.map(str => ({label: str, value: str}))}
						promptTextCreator={(label:string) => `Search for "${label}"`}
						placeholder='Search...'
						noResultsText={false}
						onCloseResetsInput={false}
						onInputChange={(searchText:string) => {
							queryStore.searchText = searchText;
							queryStore.selectedCancerTypeIds = [];
						}}
						onChange={(option:{value:string}) => {
							queryStore.searchText = option ? option.value || '' : '';
							queryStore.selectedCancerTypeIds = [];
						}}
					/>
					<div style={{flex: 1}}/>
					Number of Studies Selected: {queryStore.selectedCancerStudyIds.length}
				</FlexRow>

				<FlexRow padded flex={1}>
					<div className={styles.cancerTypeListContainer}>
						{this.renderCancerTypeList()}
					</div>
					<div className={styles.cancerStudyListContainer}>
						<StudyList
							logic={this.studyListLogic}
						/>
					</div>
				</FlexRow>
			</FlexCol>
		);
	}
}
