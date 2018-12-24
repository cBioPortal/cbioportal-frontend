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
npm install
```

To build DLLs in common-dist folder (must be done prior to start of dev server)
```
npm run buildDLL:dev
```

To start dev server with hot reload enabled
```
# set the environment variables you want based on what branch you're branching
# from
export BRANCH_ENV=master # or rc if branching from rc
# export any custom external API URLs by editing env/custom.sh
npm run start
```

Example pages:
 - http://localhost:3000/
 - http://localhost:3000/patient?studyId=lgg_ucsf_2014&caseId=P04

To run unit/integration tests (need to have API URL defined in `.env`)
```
npm run test
```

To run unit/integration tests in watch mode
```
npm run test:watch
```

To run unit/integration tests in watch mode (where specName is a fragment of the name of the spec file (before .spec.))
```
npm run test:watch -- --grep=#specName#
```

To run linting
```
npm run lint
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
npm run updateAPI
npm run test
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
npm install -g webdriver-manager
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
npm run start
```
In another terminal run the e2e tests
```bash
# set the environment variables you want based on what branch you're branching
# from
export BRANCH_ENV=master # or rc if branching from rc
# export any custom external API URLs in env/custom.sh
cd end-to-end-tests
npm install
npm run test-webdriver-manager
```
