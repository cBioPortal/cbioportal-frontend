import * as React from "react";
import LazyLoadedTableCell from "shared/lib/LazyLoadedTableCell";
import {Mutation} from "../../../api/generated/CBioPortalAPI";
import MutationTable, {IMutationTableProps} from "../MutationTable";
import CancerTypeCache from "../../../cache/CancerTypeCache";
import {CacheData} from "../../../lib/LazyMobXCache";

export default class CancerTypeColumnFormatter {
    public static makeRenderFunction<P extends IMutationTableProps>(table:MutationTable<P>) {
        return LazyLoadedTableCell<Mutation[], {value:string}>(
            (d:Mutation[])=>{
                const cancerTypeCache:CancerTypeCache|undefined = table.props.cancerTypeCache;
                const studyId:string|undefined = table.props.studyId;
                if (cancerTypeCache && studyId) {
                    let cacheDatum:CacheData<{value:string}>|null = cancerTypeCache.get({
                        entityId:d[0].sampleId,
                        studyId: studyId
                    });
                    if (cacheDatum && cacheDatum.status === "complete" && cacheDatum.data === null) {
                        // If no clinical data, use study cancer type if we have it
                        const studyCancerTypeMap:{[studyId:string]:string} | undefined = table.props.studyToCancerType;
                        if (studyCancerTypeMap) {
                            const cancerType = studyCancerTypeMap[studyId];
                            if (cancerType) {
                                cacheDatum = {
                                    status: "complete",
                                    data: {
                                        value: cancerType
                                    }
                                };
                            }
                        }
                    }
                    return cacheDatum;
                } else {
                    return {
                        status: "error",
                        data: null
                    };
                }
            },
            (t:{value:string})=>(<span>{t.value}</span>),
            "Cancer type not available for this sample."
        );
    }

    public static sortBy(d:Mutation[], studyId?:string, cancerTypeCache?:CancerTypeCache) {
        let ret;
        if (cancerTypeCache && studyId) {
            const cacheDatum = cancerTypeCache.get({
                entityId:d[0].sampleId,
                studyId: studyId
            });
            if (cacheDatum && cacheDatum.data) {
                ret = cacheDatum.data.value;
            } else {
                ret = null;
            }
        } else {
            ret = null;
        }
        return ret;
    }
}