import * as React from 'react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import BarChartAxisLabelIgnoreType from '../barChart/BarChartAxisLabel';

export class CategoryBarChartAxisLabel extends BarChartAxisLabelIgnoreType {
    getTspan(content: string[], tspanProps: any, style: any, datum: any) {
        let tspan: any = [];
        const tooltip = (
            <Tooltip id={`tooltip-${datum}`}>{`${content.join(' ')}`}</Tooltip>
        );

        content.forEach((line, index) => {
            const isSuperscript = index > 0;
            const superscriptStyle = isSuperscript
                ? {
                      dy: -style[0].fontSize / 2,
                      style: { ...style[0], fontSize: style[0].fontSize * 0.7 },
                  }
                : {};

            tspan.push(
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <tspan {...tspanProps} {...superscriptStyle}>
                        {line.length > 4
                            ? line.slice(0, 4).trim() + '...'
                            : line}
                    </tspan>
                </OverlayTrigger>
            );
        });

        return tspan;
    }
}

// we need to ignore the type of CategoryBarChartAxisLabel to avoid typescript error
const CategoryBarChartAxisLabelIgnoreType = CategoryBarChartAxisLabel as any;
export default CategoryBarChartAxisLabelIgnoreType;
