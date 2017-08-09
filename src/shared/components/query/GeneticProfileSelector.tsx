import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/generated/CBioPortalAPI";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import {observer} from "mobx-react";
import classNames from 'classnames';
import { FlexRow } from "../flexbox/FlexBox";
import {QueryStoreComponent} from "./QueryStore";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import SectionHeader from "../sectionHeader/SectionHeader";

const styles = styles_any as {
	GeneticProfileSelector: string,
	group: string,
	altType: string,
	radio: string,
	checkbox: string,
	infoIcon: string,
	zScore: string,
	groupName: string,
	profileName: string,
	tooltip: string,
};

@observer
export default class GeneticProfileSelector extends QueryStoreComponent<{}, {}>
{
	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		return (
			<FlexRow padded className={styles.GeneticProfileSelector}>
				<SectionHeader className="sectionLabel" promises={[this.store.geneticProfiles]}>
					Select Genomic Profiles:
				</SectionHeader>
				<div className={styles.group}>
					{this.renderGroup("MUTATION_EXTENDED", "Mutation")}
					{this.renderGroup("COPY_NUMBER_ALTERATION", "Copy Number")}
					{this.renderGroup("MRNA_EXPRESSION", "mRNA Expression")}
					{this.renderGroup("METHYLATION", "DNA Methylation")}
					{this.renderGroup("METHYLATION_BINARY", "DNA Methylation")}
					{this.renderGroup("PROTEIN_LEVEL", "Protein/phosphoprotein level")}
					{!!(this.store.geneticProfiles.isComplete && !this.store.geneticProfiles.result.length) && (
						<strong>No Genomic Profiles available for this Cancer Study</strong>
					)}
				</div>
			</FlexRow>
		);
	}

	ProfileToggle = ({profile, type, label, checked, isGroupToggle}: {
		profile:GeneticProfile,
		type:'radio' | 'checkbox',
		label:string,
		checked:boolean,
		isGroupToggle:boolean
	}) => (
		<label
			className={classNames({
				[styles.altType]: isGroupToggle,
				[styles.radio]: type === 'radio',
				[styles.checkbox]: type === 'checkbox',
			})}
		>
			<input
				type={type}
				checked={checked}
				onChange={event => this.store.selectGeneticProfile(profile, (event.target as HTMLInputElement).checked)}
			/>
			<span className={isGroupToggle ? styles.groupName : styles.profileName}>
				{label}
			</span>
			{!isGroupToggle && (
				<DefaultTooltip
					mouseEnterDelay={0}
					placement="right"
					overlay={<div className={styles.tooltip}>{profile.description}</div>}
				>
					<FontAwesome className={styles.infoIcon} name='question-circle'/>
				</DefaultTooltip>
			)}
		</label>
	)

	renderGroup(geneticAlterationType:GeneticProfile['geneticAlterationType'], groupLabel:string)
	{
		let profiles = this.store.getFilteredProfiles(geneticAlterationType);
		if (!profiles.length)
			return null;

		let groupProfileIds = profiles.map(profile => profile.geneticProfileId);
		let groupIsSelected = _.intersection(this.store.selectedProfileIds, groupProfileIds).length > 0;
		let output:JSX.Element[] = [];

		if (profiles.length > 1 && !this.store.forDownloadTab)
			output.push(
				<this.ProfileToggle
					key={'altTypeCheckbox:' + geneticAlterationType}
					profile={profiles[0]}
					type='checkbox'
					label={`${groupLabel}. Select one of the profiles below:`}
					checked={groupIsSelected}
					isGroupToggle={true}
				/>
			);

		let profileToggles = profiles.map(profile => (
			<this.ProfileToggle
				key={'profile:' + profile.geneticProfileId}
				profile={profile}
				type={this.store.forDownloadTab || profiles.length > 1 ? 'radio' : 'checkbox'}
				label={profile.name}
				checked={_.includes(this.store.selectedProfileIds, profile.geneticProfileId)}
				isGroupToggle={false}
			/>
		));

		if (this.store.forDownloadTab || profiles.length == 1)
			output.push(...profileToggles);
		else
			output.push(
				<div key={'group:' + geneticAlterationType} className={styles.group}>
					{profileToggles}
				</div>
			);

		if (this.store.forDownloadTab)
			return output;

		if (groupIsSelected && geneticAlterationType == 'MRNA_EXPRESSION')
		{
			output.push(
				<div key={output.length} className={styles.zScore}>
					Enter a z-score threshold <span dangerouslySetInnerHTML={{ __html:['&','plusmn;'].join('') }} />
					<input
						type="text"
						value={this.store.zScoreThreshold}
						onChange={event => {
							this.store.zScoreThreshold = (event.target as HTMLInputElement).value;
						}}
					/>
				</div>
			);
		}

		if (groupIsSelected && geneticAlterationType == 'PROTEIN_LEVEL')
		{
			output.push(
				<div key={output.length} className={styles.zScore}>
					Enter a z-score threshold <span dangerouslySetInnerHTML={{ __html:['&','plusmn;'].join('') }} />
					<input
						type="text"
						value={this.store.rppaScoreThreshold}
						onChange={event => {
							this.store.rppaScoreThreshold = (event.target as HTMLInputElement).value;
						}}
					/>
				</div>
			);
		}

		return output;
	}
}
