# cbioportal-frontend
[![Build Status](https://travis-ci.org/cBioPortal/cbioportal-frontend.svg?branch=master)](https://travis-ci.org/cBioPortal/cbioportal-frontend)
[![codecov](https://codecov.io/gh/cbioportal/cbioportal-frontend/branch/master/graph/badge.svg)](https://codecov.io/gh/cbioportal/cbioportal-frontend)
[![Code Climate](https://codeclimate.com/github/cBioPortal/cbioportal-frontend/badges/gpa.svg)](https://codeclimate.com/github/cBioPortal/cbioportal-frontend)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

This is the new React frontend for cBioPortal, currently under development.

Make sure you have the latest stable node version installed:

https://nodejs.org/en/

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
npm run start
```

A good example page is: http://localhost:3000/?cancer_study_id=lgg_ucsf_2014&case_id=P04

To run unit/integration tests (need to have API URL defined in `.env`)
```
npm run test
```

To run unit/integration tests in watch mode
```
npm run test:watch
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
Add .env file in root of project. Put the following in that file:  (The host
can be set to whatever instance of the api you want to use as a backend.)  

The default is:
```
API_ROOT=www.cbioportal.org/api
```

## Check in cBioPortal context
Go to
http://cbioportal-rc.herokuapp.com/case.do?cancer_study_id=lgg_ucsf_2014&case_id=P04

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
