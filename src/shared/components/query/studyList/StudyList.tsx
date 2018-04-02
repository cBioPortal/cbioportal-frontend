import * as React from "react";
import {TypeOfCancer as CancerType, CancerStudy} from "../../../api/generated/CBioPortalAPI";
import * as styles_any from "./styles.module.scss";
import classNames from "classnames";
import FontAwesome from "react-fontawesome";
import LabeledCheckbox from "../../labeledCheckbox/LabeledCheckbox";
import {observer, Observer} from "mobx-react";
import {computed} from "mobx";
import _ from "lodash";
import {getPubMedUrl, openStudySummaryFormSubmit} from "../../../api/urls";
import {QueryStoreComponent} from "../QueryStore";
import DefaultTooltip from "../../defaultTooltip/DefaultTooltip";
import {FilteredCancerTreeView} from "../StudyListLogic";
import {CancerTreeNode} from "../CancerStudyTreeData";

const styles = {
	...styles_any as {
		StudyList: string,
		SelectedStudyList: string,

		CancerType: string,
		CancerTypeName: string,
		SelectAll: string,

		Study: string,
		StudyName: string,
		DeletedStudy: string,
		StudyMeta: string,
		StudySamples: string,
		StudyLinks: string,

		icon: string,
		iconWithTooltip: string,
		trashIcon: string,
		summaryIcon: string,
		tooltip: string,

		disabled: string,
		enabled: string,
		indentArrow: string,

		closeSelected: string,
		deselectAll: string,
		highlighted: string,
	},
	Level: (level:number) => styles_any[`Level${level}`]
};

export interface IStudyListProps
{
	showSelectedStudiesOnly?: boolean;
}

@observer
export default class StudyList extends QueryStoreComponent<IStudyListProps, {}>
{
	private _view:FilteredCancerTreeView;

	get view()
	{
		return this._view || (
			this.props.showSelectedStudiesOnly
			? this.logic.selectedStudiesView
			: this.logic.mainView
		);
	}

	get logic() { return this.store.studyListLogic; }

	get rootCancerType() { return this.store.treeData.rootCancerType; }

	componentDidMount()
	{
		// when rendering selected studies view,
		// cache the view object so studies do not disappear immediately when deselected.
		if (this.props.showSelectedStudiesOnly)
			this._view = this.view;
	}

	render()
	{
		let studyList = this.renderCancerType(this.rootCancerType);

		if (this.props.showSelectedStudiesOnly)
		{
			return (
				<div className={styles.SelectedStudyList}>
					<span
						className={styles.deselectAll}
						onClick={() => {
							this.view.onCheck(this.store.treeData.rootCancerType, false);
							this.store.showSelectedStudiesOnly = false;
						}}
					>
						Deselect all
					</span>
					{studyList}
				</div>
			);
		}

		return studyList;
	}

	renderCancerType = (cancerType:CancerType, arrayIndex:number = 0):JSX.Element | null =>
	{
		let currentLevel = this.logic.getDepth(cancerType);
		let childCancerTypes = this.view.getChildCancerTypes(cancerType);
		let childStudies = this.view.getChildCancerStudies(cancerType);
		let childStudyIds = this.logic.cancerTypeListView.getDescendantCancerStudies(cancerType).map(study => study.studyId);

		let heading:JSX.Element | undefined;
		let indentArrow:JSX.Element | undefined;

		if (cancerType != this.rootCancerType)
		{
			let liClassName = classNames(
				styles.CancerType,
				styles.Level(currentLevel),
				this.logic.isHighlighted(cancerType) && styles.highlighted,
			);

			if (currentLevel === 3)
				indentArrow = (
					<FontAwesome className={styles.indentArrow} name="long-arrow-right" />
				);

			heading = (
				<li className={liClassName}>
					<CancerTreeCheckbox view={this.view} node={cancerType}>
						{indentArrow}
						<span className={styles.CancerTypeName}>
							{cancerType.name}
						</span>
                            {!!(!this.store.forDownloadTab) && (
                                <span className={styles.SelectAll}>
                                    {_.intersection(childStudyIds, this.store.selectedStudyIds).length ?
                                        'Deselect All' : 'Select All'}
                                </span>
                            )}
					</CancerTreeCheckbox>
				</li>
			);
		}

		let ulClassName = classNames(
			styles.StudyList,
			styles.Level(currentLevel),
		);
		return (
			<ul key={arrayIndex} className={ulClassName}>
				{heading}
				{childStudies.map(this.renderCancerStudy)}
				{childCancerTypes.map(this.renderCancerType)}
			</ul>
		);
	}

