import * as React from "react";
import LazyLoadedTableCell from "shared/lib/LazyLoadedTableCell";
import {Mutation, MutationCount} from "../../../api/generated/CBioPortalAPI";
import MutationCountCache from "../../../cache/MutationCountCache";
import MutationTable, {IMutationTableProps} from "../MutationTable";
import generalStyles from "./styles.module.scss";

export default class MutationCountColumnFormatter {
    public static makeRenderFunction<P extends IMutationTableProps>(table:MutationTable<P>) {
        return LazyLoadedTableCell(
            (d:Mutation[])=>{
                const mutationCountCache:MutationCountCache|undefined = table.props.mutationCountCache;
                const geneticProfileIdToStudyId:{[geneticProfileId:string]:string}|undefined = table.props.geneticProfileIdToStudyId;
                if (mutationCountCache && geneticProfileIdToStudyId) {
                    return mutationCountCache.get({sampleId: d[0].sampleId, studyId: geneticProfileIdToStudyId[d[0].geneticProfileId]});
                } else {
                    return {
                        status: "error",
                        data: null
                    };
                }
            },
            (t:MutationCount)=>(<div className={generalStyles["integer-data"]}>{t.mutationCount}</div>),
            "Mutation count not available for this sample."
        );
    }

    public static sortBy(d:Mutation[], mutationCountCache?:MutationCountCache, geneticProfileIdToStudyId?:{[geneticProfileId:string]:string}) {
        let ret;
        if (mutationCountCache && geneticProfileIdToStudyId) {
            const cacheDatum = mutationCountCache.get({sampleId: d[0].sampleId, studyId: geneticProfileIdToStudyId[d[0].geneticProfileId]});
            if (cacheDatum && cacheDatum.data) {
                ret = cacheDatum.data.mutationCount;
            } else {
                ret = null;
            }
        } else {
            ret = null;
        }
        return ret;
    }
}