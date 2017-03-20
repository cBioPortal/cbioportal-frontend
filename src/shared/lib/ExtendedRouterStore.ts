import { RouterStore } from 'mobx-react-router';
import { action, computed } from 'mobx';
import * as _ from 'lodash';
import * as $ from 'jquery';

// NOTE: there's a problem with mobx-react-router types so we have to type a few things here
// which should be derived from typings of super class
export default class ExtendedRouterStore extends (RouterStore as FunctionConstructor) {

    @computed get query(): {[key: string] : string} {
        // var route = new RT(stores.routing.location.pathname);
        var queryString: { [key: string] : string } = {};
        decodeURIComponent(this.location.search).replace(
            new RegExp("([^?=&]+)(=([^&]*))?", "g"),
            function($0, $1, $2, $3) { queryString[$1] = $3; return $0}
        )
        return queryString;
    }

    pathname: string;

    push: (newHash: string)=>void;

    location: any;

    @action updateRoute(newParams: any, newPath: string) {

        let newQuery = _.clone(this.query);

        _.each(newParams, (v, k: string)=>{
            if (v === undefined) {
                delete newQuery[k];
            } else {
                newQuery[k] = v;
            }
        });

        let params = $.param(newQuery);

        // if we have a new path, adopt it
        // otherwise use current path

        newPath = newPath || this.location.pathname;

        newPath = (newPath[0] === '/') ? newPath : '/'+ newPath;

        this.push( `${newPath}?${ params }` );

    }

}