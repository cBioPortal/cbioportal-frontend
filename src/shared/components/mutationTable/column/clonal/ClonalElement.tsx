import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import { ClonalValue } from './ClonalColumnFormatter';

export enum ClonalColor {
    LIMEGREEN = 'limegreen',
    DIMGREY = 'dimgrey',
    LIGHTGREY = 'lightgrey',
    WHITE = 'white',
}

function getClonalCircleColor(clonalValue: string): ClonalColor {
    switch (clonalValue) {
        case ClonalValue.CLONAL:
            return ClonalColor.LIMEGREEN;
        case ClonalValue.SUBCLONAL:
            return ClonalColor.WHITE;
        // Indeterminate/NA falls under this case
        default:
            return ClonalColor.LIGHTGREY;
    }
}

function getClonalStrokeColor(clonalValue: string): ClonalColor {
    switch (clonalValue) {
        case ClonalValue.CLONAL:
            return ClonalColor.LIMEGREEN;
        case ClonalValue.SUBCLONAL:
            return ClonalColor.DIMGREY;
        // Indeterminate/NA falls under this case
        default:
            return ClonalColor.LIGHTGREY;
    }
}

export const ClonalElementTooltip: React.FunctionComponent<{
    sampleId: string;
    clonalValue: string;
    ccfExpectedCopies: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const firstColumnStyle = {
        width: 40,
        display: 'inline-block',
    };
    return (
        <div data-test="clonal-tooltip">
            {props.sampleManager ? (
                <div>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}
                </div>
            ) : null}
            <div>
                <span style={firstColumnStyle}>Clonal</span>
                <strong
                    style={{
                        color: `${getClonalStrokeColor(props.clonalValue)}`,
                    }}
                >
                    {props.clonalValue !== ClonalValue.NA
                        ? props.clonalValue.toLowerCase()
                        : props.clonalValue}
                </strong>
            </div>
            <div>
                <span style={firstColumnStyle}>CCF</span>
                <strong>{props.ccfExpectedCopies}</strong>
            </div>
        </div>
    );
};

const ClonalCircle: React.FunctionComponent<{
    clonalValue: string;
}> = props => {
    return (
        <svg
            height="10"
            width="10"
            data-test={`${
                props.clonalValue !== undefined
                    ? props.clonalValue.toLowerCase()
                    : 'na'
            }-icon`}
        >
            <circle
                cx={5}
                cy={5}
                r={4}
                stroke={getClonalStrokeColor(props.clonalValue)}
                stroke-width={1}
                fill={getClonalCircleColor(props.clonalValue)}
                opacity={
                    getClonalCircleColor(props.clonalValue) !==
                    ClonalColor.LIGHTGREY
                        ? 100
                        : 0
                }
            />
        </svg>
    );
};

const ClonalElement: React.FunctionComponent<{
    sampleId: string;
    clonalValue: string; //clonal, subclonal, NA
    ccfExpectedCopies: string;
    sampleManager?: SampleManager | null;
}> = props => {
    if (props.clonalValue === ClonalValue.NA) {
        return (
            <span>
                <ClonalCircle clonalValue={props.clonalValue} />
            </span>
        );
    } else {
        return (
            <DefaultTooltip
                overlay={<ClonalElementTooltip {...props} />}
                placement="left"
            >
                <span>
                    <ClonalCircle clonalValue={props.clonalValue} />
                </span>
            </DefaultTooltip>
        );
    }
};

export default ClonalElement;
