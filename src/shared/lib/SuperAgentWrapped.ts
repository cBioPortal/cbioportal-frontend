import { Request } from 'superagent';
import request from 'superagent';
import { SiteError } from 'AppStore';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

class SuperAgentClient {
    handleErrorsGlobally(errorConfig: Partial<SiteError> = {}) {
        // @ts-ignore end does in fact exist)
        const oldEnd = Request.prototype.end;

        const restoreEnd = function() {
            // @ts-ignore end does in fact exist)
            Request.prototype.end = oldEnd;
        };

        // @ts-ignore end does in fact exist)
        Request.prototype.end = function(fn) {
            const callback = function(err: any) {
                if (err) {
                    errorConfig.errorObj = err;
                    getBrowserWindow().globalStores.appStore.handleServiceError(
                        errorConfig as SiteError
                    );
                }
                fn.apply(this, arguments);
            };
            oldEnd.call(this, callback);
            restoreEnd();
        };

        return request;
    }

    handleErrorsLocally() {
        return request;
    }
}

export default new SuperAgentClient();
