import { RecruitingStatus } from '../enums/ClinicalTrialsGovRecruitingStatus';

export function getQuery(
    locations: string[],
    recrutingStatus: RecruitingStatus[],
    nec_search_symbols: string[]
) {
    var resultQuery: string = '';

    //TODO: Export list
    //resultQuery += "AND (cancer OR leukemia OR neoplasm OR carcinoma OR tumor)"

    for (let i = 0; i < nec_search_symbols.length; i++) {
        resultQuery += ' AND ';
        resultQuery += nec_search_symbols[i];
    }

    if (locations && locations.length > 0) {
        resultQuery += ' AND SEARCH[Location](AREA[LocationCountry](';
        resultQuery += locations[0];

        if (locations.length > 1) {
            for (let i = 1; i < locations.length; i++) {
                resultQuery += ' OR ' + locations[i];
            }
        }

        resultQuery += ')';

        if (recrutingStatus && recrutingStatus.length > 0) {
            resultQuery += 'AND (AREA[LocationStatus]COVERAGE[FullMatch](';
            resultQuery += recrutingStatus[0] + ')';

            if (recrutingStatus.length > 1) {
                for (let i = 1; i < recrutingStatus.length; i++) {
                    resultQuery +=
                        ' OR AREA[LocationStatus]COVERAGE[FullMatch](';
                    resultQuery += recrutingStatus[i] + ')';
                }
            }
            resultQuery += ')';
        }
        resultQuery += ')';
    } else {
        if (recrutingStatus && recrutingStatus.length > 0) {
            resultQuery += ' AND (AREA[OverallStatus]COVERAGE[FullMatch](';
            resultQuery += recrutingStatus[0];
            resultQuery += ')';

            if (recrutingStatus.length > 1) {
                for (let i = 1; i < recrutingStatus.length; i++) {
                    resultQuery +=
                        ' OR (AREA[OverallStatus]COVERAGE[FullMatch](';
                    resultQuery += recrutingStatus[i];
                    resultQuery += '))';
                }
            }

            resultQuery += ')';
        }
    }

    return resultQuery;
}

export function getTumorTypeQuery(
    opt_search_symbols: string[],
    nec_search_symbols: string[],
    tumor_types: string[],
    locations: string[],
    recrutingStatus: RecruitingStatus[]
): string {
    var result = '';
    var tumor_type_string = '';
    var keywords = opt_search_symbols.concat(nec_search_symbols);

    if (tumor_types.length > 0) {
        tumor_type_string += '(';
        tumor_type_string += tumor_types[0];
    }

    if (tumor_types.length > 1) {
        for (var i = 1; i < tumor_types.length; i++) {
            tumor_type_string += ' OR ';
            tumor_type_string += tumor_types[i];
        }
    }

    tumor_type_string += ')';

    if (keywords.length > 0) {
        result += '(';
        result += keywords[0];
        result += ' AND ';
        result += tumor_type_string;
        result += ')';
    }

    if (keywords.length > 1) {
        for (var i = 1; i < keywords.length; i++) {
            result += ' OR ';
            result += '(';
            result += keywords[i];
            result += ' AND ';
            result += tumor_type_string;
            result += ')';
        }
    }

    if (locations && locations.length > 0) {
        result += ' AND SEARCH[Location](AREA[LocationCountry](';
        result += locations[0];

        if (locations.length > 1) {
            for (let i = 1; i < locations.length; i++) {
                result += ' OR ' + locations[i];
            }
        }

        result += ')';

        if (recrutingStatus && recrutingStatus.length > 0) {
            result += 'AND (AREA[LocationStatus]COVERAGE[FullMatch](';
            result += recrutingStatus[0] + ')';

            if (recrutingStatus.length > 1) {
                for (let i = 1; i < recrutingStatus.length; i++) {
                    result += ' OR AREA[LocationStatus]COVERAGE[FullMatch](';
                    result += recrutingStatus[i] + ')';
                }
            }
            result += ')';
        }
        result += ')';
    } else {
        if (recrutingStatus && recrutingStatus.length > 0) {
            result += ' AND (AREA[OverallStatus]COVERAGE[FullMatch](';
            result += recrutingStatus[0];
            result += ')';

            if (recrutingStatus.length > 1) {
                for (let i = 1; i < recrutingStatus.length; i++) {
                    result += ' OR (AREA[OverallStatus]COVERAGE[FullMatch](';
                    result += recrutingStatus[i];
                    result += '))';
                }
            }

            result += ')';
        }
    }
    return result;
}
