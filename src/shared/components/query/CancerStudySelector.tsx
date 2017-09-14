import * as _ from "lodash";
import * as React from "react";
import Dictionary = _.Dictionary;
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/generated/CBioPortalAPI";
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';
import ReactSelect from 'react-select';
import StudyList from "./studyList/StudyList";
import {observer, Observer} from "mobx-react";
import {expr} from 'mobx';
import memoize from "memoize-weak-decorator";
import {If, Then} from 'react-if';
import {QueryStoreComponent} from "./QueryStore";
import SectionHeader from "../sectionHeader/SectionHeader";
import {Modal} from 'react-bootstrap';
import Autosuggest from 'react-bootstrap-autosuggest'
import ReactElement = React.ReactElement;

const styles = styles_any as {
	SelectedStudiesWindow: string,
	CancerStudySelector: string,
	CancerStudySelectorHeader: string,
	selectable: string,
	selected: string,
	selectedCount: string,
	selectAll: string,
	noData: string,
	selectionsExist: string,
	cancerStudyName: string,
	cancerStudySamples: string,
	matchingNodeText: string,
	nonMatchingNodeText: string,
	containsSelectedStudies: string,
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

export interface ICancerStudySelectorProps
{
	style?: React.CSSProperties;
}

@observer
export default class CancerStudySelector extends QueryStoreComponent<ICancerStudySelectorProps, {}>
{
	constructor(props: ICancerStudySelectorProps)
	{
		super(props);
	}

	get logic() { return this.store.studyListLogic; }

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

	CancerTypeList = observer(() => {
		let cancerTypes = this.logic.cancerTypeListView.getChildCancerTypes(this.store.treeData.rootCancerType);
		return (
			<ul className={styles.cancerTypeList}>
				{cancerTypes.map((cancerType, arrayIndex) => (
					<this.CancerTypeListItem key={arrayIndex} cancerType={cancerType}/>
				))}
			</ul>
		);
	});

	CancerTypeListItem = observer(({cancerType}: {cancerType:CancerType}) => {
		let numStudies = expr(() => this.logic.cancerTypeListView.getDescendantCancerStudies(cancerType).length);
		let selected = _.includes(this.store.selectedCancerTypeIds, cancerType.cancerTypeId);
		let highlighted = this.logic.isHighlighted(cancerType);
		let liClassName = classNames({
			[styles.cancerTypeListItem]: true,
			[styles.selectable]: true,
			[styles.selected]: selected,
			[styles.matchingNodeText]: !!this.store.searchText && highlighted,
			[styles.nonMatchingNodeText]: !!this.store.searchText && !highlighted,
			[styles.containsSelectedStudies]: expr(() => this.logic.cancerTypeContainsSelectedStudies(cancerType)),
		});

		return (
			<li
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
	});

	private autosuggest:React.Component<any,any>;

	render()
	{
		return (
			<FlexCol overflow className={styles.CancerStudySelector}>
				<FlexRow overflow className={styles.CancerStudySelectorHeader}>

					<SectionHeader promises={[this.store.cancerTypes, this.store.cancerStudies]}>
						Select Studies:
					</SectionHeader>

					<div>
					{!!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending) && (
						<Observer>
							{() => {
								let numSelectedStudies = expr(() => this.store.selectedStudyIds.length);
								let selectedCountClass = classNames({
									[styles.selectedCount]: true,
									[styles.selectionsExist]: numSelectedStudies > 0
								});
								return (
									<span
										className={selectedCountClass}
										onClick={() => {
											if (numSelectedStudies)
												this.store.showSelectedStudiesOnly = !this.store.showSelectedStudiesOnly;
										}}
									>
										<b>{numSelectedStudies}</b> studies selected
										(<b>{this.store.selectedStudies_totalSampleCount}</b> samples)
									</span>
								);
							}}
						</Observer>
					)}

					{ (!!(!this.store.forDownloadTab) && !!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending)) && (
						<Observer>
							{() => {
								let selectAllChecked = expr(() => this.logic.mainView.getCheckboxProps(this.store.treeData.rootCancerType).checked);
								return (
									<a onClick={() => this.logic.mainView.onCheck(this.store.treeData.rootCancerType, !selectAllChecked)}>
										{selectAllChecked ? "Deselect all" : "Select all"}
									</a>
								);
							}}
						</Observer>
					)}
					</div>

					<Observer>
						{() => {
							let searchTextOptions = this.store.searchTextPresets;
							if (this.store.searchText && searchTextOptions.indexOf(this.store.searchText) < 0)
								searchTextOptions = [this.store.searchText].concat(searchTextOptions as string[]);
							let searchTimeout: number|null = null;

							return (<Autosuggest
								datalist={searchTextOptions}
								ref={(el: React.Component<any, any>)=>(this.autosuggest = el)}
								placeholder="Search..."
								bsSize="small"
								onChange={(currentVal:string) => {
									if (searchTimeout !== null) {
										window.clearTimeout(searchTimeout);
										searchTimeout = null;
									}

									searchTimeout = window.setTimeout(()=>{
										this.store.setSearchText(currentVal);
									}, 400);
								}}
								onFocus={(value:string)=>{
									if (value.length === 0) {
										setTimeout(()=>{
											this.autosuggest.setState({open:true});
										},400)
									}
								}}
							/>);

						}}
					</Observer>


				</FlexRow>

				<SectionHeader style={{display:'none'}} promises={[this.store.cancerTypes, this.store.cancerStudies]}>
					Select Studies:
					{!!(!this.store.cancerTypes.isPending && !this.store.cancerStudies.isPending) && (
						<Observer>
							{() => {
								let numSelectedStudies = expr(() => this.store.selectedStudyIds.length);
								let selectedCountClass = classNames({
									[styles.selectedCount]: true,
									[styles.selectionsExist]: numSelectedStudies > 0
								});
								return (
									<span
										className={selectedCountClass}
										onClick={() => {
											if (numSelectedStudies)
												this.store.showSelectedStudiesOnly = !this.store.showSelectedStudiesOnly;
										}}
									>
										<b>{numSelectedStudies}</b> studies selected
										(<b>{this.store.selectedStudies_totalSampleCount}</b> samples)
									</span>
								);
							}}
						</Observer>
					)}
				</SectionHeader>

				<FlexRow className={styles.cancerStudySelectorBody}>
					<If condition={this.store.maxTreeDepth > 0}>
						<Then>
							<div className={styles.cancerTypeListContainer}>
								<this.CancerTypeList/>
							</div>
						</Then>
					</If>
					<div className={styles.cancerStudyListContainer} data-test='cancerTypeListContainer'>
						<StudyList/>
					</div>
				</FlexRow>

				<Modal
					className={classNames(styles.SelectedStudiesWindow, 'cbioportal-frontend')}
					show={this.store.showSelectedStudiesOnly}
					onHide={() => this.store.showSelectedStudiesOnly = false}
				>
					<Modal.Header closeButton>
						<Modal.Title>Selected Studies</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<StudyList showSelectedStudiesOnly/>
					</Modal.Body>
				</Modal>
			</FlexCol>
		);
	}
}
