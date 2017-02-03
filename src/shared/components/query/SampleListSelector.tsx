import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "../../../../node_modules/mobx-react/index";

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
				label: `${sampleList.name} ({sampleList.count})`,
				value: sampleList.sampleListId
			};
		});

		return (
			<div className={styles.SampleListSelector}>
				<h2>Select Patient/Case Set</h2>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.store.selectedSampleListId}
					options={options}
					onChange={(option:{value:string}) => this.store.selectedSampleListId = option.value}
				/>
				<a href={`/study?id=${this.store.singleSelectedStudyId}`}>To build your own case set, try out our enhanced Study View.</a>
			</div>
		);
	}
}
