import * as React from 'react';
import SampleManager from 'pages/patientView/SampleManager';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ASCN_BLACK } from 'shared/lib/Colors';
import { getASCNCopyNumberColor } from 'shared/lib/ASCNUtils';

export enum ASCNCopyNumberValue {
    WGD = 'WGD',
    NA = 'NA',
    AMPBALANCED = 'Amp (Balanced)',
    AMPLOH = 'Amp (LOH)',
    AMP = 'Amp',
    CNLOHGAIN = 'CNLOH & Gain',
    CNLOHAFTER = 'CNLOH After',
    CNLOHBEFOREGAIN = 'CNLOH Before & Gain',
    CNLOHBEFORELOSS = 'CNLOH Before & Loss',
    CNLOHBEFORE = 'CNLOH Before',
    CNLOH = 'CNLOH',
    DIPLOID = 'Diploid',
    DOUBLELOSSAFTER = 'Double Loss After',
    GAIN = 'Gain',
    HETLOSS = 'Hetloss',
    HOMDEL = 'Homdel',
    LOSSGAIN = 'Loss & Gain',
    LOSSAFTER = 'Loss After',
    LOSSBEFOREAFTER = 'Loss Before & After',
    LOSSBEFORE = 'Loss Before',
    TETRAPLOID = 'Tetraploid',
}

const ASCNCallTable: { [key: string]: string } = {
    'no WGD,0,0': ASCNCopyNumberValue.HOMDEL,
    'no WGD,1,0': ASCNCopyNumberValue.HETLOSS,
    'no WGD,2,0': ASCNCopyNumberValue.CNLOH,
    'no WGD,3,0': ASCNCopyNumberValue.CNLOHGAIN,
    'no WGD,4,0': ASCNCopyNumberValue.CNLOHGAIN,
    'no WGD,5,0': ASCNCopyNumberValue.AMPLOH,
    'no WGD,6,0': ASCNCopyNumberValue.AMPLOH,
    'no WGD,1,1': ASCNCopyNumberValue.DIPLOID,
    'no WGD,2,1': ASCNCopyNumberValue.GAIN,
    'no WGD,3,1': ASCNCopyNumberValue.GAIN,
    'no WGD,4,1': ASCNCopyNumberValue.AMP,
    'no WGD,5,1': ASCNCopyNumberValue.AMP,
    'no WGD,6,1': ASCNCopyNumberValue.AMP,
    'no WGD,2,2': ASCNCopyNumberValue.TETRAPLOID,
    'no WGD,3,2': ASCNCopyNumberValue.AMP,
    'no WGD,4,2': ASCNCopyNumberValue.AMP,
    'no WGD,5,2': ASCNCopyNumberValue.AMP,
    'no WGD,6,2': ASCNCopyNumberValue.AMP,
    'no WGD,3,3': ASCNCopyNumberValue.AMPBALANCED,
    'no WGD,4,3': ASCNCopyNumberValue.AMP,
    'no WGD,5,3': ASCNCopyNumberValue.AMP,
    'no WGD,6,3': ASCNCopyNumberValue.AMP,
    'WGD,0,0': ASCNCopyNumberValue.HOMDEL,
    'WGD,1,0': ASCNCopyNumberValue.LOSSBEFOREAFTER,
    'WGD,2,0': ASCNCopyNumberValue.LOSSBEFORE,
    'WGD,3,0': ASCNCopyNumberValue.CNLOHBEFORELOSS,
    'WGD,4,0': ASCNCopyNumberValue.CNLOHBEFORE,
    'WGD,5,0': ASCNCopyNumberValue.CNLOHBEFOREGAIN,
    'WGD,6,0': ASCNCopyNumberValue.AMPLOH,
    'WGD,1,1': ASCNCopyNumberValue.DOUBLELOSSAFTER,
    'WGD,2,1': ASCNCopyNumberValue.LOSSAFTER,
    'WGD,3,1': ASCNCopyNumberValue.CNLOHAFTER,
    'WGD,4,1': ASCNCopyNumberValue.LOSSGAIN,
    'WGD,5,1': ASCNCopyNumberValue.AMP,
    'WGD,6,1': ASCNCopyNumberValue.AMP,
    'WGD,2,2': ASCNCopyNumberValue.TETRAPLOID,
    'WGD,3,2': ASCNCopyNumberValue.GAIN,
    'WGD,4,2': ASCNCopyNumberValue.AMP,
    'WGD,5,2': ASCNCopyNumberValue.AMP,
    'WGD,6,2': ASCNCopyNumberValue.AMP,
    'WGD,3,3': ASCNCopyNumberValue.AMPBALANCED,
    'WGD,4,3': ASCNCopyNumberValue.AMP,
    'WGD,5,3': ASCNCopyNumberValue.AMP,
    'WGD,6,3': ASCNCopyNumberValue.AMP,
};

