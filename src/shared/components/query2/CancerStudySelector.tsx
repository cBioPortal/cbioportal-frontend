import * as _ from "lodash";
import * as React from "react";
import Dictionary = _.Dictionary;
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/CBioPortalAPI";
import {ITreeDescriptor} from "../tree/DescriptorTree";
import "react-bootstrap-table/css/react-bootstrap-table.css";
import FontAwesome from "react-fontawesome";
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import memoize, {memoizeWith} from "../../lib/memoize";
import HTMLAttributes = __React.HTMLAttributes;
import classNames from "../../lib/classNames";
import firstDefinedValue from "../../lib/firstDefinedValue";
import {default as CancerStudyTreeData, CancerTreeNode, NodeMetadata} from "../query/CancerStudyTreeData";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';
import 'react-select/dist/react-select.css';
import StudyList from "../StudyList/StudyList";
import {IStudyListLogic} from "../StudyList/StudyList";
import StudyListLogic from "../StudyList/StudyListLogic";

const styles = styles_any as {
	CancerStudySelector: string,
	treeNodeContent: string,
	selectable: string,
	selected: string,
	treeNodeLabel: string,
	treeWithStudies: string,
	cancerTypeTreeNode: string,
	cancerStudyName: string,
	cancerStudySamples: string,
	matchingNodeText: string,
	nonMatchingNodeText: string,
	studyHeader: string,
	selectCancerStudyHeader: string,
	selectCancerStudyRow: string,
	searchTextInput: string,
	showHideTreeLink: string,

	cancerTypeListContainer: string,
	cancerTypeList: string,
	cancerTypeListItem: string,
	cancerTypeListItemLabel: string,
	cancerTypeListItemCount: string,
	cancerStudyListContainer: string,
};

export type ICancerStudySelectorProps = {
	style?: React.CSSProperties;

	searchTextPresets: string[];
	cancerTypes: CancerType[];
	studies: CancerStudy[];

	onStateChange?: (newState:ICancerStudySelectorState) => void;
} & ICancerStudySelectorExperimentalOptions & ICancerStudySelectorState;

export interface ICancerStudySelectorExperimentalOptions
{
	showAllStudiesByDefault?: boolean;
	maxTreeDepth?: number;
	clickAgainToDeselectSingle?: boolean;
}

export interface ICancerStudySelectorState
{
	searchText?: string;
	selectedCancerTypeIds?: string[];
	selectedStudyIds?: string[];
}

export default class CancerStudySelector extends React.Component<ICancerStudySelectorProps, ICancerStudySelectorState>
{
	static get defaultProps():Partial<ICancerStudySelectorProps>
	{
		return {
			maxTreeDepth: 9,
			showAllStudiesByDefault: true,
			clickAgainToDeselectSingle: true,
		};
	}

	constructor(props: ICancerStudySelectorProps)
	{
		super(props);
		this.state = {};
	}

	componentDidMount()
	{
	}

	get searchText()
	{
		return firstDefinedValue(this.props.searchText, this.state.searchText || '');
	}

	get maxTreeDepth()
	{
		return this.props.maxTreeDepth as number;
	}

	get selectedCancerTypeIds()
	{
		return firstDefinedValue(this.props.selectedCancerTypeIds, this.state.selectedCancerTypeIds || []);
	}

	get selectedStudyIds()
	{
		return firstDefinedValue(this.props.selectedStudyIds, this.state.selectedStudyIds || []);
	}

	updateState(newState:ICancerStudySelectorState)
	{
		this.setState(newState);

		if (this.props.onStateChange)
		{
			this.props.onStateChange({
				selectedCancerTypeIds: this.selectedCancerTypeIds,
				selectedStudyIds: this.selectedStudyIds,
				...newState
			});
		}
	}

	@memoize
	getTreeSelectHandler(node:CancerTreeNode)
	{
		return (event:React.MouseEvent) => {
			// stop if we clicked on the checkbox
			if (event.target instanceof HTMLInputElement)
				return;

			event.stopPropagation();

			let clickedCancerTypeId = node.cancerTypeId;

			let selectedCancerTypeIds = this.selectedCancerTypeIds;
			if (event.ctrlKey)
			{
				if (_.includes(selectedCancerTypeIds, clickedCancerTypeId))
					selectedCancerTypeIds = _.difference(selectedCancerTypeIds, [clickedCancerTypeId]);
				else
					selectedCancerTypeIds = _.union(selectedCancerTypeIds, [clickedCancerTypeId]);
			}
			else if (this.props.clickAgainToDeselectSingle && _.isEqual(selectedCancerTypeIds, [clickedCancerTypeId]))
			{
				selectedCancerTypeIds = [];
			}
			else
			{
				selectedCancerTypeIds = [clickedCancerTypeId];
			}

			this.updateState({selectedCancerTypeIds});
		};
	}

