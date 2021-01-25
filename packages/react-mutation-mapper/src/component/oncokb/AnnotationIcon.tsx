import React from 'react';
import { OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

import {
    levelIconClassNames,
    normalizeLevel,
    oncogenicityIconClassNames,
} from '../../util/OncoKbUtils';

import annotationStyles from '../column/annotation.module.scss';

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export const AnnotationIcon: React.FunctionComponent<{
    type: OncoKbCardDataType;
    tooltipOverlay?: JSX.Element;
    indicator?: IndicatorQueryResp;
    availableDataTypes?: OncoKbCardDataType[];
}> = props => {
    if (
        props.availableDataTypes !== undefined &&
        !props.availableDataTypes.includes(props.type)
    ) {
        return null;
    }
    let highestLevel = '';
    if (props.indicator) {
        switch (props.type) {
            case OncoKbCardDataType.TXS:
                highestLevel = props.indicator.highestSensitiveLevel;
                break;
            case OncoKbCardDataType.TXR:
                highestLevel = props.indicator.highestResistanceLevel;
                break;
            case OncoKbCardDataType.DX:
                highestLevel =
                    props.indicator.highestDiagnosticImplicationLevel;
                break;
            case OncoKbCardDataType.PX:
                highestLevel =
                    props.indicator.highestPrognosticImplicationLevel;
                break;
        }
    }
    return (
        <span className={`${annotationStyles['annotation-item']}`}>
            <DefaultTooltip
                overlayClassName="oncokb-tooltip"
                overlay={() =>
                    props.tooltipOverlay ? props.tooltipOverlay : null
                }
                placement="right"
                trigger={['hover', 'focus']}
                onPopupAlign={hideArrow}
                destroyTooltipOnHide={true}
            >
                <i
                    className={
                        props.type === OncoKbCardDataType.BIOLOGICAL
                            ? oncogenicityIconClassNames(
                                  props.indicator?.oncogenic || ''
                              )
                            : levelIconClassNames(
                                  normalizeLevel(highestLevel) || ''
                              )
                    }
                    data-test="oncogenic-icon-image"
                />
            </DefaultTooltip>
        </span>
    );
};
