import * as React from 'react';
import * as _ from 'lodash';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import mcgStyles from "./styles/myCancerGenome.module.scss";

export interface IMyCancerGenomeProps {
    linksHTML: string[];
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

/**
 * This is NOT a generic html anchor tag parser. Assuming all MyCancerGenome links have the same simple structure.
 * DOMParser can be used for generic parsing purposes, but it is not compatible with the current test environment.
 * (i.e: DOMParser unit tests always fail, but it works fine in the browser)
 */
export function parseMyCancerGenomeLink(link: string)
{
    // Generic DOMParser solution (not compatible with the current unit test environment):
    // const parser = new DOMParser();
    // const htmlDoc = parser.parseFromString(link, "text/html");
    // const links = htmlDoc.getElementsByTagName('a');

    // assuming that we only have one attribute which is href
    const hrefStart = link.indexOf('"') + 1;
    const hrefEnd = hrefStart + link.slice(hrefStart).indexOf('"');

    // assuming that the text starts right after the first >, and ends right before the </a>
    const textStart = link.indexOf(">") + 1;
    const textEnd = link.indexOf("</a>");

    const href = link.slice(hrefStart, hrefEnd).trim();
    const text = link.slice(textStart, textEnd).trim();

    if (href.length > 0 && text.length > 0) {
        return {
            url: href,
            text: text
        };
    }
    else {
        return undefined;
    }
}

/**
 * @author Selcuk Onur Sumer
 */
export default class MyCancerGenome extends React.Component<IMyCancerGenomeProps, {}>
{
    public static sortValue(links: string[]):number
    {
        return (links.length > 0) ? 1 : 0;
    }

    public static download(links: string[]): string
    {
        return (links.length > 0) ? "present" : "not present";
    }

    public static myCancerGenomeLinks(linksHTML:string[])
    {
        const links:any[] = [];

        _.each(linksHTML, (link:string, index:number) => {
            // TODO this is a workaround, ideally we should fix the data itself
            // parse the data as an HTML dom element, since it is formatted as an HTML link.
            const myCancerGenomeLink = parseMyCancerGenomeLink(link);

            if (myCancerGenomeLink) {
                links.push(
                    <li key={index}>
                        <a href={myCancerGenomeLink.url} target="_blank">{myCancerGenomeLink.text}</a>
                    </li>
                );
            }
        });

        return (
            <span>
                <b>My Cancer Genome links:</b>
                <br/>
                <ul className={mcgStyles["link-list"]}>
                    {links}
                </ul>
            </span>
        );
    }

    constructor(props: IMyCancerGenomeProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        let myCancerGenomeContent:JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );

        if (this.props.linksHTML.length > 0)
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            const tooltipContent = MyCancerGenome.myCancerGenomeLinks(this.props.linksHTML);

            myCancerGenomeContent = (
                <DefaultTooltip
                    overlay={tooltipContent}
                    placement="topLeft"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={placeArrow}
                >
                    <span className={`${annotationStyles["annotation-item"]} mcg`}>
                        <img width='14' height='14' src={require("./images/mcg_logo.png")} alt='My Cancer Genome Symbol' />
                    </span>
                </DefaultTooltip>
            );
        }

        return myCancerGenomeContent;
    }
}
