import { SiteError } from '../types/types';
import { Simulate } from 'react-dom/test-utils';
import request from 'superagent';

type Constructor<T> = new (...args: any[]) => T;

export function addErrorHandlingtoAPIClient<T extends Constructor<{}>>(
    Base: T
) {
    return class extends Base {
        defaultError: (error: any) => Partial<SiteError>;

        handleErrorsGlobally(errorConfig: Partial<SiteError> = {}) {
            const self = this;

            // we will know override the client's request method
            // so that we can shim in our global error handler

            // global error handling is default
            // only do this if they pass special configuration
            if (errorConfig) {
                // @ts-ignore (it's private, but we CAN access it)
                const proxiedRequest = this.request;
                // @ts-ignore (it's private, but we CAN access it)
                const origErrorHandlers = this.errorHandlers;

                // @ts-ignore (it's private, but we CAN access it)
                self.request = function() {
                    const args = Array.from(arguments);
                    // eighth arg here is a error handling callback
                    // since developer is choosing to handle things globally
                    // it's safe to assume whatever might have been passed at invocation is
                    // dispensable
                    if (args.length >= 9) {
                        args[8] = [
                            function(error: any) {
                                //errorConfig.errorObj = error;
                                (window as any).globalStores.appStore.handleServiceError(
                                    errorConfig as SiteError
                                );
                            },
                        ];
                    }
                    // @ts-ignore
                    proxiedRequest(...args);

                    // @ts-ignore (it's private, but we CAN access it)
                    self.request = proxiedRequest;
                    // @ts-ignore
                    self.errorHandlers = origErrorHandlers;
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

                // @ts-ignore (it's private, but we CAN access it)
                self.request = proxiedRequest;
                // @ts-ignore
                self.errorHandlers = origErrorHandlers;
            };
            return self;
        }

        _errorHandler = function(
            error: request.Response,
            errorConfig: SiteError
        ) {
            if (!errorConfig) {
                // @ts-ignore
                errorConfig = this.defaultError ? this.defaultError(error) : {};
            }
            errorConfig.errorObj = error;
            (window as any).globalStores.appStore.handleServiceError(
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
