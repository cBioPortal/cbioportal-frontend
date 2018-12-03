import Timer = NodeJS.Timer;

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function sleepUntil(condition:()=>boolean, timeoutMs:number=10000, intervalMs:number=100) {
    let msElapsed = 0;
    return new Promise((resolve, reject)=>{
        let timeInterval:Timer;
        let conditionMet = false;
        let timeOut = false;
        timeInterval = setInterval(()=>{
            // keep track of time passed
            msElapsed += intervalMs;
            // check condition
            conditionMet = condition();
            // check timeout
            timeOut = (msElapsed >= timeoutMs);

            if (conditionMet || timeOut) {
                clearInterval(timeInterval);
                if (timeOut && !conditionMet) {
                    reject(`Condition not met by timeout ${timeoutMs}`);
                } else {
                    resolve();
                }
            }
        }, intervalMs);
    });
}
