import {SimpleGetterLazyMobXTableApplicationDataStore} from "../../../shared/lib/ILazyMobXTableApplicationDataStore";
import {CoExpressionWithQ} from "./CoExpressionTabUtils";
import {autorun, IReactionDisposer, observable} from "mobx";

export enum TableMode {
    SHOW_ALL, SHOW_POSITIVE, SHOW_NEGATIVE
}

export class CoExpressionDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<CoExpressionWithQ> {
    @observable public tableMode:TableMode;

    private reactionDisposer:IReactionDisposer;

    constructor(
        getData:()=>CoExpressionWithQ[],
        getHighlighted:()=>CoExpressionWithQ|undefined,
        public setHighlighted:(c:CoExpressionWithQ)=>void
    ) {
        super(getData);
        this.tableMode = TableMode.SHOW_ALL;
        this.dataHighlighter = (d:CoExpressionWithQ) =>{
            const highlighted = getHighlighted();
            return !!(highlighted && (d.entrezGeneId === highlighted.entrezGeneId));
        };
        this.dataSelector = (d:CoExpressionWithQ) =>{
            let selected;
            switch (this.tableMode) {
                case TableMode.SHOW_POSITIVE:
                    selected = (d.spearmansCorrelation >= 0);
                    break;
                case TableMode.SHOW_NEGATIVE:
                    selected = (d.spearmansCorrelation <= 0);
                    break;
                default:
                    selected = true;
                    break;
            }
            return selected;
        };

        this.reactionDisposer = autorun(()=>{
            if (
                this.sortMetric &&
                this.sortedFilteredData.length > 0 &&
                !getHighlighted()
            ) {
                this.setHighlighted(this.sortedFilteredData[0]);
            }
        });
    }

    public destroy() {
        this.reactionDisposer();
    }
}
