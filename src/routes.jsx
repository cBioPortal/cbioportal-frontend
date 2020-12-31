import React, { useEffect } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { inject } from 'mobx-react';
import AppConfig from 'appConfig';
import {
    handleIndexDO,
    handleCaseDO,
    restoreRouteAfterRedirect,
    handleStudyDO,
    handleLinkOut,
    handleEncodedRedirect,
    redirectTo,
    correctBasePath as _correctBasePath,
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
const PatientViewPage = SuspenseWrapper(
    React.lazy(() => import('./pages/patientView/PatientViewPage'))
);
const ResultsViewPage = SuspenseWrapper(
    React.lazy(() => import('./pages/resultsView/ResultsViewPage'))
);
import TestimonialsPage from 'pages/staticPages/testimonialsPage/TestimonialsPage';
import GroupComparisonLoading from './pages/groupComparison/GroupComparisonLoading';
const DatasetPage = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/datasetView/DatasetPage'))
);
const Homepage = SuspenseWrapper(
    React.lazy(() => import('./pages/home/HomePage'))
);
const StudyViewPage = SuspenseWrapper(
    React.lazy(() => import('./pages/studyView/StudyViewPage'))
);
const MutationMapperTool = SuspenseWrapper(
    React.lazy(() =>
        import('./pages/staticPages/tools/mutationMapper/MutationMapperTool')
    )
);
const OncoprinterTool = SuspenseWrapper(
    React.lazy(() =>
        import('./pages/staticPages/tools/oncoprinter/OncoprinterTool')
    )
);
const WebAPIPage = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/webAPI/WebAPIPage'))
);
const RMATLAB = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/rmatlab/RMatLAB'))
);
const Tutorials = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/tutorials/Tutorials'))
);
const Visualize = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/visualize/Visualize'))
);
const AboutUs = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/aboutus/AboutUs'))
);
const InstallationMap = SuspenseWrapper(
    React.lazy(() =>
        import('./pages/staticPages/installations/InstallationMap')
    )
);
const Software = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/software/Software'))
);
const News = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/news/News'))
);
const FAQ = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/faq/FAQ'))
);
const OQL = SuspenseWrapper(
    React.lazy(() => import('./pages/staticPages/oql/OQL'))
);
const GroupComparisonPage = SuspenseWrapper(
    React.lazy(() => import('./pages/groupComparison/GroupComparisonPage'))
);
const ErrorPage = SuspenseWrapper(
    React.lazy(() => import('./pages/resultsView/ErrorPage'))
);

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
import { CLIN_ATTR_DATA_TYPE } from 'pages/resultsView/plots/PlotsTabUtils';
import { SpecialAttribute } from 'shared/cache/ClinicalDataCache';
import { AlterationTypeConstants } from 'pages/resultsView/ResultsViewPageStore';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';

function SuspenseWrapper(Component) {
    return props => (
        <React.Suspense fallback={null}>
            <Component {...props} />
        </React.Suspense>
    );
}

function LocationValidationWrapper(Component, validator) {
    return props => {
        if (
            props.location &&
            !(
                validator(props.match.params) ||
                customTabParamValidator(props.location)
            )
        ) {
            return <ErrorPage {...props} />;
        } else {
            return <Component {...props} />;
        }
    };
}

function ScrollToTop(Component) {
    return props => {
        useEffect(() => {
            $(document).scrollTop(0);
        }, []);
        return <Component {...props} />;
    };
}

function GoToHashLink(Component) {
    return props => {
        useEffect(handleEnter, []);
        return <Component {...props} />;
    };
}

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

