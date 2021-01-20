import {SiteError} from "AppStore";

export function formatError(errors: SiteError[]) {
    return errors.map((err) => {
        try {
            if (err.errorObj.response) {
                return JSON.stringify(err.errorObj.response);
            } else if (err.errorObj.message) {
                return err.errorObj.message;
            } else {
                return err.errorObj.toString();
            }
        } catch (exc) {
            return "No error message available";
        }
    }).join('\n\n\n');
}
