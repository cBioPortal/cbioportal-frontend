import * as React from "react";
import {If, Else, Then} from 'react-if';
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import {placeArrowBottomLeft} from "public-lib/components/defaultTooltip/DefaultTooltip";
import { ClinicalDataBySampleId } from "shared/api/api-types-extended";
import ClinicalInformationPatientTable from "../clinicalInformation/ClinicalInformationPatientTable";
import './styles.scss';

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    tooltipEnabled?: boolean;
    extraTooltipText?: string;
    additionalContent?: JSX.Element|null;
    hideClinicalTable?:boolean;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {

    public static defaultProps = {
        tooltipEnabled: true,
        hideClinicalInfoTable: false
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

    public tooltipContent()
    {
        const {sample, extraTooltipText} = this.props;

        return (
            <div style={{ maxHeight:400, maxWidth:600, overflow:'auto' }}>
                <h5 style={{ marginBottom: 1 }}>
                    <span className='sample-inline-tooltip-children' >
                        {this.props.children}
                    </span>
                    {sample.id}
                </h5>
                {extraTooltipText && <h5>{extraTooltipText}</h5>}
                {!this.props.hideClinicalTable && <ClinicalInformationPatientTable
                    showFilter={false}
                    showCopyDownload={false}
                    showTitleBar={false}
                    data={sample.clinicalData}
                />}
            </div>
        );
    }

    public mainContent()
    {
        const {additionalContent} = this.props;

        let content = (
            <svg height="12" width="12">
                {this.props.children}
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
