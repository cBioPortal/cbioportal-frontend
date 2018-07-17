import * as React from 'react';
import * as _ from 'lodash';
import { observer } from "mobx-react";
import classnames from 'classnames';
import styles from "./styles.module.scss";
import { observable, computed, action, reaction } from 'mobx';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery, SyntaxError } from 'shared/lib/oql/oql-parser';
import { parseOQLQuery } from 'shared/lib/oql/oqlfilter';
import { remoteData } from 'shared/api/remoteData';
import { debounceAsync } from 'mobxpromise';
import { GeneReplacement } from 'shared/components/query/QueryStore';
import memoize from 'memoize-weak-decorator';
import client from "shared/api/cbioportalClientInstance";
import { getFocusOutText } from './GeneSelectionBoxUtils';
import GeneSymbolValidator from './GeneSymbolValidator';
import { bind } from '../../../../node_modules/bind-decorator';

export interface IGeneSelectionBoxProps {
    inputGeneQuery?: string;
    geneQueryErrorDisplayStatus?: DisplayStatus;
    location?: GeneBoxType;
    callback?: (
        oql: {
            query: SingleGeneQuery[],
            error?: { start: number, end: number, message: string }
        }, genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string,
        status: "pending" | "error" | "complete") => void;
}

export enum DisplayStatus {
    UNFOCUSED,
    SHOULD_FOCUS,
    FOCUSED
}
export enum GeneBoxType {
    DEFAULT,
    STUDY_VIEW_PAGE
}

function isInteger(str: string) {
    return Number.isInteger(Number(str));
}

@observer
export default class GeneSelectionBox extends React.Component<IGeneSelectionBoxProps, {}> {

    @observable private geneQuery = '';
    @observable private geneQueryErrorDisplayStatus: DisplayStatus = DisplayStatus.UNFOCUSED;
    @observable private isFocused = false;

    constructor(props: IGeneSelectionBoxProps) {
        super(props);
        this.geneQuery = this.props.inputGeneQuery || '';
        reaction(() => this.genes.status, status => {
            this.props.callback && this.props.callback(this.oql, this.genes.result, this.geneQuery, status);
        });
    }

    componentDidMount() {
        reaction(
            () => this.props.inputGeneQuery,
            inputGeneQuery => {
                if ((inputGeneQuery || '').toUpperCase() !== this.geneQuery.toUpperCase())
                    this.geneQuery = (inputGeneQuery || '').trim();
            },
            { fireImmediately: true }
        );
    }

    @bind
    @action private updateGeneQuery(value: string) {
        // clear error when gene query is modified
        this.geneQueryErrorDisplayStatus = DisplayStatus.UNFOCUSED;
        this.geneQuery = value;
    }

    @computed private get hasErrors() {
        return !_.isUndefined(this.oql.error) ||
            this.genes.result.suggestions.length > 0;
    }

    @computed private get textAreaRef() {
        if (this.props.geneQueryErrorDisplayStatus === DisplayStatus.SHOULD_FOCUS)
            return (textArea: HTMLTextAreaElement) => {
                let { error } = this.oql;
                if (textArea && error) {
                    textArea.focus();
                    textArea.setSelectionRange(error.start, error.end);
                    this.geneQueryErrorDisplayStatus = DisplayStatus.FOCUSED;
                }
            };
    }

    @computed get oql(): {
        query: SingleGeneQuery[],
        error?: { start: number, end: number, message: string }
    } {
        try {
            return {
                query: this.geneQuery ? parseOQLQuery(this.geneQuery.trim().toUpperCase()) : [],
                error: undefined
            };
        }
        catch (error) {
            if (error.name !== 'SyntaxError')
                return {
                    query: [],
                    error: { start: 0, end: 0, message: `Unexpected ${error}` }
                };

            let { offset } = error as SyntaxError;
            let near, start, end;
            if (offset === this.geneQuery.length)
                [near, start, end] = ['after', offset - 1, offset];
            else if (offset === 0)
                [near, start, end] = ['before', offset, offset + 1];
            else
                [near, start, end] = ['at', offset, offset + 1];
            let message = `OQL syntax error ${near} selected character; please fix and submit again.`;
            return {
                query: [],
                error: { start, end, message }
            };
        }
    }

