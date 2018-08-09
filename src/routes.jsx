import React from 'react';
import { Route, Redirect, IndexRedirect } from 'react-router';
import { inject } from 'mobx-react';
import Container from 'appShell/App/Container';
import { restoreRouteAfterRedirect } from './shared/lib/redirectHelpers';
import AppConfig from "appConfig";

/* HOW TO ADD A NEW ROUTE
* 1. Import the "page" component using the bundle-loader directives as seen in imports below
* 2. Add a Route element with getComponent set to the result the lazyLoadComponent function passed your new component
*/

// import page components here
// NOTE: to lazy load these, we use the bundle loader.  what we are importing are not the components but loaders
// which are invoked at run time by the routes
// webpack knows to 'split' the code into seperate bundles accordingly
// see article http://henleyedition.com/implicit-code-splitting-with-react-router-and-webpack/
import PatientViewPage from 'bundle-loader?lazy!babel-loader!./pages/patientView/PatientViewPage';
import ResultsViewPage from 'bundle-loader?lazy!babel-loader!./pages/resultsView/ResultsViewPage';
import HomePage from 'bundle-loader?lazy!babel-loader!./pages/home/HomePage';
import TestimonialsPage from 'pages/staticPages/testimonialsPage/TestimonialsPage';
import DatasetPage from 'bundle-loader?lazy!babel-loader!./pages/datasetView/DatasetPage';
import SPA from 'bundle-loader?lazy!babel-loader!./pages/resultsView/SPA';
import StudyViewPage from 'bundle-loader?lazy!babel-loader!./pages/studyView/StudyViewPage';
import MutationMapperTool from 'bundle-loader?lazy!babel-loader!./pages/tools/mutationMapper/MutationMapperTool';
import {getBasePath} from "shared/api/urls";
import $ from "jquery";

// accepts bundle-loader's deferred loader function and defers execution of route's render
// until chunk is loaded
function lazyLoadComponent(loader) {

    return (location, cb) => {
        loader(module => {
            if (cb) cb(null, module.default);
            if (typeof window.onReactAppReady === 'function') {
                window.onReactAppReady();
            }
        });

    };
};

var defaultRoute = window.defaultRoute || '/home';

var restoreRoute = inject("routing")(restoreRouteAfterRedirect);

let getBlankPage = function(){
    if (typeof window.onReactAppReady === 'function') {
        window.onReactAppReady();
    }
    return <div />
}

// we want to preload ResultsViewPage to prevent delay due to lazy loading bundle
// note, because we bundle, and bundles are loaded async, this does NOT affect time to render of default route
// results will load in background while user plays with query interface
lazyLoadComponent(ResultsViewPage).call();

export const makeRoutes = (routing) => {
    return (<Route path="/"component={Container}>
                <Route path="/home" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(HomePage)}/>
                <Route path="/datasets" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(DatasetPage)} />
                <Route path="/restore" onEnter={()=>{$(document).scrollTop(0)}} component={restoreRoute}/>
                <Route path="/testimonials" onEnter={()=>{$(document).scrollTop(0)}} component={TestimonialsPage}/>
                <Route path="/blank" onEnter={()=>{$(document).scrollTop(0)}} component={getBlankPage}/>
                <Route path="/results" onEnter={()=>{$(document).scrollTop(0)}} onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(ResultsViewPage)} />
                <Route path="/patient" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(PatientViewPage)}/>
                <Route path="/spa" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(SPA)} />
                <Route path="/study" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(StudyViewPage)} />



                <IndexRedirect to={defaultRoute}/>
                <Route path="/mutation_mapper" getComponent={lazyLoadComponent(MutationMapperTool)} />
        <IndexRedirect to={defaultRoute}/>
    </Route>)
};


export default makeRoutes;
