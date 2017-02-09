import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import queryStore from "./QueryStore";
import {toJS, computed} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/custom";
import {defaultSelectedAlterationTypes} from "./QueryStore";

const styles = styles_any as {
	GeneticProfileSelector: string,
	singleCheckbox: string,
	groupCheckbox: string,
	radioGroup: string,
	radioItem: string,
	zScore: string,
	profileName: string,
};

export const DATATYPE_ZSCORE = 'Z-SCORE';
export const geneticAlterationTypeGroupLabels:{[K in GeneticProfile['geneticAlterationType']]?: string} = {
	"MRNA_EXPRESSION": "mRNA Expression data",
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
		if (!this.store.singleSelectedStudyId
			|| !this.store.geneticProfiles.isComplete
			|| !this.store.geneticProfiles.result.length)
		{
			return null;
		}

		let checkboxes:JSX.Element[] = [];
		for (let profiles of this.store.geneticProfilesGroupedByType)
			this.renderGroup(profiles, checkboxes);

		return (
			<div className={styles.GeneticProfileSelector}>
				<h2>Select Genomic Profiles:</h2>
				{checkboxes}
			</div>
		);
	}

	renderGroup(profiles:GeneticProfile[], output:JSX.Element[])
	{
		if (!profiles.length)
			return;

		let firstProfile = profiles[0];
		let altType = firstProfile.geneticAlterationType;
		let ids = profiles.map(profile => profile.geneticProfileId);
		let checked = _.intersection(this.store.selectedProfileIds, ids).length > 0;
		let label = firstProfile.name;
		if (profiles.length > 1)
		{
			let groupLabel = geneticAlterationTypeGroupLabels[altType] || altType;
			label = `${groupLabel}. Select one of the profiles below:`;
		}

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
					{label}
				</LabeledCheckbox>

				{!!(profiles.length == 1) && (
					<FontAwesome name='question-circle' {...{alt: firstProfile.description}}/>
				)}
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
							</label>
							<FontAwesome name='question-circle' {...{alt: profile.description}}/>
						</div>
					))}
				</div>
			);
		}

		if (firstProfile.datatype == DATATYPE_ZSCORE && checked)
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
	}
}
