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
		flexRowContents.push(<LoadingIndicator key="loading" isLoading={this.store.profileAvailability.isPending}/>);
		if (this.store.profileAvailability.isError) {
			flexRowContents.push(<span key="error">Error loading profiles for selected studies.</span>);
		} else if (this.store.profileAvailability.isComplete) {
			flexRowContents = flexRowContents.concat(checkBoxes(this.store.profileAvailability.result, this.store));
		}
		return (
			<FlexRow padded className={styles.DataTypePrioritySelector} data-test="dataTypePrioritySelector">
				<SectionHeader className="sectionLabel">Select Molecular Profiles:</SectionHeader>
				<FlexRow>
					{flexRowContents}
				</FlexRow>
			</FlexRow>
		);
	}


}

export const DataTypePriorityCheckBox = observer(
	(props: {label: string, state:'mutation' | 'cna', store:QueryStore, dataTest:string}) => (
		<label className={styles.DataTypePriorityLabel}>
			<input
				type="checkbox"
				checked={props.store.dataTypePriority[props.state] || false}
				onChange={event => {
					props.store.dataTypePriority[props.state] = event.currentTarget.checked;
				}}
				data-test={props.dataTest}
			/>
			{props.label}
		</label>
	)
);

export function checkBoxes(availability:{mutation:boolean, cna:boolean}, store:QueryStore):JSX.Element[] {
	let buttons = [];
	if (availability.mutation) {
		buttons.push(
			<DataTypePriorityCheckBox
				key="M"
				label={"Mutation"}
				state={"mutation"}
				store={store}
				dataTest="M"
			/>
		);
	}
	if (availability.cna) {
		buttons.push(
			<DataTypePriorityCheckBox
				key="C"
				label={"Copy number alterations"}
				state={"cna"}
				store={store}
				dataTest="C"
			/>
		);
	}
	return buttons;
}


