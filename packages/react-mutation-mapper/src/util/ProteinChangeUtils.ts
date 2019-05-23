
// this is to sort alphabetically
// in case the protein position values are the same
function extractNonNumerical(matched:RegExpMatchArray):number[]
{
    const nonNumerical:RegExp = /[^0-9]+/g;
    const buffer:RegExpMatchArray|null = matched[0].match(nonNumerical);
    const value:number[] = [];

    if (buffer && buffer.length > 0)
    {
        const str:string = buffer.join("");

        // since we are returning a float value
        // assigning numerical value for each character.
        // we have at most 2 characters, so this should be safe...
        for (let i:number=0; i<str.length; i++)
        {
            value.push(str.charCodeAt(i));
        }
    }

    return value;
}

/**
 * Extracts the sort value for the protein change value.
 * The return value is based on the protein change location.
 *
 * @param proteinChange
 * @returns {number} sort value
 */
export function calcProteinChangeSortValue(proteinChange:string):number|null
{
    // let matched = proteinChange.match(/.*[A-Z]([0-9]+)[^0-9]+/);
    const alleleAndPosition:RegExp = /[A-Za-z][0-9]+./g;
    const position:RegExp = /[0-9]+/g;

    // first priority is to match values like V600E , V600, E747G, E747, X37_, X37, etc.
    let matched:RegExpMatchArray|null = proteinChange.match(alleleAndPosition);
    let buffer:number[] = [];

    // if no match, then search for numerical (position) match only
    if (!matched || matched.length === 0)
    {
        matched = proteinChange.match(position);
    }
    // if match, then extract the first numerical value for sorting purposes
    else
    {
        // this is to sort alphabetically
        buffer = extractNonNumerical(matched);
        matched = matched[0].match(position);
    }

    // if match, then use the first integer value as sorting data
    if (matched && matched.length > 0)
    {
        let toParse:string =  matched[0];

        // this is to sort alphabetically
        if (buffer && buffer.length > 0)
        {
            // add the alphabetical information as the decimal part...
            // (not the best way to ensure alphabetical sorting,
            // but in this method we are only allowed to return a numerical value)
            toParse += "." + buffer.join("");
        }

        return parseFloat(toParse);
    }
    else
    {
        // no match at all: do not sort
        return null;
    }
}
