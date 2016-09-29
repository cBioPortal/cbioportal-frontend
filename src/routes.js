import React from 'react';
import {Route, IndexRoute} from 'react-router';

import Container from 'features/Container';

// import page components here
// NOTE: to lazy load these, we use the bundle loader.  what we are importing are not the components but loaders
// which are invoked at run time by the routes
// webpack knows to 'split' the code into seperate bundles accordingly
// see article http://henleyedition.com/implicit-code-splitting-with-react-router-and-webpack/
import PatientViewPage from 'bundle?lazy!babel!./features/patientView/patientViewPage';
import HomePage from 'bundle?lazy!babel!./features/home/homePage';

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
        </Route>
);


export default makeRoutes;
