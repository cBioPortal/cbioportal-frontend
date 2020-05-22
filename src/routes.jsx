import React from 'react';
import { Route, Redirect, IndexRoute } from 'react-router';
import { inject } from 'mobx-react';
import Container from 'appShell/App/Container';
import {
    handleIndexDO,
    handleCaseDO,
    restoreRouteAfterRedirect,
    handleStudyDO,
    handleLinkOut,
    handleEncodedRedirect,
    redirectTo,
} from './shared/lib/redirectHelpers';
import PageNotFound from './shared/components/pageNotFound/PageNotFound';

/* HOW TO ADD A NEW ROUTE
 * 1. Import the "page" component using the bundle-loader directives as seen in imports below
 * 2. Add a Route element with getComponent set to the result the lazyLoadComponent function passed your new component
 * If your route includes tabs, include `null, tabParamValidator(YourPageTabEnum) in the lazyLoadComponent call.
 * This ensures that invalid sub routes 404 correctly
 */

// import page components here
// NOTE: to lazy load these, we use the bundle loader.  what we are importing are not the components but loaders
// which are invoked at run time by the routes
// webpack knows to 'split' the code into seperate bundles accordingly
// see article http://henleyedition.com/implicit-code-splitting-with-react-router-and-webpack/
import PatientViewPage from 'bundle-loader?lazy!babel-loader!./pages/patientView/PatientViewPage';
import ResultsViewPage from 'bundle-loader?lazy!babel-loader!./pages/resultsView/ResultsViewPage';
import TestimonialsPage from 'pages/staticPages/testimonialsPage/TestimonialsPage';
import GroupComparisonLoading from './pages/groupComparison/GroupComparisonLoading';
import DatasetPage from 'bundle-loader?lazy!babel-loader!./pages/staticPages/datasetView/DatasetPage';
import Homepage from 'bundle-loader?lazy!babel-loader!./pages/home/HomePage';
import StudyViewPage from 'bundle-loader?lazy!babel-loader!./pages/studyView/StudyViewPage';
import MutationMapperTool from 'bundle-loader?lazy!babel-loader!./pages/staticPages/tools/mutationMapper/MutationMapperTool';
import OncoprinterTool from 'bundle-loader?lazy!babel-loader!./pages/staticPages/tools/oncoprinter/OncoprinterTool';
import WebAPIPage from 'bundle-loader?lazy!babel-loader!./pages/staticPages/webAPI/WebAPIPage';
import RMATLAB from 'bundle-loader?lazy!babel-loader!./pages/staticPages/rmatlab/RMatLAB';
import Tutorials from 'bundle-loader?lazy!babel-loader!./pages/staticPages/tutorials/Tutorials';
import Visualize from 'bundle-loader?lazy!babel-loader!./pages/staticPages/visualize/Visualize';
import AboutUs from 'bundle-loader?lazy!babel-loader!./pages/staticPages/aboutus/AboutUs';
import Software from 'bundle-loader?lazy!babel-loader!./pages/staticPages/software/Software';
import News from 'bundle-loader?lazy!babel-loader!./pages/staticPages/news/News';
import FAQ from 'bundle-loader?lazy!babel-loader!./pages/staticPages/faq/FAQ';
import OQL from 'bundle-loader?lazy!babel-loader!./pages/staticPages/oql/OQL';
import GroupComparisonPage from 'bundle-loader?lazy!babel-loader!./pages/groupComparison/GroupComparisonPage';
import ErrorPage from 'bundle-loader?lazy!babel-loader!./pages/resultsView/ErrorPage';

import $ from 'jquery';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { seekUrlHash } from 'shared/lib/seekUrlHash';
import { PagePath } from 'shared/enums/PagePaths';
import { ResultsViewTab } from 'pages/resultsView/ResultsViewPageHelpers';
import {
    StudyViewPageTabKeyEnum,
    StudyViewResourceTabPrefix,
} from 'pages/studyView/StudyViewPageTabs';
import {
    PatientViewPageTabs,
    PatientViewResourceTabPrefix,
} from 'pages/patientView/PatientViewPageTabs';
import { GroupComparisonTab } from 'pages/groupComparison/GroupComparisonTabs';
import { handleEncodedURLRedirect } from 'shared/lib/redirectHelpers';

/**
 * Validates that the parameters either do not have
 * a tab parameter, or have a parameter that matches a
 * value in `tabEnum`
 * @param tabEnum a TypeScript string enum
 */
function tabParamValidator(tabEnum) {
    return function(params) {
        return !params.tab || Object.values(tabEnum).indexOf(params.tab) > -1;
    };
}

/**
 * Validates results page and patient page custom tabs
 * @param location
 */
function customTabParamValidator(location) {
    const resultsRegex = /results\/customTab\d+/;
    const patientViewRegex = new RegExp(
        `patient\/${PatientViewResourceTabPrefix}.+`
    );
    const studyViewRegex = new RegExp(`study\/${StudyViewResourceTabPrefix}.+`);
    return (
        location.pathname.match(resultsRegex) !== null ||
        patientViewRegex.test(location.pathname) ||
        studyViewRegex.test(location.pathname)
    );
}

// accepts bundle-loader's deferred loader function and defers execution of route's render
// until chunk is loaded
function lazyLoadComponent(
    loader,
    loadingCallback,
    validator = _ => {
        return true;
    }
) {
    return (location, cb) => {
        if (
            location &&
            !(
                validator(location.params) ||
                customTabParamValidator(location.location)
            )
        ) {
            loader = ErrorPage;
        }
        loader(module => {
            if (cb) {
                cb(null, module.default);
            }
            if (loadingCallback) {
                loadingCallback();
            }
        });
    };
}

