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