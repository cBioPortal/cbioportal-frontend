import * as React from 'react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import { getServerConfig } from 'config/config';
import StaticContent from '../../../shared/components/staticContent/StaticContent';
import Helmet from 'react-helmet';
import './styles.scss';

export default class FAQ extends React.Component<{}, {}> {
    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage faqPage'}>
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::FAQ'}</title>
                </Helmet>

                <a id="pageTop" />
                <StaticContent
                    sourceUrl={getServerConfig().skin_documentation_faq!}
                    title={'FAQs'}
                />
            </PageLayout>
        );
    }
}
