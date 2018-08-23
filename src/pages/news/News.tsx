import * as React from 'react';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import AppConfig from "appConfig";
import StaticContent from "../../shared/components/staticContent/StaticContent";
import './styles.scss';

export default class News extends React.Component<{}, {}> {

    public render() {
        return <PageLayout className={'whiteBackground newsPage'}>
            <StaticContent sourceUrl={AppConfig.skinNewsSourceURL!} title={"News"}/>
        </PageLayout>
    }

}




