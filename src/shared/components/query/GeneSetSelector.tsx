import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "../../../../node_modules/mobx-react/index";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";

const styles = styles_any as {
	GeneSetSelector: string,
	ReactSelect: string,
};

@observer
export default class GeneSetSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		return (
			<FlexCol padded className={styles.GeneSetSelector}>
				<h2>Enter Gene Set</h2>
				<a href='/onco_query_lang_desc.jsp'>Advanced: Onco Query Language (OQL)</a>
				<ReactSelect
					className={styles.ReactSelect}
					value={'value'}
					options={[{label: 'label', value: 'value'}]}
					onChange={(option:{value:string}) => this.store.patientCaseSet = option.value}
				/>
				<FlexRow padded>
					<button>Select from Recurrently Mutated Genes (MutSig)</button>
					<button>Select Genes from Recurrent CNAs (Gistic)</button>
				</FlexRow>
				<input
					type='text'
					onChange={event => {
						this.store.geneSet = (event.target as HTMLInputElement).value;
					}}
				/>
			</FlexCol>
		);
	}
}
