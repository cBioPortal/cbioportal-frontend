import Timer = NodeJS.Timer;
export function getDeterministicRandomNumber(seed:number, range?:[number, number]) {
    // source: https://stackoverflow.com/a/23304189
    seed = Math.sin(seed)*10000;
    let r = seed - Math.floor(seed); // between 0 and 1
    if (range) {
        r = r*(range[1] - range[0]) + range[0];
    }
    return r;
}

export function makeMouseEvents(self:{ tooltipModel: any, pointHovered: boolean}) {
    let disappearTimeout:Timer | null = null;
    const disappearDelayMs = 250;

    return [{
        target: "data",
        eventHandlers: {
            onMouseOver: () => {
                return [
                    {
                        target: "data",
                        mutation: (props: any) => {
                            self.tooltipModel = props;
                            self.pointHovered = true;

                            if (disappearTimeout !== null) {
                                clearTimeout(disappearTimeout);
                                disappearTimeout = null;
                            }

                            return { active: true };
                        }
                    }
                ];
            },
            onMouseOut: () => {
                return [
                    {
                        target: "data",
                        mutation: () => {
                            if (disappearTimeout !== null) {
                                clearTimeout(disappearTimeout);
                            }

                            disappearTimeout = setTimeout(()=>{
                                self.pointHovered = false;
                            }, disappearDelayMs);

                            return { active: false };
                        }
                    }
                ];
            }
        }
    }];
}
export function scatterPlotSize<D>(
    highlight?:(d:D)=>boolean,
    size?:(d:D, active:Boolean, isHighlighted?:boolean)=>number
) {
    // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
    if (size) {
        if (highlight) {
            return (d:D, active:boolean)=>size(d, active, highlight(d));
        } else {
            return size;
        }
    } else {
        return (d:D, active:boolean)=>{
            return (active || !!(highlight && highlight(d)) ? 6 : 3);
        };
    }
}