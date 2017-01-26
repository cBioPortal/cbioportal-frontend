import * as _ from 'lodash';
import {toJS, observable, action, computed, reaction} from "../../../node_modules/mobx/lib/mobx";
import * as seamlessImmutable from 'seamless-immutable';

// mobx observable
export default class RemoteData<H, P, R>
{
    constructor(apiHost:H, apiMethod:(params:P)=>Promise<R>, initialParams?:P)
    {
        this.apiHost = apiHost;
        this.apiMethod = apiMethod;
        this.params = initialParams;

        // handle changes to params
        reaction(
            () => toJS(this.params),
            newParams => {
                // no params means no request
                if (!newParams)
                    this.lastResult = undefined;
                this.internalStatus = 'invalid';
            },
            {
                name: 'invalidate',
                compareStructural: true,
                fireImmediately: true
            }
        );

        // when initialParams are given, fetch immediately
        if (initialParams)
            this.fetch();
    }

    private apiHost:H;
    private apiMethod:(params:P)=>Promise<R>;
    @observable private internalStatus:'invalid'|'fetching'|'complete' = 'invalid';
    @observable.ref private lastResult?:R = undefined;

    /**
     * Params for the RPC.
     * Setting this to undefined will clear the result.
     */
    @observable params?:P = undefined;

    /**
     * Status of result.
     */
    @computed get status()
    {
        if (this.shouldFetch) // checking this here makes sure we call lazyFetch again when conditions change
        {
            this.lazyFetch();
            return 'fetching'; // we will be fetching soon
        }

        return this.internalStatus;
    }

    /**
     * Clears the params and the result and ignores the results of any current request.
     */
    @action cancel()
    {
        this.params = undefined;
    }

    /**
     * Result from RPC.
     */
    @computed get result()
    {
        if (this.shouldFetch) // checking this here makes sure we call lazyFetch again when conditions change
            this.lazyFetch();
        return this.lastResult;
    }

    @computed get shouldFetch()
    {
        return this.params && this.internalStatus === 'invalid';
    }

    private lazyFetch = _.debounce(() => {
        if (this.shouldFetch)
            this.fetch();
    });

    @action.bound private fetch()
    {
        let params = toJS(this.params);
        (this.apiMethod.call(this.apiHost, params) as Promise<R>).then(result => {
            if (_.isEqual(params, toJS(this.params)))
                this.resolve(result);
        });
        this.internalStatus = 'fetching';
    }

    @action.bound private resolve(result:R)
    {
        this.lastResult = seamlessImmutable.from(result);
        this.internalStatus = 'complete';
    }
}
