import CBioPortalAPI, { CancerStudy }  from 'shared/api/generated/CBioPortalAPI';
import {getCbioPortalApiUrl} from "../../shared/api/urls";

const tsClient = new CBioPortalAPI(getCbioPortalApiUrl());

export default function getDatasetsInfo(): Promise<CancerStudy[]> {

    // Creating a promise
    let promise = new Promise(function (resolve, reject) {

        tsClient.getAllStudiesUsingGET({ projection:'DETAILED' }).then((data) => {
            resolve(data);
        });
    });

    return promise;
}
