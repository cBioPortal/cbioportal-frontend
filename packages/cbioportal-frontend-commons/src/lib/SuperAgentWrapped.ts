import { Request } from 'superagent';
import request from 'superagent';
import getBrowserWindow from './getBrowserWindow';

type SiteError = any;

/*
 * This wrapped superagent class is to be used for all custom http (requests not made via a ts client)
 * It extends the global/local error handling paradigm to these custom calls
 * errorConfig allows dev to control how the error will be displayed (e.g. dialog or screen)
 * and to set custom titles and messages
 */

class SuperAgentClient {
    handleErrorsGlobally(errorConfig: Partial<SiteError> = {}) {
        const agent = request.agent();
        agent.on('error', err => {
            errorConfig.errorObj = err;
            getBrowserWindow().globalStores.appStore.handleServiceError(
                errorConfig as SiteError
            );
        });

        return agent;
    }

    handleErrorsLocally() {
        return request;
    }
}

const client = new SuperAgentClient();

export default client;
