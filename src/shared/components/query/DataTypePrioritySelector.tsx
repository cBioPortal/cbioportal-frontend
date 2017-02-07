import * as _ from 'lodash';
import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import {QueryStore} from "./QueryStore";
import {toJS} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/index";
import {FlexRow} from "../flexbox/FlexBox";

const styles = styles_any as {
	DataTypePrioritySelector: string
};

@observer
export default class DataTypePrioritySelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		if (this.store.singleSelectedStudyId)
			return null;

		const DataTypePriorityRadio = this.DataTypePriorityRadio;
		return (
			<FlexRow padded className={styles.DataTypePrioritySelector}>
				<h2>Select Data Type Priority:</h2>
				<DataTypePriorityRadio label='Mutation and CNA' state={{mutation: true, cna: true}}/>
				<DataTypePriorityRadio label='Only Mutation' state={{mutation: true, cna: false}}/>
				<DataTypePriorityRadio label='Only CNA' state={{mutation: false, cna: true}}/>
			</FlexRow>
		);
	}

	DataTypePriorityRadio = observer((props: {label: string, state:QueryStore['dataTypePriority']}) =>
	{
		return (
			<label>
				<input
					type="radio"
					checked={_.isEqual(toJS(this.store.dataTypePriority), props.state)}
					onChange={event => {
						if ((event.target as HTMLInputElement).checked)
							this.store.dataTypePriority = props.state
					}}
				/>
				{props.label}
			</label>
		);
	});
}
