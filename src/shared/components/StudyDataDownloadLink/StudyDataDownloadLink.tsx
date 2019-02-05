import * as React from "react";

export class StudyDataDownloadLink extends React.Component<{ studyId: string, className?: string }, {}> {
    render() {
        return <a className="dataset-table-download-link" style={{display: 'block'}}
                  href={'http://download.cbioportal.org/' + this.props.studyId + '.tar.gz'} download>
            <i className='fa fa-download'/>
        </a>
    }
}