import * as _ from 'lodash';
import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import {QueryStore, QueryStoreComponent} from "./QueryStore";
import {toJS} from "mobx";
import {observer} from "mobx-react";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import SectionHeader from "../sectionHeader/SectionHeader";
import {remoteData} from "../../api/remoteData";
import {AlterationTypeConstants} from "../../../pages/resultsView/ResultsViewPageStore";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";

const styles = styles_any as {
	DataTypePrioritySelector: string,
	DataTypePriorityLabel: string,
};

@observer
export default class DataTypePrioritySelector extends QueryStoreComponent<{}, {}>
{
	render()
	{
		if (!this.store.isVirtualStudyQuery)
			return null;

		let flexRowContents:JSX.Element[] = [];
		flexRowContents.push(<LoadingIndicator key="loading" isLoading={this.profileAvailability.isPending}/>);
		if (this.profileAvailability.isError) {
			flexRowContents.push(<span key="error">Error loading profiles for selected studies.</span>);
		} else if (this.profileAvailability.isComplete) {
			flexRowContents = flexRowContents.concat(radioButtons(this.profileAvailability.result, this.store));
		}
		return (
			<FlexRow padded className={styles.DataTypePrioritySelector} data-test="dataTypePrioritySelector">
				<SectionHeader className="sectionLabel">Select Data Type Priority:</SectionHeader>
				<FlexRow>
					{flexRowContents}
				</FlexRow>
			</FlexRow>
		);
	}

	readonly profileAvailability = remoteData({
		await:()=>[this.store.molecularProfilesInSelectedStudies],
		invoke:()=>{
			return Promise.resolve(profileAvailability(this.store.molecularProfilesInSelectedStudies.result!));
		}
	});
}

export const DataTypePriorityRadio = observer(
	(props: {label: string, state:QueryStore['dataTypePriority'], store:QueryStore, dataTest:string}) => (
		<label className={styles.DataTypePriorityLabel}>
			<input
				type="radio"
				checked={_.isEqual(toJS(props.store.dataTypePriority), props.state)}
				onChange={event => {
					if (event.currentTarget.checked)
						props.store.dataTypePriority = props.state;
				}}
				data-test={props.dataTest}
			/>
			{props.label}
		</label>
	)
);

export function radioButtons(availability:{mutation:boolean, cna:boolean}, store:QueryStore):JSX.Element[] {
	let buttons = [];
	let hasBoth = false;
	if (availability.mutation && availability.cna) {
		buttons.push(
			<DataTypePriorityRadio
				key="MC"
				label='Mutation and CNA'
				state={{mutation: true, cna: true}}
				store={store}
				dataTest="MC"
			/>
		);
		hasBoth = true;
	}
	if (availability.mutation) {
		buttons.push(
			<DataTypePriorityRadio
				key="M"
				label={`${hasBoth ? 'Only ' : ''}Mutation`}
				state={{mutation:true, cna:false}}
				store={store}
				dataTest="M"
			/>
		);
	}
	if (availability.cna) {
		buttons.push(
			<DataTypePriorityRadio
				key="C"
				label={`${hasBoth ? 'Only ' : ''}CNA`}
				state={{mutation:false, cna:true}}
				store={store}
				dataTest="C"
			/>
		);
	}
	return buttons;
}

export function profileAvailability(molecularProfiles:MolecularProfile[]) {
	let hasMutationProfile = false;
	let hasCNAProfile = false;
	for (const profile of molecularProfiles) {
		if (!profile.showProfileInAnalysisTab)
			continue;

		switch (profile.molecularAlterationType) {
			case AlterationTypeConstants.MUTATION_EXTENDED:
				hasMutationProfile = true;
				break;
			case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
				hasCNAProfile = true;
				break;
		}

		if (hasMutationProfile && hasCNAProfile)
			break;
	}
	return {
		mutation: hasMutationProfile,
		cna: hasCNAProfile
	};
}
