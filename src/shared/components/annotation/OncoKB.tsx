import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import oncogenicIconStyles from "./styles/oncogenicIcon.module.scss";
import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import {
    oncogenicImageClassNames, calcOncogenicScore, calcSensitivityLevelScore, calcResistanceLevelScore
} from "shared/lib/OncoKbUtils";

export interface IOncoKbProps {
    indicator?: IndicatorQueryResp;
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

/**
 * @author Selcuk Onur Sumer
 */
export default class OncoKB extends React.Component<IOncoKbProps, {}>
{
    public static sortValue(indicator:IndicatorQueryResp|undefined):number[]
    {
        if (!indicator) {
            return [];
        }

        const values:number[] = [];

        values[0] = (indicator.variantExist || indicator.alleleExist || indicator.vus) ? 1 : 0;
        values[1] = calcOncogenicScore(indicator.oncogenic, indicator.vus);
        values[2] = (indicator.variantExist || indicator.alleleExist) ? 1 : 0;
        values[3] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[4] = calcResistanceLevelScore(indicator.highestResistanceLevel);

        return values;
    }

    constructor(props: IOncoKbProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        let oncoKbContent:JSX.Element = (
            <span/>
        );

        if (this.props.indicator)
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;
            const tooltipContent = <span>TODO: OncoKB Card Here!</span>;

            oncoKbContent = (
                <DefaultTooltip
                    overlay={tooltipContent}
                    placement="topLeft"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={placeArrow}
                >
                    <span className={`${annotationStyles["annotation-item"]}`}>
                        <i className={`${oncogenicIconStyles['oncogenic-icon-image']} ${this.oncogenicImageClassNames(this.props.indicator)}`} />
                    </span>
                </DefaultTooltip>
            );
        }

        return oncoKbContent;
    }

    public oncogenicImageClassNames(indicator:IndicatorQueryResp):string
    {
        let classNames:string[];

        if (indicator.oncogenic != null)
        {
            classNames = oncogenicImageClassNames(
                indicator.oncogenic,
                indicator.vus,
                indicator.highestSensitiveLevel,
                indicator.highestResistanceLevel
            );
        }
        else
        {
            classNames = oncogenicImageClassNames("N/A", false, "", "");
        }

        classNames = classNames.map(function(name) {
            return oncogenicIconStyles[name];
        });

        return classNames.join(' ');
    }
}
