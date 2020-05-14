import * as _ from 'lodash';
import {
    ASCN_AMP,
    ASCN_GAIN,
    ASCN_LIGHTGREY,
    ASCN_HETLOSS,
    ASCN_HOMDEL,
    ASCN_BLACK,
} from 'shared/lib/Colors';

export function getASCNCopyNumberColor(ASCNCopyNumberValue: string): string {
    switch (ASCNCopyNumberValue) {
        case '2':
            return ASCN_AMP;
        case '1':
            return ASCN_GAIN;
        case '0':
            return ASCN_LIGHTGREY;
        case '-1':
            return ASCN_HETLOSS;
        case '-2':
            return ASCN_HOMDEL;
        default:
            return ASCN_BLACK;
    }
}
