import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import AppConfig from 'appConfig';
import 'react-select1/dist/react-select.css';
import { QueryStore } from '../../shared/components/query/QueryStore';
import QueryAndDownloadTabs from '../../shared/components/query/QueryAndDownloadTabs';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import RightBar from '../../shared/components/rightbar/RightBar';
// tslint:disable-next-line:no-import-side-effect
import './homePage.scss';
import autobind from 'autobind-decorator';
import { createQueryStore } from 'shared/lib/createQueryStore';

const win = window as any;

export interface IResultsViewPageProps {
    routing: any;
}

@inject('routing')
@observer
export default class HomePage extends React.Component<
    IResultsViewPageProps,
    {}
> {
    @observable showQuerySelector = true;

    queryStore: QueryStore;

    constructor(props: IResultsViewPageProps) {
        super(props);
        makeObservable(this);
    }

    componentWillMount() {
        this.queryStore = createQueryStore();
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    @autobind
    private getQueryStore() {
        return this.queryStore;
    }

    public render() {
        return (
            <PageLayout
                className="homePageLayout"
                noMargin={true}
                rightBar={<RightBar queryStore={this.queryStore} />}
            >
                <div
                    className={'headBlock'}
                    dangerouslySetInnerHTML={{
                        __html: AppConfig.serverConfig.skin_blurb!,
                    }}
                ></div>

                <QueryAndDownloadTabs
                    getQueryStore={this.getQueryStore}
                    showQuickSearchTab={
                        AppConfig.serverConfig.quick_search_enabled
                    }
                    showDownloadTab={true}
                />
            </PageLayout>
        );
    }
}
