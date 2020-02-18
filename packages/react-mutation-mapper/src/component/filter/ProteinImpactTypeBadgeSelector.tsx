import { Option, ProteinImpactType } from 'cbioportal-frontend-commons';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { CSSProperties } from 'react';

import { IProteinImpactTypeColors } from '../../model/ProteinImpact';
import { DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from '../../util/MutationUtils';
import { BadgeLabel } from './BadgeLabel';
import BadgeSelector, {
    BadgeSelectorOption,
    BadgeSelectorProps,
    getBadgeStyleOverride,
} from './BadgeSelector';
import {
    getProteinImpactTypeColorMap,
    getProteinImpactTypeOptionDisplayValueMap,
} from './ProteinImpactTypeHelper';

export type ProteinImpactTypeBadgeSelectorProps = BadgeSelectorProps & {
    colors: IProteinImpactTypeColors;
    counts?: { [proteinImpactType: string]: number };
};

const VALUES = [
    ProteinImpactType.MISSENSE,
    ProteinImpactType.TRUNCATING,
    ProteinImpactType.INFRAME,
    ProteinImpactType.OTHER,
];

export function getProteinImpactTypeOptionLabel(option: Option): JSX.Element {
    return <span>{option.label || option.value}</span>;
}

export function getProteinImpactTypeBadgeLabel(
    option: BadgeSelectorOption,
    selectedValues: { [optionValue: string]: any },
    badgeClassName?: string,
    badgeAlignmentStyle?: CSSProperties
): JSX.Element {
    return (
        <BadgeLabel
            label={option.label || option.value}
            badgeContent={option.badgeContent}
            badgeStyleOverride={getBadgeStyleOverride(option, selectedValues, badgeAlignmentStyle)}
            badgeClassName={badgeClassName}
            badgeFirst={true}
        />
    );
}

@observer
export class ProteinImpactTypeBadgeSelector extends React.Component<
    ProteinImpactTypeBadgeSelectorProps,
    {}
> {
    public static defaultProps: Partial<ProteinImpactTypeBadgeSelectorProps> = {
        colors: DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
        alignColumns: true,
        unselectOthersWhenAllSelected: true,
        numberOfColumnsPerRow: 2,
    };

    @computed
    protected get optionDisplayValueMap() {
        return getProteinImpactTypeOptionDisplayValueMap(this.proteinImpactTypeColors);
    }

    @computed
    protected get proteinImpactTypeColors() {
        return getProteinImpactTypeColorMap(this.props.colors);
    }

    @computed
    protected get options() {
        return VALUES.map(value => ({
            value,
            label: this.optionDisplayValueMap[value],
            badgeContent: this.props.counts ? this.props.counts[value] : undefined,
            badgeStyleOverride: {
                backgroundColor: this.proteinImpactTypeColors[value],
            },
        }));
    }

    public render() {
        return (
            <BadgeSelector
                options={this.options}
                getOptionLabel={getProteinImpactTypeOptionLabel}
                getBadgeLabel={getProteinImpactTypeBadgeLabel}
                {...this.props}
            />
        );
    }
}

export default ProteinImpactTypeBadgeSelector;
