import * as React from 'react';
import ColumnLegend, {
    IColumnLegendCategory,
} from 'shared/components/mutationTable/ColumnLegend';
import MutationTypeColumnFormatter from './column/MutationTypeColumnFormatter';
import VariantTypeColumnFormatter from './column/VariantTypeColumnFormatter';
import ValidationStatusColumnFormatter from './column/ValidationStatusColumnFormatter';
import mutationStatusStyles from './column/mutationStatus.module.scss';
import validationStatusStyles from './column/validationStatus.module.scss';

const MUTATION_TYPE_DESCRIPTIONS: { [displayValue: string]: string } = {
    Missense: 'Single amino acid substitution',
    Nonsense: 'Premature stop codon',
    Nonstop: 'Loss of the stop codon',
    Nonstart: 'Loss of the start codon',
    Truncating: 'Truncates the protein',
    FS: 'Frameshift: shifts the reading frame',
    'FS del': 'Frameshift deletion: shifts the reading frame',
    'FS ins': 'Frameshift insertion: shifts the reading frame',
    IF: 'In-frame: adds or removes amino acids without a frameshift',
    'IF del': 'In-frame deletion: removes amino acids without a frameshift',
    'IF ins': 'In-frame insertion: adds amino acids without a frameshift',
    Splice: 'Affects a splice site',
    Fusion: 'Gene fusion',
    Silent: 'No change to the amino acid sequence',
};

function getMutationTypeCategories(): IColumnLegendCategory[] {
    return Object.values(MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP)
        .filter(entry => entry.displayValue)
        .map(entry => ({
            value: entry.displayValue!,
            label: (
                <span className={entry.className}>{entry.displayValue}</span>
            ),
            description: MUTATION_TYPE_DESCRIPTIONS[entry.displayValue!],
        }));
}

export const MutationTypeColumnLegend: React.FunctionComponent = () => (
    <ColumnLegend
        description={
            <span>
                Consequence of the mutation on the protein (variant
                classification).
            </span>
        }
        categories={getMutationTypeCategories()}
    />
);

export const VariantTypeColumnLegend: React.FunctionComponent = () => {
    const variantTypeMap = VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP;
    const categories: IColumnLegendCategory[] = Object.keys(variantTypeMap)
        .filter(value => variantTypeMap[value].toolTip)
        .map(value => ({
            value,
            label: (
                <span className={variantTypeMap[value].className}>{value}</span>
            ),
            description: variantTypeMap[value].toolTip,
        }));
    return (
        <ColumnLegend
            description={
                <span>Type of change at the DNA level (variant type).</span>
            }
            categories={categories}
        />
    );
};

export const MutationStatusColumnLegend: React.FunctionComponent = () => (
    <ColumnLegend
        description={
            <span>
                Mutation Status (MS): whether the mutation was called as somatic
                or germline.
            </span>
        }
        categories={[
            {
                value: 'Somatic',
                description: 'Acquired in the tumor; absent in normal tissue',
                swatch: <span className={mutationStatusStyles.somatic}>S</span>,
            },
            {
                value: 'Germline',
                description: 'Inherited; also present in normal tissue',
                swatch: (
                    <span className={mutationStatusStyles.germline}>G</span>
                ),
            },
        ]}
    />
);

export const ValidationStatusColumnLegend: React.FunctionComponent = () => {
    const format = ValidationStatusColumnFormatter.VALIDATION_STATUS_FORMAT;
    const categories: IColumnLegendCategory[] = [
        {
            status: format.valid,
            description: 'Confirmed by an independent validation method',
        },
        {
            status: format.wildtype,
            description: 'Validation found the wildtype allele',
        },
        {
            status: format.unknown,
            description: 'Not validated, or validation status unknown',
        },
    ].map(({ status, description }) => ({
        value: status.tooltip,
        description,
        swatch: (
            <span
                className={
                    (validationStatusStyles as { [key: string]: string })[
                        status.className
                    ]
                }
            >
                {status.text}
            </span>
        ),
    }));
    return (
        <ColumnLegend
            description={
                <span>
                    Validation Status (VS): whether the mutation was confirmed
                    by an independent validation experiment.
                </span>
            }
            categories={categories}
        />
    );
};

const COPY_NUMBER_CATEGORIES: IColumnLegendCategory[] = [
    { value: 'Amp', color: 'red', description: 'High-level amplification' },
    { value: 'Gain', color: 'red', description: 'Low-level gain' },
    { value: 'Diploid', color: 'black', description: 'No copy number change' },
    {
        value: 'ShallowDel',
        color: 'blue',
        description: 'Shallow (possibly heterozygous) deletion',
    },
    {
        value: 'DeepDel',
        color: 'blue',
        description: 'Deep (possibly homozygous) deletion',
    },
].map(({ value, color, description }) => ({
    value,
    label: <span style={{ color }}>{value}</span>,
    description,
}));

export const CopyNumberColumnLegend: React.FunctionComponent = () => (
    <ColumnLegend
        description={
            <span>
                Putative copy number call for the gene in this sample. Hover
                over a value for details.
            </span>
        }
        categories={COPY_NUMBER_CATEGORIES}
    />
);
