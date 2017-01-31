import * as React from 'react';
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/CBioPortalAPI";
import * as styles_any from './styles.module.scss';
import classNames from "../../lib/classNames";
import FontAwesome from "react-fontawesome";
import {CancerTreeNode} from "../query/CancerStudyTreeData";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";

const styles = {
	...styles_any as {
		StudyList: string,

		CancerType: string,
		CancerTypeName: string,
		SelectAll: string,

		Study: string,
		StudyName: string,
		StudyMeta: string,
		StudySamples: string,
		StudyLinks: string,

		disabled: string,
		enabled: string,
		indentArrow: string,

		highlighted: string,
	},
	Level: (level:number) => styles_any[`Level${level}`]
};

export type IStudyListProps = {
	logic: IStudyListLogic;
};

export interface IStudyListLogic
{
	getRootCancerType: () => CancerType;
	getChildCancerTypes: (cancerType:CancerType) => CancerType[];
	getChildCancerStudies: (cancerType:CancerType) => CancerStudy[];
	getDepth: (node:CancerType) => number;
	isHighlighted: (node:CancerTreeNode) => boolean;
	getCheckboxProps: (node: CancerTreeNode) => {checked: boolean, indeterminate?: boolean};
	onCheck: (node:CancerTreeNode, event:React.FormEvent<HTMLInputElement>) => void;
}

export default class StudyList extends React.Component<IStudyListProps, {}>
{
	get logic() { return this.props.logic; }

	render()
	{
		return this.renderCancerType(this.logic.getRootCancerType());
	}

	renderCancerType = (cancerType:CancerType, arrayIndex:number = 0):JSX.Element =>
	{
		let currentLevel = this.logic.getDepth(cancerType);
		let childCancerTypes = this.logic.getChildCancerTypes(cancerType);
		let childStudies = this.logic.getChildCancerStudies(cancerType);

		let heading:JSX.Element | undefined;
		let indentArrow:JSX.Element | undefined;

		if (cancerType != this.logic.getRootCancerType())
		{
			let liClassName = classNames(
				styles.CancerType,
				styles.Level(currentLevel),
				this.logic.isHighlighted(cancerType) && styles.highlighted,
			);

			if (currentLevel === 3)
				indentArrow = (
					<FontAwesome className={styles.indentArrow} name="long-arrow-right" />
				)

			heading = (
				<li className={liClassName}>
					<LabeledCheckbox
						{...this.logic.getCheckboxProps(cancerType)}
						inputProps={{
							onChange: event => this.logic.onCheck(cancerType, event)
						}}
					>
						{indentArrow} 
						<span className={styles.CancerTypeName}>
							{cancerType.name}
						</span>
						<span className={styles.SelectAll}>
							Select All
						</span>
					</LabeledCheckbox>
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
		return (
			<li key={arrayIndex} className={liClassName}>
				{this.renderStudyName(study)}
				<div className={styles.StudyMeta}>
					{this.renderSamples(study)}
					{this.renderStudyLinks(study)}
				</div>
			</li>
		);
	}

	renderStudyName = (study:CancerStudy) =>
	{
		return (
			<LabeledCheckbox
				{...this.logic.getCheckboxProps(study)}
				inputProps={{
					onChange: event => this.logic.onCheck(study, event)
				}}
			>
				<span className={styles.StudyName} title={study.name}>
					{study.name}
				</span>
			</LabeledCheckbox>
		);
	}

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
		let links = [];
		if (study.studyId)
			links.push({icon: 'bar-chart', url: `/study?id=${study.studyId}#summary`});
		if (study.pmid)
			links.push({icon: 'book', url: `http://www.ncbi.nlm.nih.gov/pubmed/${study.pmid}`});
		else 
			links.push({icon: 'book', url: undefined });
		return (
			<span className={styles.StudyLinks}>
				{links.map((link, i) => (
					link.url ?
					<a key={i} href={link.url}>
						<FontAwesome name={link.icon}/>
					</a> :
						<FontAwesome name={link.icon}/>
				))}
			</span>
		);
	}
}
