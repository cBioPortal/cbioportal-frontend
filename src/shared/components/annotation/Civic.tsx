import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {Circle} from "better-react-spinkit";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import {ICivicVariant, ICivicEntry} from "shared/model/Civic.ts";
import {observable} from "mobx";
import CivicCard from "./CivicCard";

export interface ICivicProps { 
    civicEntry: ICivicEntry | null | undefined;
    civicStatus: "pending" | "error" | "complete";
    hasCivicVariants: boolean;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

@observer
export default class Civic extends React.Component<ICivicProps, {}>
{
    @observable tooltipDataLoadComplete:boolean = false;
    
    public static sortValue(civicEntry:ICivicEntry | null | undefined): number
    {
        let score: number = 0;

        if (civicEntry) {
            score = 1;
        }

        return score;
    }

    public static download(civicEntry:ICivicEntry | null | undefined): string
    {
        if (!civicEntry) {
            return "NA";
        }

        const variants = _.values(civicEntry.variants);
        const values: string[] = [];

        if (variants && variants.length > 0 && variants[0].evidence)
        {
            _.toPairs(variants[0].evidence).forEach(pair => {
                values.push(`${pair[0]}: ${pair[1]}`);
            });
        }

        // TODO actually this indicates that we have an entry but the evidence is empty
        if (values.length === 0) {
            return "NA";
        }

        return values.join(", ");
    }

    constructor(props: ICivicProps)
    {
        super(props);

        this.cardContent = this.cardContent.bind(this);
    }

    public render()
    {
        let civicContent:JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );
        
        const civicImgWidth:number = 14;
        let civicImgHeight:number = 14;
        let civicImgSrc = require("./images/civic-logo.png");
        if (!this.props.hasCivicVariants)
        {
            civicImgSrc = require("./images/civic-logo-no-variants.png");
        }

        if (this.props.civicStatus == "error") {
            civicContent = this.errorIcon();
        }
        else if (this.props.civicEntry !== undefined)
        {
            if (this.props.civicEntry !== null && this.props.civicStatus == "complete")
            {
                civicContent = (
                    <span className={`${annotationStyles["annotation-item"]}`}>
                        <img
                            width={civicImgWidth}
                            height={civicImgHeight}
                            src={civicImgSrc}
                            alt='Civic Variant Entry'
                        />
                    </span>
                );
    
                const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

                civicContent = (
                    <DefaultTooltip
                        overlay={this.cardContent.bind(this, this.props.civicEntry)}
                        placement="right"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        onPopupAlign={hideArrow}
                        destroyTooltipOnHide={false}
                    >
                        {civicContent}
                    </DefaultTooltip>
                );
            }
        }
        else
        {
            // It's still unknown (undefined) if the current gene has a Civic entry or not.
            civicContent = this.loaderIcon();
        }

        return civicContent;
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
                overlay={<span>Error fetching Civic data</span>}
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

    private cardContent(civicEntry: ICivicEntry): JSX.Element
    {
        return (
            <CivicCard
                title={`CIViC Variants`}
                geneName={civicEntry.name}
                geneDescription={civicEntry.description}
                geneUrl={civicEntry.url}
                variants={civicEntry.variants}
            />
        );
    }
}