function comparisonTabParamValidator() {
    // comparison tab includes generic assay tabs which is not predictable
    // validate tabs by checking it's degined in GroupComparisonTab
    // or validate generic assay tabs by checking if it starts with GroupComparisonTab.GENERIC_ASSAY_PREFIX
    return function(params) {
        return (
            !params.tab ||
            Object.values(GroupComparisonTab).indexOf(params.tab) > -1 ||
            !params.tab.startsWith(GroupComparisonTab.GENERIC_ASSAY_PREFIX)
        );
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

var correctBasePath = inject('routing')(_correctBasePath);

let getBlankPage = function(callback) {
    return props => {
        if (callback) {
            useEffect(() => {
                callback();
                // make sure that useEffect argument doesn't return anything
            }, []);
        }
        return <div />;
    };
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
    const homepage = Homepage;
    return (
        <React.Suspense fallback={null}>
            <Switch>
                <Route exact path={'/'} component={ScrollToTop(Homepage)} />
                <Route path="/restore" component={ScrollToTop(restoreRoute)} />

                {['private.cbioportal.org', 'sclc.cbioportal.org'].includes(
                    window.location.hostname
                ) && (
                    <Route
                        path={`${AppConfig.basePath}`}
                        component={correctBasePath}
                    />
                )}

                <Route
                    path="/loading/comparison"
                    component={ScrollToTop(GroupComparisonLoading)}
                />

                {/* Redirect legacy survival route directly to survival tab in comparison */}
                <Route
                    path={`/results/${ResultsViewTab.SURVIVAL_REDIRECT}`}
                    component={getBlankPage(() => {
                        redirectTo(
                            { comparison_subtab: 'survival' },
                            '/results/comparison'
                        );
                    })}
                />

                {/* Redirect legacy expression route directly to plots tab with mrna vs study */}
                <Route
                    path={`/results/${ResultsViewTab.EXPRESSION_REDIRECT}`}
                    component={getBlankPage(() => {
                        redirectTo(
                            {
                                plots_horz_selection: JSON.stringify({
                                    dataType: CLIN_ATTR_DATA_TYPE,
                                    selectedDataSourceOption:
                                        SpecialAttribute.StudyOfOrigin,
                                }),

                                plots_vert_selection: JSON.stringify({
                                    dataType:
                                        AlterationTypeConstants.MRNA_EXPRESSION,
                                    logScale: 'true',
                                }),
                            },
                            `/results/${ResultsViewTab.PLOTS}`
                        );
                    })}
                />

                {/* Redirect legacy enrichments route directly to mutations tab in comparison */}
                <Route
                    path="/results/enrichments"
                    component={getBlankPage(() => {
                        redirectTo(
                            { comparison_subtab: 'mutations' },
                            '/results/comparison'
                        );
                    })}
                />
                <Route
                    path="/results/:tab?"
                    component={LocationValidationWrapper(
                        ResultsViewPage,
                        tabParamValidator(ResultsViewTab)
                    )}
                />
                <Route
                    path={'/' + PagePath.Patient + '/:tab?'}
                    component={ScrollToTop(
                        LocationValidationWrapper(
                            PatientViewPage,
                            tabParamValidator(PatientViewPageTabs)
                        )
                    )}
                />
                <Route
                    path={'/' + PagePath.Study + '/:tab?'}
                    component={ScrollToTop(
                        LocationValidationWrapper(
                            StudyViewPage,
                            tabParamValidator(StudyViewPageTabKeyEnum)
                        )
                    )}
                />
                <Route
                    path="/comparison/:tab?"
                    component={ScrollToTop(
                        LocationValidationWrapper(
                            GroupComparisonPage,
                            comparisonTabParamValidator
                        )
                    )}
                />

                <Route path="/mutation_mapper" component={MutationMapperTool} />
                <Route path="/oncoprinter" component={OncoprinterTool} />
                <Route path="/webAPI" component={GoToHashLink(WebAPIPage)} />
                <Route path="/rmatlab" component={ScrollToTop(RMATLAB)} />
                <Route path="/datasets" component={ScrollToTop(DatasetPage)} />
                <Route path="/tutorials" component={GoToHashLink(Tutorials)} />
                <Route path="/installations" component={InstallationMap} />
                <Route path="/visualize" component={ScrollToTop(Visualize)} />
                <Route path="/about" component={ScrollToTop(AboutUs)} />
                <Route path="/software" component={ScrollToTop(Software)} />
                <Route path="/news" component={GoToHashLink(News)} />
                <Route path="/faq" component={GoToHashLink(FAQ)} />
                <Route path="/oql" component={GoToHashLink(OQL)} />
                <Route
                    path="/testimonials"
                    component={ScrollToTop(TestimonialsPage)}
                />
                <Route path="/case.do" component={getBlankPage(handleCaseDO)} />
                <Route
                    path="/index.do"
                    component={getBlankPage(handleIndexDO)}
                />
                <Route
                    path="/study.do"
                    component={getBlankPage(handleStudyDO)}
                />

                <Route path="/ln" component={getBlankPage(handleLinkOut)} />
                <Route
                    path="/link.do"
                    component={getBlankPage(handleLinkOut)}
                />
                <Route
                    path="/encodedRedirect"
                    component={getBlankPage(handleEncodedRedirect)}
                />

                <Redirect
                    path={'/mutation_mapper.jsp'}
                    to={'/mutation_mapper'}
                />
                <Redirect path={'/data_sets.jsp'} to={'/datasets'} />
                <Redirect path={'/oncoprinter.jsp'} to={'/oncoprinter'} />
                <Redirect path={'/onco_query_lang_desc.jsp'} to={'/oql'} />
                <Redirect path={'/tools.jsp'} to={'/visualize'} />
                <Redirect path={'/tutorials.jsp'} to={'/tutorials'} />
                <Redirect path={'/tutorial.jsp'} to={'/tutorials'} />
                <Redirect path={'/cgds_r.jsp'} to={'/rmatlab'} />

                <Route
                    path="*"
                    component={ScrollToTop(() => (
                        <PageNotFound />
                    ))}
                />
            </Switch>
        </React.Suspense>
    );
};

export default makeRoutes;
