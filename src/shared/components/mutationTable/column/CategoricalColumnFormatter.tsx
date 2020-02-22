import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface ICategoricalColumn {
    displayValue?: string;
    toolTip?: string;
    className: string;
}

export default class CategoricalColumnFormatter {
    /**
     * Boilerplate code to create tool tip.
     */
    public static createToolTip(content: JSX.Element, toolTip: string) {
        const arrowContent = <div className="rc-tooltip-arrow-inner" />;
        content = (
            <DefaultTooltip
                overlay={<span>{toolTip}</span>}
                placement="left"
                arrowContent={arrowContent}
            >
                {content}
            </DefaultTooltip>
        );
        return content;
    }
}