	handleStudiesCheckbox(event:React.FormEvent, clickedStudyIds:string[])
	{
		let selectedStudyIds = this.selectedStudyIds;
		if ((event.target as HTMLInputElement).checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.updateState({selectedStudyIds});
	}

	getMatchingNodeClassNames(node:CancerTreeNode):string
	{
		let matchingNode = this.getStudyListLogic().isHighlighted(node);
		return classNames({
			[styles.matchingNodeText]: !!this.searchText && matchingNode,
			[styles.nonMatchingNodeText]: !!this.searchText && !matchingNode,
		});
	}

	renderCancerTypeList()
	{
		let logic = this.getStudyListLogic();
		let rootMeta = logic.getMetadata(logic.treeInfo.rootCancerType);
		let listItems = rootMeta && rootMeta.childCancerTypes.map(this.renderCancerTypeListItem);

		return (
			<ul className={styles.cancerTypeList}>
				{listItems}
			</ul>
		);
	}

	renderCancerTypeListItem = (cancerType:CancerType) =>
	{
		let logic = this.getStudyListLogic();
		let meta = logic.getMetadata(cancerType);
		let numStudies = logic.getDescendantCancerStudies(cancerType).length;

		if (!numStudies)
			return null;

		let selected = meta.isCancerType && _.includes(this.selectedCancerTypeIds, cancerType.cancerTypeId);
		let liClassName = classNames(
			styles.cancerTypeListItem,
			styles.selectable,
			{[styles.selected]: selected},
			this.getMatchingNodeClassNames(cancerType)
		);

		return (
			<li
				className={liClassName}
				onMouseDown={this.getTreeSelectHandler(cancerType)}
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
		let logic = this.getStudyListLogic();
		let selectedStudies = this.selectedStudyIds.map(studyId => logic.treeInfo.map_studyId_cancerStudy.get(studyId) as CancerStudy);
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

	getTreeInfo = memoize({
		getAdditionalArgs: () => [
			this.props.cancerTypes,
			this.props.studies
		],
		function: () => new CancerStudyTreeData({
			cancerTypes: this.props.cancerTypes,
			studies: this.props.studies,
		}),
	});

	getStudyListLogic = memoize({
		getAdditionalArgs: () => [
			this.props.cancerTypes,
			this.props.studies,
			this.maxTreeDepth,
			this.searchText,
			this.selectedCancerTypeIds,
			this.selectedStudyIds
		],
		function: () => new StudyListLogic({
			treeInfo: this.getTreeInfo(),
			state: {
				maxTreeDepth: this.maxTreeDepth,
				searchText: this.searchText,
				selectedCancerTypeIds: this.selectedCancerTypeIds,
				selectedStudyIds: this.selectedStudyIds,
			},
			handleSelectedStudiesChange: selectedStudyIds => this.updateState({selectedStudyIds}),
		}),
	});

	render()
	{
		let searchTextOptions = this.props.searchTextPresets;
		if (this.searchText && searchTextOptions.indexOf(this.searchText) < 0)
			searchTextOptions = [this.searchText].concat(searchTextOptions);

		return (
			<FlexCol className={styles.CancerStudySelector} padded flex={1} style={this.props.style}>
				<FlexRow padded overflow className={styles.selectCancerStudyRow}>
					<span className={styles.selectCancerStudyHeader}>Select Cancer Study:</span>
					<ReactSelect
						className={styles.searchTextInput}
						value={this.searchText}
						autofocus={true}
						options={searchTextOptions.map(str => ({label: str, value: str}))}
						promptTextCreator={(label:string) => `Search for "${label}"`}
						placeholder='Search...'
						noResultsText={false}
						onCloseResetsInput={false}
						onInputChange={(searchText:string) => this.setState({searchText})}
						onChange={(option:{value:string}) => this.setState({searchText: option ? option.value || '' : ''})}
					/>
					<div style={{flex: 1}}/>
					Number of Studies Selected: {this.selectedStudyIds.length}
				</FlexRow>

				<FlexRow padded flex={1}>
					<div className={styles.cancerTypeListContainer}>
						{this.renderCancerTypeList()}
					</div>
					<div className={styles.cancerStudyListContainer}>
						<StudyList
							logic={this.getStudyListLogic()}
						/>
					</div>
				</FlexRow>
			</FlexCol>
		);
	}
}
