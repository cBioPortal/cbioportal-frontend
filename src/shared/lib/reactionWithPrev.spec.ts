import { assert } from 'chai';
import reactionWithPrev from './reactionWithPrev';
import { IReactionDisposer, observable } from 'mobx';

describe('reactionWithPrev', () => {
    let dispose: IReactionDisposer;

    it('passes through the correct arguments each time', done => {
        let values = [0, 3, 5, 7, 7, 7, 8, 10];
        let argumentIndex = observable(-1);
        let indexesWhereEffectCalled: { [index: number]: boolean } = {};

        let dataFn = () => values[argumentIndex];
        let effectFn = (data: number, prevData?: number) => {
            if (argumentIndex === values.length) {
                assert.isTrue(indexesWhereEffectCalled[0], '0');
                assert.isTrue(indexesWhereEffectCalled[1], '1');
                assert.isTrue(indexesWhereEffectCalled[2], '2');
                assert.isTrue(indexesWhereEffectCalled[3], '3');
                assert.isTrue(!indexesWhereEffectCalled[4], '4');
                assert.isTrue(!indexesWhereEffectCalled[5], '5');
                assert.isTrue(indexesWhereEffectCalled[6], '6');
                assert.isTrue(indexesWhereEffectCalled[7], '7');
                done();
            } else {
                indexesWhereEffectCalled[argumentIndex] = true;
                assert.equal(data, values[argumentIndex]);
                if (argumentIndex > 0) {
                    assert.equal(prevData, values[argumentIndex - 1]);
                }
            }
        };
        dispose = reactionWithPrev<number>(dataFn, effectFn);
        argumentIndex = 0;
        argumentIndex = 1;
        argumentIndex = 2;
        argumentIndex = 3;
        argumentIndex = 4;
        argumentIndex = 5;
        argumentIndex = 6;
        argumentIndex = 7;
        argumentIndex = 8;
    });
});
