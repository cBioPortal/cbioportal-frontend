import * as React from 'react';

export type AnnotationErrorLogger = (
    error: Error,
    componentName: string
) => void;

let annotationErrorLogger: AnnotationErrorLogger | undefined;

// a data model change breaks the same annotation on every row of a table, so
// each distinct failure is reported only once per page load
let reportedErrors: Set<string> = new Set();

/**
 * Registers the callback used to report annotation render failures. Packages
 * cannot import the application's logging module, so the application provides
 * the logger once during bootstrap. Registering a logger also resets the set
 * of already reported failures.
 */
export function setAnnotationErrorLogger(logger: AnnotationErrorLogger) {
    annotationErrorLogger = logger;
    reportedErrors = new Set();
}

export type AnnotationErrorBoundaryProps = {
    componentName: string;
    fallback: JSX.Element;
    children?: React.ReactNode;
};

type AnnotationErrorBoundaryState = {
    hasError: boolean;
};

/**
 * Contains render errors thrown by a single annotation component. External
 * annotation services such as Genome Nexus and OncoKB can change their data
 * model without notice, and a response missing an expected field throws while
 * rendering. The only other error boundary in the application wraps the entire
 * app shell, so without this one a single annotation replaces the whole page
 * with an error screen.
 */
export default class AnnotationErrorBoundary extends React.Component<
    AnnotationErrorBoundaryProps,
    AnnotationErrorBoundaryState
> {
    constructor(props: AnnotationErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError() {
        return { hasError: true };
    }

    public componentDidCatch(error: Error) {
        const key = `${this.props.componentName}:${error.message}`;

        if (annotationErrorLogger && !reportedErrors.has(key)) {
            reportedErrors.add(key);
            annotationErrorLogger(error, this.props.componentName);
        }
    }

    public render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}
