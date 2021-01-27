import {
    DefaultTooltip,
    pluralize,
    TruncatedText,
} from 'cbioportal-frontend-commons';
import { getClinVarId } from 'cbioportal-utils';
import { ClinVar, MyVariantInfo } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import * as React from 'react';

export type ClinVarSummaryProps = {
    myVariantInfo?: MyVariantInfo;
};

export enum ClinVarOrigin {
    GERMLINE = 'germline',
    SOMATIC = 'somatic',
}

export type RcvData = {
    origin: string;
    evidences: {
        clinicalSignificance: string;
        count: number;
    }[];
};

export type RcvCountMap = {
    [origin: string]: { [clinicalSignificance: string]: number };
};

export function getRcvCountMap(clinVar: ClinVar): RcvCountMap {
    const filteredRcv = clinVar.rcv.filter(
        rcv =>
            rcv.origin === ClinVarOrigin.GERMLINE ||
            rcv.origin === ClinVarOrigin.SOMATIC
    );

    // first map by origin, then count evidence number for each origin group
    const rcvMap = _.groupBy(filteredRcv, d => d.origin);

    return _.mapValues(rcvMap, rcvs =>
        _.countBy(rcvs, rcv => rcv.clinicalSignificance)
    );
}

export function getRcvData(rcvCountMap: RcvCountMap): RcvData[] {
    return _.map(rcvCountMap, (clinicalSignificanceCountMap, origin) => ({
        origin,
        evidences: _.map(
            clinicalSignificanceCountMap,
            (count, clinicalSignificance) => ({ clinicalSignificance, count })
        ),
    }));
}

export function formatClinicalSignificanceText(rcvData: RcvData[]) {
    return _.uniq(
        _.flatten(
            rcvData.map(d => d.evidences.map(e => e.clinicalSignificance))
        )
    ).join(', ');
}

export const ClinVarRcvInterpretation = (props: {
    rcvData: RcvData[];
    className?: string;
}) => {
    return (
        <div className={props.className}>
            {props.rcvData.map(d => (
                <div key={d.origin}>
                    <strong>{`${_.upperFirst(d.origin)}: `}</strong>
                    {d.evidences
                        .map(
                            e =>
                                `${e.clinicalSignificance} (${
                                    e.count
                                } ${pluralize('evidence', e.count)})`
                        )
                        .join(', ')}
                </div>
            ))}
        </div>
    );
};

const NoClinVarData = () => {
    return (
        <DefaultTooltip
            placement="topLeft"
            overlay={<span>Variant has no ClinVar data.</span>}
        >
            <span
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'block',
                    overflow: 'hidden',
                }}
            >
                &nbsp;
            </span>
        </DefaultTooltip>
    );
};

const ClinVarSummary = (props: ClinVarSummaryProps) => {
    const clinVar = props.myVariantInfo
        ? props.myVariantInfo.clinVar
        : undefined;

    if (!clinVar) {
        return <NoClinVarData />;
    } else {
        const clinVarId = getClinVarId(props.myVariantInfo);
        const clinVarLink = `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinVarId}/`;
        const rcvData = getRcvData(getRcvCountMap(clinVar));

        return (
            <TruncatedText
                maxLength={30}
                text={
                    rcvData.length > 0
                        ? formatClinicalSignificanceText(rcvData)
                        : 'Unknown'
                }
                addTooltip="always"
                tooltip={
                    <div style={{ maxWidth: 300 }}>
                        <ClinVarRcvInterpretation rcvData={rcvData} />
                        <div>
                            (ClinVar ID:{' '}
                            <a href={clinVarLink} target="_blank">
                                {clinVarId}
                            </a>
                            )
                        </div>
                    </div>
                }
            />
        );
    }
};

export default ClinVarSummary;
