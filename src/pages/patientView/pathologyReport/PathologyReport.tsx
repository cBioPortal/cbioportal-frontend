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

        // Set initial pdf URL safely (props may be populated asynchronously)
        const initialUrl = props.pdfs && props.pdfs.length > 0 ? props.pdfs[0].url : '';
        this.state = { pdfUrl: this.buildPDFUrl(initialUrl) };

        this.handleSelection = this.handleSelection.bind(this);
    }

    buildPDFUrl(url: string): string {
        if (!url) return '';
        // Ensure it's properly encoded so embedded viewer handles it.
        const encodedUrl = encodeURIComponent(url);
        return `https://docs.google.com/viewerng/viewer?url=${encodedUrl}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
    }

    componentDidUpdate(prevProps: IPathologyReportProps) {
        // If the pdf list changed (arrived asynchronously), update the displayed pdf accordingly
        if (prevProps.pdfs !== this.props.pdfs && this.props.pdfs && this.props.pdfs.length > 0) {
            const newUrl = this.buildPDFUrl(this.props.pdfs[0].url);
            if (newUrl !== this.state.pdfUrl) {
                this.setState({ pdfUrl: newUrl });
            }
        }
    }

    // shouldComponentUpdate(nextProps: IPathologyReportProps){
    //     return nextProps === this.props;
    // }

    handleSelection() {
        if (!this.pdfSelectList) return;
        this.setState({
            pdfUrl: this.buildPDFUrl(
                this.pdfSelectList.options[this.pdfSelectList.selectedIndex].value
            ),
        });
    }

    render() {
        return (
            <div>
                <If condition={this.props.pdfs && this.props.pdfs.length > 1}>
                    <select
                        ref={el => (this.pdfSelectList = el)}
                        style={{ marginBottom: 15 }}
                        onChange={this.handleSelection}
                    >
                        {_.map(this.props.pdfs, (pdf: PathologyReportPDF) => (
                            <option key={pdf.url} value={pdf.url}>
                                {pdf.name}
                            </option>
                        ))}
                    </select>
                </If>

                {this.state.pdfUrl ? (
                    <IFrameLoader height={this.props.iframeHeight} url={this.state.pdfUrl} />
                ) : (
                    <div>No pathology report available</div>
                )}
            </div>
        );
    }
}
