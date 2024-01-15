import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    IFollowUp,
    ITherapyRecommendation,
} from './modelCopy/TherapyRecommendation';
import * as React from 'react';
import oncoTreeTumorTypes from './modelCopy/OncoTreeTumorTypes';

const tumorTypes = oncoTreeTumorTypes;

export function getResponseDiv(
    fuArray: IFollowUp[],
    ltr: ITherapyRecommendation
) {
    let respArray = ['3 months: NA', '6 months: NA', '12 months: NA'];
    let empty = {
        sd3: false,
        pr3: false,
        cr3: false,
        pd6: false,
        sd6: false,
        pr6: false,
        cr6: false,
        pd12: false,
        sd12: false,
        pr12: false,
        cr12: false,
        pd3: false,
    };
    let response =
        fuArray.find(fu => fu.therapyRecommendation.id == ltr.id)?.response ||
        empty;

    if (response.pd3 == true) {
        respArray[0] = '3 months: pd';
    }
    if (response.sd3 == true) {
        respArray[0] = '3 months: sd';
    }
    if (response.pr3 == true) {
        respArray[0] = '3 months: pr';
    }
    if (response.cr3 == true) {
        respArray[0] = '3 months: cr';
    }

    if (response.pd6 == true) {
        respArray[1] = '6 months: pd';
    }
    if (response.sd6 == true) {
        respArray[1] = '6 months: sd';
    }
    if (response.pr6 == true) {
        respArray[1] = '6 months: pr';
    }
    if (response.cr6 == true) {
        respArray[1] = '6 months: cr';
    }

    if (response.pd12 == true) {
        respArray[2] = '12 months: pd';
    }
    if (response.sd12 == true) {
        respArray[2] = '12 months: sd';
    }
    if (response.pr12 == true) {
        respArray[2] = '12 months: pr';
    }
    if (response.cr12 == true) {
        respArray[2] = '12 months: cr';
    }
    return (
        <div>
            <div>{respArray[0]}</div>
            <div>{respArray[1]}</div>
            <div>{respArray[2]}</div>
        </div>
    );
}

function getFollowUpComment(
    fuArray: IFollowUp[],
    therapyRec: ITherapyRecommendation
) {
    return fuArray.find(fu => fu.therapyRecommendation.id == therapyRec.id)
        ?.comment;
}

export function generateTableEntries(
    trArray: ITherapyRecommendation[],
    fuArray: IFollowUp[],
    hugoGeneSymbol: string,
    proteinChange: string,
    diagnosis: string[],
    sharedTR: boolean
) {
    return trArray.map(ltr => {
        let alt = ltr.reasoning.geneticAlterations
            ? ltr.reasoning.geneticAlterations.map(ga => {
                  return { hs: ga.hugoSymbol, at: ga.alteration };
              })
            : [{ hs: 'NA', at: 'NA' }];
        let containsAlt = alt.some(
            el => el.hs == hugoGeneSymbol && el.at == proteinChange
        );
        let containsDiag = diagnosis.some(d => ltr.diagnosis?.includes(d));
        let trt = ltr.treatments.map(treat => treat.name);
        let respDiv = getResponseDiv(fuArray, ltr);

        return (
            <tr>
                <td>
                    {alt.map(el => el.hs + ' ' + el.at + ' ')}
                    {containsAlt == false && (
                        <DefaultTooltip
                            destroyTooltipOnHide={true}
                            trigger={['hover', 'focus']}
                            overlay={<b>WARNING: alteration not matching</b>}
                        >
                            <i className="fa fa-exclamation-triangle text-danger" />
                        </DefaultTooltip>
                    )}
                </td>
                <td>
                    {ltr.diagnosis + ' '}
                    {containsDiag == false && (
                        <DefaultTooltip
                            destroyTooltipOnHide={true}
                            trigger={['hover', 'focus']}
                            overlay={<b>WARNING: cancer-type not matching</b>}
                        >
                            <i className="fa fa-exclamation-triangle text-danger" />
                        </DefaultTooltip>
                    )}
                </td>
                <td>{trt}</td>
                <td>{ltr.evidenceLevel.toString()}</td>
                <td>
                    {
                        <DefaultTooltip
                            destroyTooltipOnHide={true}
                            trigger={['hover', 'focus']}
                            overlay={getFollowUpComment(fuArray, ltr)}
                            disabled={
                                !!!getFollowUpComment(fuArray, ltr) ||
                                getFollowUpComment(fuArray, ltr) == ''
                            }
                        >
                            {respDiv}
                        </DefaultTooltip>
                    }
                </td>
                <td>
                    {ltr.reasoning.clinicalData
                        ?.filter(
                            cd =>
                                !(cd.attributeId == 'DIAGNOSIS') &&
                                !(cd.attributeId == 'Diagnosis') &&
                                !(cd.attributeId == 'ONCOTREE_CODE') &&
                                !(cd.attributeId == 'CANCER_TYPE') &&
                                !(cd.attributeId == 'CANCER_TYPE_DETAILED') &&
                                !(cd.attributeName == 'Cancer Type')
                        )
                        .map(cd => `${cd.attributeName}: ${cd.value}`)
                        .join('\n')}
                </td>
                <td>{ltr.comment}</td>
                <td>
                    {sharedTR ? (
                        ltr.author
                    ) : (
                        <RouterLink studyId={ltr.studyId} caseId={ltr.caseId}>
                            {ltr.studyId + ' : ' + ltr.caseId}
                        </RouterLink>
                    )}
                </td>
            </tr>
        );
    });
}

