import * as React from 'react';
import {Modal} from 'react-bootstrap';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import oncogenicIconStyles from "./styles/oncogenicIcon.module.scss";
import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import {
    oncogenicImageClassNames, calcOncogenicScore, calcSensitivityLevelScore, calcResistanceLevelScore,
    generateTreatments, generateOncogenicCitations, generateMutationEffectCitations
} from "shared/lib/OncoKbUtils";
import OncoKbCard from "./OncoKbCard";

export interface IOncoKbProps {
    indicator?: IndicatorQueryResp;
    evidence?: any;
    pmids?: any;
}

export interface IOncoKbState {
    showFeedback: boolean;
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

/**
 * @author Selcuk Onur Sumer
 */
export default class OncoKB extends React.Component<IOncoKbProps, IOncoKbState>
{
    public static sortValue(indicator:IndicatorQueryResp|undefined):number[]
    {
        if (!indicator) {
            return [];
        }

        const values:number[] = [];

        values[0] = (indicator.variantExist || indicator.alleleExist || indicator.vus) ? 1 : 0;
        values[1] = calcOncogenicScore(indicator.oncogenic, indicator.vus);
        values[2] = (indicator.variantExist || indicator.alleleExist) ? 1 : 0;
        values[3] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[4] = calcResistanceLevelScore(indicator.highestResistanceLevel);

        return values;
    }

    constructor(props: IOncoKbProps)
    {
        super(props);
        this.state = {
            showFeedback: false
        };

        this.handleFeedbackOpen = this.handleFeedbackOpen.bind(this);
        this.handleFeedbackClose = this.handleFeedbackClose.bind(this);
    }

    public render()
    {
        let oncoKbContent:JSX.Element = (
            <span/>
        );

        if (this.props.indicator && this.props.evidence)
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            // TODO get tooltip content from another API call!
            const tooltipContent = (
                <OncoKbCard
                    title={`${this.props.indicator.query.hugoSymbol} ${this.props.indicator.query.alteration} in ${this.props.indicator.query.tumorType}`}
                    gene={this.props.indicator.geneExist ? this.props.indicator.query.hugoSymbol : ''}
                    oncogenicity={this.props.indicator.oncogenic}
                    oncogenicityPmids={generateOncogenicCitations(this.props.evidence.oncogenicRefs)}
                    mutationEffect={this.props.evidence.mutationEffect.knownEffect}
                    mutationEffectPmids={generateMutationEffectCitations(this.props.evidence.mutationEffect.refs)}
                    geneSummary={this.props.indicator.geneSummary}
                    variantSummary={this.props.indicator.variantSummary}
                    tumorTypeSummary={this.props.indicator.tumorTypeSummary}
                    biologicalSummary={this.props.evidence.mutationEffect.description}
                    treatments={generateTreatments(this.props.evidence.treatments)}
                    pmids={this.props.pmids}
                    handleFeedbackOpen={this.handleFeedbackOpen}
                />
            );

            if (this.state.showFeedback)
            {
                oncoKbContent = this.feedbackModal(this.props.indicator);
            }
            else
            {
                oncoKbContent = (
                    <DefaultTooltip
                        overlay={tooltipContent}
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        onPopupAlign={placeArrow}
                    >
                        <span className={`${annotationStyles["annotation-item"]}`}>
                            <i className={`${oncogenicIconStyles['oncogenic-icon-image']} ${this.oncogenicImageClassNames(this.props.indicator)}`} />
                        </span>
                    </DefaultTooltip>
                );
            }
        }

        return oncoKbContent;
    }

    public feedbackModal(indicator:IndicatorQueryResp)
    {
        const url = "https://docs.google.com/forms/d/1lt6TtecxHrhIE06gAKVF_JW4zKFoowNFzxn6PJv4g7A/viewform";
        const geneParam = `entry.1744186665=${indicator.query.hugoSymbol}`;
        const alterationParam = `entry.1671960263=${indicator.query.alteration}`;
        const userParam = `entry.1381123986=`; // TODO get username from session?
        const uriParam = `entry.1083850662=${encodeURIComponent(window.location.href)}`;

        return (
            <Modal show={this.state.showFeedback} onHide={this.handleFeedbackClose}>
                <Modal.Header closeButton>
                    <Modal.Title>OncoKB Annotation Feedback</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <iframe
                        src={`${url}?${geneParam}&${alterationParam}&entry.118699694&entry.1568641202&${userParam}&${uriParam}&embedded=true`}
                        style={{width:550, height:500, border:"none", marginLeft:"10px"}}
                        marginHeight={0}
                        marginWidth={0}
                    >
                        Loading...
                    </iframe>
                </Modal.Body>
            </Modal>
        );
    }

    private handleFeedbackOpen(): void {
        this.setState(({showFeedback : true} as IOncoKbState));
    }

    private handleFeedbackClose(): void {
        this.setState(({showFeedback : false} as IOncoKbState));
    }

    public oncogenicImageClassNames(indicator:IndicatorQueryResp):string
    {
        let classNames:string[];

        if (indicator.oncogenic != null)
        {
            classNames = oncogenicImageClassNames(
                indicator.oncogenic,
                indicator.vus,
                indicator.highestSensitiveLevel,
                indicator.highestResistanceLevel
            );
        }
        else
        {
            classNames = oncogenicImageClassNames("N/A", false, "", "");
        }

        classNames = classNames.map(function(name) {
            return oncogenicIconStyles[name];
        });

        return classNames.join(' ');
    }
}
