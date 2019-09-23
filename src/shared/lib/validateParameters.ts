import { validate, ParameterValidationError } from 'parameter-validator';
import * as _ from 'lodash';
import {EnsureStringValued} from "./TypeScriptUtils";

export interface URLValidationResult {
    isValid:Boolean;
    message:string | null
}

export function validateParametersPatientView<T extends EnsureStringValued<T>>(params: T ): URLValidationResult {
    return validateParameters(params, ['studyId', ['sampleId', 'caseId']]);
}

export default function validateParameters<T extends EnsureStringValued<T>>(params: T, rules:(string | string[])[]): URLValidationResult {

    // we want to interpret empty string as missing
    let cleanedParams = _.reduce(params,(memo: T, paramVal, paramKey)=>{
        if (paramVal && paramVal.length > 0) {
            memo[paramKey as keyof T] = paramVal;
        }
        return memo;
    },{});

    try {
         validate(cleanedParams, rules);
         return { isValid:true, message:null }
    } catch (error) {
        return { isValid:false, message: error.message }
    }
}
