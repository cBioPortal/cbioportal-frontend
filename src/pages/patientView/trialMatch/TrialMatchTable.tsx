import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {observer} from "mobx-react";
import {
    IClinicalGroupMatch, IGenomicGroupMatch, IGenomicMatch, IDetailedTrialMatch, IArmMatch
} from "../../../shared/model/MatchMiner";
import styles from './style/trialMatch.module.scss';
import { computed } from "mobx";
import LazyMobXTable from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import SampleManager from "../sampleManager";
import DefaultTooltip, { placeArrowBottomLeft } from "../../../public-lib/components/defaultTooltip/DefaultTooltip";

export type ITrialMatchProps = {
    sampleManager: SampleManager | null;
    detailedTrialMatches: IDetailedTrialMatch[];
    containerWidth: number;
}

enum ColumnKey {
    ID = 'ID',
    TITLE = 'Title',
    MATCHING_CRITERIA = 'Matching Criteria'
}

enum ColumnWidth {
    ID = 140
}

class TrialMatchTableComponent extends LazyMobXTable<IDetailedTrialMatch> {

}

@observer
export default class TrialMatchTable extends React.Component<ITrialMatchProps> {

    @computed
    get columnWidths() {
        return {
            [ColumnKey.ID]: ColumnWidth.ID,
            [ColumnKey.TITLE]: 0.35 * (this.props.containerWidth - ColumnWidth.ID),
            [ColumnKey.MATCHING_CRITERIA]: 0.65 * (this.props.containerWidth - ColumnWidth.ID)
        };
    }

    private _columns = [{
        name: ColumnKey.ID,
        render: (trial: IDetailedTrialMatch) => (
            <div>
                <If condition={trial.protocolNo.length > 0}>
                    <div><a target="_blank" href={"https://www.mskcc.org/cancer-care/clinical-trials/" + trial.protocolNo}>{trial.protocolNo}</a></div>
                </If>
                <If condition={trial.nctId.length > 0}>
                    <div><a target="_blank" href={"https://clinicaltrials.gov/ct2/show/" + trial.nctId}>{trial.nctId}</a></div>
                </If>
                <div>{trial.status}</div>
            </div>
        ),
        sortBy: (trial: IDetailedTrialMatch) => trial.protocolNo,
        width: this.columnWidths[ColumnKey.ID]
    }, {
        name: ColumnKey.TITLE,
        render: (trial: IDetailedTrialMatch) => (<span>{trial.shortTitle}</span>),
        sortBy: (trial: IDetailedTrialMatch) => trial.shortTitle,
        width: this.columnWidths[ColumnKey.TITLE]
    }, {
        name: ColumnKey.MATCHING_CRITERIA,
        render: (trial: IDetailedTrialMatch) => (
            <div>
                {trial.matches.map((armMatch: IArmMatch, index: number) => (
                    <div>
                        <div>
                            {armMatch.matches.map((clinicalGroupMatch: IClinicalGroupMatch, cgIndex:number) => (
                                <div className={styles.criteriaContainer}>
                                    {this.getGenomicMatch(clinicalGroupMatch)}
                                    {this.getClinicalMatch(clinicalGroupMatch)}
                                    <If condition={cgIndex < armMatch.matches.length - 1}><hr className={styles.criteriaHr}/></If>
                                </div>
                            ))}
                        </div>
                         <If condition={armMatch.armDescription !== ''}>
                            <div className={styles.armDiv}>
                                <span>Arm: {armMatch.armDescription}</span>
                            </div>
                        </If>
                        <If condition={armMatch.drugs.length > 0}>
                            <div className={styles.armDiv}>
                                <span>Intervention: {armMatch.drugs.join(', ')}</span>
                            </div>
                        </If>
                        <If condition={index < trial.matches.length - 1}><hr className={styles.criteriaHr}/></If>
                    </div>
                ))}
            </div>
        ),
        width: this.columnWidths[ColumnKey.MATCHING_CRITERIA]
    }];

