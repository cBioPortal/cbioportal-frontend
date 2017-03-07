import * as seamlessImmutable from 'seamless-immutable';
import {createMobxPromiseFactory} from 'mobxpromise';

/**
 * Constructs a MobxPromise which will call seamlessImmutable.from() on the result and the default value.
 */
export const remoteData = createMobxPromiseFactory(seamlessImmutable.from);
