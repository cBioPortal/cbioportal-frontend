import * as React from 'react';
import {Circle} from "better-react-spinkit";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {loaderIcon} from "./StatusHelpers";

import annotationStyles from "./styles/annotation.module.scss";
import hotspotStyles from "./styles/cancerHotspots.module.scss";
import {getNCBIlink} from "../../api/urls";

export interface ICancerHotspotsProps {
    status: "pending" | "error" | "complete";
    isHotspot: boolean;
    is3dHotspot: boolean;
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

/**
 * @author Selcuk Onur Sumer
 */
export default class CancerHotspots extends React.Component<ICancerHotspotsProps, {}>
{
    public static sortValue(isHotspot:boolean, is3dHotspot:boolean):number
    {
        let score:number = 0;

        if (isHotspot) {
            score += 1;
        }

        if (is3dHotspot) {
            score += 0.5;
        }

        return score;
    }

    public static hotspotInfo(isHotspot:boolean, is3dHotspot:boolean, count?: number, customInfo?: JSX.Element)
    {
        return (
            <span className={hotspotStyles["hotspot-info"]}>
                {CancerHotspots.title(isHotspot, is3dHotspot, count, customInfo)}
                <br/>
                {CancerHotspots.publication(isHotspot, is3dHotspot)}
                <br/><br/>
                {CancerHotspots.link(isHotspot, is3dHotspot)}
            </span>
        );
    }

    public static title(isHotspot:boolean, is3dHotspot:boolean, count?: number, customInfo?: JSX.Element)
    {
        const recurrentHotspot = isHotspot ? (<b>Recurrent Hotspot</b>) : null;
        const maybeAnd = isHotspot && is3dHotspot ? <span>and</span> : null;
        const clusteredHotspot = is3dHotspot ? (<b>3D Clustered Hotspot</b>) : null;

        let countInfo: JSX.Element|null = null;

        if (count) {
            const sample = count > 1 ? "samples" : "sample";
            countInfo = <span><b>{count}</b> {sample} with</span>;
        }

        return (
            <span>
                {countInfo} {recurrentHotspot} {maybeAnd} {clusteredHotspot} {customInfo}
            </span>
        );
    }

    public static publication(isHotspot:boolean, is3dHotspot:boolean)
    {
        const recurrentHotspot = isHotspot ? "a recurrent hotspot (statistically significant)" : "";
        const maybeAnd = isHotspot && is3dHotspot ? "and" : "";
        const clusteredHotspot = is3dHotspot ? "a 3D clustered hotspot" : "";

        const recurrentPublication = isHotspot ? (
                <a href={getNCBIlink(`/pubmed/26619011`)} target="_blank">
                    Chang et al., Nat Biotechnol, 2016
                </a>
            ) : "";

        const clusteredPublication = is3dHotspot ? (
                <a href="http://genomemedicine.biomedcentral.com/articles/10.1186/s13073-016-0393-x" target="_blank">
                    Gao et al., Genome Medicine, 2017
                </a>
            ) : "";

        return (
            <span>
                This mutated amino acid was identified as {recurrentHotspot} {maybeAnd} {clusteredHotspot} in a
                population-scale cohort of tumor samples of various cancer types using methodology based in part
                on {recurrentPublication} {maybeAnd} {clusteredPublication}.
            </span>
        );
    }

    public static link(isHotspot:boolean, is3dHotspot:boolean)
    {
        const recurrentLink = isHotspot ? (
                <a href="http://www.cancerhotspots.org/" target="_blank">
                    http://cancerhotspots.org/
                </a>
            ) : "";

        const maybeAnd = isHotspot && is3dHotspot ? "and" : "";

        const clusteredLink = is3dHotspot ? (
                <a href="http://www.3dhotspots.org/" target="_blank">
                    http://3dhotspots.org/
                </a>
            ) : "";

        return (
            <span>
                Explore all mutations at {recurrentLink} {maybeAnd} {clusteredLink}.
            </span>
        );
    }

    constructor(props: ICancerHotspotsProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {isHotspot, is3dHotspot} = this.props;

        let hotspotContent = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );

        if (this.props.status === "pending") {
            hotspotContent = loaderIcon("pull-left");
        }
        else if (isHotspot || is3dHotspot)
        {
            const hotspotsImgWidth:number = 14;
            let hotspotsImgHeight:number = 14;
            let hotspotsImgSrc = require("./images/cancer-hotspots.svg");

            // if it is a 3D hotspot but not a recurrent hotspot, show the 3D hotspot icon
            if (!isHotspot)
            {
                hotspotsImgSrc = require("./images/3d-hotspots.svg");
                hotspotsImgHeight = 18;
            }

            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            const tooltipContent = CancerHotspots.hotspotInfo(isHotspot, is3dHotspot);

            hotspotContent = (
                <DefaultTooltip
                    overlay={tooltipContent}
                    placement="topLeft"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={placeArrow}
                >
                    <span className={`${annotationStyles["annotation-item"]} chang_hotspot`}>
                        <img
                            width={hotspotsImgWidth}
                            height={hotspotsImgHeight}
                            src={hotspotsImgSrc}
                            alt='Recurrent Hotspot Symbol'
                        />
                    </span>
                </DefaultTooltip>
            );
        }

        return hotspotContent;
    }
}
