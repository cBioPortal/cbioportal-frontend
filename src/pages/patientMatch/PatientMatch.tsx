import * as React from 'react';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import { observer } from 'mobx-react';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import { observable, computed } from 'mobx';
import autobind from 'autobind-decorator';
import { fetchClinicalDataForPatient, fetchClinicalDataInStudy } from 'shared/lib/StoreUtils';
import { submitToStudyViewPage } from 'pages/resultsView/querySummary/QuerySummaryUtils';

type PatientMatchProps = {
    store: ResultsViewPageStore
}

function matchMuts(master: string[], compare: any): {matches: string[], raw: string } {
    var matches = master
        .map((mut: string) => {
            return compare.hasOwnProperty(mut) ? mut : "";
        });
    var raw = matches.reduce((matchstring, match) => {
        return matchstring + (match ? "1" : "0");
    }, "");
    matches = matches.filter((mut) => !!mut);

    return {
        matches,
        raw,
    }
        
}

function hammingDistance(a: string, b: string) { 
    let distance = 0;
  
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        distance += 1;
      }
    }
  
    return distance;
}

const LOTS_OF_ONES = "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"

@observer
export default class PatientMatch extends React.Component<PatientMatchProps, {}> {
    @observable
    private patientID: string = "";

    @observable sex: string = "";

    @observable patients: any[] = [];
    studies: import("/home/luke/code/cbioportal-frontend/src/shared/api/generated/CBioPortalAPI").CancerStudy[];
    samples: import("/home/luke/code/cbioportal-frontend/src/shared/api/generated/CBioPortalAPI").Sample[];

    @computed
    private get patient(): [string, any] | undefined {
        var patients = Array.from(this.props.store.mutations.result!
            .reduce((coll, next) => {
                var patientMuts = coll.get(next.patientId);
                patientMuts = patientMuts ? patientMuts : {};
                patientMuts[next.gene.hugoGeneSymbol] = true;
                coll.set(next.patientId, patientMuts);
                return coll;
            }, new Map<string, any>()));
        for (var i = 0; i < patients.length; i++) {
            if (patients[i][0] === this.patientID) {
                return patients[i];
            }
        }
        return undefined;
    };
    private async getAllPatientDetails() {
        console.log("getting clinical details for all patients");
        
        var patients = Array.from(this.props.store.mutations.result!
            .reduce((coll, next) => {
                var patientMuts = coll.get(next.patientId);
                patientMuts = patientMuts ? patientMuts : {};
                patientMuts[next.gene.hugoGeneSymbol] = true;
                coll.set(next.patientId, patientMuts);
                return coll;
            }, new Map<string, any>())).map((p) => p[0]);
        return (await fetchClinicalDataInStudy(
            "msk_impact_2017",
            {
                attributeIds: ["SEX"],
                ids: patients,
            }, "PATIENT")).reduce((m, p) => {return m.set(p.patientId, p.value)}, new Map<string, string>());
    }

    private async populatePatientDetails() {
        const details = await fetchClinicalDataForPatient("msk_impact_2017", this.patientID)
        details.forEach((detail) => {
            switch(detail.clinicalAttributeId) {
                case "SEX":
                    this.sex = detail.value;
            }
        })
    }

    async getSimilarPatients() {
        if (!this.props.store.mutations.isComplete || !this.patientID) {
            return [];
        }
        var patientDetails = await this.getAllPatientDetails();
        console.log("Details: ");
        console.log(patientDetails);
        var patients = Array.from(this.props.store.mutations.result!
            .reduce((coll, next) => {
                var patientMuts = coll.get(next.patientId);
                if (!patientMuts) {
                    patientMuts = {};
                    patientMuts[patientDetails.get(next.patientId) as string] = true;
                }
                patientMuts[next.gene.hugoGeneSymbol] = true;
                coll.set(next.patientId, patientMuts);
                return coll;
            }, new Map<string, any>()));

        if (!this.patient) {
            return [];
        }
        console.log("Starting matching");
        
        const matchingMuts = Object.keys(this.patient[1]);
        matchingMuts.push(this.sex);
        const masterMatch = LOTS_OF_ONES.substring(0, matchingMuts.length + 1);


        this.patients = patients
            .map(([patient, muts]) => {
                const match = matchMuts(matchingMuts, muts);
                return {
                    id: patient,
                    match: match.matches.join(", "),
                    distance: hammingDistance(masterMatch, match.raw), 
                }
            })
            .sort((first, second) => {
                return first.distance - second.distance;
            })
            .slice(1);
        console.log("Set patients");
        
    }

    renderPatients() {
        return this.patients.map((patient) => {
            return <div key={patient.id}>
                <b>Id: </b>
                <a href={`https://www.cbioportal.org/patient?studyId=msk_impact_2017&caseId=${patient.id}`}>{patient.id} </a>
                <b>Match: </b> {patient.match}
            </div>
        })
    }

    @autobind
    onTextChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.studies = this.props.store.queriedStudies.result;
        this.samples = this.props.store.samples.result;
        this.patientID = event.target.value;
        this.populatePatientDetails();
        this.getSimilarPatients();
    }

    @autobind
    viewStudy(): void {
        if (!this.props.store.queriedStudies.isComplete || !this.props.store.samples.isComplete) {
            console.log("no");
            
            return;
        }
        const top100 = this.patients.slice(0, 100).map((p) => p.id);
        const samples = this.props.store.samples.result.filter((sample) => {
            return top100.indexOf(sample.patientId) >= 0;
        });
        submitToStudyViewPage(
            this.props.store.queriedStudies.result,
            samples,
            false
        ) 
    }

    render() {
        if (!this.props.store.mutations.isComplete) {
            return <div>
                Howdy
            </div>
        }
        return <div>
            <h3>Patient Comparison</h3>
            <div>
                <div>
                    <b>Patient ID: </b>
                    <input
                        value={this.patientID}
                        type="text"
                        onChange={this.onTextChange}
                        placeholder="Patient ID"
                    />
                </div>
                <div>
                    <b>Genes with muts: </b>{this.patient ? Object.keys(this.patient[1]).join(", ") : ""}
                </div>
                <div>
                    <div>
                        <b>Demographic details: </b>
                    </div>
                    <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;<b>Sex: </b> {this.sex}
                    </div>
                </div>
            </div>
            <div>
                <button onClick={this.viewStudy}>View Top 100 Matches in Study View</button>
            </div>
            <div>
                <b>Similar Patients</b>
                <ul>
                    {this.renderPatients()}
                </ul>
            </div>
        </div>
    }
}