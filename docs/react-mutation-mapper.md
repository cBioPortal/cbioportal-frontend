# react-mutation-mapper

Mutation Mapper and related components now live in the [react-mutation-mapper](https://github.com/cBioPortal/react-mutation-mapper) repo, 
and periodically published to [react-mutation-mapper](https://www.npmjs.com/package/react-mutation-mapper) npm repo.
In production, we simply import it from npm. During development, however, it is not practical to publish to npm every time.
Following methods can be used when developing `react-mutation-mapper`.

## yarn link

Inside your fork of react-mutation-mapper
 - Run `yarn build`
 - Run `yarn link`
    
Inside your fork of cbioportal-frontend
 - Run `yarn link react-mutation-mapper`
 - In `tsconfig.json` add `node_modules/@types/*` to the `paths.*` array
 - Run `yarn start`

In some cases, you may also need to link to the `cbioportal-frontend-commons` if previously installed version of `react-mutation-mapper` is depending on an older version of `cbioportal-frontend-commons` than the one in your fork.
To link `cbioportal-frontend-commons`:
 - Run `yarn buildPublicLib`
 - Go to the directory `commons-dist`
 - Run `yarn link`
 - Go back to the root directory of `cbioportal-frontend`
 - Run `yarn link cbioportal-frontend-commons`
 
Every time you rebuild your local fork of `react-mutation-mapper`, `cbioportal-frontend` should automatically recompile if `react-mutation-mapper` when properly linked.
    
## import from a git commit

Development is slower with this method, but you don't need to update `tsconfig.json` and will less likely get dependency conflicts.
    
  - Commit your current work to your fork of `react-mutation-mapper`
  - Update `react-mutation-mapper` dependency in `cbioportal-frontend/package.json` with your commit version.
    (example: `"react-mutation-mapper": "https://github.com/onursumer/react-mutation-mapper.git#7793c207bf48f7011c4cd1774737b4d920177376"`) 
  - Run `yarn install`
  - Run `yarn start`

Every time you update your local fork of `react-mutation-mapper` you have to commit to github and update the commit version to reflect the changes in `cbioportal-frontend`.