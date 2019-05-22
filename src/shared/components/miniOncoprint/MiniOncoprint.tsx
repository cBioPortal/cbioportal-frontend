import * as React from "react";
import styles from './styles.module.scss';

interface IMiniOncoprint {
    group1Width:number;
    group2Width:number;
    group1Unaltered:number;
    group1Altered:number;
    group2Altered:number;
    group1Color?:string;
    group2Color?:string;
    height?:number;
    width:number;
}

export const MiniOncoprint: React.SFC<IMiniOncoprint> = (props) => {
     const height = props.height || 2;

    return <div className={styles.wrapper} style={{width:props.width}}>
        <div className={styles.groupRow}>
            <div style={{ width:`${props.group1Width}%`, background: '#3786C2'}}></div>
            <div style={{ width:`${props.group2Width}%`, background: '#bbb'}}></div>
        </div>
        <div className={styles.alterationRow}>
            <div style={{ width:`${props.group1Unaltered}%`, background: 'transparent'}}></div>
            <div style={{ width:`${props.group1Altered}%`, background: '#3786C2'}}></div>
            <div style={{ width:`${props.group2Altered}%`, background: '#3786C2'}}></div>
        </div>
    </div>;
}
