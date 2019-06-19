# cbioportal-frontend
[![Join the chat at https://gitter.im/cBioPortal/public-chat](https://badges.gitter.im/cBioPortal/public-chat.svg)](https://gitter.im/cBioPortal/public-chat?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
## Live demo
Master: http://cbioportal-frontend.herokuapp.com/patient?studyId=prad_fhcrc&caseId=00-090

Rc: http://cbioportal-frontend-rc.herokuapp.com/patient?studyId=prad_fhcrc&caseId=00-090

## Test status & Code Quality
| Branch | master | rc |
| --- | --- | --- |
| Status | [![CircleCI](https://circleci.com/gh/cBioPortal/cbioportal-frontend/tree/master.svg?style=svg)](https://circleci.com/gh/cBioPortal/cbioportal-frontend/tree/master) | [![CircleCI](https://circleci.com/gh/cBioPortal/cbioportal-frontend/tree/rc.svg?style=svg)](https://circleci.com/gh/cBioPortal/cbioportal-frontend/tree/rc) |

[![codecov](https://codecov.io/gh/cbioportal/cbioportal-frontend/branch/master/graph/badge.svg)](https://codecov.io/gh/cbioportal/cbioportal-frontend)

[![Code Climate](https://codeclimate.com/github/cBioPortal/cbioportal-frontend/badges/gpa.svg)](https://codeclimate.com/github/cBioPortal/cbioportal-frontend)

## Deployment
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

This is the frontend code for cBioPortal using React, MobX and TypeScript. The
frontend for the new patient view is now completely in this repo. The results view page is currently being replaced one tab at a time by mounting certain React components to the results page (JSP) in [the backend repo](https://github.com/cbioportal/cbioportal)

Make sure you have installed the node version specified in [package.json](https://github.com/cBioPortal/cbioportal-frontend/blob/master/package.json). You might want to use NVM to install the particular version.

Remove old compiled `node_modules` if exists

```
rm -rf node_modules
```

To install all app and dev dependencies
```
yarn install --frozen-lockfile
```

To build DLLs in common-dist folder (must be done prior to start of dev server)
```
yarn run buildDLL:dev
```

To start dev server with hot reload enabled
```
# set the environment variables you want based on what branch you're branching
# from
export BRANCH_ENV=master # or rc if branching from rc
# export any custom external API URLs by editing env/custom.sh
yarn run start
```

Example pages:
 - http://localhost:3000/
 - http://localhost:3000/patient?studyId=lgg_ucsf_2014&caseId=P04

To run unit/integration tests (need to have API URL defined in `.env`)
```
yarn run test
```

To run unit/integration tests in watch mode
```
yarn run test:watch
```

To run unit/integration tests in watch mode (where specName is a fragment of the name of the spec file (before .spec.))
```
yarn run test:watch -- --grep=#specName#
```

To run linting
```
yarn run lint
```

## precommit hook
There is a precommit hook installed that lint checks the typescript in this project. The hook can be viewed in [package.json](package.json). You can skip it with 
```bash
git commit -n
```

## Changing the URL of API
If the version of the desired API URL is the same as the one used to generate
the typescipt client, one can change the `API_ROOT` variable for development in
[my-index.ejs](my-index.ejs). If the version is different, make sure the API
endpoint works with the checked in client by changing the API URL in
[package.json](package.json) and running:
```
# set the environment variables you want based on what branch you're branching
# from
export BRANCH_ENV=master # or rc if branching from rc
# export any custom external API URLs by editing env/custom.sh
yarn run updateAPI
yarn run test
```

## Check in cBioPortal context
Go to http://cbioportal.org (`master` branch) or http://cbioportal.org/beta/ (`rc` branch)

In your browser console set:
```
localStorage.setItem("localdev",true)
```
This will use whatever you are running on `localhost:3000` to serve the JS (i.e. you need to have the frontend repo running on port 3000). To unset do:
```
localStorage.setItem("localdev",false)
```
or clear entire local storage
```
localStorage.clear()
```
You can also use a heroku deployed cbioportal-frontend pull request for serving the JS by setting localStorage to:
```
localStorage.setItem("heroku", "cbioportal-frontend-pr-x")
```
Change `x` to the number of your pull request.

## Run e2e tests

Install webdriver-manager, which manages standalone Selenium installation:
```
yarn install -g webdriver-manager
```
Run updater to get necessary binaries
```
webdriver-manager update
```
Start the webdriver-manager
```
webdriver-manager start
```
In one terminal run frontend (this will get mounted inside whatever
`CBIOPORTAL_URL` is pointing to)
```bash
# set the environment variables you want based on what branch you're branching
# from
export BRANCH_ENV=master # or rc if branching from rc
# export any custom external API URLs by editing env/custom.sh
yarn run start
```
In another terminal run the e2e tests
```bash
# set the environment variables you want based on what branch you're branching
# from
export BRANCH_ENV=master # or rc if branching from rc
# export any custom external API URLs in env/custom.sh
cd end-to-end-test/remote
yarn install
yarn run test-webdriver-manager
```

## Local cBioPortal database for e2e-tests
To enable e2e-tests on for features that depend on data that are not included in studies served by the public cBioPortal instance, cbioportal-frontend provides the `e2e local database` (refered to as _e2e-localdb_ below) facility that allows developers to load custom studies used for e2e-tests. CircleCI runs the `e2e local database` tests as a separate job.

Files for the local database e2e tests are located in the `./end-to-end-test/local` directory of cbioportal-frontend. The directory structure of `./end-to-end-test/local` is comparable to that of the `./end-to-end-test/remote` directory used for e2e tests against public cBioPortal.

### Contexts for e2e-localdb tests
E2e-tests can run in local context (workstation for software development) or CircleCI context (for continuous integration testing). On CircleCI e2e-tests can be conducted on commits that are in- or outside the context of a pull request. These contexts are refered to below as _Local_, _CircleCi_ and _CircleCI+PR_ context.

#### Running e2e-localdb tests in _Local_ context
Running of e2e-localdb tests in _Local_ context follows the procedure as defined in `.circleci/config.yml`, differs only in that the e2e-tests are not run in a docker environment, but on the local system directly. The `end-to-end-test/local/runtime-config/run_local_test.sh` shell script is included to facilitate local development. Prior to running the script several environmental variables should be set. For local development follow these steps:

1. Add `export BACKEND=cbioportal:rc` (or other backend branch) to `/env/custom.sh`.
2. Make sure the last commit is pushed to _origin_ repo (needed by jitpack).
3. Setup a local docker container environment: 

```
export PORTAL_SOURCE_DIR=~/git/cbioportal-frontend # change path if needed
export TEST_HOME="$PORTAL_SOURCE_DIR/end-to-end-test"
source $PORTAL_SOURCE_DIR/env/custom.sh
cd $TEST_HOME/local/runtime-config
eval "$(./setup_environment.sh)"
export CBIOPORTAL_URL='http://localhost:8081/cbioportal'
cd $PORTAL_SOURCE_DIR
$TEST_HOME/local/runtime-config/setup_local_context.sh -j -d -p -e # remove flags to exclude specific stages if desired (see below)
```
4. Run the screenshot tests (repeat this step while developing):
```
./end-to-end-test/local/runtime-config/run_local_screenshot_test.sh
```
5. When finished reclaim ports by killing selenium and node servers:
```
killall java -9
killall node -9
```

###### Exclude build stages
Setup of the local context involves building of the local frontend code, building of the cbioportal database, building the cbioportal application, building the e2e service and the start of all docker containers. During rebuilding of the development environment the developer can specify which stept should be executed by providing `-j` (building of frontent code), `-d` (building of database), `-p` (building of cbioportal), and/or `-e` (building of e2e service) flags to the `setup_local_context.sh` script. For instance, to rebuild the database and start all containers the script can be executed as:
```
./end-to-end-test/local/runtime-config/setup_local_context.sh -d
```
When no parameters are passed, no build steps are executed (only start of containers).

#### Writing e2e tests
Note: these are random topics that I encountered while developing e2e-tests. These should be reorganized in a better structured document.
- screenshot tests and DOM-based tests are contained in files that end with *.screenshot.spec.js or *.spec.js, respectively.
- Screenshot tests should only be used to test components that cannot be accessed via the DOM.
- For DOM selection webdriverio selectors are used. Although overlapping with jQuery selectors and both using the '$' notation these methods are not equivalent. See [this link](https://blog.kevinlamping.com/selecting-elements-in-webdriverio/) for more information on webdriverio selectors.
- At the moment of this writing webdriverio v4 is used. Selectors for this version are not fully compatible with webdriverio v5. For instance, selecting of a element with id _test_ `$('id=test')` does not work; this should be `$([id=test])`. I was not able to find documentation of v4 selectors.
- e2e tests use the node.js _assert_ library for assertions. It has an API that is different API from _chai_ assertion library used in unit tests of cbioportal-frontend! See the [assert documentation](https://nodejs.org/api/assert.html) for information on _assert_ API.
- Screenshots for failing tests are placed in the screenshots/error folder. These are a valuable asset to debug tests on when developing in _Local_ context.
- A great tool for test development is the ability of webdriverio to pause execution with `browser.debug()`. When placing this command in the test code and using the `run_local_screenshot_test.sh` facility, a prompt becomes available on the command line that allows testing of DOM selectors in the webbrowser. In addition, the browser window is available on screen; opening of DevTools allows to explore the DOM and observe the effects of webdriverio commands on the command line.
- <use waitForVisible/waitForExits ... to prevent brittle tests>

#### Running e2e-localdb tests _CircleCI_ or _CircleCI+PR_ context
E2e-tests on _CircleCI_ and _CircleCI+PR_ context are triggered via _hooks_ configured on GitHub. Configuration of hooks falls beyond the scope of this manual.

### cBioPortal-backend version
E2e-testing against a local database removes dependence on data provided by public cbioportal instances for testing. This makes it possible to test features for data types that are not provided by public cbioportal instances or test features that depend on a backend feature not yet integrated in  public cbioportal instances. E2e-localdb tests make use of the `BACKEND` environmental variable to test against a specific backend version. Depending on the running context (see section above) setting the `BACKEND` environmental variable is required or optional (see table below).

Requirement for setting the BACKEND variable depends on the context of the job:
| **context**             | **BACKEND var** | **comments** |
|------------------------ | ----------------- | ------------ |
| _Local_                   | required        ||
| _CircleCI_                | required        | |
| _CircleCI+PR_   | optional        | 1. When specified, GitHub PR must be of 'draft' state.<br>2. When not-specified, backend branch will mirror frontend branch (rc frontend vs. rc backend) |

The value of the `BACKEND` variable must be formatted as `<BACKEND_GITHUB_USER>:<BACKEND_BRANCH>`. For example, when the /env/custom.sh file contains `export BACKEND=thehyve:uwe7872A` this is interpreted as a requirement for the commit `uwe7872A` of the _github.com/thehyve/cbioportal_ repository.

#### BACKEND environmental variable in _CircleCI+PR_ context
Using the `BACKEND` variable e2e-localdb tests can be conducted against any backend version. This poses a risk when testing in the context of a pull request, i.e., tests show up as succesful but should have failed against the backend version that compatible with the target cbioportal-frontend branch. To guard against this and prevent merging of incompatible branches into cbioportal-frontend the e2e-localdb tests enforce the use of _draft_ pull requests (see [here](https://help.github.com/en/articles/creating-a-pull-request) for more info). When a cBioPortal backend version is specified (i.e., may require a not yet merged backend branch) and the branch is part of a pull request, the pull request must be in state _draft_. Only when the `BACKEND` variable is not defined a (non-_draft_) e2e-localdb tests will be conducted on branches that are part of pull requests. Needles to say, pull request should for this and other reasons only be merged when the e2e-localdb tests succeed!

When the `BACKEND` variable is not set, the backend version will be set to the target branch of the pull request, i.e. a pull request to 'rc' branch will be tested against the 'rc' branch of the backend.

### Create new e2e-test
Making e2e-tests follows the current procedure for the e2e-tests:
1. Create junit test file and place in the `./end-to-end-test/local/spec` directory.
2. [Optional] Add a folder with an uncompressed custom study in the `./end-to-end-test/local/studies` directory.

### Notes
* Study_es_0 is imported by default.
* Gene panel and gene set matrix data of custom studies must comply with gene panel/sets imported as part of study_es_0.
* Imports of custom seed data for gene panels and gene sets are not implemented at the moment of this writing.
* In order to minimize time of local database e2e tests the size of custom studies should be kept as small as possible.
* When developing in _Local_ context port 8081 can be used to access the cbioportal instance ('http://localhost:8081/cbioportal').