    @computed private get geneIds(): string[] {
        return this.oql.error ? [] : this.oql.query.map(line => line.gene);
    }

    @memoize
    private async getGeneSuggestions(alias: string): Promise<GeneReplacement> {
        return {
            alias,
            genes: await client.getAllGenesUsingGET({ alias })
        };
    }

    private invokeGenesLater = debounceAsync(
        async (geneIds: string[]): Promise<{ found: Gene[], suggestions: GeneReplacement[] }> => {
            let [entrezIds, hugoIds] = _.partition(_.uniq(geneIds), isInteger);

            let getEntrezResults = async () => {
                let found: Gene[];
                if (entrezIds.length)
                    found = await client.fetchGenesUsingPOST({ geneIdType: "ENTREZ_GENE_ID", geneIds: entrezIds });
                else
                    found = [];
                let missingIds = _.difference(entrezIds, found.map(gene => gene.entrezGeneId + ''));
                let removals = missingIds.map(entrezId => ({ alias: entrezId, genes: [] }));
                let replacements = found.map(gene => ({ alias: gene.entrezGeneId + '', genes: [gene] }));
                let suggestions = [...removals, ...replacements];
                return { found, suggestions };
            };

            let getHugoResults = async () => {
                let found: Gene[];
                if (hugoIds.length)
                    found = await client.fetchGenesUsingPOST({ geneIdType: "HUGO_GENE_SYMBOL", geneIds: hugoIds });
                else
                    found = [];
                let missingIds = _.difference(hugoIds, found.map(gene => gene.hugoGeneSymbol));
                let suggestions = await Promise.all(missingIds.map(alias => this.getGeneSuggestions(alias)));
                return { found, suggestions };
            };

            let [entrezResults, hugoResults] = await Promise.all([getEntrezResults(), getHugoResults()]);
            return {
                found: [...entrezResults.found, ...hugoResults.found],
                suggestions: [...entrezResults.suggestions, ...hugoResults.suggestions]
            };
        },
        500
    );

    private readonly genes = remoteData({
        invoke: () => this.invokeGenesLater(this.geneIds),
        default: { found: [], suggestions: [] }
    });

    @computed private get placeHolder() {
        return (this.props.location === GeneBoxType.STUDY_VIEW_PAGE && !this.isFocused) ?
            'query genes - click to expand' :
            'Enter HUGO Gene Symbols or Gene Aliases';
    }

    @computed get focusOutValue() {
        return getFocusOutText(this.geneIds);
    }

    @computed private get textAreaClasses() {
        let classNames: string[] = [];

        if (this.props.location === GeneBoxType.STUDY_VIEW_PAGE) {
            classNames.push(styles.studyView);
            if (this.isFocused || this.hasErrors) {
                classNames.push(styles.studyViewFocus);
            }
        } else {
            classNames.push(styles.default);
        }
        this.geneQuery ? classNames.push(styles.notEmpty) : classNames.push(styles.empty);
        return classNames;
    }

    @computed private get showValidationBox() {
        return this.props.location !== GeneBoxType.STUDY_VIEW_PAGE || this.hasErrors || this.isFocused;
    }

    render() {
        return (
            <div className={styles.genesSelection}>
                <textarea
                    ref={this.textAreaRef}
                    onFocus={() => this.isFocused = true}
                    onBlur={() => this.isFocused = false}
                    className={classnames(...this.textAreaClasses)}
                    rows={5}
                    cols={80}
                    placeholder={this.placeHolder}
                    title="Enter HUGO Gene Symbols or Gene Aliases"
                    value={this.showValidationBox ? this.geneQuery : this.focusOutValue}
                    onChange={event => this.updateGeneQuery(event.currentTarget.value)}
                    data-test='geneSet'
                />

                <GeneSymbolValidator
                    oql={this.oql}
                    geneQueryErrorDisplayStatus={this.geneQueryErrorDisplayStatus}
                    geneQuery={this.geneQuery}
                    genes={this.genes}
                    updateGeneQuery={this.updateGeneQuery}
                    hideSuccessMessage={this.props.location === GeneBoxType.STUDY_VIEW_PAGE}
                />

            </div>
        )
    }
}