import * as React from 'react';
import styles from "shared/components/GeneSelectionBox/styles.module.scss";
import FontAwesome from "react-fontawesome";
import {GeneValidationResult} from "shared/components/GeneSelectionBox/GeneSymbolValidator";
import {OQL} from "shared/components/GeneSelectionBox/GeneSelectionBox";
import {GeneReplacement, normalizeQuery} from "shared/components/query/QueryStore";
import ReactSelect from "react-select";
import classNames from 'classnames';
import {Gene} from "shared/api/generated/CBioPortalAPI";

export type GeneSymbolValidatorMessageProps = {
    errorMessageOnly?: boolean;
    oql: OQL | Error;
    validatingGenes: boolean;
    genes: GeneValidationResult | Error;
    wrapTheContent?: boolean;
    replaceGene: ReplaceGene
}

export type ReplaceGene = (oldSymbol: string, newSymbol: string) => void

type RenderSuggestionProps = GeneReplacement & {
    replaceGene: ReplaceGene
}

const RenderSuggestion = function (props:RenderSuggestionProps) {
    if (props.genes.length == 0) {
        let title = 'Could not find gene symbol. Click to remove it from the gene list.';
        let onClick = () => props.replaceGene(props.alias, '');
        return (
            <div  className={styles.suggestionBubble} title={title} onClick={onClick}>
                <FontAwesome className={styles.icon} name='times-circle'/>
                <span className={styles.noChoiceLabel}>{props.alias}</span>
            </div>
        );
    }

    if (props.genes.length == 1) {
        let {hugoGeneSymbol} = props.genes[0];
        let title = `'${props.alias}' is a synonym for '${hugoGeneSymbol}'. Click here to replace it with the official symbol.`;
        let onClick = () => props.replaceGene(props.alias, hugoGeneSymbol);
        return (
            <div  className={styles.suggestionBubble} title={title} onClick={onClick}>
                <FontAwesome className={styles.icon} name='question'/>
                <span className={styles.singleChoiceLabel}>{props.alias}</span>
                <span>{`: ${hugoGeneSymbol}`}</span>
            </div>
        );
    }

    let title = 'Ambiguous gene symbol. Click on one of the alternatives to replace it.';
    let options = props.genes.map(gene => ({
        label: gene.hugoGeneSymbol,
        value: gene.hugoGeneSymbol
    }));
    return (
        <div  className={styles.suggestionBubble} title={title}>
            <FontAwesome className={styles.icon} name='question'/>
            <span className={styles.multiChoiceLabel}>{props.alias}</span>
            <span>{': '}</span>
            <ReactSelect
                placeholder='select a symbol'
                options={options}
                onChange={(option: any) => option && props.replaceGene(props.alias, option.value)}
                autosize
            />
        </div>
    );
};

const GeneSymbolValidatorMessageChild = (props: GeneSymbolValidatorMessageProps) => {
    if (props.oql instanceof Error) {
        return (
            <div className={styles.GeneSymbolValidator}>
                <span className={styles.errorMessage}>
                    {`Cannot validate gene symbols because of invalid OQL. ${props.oql.message}`}
                </span>
            </div>
        );
    }

    if (props.oql.query.length === 0) {
        return null;
    }

    if (!props.errorMessageOnly && props.validatingGenes) {
        return (
            <div className={styles.GeneSymbolValidator}>
					<span className={styles.pendingMessage}>
						Validating gene symbols...
					</span>
            </div>
        );
    }

    if (props.genes instanceof Error) {
        return (
            <div className={styles.GeneSymbolValidator}>
					<span className={styles.pendingMessage}>
						Unable to validate gene symbols.
					</span>
            </div>
        );
    }

    if (props.genes.suggestions.length > 0) {
        return (
            <div className={styles.GeneSymbolValidator}>
                <div className={styles.invalidBubble} title="Please edit the gene symbols.">
                    <FontAwesome className={styles.icon} name='exclamation-circle'/>
                    <span>Invalid gene symbols.</span>
                </div>

                {props.genes.suggestions.map((suggestion, index) => <RenderSuggestion key={index}
                                                                                      genes={suggestion.genes}
                                                                                      alias={suggestion.alias}
                                                                                      replaceGene={props.replaceGene}/>)}
            </div>
        );
    }
    if (props.errorMessageOnly) {
        return null;
    }
    return (
        <div className={classNames(styles.GeneSymbolValidator, {[styles.nowrap]: !props.wrapTheContent})}>
            <div className={styles.validBubble} title="You can now submit the list.">
                <FontAwesome className={styles.icon} name='check-circle'/>
                <span>All gene symbols are valid.</span>
            </div>
        </div>
    );
};

const GeneSymbolValidatorMessage = (props: GeneSymbolValidatorMessageProps) => {
    return <div id="geneBoxValidationStatus">
        <GeneSymbolValidatorMessageChild {...props}/>
    </div>
};

GeneSymbolValidatorMessage.defaultProps = {
    errorMessageOnly: false,
    wrapTheContent: false
};

export default React.memo(GeneSymbolValidatorMessage);