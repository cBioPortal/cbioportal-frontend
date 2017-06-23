import * as React from 'react';
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import {QueryStore, QueryStoreComponent, CUSTOM_CASE_LIST_ID} from "./QueryStore";
import {getStudyViewUrl} from "../../api/urls";
import DefaultTooltip from "../DefaultTooltip";
import SectionHeader from "../sectionHeader/SectionHeader";

const styles = styles_any as {
	CaseSetSelector: string,
	tooltip: string,
	radioRow: string,
};

@observer
export default class CaseSetSelector extends QueryStoreComponent<{}, {}>
{
	@computed get caseSetOptions()
	{
		return [
			...this.store.sampleLists.result.map(sampleList => {
				return {
					label: (
						<DefaultTooltip
							placement="right"
							mouseEnterDelay={0}
							overlay={<div className={styles.tooltip}>{sampleList.description}</div>}
						>
							<span>{`${sampleList.name} (${sampleList.sampleCount})`}</span>
						</DefaultTooltip>
					),
					value: sampleList.sampleListId
				};
			}),
			{
				label: (
					<DefaultTooltip
						placement="right"
						mouseEnterDelay={0}
						overlay={<div className={styles.tooltip}>Specify your own case list</div>}
					>
						<span>User-defined Case List</span>
					</DefaultTooltip>
				),
				value: CUSTOM_CASE_LIST_ID
			}
		];
	}

	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		return (
			<FlexRow padded overflow className={styles.CaseSetSelector}>
				<div>
				<SectionHeader className="sectionLabel"
							   secondaryComponent={<a href={getStudyViewUrl(this.store.singleSelectedStudyId)}>To build your own case set, try out our enhanced Study View.</a>}
							   promises={[this.store.sampleLists, this.store.asyncCustomCaseSet]}>
					Select Patient/Case Set:
				</SectionHeader>
				</div>
				<div className="sectionContent">
				<ReactSelect
					value={this.store.selectedSampleListId}
					options={this.caseSetOptions}
					clearable={this.store.selectedSampleListId != this.store.defaultSelectedSampleListId}
					onChange={option => this.store.selectedSampleListId = option ? option.value : undefined}
				/>

				{!!(this.store.selectedSampleListId === CUSTOM_CASE_LIST_ID) && (
					<FlexCol padded>
						<span>Enter case IDs below:</span>
						<textarea
							title="Enter case IDs"
							rows={6}
							cols={80}
							value={this.store.caseIds}
							onChange={event => this.store.caseIds = event.currentTarget.value}
						/>
						<div className={styles.radioRow}>
							<FlexCol padded>
								<this.CaseIdsModeRadio label='By sample ID' state='sample'/>
								<this.CaseIdsModeRadio label='By patient ID' state='patient'/>
							</FlexCol>
						</div>
					</FlexCol>
				)}
				</div>
			</FlexRow>
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
