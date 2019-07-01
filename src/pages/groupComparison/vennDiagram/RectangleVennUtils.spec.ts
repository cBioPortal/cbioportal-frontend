import {assert} from "chai";
import {getApproximateRegionArea, getRegionArea} from "./RectangleVennUtils";

describe("RectangleVennUtils", () => {
    describe("getRegionArea", ()=>{
        it("one rectangle", ()=>{
            assert.approximately(getRegionArea(
                ["rect1"],
                { rect1: {x:0, y:0, xLength:5, yLength:10}}
            ), 50, 0.01);
        });
        it("two disjoint rectangles", ()=>{
            const rects = {
                rect1: {x:0, y:0, xLength:5, yLength:10},
                rect2: {x:10, y:10, xLength:10, yLength:20}
            };
            assert.approximately(getRegionArea(
                ["rect1", "rect2"],
                rects
            ), 0, 0.01);
            assert.approximately(getRegionArea(
                ["rect1"],
                rects
            ), 50, 0.01);

            assert.approximately(getRegionArea(
                ["rect2"],
                rects
            ), 200, 0.01);
        });
        it("rectangle containing another rectangle", ()=>{
            const rects = {
                rect1: {x:0, y:0, xLength:5, yLength:10},
                rect2: {x:1, y:1, xLength:2, yLength:4}
            };
            assert.approximately(getRegionArea(
                ["rect1", "rect2"],
                rects
            ), 8, 0.01);
            assert.approximately(getRegionArea(
                ["rect1"],
                rects
            ), 42, 0.1);

            assert.approximately(getRegionArea(
                ["rect2"],
                rects
            ), 0, 0.01);
        });
        describe.skip("random testing with 2 and 3 rectangles", ()=>{
            const rectangles = {
                rect1: {x:Math.random()*10, y:Math.random()*10, xLength:Math.random()*10, yLength:Math.random()*10},
                rect2: {x:Math.random()*10, y:Math.random()*10, xLength:Math.random()*10, yLength:Math.random()*10},
                rect3: {x:Math.random()*10, y:Math.random()*10, xLength:Math.random()*10, yLength:Math.random()*10}
            };
            const rectangles2 = {
                rect1:rectangles.rect1,
                rect2:rectangles.rect2
            };
            it("2 rectangles", ()=>{
                assert.approximately(
                    getRegionArea(
                        ["rect1"],
                        rectangles2
                    ),
                    getApproximateRegionArea(
                        ["rect1"],
                        rectangles2
                    ),
                    1,
                    `2.1`
                );

                assert.approximately(
                    getRegionArea(
                        ["rect2"],
                        rectangles2
                    ),
                    getApproximateRegionArea(
                        ["rect2"],
                        rectangles2
                    ),
                    1,
                    "2.2"
                );

                assert.approximately(
                    getRegionArea(
                        ["rect1","rect2"],
                        rectangles2
                    ),
                    getApproximateRegionArea(
                        ["rect1", "rect2"],
                        rectangles2
                    ),
                    1,
                    "2.3"
                );
            });
            it("3 rectangles", ()=>{
                assert.approximately(
                    getRegionArea(
                        ["rect1"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect1"],
                        rectangles
                    ),
                    1,
                    "3.1"
                );

                assert.approximately(
                    getRegionArea(
                        ["rect2"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect2"],
                        rectangles
                    ),
                    1,
                    "3.2"
                );

                assert.approximately(
                    getRegionArea(
                        ["rect3"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect3"],
                        rectangles
                    ),
                    1,
                    "3.3"
                );

                assert.approximately(
                    getRegionArea(
                        ["rect1","rect2"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect1", "rect2"],
                        rectangles
                    ),
                    1,
                    "3.4"
                );

                assert.approximately(
                    getRegionArea(
                        ["rect1","rect3"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect1", "rect3"],
                        rectangles
                    ),
                    1,
                    "3.5"
                );

                assert.approximately(
                    getRegionArea(
                        ["rect3","rect2"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect3", "rect2"],
                        rectangles
                    ),
                    1,
                    "3.6"
                );
                assert.approximately(
                    getRegionArea(
                        ["rect1","rect2","rect3"],
                        rectangles
                    ),
                    getApproximateRegionArea(
                        ["rect1", "rect2","rect3"],
                        rectangles
                    ),
                    1,
                    "3.7"
                );
            });
        });
    });

    describe.skip("getApproximateRegionArea", ()=>{
        it("one rectangle", ()=>{
            assert.approximately(getApproximateRegionArea(
                ["rect1"],
                { rect1: {x:0, y:0, xLength:5, yLength:10}}
            ), 50, 0.1);
        });
        it("two disjoint rectangles", ()=>{
            const rects = {
                rect1: {x:0, y:0, xLength:5, yLength:10},
                rect2: {x:10, y:10, xLength:10, yLength:20}
            };
            assert.approximately(getApproximateRegionArea(
                ["rect1", "rect2"],
                rects
            ), 0, 0.1);
            assert.approximately(getApproximateRegionArea(
                ["rect1"],
                rects
            ), 50, 0.1);

            assert.approximately(getApproximateRegionArea(
                ["rect2"],
                rects
            ), 200, 0.1);
        });
        it("rectangle containing another rectangle", ()=>{
            const rects = {
                rect1: {x:0, y:0, xLength:5, yLength:10},
                rect2: {x:1, y:1, xLength:2, yLength:4}
            };
            assert.approximately(getApproximateRegionArea(
                ["rect1", "rect2"],
                rects
            ), 8, 0.1);
            assert.approximately(getApproximateRegionArea(
                ["rect1"],
                rects
            ), 42, 0.1);

            assert.approximately(getApproximateRegionArea(
                ["rect2"],
                rects
            ), 0, 0.1);
        });
    });
});