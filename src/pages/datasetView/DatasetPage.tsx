import * as React from 'react';
import * as ReactDOM from 'react-dom';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import DatasetList from './DatasetList';
import DisablePage from 'shared/components/PageDecorator/PageDecorator';


export default class DatasetPage extends React.Component<{ store: any }, {}> {



    public componentWillMount() {

        exposeComponentRenderer('renderDatasetList',DatasetList, { store: this.props.store });

    }

    public render() {

        return (
            <DatasetList />
        );
    }
}