	renderCancerStudy = (study:CancerStudy, arrayIndex:number) =>
	{
		let liClassName = classNames(
			styles.Study,
			this.logic.isHighlighted(study) && styles.highlighted,
		);

		const isOverlap = study.studyId in this.store.getOverlappingStudiesMap;
		const overlapWarning = isOverlap ?
            <DefaultTooltip
                mouseEnterDelay={0}
                placement="top"
                overlay={<div>This study may share samples with another selected study.</div>}
            >
                <i className="fa fa-exclamation-triangle"></i>
            </DefaultTooltip>
			: null;

		return (
			<li key={arrayIndex} 
			    className={liClassName} 
			    data-test={this.store.isVirtualStudy(study.studyId) ? 'VirtualStudySelect' : 'StudySelect'}>
                <Observer>
                {() => {
                    const classes = classNames({ [styles.StudyName]:true, 'overlappingStudy':isOverlap ,   [styles.DeletedStudy]: this.store.isDeletedVirtualStudy(study.studyId)});
                    return(
                        <CancerTreeCheckbox view={this.view} node={study}>
                            <span className={classes}>
                                {study.name}
                                {overlapWarning}
                            </span>
                       </CancerTreeCheckbox>
                    )
                }}
                </Observer>

                <Observer>
                    {() => {
                        return(
                            <div className={styles.StudyMeta}>
                                {!this.store.isDeletedVirtualStudy(study.studyId) && this.renderSamples(study)}
                                {this.renderStudyLinks(study)}
                            </div>
                        );
                    }}
                </Observer>
			</li>
		);
	}

	// renderStudyName = (study:CancerStudy, afterName?:any) =>
	// {
	// 	return (
	// 		<CancerTreeCheckbox view={this.view} node={study}>
	// 			<span className={styles.StudyName}>
	// 				{study.name} {afterName || null}
	// 			</span>
	// 		</CancerTreeCheckbox>
	// 	);
	// }

	renderSamples = (study:CancerStudy) =>
	{
		return (
			<span className={styles.StudySamples}>
				{`${study.allSampleCount} samples`}
			</span>
		);
	}

	renderStudyLinks = (study:CancerStudy) =>
	{
        if(this.store.isDeletedVirtualStudy(study.studyId)){
            return(
                <DefaultTooltip
                    mouseEnterDelay={0}
                    placement="top"
                    overlay={
                        <div className={styles.tooltip}
                        >Restore study</div>
                    }
                    children={
                        <button 
                            className={`btn btn-default btn-xs`} 
                            onClick={()=>this.store.restoreVirtualStudy(study.studyId)}
                            style={{
                                lineHeight: '80%',
                            }}
							data-test='virtualStudyRestore'>
                            Restore
                        </button>
                    }
                />
            )
        } else {
            let links:{icon:string, onClick?:string|(()=>void), tooltip?:string}[] = [
                {
                    icon: 'info-circle',
                    tooltip: study.description,
                }
            ];
    
            if (this.store.isVirtualStudy(study.studyId)) {
                links.push({
                    icon: 'trash',
                    tooltip: "Delete this virtual study.",
                    onClick: ()=>this.store.deleteVirtualStudy(study.studyId),
                });
            } else {
                links.push({
                    icon: 'book',
                    onClick: study.pmid && getPubMedUrl(study.pmid),
                    tooltip: study.pmid && "PubMed",
                });
			}
    
            return (
                <span className={styles.StudyLinks}>
                    {links.map((link, i) => {
                        let content = (
                            <FontAwesome
                                key={i}
                                name={link.icon}
                                className={classNames({
                                    [styles.icon]: true,
                                    [styles.iconWithTooltip]: !!link.tooltip,
                                    [styles.trashIcon]: (link.icon === "trash")
                                })}
                            />
                        );
    
                        if (link.onClick) {
                            let anchorProps:any = {
                                key: i
                            };
                            if (typeof link.onClick === "string") {
                                anchorProps.href = link.onClick;
                                anchorProps.target = "_blank";
                            } else {
                                anchorProps.onClick = link.onClick;
                            }
                            content = (
                                <a {...anchorProps}>
                                    {content}
                                </a>
                            );
                        }
    
                        if (link.tooltip)
                        {
                            let overlay = (
                                <div className={styles.tooltip} dangerouslySetInnerHTML={{__html: link.tooltip}}/>
                            );
                            content = (
                                <DefaultTooltip
                                    key={i}
                                    mouseEnterDelay={0}
                                    placement="top"
                                    overlay={overlay}
                                    children={content}
                                />
                            );
                        }
    
                        return content;
                    })}
                    {study.studyId && (
                        <DefaultTooltip
                            mouseEnterDelay={0}
                            placement="top"
                            overlay={
                                <div className={styles.tooltip}
                                >View study summary</div>
                            }
                        >
						    <span onClick={()=>openStudySummaryFormSubmit(study.studyId)}
						        className={ classNames(styles.summaryIcon, 'ci ci-pie-chart')}>
					        </span>
						</DefaultTooltip>
                    )}
                </span>
            );
        }
	}
}

export interface ICancerTreeCheckboxProps
{
	view: FilteredCancerTreeView;
	node: CancerTreeNode;
}

@observer
export class CancerTreeCheckbox extends QueryStoreComponent<ICancerTreeCheckboxProps, {}>
{
	@computed.struct get checkboxProps()
	{
		return this.props.view.getCheckboxProps(this.props.node);
	}

	render()
	{
		return (
			<LabeledCheckbox
				{...this.checkboxProps}
				onChange={event => {
					this.props.view.onCheck(this.props.node, (event.target as HTMLInputElement).checked);
				}}
			>
				{this.props.children}
			</LabeledCheckbox>
		);
	}
}
