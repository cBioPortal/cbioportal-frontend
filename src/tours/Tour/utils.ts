export function checkForTour(localStorageId: string) {
    const currentStep = localStorage.getItem(localStorageId);
    if (currentStep) {
        localStorage.removeItem(localStorageId)
        return +currentStep;
    }
    return null;
}
