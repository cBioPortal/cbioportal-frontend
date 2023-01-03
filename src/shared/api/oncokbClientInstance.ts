import { OncoKbAPI } from 'oncokb-ts-api-client';
import eventBus from 'shared/events/eventBus';
import { ErrorMessages } from 'shared/errorMessages';
import { SiteError } from 'shared/model/appMisc';

const client = new OncoKbAPI();

client.addErrorHandler(err => {
    const siteError = new SiteError(
        new Error(ErrorMessages.ONCOKB_LOAD_ERROR),
        'alert'
    );

    siteError.meta = {
        stacktrace: err?.response?.text,
    };

    eventBus.emit('error', null, siteError);
});

export default client;
