

export function getFocusOutText(genes: string[]): string {
    let focusOutText = '';
    if (genes.length > 0) {
        focusOutText = genes[0];
        for (let i = 1; i < genes.length; i++) {
            if (focusOutText.length > 13 || (focusOutText.length+genes[i].length) > 13) {
                focusOutText += " and " + (genes.length - i) + " more";
                break;
            }
            focusOutText += " " + genes[i];
        }
    }
    return focusOutText;
}