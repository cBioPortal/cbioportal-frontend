const jp = require('jsonpath');

export function hasJsonPathPlaceholders(message: string) {
    if (message.match(/[{][$][^}]*[}]/g) === null) return false;
    return true;
}

export function replaceJsonPathPlaceholders(
    message: string,
    studyMetadata: any,
    studyId: string
) {
    let placeholders = message.match(/[{][$][^}]*[}]/g);
    let placeholdersReplaced: boolean = true;
    if (placeholders !== null) {
        placeholders.forEach(placeholder => {
            let placeholderReplaceValue = '';
            if (placeholder === '{$.studyId}') {
                placeholderReplaceValue = studyId;
            } else {
                placeholderReplaceValue = jp.query(
                    studyMetadata,
                    placeholder.replace(/["'{}]/g, '')
                );
            }
            if (placeholderReplaceValue.length === 0) {
                placeholdersReplaced = false;
            } else {
                message = message.replace(placeholder, placeholderReplaceValue);
            }
        });
    }
    return message;
}
