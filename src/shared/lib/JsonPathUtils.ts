export function hasJsonPathPlaceholders(message: String) {
    if (message.match(/[{][$][^}]*[}]/g) === null) return false;
    return true;
}

export function replaceJsonPathPlaceholders(
    message: String,
    studyMetadata: any
) {
    let placeholders = message.match(/[{][$][^}]*[}]/g);
    let placeholdersReplaced: boolean = true;
    if (placeholders !== null) {
        let jp = require('jsonpath');
        placeholders.forEach(placeholder => {
            let placeholderReplaceValue = jp.query(
                studyMetadata,
                placeholder.replace(/["'{}]/g, '')
            );
            if (placeholderReplaceValue.length === 0)
                placeholdersReplaced = false;
            else
                message = message.replace(placeholder, placeholderReplaceValue);
        });
    }
    return message;
}
