import {SimpleGetterLazyMobXTableApplicationDataStore} from "../../../shared/lib/ILazyMobXTableApplicationDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {observable} from "mobx";

type HighlightModel = {
    proteinChange:string;
    hugoGeneSymbol:string;
};

export default class PatientViewMutationsDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<Mutation[]> {
    @observable.ref private highlightModel:Readonly<HighlightModel>|null = null;

    public getHighlightModel() {
        return this.highlightModel;
    }

    constructor(getData:()=>Mutation[][]) {
        super(getData);

        this.dataHighlighter = (d:Mutation[])=>{
            if (!this.highlightModel || !d.length) {
                return false;
            } else {
                return d[0].proteinChange === this.highlightModel.proteinChange &&
                    d[0].gene.hugoGeneSymbol === this.highlightModel.hugoGeneSymbol;
            }
        }
    }

    public setHighlightModel(m:Readonly<HighlightModel>|null) {
        this.highlightModel = m;
    }
}