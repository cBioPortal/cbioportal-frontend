import * as React from 'react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import './styles.scss';
import AppConfig from 'appConfig';
import StaticContent from '../../../shared/components/staticContent/StaticContent';
import Helmet from 'react-helmet';

export default class Version extends React.Component<{}, {}> {
    public render() {
        return (
            <PageLayout className="whiteBackground staticPage">
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::Version'}</title>
                </Helmet>
                <h1>cBioPortal Version</h1>
                <p>
                    cBioPortal consist of many software components all with
                    their own version. See the {''}{' '}
                    <a href="https://docs.cbioportal.org/2.1-deployment/architecture-overview">
                        architecture docs{' '}
                    </a>{' '}
                    for more information. There are also regular updates to the
                    data, see Data Version Section below.
                </p>

                <h2 id="software-version">Software Version </h2>
                <div className="versionDocumentation">
                    <table className="table table-bordered">
                        <tbody>
                            <tr>
                                <td>
                                    <strong>Component</strong>
                                </td>
                                <td>
                                    <strong>Commit</strong>
                                </td>
                                <td>
                                    <strong>Github URL</strong>
                                </td>
                            </tr>
                            <tr>
                                <td>Frontend</td>
                                <td>123213</td>
                                <td>
                                    <a href="https://github.com/cBioPortal/cbioportal-frontend">
                                        cBioPortal Frontend
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td>Backend</td>
                                <td>123213</td>
                                <td>
                                    <a href="https://github.com/cBioPortal/cbioportal">
                                        cBioPortal Backend
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td>session-service</td>
                                <td>aef23</td>
                                <td>
                                    <a href="https://github.com/cBioPortal/session-service">
                                        Session-Service
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </PageLayout>
        );
    }
}
