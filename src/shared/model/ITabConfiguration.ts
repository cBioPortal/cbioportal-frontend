export interface ITabConfiguration {

    id:string;
    getTab:()=>JSX.Element;
    hide?:()=>boolean;


}