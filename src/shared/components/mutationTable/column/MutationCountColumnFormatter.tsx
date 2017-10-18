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
                if (mutationCountCache) {
                    return mutationCountCache.get({sampleId:d[0].sampleId, molecularProfileId:d[0].molecularProfileId});
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

    public static sortBy(d:Mutation[], mutationCountCache?:MutationCountCache) {
        let ret;
        if (mutationCountCache) {
            const cacheDatum = mutationCountCache.get({sampleId:d[0].sampleId, molecularProfileId:d[0].molecularProfileId});
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