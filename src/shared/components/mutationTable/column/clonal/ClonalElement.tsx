import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';

enum ClonalColor {
    LIMEGREEN = 'limegreen',
    DIMGREY = 'dimgrey',
    LIGHTGREY = 'lightgrey',
}

function getClonalColor(clonalValue: string): ClonalColor {
    switch (clonalValue) {
        case 'yes':
            return ClonalColor.LIMEGREEN;
        case 'no':
            return ClonalColor.DIMGREY;
        default:
            return ClonalColor.LIGHTGREY;
    }
}

const ClonalElementTooltip: React.FunctionComponent<{
    sampleId: string;
    clonalValue: string;
    ccfMCopies: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const firstColumnStyle = {
        width: 40,
        display: 'inline-block',
    };
    return (
        <div>
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
                    style={{ color: `${getClonalColor(props.clonalValue)}` }}
                >
                    {props.clonalValue}
                </strong>
            </div>
            <div>
                <span style={firstColumnStyle}>CCF</span>
                <strong>{props.ccfMCopies}</strong>
            </div>
        </div>
    );
};

const ClonalCircle: React.FunctionComponent<{
    clonalValue: string;
}> = props => {
    return (
        <svg height="10" width="10">
            <circle
                cx={5}
                cy={5}
                r={5}
                fill={getClonalColor(props.clonalValue)}
            />
        </svg>
    );
};

const ClonalElement: React.FunctionComponent<{
    sampleId: string;
    clonalValue: string;
    ccfMCopies: string;
    sampleManager?: SampleManager | null;
}> = props => {
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
};

export default ClonalElement;
