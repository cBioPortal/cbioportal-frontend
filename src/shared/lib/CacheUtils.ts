export function collectByStudy<T extends {studyId:string}, S>(queries:T[], transform:(query:T)=>S):{[studyId:string]:S[]} {
    const studyToQueries:{[studyId:string]:S[]} = {};
    for (const q of queries) {
        studyToQueries[q.studyId] = studyToQueries[q.studyId] || [];
        studyToQueries[q.studyId].push(transform(q));
    }
    return studyToQueries;
}

export function getStudyToSamples(queries:{studyId:string, sampleId:string}[]):{[studyId:string]:string[]} {
    return collectByStudy(queries, query=>query.sampleId);
}