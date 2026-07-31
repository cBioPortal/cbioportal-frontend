import { getStudyDownloadUrl } from 'shared/api/urls';
import * as React from 'react';
import { trackEvent } from 'shared/lib/tracking';
import { getServerConfig } from 'config/config';

export class StudyDataDownloadLink extends React.Component<
    { studyId: string; className?: string },
    {}
> {
    render() {
        if (getServerConfig().skin_hide_download_controls === 'hide') {
            return null;
        }
        return (
            <a
                className="dataset-table-download-link"
                aria-label={`Download Study ${this.props.studyId}`}
                style={{ display: 'block' }}
                href={getStudyDownloadUrl(this.props.studyId)}
                download
                onClick={() =>
                    trackEvent({
                        category: 'download',
                        action: 'study download',
                        label: this.props.studyId,
                    })
                }
            >
                <i className="fa fa-download" />
            </a>
        );
    }
}
