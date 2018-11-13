import * as React from 'react';
import {PageLayout} from "../../../shared/components/PageLayout/PageLayout";
import AppConfig from "appConfig";
import StaticContent from "../../../shared/components/staticContent/StaticContent";
import './styles.scss';
import Helmet from "react-helmet";

export default class News extends React.Component<{}, {}> {

    public render() {
        return <PageLayout className={'whiteBackground staticPage newsPage'}>
            <Helmet>
                <title>{'cBioPortal for Cancer Genomics::News'}</title>
            </Helmet>
            <StaticContent sourceUrl={AppConfig.serverConfig.skin_documentation_news!} title={"News"}/>
        </PageLayout>
    }

}




