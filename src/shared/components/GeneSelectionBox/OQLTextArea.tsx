import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import styles from './styles.module.scss';
import {
    observable,
    computed,
    action,
    reaction,
    IReactionDisposer,
} from 'mobx';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { GeneReplacement, Focus } from 'shared/components/query/QueryStore';
import {
    getEmptyGeneValidationResult,
    getFocusOutText,
    getOQL,
} from './GeneSelectionBoxUtils';
import GeneSymbolValidator, {
    GeneValidationResult,
} from './GeneSymbolValidator';
import autobind from 'autobind-decorator';

export interface IGeneSelectionBoxProps {
    focus?: Focus;
    inputGeneQuery?: string;
    validateInputGeneQuery?: boolean;
    location?: GeneBoxType;
    textBoxPrompt?: string;
    callback?: (
        oql: {
            query: SingleGeneQuery[];
            error?: { start: number; end: number; message: string };
        },
        genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string
    ) => void;
}

export enum GeneBoxType {
    DEFAULT,
    STUDY_VIEW_PAGE,
    ONCOPRINT_HEATMAP,
}

export type OQL = {
    query: SingleGeneQuery[];
    error?: { start: number; end: number; message: string };
};

@observer
export default class OQLTextArea extends React.Component<
    IGeneSelectionBoxProps,
    {}
> {
    private disposers: IReactionDisposer[];

    // Need to record the textarea value due to SyntheticEvent restriction due to debounce
    private currentTextAreaValue = '';

    @observable private geneQuery = '';
    @observable private geneQueryIsValid = true;
    @observable private queryToBeValidated = '';
    @observable private isFocused = false;
    @observable private skipGenesValidation = false;

    private readonly textAreaRef: React.RefObject<HTMLTextAreaElement>;
    private updateQueryToBeValidateDebounce = _.debounce(() => {
        this.queryToBeValidated = this.currentTextAreaValue;
        this.skipGenesValidation = false;

        // When the text is empty, it will be skipped from oql and further no validation will be done.
        // Need to set the geneQuery here
        if (this.currentTextAreaValue === '') {
            this.geneQuery = '';
            if (this.props.callback) {
                this.props.callback(
                    getOQL(''),
                    getEmptyGeneValidationResult(),
                    this.geneQuery
                );
            }
        }
    }, 500);

    public static defaultProps = {
        validateInputGeneQuery: true,
    };

    constructor(props: IGeneSelectionBoxProps) {
        super(props);
        this.geneQuery = this.props.inputGeneQuery || '';
        this.queryToBeValidated = this.geneQuery;
        if (!this.props.validateInputGeneQuery) {
            this.skipGenesValidation = true;
        }
        this.textAreaRef = React.createRef<HTMLTextAreaElement>();
    }

    componentDidMount(): void {
        this.disposers = [
            reaction(
                () => this.props.inputGeneQuery,
                inputGeneQuery => {
                    if (
                        (inputGeneQuery || '').toUpperCase() !==
                        this.geneQuery.toUpperCase()
                    ) {
                        if (!this.props.validateInputGeneQuery) {
                            this.skipGenesValidation = true;
                        }
                        this.geneQuery = (inputGeneQuery || '').trim();
                        this.queryToBeValidated = this.geneQuery;
                    }
                    this.updateTextAreaRefValue();
                }
            ),
            reaction(
                () => this.showFullText,
                () => {
                    this.updateTextAreaRefValue();
                }
            ),
        ];
    }

    componentWillUnmount(): void {
        for (const disposer of this.disposers) {
            disposer();
        }
    }

    @autobind
    @action
    private updateGeneQuery(value: string) {
        this.geneQuery = value;
        // at the time gene query is updated, the queryToBeValidated should be set to the same
        this.queryToBeValidated = value;

        // You want to keep the box open when the gene symbol validator tries to correct your gene query
        this.isFocused = true;

        // The uncontrolled component value should be updated at the moment the gene query is updated
        this.updateTextAreaRefValue();
    }

    private getTextAreaValue() {
        if (this.showFullText) {
            return this.geneQuery;
        } else {
            return this.getFocusOutValue();
        }
    }

    @autobind
    @action
    updateTextAreaRefValue() {
        this.textAreaRef.current!.value = this.getTextAreaValue();
    }

    private getFocusOutValue() {
        return getFocusOutText(
            getOQL(this.geneQuery).query.map(query => query.gene)
        );
    }

    @computed private get textAreaClasses() {
        let classNames: string[] = [];

        switch (this.props.location) {
            case GeneBoxType.STUDY_VIEW_PAGE:
                classNames.push(styles.studyView);
                if (this.isFocused || !this.geneQueryIsValid) {
                    classNames.push(styles.studyViewFocus);
                }
                break;
            case GeneBoxType.ONCOPRINT_HEATMAP:
                classNames.push(styles.oncoprintHeatmap);
                break;
            default:
                classNames.push(styles.default);
                break;
        }
        this.geneQuery
            ? classNames.push(styles.notEmpty)
            : classNames.push(styles.empty);
        return classNames;
    }

    @computed get showFullText() {
        return (
            !this.geneQueryIsValid ||
            this.isFocused ||
            this.props.location !== GeneBoxType.STUDY_VIEW_PAGE
        );
    }

    @autobind
    @action
    afterGeneSymbolValidation(
        validQuery: boolean,
        validationResult: GeneValidationResult,
        oql: OQL
    ) {
        this.geneQueryIsValid = validQuery;
        // no matter whether the query is valid, we need to sync queryToBeValidated with geneQuery
        this.geneQuery = this.queryToBeValidated;
        if (this.props.callback) {
            this.props.callback(oql, validationResult, this.geneQuery);
        }

        if (
            oql.error !== undefined &&
            (this.props.focus === undefined ||
                this.props.focus === Focus.ShouldFocus) &&
            this.textAreaRef.current
        ) {
            this.textAreaRef.current.focus();
            this.textAreaRef.current.setSelectionRange(
                oql.error.start,
                oql.error.end
            );
        }
    }

    @computed
    get promptText() {
        return this.props.textBoxPrompt
            ? this.props.textBoxPrompt
            : 'Click gene symbols below or enter here';
    }

    render() {
        return (
            <div className={styles.genesSelection}>
                <textarea
                    ref={this.textAreaRef}
                    onFocus={() => (this.isFocused = true)}
                    onBlur={() => (this.isFocused = false)}
                    className={classnames(...this.textAreaClasses)}
                    rows={5}
                    cols={80}
                    placeholder={this.promptText}
                    title={this.promptText}
                    defaultValue={this.getTextAreaValue()}
                    onChange={event => {
                        this.currentTextAreaValue = event.currentTarget.value;
                        this.updateQueryToBeValidateDebounce();
                    }}
                    data-test="geneSet"
                />

                <GeneSymbolValidator
                    focus={this.props.focus}
                    geneQuery={this.queryToBeValidated}
                    skipGeneValidation={this.skipGenesValidation}
                    updateGeneQuery={this.updateGeneQuery}
                    afterValidation={this.afterGeneSymbolValidation}
                    errorMessageOnly={
                        this.props.location === GeneBoxType.STUDY_VIEW_PAGE
                    }
                >
                    {this.props.children}
                </GeneSymbolValidator>
            </div>
        );
    }
}
