import * as React from 'react';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';

type PQValueLabelProps = {
    x: number;
    y: number;
    pValue: number | null;
    qValue: number | null;
};

export const PQValueLabel: React.FunctionComponent<PQValueLabelProps> = props => {
    const pFormatted = formatLabel('p', props.pValue);
    const qFormatted = formatLabel('q', props.qValue);
    return (
        <foreignObject
            x={props.x}
            y={props.y}
            width="100%"
            height="3em"
            style={{ fontSize: '0.8em' }}
        >
            <g
                x={props.x}
                y={props.y}
                style={{ position: 'absolute' }}
                xmlns="http://www.w3.org/1999/xhtml"
            >
                <div className="p-value-label">{pFormatted}</div>
                <div className="q-value-label">{qFormatted}</div>
            </g>
        </foreignObject>
    );

    function formatLabel(name: string, value: number | null) {
        if (value != null) {
            return (
                <>
                    {name}{' '}
                    {toConditionalPrecisionWithMinimum(
                        value,
                        3,
                        0.01,
                        -10,
                        true
                    )}
                </>
            );
        }
        return '';
    }
};
