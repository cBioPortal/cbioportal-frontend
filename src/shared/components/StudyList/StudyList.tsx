import * as React from 'react';
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/generated/CBioPortalAPI";
import * as styles_any from './styles.module.scss';
import classNames from "../../lib/classNames";
import FontAwesome from "react-fontawesome";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import {observer} from "mobx-react";
import {getStudySummaryUrl, getPubMedUrl} from "../../api/urls";
import {QueryStoreComponent} from "../query/QueryStore";

const styles = {
	...styles_any as {
		StudyList: string,
		SelectedStudyList: string,

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


		closeSelected: string,
		highlighted: string,
	},
	Level: (level:number) => styles_any[`Level${level}`]
};

@observer
export default class StudyList extends QueryStoreComponent<{}, {}>
{
	get logic() { return this.store.studyListLogic; }

	render()
	{
		if (this.store.showSelectedStudiesOnly) {
			return this.renderSelectedStudies();
		} else {
			return this.renderCancerType(this.logic.rootCancerType);
		}
	}

	renderSelectedStudies = () =>
	{
		return (
			<div className={styles.SelectedStudyList}>
				<h4>
						Selected Studies 
						<span 
							onClick={() => this.store.showSelectedStudiesOnly = !this.store.showSelectedStudiesOnly}
							className={styles.closeSelected}
						>
							Return to Study Selector
						</span>
				</h4>
				<ul className={styles.StudyList}>
					{this.renderCancerType(this.logic.rootCancerType)}
				</ul>
			</div>
		);
	}

	renderCancerType = (cancerType:CancerType, arrayIndex:number = 0):JSX.Element | null =>
	{
		// BEGIN TEMP HACK
		let descendantStudies = this.logic.getDescendantCancerStudies(cancerType);
		if (!descendantStudies.length)
			return null;
		// END TEMP HACK

		let currentLevel = this.logic.getDepth(cancerType);
		let childCancerTypes = this.logic.getChildCancerTypes(cancerType);
		let childStudies = this.logic.getChildCancerStudies(cancerType);

		let heading:JSX.Element | undefined;
		let indentArrow:JSX.Element | undefined;

		if (cancerType != this.logic.rootCancerType)
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
					<LabeledCheckbox
						{...this.logic.getCheckboxProps(cancerType)}
						inputProps={{
							onChange: event => this.logic.onCheck(cancerType, (event.target as HTMLInputElement).checked)
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
					onChange: event => this.logic.onCheck(study, (event.target as HTMLInputElement).checked)
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
			links.push({icon: 'bar-chart', url: getStudySummaryUrl(study.studyId)});
		if (study.pmid)
			links.push({icon: 'book', url: getPubMedUrl(study.pmid)});
		else 
			links.push({icon: 'book', url: undefined });
		return (
			<span className={styles.StudyLinks}>
				{links.map((link, i) => (
					(link.url) ? (
						<a key={i} href={link.url}>
							<FontAwesome name={link.icon}/>
						</a>
					) : (
						<FontAwesome key={i} name={link.icon}/>
					)
				))}
			</span>
		);
	}
}