var defaultRoute = window.defaultRoute || '/home';

var restoreRoute = inject('routing')(restoreRouteAfterRedirect);

let getBlankPage = function() {
    return <div />;
};

/* when route changes, we want to:
1. in spa, deep links from url (#) don't work because content is loading and thus doesn't exist to link to
   at time url changes.  seekHash is a somewhat dirty way of solving this issue
2, when there's no hash, we want to make sure we scroll to top because user considers herself on a "new page"
 */
function handleEnter() {
    const hash = getBrowserWindow().location.hash;
    if (hash.length > 0) {
        seekUrlHash(hash.replace('#', ''));
    } else {
        $(document).scrollTop(0);
    }
}

// we want to preload ResultsViewPage to prevent delay due to lazy loading bundle
// note: because we bundle, and bundles are loaded async, this does NOT affect time to render of default route
// results will load in background while user plays with query interface
function preloadImportantComponents() {
    lazyLoadComponent(ResultsViewPage).call();
    lazyLoadComponent(StudyViewPage).call();
}

export const makeRoutes = routing => {
    return (
        <Route path="/" component={Container}>
            <IndexRoute
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(
                    Homepage,
                    preloadImportantComponents
                )}
            />
            <Route
                path="/restore"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                component={restoreRoute}
            />

            <Route
                path="/loading/comparison"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                component={GroupComparisonLoading}
            />

            {/* Redirect legacy survival route directly to survival tab in comparison */}
            <Route
                path={`/results/${ResultsViewTab.SURVIVAL_REDIRECT}`}
                onEnter={() => {
                    redirectTo(
                        { comparison_subtab: 'survival' },
                        '/results/comparison'
                    );
                }}
                component={getBlankPage()}
            />

            {/* Redirect legacy enrichments route directly to mutations tab in comparison */}
            <Route
                path="/results/enrichments"
                onEnter={() => {
                    redirectTo(
                        { comparison_subtab: 'mutations' },
                        '/results/comparison'
                    );
                }}
                component={getBlankPage()}
            />

            <Route
                path="/results(/:tab)"
                onEnter={() => {}}
                getComponent={lazyLoadComponent(
                    ResultsViewPage,
                    null,
                    tabParamValidator(ResultsViewTab)
                )}
            />
            <Route
                path={'/' + PagePath.Patient + '(/:tab)'}
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(
                    PatientViewPage,
                    null,
                    tabParamValidator(PatientViewPageTabs)
                )}
            />
            <Route
                path={'/' + PagePath.Study + '(/:tab)'}
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(
                    StudyViewPage,
                    null,
                    tabParamValidator(StudyViewPageTabKeyEnum)
                )}
            />
            <Route
                path="/comparison(/:tab)"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(
                    GroupComparisonPage,
                    null,
                    tabParamValidator(GroupComparisonTab)
                )}
            />

            <Route
                path="/mutation_mapper"
                getComponent={lazyLoadComponent(MutationMapperTool)}
            />
            <Route
                path="/oncoprinter"
                getComponent={lazyLoadComponent(OncoprinterTool)}
            />
            <Route
                path="/webAPI"
                onEnter={handleEnter}
                getComponent={lazyLoadComponent(WebAPIPage)}
            />
            <Route
                path="/rmatlab"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(RMATLAB)}
            />
            <Route
                path="/datasets"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(DatasetPage)}
            />
            <Route
                path="/tutorials"
                onEnter={handleEnter}
                getComponent={lazyLoadComponent(Tutorials)}
            />
            <Route
                path="/visualize"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(Visualize)}
            />
            <Route
                path="/about"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(AboutUs)}
            />
            <Route
                path="/software"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                getComponent={lazyLoadComponent(Software)}
            />
            <Route
                path="/news"
                onEnter={handleEnter}
                getComponent={lazyLoadComponent(News)}
            />
            <Route
                path="/faq"
                onEnter={handleEnter}
                getComponent={lazyLoadComponent(FAQ)}
            />
            <Route
                path="/oql"
                onEnter={handleEnter}
                getComponent={lazyLoadComponent(OQL)}
            />
            <Route
                path="/testimonials"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                component={TestimonialsPage}
            />
            <Route
                path="/case.do"
                onEnter={handleCaseDO}
                component={getBlankPage()}
            />
            <Route
                path="/index.do"
                onEnter={handleIndexDO}
                component={getBlankPage()}
            />
            <Route
                path="/study.do"
                onEnter={handleStudyDO}
                component={getBlankPage()}
            />

            <Route
                path="/ln"
                onEnter={handleLinkOut}
                component={getBlankPage()}
            />
            <Route
                path="/link.do"
                onEnter={handleLinkOut}
                component={getBlankPage()}
            />
            <Route
                path="/encodedRedirect"
                onEnter={handleEncodedRedirect}
                component={getBlankPage()}
            />

            <Redirect from={'/mutation_mapper.jsp'} to={'/mutation_mapper'} />
            <Redirect from={'/data_sets.jsp'} to={'/datasets'} />
            <Redirect from={'/oncoprinter.jsp'} to={'/oncoprinter'} />
            <Redirect from={'/onco_query_lang_desc.jsp'} to={'/oql'} />
            <Redirect from={'/tools.jsp'} to={'/visualize'} />
            <Redirect from={'/tutorials.jsp'} to={'/tutorials'} />
            <Redirect from={'/tutorial.jsp'} to={'/tutorials'} />
            <Redirect from={'/cgds_r.jsp'} to={'/rmatlab'} />

            <Route
                path="*"
                onEnter={() => {
                    $(document).scrollTop(0);
                }}
                component={() => <PageNotFound />}
            />
        </Route>
    );
};

export default makeRoutes;
