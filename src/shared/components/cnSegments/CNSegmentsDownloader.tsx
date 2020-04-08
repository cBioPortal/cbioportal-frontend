import * as React from 'react';
import MobxPromise from 'mobxpromise/dist/src/MobxPromise';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { CopyNumberSeg } from 'cbioportal-ts-api-client';
import { generateSegmentFileContent } from 'shared/lib/IGVUtils';
import onMobxPromise from 'shared/lib/onMobxPromise';
import fileDownload from 'react-file-download';
import autobind from 'autobind-decorator';

export type CNSegmentsDownloaderProps = {
    promise: MobxPromise<CopyNumberSeg[]>;
    filename?: string;
    buttonClassName?: string;
    tooltipPlacement?: string;
};

@observer
export default class CNSegmentsDownloader extends React.Component<
    CNSegmentsDownloaderProps,
    {}
> {
    public static defaultProps = {
        filename: 'segments.seg',
        buttonClassName: 'btn btn-sm pull-right',
        tooltipPlacement: 'left',
    };

    @observable downloading = false;

    public render() {
        return (
            <DefaultTooltip
                overlay={
                    <span>
                        Download a copy number segment file for the selected
                        samples
                    </span>
                }
                placement={this.props.tooltipPlacement}
            >
                <Button
                    className={this.props.buttonClassName}
                    onClick={this.handleDownload}
                    disabled={this.downloading}
                >
                    <i
                        className={classnames({
                            fa: true,
                            'fa-cloud-download': !this.downloading,
                            'fa-spinner fa-pulse': this.downloading,
                        })}
                    />
                </Button>
            </DefaultTooltip>
        );
    }

    @autobind
    private handleDownload() {
        this.downloading = true;

        onMobxPromise(this.props.promise, data => {
            fileDownload(generateSegmentFileContent(data), this.props.filename);
            this.downloading = false;
        });
    }
}
