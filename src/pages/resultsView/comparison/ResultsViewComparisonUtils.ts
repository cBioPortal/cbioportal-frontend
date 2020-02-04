import { ComparisonGroup } from '../../groupComparison/GroupComparisonUtils';

export type ResultsViewComparisonGroup = ComparisonGroup & {
    nameOfEnrichmentDirection: string;
    count: number;
};
