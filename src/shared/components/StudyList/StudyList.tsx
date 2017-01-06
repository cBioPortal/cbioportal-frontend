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

		Study: string,
		StudyName: string,
		StudySamples: string,
		StudyLinks: string,

		highlighted: string,
	},
	Level: (level:number) => `Level${level}`
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
	onCheck: (node:CancerTreeNode, event:React.FormEvent) => void;
}

export default class StudiesList extends React.Component<IStudyListProps, {}>
{
	get logic() { return this.props.logic; }

	render()
	{
		return this.renderCancerType(this.logic.getRootCancerType());
	}

	renderCancerType = (cancerType:CancerType, arrayIndex?:number):JSX.Element =>
	{
		let currentLevel = this.logic.getDepth(cancerType);
		let childCancerTypes = this.logic.getChildCancerTypes(cancerType);
		let childStudies = this.logic.getChildCancerStudies(cancerType);

		let heading:JSX.Element | undefined;
		if (cancerType != this.logic.getRootCancerType())
		{
			let liClassName = classNames(
				styles.CancerType,
				styles.Level(currentLevel),
				this.logic.isHighlighted(cancerType) ? styles.highlighted : null,
			);
			heading = (
				<li className={liClassName}>
					<LabeledCheckbox
						{...this.logic.getCheckboxProps(cancerType)}
						inputProps={{
							onChange: event => this.logic.onCheck(cancerType, event)
						}}
					>
						<span className={styles.CancerTypeName}>
							{cancerType.name}
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
			this.logic.isHighlighted(study) ? styles.highlighted : null,
		);
		return (
			<li key={arrayIndex} className={liClassName}>
				{this.renderStudyName(study)}
				{this.renderSamples(study)}
				{this.renderStudyLinks(study)}
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
				<span className={styles.StudyName}>
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
			links.push({icon: 'cube', url: `/study?id=${study.studyId}#summary`});
		if (study.pmid)
			links.push({icon: 'book', url: `http://www.ncbi.nlm.nih.gov/pubmed/${study.pmid}`});
		return (
			<div className={styles.StudyLinks}>
				{links.map((link, i) => (
					<a key={i} href={link.url}>
						<FontAwesome name={link.icon}/>
					</a>
				))}
			</div>
		);
	}
}
