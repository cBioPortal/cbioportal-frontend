import React from 'react';
import { Popover } from 'react-bootstrap';
import { CirclePicker, CirclePickerProps } from 'react-color';

export const ColorChooserWidget: React.FunctionComponent<CirclePickerProps> = ({
    colors,
    circleSize,
    circleSpacing,
    onChangeComplete,
    color,
    width,
}) => {
    return (
        <Popover
            id="popover-basic"
            onClick={e => {
                e.stopPropagation();
                e.preventDefault();
            }}
            style={{ marginTop: '5px' }}
        >
            <div>
                <CirclePicker
                    colors={colors}
                    circleSize={circleSize}
                    circleSpacing={circleSpacing}
                    onChangeComplete={onChangeComplete}
                    color={color}
                    width={width}
                />
            </div>
        </Popover>
    );
};
