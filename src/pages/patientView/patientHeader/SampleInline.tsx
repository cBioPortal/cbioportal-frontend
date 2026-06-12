import * as React from 'react';
import { If, Else, Then } from 'react-if';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import { ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import ClinicalInformationPatientTable from '../clinicalInformation/ClinicalInformationPatientTable';
import './styles.scss';

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    tooltipEnabled?: boolean;
    extraTooltipText?: string;
    // Additional line(s) rendered in normal body text just under the sample
    // id heading. Use this for non-heading details (e.g. an expression value).
    extraTooltipBody?: React.ReactNode;
    additionalContent?: JSX.Element | null;
    hideClinicalTable?: boolean;
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
    children?: React.ReactNode;
}

export default class SampleInline extends React.Component<
    ISampleInlineProps,
    {}
> {
    public static defaultProps = {
        tooltipEnabled: true,
        hideClinicalInfoTable: false,
        disableTooltip: false,
    };

    public render() {
        return (
            <If condition={this.props.tooltipEnabled === true}>
                <Then>{this.contentWithTooltip()}</Then>
                <Else>{this.mainContent()}</Else>
            </If>
        );
    }

    public tooltipContent() {
        const { sample, extraTooltipText, extraTooltipBody } = this.props;

        return (
            <div style={{ maxHeight: 400, maxWidth: 600, overflow: 'auto' }}>
                <h5 style={{ marginBottom: 1 }}>
                    <span className="sample-inline-tooltip-children">
                        {this.props.children}
                    </span>
                    {sample.id}
                </h5>
                {extraTooltipText && <h5>{extraTooltipText}</h5>}
                {extraTooltipBody && (
                    <div style={{ fontSize: 13, color: '#333', margin: '2px 0 4px' }}>
                        {extraTooltipBody}
                    </div>
                )}
                {!this.props.hideClinicalTable && (
                    <ClinicalInformationPatientTable
                        showFilter={false}
                        showCopyDownload={false}
                        showTitleBar={false}
                        data={sample.clinicalData}
                        onSelectGenePanel={this.props.onSelectGenePanel}
                    />
                )}
            </div>
        );
    }

    public mainContent() {
        const { additionalContent } = this.props;

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

    public contentWithTooltip() {
        return (
            <DefaultTooltip
                placement="bottomLeft"
                trigger={['hover', 'focus']}
                overlay={this.tooltipContent()}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={false}
                onPopupAlign={placeArrowBottomLeft}
                disabled={this.props.disableTooltip}
            >
                {this.mainContent()}
            </DefaultTooltip>
        );
    }
}
