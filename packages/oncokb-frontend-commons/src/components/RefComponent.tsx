import Tooltip from 'rc-tooltip';
import { getNCBIlink } from '../lib/urls';
import * as React from 'react';

import { ReferenceList } from './ReferenceList';

import mainStyles from './main.module.scss';

export default class RefComponent extends React.Component<{
    content: string;
    componentType: 'tooltip' | 'linkout';
}> {
    render() {
        const parts = this.props.content.split(/pmid|nct|abstract/i);

        if (parts.length < 2) {
            return <span>{this.props.content}</span>;
        }

        // Slicing from index 1 to end to rejoin the abstract title and link
        // when there's the case that they also contain the string 'Abstract'
        // Example :
        //     (Abstract: Fakih et al. Abstract# 3003, ASCO 2019. https://meetinglibrary.asco.org/record/12411/Abstract)
        const abstractParts = parts
            .slice(1)
            .join('Abstract')
            .split(/(?=http)/i);
        const isAbstract = !(abstractParts.length < 2);

        const ids = parts[1].match(/[0-9]+/g);

        let prefix: string | undefined;
        let linkComponent: JSX.Element | undefined;
        let link: string | undefined;
        let linkText: string | undefined;

        if (isAbstract) {
            linkText = abstractParts[0].replace(/^[:\s]*/g, '').trim();
            link = abstractParts[1].replace(/[\\)]*$/g, '').trim();
            prefix = 'Abstract: ';
        } else {
            if (!ids) {
                return <span>{this.props.content}</span>;
            }

            if (this.props.content.toLowerCase().includes('pmid')) {
                prefix = 'PMID: ';
            } else if (this.props.content.toLowerCase().includes('nct')) {
                prefix = 'NCT';
            }

            linkText = ids.join(', ');
            link = getNCBIlink(`/pubmed/${ids.join(',')}`);
        }

        if (prefix) {
            linkComponent = (
                <a target="_blank" rel="noopener noreferrer" href={link}>
                    {`${prefix}${linkText}`}
                </a>
            );
        }

        if (this.props.componentType === 'tooltip') {
            const pmids = isAbstract
                ? []
                : ids!.map((id: string) => parseInt(id, 10));
            const abstracts = isAbstract ? [{ abstract: linkText, link }] : [];
            const tooltipContent = () => (
                <div className={mainStyles['tooltip-refs']}>
                    <ReferenceList pmids={pmids} abstracts={abstracts} />
                </div>
            );

            return (
                <span key={this.props.content}>
                    {parts[0]}
                    <Tooltip
                        overlay={tooltipContent}
                        placement="right"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <i className="fa fa-book" style={{ color: 'black' }} />
                    </Tooltip>
                    {`)`}
                </span>
            );
        } else if (linkComponent) {
            return (
                <span key={this.props.content}>
                    {parts[0]}
                    {linkComponent}
                    {`)`}
                </span>
            );
        } else {
            return <span>{this.props.content}</span>;
        }
    }
}
