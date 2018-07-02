/*
 * takes legacy style (hashRouter e.g. #/patient?patientId=x&navCaseIds=1,2,3,4) and
 * rewrites it has a html5 history url (regular path and qstring params)
 * BUT navCaseIds still need to be in # fragment to avoid url length limit
 */
export function correctPatientUrl(url:string){

    let correctedUrl = url.replace(/#/,"");

    correctedUrl = correctedUrl.replace(/\/case\.do/,"");

    // once corrected, check to make sure that navCaseIds is appended as a hash fragment
    const navCaseIds = correctedUrl.match(/&*navCaseIds=[^&]*/);
    if (navCaseIds) {
        correctedUrl = correctedUrl.replace(navCaseIds[0],"") + "#" + navCaseIds;
    }

    return correctedUrl

}