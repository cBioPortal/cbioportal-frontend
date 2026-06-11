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
// PromoterSwapTooltip — explains why the promoter-swap badge fired
// ---------------------------------------------------------------------------
export interface PromoterSwapTooltipProps {
    gene5p: string;
    gene3p: string;
    chromosome: string;
    position: number;
    children: React.ReactElement;
}

export const PromoterSwapTooltip: React.FC<PromoterSwapTooltipProps> = ({
    gene5p,
    gene3p,
    chromosome,
    position,
    children,
}) => {
    const overlay = (
        <div style={{ padding: 4, maxWidth: 300 }}>
            <strong>Promoter swap</strong>
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                {gene5p}&apos;s promoter / 5&prime;UTR is retained but
                contributes no coding sequence — the 5&prime; breakpoint (chr
                {chromosome}:{position.toLocaleString()}) lies within the
                5&prime;UTR (at/upstream of the CDS start).
            </span>
            <br />
            <span style={{ fontSize: 11, color: '#666' }}>
                So {gene3p}&apos;s ORF is expressed from {gene5p}&apos;s
                promoter rather than its own.
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
