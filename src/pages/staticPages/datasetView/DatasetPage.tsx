import * as React from 'react';
import * as _ from 'lodash';
import DatasetList from './DatasetList';
import {observer} from 'mobx-react';
import client from "shared/api/cbioportalClientInstance";
import {remoteData} from "shared/api/remoteData";
import AppConfig from "appConfig";
import styles from './styles.module.scss';
import {PageLayout} from "../../../shared/components/PageLayout/PageLayout";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import Helmet from "react-helmet";

export class DatasetPageStore {

    readonly data = remoteData({
        invoke: () => {
            return client.getAllStudiesUsingGET({projection: "DETAILED"});

        }
    });
}

@observer
export default class DatasetPage extends React.Component<{}, {}> {

    private store:DatasetPageStore;

    constructor() {
        super();
        this.store = new DatasetPageStore();
    }

    public render() {

        const header:JSX.Element|null = !_.isEmpty(AppConfig.serverConfig.skin_data_sets_header) ? <p style={{marginBottom:"20px"}} dangerouslySetInnerHTML={{__html: AppConfig.serverConfig.skin_data_sets_header!}}></p> : null;
        const footer:JSX.Element|null = !_.isEmpty(AppConfig.serverConfig.skin_data_sets_footer) ? <p style={{marginTop:"20px"}} dangerouslySetInnerHTML={{__html: AppConfig.serverConfig.skin_data_sets_footer!}}></p> : null;

        return <PageLayout className={"whiteBackground"}>
            <div className={styles.dataSets}>

                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::Datasets'}</title>
                </Helmet>

                <h1>Datasets</h1>

                {
                    (this.store.data.isComplete) && (

                        <div className={styles.dataSets}>
                            {header}
                            <DatasetList datasets={this.store.data.result}/>
                            {footer}
                        </div>
                    )
                }

                {
                    (this.store.data.isPending) && (
                        <LoadingIndicator isLoading={true} size={"big"} center={true}></LoadingIndicator>
                    )
                }

            </div>
        </PageLayout>

    }
}
