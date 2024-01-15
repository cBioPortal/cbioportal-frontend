import * as React from 'react';
import { errorIcon, loaderIcon } from '../StatusHelpers';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    ITherapyRecommendation,
    IFollowUp,
    ISharedTherapyRecommendationData,
} from './modelCopy/TherapyRecommendation';
import { Tab, Tabs } from 'react-bootstrap';
import noMatchLogo from '../../images/genome_no_match.png';
import diagMatchLogo from '../../images/genome_diag_match.png';
import partMatchLogo from '../../images/genome_part_match.png';
import fullMatchLogo from '../../images/genome_full_match.png';
import BzkfAnnotationLocalTRTable from './BzkfAnnotationLocalTRTable';
import BzkfAnnotationGlobalTRTable from './BzkfAnnotationGlobalTRTable';
import BzkfAnnotationOverview from './BzkfAnnotationOverview';

function getBzkfAnnotationImage(
    matchingAlteration: boolean,
    matchingDiagnosis: boolean
) {
    var img = noMatchLogo;
    if (matchingAlteration && matchingDiagnosis) {
        img = fullMatchLogo;
    } else if (!matchingAlteration && matchingDiagnosis) {
        img = diagMatchLogo;
    } else if (matchingAlteration && !matchingDiagnosis) {
        img = partMatchLogo;
    }
    return <img src={img} width={20} height={20} />;
}

export interface IBzkfAnnotationProps {
    status: 'pending' | 'error' | 'complete';
    hugoGeneSymbol: string;
    sharedTherapyRecommendationData?: ISharedTherapyRecommendationData;
}

export default class BzkfAnnotation extends React.Component<
    IBzkfAnnotationProps,
    {}
> {
    constructor(props: IBzkfAnnotationProps) {
        super(props);
    }

    public render() {
        let oncoKbContent: JSX.Element;

        if (this.props.status === 'error') {
            oncoKbContent = errorIcon('Error fetching BZKF data');
        } else if (
            this.props.status === 'pending' ||
            !this.props.sharedTherapyRecommendationData
        ) {
            oncoKbContent = loaderIcon('pull-left');
        } else {
            if (
                !this.props.sharedTherapyRecommendationData
                    .localTherapyRecommendations ||
                !this.props.sharedTherapyRecommendationData
                    .sharedTherapyRecommendations ||
                !this.props.sharedTherapyRecommendationData.localFollowUps ||
                !this.props.sharedTherapyRecommendationData.sharedFollowUps
            ) {
                return loaderIcon('pull-left');
            }

            let filteredLocalTR = this.props.sharedTherapyRecommendationData.localTherapyRecommendations.filter(
                tr =>
                    tr.caseId !=
                        this.props.sharedTherapyRecommendationData?.caseId ||
                    tr.studyId !=
                        this.props.sharedTherapyRecommendationData?.studyId
            );

            let filteredSharedTR = this.props.sharedTherapyRecommendationData
                .sharedTherapyRecommendations;

            let diagnosis = this.props.sharedTherapyRecommendationData.diagnosis
                ? this.props.sharedTherapyRecommendationData.diagnosis
                : [];

            //Search for therapyrecommendations with a matching diagnosis
            let matchingDiagnosis =
                filteredLocalTR.some(tr =>
                    diagnosis.some(d => tr.diagnosis?.includes(d))
                ) ||
                filteredSharedTR.some(tr =>
                    diagnosis.some(d => tr.diagnosis?.includes(d))
                );

            //Search for therapyrecommendations with a matching alteration
            let matchingAlteration =
                filteredLocalTR.some(tr =>
                    tr.reasoning.geneticAlterations?.some(
                        alt =>
                            alt.hugoSymbol == this.props.hugoGeneSymbol &&
                            alt.alteration ==
                                this.props.sharedTherapyRecommendationData
                                    ?.proteinChange
                    )
                ) ||
                filteredSharedTR.some(tr =>
                    tr.reasoning.geneticAlterations?.some(
                        alt =>
                            alt.hugoSymbol == this.props.hugoGeneSymbol &&
                            alt.alteration ==
                                this.props.sharedTherapyRecommendationData
                                    ?.proteinChange
                    )
                );

            oncoKbContent = (
                <DefaultTooltip
                    destroyTooltipOnHide={true}
                    trigger={['hover', 'focus', 'click']}
                    mouseLeaveDelay={0.2}
                    overlay={
                        <div className="civic-card" style={{ width: 1200 }}>
                            <span>
                                <div className="col s12 tip-header">
                                    {
                                        'Patients Like Me - Shared Therapy Recommendations'
                                    }
                                </div>
                                <div className="col s12 civic-card-content">
                                    <Tabs defaultActiveKey="first">
                                        <Tab eventKey="first" title="Overview">
                                            <BzkfAnnotationOverview
                                                {...this.props}
                                            />
                                        </Tab>
                                        <Tab eventKey="second" title="Local">
                                            <BzkfAnnotationLocalTRTable
                                                {...this.props}
                                            />
                                        </Tab>
                                    </Tabs>
                                </div>
                            </span>
                            <div className="item disclaimer">
                                <span>
                                    Disclaimer: This resource is intended for
                                    purely research purposes. It should not be
                                    used for emergencies or medical or
                                    professional advice.
                                </span>
                            </div>
                        </div>
                    }
                >
                    {getBzkfAnnotationImage(
                        (matchingAlteration = matchingAlteration),
                        (matchingDiagnosis = matchingDiagnosis)
                    )}
                </DefaultTooltip>
            );
        }
        return oncoKbContent;
    }
}
