import getBrowserWindow from "../../public-lib/lib/getBrowserWindow";

// this is the only way to solve issue in SPA where content doesn't exist when URL changes
// thus anchors corresponding to url hash may not be in DOM to scroll to

function getElement(id:string) {
    const eltById = document.getElementById(id);
    if (eltById) {
        return eltById;
    }

    const eltsByName = document.getElementsByName(id);
    if (eltsByName.length > 0) {
        return eltsByName.item(0);
    }

    return null;
}

export function seekUrlHash(id:string){
    let counter = 0;
    let limit = 50;
    let pollInterval = 100;
    let interval = setInterval(()=>{
        if (getElement(id)) {
            clearInterval(interval);
            // this is a bit of a hack to get browser to
            // scroll to element as it would if this problem
            // didn't exist
            getBrowserWindow().location.hash = "";
            getBrowserWindow().location.hash = id;
        }
        // bail if we reach reasonable limit
        if (counter >= limit) {
            clearInterval(interval);
        } else {
            counter++;
        }
    }, pollInterval);
}
