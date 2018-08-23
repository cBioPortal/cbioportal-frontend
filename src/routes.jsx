import React from 'react';
import { Route, Redirect, IndexRoute } from 'react-router';
import { inject } from 'mobx-react';
import Container from 'appShell/App/Container';
import {handleLegacySubmission, restoreRouteAfterRedirect} from './shared/lib/redirectHelpers';
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
import WebAPIPage from 'bundle-loader?lazy!babel-loader!./pages/webAPI/WebAPIPage';
import RMATLAB from 'bundle-loader?lazy!babel-loader!./pages/rmatlab/RMatLAB';
import Tutorials from 'bundle-loader?lazy!babel-loader!./pages/tutorials/Tutorials';
import Visualize from 'bundle-loader?lazy!babel-loader!./pages/visualize/Visualize';
import AboutUs from 'bundle-loader?lazy!babel-loader!./pages/aboutus/AboutUs';
import News from 'bundle-loader?lazy!babel-loader!./pages/news/News';
import FAQ from 'bundle-loader?lazy!babel-loader!./pages/faq/FAQ';
import OQL from 'bundle-loader?lazy!babel-loader!./pages/oql/OQL';


import {getBasePath} from "shared/api/urls";
import $ from "jquery";
import ExtendedRouterStore from "shared/lib/ExtendedRouterStore";

// accepts bundle-loader's deferred loader function and defers execution of route's render
// until chunk is loaded
function lazyLoadComponent(loader, loadingCallback) {

    return (location, cb) => {
        loader(module => {
            if (cb) cb(null, module.default);
            if (loadingCallback) loadingCallback();
            // if (typeof window.onReactAppReady === 'function') {
            //     window.onReactAppReady();
            // }
        });

    };
};

var defaultRoute = window.defaultRoute || '/home';

var restoreRoute = inject("routing")(restoreRouteAfterRedirect);

let getBlankPage = function(){
    return <div />
}

// we want to preload ResultsViewPage to prevent delay due to lazy loading bundle
// note, because we bundle, and bundles are loaded async, this does NOT affect time to render of default route
// results will load in background while user plays with query interface
function preloadImportantComponents(){
    lazyLoadComponent(ResultsViewPage).call();
}

export const makeRoutes = (routing) => {
    return (<Route path="/"component={Container}>
                <IndexRoute onEnter={()=>{$(document).scrollTop(0);}} getComponent={lazyLoadComponent(SPA,preloadImportantComponents)}/>

                <Route path="/restore" onEnter={()=>{$(document).scrollTop(0)}} component={restoreRoute}/>

                <Route path="results/legacy_submission" onEnter={handleLegacySubmission} component={getBlankPage()} />

                <Route path="/results(/:tab)" onEnter={()=>{$(document).scrollTop(0)}} onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(ResultsViewPage)} />
                <Route path="/patient" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(PatientViewPage)}/>
                <Route path="/newstudy" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(StudyViewPage)} />
                <Route path="/study" component={getBlankPage()} />
                <Route path="/mutation_mapper" getComponent={lazyLoadComponent(MutationMapperTool)} />

                <Route path="/s/webAPI" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(WebAPIPage)} />
                <Route path="/s/rmatlab" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(RMATLAB)} />
                <Route path="/s/datasets" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(DatasetPage)} />
                <Route path="/s/tutorials" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(Tutorials)} />
                <Route path="/s/visualize" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(Visualize)} />
                <Route path="/s/about" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(AboutUs)} />
                <Route path="/s/news" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(News)} />
                <Route path="/s/faq" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(FAQ)} />
                <Route path="/s/oql" onEnter={()=>{$(document).scrollTop(0)}} getComponent={lazyLoadComponent(OQL)} />
                <Route path="/s/testimonials" onEnter={()=>{$(document).scrollTop(0)}} component={TestimonialsPage} />

    </Route>)
};


export default makeRoutes;