export function sortFunc(
    trArray: ITherapyRecommendation[],
    hugoGeneSymbol: string,
    proteinChange: string,
    diagnosis: string[]
) {
    return trArray.sort(
        (tr1, tr2) =>
            -3 *
                (Number(
                    tr1.reasoning.geneticAlterations?.some(
                        alt =>
                            alt.hugoSymbol == hugoGeneSymbol &&
                            alt.alteration == proteinChange
                    )
                ) -
                    Number(
                        tr2.reasoning.geneticAlterations?.some(
                            alt =>
                                alt.hugoSymbol == hugoGeneSymbol &&
                                alt.alteration == proteinChange
                        )
                    )) +
            -2 *
                (Number(diagnosis.some(d => tr1.diagnosis?.includes(d))) -
                    Number(diagnosis.some(d => tr2.diagnosis?.includes(d)))) +
            -1 *
                (Number(
                    tumorTypes.some(
                        tt =>
                            tt.parent ==
                            tr1.diagnosis?.includes(tt.parent ? tt.parent : '')
                    )
                ) -
                    Number(
                        tumorTypes.some(
                            tt =>
                                tt.parent ==
                                tr2.diagnosis?.includes(
                                    tt.parent ? tt.parent : ''
                                )
                        )
                    ))
    );
}

export function filterFunc(tr: ITherapyRecommendation, searchInput: string) {
    searchInput = searchInput.toLowerCase();
    var result = false;

    var alt = tr.reasoning.geneticAlterations
        ? tr.reasoning.geneticAlterations.map(ga => {
              return { hs: ga.hugoSymbol, at: ga.alteration };
          })
        : [{ hs: 'NA', at: 'NA' }];

    if (
        tr.treatments?.findIndex(
            trt =>
                trt.name?.toLowerCase().includes(searchInput) ||
                trt.ncit_code?.toLowerCase().includes(searchInput)
        ) != -1
    ) {
        result = true;
    }
    if (tr.author?.toLowerCase().includes(searchInput)) {
        result = true;
    }
    if (
        tr.diagnosis
            ?.map(d => d.toLowerCase())
            .some(d => d.includes(searchInput))
    ) {
        result = true;
    }
    if (
        tr.evidenceLevel
            ?.toString()
            .toLowerCase()
            .includes(searchInput)
    ) {
        result = true;
    }
    if (
        tr.reasoning.geneticAlterations?.findIndex(
            ga =>
                ga.alteration?.toLowerCase().includes(searchInput) ||
                ga.hugoSymbol?.toLowerCase().includes(searchInput)
        ) != -1
    ) {
        result = true;
    }

    return result;
}

const RouterLink = ({
    children,
    studyId,
    caseId,
}: {
    children: string;
    studyId?: string;
    caseId?: string;
}) => {
    if (studyId && caseId) {
        return (
            <a href={`/patient?studyId=${studyId}&caseId=${caseId}`}>
                {children}
            </a>
        );
    } else {
        return <div>missing patient link</div>;
    }
};
