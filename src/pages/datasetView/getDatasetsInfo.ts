import * as _ from 'lodash';
import CBioPortalAPI, { CancerStudy }  from 'shared/api/generated/CBioPortalAPI';

const tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);

export default function getDatasetsInfo(): Promise<CancerStudy[]> {

    // Creating a promise
    let promise = new Promise(function (resolve, reject) {

        tsClient.getAllStudiesUsingGET({ projection:'DETAILED' }).then((data) => {
            resolve(data);
        });
    });

    return promise;
}
