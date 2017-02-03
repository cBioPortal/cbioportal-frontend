import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "../../../../node_modules/mobx-react/index";

const styles = styles_any as {
	PatientCaseSetSelector: string,
	ReactSelect: string,
};

@observer
export default class PatientCaseSetSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		return (
			<div className={styles.PatientCaseSetSelector}>
				<h2>Select Patient/Case Set</h2>
				<ReactSelect
					className={styles.ReactSelect}
					value={'value'}
					options={[{label: 'label', value: 'value'}]}
					onChange={(option:{value:string}) => this.store.patientCaseSet = option.value}
				/>
				<a href={`/study?id=${this.store.singleSelectedStudyId}`}>To build your own case set, try out our enhanced Study View.</a>
			</div>
		);
	}
}
