# cbioportal-frontend
[![Build Status](https://travis-ci.org/cBioPortal/cbioportal-frontend.svg?branch=master)](https://travis-ci.org/cBioPortal/cbioportal-frontend)
[![codecov](https://codecov.io/gh/cbioportal/cbioportal-frontend/branch/master/graph/badge.svg)](https://codecov.io/gh/cbioportal/cbioportal-frontend)
[![Code Climate](https://codeclimate.com/github/cBioPortal/cbioportal-frontend/badges/gpa.svg)](https://codeclimate.com/github/cBioPortal/cbioportal-frontend)

This is the new React frontend for cBioPortal, currently under development. 

To install all app and dev dependencies 
```
npm install
```

To start dev server with hot reload enabled
```
npm run start
```

To run unit/integration tests
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
There is a precommit hook installed that compiles the project before committing. This makes sure the compiled source is always up to data and allows for easy importing any branch/commit in parent cBioPortal project. The hook can be viewed in [package.json](package.json). You can skip it with 
```bash
git commit -n
```

## Changing the URL of API
Add .env file in root of project. Put the following in that file:  (The host
can be set to whatever instance of the api you want to use as a backend.)  

The default is:
```
API_ROOT=www.cbioportal.org/api-legacy
```
