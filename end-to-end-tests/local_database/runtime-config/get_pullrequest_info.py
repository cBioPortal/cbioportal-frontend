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

    frontend_branch_name = jData['head']['ref']
    frontend_commit_hash = jData['head']['sha']
    frontend_organization = jData['head']['repo']['full_name'].split("/")[0].lower()
    frontend_repo_name = jData['head']['repo']['name']

    frontend_base_branch_name = jData['base']['ref']
    frontend_base_commit_hash = jData['base']['sha']
    frontend_base_organization = jData['base']['repo']['full_name'].split("/")[0].lower()
    frontend_base_repo_name = jData['base']['repo']['name']

    # By default a backend is selected that is identical to the base branch of the frontend
    # e.g. for a frontend PR based on rc, the rc backend is selected 
    backend_organization = "cbioportal"
    backend_branch_name = frontend_base_branch_name

    # When a specific backend version is selected (recognized by the `BACKEND_BRANCH` parameter in the PR body),
    # this backend version is selected.  
    pr_match = re.search(r"BACKEND_BRANCH=([^\s]+):([^\s]+)", jData['body'])
    if pr_match is not None :
        backend_organization = pr_match.group(1).lower()
        backend_branch_name = pr_match.group(2)

    # TODO: attempt to shorten git commit hash for jitpack compat
    frontend_commit_hash = frontend_commit_hash[:10]

    frontend_group_id = "com.github."+frontend_organization

    print(
      "export FRONTEND_BRANCH_NAME="+ frontend_branch_name +"\n"
      "export FRONTEND_COMMIT_HASH="+ frontend_commit_hash +"\n"
      "export FRONTEND_ORGANIZATION="+ frontend_organization +"\n"
      "export FRONTEND_REPO_NAME="+ frontend_repo_name +"\n"
      "export FRONTEND_GROUPID="+ frontend_group_id +"\n"
      "export FRONTEND_BASE_BRANCH_NAME="+ frontend_base_branch_name +"\n"
      "export FRONTEND_BASE_COMMIT_HASH="+ frontend_base_commit_hash +"\n"
      "export FRONTEND_BASE_ORGANIZATION="+ frontend_base_organization +"\n"
      "export FRONTEND_BASE_REPO_NAME="+ frontend_base_repo_name +"\n"
      "export BACKEND_ORGANIZATION="+ backend_organization +"\n"
      "export BACKEND_BRANCH_NAME="+ backend_branch_name)

else:
  # If response code is not ok (200), print the resulting http error code with description
    myResponse.raise_for_status()