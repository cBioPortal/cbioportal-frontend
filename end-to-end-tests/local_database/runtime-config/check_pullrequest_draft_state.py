#!/usr/bin/python3

import sys
import json
import requests
import re

issue_number=sys.argv[1]

# TODO !!!! change back to cbioportal --> 
url = "https://api.github.com/repos/thehyve/cbioportal-frontend/pulls/"+issue_number

myResponse = requests.get(url)

# For successful API call, response code will be 200 (OK)
if(myResponse.ok):

    jData = json.loads(myResponse.content.decode('utf-8'))

    # When a specific backend branch is specified, this PR must be prevented from merge
    # (merge of the specific backend branch before frontend merge is required for correct
    # functioning of cbioportal). Therefore, a PR that has a `BACKEND_BRANCH` parameter
    # must be of the `draft pull request` type. If it is not, we return an error and the
    # circleCI test fails.
    pr_match = re.search(r"BACKEND_BRANCH=", jData['body'])
    if pr_match is not None and jData['mergeable_state'] != 'draft':
        print("Error: `BACKEND_BRANCH` parameter defined in pull request body, but pull request state is not `draft`")
        print("Remove `BACKEND_BRANCH` parameter or change the pull request into a draft pull request.")
        sys.exit(1)

else:
  # If response code is not ok (200), print the resulting http error code with description
    myResponse.raise_for_status()
    sys.exit(1) 