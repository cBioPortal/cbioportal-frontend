import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {Circle} from "better-react-spinkit";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import {ITrialMatchVariant, ITrialMatchEntry} from "shared/model/TrialMatch.ts";
import {observable} from "mobx";
import TrialCard from "./TrialCard";

export interface ITrialMatchProps {
    trialMatchEntry: ITrialMatchEntry | null | undefined;
    trialMatchStatus: "pending" | "error" | "complete";
    hasTrialMatchVariants: boolean;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

@observer
export default class TrialMatch extends React.Component<ITrialMatchProps, {}>
{
    @observable tooltipDataLoadComplete:boolean = false;

    public static sortValue(trialMatchEntry:ITrialMatchEntry | null | undefined): number
    {
        let score: number = 0;

        if (trialMatchEntry) {
            score = 1;
        }

        return score;
    }

    public static download(trialMatchEntry:ITrialMatchEntry | null | undefined): string
    {
        if (!trialMatchEntry) {
            return "NA";
        }

        const variants = _.values(trialMatchEntry.variants);
        const values: string[] = [];

        if (variants && variants.length > 0 && variants[0].matches)
        {
            _.toPairs(variants[0].matches).forEach(pair => {
                values.push(`${pair[0]}: ${pair[1]}`);
            });
        }

        // TODO actually this indicates that we have an entry but the evidence is empty
        if (values.length === 0) {
            return "NA";
        }

        return values.join(", ");
    }

    constructor(props: ITrialMatchProps)
    {
        super(props);

        this.cardContent = this.cardContent.bind(this);
    }

    public render()
    {
        let trialMatchContent:JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );

        const trialMatchImgWidth:number = 14;
        const trialMatchImgHeight:number = 14;
        let trialMatchImgSrc = require("./images/clinic.png");
        if (!this.props.hasTrialMatchVariants)
        {
            trialMatchImgSrc = require("./images/clinic.png");
        }

        if (this.props.trialMatchStatus === "error") {
            trialMatchContent = this.errorIcon();
        }
        else if (this.props.trialMatchEntry !== undefined)
        {
            if (this.props.trialMatchEntry !== null && this.props.trialMatchStatus === "complete")
            {
                trialMatchContent = (
                    <span className={`${annotationStyles["annotation-item"]}`}>
                        <img
                            width={trialMatchImgWidth}
                            height={trialMatchImgHeight}
                            src={trialMatchImgSrc}
                            alt='TrialMatch Variant Entry'
                        />
                    </span>
                );

                const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

                trialMatchContent = (
                    <DefaultTooltip
                        overlay={this.cardContent.bind(this, this.props.trialMatchEntry)}
                        placement="right"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        onPopupAlign={hideArrow}
                        destroyTooltipOnHide={false}
                    >
                        {trialMatchContent}
                    </DefaultTooltip>
                );
            }
        }
        else
        {
            // It's still unknown (undefined) if the current gene has a Civic entry or not.
            trialMatchContent = this.loaderIcon();
        }

        return trialMatchContent;
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
                overlay={<span>Error fetching Trial data</span>}
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

    private cardContent(trialMatchEntry: ITrialMatchEntry): JSX.Element
    {
        return (
            <TrialCard
                title={`Match Patient-specific Genomic Events to Clinical Trials`}
                geneName={trialMatchEntry.name}
                variants={trialMatchEntry.variants}
            />
        );
    }
}
