import * as React from 'react';

import { observer } from 'mobx-react';

import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import { action, computed, makeObservable, observable } from 'mobx';
import { useLocalObservable } from 'mobx-react-lite';
import { remoteData } from 'cbioportal-frontend-commons';
import cbioportalClientInstance from 'shared/api/cbioportalClientInstance';
import { sleep } from 'shared/lib/TimeUtils';

const apiClient = cbioportalClientInstance;

// we use external stores to represent global state/data that may be shared
// by multiple components of a page
class ExampleStore {
    @observable storeCount = 0;

    constructor() {
        makeObservable(this);

        setInterval(() => {
            this.storeCount = this.storeCount + 1;
        }, 2000);
    }

    // we use remoteData to handle/model the loading behavior
    // of all asynchronous process (data fetching)
    // remoteData returns MobxPromise which exposes loading state and result data
    // as Mobx observable properties which can be referenced by components
    public someAPIData = remoteData({
        await: () => [],
        invoke: async () => {
            // put in a pause so we can see loading text
            await sleep(5000);
            return await apiClient.getAllStudiesUsingGET({
                projection: 'SUMMARY',
            });
        },
    });
}

interface IExampleComponent {
    externalCount: number;
}

@observer
export class ExampleClassComponent extends React.Component<
    IExampleComponent,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @observable localCount = 0;

    @computed get buttonText() {
        return `ExampleClassComponent: local count is ${this.localCount}`;
    }

    @action.bound
    increment() {
        this.localCount++;
    }

    render() {
        return (
            <div>
                <p>External count: {this.props.externalCount}</p>
                <p>
                    <button onClick={this.increment}>{this.buttonText}</button>
                </p>
            </div>
        );
    }
}

const ExampleFunctionalComponent: React.FunctionComponent<IExampleComponent> = observer(
    function(props) {
        const store = useLocalObservable(() => ({
            localCount: 0, // this is automatically made observable
            increment() {
                this.localCount++;
            },
            // this is automatically made computed
            get buttonText() {
                return `ExampleFunctionalComponent: local count is ${this.localCount}`;
            },
        }));

        return (
            <div>
                <p>External count: {props.externalCount}</p>
                <p>
                    <button onClick={store.increment}>
                        {store.buttonText}
                    </button>
                </p>
            </div>
        );
    }
);

@observer
export default class Example extends React.Component<{}, {}> {
    pageStore = new ExampleStore();

    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground'}>
                <div>
                    <ExampleClassComponent
                        externalCount={this.pageStore.storeCount}
                    />
                    <ExampleFunctionalComponent
                        externalCount={this.pageStore.storeCount}
                    />

                    {this.pageStore.someAPIData.isPending && <p>... LOADING</p>}

                    {this.pageStore.someAPIData.isComplete && (
                        <p>
                            there are {this.pageStore.someAPIData.result.length}{' '}
                            studies
                        </p>
                    )}
                </div>
            </PageLayout>
        );
    }
}
