import React from 'react';
import { Route } from 'react-router';

import Container from 'appShell/App/Container';

/* HOW TO ADD A NEW ROUTE
* 1. Import the "page" component using the bundle-loader directives as seen in imports below
* 2. Add a Route element with getComponent set to the result the lazyLoadComponent function passed your new component
*/

// import page components here
// NOTE: to lazy load these, we use the bundle loader.  what we are importing are not the components but loaders
// which are invoked at run time by the routes
// webpack knows to 'split' the code into seperate bundles accordingly
// see article http://henleyedition.com/implicit-code-splitting-with-react-router-and-webpack/
import PatientViewPage from 'bundle?lazy&name=patientview!babel!./pages/patientView/PatientViewPage';
import HomePage from 'bundle?lazy&name=homepage!babel!./pages/home/HomePage';
import QueryResult from 'bundle?lazy&name=queryresult!babel!./pages/queryResult/QueryResultPage';

// accepts bundle-loader's deferred loader function and defers execution of route's render
// until chunk is loaded
function lazyLoadComponent(loader) {

    return (location, cb) => {
        loader(module => {
            cb(null, module.default);
        });

    };
};


export const makeRoutes = () => (
        <Route path="/" component={Container}>
            <Route path="home" getComponent={lazyLoadComponent(HomePage)} />
            <Route path="patient" getComponent={lazyLoadComponent(PatientViewPage)} />
            <Route path="queryResult" getComponent={lazyLoadComponent(QueryResult)} />
        </Route>
);


export default makeRoutes;
