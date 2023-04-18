export type PageDirection = 'ASC' | 'DESC';

export interface TablePaginationParams {
    direction: PageDirection;
    pageNumber: number;
    pageSize: number;
    sortParam?: string;
    searchTerm?: string;
}
