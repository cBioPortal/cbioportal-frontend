declare module 'react-if' {
    import { ReactNode } from 'react';

    interface IfOptions {
        children?: ReactNode;
    }

    interface ThenOptions {
        children?: ReactNode;
    }

    interface ElseOptions {
        children?: ReactNode;
    }

    class Then extends React.Component<ThenOptions, any> {}
    class Else extends React.Component<ElseOptions, any> {}
}
