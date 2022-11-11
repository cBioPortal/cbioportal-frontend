import { OncoKbAPI } from 'oncokb-ts-api-client';
import eventBus from 'shared/events/eventBus';
import { ErrorMessages } from 'shared/errorMessages';
import { SiteError } from '../../AppStore';

const client = new OncoKbAPI();

client.addErrorHandler(err => {
    eventBus.emit(
        'error',
        null,
        new SiteError(new Error(ErrorMessages.ONCOKB_LOAD_ERROR), 'alert')
    );
});

export default client;
