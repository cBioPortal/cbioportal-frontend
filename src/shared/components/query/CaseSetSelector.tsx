import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import * as _ from 'lodash';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import {QueryStore, QueryStoreComponent, CUSTOM_CASE_LIST_ID, ALL_CASES_LIST_ID} from './QueryStore';
import {getStudySummaryUrl} from '../../api/urls';
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import SectionHeader from "../sectionHeader/SectionHeader";
import {ReactSelectOption} from "react-select";
import { getFilteredCustomCaseSets } from 'shared/components/query/CaseSetSelectorUtils';

const styles = styles_any as {
	CaseSetSelector: string,
	tooltip: string,
	radioRow: string,
};

export interface ReactSelectOptionWithName extends ReactSelectOption<any> {
	textLabel:string;
}

export function filterCaseSetOptions(opt: ReactSelectOptionWithName, filter: string) {
	return _.includes(opt.textLabel.toLowerCase(), filter.toLowerCase());
}

@observer
export default class CaseSetSelector extends QueryStoreComponent<{}, {}>
{
	@computed get caseSetOptions() : ReactSelectOptionWithName[]
	{
		let ret = this.store.sampleLists.result.map(sampleList => {
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
				value: sampleList.sampleListId,
				textLabel:sampleList.name
			};
		});

		let filteredcustomCaseSets = getFilteredCustomCaseSets(
			this.store.isVirtualStudyQuery,
			this.store.profiledSamplesCount.result);

		let customCaseSets = filteredcustomCaseSets.map(s => {
			return {
				value: s.value,
				label: (
					<DefaultTooltip
						placement="right"
						mouseEnterDelay={0}
						overlay={<div className={styles.tooltip}>{s.description}</div>}
					>
						<span>{s.name}</span>
					</DefaultTooltip>
				),
				textLabel: s.name
			}
		});

		return ret.concat(customCaseSets);
	}

	render()
	{
		if (!this.store.selectableSelectedStudyIds.length)
			return null;
		return (
			<FlexRow padded overflow className={styles.CaseSetSelector} data-test='CaseSetSelector'>
				<div>
				<SectionHeader className="sectionLabel"
							   secondaryComponent={<a href={getStudySummaryUrl(this.store.selectableSelectedStudyIds)} target="_blank">To build your own case set, try out our enhanced Study View.</a>}
							   promises={[this.store.sampleLists, this.store.asyncCustomCaseSet, this.store.profiledSamplesCount]}>
					Select Patient/Case Set:
				</SectionHeader>
				</div>
				<div>
				<ReactSelect
					value={this.store.selectedSampleListId}
					options={this.caseSetOptions}
					filterOption={filterCaseSetOptions}
					onChange={option => this.store.selectedSampleListId = option ? option.value : undefined}
					data-test='caseSetSelector'
				/>

				{!!(this.store.selectedSampleListId === CUSTOM_CASE_LIST_ID) && (
					<FlexCol padded>

						<div className={styles.radioRow}>
							<FlexRow padded>
								<this.CaseIdsModeRadio label='By sample ID' state='sample'/>
								<this.CaseIdsModeRadio label='By patient ID' state='patient'/>
							</FlexRow>
						</div>

						<span>Enter case IDs below:</span>
						<textarea
							title="Enter case IDs"
							rows={6}
							cols={80}
							value={this.store.caseIds}
							onChange={event => this.store.caseIds = event.currentTarget.value}
							data-test='CustomCaseSetInput'
						/>
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
