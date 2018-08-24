import * as React from "react";
import MobxPromise from "mobxpromise";
import styles from "../styles.module.scss";
import { ThreeBounce } from 'better-react-spinkit';

export interface StudyViewComponentLoaderProps {
    promise: MobxPromise<any>
    isInitialLoaded:boolean
}

export class StudyViewComponentLoader extends React.Component<StudyViewComponentLoaderProps> {
    public render() {
        return (
            <div style={{ position: "relative", height: "100%"}}>
                {this.props.isInitialLoaded && <div>
                    {this.props.children}
                </div>
                }
                {this.props.promise.isPending &&
                    <div className={styles.studyViewLoadingIndicator}>
                        <ThreeBounce style={{ display: 'inline-block', marginLeft: 10 }} />
                    </div>
                }
            </div>
        );
    }
}