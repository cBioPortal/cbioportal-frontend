import { RouterStore } from 'mobx-react-router';
import { action, computed } from 'mobx';
import * as _ from 'lodash';
import * as $ from 'jquery';
import URI from 'urijs';

// NOTE: there's a problem with mobx-react-router types so we have to type a few things here
// which should be derived from typings of super class
export default class ExtendedRouterStore extends (RouterStore as FunctionConstructor) {

    push: (newHash: string)=>void;

    location: any; // for some reason cannot get TS to recongize super class

    @action updateRoute(newParams: any, path = this.location.pathname) {

        let newQuery = _.clone(this.location.query);

        _.each(newParams, (v, k: string)=>{
            if (v === undefined) {
                delete newQuery[k];
            } else {
                newQuery[k] = v;
            }
        });

        // note that param handles encoding of parameter values
        let params = $.param(newQuery);

        // put a leading slash if there isn't one
        path = (path[0] === '/') ? path : '/' + path;

        this.push( `${path}?${ params }` );

    }

}