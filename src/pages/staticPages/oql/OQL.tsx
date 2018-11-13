import * as React from 'react';
import {PageLayout} from "../../../shared/components/PageLayout/PageLayout";
import AppConfig from "appConfig";
import StaticContent from "../../../shared/components/staticContent/StaticContent";
import './styles.scss';
import Helmet from "react-helmet";

export default class OQL extends React.Component<{}, {}> {

    public render() {
        return <PageLayout className={'whiteBackground staticPage'}>
            <Helmet>
                <title>{'cBioPortal for Cancer Genomics::OQL Guide'}</title>
            </Helmet>
            <StaticContent sourceUrl={AppConfig.serverConfig.skin_documentation_oql!} />
        </PageLayout>
    }

}




