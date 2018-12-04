import {observer} from "mobx-react";
import {IReactionDisposer, Reaction} from "mobx";

function isReactionDisposer(o:any):o is IReactionDisposer {
    return o && (typeof o === "function") && (o.$mobx instanceof Reaction);
}

function disposeReactions() {
    // loops through caller's members, and disposes reactions
    for (const key in this) {
        if (this.hasOwnProperty(key)) {
            const value = this[key];
            if (isReactionDisposer(value)) {
                value();
            }
        }
    }
}

// Decorator
function cbioObserver<P, TFunction extends React.ComponentClass<P | void>>(
    component: TFunction
): TFunction {
    // add disposing functionality to componentWillUnmount
    const willUnmount = component.prototype.componentWillUnmount;
    component.prototype.componentWillUnmount = function() {
        // dispose reactions
        disposeReactions.apply(this);
        // call original componentWillUnmount
        willUnmount.apply(this);
    };

    // apply mobx-react observer
    return observer<P, TFunction>(component);
}

export default cbioObserver;