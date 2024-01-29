import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Table } from 'react-bootstrap';
import { IBzkfAnnotationProps } from './BzkfAnnotation';
import { ISharedTherapyRecommendationData } from 'cbioportal-utils/src/model/TherapyRecommendation';

interface therapyRecMatches {
    matchingAlterationLocal: number;
    matchingAlterationShared: number;
    matchingDiagnosisLocal: number;
    matchingDiagnosisShared: number;
    matchingAltAndDiagLocal: number;
    matchingAltAndDiagShared: number;
}

export default class BzkfAnnotationOverview extends React.Component<
    IBzkfAnnotationProps,
    {}
> {
    constructor(props: IBzkfAnnotationProps) {
        super(props);
    }

    getAltDiagMatches = (sharedTRData: ISharedTherapyRecommendationData) => {
        let filteredLocalTR = sharedTRData.localTherapyRecommendations.filter(
            tr =>
                tr.caseId != sharedTRData.caseId ||
                tr.studyId != sharedTRData.studyId
        );

        let filteredSharedTR = sharedTRData.sharedTherapyRecommendations;

        let matchingAlterationLocal = 0;
        let matchingAlterationShared = 0;
        let matchingDiagnosisLocal = 0;
        let matchingDiagnosisShared = 0;
        let matchingAltAndDiagLocal = 0;
        let matchingAltAndDiagShared = 0;

        if (sharedTRData) {
            let diagnosis = sharedTRData.diagnosis
                ? sharedTRData.diagnosis
                : [];

            if (filteredLocalTR.length > 0) {
                matchingDiagnosisLocal = filteredLocalTR.filter(tr =>
                    diagnosis.some(d => tr.diagnosis?.includes(d))
                ).length;

                matchingAlterationLocal = filteredLocalTR.filter(tr =>
                    tr.reasoning.geneticAlterations?.some(
                        alt =>
                            alt.hugoSymbol == this.props.hugoGeneSymbol &&
                            alt.alteration == sharedTRData.proteinChange
                    )
                ).length;

                matchingAltAndDiagLocal = filteredLocalTR.filter(
                    tr =>
                        tr.reasoning.geneticAlterations?.some(
                            alt =>
                                alt.hugoSymbol == this.props.hugoGeneSymbol &&
                                alt.alteration == sharedTRData.proteinChange
                        ) &&
                        !(
                            diagnosis.find(d =>
                                tr.diagnosis?.some(trd => trd == d)
                            ) === undefined
                        )
                ).length;
            }

            if (sharedTRData.sharedTherapyRecommendations.length > 0) {
                matchingDiagnosisShared = filteredSharedTR.filter(tr =>
                    diagnosis.some(d => tr.diagnosis?.includes(d))
                ).length;

                matchingAlterationShared = filteredSharedTR.filter(tr =>
                    tr.reasoning.geneticAlterations?.some(
                        alt =>
                            alt.hugoSymbol == this.props.hugoGeneSymbol &&
                            alt.alteration == sharedTRData.proteinChange
                    )
                ).length;

                matchingAltAndDiagShared = filteredSharedTR.filter(
                    tr =>
                        tr.reasoning.geneticAlterations?.some(
                            alt =>
                                alt.hugoSymbol == this.props.hugoGeneSymbol &&
                                alt.alteration == sharedTRData.proteinChange
                        ) &&
                        !(
                            diagnosis.find(d =>
                                tr.diagnosis?.some(trd => trd == d)
                            ) === undefined
                        )
                ).length;
            }
        }

        return {
            matchingAlterationLocal:
                matchingAlterationLocal - matchingAltAndDiagLocal,
            matchingAlterationShared:
                matchingAlterationShared - matchingAltAndDiagShared,
            matchingDiagnosisLocal:
                matchingDiagnosisLocal - matchingAltAndDiagLocal,
            matchingDiagnosisShared:
                matchingDiagnosisShared - matchingAltAndDiagShared,
            matchingAltAndDiagLocal: matchingAltAndDiagLocal,
            matchingAltAndDiagShared: matchingAltAndDiagShared,
        } as therapyRecMatches;
    };

    public render() {
        let oncoKbContent: JSX.Element;
        let matches = this.getAltDiagMatches(
            this.props.sharedTherapyRecommendationData ||
                ({} as ISharedTherapyRecommendationData)
        );
        return (
            <div
                className="col s12 civic-card-gene"
                key={'BzkfAnnotationLocalTRTable'}
            >
                <div>
                    {
                        'This annotation contains therapy recommendations from similar patients that share one or more alterations of the patient in focus.'
                    }
                    <br></br>
                    {'Currently focused alteration: '}
                    <b>
                        {this.props.hugoGeneSymbol +
                            ' ' +
                            this.props.sharedTherapyRecommendationData
                                ?.proteinChange}
                    </b>
                    <br></br>
                    <br></br>
                    {
                        "The 'Local' tab contains information on therapy recommendations that have been previously documented at your hospital."
                    }
                    <br></br>
                    {
                        'The table below contains a summary on the amount and distribution of the available therapy recommendations.'
                    }
                </div>
                <div>{}</div>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th></th>
                            <th>matching alteration and diagnosis</th>
                            <th>matching alteration only</th>
                            <th>matching diagnosis only</th>
                        </tr>
                    </thead>
                    <tbody style={{ textAlign: 'right' }}>
                        <tr>
                            <td>
                                <DefaultTooltip
                                    destroyTooltipOnHide={true}
                                    trigger={['hover', 'focus']}
                                    overlay={
                                        <b>
                                            historic therapy recommendations
                                            from your hospitals own data-storage
                                        </b>
                                    }
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        Local
                                    </div>
                                </DefaultTooltip>
                            </td>
                            <td>{matches?.matchingAltAndDiagLocal}</td>
                            <td>{matches?.matchingAlterationLocal}</td>
                            <td>{matches?.matchingDiagnosisLocal}</td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    }
}
