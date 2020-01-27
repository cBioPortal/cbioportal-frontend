import * as React from 'react';
import { trackEvent } from 'shared/lib/tracking';

export class StudyDataDownloadLink extends React.Component<
    { studyId: string; className?: string },
    {}
> {
    render() {
        return (
            <a
                className="dataset-table-download-link"
                style={{ display: 'block' }}
                href={
                    'http://download.cbioportal.org/' +
                    this.props.studyId +
                    '.tar.gz'
                }
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
