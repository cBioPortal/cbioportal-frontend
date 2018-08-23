import * as React from 'react';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import './styles.scss';
import AppConfig from "appConfig";
import StaticContent from "../../shared/components/staticContent/StaticContent";

export default class AboutUs extends React.Component<{}, {}> {

    public render() {
        return <PageLayout className={'whiteBackground'}>
            <StaticContent sourceUrl={AppConfig.skinAboutSourceURL!} title={"About Us"}/>
        </PageLayout>
    }

}




