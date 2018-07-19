import * as React from "react";
import {If, Else, Then} from 'react-if';
import {SampleLabelHTML} from "shared/components/sampleLabel/SampleLabel";
import {ClinicalDataBySampleId} from "shared/api/api-types-extended";
import ClinicalInformationPatientTable from "pages/patientView/clinicalInformation/ClinicalInformationPatientTable";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {placeArrowBottomLeft} from "shared/components/defaultTooltip/DefaultTooltip";

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
    sampleColor: string;
    fillOpacity: number;
    tooltipEnabled?: boolean;
    extraTooltipText?: string;
    additionalContent?: JSX.Element|null;
    iconSize?: number;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {

    public static defaultProps = {
        tooltipEnabled: true
    };

    public render() {
        return (
            <If condition={this.props.tooltipEnabled === true}>
                <Then>
                    {this.contentWithTooltip()}
                </Then>
                <Else>
                    {this.mainContent()}
                </Else>
            </If>
        );
    }

    public sampleLabelHTML(iconSize:number)
    {
        const {sampleNumber, sampleColor, fillOpacity } = this.props;

        return (
            <SampleLabelHTML
                fillOpacity={fillOpacity}
                color={sampleColor}
                label={(sampleNumber).toString()}
                iconSize={iconSize}
            />
        );
    }

    public tooltipContent()
    {
        const {sample, extraTooltipText, iconSize} = this.props;

        return (
            <div style={{ maxHeight:400, maxWidth:600, overflow:'auto' }}>
                <h5 style={{ marginBottom: 1 }}>
                    <svg height={12} width={12} style={{ marginRight: 5}}>
                        {this.sampleLabelHTML(12)}
                    </svg>
                    {sample.id}
                </h5>
                <h5>{extraTooltipText}</h5>
                <ClinicalInformationPatientTable
                    showFilter={false}
                    showCopyDownload={false}
                    showTitleBar={false}
                    data={sample.clinicalData}
                />
            </div>
        );
    }

    public mainContent()
    {
        const {additionalContent, iconSize} = this.props;

        let content = (
            <svg width={iconSize || 12} height={iconSize || 12}>
                {this.sampleLabelHTML(iconSize || 12)}
            </svg>
        );

        if (additionalContent) {
            content = (
                <span>
                    {content}
                    {additionalContent}
                </span>
            );
        }

        return content;
    }

    public contentWithTooltip()
    {
        return (
            <DefaultTooltip
                placement='bottomLeft'
                trigger={['hover', 'focus']}
                overlay={this.tooltipContent()}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={false}
                onPopupAlign={placeArrowBottomLeft}
            >
                {this.mainContent()}
            </DefaultTooltip>
        );
    }
}
