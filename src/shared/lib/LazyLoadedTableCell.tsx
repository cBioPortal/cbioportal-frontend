import * as React from "react";
import {CacheData} from "./LazyMobXCache";
import {TableCellStatus, default as TableCellStatusIndicator} from "../components/TableCellStatus";
export default function LazyLoadedTableCell<D,T>(
    getCacheData:(d:D)=>CacheData<T>|null,
    render:(t:T)=>JSX.Element,
    naAlt?:string
):(d:D)=>JSX.Element {
    return (d:D)=>{
        const cacheData:CacheData<T>|null = getCacheData(d);
        if (cacheData === null) {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.LOADING}
                />
            );
        } else if (cacheData.status === "error") {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.ERROR}
                />
            );
        } else if (cacheData.data === null) {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.NA}
                    naAlt={naAlt}
                />
            );
        } else {
            return render(cacheData.data);
        }
    };
}