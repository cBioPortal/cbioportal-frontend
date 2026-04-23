// Third-party @types predate React 18's removal of implicit children.
// Augment the props types of the class components we pass children to.
import * as React from 'react';

declare module 'react-router' {
    interface RouterProps {
        children?: React.ReactNode;
    }
    interface SwitchProps {
        children?: React.ReactNode;
    }
}

declare module 'react-router-dom' {
    interface BrowserRouterProps {
        children?: React.ReactNode;
    }
    interface HashRouterProps {
        children?: React.ReactNode;
    }
    interface MemoryRouterProps {
        children?: React.ReactNode;
    }
    interface StaticRouterProps {
        children?: React.ReactNode;
    }
}

// @types/react-bootstrap 0.32 declares each component's Props inside a
// namespace within its own `lib/X.d.ts` module, so augmentation has to happen
// at the per-file module path rather than at the root `react-bootstrap` module.
declare module 'react-bootstrap/lib/OverlayTrigger' {
    namespace OverlayTrigger {
        interface OverlayTriggerProps {
            children?: React.ReactNode;
        }
    }
}
declare module 'react-bootstrap/lib/Overlay' {
    namespace Overlay {
        interface OverlayProps {
            children?: React.ReactNode;
        }
    }
}

declare module 'react-draggable' {
    interface DraggableProps {
        children?: React.ReactNode;
    }
}

declare module 'react-grid-layout' {
    interface ReactGridLayoutProps {
        children?: React.ReactNode;
    }
}
