import * as React from 'react';
import * as _ from 'lodash';
import styles from './styles.module.scss';
import { observer } from 'mobx-react';
import { computed, observable, action } from 'mobx';
import { CancerStudy, Sample } from 'shared/api/generated/CBioPortalAPI';
import classnames from 'classnames';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import { If, Then, Else } from 'react-if';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import { ChartMeta } from 'pages/studyView/StudyViewUtils';
import {
    getVirtualStudyDescription,
    getCurrentDate,
    StudyViewFilterWithSampleIdentifierFilters,
    StudyWithSamples,
} from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';
import { serializeEvent } from '../../../shared/lib/tracking';

const Clipboard = require('clipboard');

export interface IVirtualStudyProps {
    studyWithSamples: StudyWithSamples[];
    selectedSamples: Sample[];
    filter: StudyViewFilterWithSampleIdentifierFilters;
    attributesMetaSet: { [id: string]: ChartMeta };
    name?: string;
    description?: string;
    user?: string;
}

@observer
export class StudySummaryRecord extends React.Component<CancerStudy, {}> {
    @observable private showDescription = false;

    render() {
        return (
            <div className={styles.studySummary}>
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <span className={styles.studyName}>
                            <i
                                className={`fa fa-${
                                    this.showDescription ? 'minus' : 'plus'
                                }-circle`}
                                onClick={() => (this.showDescription = !this.showDescription)}
                            />
                            {this.props.name}
                        </span>
                        <a target="_blank" href={`study?id=${this.props.studyId}`}>
                            <i className="fa fa-external-link" aria-hidden="true"></i>
                        </a>
                    </div>
                    <div
                        className={styles.studyDescription}
                        style={{
                            display: this.showDescription ? 'block' : 'none',
                        }}
                    >
                        <span
                            dangerouslySetInnerHTML={{
                                __html: `${this.props.description.replace(/\r?\n/g, '<br/>')}`,
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

@observer
export default class VirtualStudy extends React.Component<IVirtualStudyProps, {}> {
    @observable private name: string;
    @observable private description: string;

    @observable private saving = false;
    @observable private sharing = false;
    @observable private copied = false;

    constructor(props: IVirtualStudyProps) {
        super(props);
        this.name = props.name || '';
        this.description =
            props.description ||
            getVirtualStudyDescription(
                this.props.description,
                this.props.studyWithSamples,
                this.props.filter,
                this.attributeNamesSet,
                this.props.user
            );
    }

    @computed get namePlaceHolder() {
        return `Selected sample${
            this.props.selectedSamples.length > 1 ? 's' : ''
        } (${getCurrentDate()})`;
    }

    @computed get buttonsDisabled() {
        return _.isEmpty(this.namePlaceHolder) && _.isEmpty(this.name);
    }

    readonly virtualStudy = remoteData(
        {
            invoke: async () => {
                if (this.saving || this.sharing) {
                    let selectedSampleSet = _.groupBy(
                        this.props.selectedSamples,
                        (sample: Sample) => sample.studyId
                    );
                    let studies = _.reduce(
                        selectedSampleSet,
                        (acc: { id: string; samples: string[] }[], samples, studyId) => {
                            acc.push({
                                id: studyId,
                                samples: samples.map(sample => sample.sampleId),
                            });
                            return acc;
                        },
                        []
                    );

                    let { sampleIdentifiersSet, ...studyViewFilter } = this.props.filter;

                    let parameters = {
                        name: this.name || this.namePlaceHolder,
                        description: this.description,
                        studyViewFilter: studyViewFilter,
                        origin: this.props.studyWithSamples.map(study => study.studyId),
                        studies: studies,
                    };
                    return await sessionServiceClient.saveVirtualStudy(parameters, this.saving);
                }
                return undefined;
            },
        },
        undefined
    );

    @computed get virtualStudyUrl() {
        // TODO: update path name once fully refactored
        return buildCBioPortalPageUrl({
            pathname: 'study',
            query: {
                id: this.virtualStudy.result ? this.virtualStudy.result.id : '',
            },
        });
    }

    @autobind
    private copyLinkRef(el: HTMLAnchorElement | null) {
        if (el) {
            new Clipboard(el, {
                text: () => this.virtualStudyUrl,
            });
        }
    }

    @autobind
    @action
    onCopyClick() {
        this.copied = true;
    }

    @autobind
    @action
    private onTooltipVisibleChange(visible: boolean) {
        this.copied = !visible;
    }

    @computed get showSaveButton() {
        //default value of userEmailAddress is anonymousUser. see my-index.ejs
        return !(
            _.isUndefined(this.props.user) ||
            _.isEmpty(this.props.user) ||
            _.isEqual(this.props.user.toLowerCase(), 'anonymoususer')
        );
    }

    @computed get attributeNamesSet() {
        return _.reduce(
            this.props.attributesMetaSet,
            (acc: { [id: string]: string }, next, key) => {
                acc[key] = next.displayName;
                return acc;
            },
            {}
        );
    }

    render() {
        return (
            <div className={styles.virtualStudy}>
                <If condition={this.virtualStudy.isError}>
                    <Then>
                        <div style={{ textAlign: 'center' }}>
                            <i
                                className="fa fa-exclamation-triangle"
                                aria-hidden="true"
                                style={{ color: 'orange' }}
                            />
                            <span style={{ marginLeft: '5px' }}>{`Failed to ${
                                this.saving ? 'save' : 'share'
                            } virtual study, please try again later.`}</span>
                        </div>
                    </Then>
                    <Else>
                        <If
                            condition={
                                this.virtualStudy.isPending ||
                                _.isUndefined(this.virtualStudy.result)
                            }
                        >
                            <Then>
                                <div>
                                    <div
                                        className={classnames(
                                            styles.virtualStudyForm,
                                            this.virtualStudy.isPending
                                                ? styles.disabled
                                                : undefined
                                        )}
                                    >
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={this.name}
                                                placeholder={
                                                    this.namePlaceHolder || 'Virtual study name'
                                                }
                                                onInput={event =>
                                                    (this.name = event.currentTarget.value)
                                                }
                                            />
                                            <div className="input-group-btn">
                                                {this.showSaveButton && (
                                                    <button
                                                        className={classnames(
                                                            'btn btn-default',
                                                            styles.saveButton
                                                        )}
                                                        data-event={serializeEvent({
                                                            category: 'studyPage',
                                                            action: 'saveVirtualStudy',
                                                        })}
                                                        type="button"
                                                        disabled={this.buttonsDisabled}
                                                        onClick={event => {
                                                            this.saving = true;
                                                        }}
                                                    >
                                                        {this.saving ? (
                                                            <i
                                                                className="fa fa-spinner fa-spin"
                                                                aria-hidden="true"
                                                            ></i>
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    className={classnames(
                                                        'btn btn-default',
                                                        styles.saveButton
                                                    )}
                                                    type="button"
                                                    disabled={this.buttonsDisabled}
                                                    data-event={serializeEvent({
                                                        category: 'studyPage',
                                                        action: 'shareVirtualStudy',
                                                    })}
                                                    onClick={event => {
                                                        this.sharing = true;
                                                    }}
                                                >
                                                    {this.sharing ? (
                                                        <i
                                                            className="fa fa-spinner fa-spin"
                                                            aria-hidden="true"
                                                        ></i>
                                                    ) : (
                                                        'Share'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            className="form-control"
                                            rows={10}
                                            placeholder="Virtual study description (Optional)"
                                            value={this.description}
                                            onChange={event =>
                                                (this.description = event.currentTarget.value)
                                            }
                                        />
                                    </div>
                                    <span
                                        style={{
                                            display: 'block',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        This virtual study was derived from:
                                    </span>
                                    <div className={styles.studiesSummaryInfo}>
                                        {this.props.studyWithSamples.map(study => (
                                            <StudySummaryRecord {...study} />
                                        ))}
                                    </div>
                                </div>
                            </Then>
                            <Else>
                                <div className={classnames(styles.result)}>
                                    <div className={styles.name}>
                                        <a
                                            target="_blank"
                                            href={`${this.virtualStudyUrl}`}
                                            style={{ width: '220px' }}
                                        >
                                            {this.virtualStudyUrl}
                                        </a>
                                    </div>
                                    <div
                                        className={classnames(
                                            'btn-group btn-group-xs',
                                            styles.controls
                                        )}
                                    >
                                        <DefaultTooltip
                                            overlay={
                                                <If condition={this.copied}>
                                                    <Then>
                                                        <span className="alert-success">
                                                            Copied!
                                                        </span>
                                                    </Then>
                                                    <Else>
                                                        <span>Copy</span>
                                                    </Else>
                                                </If>
                                            }
                                            placement="top"
                                            onVisibleChange={this.onTooltipVisibleChange}
                                        >
                                            <span
                                                className="btn btn-default"
                                                ref={this.copyLinkRef}
                                                onClick={this.onCopyClick}
                                            >
                                                Copy
                                            </span>
                                        </DefaultTooltip>
                                        <span
                                            className="btn btn-default"
                                            onClick={event =>
                                                window.open(this.virtualStudyUrl, '_blank')
                                            }
                                        >
                                            View
                                        </span>
                                        {this.saving && (
                                            <span
                                                className="btn btn-default"
                                                onClick={event => {
                                                    if (this.virtualStudy.result) {
                                                        window.open(
                                                            buildCBioPortalPageUrl('results', {
                                                                cancer_study_id: this.virtualStudy
                                                                    .result.id,
                                                            }),
                                                            '_blank'
                                                        );
                                                    }
                                                }}
                                            >
                                                Query
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Else>
                        </If>
                    </Else>
                </If>
            </div>
        );
    }
}
