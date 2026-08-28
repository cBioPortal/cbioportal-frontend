/**
 * Makes React's DOM commits tolerant of third-party DOM mutation.
 *
 * Browser features and extensions (most commonly Chrome's built-in page
 * translation) rewrite text nodes React owns, e.g. by wrapping them in
 * `<font>` elements. When React later reconciles that subtree it calls
 * `parent.removeChild(node)` / `parent.insertBefore(node, ref)` with nodes
 * that are no longer where it left them, the browser throws
 * `NotFoundError: The node to be removed is not a child of this node`, and the
 * whole app is replaced by the ErrorBoundary screen.
 *
 * React has no hook for this (facebook/react#11538), so we patch the two DOM
 * methods to no-op in exactly that situation. All other calls are delegated to
 * the native implementation unchanged.
 */
export function installDomNodeRemovalGuard(
    nodeProto: Node = typeof Node !== 'undefined' ? Node.prototype : undefined!
) {
    if (!nodeProto || (nodeProto as any).__domNodeRemovalGuardInstalled) {
        return;
    }

    const nativeRemoveChild = nodeProto.removeChild;
    const nativeInsertBefore = nodeProto.insertBefore;

    nodeProto.removeChild = function<T extends Node>(this: Node, child: T): T {
        if (child.parentNode !== this) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn(
                    'Ignoring removeChild() of a node that is not a child of the target; ' +
                        'the DOM was probably modified by a browser extension or page translation.',
                    child
                );
            }
            return child;
        }
        return nativeRemoveChild.call(this, child) as T;
    };

    nodeProto.insertBefore = function<T extends Node>(
        this: Node,
        newNode: T,
        referenceNode: Node | null
    ): T {
        if (referenceNode && referenceNode.parentNode !== this) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn(
                    'Ignoring insertBefore() with a reference node that is not a child of the target; ' +
                        'the DOM was probably modified by a browser extension or page translation.',
                    referenceNode
                );
            }
            return newNode;
        }
        return nativeInsertBefore.call(this, newNode, referenceNode) as T;
    };

    (nodeProto as any).__domNodeRemovalGuardInstalled = true;
}

installDomNodeRemovalGuard();
