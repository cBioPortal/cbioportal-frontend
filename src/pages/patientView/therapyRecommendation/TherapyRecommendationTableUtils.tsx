import {
    ITherapyRecommendation,
    EvidenceLevel,
    IReference,
    EvidenceLevelExtension,
} from 'shared/model/TherapyRecommendation';
import _ from 'lodash';
import request from 'superagent';
import * as React from 'react';
import styles from './style/therapyRecommendation.module.scss';
import { If, Then, Else } from 'react-if';
import { getServerConfig } from 'config/config';

export function truncate(
    s: string | undefined,
    n: number,
    useWordBoundary: boolean
) {
    if (!s) return '';
    if (s.length <= n) {
        return s;
    }
    var subString = s.substr(0, n - 1);
    return (
        (useWordBoundary
            ? subString.substr(0, subString.lastIndexOf(' '))
            : subString) + ' [...]'
    );
}

export function getNewTherapyRecommendation(
    patientId: string
): ITherapyRecommendation {
    let now = new Date();
    let timeString = now.toISOString();
    let timeId = now.getTime();
    let therapyRecommendation: ITherapyRecommendation = {
        id: patientId + '_' + timeId,
        comment: [],
        reasoning: {},
        evidenceLevel: EvidenceLevel.NA,
        evidenceLevelExtension: EvidenceLevelExtension.NA,
        evidenceLevelM3Text: '',
        author: getAuthor(),
        references: [],
        treatments: [],
    };
    return therapyRecommendation;
}

export function getSampleTherapyRecommendation(
    patientId: string
): ITherapyRecommendation {
    let sample = getNewTherapyRecommendation(patientId);
    sample.comment = ['Created: ' + new Date().toISOString()];
    return sample;
}

export function setAuthorInTherapyRecommendation(
    therapyRecommendation: ITherapyRecommendation
): ITherapyRecommendation {
    therapyRecommendation.author = getAuthor();
    return therapyRecommendation;
}

export function getAuthor(): string {
    return getServerConfig().user_email_address;
}

export function isTherapyRecommendationEmpty(
    therapyRecommendation: ITherapyRecommendation
): boolean {
    if (
        therapyRecommendation.comment === [] &&
        therapyRecommendation.comment.every(s => s === '') &&
        therapyRecommendation.evidenceLevel === EvidenceLevel.NA &&
        _.isEmpty(therapyRecommendation.reasoning) &&
        therapyRecommendation.treatments.length === 0 &&
        therapyRecommendation.references.length === 0
    ) {
        return true;
    } else {
        return false;
    }
}

export function getReferenceName(reference: IReference): Promise<string> {
    console.log(reference.name);
    return new Promise<string>((resolve, reject) => {
        if (reference.name && reference.name.length !== 0) {
            return name;
        } else {
            const pmid = reference.pmid;
            // TODO better to separate this call to a configurable client
            request
                .get(
                    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' +
                        pmid +
                        '&retmode=json'
                )
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const result = response.result;
                        const uid = result.uids[0];
                        console.log(result[uid].title);
                        resolve(result[uid].title);
                    } else {
                        resolve('');
                    }
                });
        }
    });
}

export function getReferenceNameForId(pmid: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // TODO better to separate this call to a configurable client
        request
            .get(
                'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' +
                    pmid +
                    '&retmode=json'
            )
            .end((err, res) => {
                if (!err && res.ok) {
                    const response = JSON.parse(res.text);
                    const result = response.result;
                    const uid = result.uids[0];
                    console.log(result[uid].title);
                    resolve(result[uid].title);
                } else {
                    resolve('');
                }
            });
    });
}

export function flattenStringify(x: Array<any>): string {
    let y: any = {};
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
    return JSON.stringify(y);
}

