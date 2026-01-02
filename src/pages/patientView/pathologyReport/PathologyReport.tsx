import * as React from 'react';
import { PathologyReportPDF } from '../clinicalInformation/PatientViewPageStore';
import { If, Then, Else } from 'react-if';
import _ from 'lodash';
import IFrameLoader from '../../../shared/components/iframeLoader/IFrameLoader';
import { observer } from 'mobx-react';

export type IPathologyReportProps = {
    pdfs: PathologyReportPDF[];
    iframeHeight: number;
    iframeStyle?: { [styleProp: string]: any };
};

@observer
export default class PathologyReport extends React.Component<
    IPathologyReportProps,
    { pdfUrl: string }
> {
    pdfSelectList: any;
    pdfEmbed: any;

    constructor(props: IPathologyReportProps) {
        super(props);

        // Safely initialize state: handle case where pdfs is empty or undefined
        this.state = {
            pdfUrl:
                props.pdfs && props.pdfs.length > 0
                    ? this.buildPDFUrl(props.pdfs[0].url)
                    : '',
        };

        this.handleSelection = this.handleSelection.bind(this);
    }

    componentDidUpdate(prevProps: IPathologyReportProps) {
        // Handle async pdf list arrival: update URL if pdfs changed from empty to populated
        if (
            this.props.pdfs &&
            this.props.pdfs.length > 0 &&
            (!prevProps.pdfs || prevProps.pdfs.length === 0) &&
            !this.state.pdfUrl
        ) {
            this.setState({ pdfUrl: this.buildPDFUrl(this.props.pdfs[0].url) });
        }
    }

    buildPDFUrl(url: string): string {
        // Fix: Use proper URL encoding and correct parameter separator (&, not ?)
        return `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
            url
        )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
    }

    handleSelection() {
        this.setState({
            pdfUrl: this.buildPDFUrl(
                this.pdfSelectList.options[this.pdfSelectList.selectedIndex]
                    .value
            ),
        });
    }

    render() {
        // Show fallback message if no PDF is available
        if (!this.props.pdfs || this.props.pdfs.length === 0) {
            return (
                <div
                    className="alert alert-info"
                    style={{ margin: '20px', padding: '15px' }}
                >
                    No pathology report available.
                </div>
            );
        }

        return (
            <div>
                <If condition={this.props.pdfs.length > 1}>
                    <select
                        ref={(el) => (this.pdfSelectList = el)}
                        style={{ marginBottom: 15 }}
                        onChange={this.handleSelection}
                    >
                        {_.map(this.props.pdfs, (pdf: PathologyReportPDF) => (
                            <option value={pdf.url}>{pdf.name}</option>
                        ))}
                    </select>
                </If>

                <IFrameLoader
                    height={this.props.iframeHeight}
                    url={this.state.pdfUrl}
                />
            </div>
        );
    }
}
