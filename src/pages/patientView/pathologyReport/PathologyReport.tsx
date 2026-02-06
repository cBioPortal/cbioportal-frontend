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
        const hasCurrentPdfs =
            this.props.pdfs && this.props.pdfs.length > 0;
        const hadPrevPdfs =
            prevProps.pdfs && prevProps.pdfs.length > 0;

        // If PDFs were removed, clear the URL
        if (!hasCurrentPdfs) {
            if (this.state.pdfUrl) {
                this.setState({ pdfUrl: '' });
            }
            return;
        }

        const newFirstUrl = this.props.pdfs[0].url;
        const newFirstBuiltUrl = this.buildPDFUrl(newFirstUrl);

        // If there were no previous PDFs or no URL yet, initialize from the first PDF
        if (!hadPrevPdfs || !this.state.pdfUrl) {
            if (this.state.pdfUrl !== newFirstBuiltUrl) {
                this.setState({ pdfUrl: newFirstBuiltUrl });
            }
            return;
        }

        // If the current URL corresponds to the previous first PDF, and that first PDF changed,
        // update to the new first PDF. This preserves user selection when they picked another PDF.
        const prevFirstUrl = prevProps.pdfs[0].url;
        const prevFirstBuiltUrl = this.buildPDFUrl(prevFirstUrl);

        if (
            this.state.pdfUrl === prevFirstBuiltUrl &&
            prevFirstBuiltUrl !== newFirstBuiltUrl
        ) {
            this.setState({ pdfUrl: newFirstBuiltUrl });
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
