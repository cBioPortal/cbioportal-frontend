import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import {observer} from "mobx-react";
import FontAwesome from "react-fontawesome";
import ReactSelect from 'react-select';
import {GeneReplacement, QueryStoreComponent} from "./QueryStore";

const styles = styles_any as {
	GeneSymbolValidator: string,
	pendingMessage: string,
	errorMessage: string,
	validBubble: string,
	invalidBubble: string,
	suggestionBubble: string,
	icon: string,
	noChoiceLabel: string,
	singleChoiceLabel: string,
	multiChoiceLabel: string,
};

@observer
export default class GeneSymbolValidator extends QueryStoreComponent<{}, {}>
{
	render()
	{
		if (this.store.oql.error)
			return (
				<div className={styles.GeneSymbolValidator}>
					<span className={styles.errorMessage}>
						{`Cannot validate gene symbols because of invalid OQL. ${
							this.store.geneQueryErrorDisplayStatus === 'unfocused'
							? "Please click 'Submit' to see location of error."
							: this.store.oql.error.message
						}`}
					</span>
				</div>
			);

		if (!this.store.oql.query.length)
			return null;

		if (this.store.genes.isError)
			return (
				<div className={styles.GeneSymbolValidator}>
					<span className={styles.pendingMessage}>
						Unable to validate gene symbols.
					</span>
				</div>
			);

		if (this.store.genes.isPending && this.store.genes.result.suggestions.length == 0)
			return (
				<div className={styles.GeneSymbolValidator}>
					<span className={styles.pendingMessage}>
						Validating gene symbols...
					</span>
				</div>
			);

		if (this.store.genes.result.suggestions.length)
			return (
				<div className={styles.GeneSymbolValidator}>
					<div className={styles.invalidBubble} title="Please edit the gene symbols.">
						<FontAwesome className={styles.icon} name='exclamation-circle'/>
						<span>Invalid gene symbols.</span>
					</div>

					{this.store.genes.result.suggestions.map(this.renderSuggestion, this)}
				</div>
			);

		return (
			<div className={styles.GeneSymbolValidator}>
				<div className={styles.validBubble} title="You can now submit the list.">
					<FontAwesome className={styles.icon} name='check-circle'/>
					<span>All gene symbols are valid.</span>
				</div>
			</div>
		);
	}

	renderSuggestion({alias, genes}:GeneReplacement, key:number)
	{
		if (genes.length == 0)
		{
			let title = 'Could not find gene symbol. Click to remove it from the gene list.';
			let onClick = () => this.store.replaceGene(alias, '');
			return (
				<div key={key} className={styles.suggestionBubble} title={title} onClick={onClick}>
					<FontAwesome className={styles.icon} name='times-circle'/>
					<span className={styles.noChoiceLabel}>{alias}</span>
				</div>
			);
		}

		if (genes.length == 1)
		{
			let {hugoGeneSymbol} = genes[0];
			let title = `'${alias}' is a synonym for '${hugoGeneSymbol}'. Click here to replace it with the official symbol.`;
			let onClick = () => this.store.replaceGene(alias, hugoGeneSymbol);
			return (
				<div key={key} className={styles.suggestionBubble} title={title} onClick={onClick}>
					<FontAwesome className={styles.icon} name='question'/>
					<span className={styles.singleChoiceLabel}>{alias}</span>
					<span>{`: ${hugoGeneSymbol}`}</span>
				</div>
			);
		}

		let title = 'Ambiguous gene symbol. Click on one of the alternatives to replace it.';
		let options = genes.map(gene => ({
			label: gene.hugoGeneSymbol,
			value: gene.hugoGeneSymbol
		}));
		return (
			<div key={key} className={styles.suggestionBubble} title={title}>
				<FontAwesome className={styles.icon} name='question'/>
				<span className={styles.multiChoiceLabel}>{alias}</span>
				<span>{': '}</span>
				<ReactSelect
					placeholder='select a symbol'
					options={options}
					onChange={option => option && this.store.replaceGene(alias, option.value)}
					autosize
				/>
			</div>
		);
	}
}
