import * as _ from 'lodash';
import * as React from 'react';
import * as styles_any from './styles.module.scss';
import {QueryStore, QueryStoreComponent} from "./QueryStore";
import {toJS} from "mobx";
import {observer} from "mobx-react";
import {FlexRow} from "../flexbox/FlexBox";

const styles = styles_any as {
	DataTypePrioritySelector: string
};

@observer
export default class DataTypePrioritySelector extends QueryStoreComponent<{}, {}>
{
	render()
	{
		if (this.store.singleSelectedStudyId)
			return null;

		return (
			<FlexRow padded className={styles.DataTypePrioritySelector}>
				<h2>Select Data Type Priority:</h2>
				<this.DataTypePriorityRadio label='Mutation and CNA' state={{mutation: true, cna: true}}/>
				<this.DataTypePriorityRadio label='Only Mutation' state={{mutation: true, cna: false}}/>
				<this.DataTypePriorityRadio label='Only CNA' state={{mutation: false, cna: true}}/>
			</FlexRow>
		);
	}

	DataTypePriorityRadio = observer(
		(props: {label: string, state:QueryStore['dataTypePriority']}) => (
			<label>
				<input
					type="radio"
					checked={_.isEqual(toJS(this.store.dataTypePriority), props.state)}
					onChange={event => {
						if (event.currentTarget.checked)
							this.store.dataTypePriority = props.state;
					}}
				/>
				{props.label}
			</label>
		)
	);
}
