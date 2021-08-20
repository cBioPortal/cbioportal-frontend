import * as React from 'react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import { getServerConfig } from 'config/config';
import StaticContent from '../../../shared/components/staticContent/StaticContent';
import './styles.scss';
import Helmet from 'react-helmet';

export default class News extends React.Component<{}, {}> {
    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage newsPage'}>
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::News'}</title>
                </Helmet>
                <StaticContent
                    sourceUrl={getServerConfig().skin_documentation_news!}
                    title={'News'}
                />
                <a
                    id="releasesLink"
                    href="https://github.com/cBioPortal/cbioportal/releases"
                >
                    Release notes
                </a>
            </PageLayout>
        );
    }
}
