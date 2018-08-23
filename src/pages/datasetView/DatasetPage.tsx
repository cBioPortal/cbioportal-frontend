import * as React from 'react';
import DatasetList from './DatasetList';
import {observer} from 'mobx-react';
import client from "shared/api/cbioportalClientInstance";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';
import AppConfig from "appConfig";
import styles from './styles.module.scss';
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";

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

        const header:JSX.Element|null = AppConfig.skinDatasetHeader? <p style={{marginBottom:"20px"}} dangerouslySetInnerHTML={{__html: AppConfig.skinDatasetHeader}}></p> : null;
        const footer:JSX.Element|null = AppConfig.skinDatasetFooter? <p style={{marginTop:"20px"}} dangerouslySetInnerHTML={{__html: AppConfig.skinDatasetFooter}}></p> : null;

        return <PageLayout className={"whiteBackground"}>
            <div className={styles.dataSets}>
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
                        <LoadingIndicator isLoading={true} isGlobal={true}></LoadingIndicator>
                    )
                }

            </div>
        </PageLayout>

    }
}
