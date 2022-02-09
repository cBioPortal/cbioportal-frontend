import { IMtb, IDeletions } from 'shared/model/TherapyRecommendation';
import * as request from 'superagent';

export function flattenArray(x: Array<any>): Array<any> {
    let y: any[] = [];
    x.forEach(function(elem, index) {
        let elemY: any = {};
        for (var i in elem) {
            if (!elem.hasOwnProperty(i)) {
                elem[i] = elem[i];
            }
            elemY[i] = elem[i];
        }
        y[index] = elemY;
    });
    return y;
}

export async function fetchMtbsUsingGET(url: string, studyId: string) {
    url = url + '?studyId=' + studyId;
    console.log('### MTB ### Calling GET: ' + url);
    return request
        .get(url)
        .then(res => {
            if (res.ok) {
                console.group('### MTB ### Success GETting ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
                const response = JSON.parse(res.text);
                return response.mtbs.map(
                    (mtb: any) =>
                        ({
                            id: mtb.id,
                            therapyRecommendations: mtb.therapyRecommendations,
                            geneticCounselingRecommendation:
                                mtb.geneticCounselingRecommendation,
                            rebiopsyRecommendation: mtb.rebiopsyRecommendation,
                            generalRecommendation: mtb.generalRecommendation,
                            date: mtb.date,
                            mtbState: mtb.mtbState,
                            samples: mtb.samples,
                            author: mtb.author,
                        } as IMtb)
                );
            } else {
                console.group('### MTB ### ERROR res not ok GETting ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();

                return [] as IMtb[];
            }
        })
        .catch(err => {
            console.group('### MTB ### ERROR catched GETting ' + url);
            console.log(err);
            console.groupEnd();

            return [] as IMtb[];
        });
}

export async function updateMtbUsingPUT(
    id: string,
    studyId: string,
    url: string,
    mtbs: IMtb[]
) {
    mtbs.forEach(
        mtb =>
            (mtb.therapyRecommendations = flattenArray(
                mtb.therapyRecommendations
            ))
    );
    url = url + '?studyId=' + studyId;
    console.log('### MTB ### Calling PUT: ' + url);
    return request
        .put(url)
        .set('Content-Type', 'application/json')
        .send(
            JSON.stringify({
                id: id,
                mtbs: flattenArray(mtbs),
            })
        )
        .then(res => {
            if (res.ok) {
                console.group('### MTB ### Success PUTting ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
                return true;
            } else {
                console.group('### MTB ### ERROR res not ok PUTting ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
                // window.alert('Saving data failed with http status (' + res.status + ').');
                return false;
            }
        })
        .catch(err => {
            console.group('### MTB ### ERROR catched PUTting ' + url);
            console.log(err);
            console.groupEnd();
            // window.alert('Saving data failed - error output in console.');
            return false;
        });
}

export async function deleteMtbUsingDELETE(
    id: string,
    studyId: string,
    url: string,
    deletions: IDeletions
) {
    url = url + '?studyId=' + studyId;
    console.log('### MTB ### Calling DELETE: ' + url);
    return request
        .delete(url)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(deletions))
        .then(res => {
            if (res.ok) {
                deletions.mtb = [];
                deletions.therapyRecommendation = [];
                console.group('### MTB ### Success DELETEing ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
            } else {
                console.group('### MTB ### ERROR res not ok DELETEing ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
            }
        })
        .catch(err => {
            console.group('### MTB ### ERROR catched DELETEing ' + url);
            console.log(err);
            console.groupEnd();
        });
}

export async function checkPermissionUsingGET(url: string, studyId: string) {
    console.log('### MTB ### checkPermissionUsingGET - Calling GET: ' + url);
    let studyParam = 'studyId=' + studyId;
    let seqParam = 'seq=' + new Date().getTime();
    let realUrl = url + '?' + studyParam + '&' + seqParam;

    // returns boolean array[]
    // boolArray[0] is used for whether user is logged in
    // boolArray[1] is used for whether user has permission for study/patient
    return request
        .get(realUrl)
        .then(res => {
            if (res.status === 202) {
                console.log(
                    'checkPermissionUsingGET - returning true (' +
                        res.status +
                        ')'
                );
                let boolArray: boolean[] = [true, true];
                return boolArray;
            } else {
                if (res.status === 403) {
                    console.log(
                        'checkPermissionUsingGET - returning false (expected 202, found ' +
                            res.status +
                            ')'
                    );
                    let boolArray: boolean[] = [true, false];
                    return boolArray;
                } else {
                    console.log(
                        'checkPermissionUsingGET - returning false (expected 202, found ' +
                            res.status +
                            ')'
                    );
                    let boolArray: boolean[] = [false, false];
                    return boolArray;
                }
            }
        })
        .catch(err => {
            if (err.status === 403) {
                console.log(
                    'checkPermissionUsingGET - returning false (expected 202, found ' +
                        err.status +
                        ')'
                );
                let boolArray: boolean[] = [true, false];
                return boolArray;
            } else {
                console.group(
                    '### MTB ### ERROR checkPermissionUsingGET ' + url
                );
                console.log(err);
                console.groupEnd();
                let boolArray: boolean[] = [false, false];
                return boolArray;
            }
        });
}
