// Handle all shared imports with a wildcard declaration
declare module 'shared/*';

// Handle specific third-party modules that are missing types
declare module 'config/*';
declare module 'better-react-spinkit';
declare module 'react-portal';
declare module 'react-spinkit' {
    import * as React from 'react';
    export interface SpinnerProps {
        name?: string;
        noFadeIn?: boolean;
        fadeIn?: string;
        className?: string;
        style?: React.CSSProperties;
        [key: string]: any;
    }
    export default class Spinner extends React.Component<SpinnerProps> {}
}
