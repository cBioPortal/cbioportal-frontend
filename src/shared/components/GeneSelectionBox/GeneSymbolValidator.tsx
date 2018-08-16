import * as React from 'react';
import styles from "./styles.module.scss";
import {observer} from "mobx-react";
import FontAwesome from "react-fontawesome";
import ReactSelect from 'react-select';
import { DisplayStatus } from './GeneSelectionBox';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import MobxPromise from '../../../../node_modules/mobxpromise';
import { GeneReplacement, normalizeQuery } from 'shared/components/query/QueryStore';
import { action, computed } from '../../../../node_modules/mobx';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import 'react-select/dist/react-select.css';

export interface IGeneSymbolValidatorProps {
	oql:{
        query: SingleGeneQuery[],
        error?: { start: number, end: number, message: string }
    }
	geneQueryErrorDisplayStatus?: DisplayStatus;
	genes:MobxPromise<{
        found: Gene[];
        suggestions: GeneReplacement[];
	}>,
	geneQuery:string;
	updateGeneQuery:(query:string)=>void;
	hideSuccessMessage?:boolean
}

@observer
export default class GeneSymbolValidator extends React.Component<IGeneSymbolValidatorProps, {}> {

	@computed get message(){
		if (this.props.oql.error)
			return (
				<div className={styles.GeneSymbolValidator}>
					<span className={styles.errorMessage}>
						{`Cannot validate gene symbols because of invalid OQL. ${
							this.props.geneQueryErrorDisplayStatus === DisplayStatus.UNFOCUSED
							? "Please click 'Submit' to see location of error."
							: this.props.oql.error.message
						}`}
					</span>
				</div>
			);

		if (!this.props.oql.query.length)
			return null;

		if (this.props.genes.isError)
			return (
				<div className={styles.GeneSymbolValidator}>
					<span className={styles.pendingMessage}>
						Unable to validate gene symbols.
					</span>
				</div>
			);

		if (this.props.genes.isPending && this.props.genes.result!.suggestions.length == 0)
			return (
				<div className={styles.GeneSymbolValidator}>
					<span className={styles.pendingMessage}>
						Validating gene symbols...
					</span>
				</div>
			);

		if (this.props.genes.result!.suggestions.length)
			return (
				<div className={styles.GeneSymbolValidator}>
					<div className={styles.invalidBubble} title="Please edit the gene symbols.">
						<FontAwesome className={styles.icon} name='exclamation-circle'/>
						<span>Invalid gene symbols.</span>
					</div>

					{this.props.genes.result!.suggestions.map(this.renderSuggestion, this)}
				</div>
			);
			
		if(this.props.hideSuccessMessage)
		    return null;

		return (
			<div className={styles.GeneSymbolValidator}>
				<div className={styles.validBubble} title="You can now submit the list.">
					<FontAwesome className={styles.icon} name='check-circle'/>
					<span>All gene symbols are valid.</span>
				</div>
			</div>
		);

	}
	render()
	{
		return(
			<div id="geneBoxValidationStatus">
			    {this.message}
			</div>
		)
		
	}

    @action private replaceGene(oldSymbol: string, newSymbol: string) {
		
		let updatedQuery = normalizeQuery(
			this.props.geneQuery
				.toUpperCase()
				.replace(new RegExp(`\\b${oldSymbol.toUpperCase()}\\b`, 'g'), () => newSymbol.toUpperCase()));
		this.props.updateGeneQuery(updatedQuery);
    }

	renderSuggestion({alias, genes}:GeneReplacement, key:number)
	{
		if (genes.length == 0)
		{
			let title = 'Could not find gene symbol. Click to remove it from the gene list.';
			let onClick = () => this.replaceGene(alias, '');
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
			let onClick = () => this.replaceGene(alias, hugoGeneSymbol);
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
					onChange={option => option && this.replaceGene(alias, option.value)}
					autosize
				/>
			</div>
		);
	}
}
