import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "../../../../node_modules/mobx-react/index";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';

const styles = styles_any as {
	GeneSetSelector: string,
	ReactSelect: string,
	geneSet: string,
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
		let options = gene_lists.map(item => ({label: item.id, value: item.genes.join(' ')}));

		return (
			<FlexCol padded overflow className={styles.GeneSetSelector}>
				<h2>Enter Gene Set</h2>
				<a href='/onco_query_lang_desc.jsp'>Advanced: Onco Query Language (OQL)</a>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.store.geneSet}
					options={options}
					onChange={(option:{value:string}) => this.store.geneSet = option.value}
				/>
				<FlexRow padded>
					<button>Select from Recurrently Mutated Genes (MutSig)</button>
					<button>Select Genes from Recurrent CNAs (Gistic)</button>
				</FlexRow>
				<textarea
					className={styles.geneSet}
					rows={5}
					cols={80}
					placeholder="Enter HUGO Gene Symbols or Gene Aliases"
					title="Enter HUGO Gene Symbols or Gene Aliases"
					value={this.store.geneSet}
					onChange={event => {
						this.store.geneSet = (event.target as HTMLTextAreaElement).value;
					}}
				/>
			</FlexCol>
		);
	}
}
