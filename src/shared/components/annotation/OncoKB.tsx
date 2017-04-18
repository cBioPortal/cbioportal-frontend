import * as React from 'react';
import {Modal} from 'react-bootstrap';
import {observer} from "mobx-react";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import oncogenicIconStyles from "./styles/oncogenicIcon.module.scss";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {
    oncogenicImageClassNames, calcOncogenicScore, calcSensitivityLevelScore, calcResistanceLevelScore,
} from "shared/lib/OncoKbUtils";
import {observable} from "mobx";
import OncoKbEvidenceCache from "pages/patientView/OncoKbEvidenceCache";
import OncoKbTooltip from "./OncoKbTooltip";
import OncokbPmidCache from "pages/patientView/PmidCache";

export interface IOncoKbProps {
    indicator?: IndicatorQueryResp;
    evidenceCache?: OncoKbEvidenceCache;
    evidenceQuery?: Query;
    pmidCache?: OncokbPmidCache;
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

// TODO duplicate code: replace this with the actual PlaceHolder component when ready
export function placeHolder(text:string)
{
    return (
        <span
            style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
            alt="Querying server for data."
        >
            {text}
        </span>
    );
}

/**
 * @author Selcuk Onur Sumer
 */
@observer
export default class OncoKB extends React.Component<IOncoKbProps, {}>
{
    @observable showFeedback:boolean = false;

    public static get ONCOGENIC_ICON_STYLE()
    {
        return {
            backgroundImage: `url(${require('./images/oncogenic_v2_09302016.png')})`
        };
    }

    public static sortValue(indicator:IndicatorQueryResp|undefined):number[]
    {
        if (!indicator) {
            return [];
        }

        const values:number[] = [];

        values[0] = (indicator.variantExist || indicator.alleleExist || indicator.hotspot || indicator.vus) ? 1 : 0;
        values[1] = calcOncogenicScore(indicator.oncogenic, indicator.vus);
        values[2] = (indicator.variantExist || indicator.alleleExist || indicator.hotspot) ? 1 : 0;
        values[3] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[4] = calcResistanceLevelScore(indicator.highestResistanceLevel);

        return values;
    }

    constructor(props: IOncoKbProps)
    {
        super(props);

        this.handleFeedbackOpen = this.handleFeedbackOpen.bind(this);
        this.handleFeedbackClose = this.handleFeedbackClose.bind(this);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render()
    {
        let oncoKbContent:JSX.Element = (
            <span/>
        );

        if (this.props.indicator)
        {
            oncoKbContent = (
                <span className={`${annotationStyles["annotation-item"]}`}>
                    <i
                        className={`${oncogenicIconStyles['oncogenic-icon-image']} ${this.oncogenicImageClassNames(this.props.indicator)}`}
                        style={OncoKB.ONCOGENIC_ICON_STYLE}
                    />
                </span>
            );

            if (this.showFeedback)
            {
                oncoKbContent = this.feedbackModal(this.props.indicator);
            }
            else if (this.props.evidenceCache && this.props.evidenceQuery)
            {
                const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

                oncoKbContent = (
                    <DefaultTooltip
                        overlay={this.tooltipContent}
                        placement="bottomLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        onPopupAlign={placeArrow}
                        destroyTooltipOnHide={false}
                    >
                        {oncoKbContent}
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
            <Modal show={this.showFeedback} onHide={this.handleFeedbackClose}>
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
                        {placeHolder('LOADING')}
                    </iframe>
                </Modal.Body>
            </Modal>
        );
    }

    private tooltipContent(): JSX.Element
    {
        return (
            <OncoKbTooltip
                indicator={this.props.indicator}
                evidenceCache={this.props.evidenceCache}
                evidenceQuery={this.props.evidenceQuery}
                pmidCache={this.props.pmidCache}
                handleFeedbackOpen={this.handleFeedbackOpen}
            />
        );
    }

    private handleFeedbackOpen(): void {
        this.showFeedback = true;
    }

    private handleFeedbackClose(): void {
        this.showFeedback = false;
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
