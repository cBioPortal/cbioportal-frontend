import { IDrug, ITrial } from '../../model/ClinicalTrial';
import * as _ from 'lodash';

const activeTrialStatus = ['active', 'recruiting', 'not yet recruiting'];

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export function matchTrials(trialsData: ITrial[], treatment: string) {
    const trials: ITrial[] = [];
    let drugNames: string[] = [];
    if (treatment.includes('+') || treatment.includes(',')) {
        drugNames = _.uniq(
            _.flatten(
                _.values(
                    treatment
                        .split(/\s?[,]\s?/)
                        .map((drugs: string) => drugs.split(/\s?[+]\s?/))
                )
            )
        );
    } else {
        drugNames.push(treatment);
    }
    trialsData.forEach((trial: ITrial) => {
        const trialDrugNames = trial.drugs.map((drug: IDrug) => drug.drugName);
        if (_.difference(drugNames, trialDrugNames).length === 0) {
            trials.push(trial);
        }
    });
    return trials;
}

export function getTrialStatusColor(content: string) {
    content = content.toLowerCase();
    if (activeTrialStatus.includes(content)) {
        return { color: 'green' };
    } else if (content.includes('close')) {
        return { color: 'red' };
    }
    return {};
}

export function isActiveTrial(status: string) {
    return activeTrialStatus.includes(status.toLowerCase());
}
