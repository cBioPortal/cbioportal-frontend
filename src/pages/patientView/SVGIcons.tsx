import * as React from 'react';

export function getMouseIcon():JSX.Element {
    return  (
        <svg id="Layer_2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                 width="15px" height="15px" viewBox="7.015 20 388.209 342.605"
                 enable-background="new 7.015 47.906 388.209 342.605">
            <path fill="none" stroke="#000000" strokeWidth="20" strokeLinejoin="bevel" strokeMiterlimit="10" d="M377.5,250.5 c-2.896,138.241-177.896,163.241-280.896,89.241"/>
            <g>
                <g>
                    <path fill="#0C0202" stroke="#000000" strokeMiterlimit="10" d="M10.5,251.5h377c0,0,66-275-201-185 C186.5,66.5-19.5,159.5,10.5,251.5z"/>
                </g>
                    <path fill="#0C0202" stroke="#000000" strokeLinejoin="bevel" strokeMiterlimit="10" d="M50.5,159.5 C-65.396,141.741,82.604,2.741,88.604,128.741"/>
            </g>
            <circle fill="#FFFFFF" stroke="#000000" strokeMiterlimit="10" cx="50.854" cy="210.991" r="21.25"/>
        </svg>
    );
}

export function getcfDNAIcon(color:string):JSX.Element {
    return  (
        <svg width="16px" height="18px" xmlns="http://www.w3.org/2000/svg" viewBox="12 10 100 130" preserveAspectRatio="none">
            <g>
                <path transform="rotate(89.52623748779297 4577331511296,-51.912152092454825) " stroke="#000000" d="m4577331511348.001,-62.41175l18.39551,0l0,0c10.16016,0 18.39648,4.70075 18.39648,10.49943c0,5.79867 -8.23633,10.49943 -18.39648,10.49943l-18.39551,0l0,-20.99885z" stroke-width="null" fill="#ffffaa"/>
                <rect stroke="#000000" height="53.65825" width="39.68248" y="28.63438" x="30.87123" fill="none"/>
                <path stroke="#000000" d="m33.11381,21.6027l34.6614,0l0,0c4.54074,0 8.22173,2.25713 8.22173,5.04143c0,2.78431 -3.68099,5.04143 -8.22173,5.04143l-34.6614,0l0,0c-4.54074,0 -8.22173,-2.25713 -8.22173,-5.04143c0,-2.78431 3.681,-5.04143 8.22173,-5.04143z" fill="#aaffff"/>
                <line stroke="#000000" y2="42.72542" x2="49.55937" y1="42.72542" x1="31.70428" fill="none"/>
                <line stroke="#000000" y2="53.18468" x2="41.95592" y1="53.18468" x1="31.45293" stroke-width="null" fill="none"/>
                <path stroke="#000000" d="m70.72508,82.86616l0.12208,21.47091l0,0c0.06742,11.85806 -8.8234,21.51143 -19.85821,21.56143c-11.03481,0.04999 -20.03495,-9.52233 -20.10237,-21.38039l-0.12208,-21.47091l39.96058,-0.18104z" stroke-width="null" fill={color}/>
            </g>
        </svg>
    );
}