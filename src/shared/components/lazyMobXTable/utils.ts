import {SHOW_ALL_PAGE_SIZE} from "../paginationControls/PaginationControls";
export function maxPage(displayDataLength:number, itemsPerPage:number) {
    if (itemsPerPage === SHOW_ALL_PAGE_SIZE) {
        return 0;
    } else {
        return Math.floor(Math.max(displayDataLength-1,0) / itemsPerPage);
    }
}