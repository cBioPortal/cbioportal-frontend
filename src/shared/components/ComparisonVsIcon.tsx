import * as React from 'react';

interface IComparisonVsIconProps {
    width: number;
    style: any;
}
const ComparisonVsIcon: React.FunctionComponent<IComparisonVsIconProps> = ({
    width,
    style,
}: IComparisonVsIconProps) => {
    return (
        <img
            src={require('../../rootImages/compare_vs.svg')}
            style={{
                width,
                border: '1px solid black',
                padding: 2,
                ...style,
            }}
        />
    );
};

export default ComparisonVsIcon;
