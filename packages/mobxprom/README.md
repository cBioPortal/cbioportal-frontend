##Note This library is a copy of the defunct mobxpromise library published on NPM repo. We are moving
it into this monorepo because it is only used in cBioPortal and adjacent projects and is more
easily managed here.

# MobxPromise

Provides
[observable](https://mobx.js.org/refguide/api.html)
status and results from
[computed](https://mobx.js.org/refguide/computed-decorator.html)
promises to make it easy to render
[MobX observer components](https://mobx.js.org/refguide/observer-component.html)
from changing, asynchronous data with
[mobx-react](https://github.com/mobxjs/mobx-react).

A MobxPromise (MP) is integrated into an application by referencing its
computed properties (`status`, `result`, ...) in the render method of an
[observer component](https://mobx.js.org/refguide/observer-component.html).
Thanks to
[mobx-react](https://github.com/mobxjs/mobx-react),
the component's render function will be re-invoked whenever the properties
of the referenced MP change. The status of the MP and its resulting data will
thus be reflected as a product of reference, with no other wiring necessary.

How does this happen? A reference to any property of the MP invokes that property's
[@computed](https://mobx.js.org/refguide/computed-decorator.html)
getter. The getter first checks the `status` of any MP in the `await` collection
(and this causes the same process to occur inside these children). If any awaited promises are
not complete (i.e. `status` is `"error"` or `"pending"`) then that is assumed to be the status
of the awaiting MP. If all awaited promises are complete, then the MP accesses its
[@computed](https://mobx.js.org/refguide/computed-decorator.html)
promise using the provided `invoke` method.

When the promise resolves, the MP's `status` is set to `"complete"` unless the promise
has become stale or members of the `await` collection no longer have a `status` of `"complete"`.
The computed promise becomes stale when observable dependencies of the `invoke` function have
changed. Promises which become stale before being resolved will never set the status or result
of the MP and will thus have no influence on the application. Thanks to
[MobX](https://github.com/mobxjs/mobx),
the `invoke` method will only be called again when its referenced observables have changed.


## Acknowledgements

Thanks to [@alisman](https://github.com/alisman) for writing a big chunk of this readme.

Thanks to the [@cBioPortal](https://github.com/cBioPortal) team for feedback which helped shape this little utility class.

This project was set up using [TypeScript library starter](https://github.com/alexjoverm/typescript-library-starter).