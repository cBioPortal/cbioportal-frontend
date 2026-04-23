import * as React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

export default function(
    name: string,
    Comp: React.ComponentClass<any> | React.FunctionComponent<any>,
    props: any = {}
) {
    const win = window as any;

    if (win) {
        win[name] = (
            mountNode: HTMLElement,
            props: { [k: string]: string | boolean | number }
        ): void => {
            let el = React.createElement(Comp as any, props);

            const root = createRoot(mountNode);
            flushSync(() => {
                root.render(el);
            });
        };
    }
}
