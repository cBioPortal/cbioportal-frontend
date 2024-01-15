import { DiscreteCopyNumberData, Mutation } from 'cbioportal-ts-api-client';
import {
    IMtb,
    IDeletions,
    ITherapyRecommendation,
    IFollowUp,
} from 'shared/model/TherapyRecommendation';
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

export async function fetchFollowupUsingGET(url: string) {
    console.log('### FOLLOWUP ### Calling GET: ' + url);
    return request
        .get(url)
        .timeout(120000)
        .then(res => {
            if (res.ok) {
                console.group('### FOLLOWUP ### Success GETting ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
                const response = JSON.parse(res.text);
                return response.followUps.map(
                    (followup: any) =>
                        ({
                            id: followup.id,
                            therapyRecommendation:
                                followup.therapyRecommendation,
                            date: followup.date,
                            author: followup.author,
                            therapyRecommendationRealized:
                                followup.therapyRecommendationRealized,
                            sideEffect: followup.sideEffect,
                            response: followup.response,
                            comment: followup.comment,
                        } as IFollowUp)
                );
            } else {
                console.group(
                    '### FOLLOWUP ### ERROR res not ok GETting ' + url
                );
                console.log(JSON.parse(res.text));
                console.groupEnd();

                return [] as IFollowUp[];
            }
        })
        .catch(err => {
            console.group('### FOLLOWUP ### ERROR catched GETting ' + url);
            console.log(err);
            console.groupEnd();

            return [] as IFollowUp[];
        });
}

export async function fetchMtbsUsingGET(
    url: string,
    studyId: string,
    orderId: string
) {
    url = url + '?studyId=' + studyId;
    console.log('### MTB ### Calling GET: ' + url);
    return request
        .get(url)
        .timeout(120000)
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
                            orderId:
                                mtb.mtbState == 'FINAL' ? mtb.orderId : orderId,
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

export async function updateFollowupUsingPUT(
    id: string,
    url: string,
    followups: IFollowUp[]
) {
    console.log('### FOLLOWUP ### Calling PUT: ' + url);
    console.log(
        JSON.stringify({
            id: id,
            mtbs: [],
            followUps: flattenArray(followups),
        })
    );
    return request
        .put(url)
        .timeout(120000)
        .set('Content-Type', 'application/json')
        .send(
            JSON.stringify({
                id: id,
                mtbs: [],
                followUps: flattenArray(followups),
            })
        )
        .then(res => {
            if (res.ok) {
                console.group('### FOLLOWUP ### Success PUTting ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
                return true;
            } else {
                console.group(
                    '### FOLLOWUP ### ERROR res not ok PUTting ' + url
                );
                console.log(JSON.parse(res.text));
                console.groupEnd();
                return false;
            }
        })
        .catch(err => {
            console.group('### FOLLOWUP ### ERROR catched PUTting ' + url);
            console.log(err);
            console.groupEnd();
            return false;
        });
}

export async function fetchTherapyRecommendationsByAlterationsUsingPOST(
    url: string,
    alterations: (Mutation | DiscreteCopyNumberData)[]
) {
    console.log('### Recycling MTBs ### Calling GET: ' + url);
    return request
        .post(url)
        .send(alterations)
        .then(res => {
            if (res.ok) {
                const response = JSON.parse(res.text);
                var TRs = response as ITherapyRecommendation[];
                TRs.forEach(tr => {
                    var diag = tr.reasoning.clinicalData?.filter((cd: any) => {
                        return (
                            cd.attributeName == 'Diagnosis' ||
                            cd.attributeName == 'Cancer Type' ||
                            cd.attributeId == 'CANCER_TYPE' ||
                            cd.attributeId == 'CANCER_TYPE_DETAILED' ||
                            cd.attributeId == 'ONCO_TREE_CODE'
                        );
                    });
                    tr.diagnosis = diag?.map(
                        (diagnosisDatum: any) => diagnosisDatum.value
                    );
                });
                console.group('### Recycling MTBs ### Success GETting ' + url);
                console.log(TRs);
                console.groupEnd();
                return TRs as ITherapyRecommendation[];
            } else {
                console.group(
                    '### Recycling MTBs ### ERROR res not ok GETting ' + url
                );
                console.log(JSON.parse(res.text));
                console.groupEnd();

                return [] as ITherapyRecommendation[];
            }
        })
        .catch(err => {
            console.group(
                '### Recycling MTBs ### ERROR catched GETting ' + url
            );
            console.log(err);
            console.groupEnd();

            return [] as ITherapyRecommendation[];
        });
}

export async function fetchFollowUpsByAlterationsUsingPOST(
    url: string,
    alterations: (Mutation | DiscreteCopyNumberData)[]
) {
    console.log('### Recycling FollowUps ### Calling POST: ' + url);
    return request
        .post(url)
        .send(alterations)
        .then(res => {
            if (res.ok) {
                console.group(
                    '### Recycling FollowUps ### Success POSTing ' + url
                );
                console.log(JSON.parse(res.text));
                console.groupEnd();
                const response = JSON.parse(res.text);
                return response as IFollowUp[];
            } else {
                console.group(
                    '### Recycling FollowUps ### ERROR res not ok POSTing ' +
                        url
                );
                console.log(JSON.parse(res.text));
                console.groupEnd();

                return [] as IFollowUp[];
            }
        })
        .catch(err => {
            console.group(
                '### Recycling FollowUps ### ERROR catched POSTing ' + url
            );
            console.log(err);
            console.groupEnd();

            return [] as IFollowUp[];
        });
}

export async function updateMtbUsingPUT(
    id: string,
    studyId: string,
    url: string,
    mtbs: IMtb[]
) {
    mtbs.forEach(mtb => {
        mtb.therapyRecommendations = flattenArray(mtb.therapyRecommendations);
        mtb.therapyRecommendations.forEach(tr => (tr.studyId = studyId));
    });
    url = url + '?studyId=' + studyId;
    console.log('### MTB ### Calling PUT: ' + url);
    return request
        .put(url)
        .timeout(120000)
        .set('Content-Type', 'application/json')
        .send(
            JSON.stringify({
                id: id,
                mtbs: flattenArray(mtbs),
                followUps: [],
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

export async function deleteFollowupUsingDELETE(
    id: string,
    url: string,
    deletions: IDeletions
) {
    console.log('### FOLLOWUP ### Calling DELETE: ' + url);
    return request
        .delete(url)
        .timeout(120000)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(deletions))
        .then(res => {
            if (res.ok) {
                deletions.mtb = [];
                deletions.therapyRecommendation = [];
                console.group('### FOLLOWUP ### Success DELETEing ' + url);
                console.log(JSON.parse(res.text));
                console.groupEnd();
            } else {
                console.group(
                    '### FOLLOWUP ### ERROR res not ok DELETEing ' + url
                );
                console.log(JSON.parse(res.text));
                console.groupEnd();
            }
        })
        .catch(err => {
            console.group('### FOLLOWUP ### ERROR catched DELETEing ' + url);
            console.log(err);
            console.groupEnd();
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
        .timeout(60000)
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
                let usingLocalhost = url.includes('localhost');
                console.group(
                    '### MTB ### ERROR checkPermissionUsingGET ' + url
                );
                console.log(err);
                if (usingLocalhost)
                    console.log(
                        'The application is running in localhost, therefore editing is enabled.'
                    );
                console.groupEnd();
                let boolArray: boolean[] = [false, usingLocalhost];
                return boolArray;
            }
        });
}
