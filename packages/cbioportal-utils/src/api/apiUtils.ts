import _ from 'lodash';
export async function chunkCalls<ParamData, ResponseData>(
    callback: (chunk: ParamData[]) => Promise<ResponseData[]>,
    paramData: ParamData[],
    chunkSize: number
): Promise<ResponseData[]> {
    const chunks = _.chunk(paramData, chunkSize);
    const proms = chunks.map(callback);
    return _.flatten(await Promise.all(proms));
}
