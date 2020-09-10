import { SiteError } from 'AppStore';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { Simulate } from 'react-dom/test-utils';
import error = Simulate.error;
import autobind from 'autobind-decorator';
import request from 'superagent';

type Constructor<T> = new (...args: any[]) => T;

export function extendCBioPortalAPI<T extends Constructor<{}>>(Base: T) {
    return class extends Base {
        defaultError: (error: any) => Partial<SiteError>;

        handleErrorsGlobally(errorConfig: Partial<SiteError> = {}) {
            const self = this;

            // global error handling is default
            // only do this if they pass special configuration
            if (errorConfig) {
                // @ts-ignore (it's private, but we CAN access it)
                const proxiedRequest = this.request;
                // @ts-ignore (it's private, but we CAN access it)
                const origErrorHandlers = this.errorHandlers;

                function restoreRequest() {
                    // @ts-ignore (it's private, but we CAN access it)
                    self.request = proxiedRequest;
                    // @ts-ignore
                    self.errorHandlers = origErrorHandlers;
                }

                // @ts-ignore (it's private, but we CAN access it)
                self.request = function() {
                    const args = Array.from(arguments);
                    if (args.length >= 9) {
                        args[8] = [
                            function(error: any) {
                                //errorConfig.errorObj = error;
                                getBrowserWindow().globalStores.appStore.handleServiceError(
                                    errorConfig as SiteError
                                );
                            },
                        ];
                    }
                    // @ts-ignore
                    proxiedRequest(...args);
                    restoreRequest();
                };
            }

            return self;
        }

        handleErrorsLocally() {
            var self = this;

            // @ts-ignore
            const proxiedRequest = this.request;
            // @ts-ignore (it's private, but we CAN access it)
            const origErrorHandlers = this.errorHandlers;

            function restoreRequest() {
                // @ts-ignore (it's private, but we CAN access it)
                self.request = proxiedRequest;
                // @ts-ignore
                self.errorHandlers = origErrorHandlers;
            }

            // @ts-ignore (it's private, but we CAN access it)
            self.request = function() {
                const args = Array.from(arguments);
                // @ts-ignore

                self.errorHandlers = []; // get rid of global error handlers

                if (args.length >= 9) {
                    args[8] = [
                        function(error: any) {
                            console.log(
                                'error suppressed by handleErrorsLocally',
                                error
                            );
                        },
                    ];
                }

                // @ts-ignore
                proxiedRequest(...args);
                restoreRequest();
            };
            return self;
        }

        _errorHandler = function(
            error: request.Response,
            errorConfig: SiteError
        ) {
            if (!errorConfig) {
                errorConfig = this.defaultError ? this.defaultError(error) : {};
            }
            errorConfig.errorObj = error;
            getBrowserWindow().globalStores.appStore.handleServiceError(
                errorConfig as SiteError
            );
        };

        constructor(...args: any[]) {
            super(...args);
            // @ts-ignore
            this.errorHandlers.push(this._errorHandler.bind(this));
        }
    };
}
