import { observable, action, computed, makeObservable } from 'mobx';

const signatureData = require('../../../../signature_data/signature_data.json');

const sampleIds: string[] = Object.keys(signatureData.samples);

class SignatureSampleStore {
    @observable sampleIndex = 0;

    constructor() {
        makeObservable(this);
    }

    @computed get sampleId(): string {
        return sampleIds[this.sampleIndex];
    }

    @computed get sample(): any {
        return signatureData.samples[this.sampleId];
    }

    @computed get totalSamples(): number {
        return sampleIds.length;
    }

    @action next() {
        if (this.sampleIndex < sampleIds.length - 1) {
            this.sampleIndex++;
        }
    }

    @action prev() {
        if (this.sampleIndex > 0) {
            this.sampleIndex--;
        }
    }
}

export const signatureSampleStore = new SignatureSampleStore();
