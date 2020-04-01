#!/usr/bin/env bash
# check if there is a change in any of the workspace packages,
# but the corresponding package version (in package.json) is not updated

# get the names of all changed modules
MODULES_STR=$(lerna list --since="origin/${BRANCH_ENV}");

# convert to an array
readarray -t MODULES_ARRAY <<< "$MODULES_STR";

# find packages with unchanged version field
PACKAGES_MISSING_VERSION_UPDATE=();

# for each updated module, see if package.json is also updated
for module in ${MODULES_ARRAY[@]}
do
  VERSION_DIFF_COUNT=$(git diff --unified=0 origin/${BRANCH_ENV} -- $(printf "packages/%s/package.json" "${module}") | grep -c '"version":');
  # if no line with "version": has changed, then the package version is NOT updated
  if [[ $VERSION_DIFF_COUNT == 0 ]]; then
    PACKAGES_MISSING_VERSION_UPDATE+=($module);
  fi
done

# echo all the packages that needs to be updated, but not updated
if [[ ${#PACKAGES_MISSING_VERSION_UPDATE[@]} > 0 ]]; then
  echo $(printf '%s\n' "${PACKAGES_MISSING_VERSION_UPDATE[@]}");
  exit 1;
fi
