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
import StudyViewPage from 'bundle-loader?lazy!babel-loader!./pages/studyView/StudyViewPage';
import MutationMapperTool from 'bundle-loader?lazy!babel-loader!./pages/tools/mutationMapper/MutationMapperTool';
import './globalComponents';
import {getBasePath} from "shared/api/urls";

// accepts bundle-loader's deferred loader function and defers execution of route's render
// until chunk is loaded
function lazyLoadComponent(loader) {

    return (location, cb) => {
        loader(module => {
            cb(null, module.default);
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

console.log(getBasePath());

export const makeRoutes = (routing) => {
    return (<Route path="/" component={Container}>
                <Route path="/home" getComponent={lazyLoadComponent(HomePage)}/>
                <Route path="/datasets" getComponent={lazyLoadComponent(DatasetPage)} />
                <Route path="/restore" component={restoreRoute}/>
                <Route path="/testimonials" component={TestimonialsPage}/>
                <Route path="/blank" component={getBlankPage}/>
                <Route path="/results" getComponent={lazyLoadComponent(ResultsViewPage)} />
                <Route path={getBasePath()}>
                    <Route path="patient" getComponent={lazyLoadComponent(PatientViewPage)}/>
                    <Route path="newstudy" getComponent={lazyLoadComponent(StudyViewPage)} />
                </Route>
                <IndexRedirect to={defaultRoute}/>
                <Route path="/mutation_mapper" getComponent={lazyLoadComponent(MutationMapperTool)} />
        <IndexRedirect to={defaultRoute}/>
    </Route>)
};


export default makeRoutes;
