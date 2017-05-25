import * as _ from 'lodash';
import * as React from 'react';
import * as styles_any from './styles.module.scss';
import {QueryStore, QueryStoreComponent} from "./QueryStore";
import {toJS} from "mobx";
import {observer} from "mobx-react";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import SectionHeader from "../sectionHeader/SectionHeader";

const styles = styles_any as {
	DataTypePrioritySelector: string,
	DataTypePriorityLabel: string,
};

@observer
export default class DataTypePrioritySelector extends QueryStoreComponent<{}, {}>
{
	render()
	{
		if (!this.store.isVirtualCohortQuery)
			return null;

		return (
			<FlexRow padded className={styles.DataTypePrioritySelector}>
				<SectionHeader className="sectionLabel">Select Data Type Priority:</SectionHeader>

				<FlexRow>
					<this.DataTypePriorityRadio label='Mutation and CNA' state={{mutation: true, cna: true}}/>
					<this.DataTypePriorityRadio label='Only Mutation' state={{mutation: true, cna: false}}/>
					<this.DataTypePriorityRadio label='Only CNA' state={{mutation: false, cna: true}}/>
				</FlexRow>

			</FlexRow>
		);
	}

	DataTypePriorityRadio = observer(
		(props: {label: string, state:QueryStore['dataTypePriority']}) => (
			<label className={styles.DataTypePriorityLabel}>
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
