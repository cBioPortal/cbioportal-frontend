import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import queryStore from "./QueryStore";
import {toJS, computed} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/custom";

const styles = styles_any as {
	GeneticProfileSelector: string,
	singleCheckbox: string,
	groupCheckbox: string,
	radioGroup: string,
	radioItem: string,
	zScore: string,
	groupName: string,
	profileName: string,
};

@observer
export default class GeneticProfileSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		if (!this.store.singleSelectedStudyId || !this.store.geneticProfiles.isComplete)
			return null;

		return (
			<div className={styles.GeneticProfileSelector}>
				<h2>Select Genomic Profiles:</h2>
				{[
					this.renderGroup("MUTATION_EXTENDED", "Mutation"),
					this.renderGroup("COPY_NUMBER_ALTERATION", "Copy Number"),
					this.renderGroup("MRNA_EXPRESSION", "mRNA Expression"),
					this.renderGroup("METHYLATION", "DNA Methylation"),
					this.renderGroup("METHYLATION_BINARY", "DNA Methylation"),
					this.renderGroup("PROTEIN_LEVEL", "Protein/phosphoprotein level"),
				]}
				{!!(!this.store.geneticProfiles.result.length) && (
					<strong>No Genomic Profiles available for this Cancer Study</strong>
				)}
			</div>
		);
	}

	renderGroup(geneticAlterationType:GeneticProfile['geneticAlterationType'], groupLabel:string)
	{
		let profiles = this.store.getFilteredProfiles(geneticAlterationType);
		if (!profiles.length)
			return null;

		let ids = profiles.map(profile => profile.geneticProfileId);
		let checked = _.intersection(this.store.selectedProfileIds, ids).length > 0;
		let label;
		if (profiles.length == 1)
			label = profiles[0].name;
		else
			label = `${groupLabel}. Select one of the profiles below:`;

		let output = [];
		output.push(
			<div key={output.length} className={profiles.length > 1 ? styles.groupCheckbox : styles.singleCheckbox}>
				<LabeledCheckbox
					checked={checked}
					inputProps={{
						onChange: event => {
							this.store.selectedProfileIds = (
								(event.target as HTMLInputElement).checked
								?   _.union(this.store.selectedProfileIds, [ids[0]])
								:   _.difference(this.store.selectedProfileIds, ids)
							);
						}
					}}
				>
					<span className={profiles.length > 1 ? styles.groupName : styles.profileName}>{label}</span>
					{!!(profiles.length == 1) && (
						<FontAwesome name='question-circle' {...{title: profiles[0].description}}/>
					)}
				</LabeledCheckbox>

			</div>
		);

		if (profiles.length > 1)
		{
			output.push(
				<div key={output.length} className={styles.radioGroup}>
					{profiles.map((profile, profileIndex) => (
						<div key={profileIndex} className={styles.radioItem}>
							<label>
								<input
									type='radio'
									checked={_.includes(this.store.selectedProfileIds, profile.geneticProfileId)}
									onChange={event => {
										if ((event.target as HTMLInputElement).checked)
											this.store.selectedProfileIds = (
												_.union(
													_.difference(this.store.selectedProfileIds, ids),
													[profile.geneticProfileId]
												)
											);
									}}
								/>
								<span className={styles.profileName}>{profile.name}</span>
								<FontAwesome name='question-circle' {...{title: profile.description}}/>
							</label>
						</div>
					))}
				</div>
			);
		}

		if (checked && geneticAlterationType == 'MRNA_EXPRESSION')
		{
			output.push(
				<div key={output.length} className={styles.zScore}>
					Enter a z-score threshold ±:
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

		if (checked && geneticAlterationType == 'PROTEIN_LEVEL')
		{
			output.push(
				<div key={output.length} className={styles.zScore}>
					Enter a z-score threshold ±:
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
