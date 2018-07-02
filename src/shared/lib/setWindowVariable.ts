export default function setWindowVariable(propName:string, value:any) {
    // utility function to throw error if window variable is set twice, safer than doing (window as any).asjd which may
    //  accidentally overwrite something
    if (typeof (window as any)[propName] === typeof undefined) {
        (window as any)[propName] = value;
    } else {
        throw new Error(`Attempted to set existing window variable '${propName}'.. SHAME ON YOU`);
    }
}