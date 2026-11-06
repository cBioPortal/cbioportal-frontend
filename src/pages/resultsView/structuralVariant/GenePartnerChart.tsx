import * as React from 'react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { getGenePartnerCounts } from './GenePartnerUtils';

interface GenePartnerChartProps {
    queryGene: string;
    variants: StructuralVariant[];
    selectedPartner?: string;
    onPartnerSelect: (gene: string) => void;
}

export default function GenePartnerChart({
    queryGene,
    variants,
    selectedPartner,
    onPartnerSelect,
}: GenePartnerChartProps) {
    const partners = getGenePartnerCounts(variants, queryGene);
    const maxCount = Math.max(1, ...partners.map(partner => partner.count));

    if (partners.length === 0) {
        return null;
    }

    return (
        <section
            aria-label="Structural variant gene partners"
            style={{ margin: '16px 0', maxWidth: 650 }}
        >
            <h4>Structural Variant Gene Partners</h4>
            <p>Click a gene to filter the structural variants table.</p>

            {partners.map(partner => (
                <button
                    key={partner.gene}
                    type="button"
                    onClick={() => onPartnerSelect(partner.gene)}
                    aria-pressed={selectedPartner === partner.gene}
                    aria-label={`${partner.gene}: ${partner.count} structural variants`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 10,
                        padding: '5px 8px',
                        border: 0,
                        cursor: 'pointer',
                        background:
                            selectedPartner === partner.gene
                                ? '#e5f1fb'
                                : 'transparent',
                        textAlign: 'left',
                    }}
                >
                    <span style={{ width: 100, flexShrink: 0 }}>
                        {partner.gene}
                    </span>

                    <span
                        aria-hidden="true"
                        style={{
                            display: 'block',
                            width: `${(partner.count / maxCount) * 100}%`,
                            minWidth: 4,
                            height: 18,
                            background: '#337ab7',
                        }}
                    />

                    <span>{partner.count}</span>
                </button>
            ))}
        </section>
    );
}
