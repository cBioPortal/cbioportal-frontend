import * as request from "superagent";

export interface PortalAnalyticsResponse {
    totalUses: number;
    totalUniqueUses: number;
    timesVisited: number;
    timesUniqueVisited: number;
}

export interface IQueryResponse extends request.Response {
    body: PortalAnalyticsResponse;
}

export default async function queryStudyAnalytics(
    studyIds: string[],
    apiURL: string
): Promise<PortalAnalyticsResponse> {
    const res: IQueryResponse = await request.get(`${apiURL}?studyName=${studyIds[0]}`);
    return res.body;
}
