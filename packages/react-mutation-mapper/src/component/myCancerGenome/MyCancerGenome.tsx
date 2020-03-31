import * as React from 'react';
import * as _ from 'lodash';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

import { parseMyCancerGenomeLink } from '../../util/MyCancerGenomeUtils';

import mcgLogo from '../../images/mcg_logo.png';
import annotationStyles from '../column/annotation.module.scss';
import mcgStyles from './myCancerGenome.module.scss';

export interface IMyCancerGenomeProps {
    linksHTML: string[];
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

export function sortValue(links: string[]): number {
    return links.length > 0 ? 1 : 0;
}

export function download(links: string[]): string {
    return links.length > 0 ? 'present' : 'not present';
}

export function myCancerGenomeLinks(linksHTML: string[]) {
    const links: any[] = [];

    _.each(linksHTML, (link: string, index: number) => {
        // TODO this is a workaround, ideally we should fix the data itself
        // parse the data as an HTML dom element, since it is formatted as an HTML link.
        const myCancerGenomeLink = parseMyCancerGenomeLink(link);

        if (myCancerGenomeLink) {
            links.push(
                <li key={index}>
                    <a href={myCancerGenomeLink.url} target="_blank">
                        {myCancerGenomeLink.text}
                    </a>
                </li>
            );
        }
    });

    return (
        <span>
            <b>My Cancer Genome links:</b>
            <br />
            <ul className={mcgStyles['link-list']}>{links}</ul>
        </span>
    );
}

export default class MyCancerGenome extends React.Component<
    IMyCancerGenomeProps
> {
    public render() {
        let myCancerGenomeContent: JSX.Element = (
            <span className={`${annotationStyles['annotation-item']}`} />
        );

        if (this.props.linksHTML.length > 0) {
            const arrowContent = <div className="rc-tooltip-arrow-inner" />;
            const tooltipContent = myCancerGenomeLinks(this.props.linksHTML);

            myCancerGenomeContent = (
                <DefaultTooltip
                    overlay={tooltipContent}
                    placement="topLeft"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={placeArrow}
                >
                    <span
                        className={`${annotationStyles['annotation-item']} mcg`}
                    >
                        <img
                            width="14"
                            height="14"
                            src={mcgLogo}
                            alt="My Cancer Genome Symbol"
                        />
                    </span>
                </DefaultTooltip>
            );
        }

        return myCancerGenomeContent;
    }
}
