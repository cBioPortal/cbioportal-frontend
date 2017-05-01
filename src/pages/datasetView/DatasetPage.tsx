import * as React from 'react';
import DatasetList from './DatasetList';
import {observer} from 'mobx-react';
import client from "shared/api/cbioportalClientInstance";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';

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
        if (this.store.data.isComplete) {
            return (
                <DatasetList datasets={this.store.data.result}/>
            );
        } else {
            return null;
        }
    }
}
