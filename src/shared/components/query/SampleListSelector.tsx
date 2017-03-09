import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexCol} from "../flexbox/FlexBox";
import {QueryStore} from "./QueryStore";

const styles = styles_any as {
	SampleListSelector: string,
	ReactSelect: string,
};

@observer
export default class SampleListSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	@computed get sampleListOptions()
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
				value: ''
			}
		];
	}

	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		return (
			<FlexCol padded overflow className={styles.SampleListSelector}>
				<h2>Select Patient/Case Set:</h2>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.store.selectedSampleListId}
					options={this.sampleListOptions}
					onChange={option => this.store.selectedSampleListId = option ? option.value : undefined}
				/>
				<a href={`/study?id=${this.store.singleSelectedStudyId}`}>To build your own case set, try out our enhanced Study View.</a>

				{!!(!this.store.selectedSampleListId) && (
					<FlexCol>
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
			<label
			>
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
