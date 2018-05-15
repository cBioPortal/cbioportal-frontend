export function longestCommonStartingSubstring(str1:string, str2:string) {
    // from https://github.com/cBioPortal/mutation-mapper/blob/master/src/js/util/cbio-util.js
    let i = 0;

    while (i < str1.length && i < str2.length)
    {
        if (str1[i] === str2[i])
        {
            i++;
        }
        else
        {
            break;
        }
    }

    return str1.substring(0, i);
}

export function stringListToSet(alos:ReadonlyArray<string>):{[s:string]:boolean} {
    return alos.reduce((map:{[s:string]:boolean}, next:string)=>{
        map[next] = true;
        return map;
    }, {});
}

export function stringListToIndexSet(alos:ReadonlyArray<string>):{[s:string]:number} {
    return alos.reduce((map:{[s:string]:number}, next:string, index:number)=>{
        map[next] = index;
        return map;
    }, {});
}

/**
 * Unquote a string wrapped with single or double quotes.
 *
 * @param {string} str  input string wrapped with single or double quotes
 */
export function unquote(str: string): string
{
    return str.replace(/(^")|(^')|("$)|('$)/g, '');
}

/**
 * Replaces escaped tab ("\\t") and new line ("\\n") substrings with actual tab ("\t") and new line ("\n") characters.
 *
 * @param {string} str  input string with "\\t" and "\\n" substrings
 */
export function unescapeTabDelimited(str: string): string
{
    return str.replace(/\\t/g, "\t").replace(/\\n/g, "\n");
}