enum ASCNCopyNumberOpacity {
    TRANSPARENT = 0,
    OPAQUE = 100,
}

function getASCNCopyNumberOpacity(
    ASCNCopyNumberValue: string
): ASCNCopyNumberOpacity {
    switch (ASCNCopyNumberValue) {
        case '2':
        case '1':
        case '0':
        case '-1':
        case '-2':
            return ASCNCopyNumberOpacity.OPAQUE;
        default:
            return ASCNCopyNumberOpacity.TRANSPARENT;
    }
}

function getASCNCopyNumberCall(
    wgdValue: string,
    totalCopyNumberValue: string,
    minorCopyNumberValue: string
) {
    const majorCopyNumberValue: string = (
        Number(totalCopyNumberValue) - Number(minorCopyNumberValue)
    ).toString();
    const key: string = [
        wgdValue,
        majorCopyNumberValue,
        minorCopyNumberValue,
    ].join(',');
    return key in ASCNCallTable
        ? ASCNCallTable[key].toLowerCase()
        : ASCNCopyNumberValue.NA;
}

const ASCNCopyNumberElementTooltip: React.FunctionComponent<{
    sampleId: string;
    wgdValue: string;
    totalCopyNumberValue: string;
    minorCopyNumberValue: string;
    ascnCopyNumberValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const ascnCopyNumberCall: string = getASCNCopyNumberCall(
        props.wgdValue,
        props.totalCopyNumberValue,
        props.minorCopyNumberValue
    );
    return (
        <span>
            {props.sampleManager ? (
                <span>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}{' '}
                </span>
            ) : null}
            <span>
                <b>{ascnCopyNumberCall}</b>
                {ascnCopyNumberCall !== ASCNCopyNumberValue.NA ? (
                    <span>
                        {' '}
                        ({props.wgdValue} with total copy number of{' '}
                        {props.totalCopyNumberValue} and a minor copy number of{' '}
                        {props.minorCopyNumberValue})
                    </span>
                ) : null}
            </span>
        </span>
    );
};

const ASCNCopyNumberIcon: React.FunctionComponent<{
    wgdValue: string;
    totalCopyNumberValue: string;
    ascnCopyNumberValue: string;
}> = props => {
    return (
        <svg width="18" height="20" className="case-label-header">
            {props.wgdValue === ASCNCopyNumberValue.WGD ? (
                <svg>
                    <text
                        x="9"
                        y="5"
                        dominantBaseline="middle"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontSize="7"
                        fill="black"
                    >
                        WGD
                    </text>
                </svg>
            ) : null}
            <g transform="translate(3,8)">
                <rect
                    width="12"
                    height="12"
                    rx="15%"
                    ry="15%"
                    fill={getASCNCopyNumberColor(props.ascnCopyNumberValue)}
                    opacity={getASCNCopyNumberOpacity(
                        props.ascnCopyNumberValue
                    )}
                />
                <svg>
                    <text
                        x="6"
                        y="7"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fontSize={9}
                        fill="white"
                    >
                        {props.totalCopyNumberValue}
                    </text>
                </svg>
            </g>
        </svg>
    );
};

// this will return an icon as long as ascnCopyNumberValue(icon color), wgdValue(wgd label), totalCopyNumber(icon number) are not "NA"
// this does not enforce an limits on possible numerical values (e.g bad data such as tcn=99 would show up as 99 in the portal)
const ASCNCopyNumberElement: React.FunctionComponent<{
    sampleId: string;
    wgdValue: string;
    totalCopyNumberValue: string;
    minorCopyNumberValue: string;
    ascnCopyNumberValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const hasAllRequiredValues: boolean =
        props.totalCopyNumberValue !== ASCNCopyNumberValue.NA &&
        props.ascnCopyNumberValue !== ASCNCopyNumberValue.NA &&
        props.wgdValue !== ASCNCopyNumberValue.NA &&
        getASCNCopyNumberColor(props.ascnCopyNumberValue) !== ASCN_BLACK;

    if (hasAllRequiredValues) {
        return (
            <DefaultTooltip
                overlay={<ASCNCopyNumberElementTooltip {...props} />}
                placement="left"
            >
                <span>
                    <ASCNCopyNumberIcon
                        wgdValue={props.wgdValue}
                        totalCopyNumberValue={props.totalCopyNumberValue}
                        ascnCopyNumberValue={props.ascnCopyNumberValue}
                    />
                </span>
            </DefaultTooltip>
        );
    } else {
        return (
            <span>
                <ASCNCopyNumberIcon
                    wgdValue={ASCNCopyNumberValue.NA}
                    totalCopyNumberValue=""
                    ascnCopyNumberValue={ASCNCopyNumberValue.NA}
                />
            </span>
        );
    }
};

export default ASCNCopyNumberElement;
