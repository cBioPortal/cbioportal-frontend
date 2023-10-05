import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { IMutationalSignatureRow } from 'pages/patientView/clinicalInformation/ClinicalInformationMutationalSignatureTable';
import { action, computed, makeObservable, observable } from 'mobx';
import { DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import PatientViewUrlWrapper from 'pages/patientView/PatientViewUrlWrapper';
import _ from 'lodash';
import { IMutationalSignature } from 'shared/model/MutationalSignature';

function mutSigMatch(d: IMutationalSignature[], id: IMutationalSignature) {
    return d[0].meta.name === id.meta.name;
}

function mutSigIdKey(c: IMutationalSignature) {
    return `{ "name": "${c.meta.name}" }`;
}

type mutSigIdKey = string;
export class MutationalSignatureTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    IMutationalSignature[]
> {
    private selectedMutSigMap = observable.map<string, IMutationalSignature>();

    @action
    public toggleSelectedMutSig(c: Readonly<IMutationalSignature>) {
        const key = mutSigIdKey(c);
        if (this.selectedMutSigMap.has(key)) {
            this.selectedMutSigMap.delete(key);
        } else {
            this.selectedMutSigMap.set(key, c);
        }
    }
    @computed public get selectedMutSig(): Readonly<IMutationalSignature[]> {
        return Array.from(this.selectedMutSigMap.values());
    }
    @action
    public setSelectedMutSig(mutSig: Readonly<IMutationalSignature[]>) {
        this.selectedMutSigMap.clear();
        let count = 0;
        for (const c of mutSig) {
            this.toggleSelectedMutSig(c);
            count += 1;
        }
    }

    public isMutSigSelected(c: IMutationalSignature) {
        return this.selectedMutSigMap.has(mutSigIdKey(c));
    }
    constructor(getData: () => IMutationalSignature[][]) {
        super(getData);
        makeObservable(this);

        this.dataHighlighter = (mergedMutSig: IMutationalSignature[]) => {
            const highlightedMutSig = [];
            highlightedMutSig.push(...this.selectedMutSig);
            return _.some(highlightedMutSig, mutSig =>
                mutSigMatch(mergedMutSig, mutSig)
            );
        };
    }
}
