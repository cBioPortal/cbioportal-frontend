import * as React from 'react';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import AppConfig from "appConfig";
import StaticContent from "../../shared/components/staticContent/StaticContent";
import './styles.scss';

export default class OQL extends React.Component<{}, {}> {

    public render() {
        return <PageLayout className={'whiteBackground'}>
            <StaticContent sourceUrl={AppConfig.skinOQLSourceURL!} />
        </PageLayout>
    }

}




