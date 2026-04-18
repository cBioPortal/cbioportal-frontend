import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Exon, ProteinDomain } from '../data/types';

// ---------------------------------------------------------------------------
// ExonTooltip
// ---------------------------------------------------------------------------
export interface ExonTooltipProps {
    gene: string;
    exon: Exon;
    children: React.ReactElement;
}

export const ExonTooltip: React.FC<ExonTooltipProps> = ({
    gene,
    exon,
    children,
}) => {
    const sizeBp = Math.abs(exon.end - exon.start) + 1;

    const overlay = (
        <div style={{ padding: 4, maxWidth: 260 }}>
            <strong>{gene}</strong> &mdash; Exon {exon.number}
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                {exon.start.toLocaleString()} &ndash;{' '}
                {exon.end.toLocaleString()}
            </span>
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                Size: {sizeBp.toLocaleString()} bp
            </span>
            {exon.ensemblId && (
                <>
                    <br />
                    <span style={{ fontSize: 11, color: '#999' }}>
                        {exon.ensemblId}
                    </span>
                </>
            )}
        </div>
    );

    return (
        <DefaultTooltip placement="top" overlay={overlay}>
            {children}
        </DefaultTooltip>
    );
};

// ---------------------------------------------------------------------------
// BreakpointTooltip
// ---------------------------------------------------------------------------
export interface BreakpointTooltipProps {
    chromosome: string;
    position: number;
    siteDescription: string;
    children: React.ReactElement;
}

export const BreakpointTooltip: React.FC<BreakpointTooltipProps> = ({
    chromosome,
    position,
    siteDescription,
    children,
}) => {
    const overlay = (
        <div style={{ padding: 4, maxWidth: 280 }}>
            <strong>Breakpoint</strong>
            <br />
            <span style={{ fontSize: 11 }}>
                chr{chromosome}:{position.toLocaleString()}
            </span>
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                {siteDescription}
            </span>
        </div>
    );

    return (
        <DefaultTooltip placement="top" overlay={overlay}>
            {children}
        </DefaultTooltip>
    );
};

// ---------------------------------------------------------------------------
// DomainTooltip
// ---------------------------------------------------------------------------
export interface DomainTooltipProps {
    domain: ProteinDomain;
    children: React.ReactElement;
}

export const DomainTooltip: React.FC<DomainTooltipProps> = ({
    domain,
    children,
}) => {
    const overlay = (
        <div style={{ padding: 4, maxWidth: 300 }}>
            <strong>{domain.name}</strong>
            <br />
            <span style={{ fontSize: 11 }}>Pfam: {domain.pfamId}</span>
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                Source: {domain.source}
            </span>
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                AA range: {domain.startAA} &ndash; {domain.endAA}
            </span>
        </div>
    );

    return (
        <DefaultTooltip placement="top" overlay={overlay}>
            {children}
        </DefaultTooltip>
    );
};
