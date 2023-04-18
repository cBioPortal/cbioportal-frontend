import MobxPromise from 'mobxpromise';
import { TablePaginationParams } from 'shared/components/lazyMobXTable/TablePaginationParams';

/**
 * Store containing all information related to a single table page
 * When one of the ${@link TablePaginationParams} properties change
 * a new page will be retrieved from the backend.
 */
export interface TablePaginationStore<T> extends TablePaginationParams {
    /**
     * Defines number of items on current page
     * without shifting page or increasing request page size
     *
     * Note: simply changing itemsPerPage would also
     * shift the first item (=pageNumber * itemsPerPage)
     */
    moreItemsPerPage: number | undefined;

    /**
     * Result
     */
    totalItems: number;
    isFirst: boolean;
    isLast: boolean;
    pageItems: MobxPromise<T[]>;
}
