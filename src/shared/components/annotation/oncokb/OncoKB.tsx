import * as React from "react";
import {observer} from "mobx-react";
import {Circle} from "better-react-spinkit";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import annotationStyles from "../styles/annotation.module.scss";
import oncogenicIconStyles from "../styles/oncokb/main.module.scss";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {
    oncogenicImageClassNames,
    calcOncogenicScore,
    calcSensitivityLevelScore,
    calcResistanceLevelScore, oncogenicXPosition, oncogenicYPosition, normalizeLevel
} from "shared/lib/OncoKbUtils";
import {observable} from "mobx";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import {errorIcon, loaderIcon} from "../StatusHelpers";
import OncoKbTooltip from "./OncoKbTooltip";
import OncoKbFeedback from "./OncoKbFeedback";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import AppConfig from "appConfig";
import {getCurrentURLWithoutHash} from "../../../api/urls";
import {Modal} from 'react-bootstrap';
import '../styles/oncokb/oncokb.scss';

export interface IOncoKbProps {
    status: "pending" | "error" | "complete";
    indicator?: IndicatorQueryResp;
    evidenceCache?: OncoKbEvidenceCache;
    evidenceQuery?: Query;
    pubMedCache?: OncokbPubMedCache;
    geneNotExist:boolean;
    hugoGeneSymbol?:string;
    userEmailAddress?:string;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

/**
 * @author Selcuk Onur Sumer
 */
@observer
export default class OncoKB extends React.Component<IOncoKbProps, {}>
{
    @observable showFeedback:boolean = false;
    @observable tooltipDataLoadComplete:boolean = false;

    private getOncogenicIconsStyle(indicator: IndicatorQueryResp | undefined)
    {
        return {
            backgroundImage: `url(${require('../images/oncokb_03062019.png')})`,
            backgroundPositionX: oncogenicXPosition(indicator ? normalizeLevel(indicator.highestSensitiveLevel) : ''),
            backgroundPositionY: indicator ? (oncogenicYPosition(indicator.oncogenic, indicator.vus, normalizeLevel(indicator.highestResistanceLevel))) : oncogenicYPosition('', false, '')
        };
    }

    public static sortValue(indicator?: IndicatorQueryResp|undefined|null): number[]
    {
        if (!indicator) {
            return [];
        }

        const values:number[] = [];

        values[0] = calcOncogenicScore(indicator.oncogenic, indicator.vus);
        values[1] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[2] = calcResistanceLevelScore(indicator.highestResistanceLevel);
        values[3] = indicator.geneExist ? 1 : 0;

        return values;
    }

    public static download(indicator?: IndicatorQueryResp|undefined|null): string
    {
        if (!indicator) {
            return "NA";
        }

        const oncogenic = indicator.oncogenic ? indicator.oncogenic : "Unknown";
        const level = indicator.highestSensitiveLevel ? indicator.highestSensitiveLevel.toLowerCase() : "level NA";

        return `${oncogenic}, ${level}`;
    }

    constructor(props: IOncoKbProps)
    {
        super(props);

        this.handleFeedbackOpen = this.handleFeedbackOpen.bind(this);
        this.handleFeedbackClose = this.handleFeedbackClose.bind(this);
        this.handleLoadComplete = this.handleLoadComplete.bind(this);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render()
    {
        let oncoKbContent:JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );

        if (this.props.status === "error") {
            oncoKbContent = errorIcon("Error fetching OncoKB data");
        }
        else if (this.props.status === "pending") {
            oncoKbContent = loaderIcon("pull-left");
        }
        else
        {
            oncoKbContent = (
                <span className={`${annotationStyles["annotation-item"]}`}>
                    <i
                        className={`${oncogenicIconStyles['oncogenic-icon-image']}`}
                        style={this.getOncogenicIconsStyle(this.props.indicator)}
                        data-test='oncogenic-icon-image'
                        data-test2={this.props.hugoGeneSymbol}
                    />
                </span>
            );
            if (this.showFeedback)
            {
                oncoKbContent = (
                    <span>
                        {oncoKbContent}
                        <OncoKbFeedback
                            userEmailAddress={this.props.userEmailAddress}
                            hugoSymbol={this.props.hugoGeneSymbol}
                            alteration={this.props.evidenceQuery ? this.props.evidenceQuery.alteration : undefined}
                            showFeedback={this.showFeedback}
                            handleFeedbackClose={this.handleFeedbackClose}
                        />
                    </span>
                );
            }
            else if (this.tooltipDataLoadComplete || this.props.evidenceCache && this.props.evidenceQuery)
            {
                oncoKbContent = (
                    <DefaultTooltip
                        overlayClassName="oncokb-tooltip"
                        overlay={this.tooltipContent}
                        placement="right"
                        trigger={['hover', 'focus']}
                        onPopupAlign={hideArrow}
                        destroyTooltipOnHide={true}
                    >
                        {oncoKbContent}
                    </DefaultTooltip>
                );
            }
        }

        return oncoKbContent;
    }

    public loaderIcon()
    {
        return (
            <Circle size={18} scaleEnd={0.5} scaleStart={0.2} color="#aaa" className="pull-left"/>
        );
    }

    public errorIcon()
    {
        return (
            <DefaultTooltip
                overlay={<span>Error fetching OncoKB data</span>}
                placement="right"
                trigger={['hover', 'focus']}
                destroyTooltipOnHide={true}
            >
                <span className={`${annotationStyles["annotation-item-error"]}`}>
                    <i className="fa fa-exclamation-triangle text-danger" />
                </span>
            </DefaultTooltip>
        );
    }

    public feedbackModal(hugoSymbol?:string, alteration?:string)
    {
        const url = "https://docs.google.com/forms/d/1lt6TtecxHrhIE06gAKVF_JW4zKFoowNFzxn6PJv4g7A/viewform";
        const geneParam = `entry.1744186665=${hugoSymbol || ''}`;
        const alterationParam = `entry.1671960263=${alteration || ''}`;
        const userParam = `entry.1381123986=${this.props.userEmailAddress || ''}`;
        const uriParam = `entry.1083850662=${encodeURIComponent(getCurrentURLWithoutHash())}`;

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
                        <TableCellStatusIndicator status={TableCellStatus.LOADING} />
                    </iframe>
                </Modal.Body>
            </Modal>
        );
    }

    private tooltipContent(): JSX.Element
    {
        return (
            <OncoKbTooltip
                geneNotExist={this.props.geneNotExist}
                indicator={this.props.indicator || undefined}
                evidenceCache={this.props.evidenceCache}
                evidenceQuery={this.props.evidenceQuery}
                pubMedCache={this.props.pubMedCache}
                handleFeedbackOpen={this.handleFeedbackOpen}
                onLoadComplete={this.handleLoadComplete}
            />
        );
    }

    // purpose of this callback is to trigger re-instantiation
    // of the tooltip upon full load of the tooltip data
    private handleLoadComplete(): void {
        // update only once to avoid unnecessary re-rendering
        if (!this.tooltipDataLoadComplete) {
            this.tooltipDataLoadComplete = true;
        }
    }

    private handleFeedbackOpen(): void {
        this.showFeedback = true;
    }

    private handleFeedbackClose(): void {
        this.showFeedback = false;
    }
}
