import CBioPortalAPI from 'shared/api/generated/CBioPortalAPI';
import { SiteError } from 'AppStore';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

type Constructor<T> = new (...args: any[]) => T;

export function extendCBioPortalAPI<T extends Constructor<{}>>(Base: T) {
    return class extends Base {
        handleErrorsGlobally(errorConfig: Partial<SiteError> = {}) {
            const self = this;

            // @ts-ignore (it's private, but we CAN access it)
            const proxiedRequest = this.request;

            function restoreRequest() {
                // @ts-ignore (it's private, but we CAN access it)
                self.request = proxiedRequest;
            }

            // @ts-ignore (it's private, but we CAN access it)
            self.request = function() {
                const args = Array.from(arguments);
                if (args.length >= 9) {
                    args[8] = args[8].concat([
                        function(error: any) {
                            errorConfig.errorObj = error;
                            getBrowserWindow().globalStores.appStore.handleServiceError(
                                errorConfig as SiteError
                            );
                        },
                    ]);
                }
                // @ts-ignore
                const res = proxiedRequest(...args);
                restoreRequest();
            };
            return self;
        }

        handleErrorsLocally() {
            return this;
        }

        constructor(...args: any[]) {
            super(...args);
        }
    };
}

class Nada {}
