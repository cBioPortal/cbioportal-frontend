import * as React from 'react';
import { PathologyReportWithViewerURL } from '../clinicalInformation/PatientViewPageStore';
import { If } from 'react-if';
import _ from 'lodash';
import IFrameLoader from '../../../shared/components/iframeLoader/IFrameLoader';
import { observer } from 'mobx-react';

export type IPathologyReportProps = {
    pdfs: PathologyReportWithViewerURL[];
    iframeHeight: number;
    iframeStyle?: { [styleProp: string]: any };
};

@observer
export default class PathologyReport extends React.Component<
    IPathologyReportProps,
    { selectedIndex: number }
> {
    constructor(props: IPathologyReportProps) {
        super(props);
        this.state = { selectedIndex: 0 };
        this.handleSelection = this.handleSelection.bind(this);
    }

    handleSelection(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ selectedIndex: parseInt(event.target.value, 10) });
    }

    render() {
        const { pdfs, iframeHeight } = this.props;

        if (!pdfs || pdfs.length === 0) {
            return <div>No pathology report available</div>;
        }

        const selectedPdf = pdfs[this.state.selectedIndex];

        return (
            <div>
                <If condition={pdfs.length > 1}>
                    <select
                        value={this.state.selectedIndex}
                        style={{ marginBottom: 15 }}
                        onChange={this.handleSelection}
                    >
                        {_.map(
                            pdfs,
                            (
                                pdf: PathologyReportWithViewerURL,
                                index: number
                            ) => (
                                <option key={pdf.url} value={index}>
                                    {pdf.name}
                                </option>
                            )
                        )}
                    </select>
                </If>

                {selectedPdf && selectedPdf.viewerUrl ? (
                    <IFrameLoader
                        height={iframeHeight}
                        url={selectedPdf.viewerUrl}
                    />
                ) : (
                    <div>No pathology report available</div>
                )}
            </div>
        );
    }
}
