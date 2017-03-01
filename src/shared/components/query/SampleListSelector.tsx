import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
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

	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		let options = this.store.sampleLists.result.map(sampleList => {
			return {
				label: `${sampleList.name} (${sampleList.sampleCount})`,
				value: sampleList.sampleListId
			};
		}).concat([{
			label: 'User-defined Case List',
			value: ''
		}]);

		const CaseIdsModeRadio = this.CaseIdsModeRadio;

		return (
			<div className={styles.SampleListSelector}>
				<h2>Select Patient/Case Set:</h2>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.store.selectedSampleListId}
					options={options}
					onChange={(option:{value:string}) => this.store.selectedSampleListId = option.value}
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
							onChange={event => {
								this.store.caseIds = (event.target as HTMLTextAreaElement).value;
							}}
						/>
						<CaseIdsModeRadio label='By sample ID' state='sample'/>
						<CaseIdsModeRadio label='By patient ID' state='patient'/>
					</FlexCol>
				)}
			</div>
		);
	}

	CaseIdsModeRadio = observer((props: {label: string, state:QueryStore['caseIdsMode']}) =>
	{
		return (
			<label>
				<input
					type="radio"
					checked={this.store.caseIdsMode == props.state}
					onChange={event => {
						if ((event.target as HTMLInputElement).checked)
							this.store.caseIdsMode = props.state;
					}}
				/>
				{props.label}
			</label>
		);
	});
}
