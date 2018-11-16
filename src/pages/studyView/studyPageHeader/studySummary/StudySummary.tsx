import * as React from 'react';
import {CancerStudy} from "../../../../shared/api/generated/CBioPortalAPI";
import {computed, observable} from 'mobx';
import {observer} from "mobx-react"
import classnames from "classnames";
import * as _ from 'lodash';
import styles from "../styles.module.scss";
import {StudySummaryRecord} from "../../virtualStudy/VirtualStudy";
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";
import {buildCBioPortalPageUrl} from "../../../../shared/api/urls";
import MobxPromise from 'mobxpromise';
import {StudyLink} from "../../../../shared/components/StudyLink/StudyLink";

interface IStudySummaryProps {
    studies: CancerStudy[],
    originStudies: MobxPromise<CancerStudy[]>,
    showOriginStudiesInSummaryDescription: boolean
}

@observer
export default class StudySummary extends React.Component<IStudySummaryProps, {}> {

    @observable private showMoreDescription = false;

    @computed
    get name() {
        return this.props.studies.length === 1 ? this.props.studies[0].name : 'Combined Study';
    }

    @computed
    get descriptionFirstLine() {
        if (this.props.studies.length === 1) {
            let elems = [<span
                dangerouslySetInnerHTML={{__html: this.props.studies[0].description.split(/\n+/g)[0]}}/>];
            if (this.props.studies[0].pmid) {
                elems.push(<a target="_blank" href={`http://www.ncbi.nlm.nih.gov/pubmed/${this.props.studies[0].pmid}`}
                              style={{marginLeft: '5px'}}>PubMed</a>);
            }
            return <span>{elems}</span>
        } else {
            return <span>{`This combined study contains samples from ${this.props.studies.length} studies`}</span>;
        }
    }

    @computed
    get hasMoreDescription() {
        return this.props.showOriginStudiesInSummaryDescription ||
            this.props.studies.length > 1 ||
            this.props.studies[0].description.split(/\n/g).length > 1;
    }

    @computed
    get descriptionRemainingLines() {
        if (this.props.studies.length === 1) {
            const lines = this.props.studies[0].description.split(/\n/g);
            if (lines.length > 1) {
                //slice fist line as its already shown
                return [<span style={{whiteSpace: 'pre'}}
                              dangerouslySetInnerHTML={{__html: lines.slice(1).join('\n')}}/>]
            }
        } else {
            return _.map(this.props.studies, study => {
                return (
                    <StudyLink studyId={study.studyId}>{study.name}</StudyLink>
                )
            })
        }
        return [];
    }

    render() {
        return (
            <div className={classnames(styles.summary)}>
                <h3>{this.name}</h3>
                <div className={styles.description}>
                    <div>
                        {this.descriptionFirstLine}
                        {this.hasMoreDescription && <i
                            className={`fa fa-${this.showMoreDescription ? 'minus' : 'plus'}-circle`}
                            onClick={() => this.showMoreDescription = !this.showMoreDescription}
                            style={{marginLeft: '5px', cursor: 'pointer'}}
                        />}
                    </div>

                    {this.showMoreDescription &&
                    <div>
                        <p style={{display: 'inline-grid', width: '100%'}}>{this.descriptionRemainingLines}</p>
                        {
                            this.props.showOriginStudiesInSummaryDescription &&
                            (<div>
                                {
                                    this.props.originStudies.isComplete &&
                                    this.props.originStudies.result!.length > 0 &&
                                    (<span>
                                            <span style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>
                                                This virtual study was derived from:
                                            </span>
                                        {this.props.originStudies.result!.map(study =>
                                            <StudySummaryRecord {...study} />)}
                                    </span>)
                                }
                                <LoadingIndicator
                                    isLoading={this.props.originStudies.isPending}
                                    center={true}
                                    size={"big"}
                                />
                            </div>)
                        }
                    </div>
                    }
                </div>
            </div>
        )
    }
}