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
 * @author Selcuk Onur Sumer
 */
export default class MyCancerGenome extends React.Component<IMyCancerGenomeProps, {}>
{
    public static sortValue(links: string[]):number
    {
        return (links.length > 0) ? 1 : 0;
    }

    public static myCancerGenomeLinks(linksHTML:string[])
    {
        const links:any[] = [];

        _.each(linksHTML, (link:string, index:number) => {
            // TODO we need to dangerously insert HTML since the data is formatted as an html link...
            links.push(
                <li key={index} dangerouslySetInnerHTML={{__html: link}} />
            );
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
