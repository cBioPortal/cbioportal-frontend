import * as React from 'react';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import { observer } from 'mobx-react';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import { observable } from 'mobx';
import autobind from 'autobind-decorator';

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
    private genes: string = "";

    getSimilarPatients() {
        const matchingMuts = this.genes.split(" ");
        const masterMatch = LOTS_OF_ONES.substring(0, matchingMuts.length);
        if (!this.props.store.mutations.isComplete) {
            return [];
        }

        return Array.from(this.props.store.mutations.result!
            .reduce((coll, next) => {
                var patientMuts = coll.get(next.patientId);
                patientMuts = patientMuts ? patientMuts : {};
                patientMuts[next.gene.hugoGeneSymbol] = true;
                coll.set(next.patientId, patientMuts);
                return coll;
            }, new Map<string, any>()))
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
            });
    }

    renderPatients(patients: {id: string, match: string, distance: number}[]) {
        return patients.map((patient) => {
            return <div key={patient.id}>
                <b>Id: </b> {patient.id} <b>Match: </b> {patient.match}
            </div>
        })
    }

    @autobind
    onTextChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        this.genes = event.target.value;
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
                <textarea
                    value={this.genes}
                    onChange={this.onTextChange}
                    placeholder="Enter genes here."
                    style={{height: "100px", width: "400px"}}/>
            </div>
            <ul>
                {this.renderPatients(this.getSimilarPatients())}
            </ul>
        </div>
    }
}