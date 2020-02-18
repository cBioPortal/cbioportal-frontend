import { DefaultTooltip, getNCBIlink, ICache } from 'cbioportal-frontend-commons';
import * as React from 'react';

import ReferenceList from './ReferenceList';

import mainStyles from './main.module.scss';

export default class RefComponent extends React.Component<{
    content: string;
    componentType: 'tooltip' | 'linkout';
    pmidData: ICache<any>;
}> {
    render() {
        const parts = this.props.content.split(/pmid|nct/i);

        if (parts.length < 2) {
            return <span>{this.props.content}</span>;
        }

        const ids = parts[1].match(/[0-9]+/g);

        if (!ids) {
            return <span>{this.props.content}</span>;
        }

        let prefix: string | undefined;

        if (this.props.content.toLowerCase().indexOf('pmid') >= 0) {
            prefix = 'PMID: ';
        } else if (this.props.content.toLowerCase().indexOf('nct') >= 0) {
            prefix = 'NCT';
        }

        let link: JSX.Element | undefined;

        if (prefix) {
            link = (
                <a target="_blank" href={getNCBIlink(`/pubmed/${ids.join(',')}`)}>
                    {`${prefix}${ids.join(',')}`}
                </a>
            );
        }

        if (this.props.componentType === 'tooltip') {
            const tooltipContent = () => (
                <div className={mainStyles['tooltip-refs']}>
                    <ReferenceList
                        pmids={ids.map((id: string) => parseInt(id))}
                        pmidData={this.props.pmidData}
                        abstracts={[]}
                    />
                </div>
            );

            return (
                <span key={this.props.content}>
                    {parts[0]}
                    <DefaultTooltip
                        overlay={tooltipContent}
                        placement="right"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <i className="fa fa-book" style={{ color: 'black' }} />
                    </DefaultTooltip>
                    {`)`}
                </span>
            );
        } else if (link) {
            return (
                <span key={this.props.content}>
                    {parts[0]}
                    {link}
                    {`)`}
                </span>
            );
        } else {
            return <span>{this.props.content}</span>;
        }
    }
}