export function flattenArray(x: Array<any>): string {
    let y: any = {};
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

export function flattenObject(x: any): any {
    let y: any = {};
    for (var i in x) {
        if (!x.hasOwnProperty(i)) {
            x[i] = x[i];
        }
        y[i] = x[i];
    }
    return y;
}

export function getTooltipAuthorContent(entryType: string, author: string) {
    return (
        <div className={styles.tooltip} style={{ width: '300px' }}>
            <If condition={author === 'anonymousUser'}>
                <Then>
                    {entryType} was authored by an anonymous user. Identifying
                    authors is only available in portals which require login.
                </Then>
                <Else>
                    {entryType} was authored by <b>{author}</b>.
                </Else>
            </If>
        </div>
    );
}

export function getTooltipEvidenceContent(evidenceLevel: any) {
    return (
        <div className={styles.tooltip} style={{ width: '300px' }}>
            {getEvidenceLevelDesc()[evidenceLevel]}
        </div>
    );
}

export function getEvidenceLevelDesc() {
    const levelMap: { [level: string]: JSX.Element } = {
        NA: <span>N/A</span>,
        m1A: (
            <span>
                In der <b>gleichen Tumorentit&auml;t </b>wurde der
                pr&auml;diktive Wert des Biomarkers oder die klinische
                Wirksamkeit in einer <b>Biomarker-stratifizierten Kohorte </b>
                einer ad&auml;quat gepowerten <b>
                    prospektiven Studie{' '}
                </b>oder <b>Metaanalyse </b>gezeigt.
            </span>
        ),
        m1B: (
            <span>
                In der <b>gleichen Tumorentit&auml;t </b>wurde der
                pr&auml;diktive Wert des Biomarkers oder die klinische
                Wirksamkeit in einer <b>retrospektiven Kohorte </b>oder{' '}
                <b>Fall-KontrollStudie </b>gezeigt.
            </span>
        ),
        m1C: (
            <span>
                Ein oder mehrere <b>Fallberichte</b> in der{' '}
                <b>gleichen Tumorentit&auml;t</b>.
            </span>
        ),
        m2A: (
            <span>
                In einer <b>anderen Tumorentit&auml;t </b>wurde der
                pr&auml;diktive Wert des Biomarkers oder die klinische
                Wirksamkeit in einer <b>Biomarker-stratifizierten Kohorte </b>
                einer ad&auml;quat gepowerten <b>
                    prospektiven Studie{' '}
                </b>oder <b>Metaanalyse </b>gezeigt.
            </span>
        ),
        m2B: (
            <span>
                In einer <b>anderen Tumorentit&auml;t </b>wurde der
                pr&auml;diktive Wert des Biomarkers oder die Klinische
                Wirksamkeit in einer <b>retrospektiven Kohorte </b>oder{' '}
                <b>Fall-KontrollStudie </b>gezeigt.
            </span>
        ),
        m2C: (
            <span>
                Unabh&auml;ngig von der Tumorentit&auml;t wurde beim Vorliegen
                des Biomarkers eine <b>klinische Wirksamkeit </b>in einem oder
                mehreren <b>Fallberichten </b>gezeigt.
            </span>
        ),
        m3: (
            <span>
                <b>Pr&auml;klinische Daten </b>(<em>in-vitro</em>-/
                <em>in-vivo</em>-Modelle, funktionelle Untersuchungen) zeigen
                eine Assoziation des Biomarkers mit der Wirksamkeit der
                Medikation, welche durch eine wissenschaftliche Rationale
                gest&uuml;tzt wird.
            </span>
        ),
        m4: (
            <span>
                Eine <b>wissenschaftliche, biologische Rationale </b>legt eine
                Assoziation des Biomarkers mit der Wirksamkeit der Medikation
                nahe, welche bisher{' '}
                <b>nicht durch (pr&auml;)klinische Daten </b>gest&uuml;tzt wird.
            </span>
        ),
        is: (
            <span>
                <i>In situ</i>-Daten aus Untersuchungen an Patientenmaterial
                (z.B. IHC, FISH) unterstützen den Evidenzgrad. Die
                unterstützende Methode kann in Klammern zusätzlich angegeben
                werden, z.B. Evidenzgrad 3 is (IHC).
            </span>
        ),
        iv: (
            <span>
                <i>In vitro</i>-Daten/ <i>in vivo</i>-Modelle (z.B. PDX-Modelle)
                derselben Tumorentität unterstützen den Evidenzgrad. Die
                unterstützende Methode kann in Klammern angegeben werden, z.B.
                Evidenzgrad 2 iv (PDX).
            </span>
        ),
        'Z(FDA)': (
            <span>
                Zusatzhinweis für Zulassungsstatus: FDA-Zulassung liegt vor.
            </span>
        ),
        'Z(EMA)': (
            <span>
                Zusatzhinweis für Zulassungsstatus: EMA-Zulassung liegt vor.
            </span>
        ),
        R: (
            <span>
                Verweis, dass es sich hierbei um einen Resistenzmarker für eine
                bestimmte Therapie handelt.
            </span>
        ),
    };
    return levelMap;
}
