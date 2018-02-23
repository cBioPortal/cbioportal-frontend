# What? Why?
Fix # .

Changes proposed in this pull request:
- a
- b

# Checks
- [ ] Is this PR adding logic based on one or more **clinical** attributes? If yes, please make sure validation for this attribute is also present in the data validation / data loading layers (in backend repo) and documented in [File-Formats Clinical data section](https://github.com/cBioPortal/cbioportal/blob/master/docs/File-Formats.md#clinical-data)!
- [ ] Follows [7 rules of great commit messages](http://chris.beams.io/posts/git-commit/). For most PRs a single commit should suffice, in some cases multiple topical commits can be useful. During review it is ok to see tiny commits (e.g. Fix reviewer comments), but right before the code gets merged to master or rc branch, any such commits should be squashed since they are useless to the other developers. Definitely avoid [merge commits, use rebase instead.](http://nathanleclaire.com/blog/2014/09/14/dont-be-scared-of-git-rebase/)
- [ ] Follows the [Airbnb React/JSX Style guide](https://github.com/airbnb/javascript/tree/master/react).
- [ ] Make sure your commit messages end with a Signed-off-by string (this line
  can be automatically added by git if you run the `git-commit` command with
  the `-s` option)

# Any screenshots or GIFs?
If this is a new visual feature please add a before/after screenshot or gif
here with e.g. [GifGrabber](http://www.gifgrabber.com/).

# Notify reviewers
Read our [Pull request merging
policy](../CONTRIBUTING.md#pull-request-merging-policy). If you are part of the
cBioPortal organization, notify the approprate team (remove inappropriate):

@cBioPortal/frontend

If you are not part of the cBioPortal organization look at who worked on the
file before you. Please use `git blame <filename>` to determine that
and notify them here:
