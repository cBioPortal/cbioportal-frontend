import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';
import styles from '../styles.module.scss';
import autobind from 'autobind-decorator';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import OQLTextArea, {
    GeneBoxType,
} from 'shared/components/GeneSelectionBox/OQLTextArea';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import classnames from 'classnames';
import { serializeEvent } from '../../../../shared/lib/tracking';

export interface IRightPanelProps {
    store: StudyViewPageStore;
}

export type GeneReplacement = { alias: string; genes: Gene[] };

@observer
export default class RightPanel extends React.Component<IRightPanelProps, {}> {
    @observable downloadingData = false;
    @observable showDownloadErrorMessage = false;

    @observable geneValidationHasIssue = false;

    @autobind
    @action
    private updateSelectedGenes(
        oql: {
            query: SingleGeneQuery[];
            error?: { start: number; end: number; message: string };
        },
        genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string
    ) {
        this.geneValidationHasIssue =
            queryStr === '' ||
            !_.isUndefined(oql.error) ||
            genes.suggestions.length !== 0;
        this.props.store.updateSelectedGenes(oql.query, queryStr);
    }

    @computed
    get isQueryButtonDisabled() {
        return (
            this.props.store.geneQueryStr === '' || this.geneValidationHasIssue
        );
    }

    render() {
        return (
            <div className="studyViewSummaryHeader">
                <div className={styles.rightPanel}>
                    <div className={'small'}>
                        <OQLTextArea
                            inputGeneQuery={this.props.store.geneQueryStr}
                            validateInputGeneQuery={false}
                            callback={this.updateSelectedGenes}
                            location={GeneBoxType.STUDY_VIEW_PAGE}
                        />
                    </div>
                    <button
                        disabled={this.isQueryButtonDisabled}
                        className={classnames(
                            'btn btn-primary btn-sm',
                            styles.submitQuery
                        )}
                        data-event={serializeEvent({
                            category: 'studyPage',
                            action: 'submitQuery',
                            label: this.props.store.queriedPhysicalStudyIds
                                .result,
                        })}
                        onClick={() => this.props.store.onSubmitQuery()}
                    >
                        Query
                    </button>
                </div>
            </div>
        );
    }
}