    public getClinicalMatch(clinicalGroupMatch: IClinicalGroupMatch) {
        return (
            <div className={styles.firstRight}>
                <span className={styles.secondLeft}>{clinicalGroupMatch.trialAgeNumerical + ' yrs old'}</span>
                <span className={styles.secondRight}>
                    {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.positive.join(', ')}
                    {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.length > 0 &&
                        <span>
                            <b> except in </b>
                            <If condition={clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.length < 4}>
                                <Then>
                                    <span>{clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.join(', ').replace(/,(?!.*,)/gmi, ' and')}</span>
                                </Then>
                                <Else>
                                     <DefaultTooltip
                                         placement='bottomLeft'
                                         trigger={['hover', 'focus']}
                                         overlay={this.tooltipClinicalContent(clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative)}
                                         destroyTooltipOnHide={true}
                                         onPopupAlign={placeArrowBottomLeft}>
                                         <span>{clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.length + ` cancer types`}</span>
                                    </DefaultTooltip>
                                </Else>
                            </If>
                        </span>
                    }
                </span>
            </div>
        );
    }

    public getGenomicMatch(clinicalGroupMatch: IClinicalGroupMatch) {
        return (
            <div className={styles.firstLeft}>
                {clinicalGroupMatch.matches.MUTATION.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        <If condition={genomicGroupMatch.matches.length === 1 &&
                            genomicGroupMatch.genomicAlteration === `${genomicGroupMatch.matches[0].trueHugoSymbol} ${genomicGroupMatch.matches[0].trueProteinChange}`}>
                            <Then>
                                {this.getGenomicExactMatch(genomicGroupMatch)}
                            </Then>
                            <Else>
                                <span className={styles.firstLeft}>{`${genomicGroupMatch.genomicAlteration}: `}
                                    {this.getGenomicVariantCategoryMatch(genomicGroupMatch)}
                                </span>
                            </Else>
                        </If>
                    </div>
                ))}
                {clinicalGroupMatch.matches.MSI.length > 0 &&
                    <div>Tumor is MSI-H</div>
                }
                {clinicalGroupMatch.matches.CNA.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        {this.getGenomicExactMatch(genomicGroupMatch)}
                    </div>
                ))}
                {clinicalGroupMatch.matches.WILDTYPE.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        {this.getGenomicExactMatch(genomicGroupMatch)}
                    </div>
                ))}
                { (clinicalGroupMatch.notMatches.MUTATION.length > 0 || clinicalGroupMatch.notMatches.CNA.length > 0 ) &&
                    <div>
                        <span className={styles.genomicSpan}>{this.getDescriptionForNotMatches(clinicalGroupMatch.notMatches.MUTATION.concat(clinicalGroupMatch.notMatches.CNA), 3, 'No alterations in', 'defined by the trial')}</span>
                        <DefaultTooltip
                            placement='bottomLeft'
                            trigger={['hover', 'focus']}
                            overlay={this.tooltipGenomicContent(clinicalGroupMatch.notMatches.MUTATION.concat(clinicalGroupMatch.notMatches.CNA))}
                            destroyTooltipOnHide={false}
                            onPopupAlign={placeArrowBottomLeft}>
                            <i className={'fa fa-comment-o ' + styles.commentIcon}></i>
                        </DefaultTooltip>
                    </div>

                }
                { clinicalGroupMatch.notMatches.MSI.length > 0 &&
                    <div>Tumor is not MSI-H</div>
                }
                { clinicalGroupMatch.notMatches.WILDTYPE.length > 0 &&
                    <div>
                        <span className={styles.genomicSpan}>{this.getDescriptionForNotMatches(clinicalGroupMatch.notMatches.WILDTYPE, 3, 'Tumor doesn\'t have', 'defined by the trial')}</span>
                        <DefaultTooltip
                            placement='bottomLeft'
                            trigger={['hover', 'focus']}
                            overlay={this.tooltipGenomicContent(clinicalGroupMatch.notMatches.WILDTYPE)}
                            destroyTooltipOnHide={false}
                            onPopupAlign={placeArrowBottomLeft}>
                            <i className={'fa fa-comment-o ' + styles.commentIcon}></i>
                        </DefaultTooltip>
                    </div>
                }
            </div>
        );
    }

    // Patient Genomic(i.e., BRAF V600E) info are exactly matched to trial genomic alteration(i.e., BRAF V600E)
    public getGenomicExactMatch(genomicGroupMatch: IGenomicGroupMatch) {
        return (
            <div>{`${genomicGroupMatch.genomicAlteration} `}
                {genomicGroupMatch.matches[0].sampleIds.map((sampleId: string) => (
                    <span className={styles.genomicSpan}>
                        {this.props.sampleManager!.getComponentForSample(sampleId, 1, '')}
                    </span>
                ))}
            </div>
        );
    }

    // Patient Genomic(i.e., BRAF V600E) info are matched to trial genomic alteration(i.e., BRAF Oncogenic Mutation).
    // V600E belongs to Oncogenic Mutation.
    public getGenomicVariantCategoryMatch(genomicGroupMatch: IGenomicGroupMatch) {
        return (
            <If condition={genomicGroupMatch.matches.length > 1}>
                <Then>
                    <ul className={styles.alterationUl}>
                        {genomicGroupMatch.matches.map((genomicMatch: IGenomicMatch) => (
                            <li>{`${genomicMatch.trueHugoSymbol} ${genomicMatch.trueProteinChange} `}
                                {genomicMatch.sampleIds.map((sampleId: string) => (
                                    <span className={styles.genomicSpan}>
                                        {this.props.sampleManager!.getComponentForSample(sampleId, 1, '')}
                                    </span>
                                ))}
                            </li>
                        ))}
                    </ul>
                </Then>
                <Else>
                    <span>{`${genomicGroupMatch.matches[0].trueHugoSymbol} ${genomicGroupMatch.matches[0].trueProteinChange} `}
                        {genomicGroupMatch.matches[0].sampleIds.map((sampleId: string) => (
                            <span className={styles.genomicSpan}>
                                {this.props.sampleManager!.getComponentForSample(sampleId, 1, '')}
                            </span>
                        ))}
                    </span>
                </Else>
            </If>
        );
    }

    public tooltipGenomicContent(data: IGenomicGroupMatch[]) {
        return (
            <div className={styles.tooltip}>
                {data.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div className={styles.genomicSpan}><b>Not </b>{`${genomicGroupMatch.genomicAlteration.replace(/!/g, '')} `}
                        {genomicGroupMatch.matches[0].sampleIds.map((sampleId: string) => (
                            <span className={styles.genomicSpan}>
                                {this.props.sampleManager!.getComponentForSample(sampleId, 1, '')}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        );
    }
    public tooltipClinicalContent(data: string[]) {
        return (
            <div className={styles.tooltip}>
                <ul className={styles.alterationUl}>
                    {data.map((cancerType: string) => (
                        <li>{cancerType}</li>
                    ))}
                </ul>
            </div>
        );
    }

    public getDescriptionForNotMatches(matches: IGenomicGroupMatch[], threshold: number, preContent: string, postContent: string) {
        const hugoSymbolSet = new Set([...matches].map(x => x.genomicAlteration.split(' ')[0]));
        let genomicAlterationContent = '';
        if (hugoSymbolSet.size <= threshold) {
            genomicAlterationContent = [...hugoSymbolSet].join(', ');
        } else {
            genomicAlterationContent = `${hugoSymbolSet.size} genes`;
        }
        return `${preContent} ${genomicAlterationContent} ${postContent}`;
    }

    render() {
        return (
            <div>
                <TrialMatchTableComponent
                    data={this.props.detailedTrialMatches}
                    columns={this._columns}
                    showCopyDownload={false}
                />
                <div className={styles.powered}>
                    Powered by <a href="https://matchminer.org/" target="_blank">MatchMiner</a>
                </div>
            </div>
        )
    }
}
