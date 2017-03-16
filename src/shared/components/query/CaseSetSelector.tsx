import * as React from 'react';
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexCol} from "../flexbox/FlexBox";
import {QueryStore, QueryStoreComponent} from "./QueryStore";
import {getStudyViewUrl} from "../../api/urls";

const styles = styles_any as {
	CaseSetSelector: string,
	ReactSelect: string,
};

const CUSTOM_CASE_LIST_ID = '';

@observer
export default class CaseSetSelector extends QueryStoreComponent<{}, {}>
{
	@computed get caseSetOptions()
	{
		return [
			...this.store.sampleLists.result.map(sampleList => {
				return {
					label: `${sampleList.name} (${sampleList.sampleCount})`,
					value: sampleList.sampleListId
				};
			}),
			{
				label: 'User-defined Case List',
				value: CUSTOM_CASE_LIST_ID
			}
		];
	}

	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		return (
			<FlexCol padded overflow className={styles.CaseSetSelector}>
				<h2>Select Patient/Case Set:</h2>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.store.selectedSampleListId}
					options={this.caseSetOptions}
					clearable={this.store.selectedSampleListId != this.store.defaultSelectedSampleListId}
					onChange={option => {
						let value = option ? option.value : undefined;
						this.store.selectedSampleListId = value === CUSTOM_CASE_LIST_ID ? '' : value;
					}}
				/>
				<a href={getStudyViewUrl(this.store.singleSelectedStudyId)}>To build your own case set, try out our enhanced Study View.</a>

				{!!(!this.store.selectedSampleListId) && (
					<FlexCol padded>
						<span>Enter case IDs below:</span>
						<textarea
							title="Enter case IDs"
							rows={6}
							cols={80}
							value={this.store.caseIds}
							onChange={event => this.store.caseIds = event.currentTarget.value}
						/>
						<this.CaseIdsModeRadio label='By sample ID' state='sample'/>
						<this.CaseIdsModeRadio label='By patient ID' state='patient'/>
					</FlexCol>
				)}
			</FlexCol>
		);
	}

	CaseIdsModeRadio = observer(
		(props: {label: string, state:QueryStore['caseIdsMode']}) => (
			<label>
				<input
					type="radio"
					checked={this.store.caseIdsMode == props.state}
					onChange={event => {
						if (event.currentTarget.checked)
							this.store.caseIdsMode = props.state;
					}}
				/>
				{props.label}
			</label>
		)
	);
}
