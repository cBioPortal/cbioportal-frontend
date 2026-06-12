import * as React from 'react';
import { flushSync } from 'react-dom';
import { createRoot, Root } from 'react-dom/client';

export default function(
    name: string,
    Comp: React.ComponentClass<any> | React.FunctionComponent<any>,
    props: any = {}
) {
    const win = window as any;

    if (win) {
        // One root per mount node — createRoot() must not run twice on the
        // same container.
        const rootByMountNode = new WeakMap<HTMLElement, Root>();
        win[name] = (
            mountNode: HTMLElement,
            props: { [k: string]: string | boolean | number }
        ): void => {
            let el = React.createElement(Comp as any, props);

            let root = rootByMountNode.get(mountNode);
            if (!root) {
                root = createRoot(mountNode);
                rootByMountNode.set(mountNode, root);
            }
            flushSync(() => {
                root!.render(el);
            });
        };
    }
}
