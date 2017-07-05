(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.3.2
 */

/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */
// END HEADER

exports.glMatrix = require("./gl-matrix/common.js");
exports.mat2 = require("./gl-matrix/mat2.js");
exports.mat2d = require("./gl-matrix/mat2d.js");
exports.mat3 = require("./gl-matrix/mat3.js");
exports.mat4 = require("./gl-matrix/mat4.js");
exports.quat = require("./gl-matrix/quat.js");
exports.vec2 = require("./gl-matrix/vec2.js");
exports.vec3 = require("./gl-matrix/vec3.js");
exports.vec4 = require("./gl-matrix/vec4.js");
},{"./gl-matrix/common.js":2,"./gl-matrix/mat2.js":3,"./gl-matrix/mat2d.js":4,"./gl-matrix/mat3.js":5,"./gl-matrix/mat4.js":6,"./gl-matrix/quat.js":7,"./gl-matrix/vec2.js":8,"./gl-matrix/vec3.js":9,"./gl-matrix/vec4.js":10}],2:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

// Configuration Constants
glMatrix.EPSILON = 0.000001;
glMatrix.ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
glMatrix.RANDOM = Math.random;
glMatrix.ENABLE_SIMD = false;

// Capability detection
glMatrix.SIMD_AVAILABLE = (glMatrix.ARRAY_TYPE === Float32Array) && ('SIMD' in this);
glMatrix.USE_SIMD = glMatrix.ENABLE_SIMD && glMatrix.SIMD_AVAILABLE;

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    glMatrix.ARRAY_TYPE = type;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less 
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 * 
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
glMatrix.equals = function(a, b) {
	return Math.abs(a - b) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a), Math.abs(b));
}

module.exports = glMatrix;

},{}],3:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 2x2 Matrix
 * @name mat2
 */
var mat2 = {};

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Create a new mat2 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out A new 2x2 matrix
 */
mat2.fromValues = function(m00, m01, m10, m11) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = m00;
    out[1] = m01;
    out[2] = m10;
    out[3] = m11;
    return out;
};

/**
 * Set the components of a mat2 to the given values
 *
 * @param {mat2} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out
 */
mat2.set = function(out, m00, m01, m10, m11) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m10;
    out[3] = m11;
    return out;
};


/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    return out;
};

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.fromRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2} out
 */
mat2.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {mat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2)))
};

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {mat2} L the lower triangular matrix 
 * @param {mat2} D the diagonal matrix 
 * @param {mat2} U the upper triangular matrix 
 * @param {mat2} a the input matrix to factorize
 */

mat2.LDU = function (L, D, U, a) { 
    L[2] = a[2]/a[0]; 
    U[0] = a[0]; 
    U[1] = a[1]; 
    U[3] = a[3] - L[2] * U[1]; 
    return [L, D, U];       
}; 

/**
 * Adds two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link mat2.subtract}
 * @function
 */
mat2.sub = mat2.subtract;

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat2} a The first matrix.
 * @param {mat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat2} a The first matrix.
 * @param {mat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)));
};

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2} out
 */
mat2.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2} out the receiving vector
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2} out
 */
mat2.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

module.exports = mat2;

},{"./common.js":2}],4:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, c, tx,
 *  b, d, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, c, tx,
 *  b, d, ty,
 *  0, 0, 1]
 * </pre>
 * The last row is ignored so the array is shorter and operations are faster.
 */
var mat2d = {};

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} A new mat2d
 */
mat2d.fromValues = function(a, b, c, d, tx, ty) {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
};

/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} out
 */
mat2d.set = function(out, a, b, c, d, tx, ty) {
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
};

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.fromRotation = function(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2d} out
 */
mat2d.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat2d} out
 */
mat2d.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = v[0];
    out[5] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {mat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2d.frob = function (a) { 
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1))
}; 

/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    return out;
};

/**
 * Alias for {@link mat2d.subtract}
 * @function
 */
mat2d.sub = mat2d.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2d} out
 */
mat2d.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    return out;
};

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2d} out
 */
mat2d.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    return out;
};

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat2d} a The first matrix.
 * @param {mat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2d.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat2d} a The first matrix.
 * @param {mat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2d.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)));
};

module.exports = mat2d;

},{"./common.js":2}],5:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 3x3 Matrix
 * @name mat3
 */
var mat3 = {};

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new glMatrix.ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Create a new mat3 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} A new mat3
 */
mat3.fromValues = function(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    var out = new glMatrix.ARRAY_TYPE(9);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
};

/**
 * Set the components of a mat3 to the given values
 *
 * @param {mat3} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} out
 */
mat3.set = function(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat3} out
 */
mat3.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = v[0];
    out[7] = v[1];
    out[8] = 1;
    return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.fromRotation = function(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);

    out[0] = c;
    out[1] = s;
    out[2] = 0;

    out[3] = -s;
    out[4] = c;
    out[5] = 0;

    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat3} out
 */
mat3.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;

    out[3] = 0;
    out[4] = v[1];
    out[5] = 0;

    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
}

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};

/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    return out;
};

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
mat3.sub = mat3.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */
mat3.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    return out;
};

/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */
mat3.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    out[6] = a[6] + (b[6] * scale);
    out[7] = a[7] + (b[7] * scale);
    out[8] = a[8] + (b[8] * scale);
    return out;
};

/*
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && 
           a[3] === b[3] && a[4] === b[4] && a[5] === b[5] &&
           a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = a[6], b7 = b[7], b8 = b[8];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a8), Math.abs(b8)));
};


module.exports = mat3;

},{"./common.js":2}],6:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 4x4 Matrix
 * @name mat4
 */
var mat4 = {
  scalar: {},
  SIMD: {},
};

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */
mat4.fromValues = function(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
};

/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */
mat4.set = function(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
};


/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4 not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.scalar.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }

    return out;
};

/**
 * Transpose the values of a mat4 using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.SIMD.transpose = function(out, a) {
    var a0, a1, a2, a3,
        tmp01, tmp23,
        out0, out1, out2, out3;

    a0 = SIMD.Float32x4.load(a, 0);
    a1 = SIMD.Float32x4.load(a, 4);
    a2 = SIMD.Float32x4.load(a, 8);
    a3 = SIMD.Float32x4.load(a, 12);

    tmp01 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
    tmp23 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
    out0  = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
    out1  = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
    SIMD.Float32x4.store(out, 0,  out0);
    SIMD.Float32x4.store(out, 4,  out1);

    tmp01 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
    tmp23 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
    out2  = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
    out3  = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
    SIMD.Float32x4.store(out, 8,  out2);
    SIMD.Float32x4.store(out, 12, out3);

    return out;
};

/**
 * Transpse a mat4 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = glMatrix.USE_SIMD ? mat4.SIMD.transpose : mat4.scalar.transpose;

/**
 * Inverts a mat4 not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.scalar.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Inverts a mat4 using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.SIMD.invert = function(out, a) {
  var row0, row1, row2, row3,
      tmp1,
      minor0, minor1, minor2, minor3,
      det,
      a0 = SIMD.Float32x4.load(a, 0),
      a1 = SIMD.Float32x4.load(a, 4),
      a2 = SIMD.Float32x4.load(a, 8),
      a3 = SIMD.Float32x4.load(a, 12);

  // Compute matrix adjugate
  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
  row1 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
  row0 = SIMD.Float32x4.shuffle(tmp1, row1, 0, 2, 4, 6);
  row1 = SIMD.Float32x4.shuffle(row1, tmp1, 1, 3, 5, 7);
  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
  row3 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
  row2 = SIMD.Float32x4.shuffle(tmp1, row3, 0, 2, 4, 6);
  row3 = SIMD.Float32x4.shuffle(row3, tmp1, 1, 3, 5, 7);

  tmp1   = SIMD.Float32x4.mul(row2, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.mul(row1, tmp1);
  minor1 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row1, tmp1), minor0);
  minor1 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor1);
  minor1 = SIMD.Float32x4.swizzle(minor1, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row1, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor0);
  minor3 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor3);
  minor3 = SIMD.Float32x4.swizzle(minor3, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(row1, 2, 3, 0, 1), row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  row2   = SIMD.Float32x4.swizzle(row2, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor0);
  minor2 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor2);
  minor2 = SIMD.Float32x4.swizzle(minor2, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row0, row1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row2, tmp1), minor3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row2, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor1);
  minor2 = SIMD.Float32x4.sub(minor2, SIMD.Float32x4.mul(row1, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor1);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row1, tmp1));
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor3);

  // Compute matrix determinant
  det   = SIMD.Float32x4.mul(row0, minor0);
  det   = SIMD.Float32x4.add(SIMD.Float32x4.swizzle(det, 2, 3, 0, 1), det);
  det   = SIMD.Float32x4.add(SIMD.Float32x4.swizzle(det, 1, 0, 3, 2), det);
  tmp1  = SIMD.Float32x4.reciprocalApproximation(det);
  det   = SIMD.Float32x4.sub(
               SIMD.Float32x4.add(tmp1, tmp1),
               SIMD.Float32x4.mul(det, SIMD.Float32x4.mul(tmp1, tmp1)));
  det   = SIMD.Float32x4.swizzle(det, 0, 0, 0, 0);
  if (!det) {
      return null;
  }

  // Compute matrix inverse
  SIMD.Float32x4.store(out, 0,  SIMD.Float32x4.mul(det, minor0));
  SIMD.Float32x4.store(out, 4,  SIMD.Float32x4.mul(det, minor1));
  SIMD.Float32x4.store(out, 8,  SIMD.Float32x4.mul(det, minor2));
  SIMD.Float32x4.store(out, 12, SIMD.Float32x4.mul(det, minor3));
  return out;
}

/**
 * Inverts a mat4 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = glMatrix.USE_SIMD ? mat4.SIMD.invert : mat4.scalar.invert;

/**
 * Calculates the adjugate of a mat4 not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.scalar.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the adjugate of a mat4 using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.SIMD.adjoint = function(out, a) {
  var a0, a1, a2, a3;
  var row0, row1, row2, row3;
  var tmp1;
  var minor0, minor1, minor2, minor3;

  var a0 = SIMD.Float32x4.load(a, 0);
  var a1 = SIMD.Float32x4.load(a, 4);
  var a2 = SIMD.Float32x4.load(a, 8);
  var a3 = SIMD.Float32x4.load(a, 12);

  // Transpose the source matrix.  Sort of.  Not a true transpose operation
  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
  row1 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
  row0 = SIMD.Float32x4.shuffle(tmp1, row1, 0, 2, 4, 6);
  row1 = SIMD.Float32x4.shuffle(row1, tmp1, 1, 3, 5, 7);

  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
  row3 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
  row2 = SIMD.Float32x4.shuffle(tmp1, row3, 0, 2, 4, 6);
  row3 = SIMD.Float32x4.shuffle(row3, tmp1, 1, 3, 5, 7);

  tmp1   = SIMD.Float32x4.mul(row2, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.mul(row1, tmp1);
  minor1 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row1, tmp1), minor0);
  minor1 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor1);
  minor1 = SIMD.Float32x4.swizzle(minor1, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row1, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor0);
  minor3 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor3);
  minor3 = SIMD.Float32x4.swizzle(minor3, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(row1, 2, 3, 0, 1), row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  row2   = SIMD.Float32x4.swizzle(row2, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor0);
  minor2 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor2);
  minor2 = SIMD.Float32x4.swizzle(minor2, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row0, row1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row2, tmp1), minor3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row2, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor1);
  minor2 = SIMD.Float32x4.sub(minor2, SIMD.Float32x4.mul(row1, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor1);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row1, tmp1));
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor3);

  SIMD.Float32x4.store(out, 0,  minor0);
  SIMD.Float32x4.store(out, 4,  minor1);
  SIMD.Float32x4.store(out, 8,  minor2);
  SIMD.Float32x4.store(out, 12, minor3);
  return out;
};

/**
 * Calculates the adjugate of a mat4 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
 mat4.adjoint = glMatrix.USE_SIMD ? mat4.SIMD.adjoint : mat4.scalar.adjoint;

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's explicitly using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand, must be a Float32Array
 * @param {mat4} b the second operand, must be a Float32Array
 * @returns {mat4} out
 */
mat4.SIMD.multiply = function (out, a, b) {
    var a0 = SIMD.Float32x4.load(a, 0);
    var a1 = SIMD.Float32x4.load(a, 4);
    var a2 = SIMD.Float32x4.load(a, 8);
    var a3 = SIMD.Float32x4.load(a, 12);

    var b0 = SIMD.Float32x4.load(b, 0);
    var out0 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                       SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 1, 1, 1, 1), a1),
                       SIMD.Float32x4.add(
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 2, 2, 2, 2), a2),
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 0, out0);

    var b1 = SIMD.Float32x4.load(b, 4);
    var out1 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                       SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 1, 1, 1, 1), a1),
                       SIMD.Float32x4.add(
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 2, 2, 2, 2), a2),
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 4, out1);

    var b2 = SIMD.Float32x4.load(b, 8);
    var out2 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                       SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 1, 1, 1, 1), a1),
                       SIMD.Float32x4.add(
                               SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 2, 2, 2, 2), a2),
                               SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 8, out2);

    var b3 = SIMD.Float32x4.load(b, 12);
    var out3 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                        SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 1, 1, 1, 1), a1),
                        SIMD.Float32x4.add(
                            SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 2, 2, 2, 2), a2),
                            SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 12, out3);

    return out;
};

/**
 * Multiplies two mat4's explicitly not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.scalar.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Multiplies two mat4's using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = glMatrix.USE_SIMD ? mat4.SIMD.multiply : mat4.scalar.multiply;

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.scalar.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
 * Translates a mat4 by the given vector using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.SIMD.translate = function (out, a, v) {
    var a0 = SIMD.Float32x4.load(a, 0),
        a1 = SIMD.Float32x4.load(a, 4),
        a2 = SIMD.Float32x4.load(a, 8),
        a3 = SIMD.Float32x4.load(a, 12),
        vec = SIMD.Float32x4(v[0], v[1], v[2] , 0);

    if (a !== out) {
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
        out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
    }

    a0 = SIMD.Float32x4.mul(a0, SIMD.Float32x4.swizzle(vec, 0, 0, 0, 0));
    a1 = SIMD.Float32x4.mul(a1, SIMD.Float32x4.swizzle(vec, 1, 1, 1, 1));
    a2 = SIMD.Float32x4.mul(a2, SIMD.Float32x4.swizzle(vec, 2, 2, 2, 2));

    var t0 = SIMD.Float32x4.add(a0, SIMD.Float32x4.add(a1, SIMD.Float32x4.add(a2, a3)));
    SIMD.Float32x4.store(out, 12, t0);

    return out;
};

/**
 * Translates a mat4 by the given vector using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = glMatrix.USE_SIMD ? mat4.SIMD.translate : mat4.scalar.translate;

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scalar.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3 using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.SIMD.scale = function(out, a, v) {
    var a0, a1, a2;
    var vec = SIMD.Float32x4(v[0], v[1], v[2], 0);

    a0 = SIMD.Float32x4.load(a, 0);
    SIMD.Float32x4.store(
        out, 0, SIMD.Float32x4.mul(a0, SIMD.Float32x4.swizzle(vec, 0, 0, 0, 0)));

    a1 = SIMD.Float32x4.load(a, 4);
    SIMD.Float32x4.store(
        out, 4, SIMD.Float32x4.mul(a1, SIMD.Float32x4.swizzle(vec, 1, 1, 1, 1)));

    a2 = SIMD.Float32x4.load(a, 8);
    SIMD.Float32x4.store(
        out, 8, SIMD.Float32x4.mul(a2, SIMD.Float32x4.swizzle(vec, 2, 2, 2, 2)));

    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 */
mat4.scale = glMatrix.USE_SIMD ? mat4.SIMD.scale : mat4.scalar.scale;

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < glMatrix.EPSILON) { return null; }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.scalar.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.SIMD.rotateX = function (out, a, rad) {
    var s = SIMD.Float32x4.splat(Math.sin(rad)),
        c = SIMD.Float32x4.splat(Math.cos(rad));

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
      out[0]  = a[0];
      out[1]  = a[1];
      out[2]  = a[2];
      out[3]  = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    var a_1 = SIMD.Float32x4.load(a, 4);
    var a_2 = SIMD.Float32x4.load(a, 8);
    SIMD.Float32x4.store(out, 4,
                         SIMD.Float32x4.add(SIMD.Float32x4.mul(a_1, c), SIMD.Float32x4.mul(a_2, s)));
    SIMD.Float32x4.store(out, 8,
                         SIMD.Float32x4.sub(SIMD.Float32x4.mul(a_2, c), SIMD.Float32x4.mul(a_1, s)));
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis using SIMD if availabe and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = glMatrix.USE_SIMD ? mat4.SIMD.rotateX : mat4.scalar.rotateX;

/**
 * Rotates a matrix by the given angle around the Y axis not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.scalar.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.SIMD.rotateY = function (out, a, rad) {
    var s = SIMD.Float32x4.splat(Math.sin(rad)),
        c = SIMD.Float32x4.splat(Math.cos(rad));

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    var a_0 = SIMD.Float32x4.load(a, 0);
    var a_2 = SIMD.Float32x4.load(a, 8);
    SIMD.Float32x4.store(out, 0,
                         SIMD.Float32x4.sub(SIMD.Float32x4.mul(a_0, c), SIMD.Float32x4.mul(a_2, s)));
    SIMD.Float32x4.store(out, 8,
                         SIMD.Float32x4.add(SIMD.Float32x4.mul(a_0, s), SIMD.Float32x4.mul(a_2, c)));
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis if SIMD available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
 mat4.rotateY = glMatrix.USE_SIMD ? mat4.SIMD.rotateY : mat4.scalar.rotateY;

/**
 * Rotates a matrix by the given angle around the Z axis not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.scalar.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.SIMD.rotateZ = function (out, a, rad) {
    var s = SIMD.Float32x4.splat(Math.sin(rad)),
        c = SIMD.Float32x4.splat(Math.cos(rad));

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    var a_0 = SIMD.Float32x4.load(a, 0);
    var a_1 = SIMD.Float32x4.load(a, 4);
    SIMD.Float32x4.store(out, 0,
                         SIMD.Float32x4.add(SIMD.Float32x4.mul(a_0, c), SIMD.Float32x4.mul(a_1, s)));
    SIMD.Float32x4.store(out, 4,
                         SIMD.Float32x4.sub(SIMD.Float32x4.mul(a_1, c), SIMD.Float32x4.mul(a_0, s)));
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis if SIMD available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
 mat4.rotateZ = glMatrix.USE_SIMD ? mat4.SIMD.rotateZ : mat4.scalar.rotateZ;

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Scaling vector
 * @returns {mat4} out
 */
mat4.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.fromRotation = function(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t;

    if (Math.abs(len) < glMatrix.EPSILON) { return null; }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    // Perform rotation-specific matrix multiplication
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromXRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);

    // Perform axis-specific matrix multiplication
    out[0]  = 1;
    out[1]  = 0;
    out[2]  = 0;
    out[3]  = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromYRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);

    // Perform axis-specific matrix multiplication
    out[0]  = c;
    out[1]  = 0;
    out[2]  = -s;
    out[3]  = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromZRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);

    // Perform axis-specific matrix multiplication
    out[0]  = c;
    out[1]  = s;
    out[2]  = 0;
    out[3]  = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
};

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {mat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
mat4.getTranslation = function (out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];

  return out;
};

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {mat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
mat4.getRotation = function (out, mat) {
  // Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
  var trace = mat[0] + mat[5] + mat[10];
  var S = 0;

  if (trace > 0) { 
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (mat[6] - mat[9]) / S;
    out[1] = (mat[8] - mat[2]) / S; 
    out[2] = (mat[1] - mat[4]) / S; 
  } else if ((mat[0] > mat[5])&(mat[0] > mat[10])) { 
    S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2;
    out[3] = (mat[6] - mat[9]) / S;
    out[0] = 0.25 * S;
    out[1] = (mat[1] + mat[4]) / S; 
    out[2] = (mat[8] + mat[2]) / S; 
  } else if (mat[5] > mat[10]) { 
    S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2;
    out[3] = (mat[8] - mat[2]) / S;
    out[0] = (mat[1] + mat[4]) / S; 
    out[1] = 0.25 * S;
    out[2] = (mat[6] + mat[9]) / S; 
  } else { 
    S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2;
    out[3] = (mat[1] - mat[4]) / S;
    out[0] = (mat[8] + mat[2]) / S;
    out[1] = (mat[6] + mat[9]) / S;
    out[2] = 0.25 * S;
  }

  return out;
};

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslationScale = function (out, q, v, s) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2,
        sx = s[0],
        sy = s[1],
        sz = s[2];

    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
};

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @param {vec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */
mat4.fromRotationTranslationScaleOrigin = function (out, q, v, s, o) {
  // Quaternion math
  var x = q[0], y = q[1], z = q[2], w = q[3],
      x2 = x + x,
      y2 = y + y,
      z2 = z + z,

      xx = x * x2,
      xy = x * y2,
      xz = x * z2,
      yy = y * y2,
      yz = y * z2,
      zz = z * z2,
      wx = w * x2,
      wy = w * y2,
      wz = w * z2,

      sx = s[0],
      sy = s[1],
      sz = s[2],

      ox = o[0],
      oy = o[1],
      oz = o[2];

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0] + ox - (out[0] * ox + out[4] * oy + out[8] * oz);
  out[13] = v[1] + oy - (out[1] * ox + out[5] * oy + out[9] * oz);
  out[14] = v[2] + oz - (out[2] * ox + out[6] * oy + out[10] * oz);
  out[15] = 1;

  return out;
};

/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */
mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspectiveFromFieldOfView = function (out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI/180.0),
        downTan = Math.tan(fov.downDegrees * Math.PI/180.0),
        leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0),
        rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0),
        xScale = 2.0 / (leftTan + rightTan),
        yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < glMatrix.EPSILON &&
        Math.abs(eyey - centery) < glMatrix.EPSILON &&
        Math.abs(eyez - centerz) < glMatrix.EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' +
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {mat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat4.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
};

/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
};

/**
 * Alias for {@link mat4.subtract}
 * @function
 */
mat4.sub = mat4.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */
mat4.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
};

/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */
mat4.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    out[6] = a[6] + (b[6] * scale);
    out[7] = a[7] + (b[7] * scale);
    out[8] = a[8] + (b[8] * scale);
    out[9] = a[9] + (b[9] * scale);
    out[10] = a[10] + (b[10] * scale);
    out[11] = a[11] + (b[11] * scale);
    out[12] = a[12] + (b[12] * scale);
    out[13] = a[13] + (b[13] * scale);
    out[14] = a[14] + (b[14] * scale);
    out[15] = a[15] + (b[15] * scale);
    return out;
};

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat4} a The first matrix.
 * @param {mat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat4.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && 
           a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && 
           a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] &&
           a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat4} a The first matrix.
 * @param {mat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat4.equals = function (a, b) {
    var a0  = a[0],  a1  = a[1],  a2  = a[2],  a3  = a[3],
        a4  = a[4],  a5  = a[5],  a6  = a[6],  a7  = a[7], 
        a8  = a[8],  a9  = a[9],  a10 = a[10], a11 = a[11], 
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];

    var b0  = b[0],  b1  = b[1],  b2  = b[2],  b3  = b[3],
        b4  = b[4],  b5  = b[5],  b6  = b[6],  b7  = b[7], 
        b8  = b[8],  b9  = b[9],  b10 = b[10], b11 = b[11], 
        b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a8), Math.abs(b8)) &&
            Math.abs(a9 - b9) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a9), Math.abs(b9)) &&
            Math.abs(a10 - b10) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a10), Math.abs(b10)) &&
            Math.abs(a11 - b11) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a11), Math.abs(b11)) &&
            Math.abs(a12 - b12) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a12), Math.abs(b12)) &&
            Math.abs(a13 - b13) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a13), Math.abs(b13)) &&
            Math.abs(a14 - b14) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a14), Math.abs(b14)) &&
            Math.abs(a15 - b15) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a15), Math.abs(b15)));
};



module.exports = mat4;

},{"./common.js":2}],7:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");
var mat3 = require("./mat3.js");
var vec3 = require("./vec3.js");
var vec4 = require("./vec4.js");

/**
 * @class Quaternion
 * @name quat
 */
var quat = {};

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {quat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */
quat.getAxisAngle = function(out_axis, q) {
    var rad = Math.acos(q[3]) * 2.0;
    var s = Math.sin(rad / 2.0);
    if (s != 0.0) {
        out_axis[0] = q[0] / s;
        out_axis[1] = q[1] / s;
        out_axis[2] = q[2] / s;
    } else {
        // If s is zero, return any axis (no rotation - axis does not matter)
        out_axis[0] = 1;
        out_axis[1] = 0;
        out_axis[2] = 0;
    }
    return rad;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {quat} c the third operand
 * @param {quat} d the fourth operand
 * @param {Number} t interpolation amount
 * @returns {quat} out
 */
quat.sqlerp = (function () {
  var temp1 = quat.create();
  var temp2 = quat.create();
  
  return function (out, a, b, c, d, t) {
    quat.slerp(temp1, a, d, t);
    quat.slerp(temp2, b, c, t);
    quat.slerp(out, temp1, temp2, 2 * t * (1 - t));
    
    return out;
  };
}());

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        out[0] = (m[5]-m[7])*fRoot;
        out[1] = (m[6]-m[2])*fRoot;
        out[2] = (m[1]-m[3])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j*3+k] - m[k*3+j]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {quat} a The first quaternion.
 * @param {quat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
quat.exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions have approximately the same elements in the same position.
 *
 * @param {quat} a The first vector.
 * @param {quat} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
quat.equals = vec4.equals;

module.exports = quat;

},{"./common.js":2,"./mat3.js":5,"./vec3.js":9,"./vec4.js":10}],8:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */
var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new glMatrix.ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new glMatrix.ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to ceil
 * @returns {vec2} out
 */
vec2.ceil = function (out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out;
};

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to floor
 * @returns {vec2} out
 */
vec2.floor = function (out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out;
};

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to round
 * @returns {vec2} out
 */
vec2.round = function (out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to invert
 * @returns {vec2} out
 */
vec2.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec2.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec2.equals = function (a, b) {
    var a0 = a[0], a1 = a[1];
    var b0 = b[0], b1 = b[1];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)));
};

module.exports = vec2;

},{"./common.js":2}],9:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */
var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new glMatrix.ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new glMatrix.ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to ceil
 * @returns {vec3} out
 */
vec3.ceil = function (out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
};

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to floor
 * @returns {vec3} out
 */
vec3.floor = function (out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
};

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to round
 * @returns {vec3} out
 */
vec3.round = function (out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
vec3.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.hermite = function (out, a, b, c, d, t) {
  var factorTimes2 = t * t,
      factor1 = factorTimes2 * (2 * t - 3) + 1,
      factor2 = factorTimes2 * (t - 2) + t,
      factor3 = factorTimes2 * (t - 1),
      factor4 = factorTimes2 * (3 - 2 * t);
  
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  
  return out;
};

/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.bezier = function (out, a, b, c, d, t) {
  var inverseFactor = 1 - t,
      inverseFactorTimesTwo = inverseFactor * inverseFactor,
      factorTimes2 = t * t,
      factor1 = inverseFactorTimesTwo * inverseFactor,
      factor2 = 3 * t * inverseFactorTimesTwo,
      factor3 = 3 * factorTimes2 * inverseFactor,
      factor4 = factorTimes2 * t;
  
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  
  return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
    var z = (glMatrix.RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
};

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateX = function(out, a, b, c){
   var p = [], r=[];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[0];
	  r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
	  r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

  	return out;
};

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateY = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
  	r[1] = p[1];
  	r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateZ = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
  	r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
  	r[2] = p[2];
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
vec3.angle = function(a, b) {
   
    var tempA = vec3.fromValues(a[0], a[1], a[2]);
    var tempB = vec3.fromValues(b[0], b[1], b[2]);
 
    vec3.normalize(tempA, tempA);
    vec3.normalize(tempB, tempB);
 
    var cosine = vec3.dot(tempA, tempB);

    if(cosine > 1.0){
        return 0;
    } else {
        return Math.acos(cosine);
    }     
};

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec3.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec3.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2];
    var b0 = b[0], b1 = b[1], b2 = b[2];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)));
};

module.exports = vec3;

},{"./common.js":2}],10:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */
var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to ceil
 * @returns {vec4} out
 */
vec4.ceil = function (out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    out[3] = Math.ceil(a[3]);
    return out;
};

/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to floor
 * @returns {vec4} out
 */
vec4.floor = function (out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    out[3] = Math.floor(a[3]);
    return out;
};

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to round
 * @returns {vec4} out
 */
vec4.round = function (out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);
    out[3] = Math.round(a[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to invert
 * @returns {vec4} out
 */
vec4.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;
        out[3] = w * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = glMatrix.RANDOM();
    out[1] = glMatrix.RANDOM();
    out[2] = glMatrix.RANDOM();
    out[3] = glMatrix.RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    out[3] = a[3];
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {vec4} a The first vector.
 * @param {vec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec4.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec4} a The first vector.
 * @param {vec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec4.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)));
};

module.exports = vec4;

},{"./common.js":2}],11:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v1.12.4
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-05-20T17:17Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Support: Firefox 18+
// Can't be in strict mode, several libs including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
//"use strict";
var deletedIds = [];

var document = window.document;

var slice = deletedIds.slice;

var concat = deletedIds.concat;

var push = deletedIds.push;

var indexOf = deletedIds.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var support = {};



var
	version = "1.12.4",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android<4.1, IE<9
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: deletedIds.sort,
	splice: deletedIds.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = jQuery.isArray( copy ) ) ) ) {

					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray( src ) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject( src ) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type( obj ) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type( obj ) === "array";
	},

	isWindow: function( obj ) {
		/* jshint eqeqeq: false */
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {

		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		// adding 1 corrects loss of precision from parseFloat (#15100)
		var realStringObj = obj && obj.toString();
		return !jQuery.isArray( obj ) && ( realStringObj - parseFloat( realStringObj ) + 1 ) >= 0;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	isPlainObject: function( obj ) {
		var key;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {

			// Not own constructor property must be Object
			if ( obj.constructor &&
				!hasOwn.call( obj, "constructor" ) &&
				!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
		} catch ( e ) {

			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		if ( !support.ownFirst ) {
			for ( key in obj ) {
				return hasOwn.call( obj, key );
			}
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	},

	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {

			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data ); // jscs:ignore requireDotNotation
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android<4.1, IE<9
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( indexOf ) {
				return indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {

				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		while ( j < len ) {
			first[ i++ ] = second[ j++ ];
		}

		// Support: IE<9
		// Workaround casting of .length to NaN on otherwise arraylike objects (e.g., NodeLists)
		if ( len !== len ) {
			while ( second[ j ] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: function() {
		return +( new Date() );
	},

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

// JSHint would error on this code due to the Symbol not being defined in ES5.
// Defining this global in .jshintrc would create a danger of using the global
// unguarded in another place, it seems safer to just disable JSHint for these
// three lines.
/* jshint ignore: start */
if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = deletedIds[ Symbol.iterator ];
}
/* jshint ignore: end */

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: iOS 8.2 (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.2.1
 * http://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-10-17
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// http://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, nidselect, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rescape, "\\$&" );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					nidselect = ridentifier.test( nid ) ? "#" + nid : "[id='" + nid + "']";
					while ( i-- ) {
						groups[i] = nidselect + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, parent,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( (parent = document.defaultView) && parent.top !== parent ) {
		// Support: IE 11
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( document.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				return m ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibing-combinator selector` fails
			if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( (oldCache = uniqueCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = ( /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/ );



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		} );

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) > -1 ) !== not;
	} );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// init accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt( 0 ) === "<" &&
				selector.charAt( selector.length - 1 ) === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {

						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[ 2 ] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[ 0 ] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof root.ready !== "undefined" ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter( function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

				// Always skip document fragments
				if ( cur.nodeType < 11 && ( pos ?
					pos.index( cur ) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector( cur, selectors ) ) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[ 0 ], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem, this );
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				ret = jQuery.uniqueSort( ret );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				ret = ret.reverse();
			}
		}

		return this.pushStack( ret );
	};
} );
var rnotwhite = ( /\S+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( jQuery.isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = true;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks( "once memory" ), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks( "memory" ) ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];

							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this === promise ? newDefer.promise() : this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add( function() {

					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 ||
				( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred.
			// If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );

					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.progress( updateFunc( i, progressContexts, progressValues ) )
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
} );


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {

	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.triggerHandler ) {
			jQuery( document ).triggerHandler( "ready" );
			jQuery( document ).off( "ready" );
		}
	}
} );

/**
 * Clean-up method for dom ready events
 */
function detach() {
	if ( document.addEventListener ) {
		document.removeEventListener( "DOMContentLoaded", completed );
		window.removeEventListener( "load", completed );

	} else {
		document.detachEvent( "onreadystatechange", completed );
		window.detachEvent( "onload", completed );
	}
}

/**
 * The ready event handler and self cleanup method
 */
function completed() {

	// readyState === "complete" is good enough for us to call the dom ready in oldIE
	if ( document.addEventListener ||
		window.event.type === "load" ||
		document.readyState === "complete" ) {

		detach();
		jQuery.ready();
	}
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called
		// after the browser event has already occurred.
		// Support: IE6-10
		// Older IE sometimes signals "interactive" too soon
		if ( document.readyState === "complete" ||
			( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

			// Handle it asynchronously to allow scripts the opportunity to delay ready
			window.setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {

			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed );

		// If IE event model is used
		} else {

			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch ( e ) {}

			if ( top && top.doScroll ) {
				( function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {

							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll( "left" );
						} catch ( e ) {
							return window.setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				} )();
			}
		}
	}
	return readyList.promise( obj );
};

// Kick off the DOM ready check even if the user does not
jQuery.ready.promise();




// Support: IE<9
// Iteration over object's inherited properties before its own
var i;
for ( i in jQuery( support ) ) {
	break;
}
support.ownFirst = i === "0";

// Note: most support tests are defined in their respective modules.
// false until the test is run
support.inlineBlockNeedsLayout = false;

// Execute ASAP in case we need to set body.style.zoom
jQuery( function() {

	// Minified: var a,b,c,d
	var val, div, body, container;

	body = document.getElementsByTagName( "body" )[ 0 ];
	if ( !body || !body.style ) {

		// Return for frameset docs that don't have a body
		return;
	}

	// Setup
	div = document.createElement( "div" );
	container = document.createElement( "div" );
	container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
	body.appendChild( container ).appendChild( div );

	if ( typeof div.style.zoom !== "undefined" ) {

		// Support: IE<8
		// Check if natively block-level elements act like inline-block
		// elements when setting their display to 'inline' and giving
		// them layout
		div.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1";

		support.inlineBlockNeedsLayout = val = div.offsetWidth === 3;
		if ( val ) {

			// Prevent IE 6 from affecting layout for positioned elements #11048
			// Prevent IE from shrinking the body in IE 7 mode #12869
			// Support: IE<8
			body.style.zoom = 1;
		}
	}

	body.removeChild( container );
} );


( function() {
	var div = document.createElement( "div" );

	// Support: IE<9
	support.deleteExpando = true;
	try {
		delete div.test;
	} catch ( e ) {
		support.deleteExpando = false;
	}

	// Null elements to avoid leaks in IE.
	div = null;
} )();
var acceptData = function( elem ) {
	var noData = jQuery.noData[ ( elem.nodeName + " " ).toLowerCase() ],
		nodeType = +elem.nodeType || 1;

	// Do not set data on non-element DOM nodes because it will not be cleared (#8335).
	return nodeType !== 1 && nodeType !== 9 ?
		false :

		// Nodes accept data unless otherwise specified; rejection can be conditional
		!noData || noData !== true && elem.getAttribute( "classid" ) === noData;
};




var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :

					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[ name ] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}

function internalData( elem, name, data, pvt /* Internal Use Only */ ) {
	if ( !acceptData( elem ) ) {
		return;
	}

	var ret, thisCache,
		internalKey = jQuery.expando,

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( ( !id || !cache[ id ] || ( !pvt && !cache[ id ].data ) ) &&
		data === undefined && typeof name === "string" ) {
		return;
	}

	if ( !id ) {

		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			id = elem[ internalKey ] = deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {

		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		cache[ id ] = isNode ? {} : { toJSON: jQuery.noop };
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( typeof name === "string" ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !acceptData( elem ) ) {
		return;
	}

	var thisCache, i,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split( " " );
					}
				}
			} else {

				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[ i ] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( pvt ? !isEmptyDataObject( thisCache ) : !jQuery.isEmptyObject( thisCache ) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	} else if ( support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, undefined
	} else {
		cache[ id ] = undefined;
	}
}

jQuery.extend( {
	cache: {},

	// The following elements (space-suffixed to avoid Object.prototype collisions)
	// throw uncatchable exceptions if you attempt to set expando properties
	noData: {
		"applet ": true,
		"embed ": true,

		// ...but Flash objects (which have this classid) *can* handle expandos
		"object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[ jQuery.expando ] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Special expections of .data basically thwart jQuery.access,
		// so implement the relevant behavior ourselves

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE11+
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				jQuery.data( this, key );
			} );
		}

		return arguments.length > 1 ?

			// Sets one value
			this.each( function() {
				jQuery.data( this, key, value );
			} ) :

			// Gets one value
			// Try to fetch any internally stored data first
			elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : undefined;
	},

	removeData: function( key ) {
		return this.each( function() {
			jQuery.removeData( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object,
	// or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );


( function() {
	var shrinkWrapBlocksVal;

	support.shrinkWrapBlocks = function() {
		if ( shrinkWrapBlocksVal != null ) {
			return shrinkWrapBlocksVal;
		}

		// Will be changed later if needed.
		shrinkWrapBlocksVal = false;

		// Minified: var b,c,d
		var div, body, container;

		body = document.getElementsByTagName( "body" )[ 0 ];
		if ( !body || !body.style ) {

			// Test fired too early or in an unsupported environment, exit.
			return;
		}

		// Setup
		div = document.createElement( "div" );
		container = document.createElement( "div" );
		container.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
		body.appendChild( container ).appendChild( div );

		// Support: IE6
		// Check if elements with layout shrink-wrap their children
		if ( typeof div.style.zoom !== "undefined" ) {

			// Reset CSS: box-sizing; display; margin; border
			div.style.cssText =

				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
				"box-sizing:content-box;display:block;margin:0;border:0;" +
				"padding:1px;width:1px;zoom:1";
			div.appendChild( document.createElement( "div" ) ).style.width = "5px";
			shrinkWrapBlocksVal = div.offsetWidth !== 3;
		}

		body.removeChild( container );

		return shrinkWrapBlocksVal;
	};

} )();
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {

		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" ||
			!jQuery.contains( elem.ownerDocument, elem );
	};



function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted,
		scale = 1,
		maxIterations = 20,
		currentValue = tween ?
			function() { return tween.cur(); } :
			function() { return jQuery.css( elem, prop, "" ); },
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		do {

			// If previous iteration zeroed out, double until we get *something*.
			// Use string for doubling so we don't accidentally see scale as unchanged below
			scale = scale || ".5";

			// Adjust and apply
			initialInUnit = initialInUnit / scale;
			jQuery.style( elem, prop, initialInUnit + unit );

		// Update scale, tolerating zero or NaN from tween.cur()
		// Break the loop if scale is unchanged or perfect, or if we've just had enough.
		} while (
			scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
		);
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		length = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < length; i++ ) {
				fn(
					elems[ i ],
					key,
					raw ? value : value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			length ? fn( elems[ 0 ], key ) : emptyGet;
};
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([\w:-]+)/ );

var rscriptType = ( /^$|\/(?:java|ecma)script/i );

var rleadingWhitespace = ( /^\s+/ );

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|" +
		"details|dialog|figcaption|figure|footer|header|hgroup|main|" +
		"mark|meter|nav|output|picture|progress|section|summary|template|time|video";



function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}


( function() {
	var div = document.createElement( "div" ),
		fragment = document.createDocumentFragment(),
		input = document.createElement( "input" );

	// Setup
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// IE strips leading whitespace when .innerHTML is used
	support.leadingWhitespace = div.firstChild.nodeType === 3;

	// Make sure that tbody elements aren't automatically inserted
	// IE will insert them into empty tables
	support.tbody = !div.getElementsByTagName( "tbody" ).length;

	// Make sure that link elements get serialized correctly by innerHTML
	// This requires a wrapper element in IE
	support.htmlSerialize = !!div.getElementsByTagName( "link" ).length;

	// Makes sure cloning an html5 element does not cause problems
	// Where outerHTML is undefined, this still works
	support.html5Clone =
		document.createElement( "nav" ).cloneNode( true ).outerHTML !== "<:nav></:nav>";

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	input.type = "checkbox";
	input.checked = true;
	fragment.appendChild( input );
	support.appendChecked = input.checked;

	// Make sure textarea (and checkbox) defaultValue is properly cloned
	// Support: IE6-IE11+
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

	// #11217 - WebKit loses check when the name is after the checked attribute
	fragment.appendChild( div );

	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input = document.createElement( "input" );
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Cloned elements keep attachEvent handlers, we use addEventListener on IE9+
	support.noCloneEvent = !!div.addEventListener;

	// Support: IE<9
	// Since attributes and properties are the same in IE,
	// cleanData must set properties to undefined rather than use removeAttribute
	div[ jQuery.expando ] = 1;
	support.attributes = !div.getAttribute( jQuery.expando );
} )();


// We have to close these tags to support XHTML (#13200)
var wrapMap = {
	option: [ 1, "<select multiple='multiple'>", "</select>" ],
	legend: [ 1, "<fieldset>", "</fieldset>" ],
	area: [ 1, "<map>", "</map>" ],

	// Support: IE8
	param: [ 1, "<object>", "</object>" ],
	thead: [ 1, "<table>", "</table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
	// unless wrapped in a div with non-breaking characters in front of it.
	_default: support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>" ]
};

// Support: IE8-IE9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== "undefined" ?
			context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== "undefined" ?
				context.querySelectorAll( tag || "*" ) :
				undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context;
			( elem = elems[ i ] ) != null;
			i++
		) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; ( elem = elems[ i ] ) != null; i++ ) {
		jQuery._data(
			elem,
			"globalEval",
			!refElements || jQuery._data( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/,
	rtbody = /<tbody/i;

function fixDefaultChecked( elem ) {
	if ( rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

function buildFragment( elems, context, scripts, selection, ignored ) {
	var j, elem, contains,
		tmp, tag, tbody, wrap,
		l = elems.length,

		// Ensure a safe fragment
		safe = createSafeFragment( context ),

		nodes = [],
		i = 0;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( jQuery.type( elem ) === "object" ) {
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || safe.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;

				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Manually add leading whitespace removed by IE
				if ( !support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
					nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[ 0 ] ) );
				}

				// Remove IE's autoinserted <tbody> from table fragments
				if ( !support.tbody ) {

					// String was a <table>, *may* have spurious <tbody>
					elem = tag === "table" && !rtbody.test( elem ) ?
						tmp.firstChild :

						// String was a bare <thead> or <tfoot>
						wrap[ 1 ] === "<table>" && !rtbody.test( elem ) ?
							tmp :
							0;

					j = elem && elem.childNodes.length;
					while ( j-- ) {
						if ( jQuery.nodeName( ( tbody = elem.childNodes[ j ] ), "tbody" ) &&
							!tbody.childNodes.length ) {

							elem.removeChild( tbody );
						}
					}
				}

				jQuery.merge( nodes, tmp.childNodes );

				// Fix #12392 for WebKit and IE > 9
				tmp.textContent = "";

				// Fix #12392 for oldIE
				while ( tmp.firstChild ) {
					tmp.removeChild( tmp.firstChild );
				}

				// Remember the top-level container for proper cleanup
				tmp = safe.lastChild;
			}
		}
	}

	// Fix #11356: Clear elements from fragment
	if ( tmp ) {
		safe.removeChild( tmp );
	}

	// Reset defaultChecked for any radios and checkboxes
	// about to be appended to the DOM in IE 6/7 (#8060)
	if ( !support.appendChecked ) {
		jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
	}

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}

			continue;
		}

		contains = jQuery.contains( elem.ownerDocument, elem );

		// Append to fragment
		tmp = getAll( safe.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( contains ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	tmp = null;

	return safe;
}


( function() {
	var i, eventName,
		div = document.createElement( "div" );

	// Support: IE<9 (lack submit/change bubble), Firefox (lack focus(in | out) events)
	for ( i in { submit: true, change: true, focusin: true } ) {
		eventName = "on" + i;

		if ( !( support[ i ] = eventName in window ) ) {

			// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
			div.setAttribute( eventName, "t" );
			support[ i ] = div.attributes[ eventName ].expando === false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
} )();


var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE9
// See #13393 for more info
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" &&
					( !e || jQuery.event.triggered !== e.type ) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};

			// Add elem as a property of the handle fn to prevent a memory leak
			// with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] &&
				jQuery._data( cur, "handle" );

			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if (
				( !special._default ||
				 special._default.apply( eventPath.pop(), data ) === false
				) && acceptData( elem )
			) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {

						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Support (at least): Chrome, IE9
		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		//
		// Support: Firefox<=42+
		// Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
		if ( delegateCount && cur.nodeType &&
			( event.type !== "click" || isNaN( event.button ) || event.button < 1 ) ) {

			/* jshint eqeqeq: false */
			for ( ; cur != this; cur = cur.parentNode || this ) {
				/* jshint eqeqeq: true */

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && ( cur.disabled !== true || event.type !== "click" ) ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push( { elem: cur, handlers: matches } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: this, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Safari 6-8+
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: ( "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase " +
		"metaKey relatedTarget shiftKey target timeStamp view which" ).split( " " ),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split( " " ),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: ( "button buttons clientX clientY fromElement offsetX offsetY " +
			"pageX pageY screenX screenY toElement" ).split( " " ),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX +
					( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
					( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY +
					( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
					( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ?
					original.toElement :
					fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {

			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {

						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {

			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	// Piggyback on a donor event to simulate a different one
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true

				// Previously, `originalEvent: {}` was set here, so stopPropagation call
				// would not be triggered on donor event, since in our own
				// jQuery.event.stopPropagation function we had a check for existence of
				// originalEvent.stopPropagation method, so, consequently it would be a noop.
				//
				// Guard for simulated events was moved to jQuery.event.stopPropagation function
				// since `originalEvent` should point to the original event for the
				// constancy with other events and for more focused logic
			}
		);

		jQuery.event.trigger( e, null, elem );

		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {

		// This "if" is needed for plain objects
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event,
			// to properly expose it to GC
			if ( typeof elem[ name ] === "undefined" ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: IE < 9, Android < 4.0
				src.returnValue === false ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( !e || this.isSimulated ) {
			return;
		}

		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && e.stopImmediatePropagation ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://code.google.com/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

// IE submit delegation
if ( !support.submit ) {

	jQuery.event.special.submit = {
		setup: function() {

			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {

				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ?

						// Support: IE <=8
						// We use jQuery.prop instead of elem.form
						// to allow fixing the IE8 delegated submit issue (gh-2332)
						// by 3rd party polyfills/workarounds.
						jQuery.prop( elem, "form" ) :
						undefined;

				if ( form && !jQuery._data( form, "submit" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submitBubble = true;
					} );
					jQuery._data( form, "submit", true );
				}
			} );

			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {

			// If form was submitted by the user, bubble the event up the tree
			if ( event._submitBubble ) {
				delete event._submitBubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event );
				}
			}
		},

		teardown: function() {

			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !support.change ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {

				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._justChanged = true;
						}
					} );
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._justChanged && !event.isTrigger ) {
							this._justChanged = false;
						}

						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event );
					} );
				}
				return false;
			}

			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "change" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event );
						}
					} );
					jQuery._data( elem, "change", true );
				}
			} );
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger ||
				( elem.type !== "radio" && elem.type !== "checkbox" ) ) {

				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Support: Firefox
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome, Safari
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://code.google.com/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				jQuery._data( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					jQuery._removeData( doc, fix );
				} else {
					jQuery._data( doc, fix, attaches );
				}
			}
		};
	} );
}

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	},

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


var rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp( "<(?:" + nodeNames + ")[\\s/>]", "i" ),
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,

	// Support: IE 10-11, Edge 10240+
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement( "div" ) );

// Support: IE<8
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName( "tbody" )[ 0 ] ||
			elem.appendChild( elem.ownerDocument.createElement( "tbody" ) ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( jQuery.find.attr( elem, "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute( "type" );
	}
	return elem;
}

function cloneCopyEvent( src, dest ) {
	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( support.html5Clone && ( src.innerHTML && !jQuery.trim( dest.innerHTML ) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {

		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var first, node, hasScripts,
		scripts, doc, fragment,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		isFunction = jQuery.isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( isFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( isFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android<4.1, PhantomJS<2
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!jQuery._data( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl ) {
								jQuery._evalUrl( node.src );
							}
						} else {
							jQuery.globalEval(
								( node.text || node.textContent || node.innerHTML || "" )
									.replace( rcleanScript, "" )
							);
						}
					}
				}
			}

			// Fix #11809: Avoid leaking memory
			fragment = first = null;
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		elems = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = elems[ i ] ) != null; i++ ) {

		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( support.html5Clone || jQuery.isXMLDoc( elem ) ||
			!rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {

			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( ( !support.noCloneEvent || !support.noCloneChecked ) &&
				( elem.nodeType === 1 || elem.nodeType === 11 ) && !jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; ( node = srcElements[ i ] ) != null; ++i ) {

				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[ i ] ) {
					fixCloneNodeIssues( node, destElements[ i ] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; ( node = srcElements[ i ] ) != null; i++ ) {
					cloneCopyEvent( node, destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems, /* internal */ forceAcceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			attributes = support.attributes,
			special = jQuery.event.special;

		for ( ; ( elem = elems[ i ] ) != null; i++ ) {
			if ( forceAcceptData || acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// Support: IE<9
						// IE does not allow us to delete expando properties from nodes
						// IE creates expando attributes along with the property
						// IE does not have a removeAttribute function on Document nodes
						if ( !attributes && typeof elem.removeAttribute !== "undefined" ) {
							elem.removeAttribute( internalKey );

						// Webkit & Blink performance suffers when deleting properties
						// from DOM nodes, so set to undefined instead
						// https://code.google.com/p/chromium/issues/detail?id=378607
						} else {
							elem[ internalKey ] = undefined;
						}

						deletedIds.push( id );
					}
				}
			}
		}
	}
} );

jQuery.fn.extend( {

	// Keep domManip exposed until 3.0 (gh-2225)
	domManip: domManip,

	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append(
					( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value )
				);
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {

			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {

						// Remove element nodes and prevent memory leaks
						elem = this[ i ] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );


var iframe,
	elemdisplay = {

		// Support: Firefox
		// We have to pre-define these values for FF (#10227)
		HTML: "block",
		BODY: "block"
	};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */

// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		display = jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = ( iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" ) )
				.appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[ 0 ].contentWindow || iframe[ 0 ].contentDocument ).document;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}
var rmargin = ( /^margin/ );

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var documentElement = document.documentElement;



( function() {
	var pixelPositionVal, pixelMarginRightVal, boxSizingReliableVal,
		reliableHiddenOffsetsVal, reliableMarginRightVal, reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	div.style.cssText = "float:left;opacity:.5";

	// Support: IE<9
	// Make sure that element opacity exists (as opposed to filter)
	support.opacity = div.style.opacity === "0.5";

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	support.cssFloat = !!div.style.cssFloat;

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	container = document.createElement( "div" );
	container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
		"padding:0;margin-top:1px;position:absolute";
	div.innerHTML = "";
	container.appendChild( div );

	// Support: Firefox<29, Android 2.3
	// Vendor-prefix box-sizing
	support.boxSizing = div.style.boxSizing === "" || div.style.MozBoxSizing === "" ||
		div.style.WebkitBoxSizing === "";

	jQuery.extend( support, {
		reliableHiddenOffsets: function() {
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return reliableHiddenOffsetsVal;
		},

		boxSizingReliable: function() {

			// We're checking for pixelPositionVal here instead of boxSizingReliableVal
			// since that compresses better and they're computed together anyway.
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return boxSizingReliableVal;
		},

		pixelMarginRight: function() {

			// Support: Android 4.0-4.3
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return pixelMarginRightVal;
		},

		pixelPosition: function() {
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return pixelPositionVal;
		},

		reliableMarginRight: function() {

			// Support: Android 2.3
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return reliableMarginRightVal;
		},

		reliableMarginLeft: function() {

			// Support: IE <=8 only, Android 4.0 - 4.3 only, Firefox <=3 - 37
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return reliableMarginLeftVal;
		}
	} );

	function computeStyleTests() {
		var contents, divStyle,
			documentElement = document.documentElement;

		// Setup
		documentElement.appendChild( container );

		div.style.cssText =

			// Support: Android 2.3
			// Vendor-prefix box-sizing
			"-webkit-box-sizing:border-box;box-sizing:border-box;" +
			"position:relative;display:block;" +
			"margin:auto;border:1px;padding:1px;" +
			"top:1%;width:50%";

		// Support: IE<9
		// Assume reasonable values in the absence of getComputedStyle
		pixelPositionVal = boxSizingReliableVal = reliableMarginLeftVal = false;
		pixelMarginRightVal = reliableMarginRightVal = true;

		// Check for getComputedStyle so that this code is not run in IE<9.
		if ( window.getComputedStyle ) {
			divStyle = window.getComputedStyle( div );
			pixelPositionVal = ( divStyle || {} ).top !== "1%";
			reliableMarginLeftVal = ( divStyle || {} ).marginLeft === "2px";
			boxSizingReliableVal = ( divStyle || { width: "4px" } ).width === "4px";

			// Support: Android 4.0 - 4.3 only
			// Some styles come back with percentage values, even though they shouldn't
			div.style.marginRight = "50%";
			pixelMarginRightVal = ( divStyle || { marginRight: "4px" } ).marginRight === "4px";

			// Support: Android 2.3 only
			// Div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container (#3333)
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			contents = div.appendChild( document.createElement( "div" ) );

			// Reset CSS: box-sizing; display; margin; border; padding
			contents.style.cssText = div.style.cssText =

				// Support: Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
				"box-sizing:content-box;display:block;margin:0;border:0;padding:0";
			contents.style.marginRight = contents.style.width = "0";
			div.style.width = "1px";

			reliableMarginRightVal =
				!parseFloat( ( window.getComputedStyle( contents ) || {} ).marginRight );

			div.removeChild( contents );
		}

		// Support: IE6-8
		// First check that getClientRects works as expected
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.style.display = "none";
		reliableHiddenOffsetsVal = div.getClientRects().length === 0;
		if ( reliableHiddenOffsetsVal ) {
			div.style.display = "";
			div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
			div.childNodes[ 0 ].style.borderCollapse = "separate";
			contents = div.getElementsByTagName( "td" );
			contents[ 0 ].style.cssText = "margin:0;border:0;padding:0;display:none";
			reliableHiddenOffsetsVal = contents[ 0 ].offsetHeight === 0;
			if ( reliableHiddenOffsetsVal ) {
				contents[ 0 ].style.display = "";
				contents[ 1 ].style.display = "none";
				reliableHiddenOffsetsVal = contents[ 0 ].offsetHeight === 0;
			}
		}

		// Teardown
		documentElement.removeChild( container );
	}

} )();


var getStyles, curCSS,
	rposition = /^(top|right|bottom|left)$/;

if ( window.getComputedStyle ) {
	getStyles = function( elem ) {

		// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

	curCSS = function( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;

		computed = computed || getStyles( elem );

		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;

		// Support: Opera 12.1x only
		// Fall back to style even without computed
		// computed is undefined for elems on document fragments
		if ( ( ret === "" || ret === undefined ) && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		if ( computed ) {

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value"
			// instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values,
			// but width seems to be reliably pixels
			// this is against the CSSOM draft spec:
			// http://dev.w3.org/csswg/cssom/#resolved-values
			if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "";
	};
} else if ( documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, computed ) {
		var left, rs, rsLeft, ret,
			style = elem.style;

		computed = computed || getStyles( elem );
		ret = computed ? computed[ name ] : undefined;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are
		// proportional to the parent element instead
		// and we can't measure the parent instead because it
		// might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "" || "auto";
	};
}




function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var

		ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/i,

	// swappable if display is none or starts with table except
	// "table", "table-cell", or "table-caption"
	// see here for display values:
	// https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style;


// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in emptyStyle ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt( 0 ).toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {

			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] =
					jQuery._data( elem, "olddisplay", defaultDisplay( elem.nodeName ) );
			}
		} else {
			hidden = isHidden( elem );

			if ( display && display !== "none" || !hidden ) {
				jQuery._data(
					elem,
					"olddisplay",
					hidden ? display : jQuery.css( elem, "display" )
				);
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?

		// If we already have the right measurement, avoid augmentation
		4 :

		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {

		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {

			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {

			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = support.boxSizing &&
			jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {

		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test( val ) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox &&
			( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {

		// normalize float css property
		"float": support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] ||
			( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set. See: #7116
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			if ( type === "number" ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight
			// (for every problematic property) identical functions
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				// Support: IE
				// Swallow errors from 'invalid' CSS values (#5509)
				try {
					style[ name ] = value;
				} catch ( e ) {}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] ||
			( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}
		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&
					elem.offsetWidth === 0 ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, name, extra );
						} ) :
						getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					support.boxSizing &&
						jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
} );

if ( !support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {

			// IE uses filters for opacity
			return ropacity.test( ( computed && elem.currentStyle ?
				elem.currentStyle.filter :
				elem.style.filter ) || "" ) ?
					( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
					computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist -
			// attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule
				// or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			return swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return (
				parseFloat( curCSS( elem, "marginLeft" ) ) ||

				// Support: IE<=11+
				// Running getBoundingClientRect on a disconnected node in IE throws an error
				// Support: IE8 only
				// getClientRects() errors on disconnected elems
				( jQuery.contains( elem.ownerDocument, elem ) ?
					elem.getBoundingClientRect().left -
						swap( elem, { marginLeft: 0 }, function() {
							return elem.getBoundingClientRect().left;
						} ) :
					0
				)
			) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 &&
				( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
					jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// we're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = jQuery._data( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {

		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );

		// Test default display if display is currently "none"
		checkDisplay = display === "none" ?
			jQuery._data( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

		if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !support.inlineBlockNeedsLayout || defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";
			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !support.shrinkWrapBlocks() ) {
			anim.always( function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			} );
		}
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show
				// and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

		// Any non-fx value stops us from restoring the original display value
		} else {
			display = undefined;
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = jQuery._data( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done( function() {
				jQuery( elem ).hide();
			} );
		}
		anim.done( function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		} );
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}

	// If this is a noop like .hide().hide(), restore an overwritten display value
	} else if ( ( display === "none" ? defaultDisplay( elem.nodeName ) : display ) === "inline" ) {
		style.display = display;
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( jQuery.isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					jQuery.proxy( result.stop, result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnotwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ?
			jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = window.setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	window.clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var a,
		input = document.createElement( "input" ),
		div = document.createElement( "div" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	// Setup
	div = document.createElement( "div" );
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName( "a" )[ 0 ];

	// Support: Windows Web Apps (WWA)
	// `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "checkbox" );
	div.appendChild( input );

	a = div.getElementsByTagName( "a" )[ 0 ];

	// First batch of tests.
	a.style.cssText = "top:1px";

	// Test setAttribute on camelCase class.
	// If it works, we need attrFixes when doing get/setAttribute (ie6/7)
	support.getSetAttribute = div.className !== "t";

	// Get the style information from getAttribute
	// (IE uses .cssText instead)
	support.style = /top/.test( a.getAttribute( "style" ) );

	// Make sure that URLs aren't manipulated
	// (IE normalizes it by default)
	support.hrefNormalized = a.getAttribute( "href" ) === "/a";

	// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
	support.checkOn = !!input.value;

	// Make sure that a selected-by-default option has a working selected property.
	// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
	support.optSelected = opt.selected;

	// Tests for enctype support on a form (#6743)
	support.enctype = !!document.createElement( "form" ).enctype;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE8 only
	// Check if we can trust getAttribute("value")
	input = document.createElement( "input" );
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";
} )();


var rreturn = /\r/g,
	rspaces = /[\x20\t\r\n\f]+/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if (
					hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?

					// handle most common string cases
					ret.replace( rreturn, "" ) :

					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE10-11+
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					jQuery.trim( jQuery.text( elem ) ).replace( rspaces, " " );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ?
								!option.disabled :
								option.getAttribute( "disabled" ) === null ) &&
							( !option.parentNode.disabled ||
								!jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					if ( jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1 ) {

						// Support: IE6
						// When new option element is added to select box we need to
						// force reflow of newly added node in order to workaround delay
						// of initialization properties
						try {
							option.selected = optionSet = true;

						} catch ( _ ) {

							// Will be executed only in IE6
							option.scrollHeight;
						}

					} else {
						option.selected = false;
					}
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}

				return options;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = support.getSetAttribute,
	getSetInput = support.input;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					jQuery.nodeName( elem, "input" ) ) {

					// Setting the type on a radio button after the value resets the value in IE8-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {

					// Set corresponding property to false
					if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
						elem[ propName ] = false;

					// Support: IE<9
					// Also clear defaultChecked/defaultSelected (if appropriate)
					} else {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {

			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		} else {

			// Support: IE<9
			// Use defaultChecked and defaultSelected for oldIE
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
		attrHandle[ name ] = function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {

				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		};
	} else {
		attrHandle[ name ] = function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem[ jQuery.camelCase( "default-" + name ) ] ?
					name.toLowerCase() :
					null;
			}
		};
	}
} );

// fix oldIE attroperties
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {

				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {

				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = {
		set: function( elem, value, name ) {

			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					( ret = elem.ownerDocument.createAttribute( name ) )
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			if ( name === "value" || value === elem.getAttribute( name ) ) {
				return value;
			}
		}
	};

	// Some attributes are constructed with empty-string values when not defined
	attrHandle.id = attrHandle.name = attrHandle.coords =
		function( elem, name, isXML ) {
			var ret;
			if ( !isXML ) {
				return ( ret = elem.getAttributeNode( name ) ) && ret.value !== "" ?
					ret.value :
					null;
			}
		};

	// Fixing value retrieval on a button requires this module
	jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			if ( ret && ret.specified ) {
				return ret.value;
			}
		},
		set: nodeHook.set
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each( [ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		};
	} );
}

if ( !support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {

			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case sensitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}




var rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each( function() {

			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch ( e ) {}
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				return tabindex ?
					parseInt( tabindex, 10 ) :
					rfocusable.test( elem.nodeName ) ||
						rclickable.test( elem.nodeName ) && elem.href ?
							0 :
							-1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !support.hrefNormalized ) {

	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each( [ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	} );
}

// Support: Safari, IE9+
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		},
		set: function( elem ) {
			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );

// IE6/7 call enctype encoding
if ( !support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}




var rclass = /[\t\r\n\f]/g;

function getClass( elem ) {
	return jQuery.attr( elem, "class" ) || "";
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( typeof value === "string" && value ) {
			classes = value.match( rnotwhite ) || [];

			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 &&
					( " " + curValue + " " ).replace( rclass, " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( curValue !== finalValue ) {
						jQuery.attr( elem, "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		if ( typeof value === "string" && value ) {
			classes = value.match( rnotwhite ) || [];

			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 &&
					( " " + curValue + " " ).replace( rclass, " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( curValue !== finalValue ) {
						jQuery.attr( elem, "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( type === "string" ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = value.match( rnotwhite ) || [];

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// store className if set
					jQuery._data( this, "__className__", className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				jQuery.attr( this, "class",
					className || value === false ?
					"" :
					jQuery._data( this, "__className__" ) || ""
				);
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + getClass( elem ) + " " ).replace( rclass, " " )
					.indexOf( className ) > -1
			) {
				return true;
			}
		}

		return false;
	}
} );




// Return jQuery for attributes-only inclusion


jQuery.each( ( "blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );


var location = window.location;

var nonce = jQuery.now();

var rquery = ( /\?/ );



var rvalidtokens = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;

jQuery.parseJSON = function( data ) {

	// Attempt to parse using the native JSON parser first
	if ( window.JSON && window.JSON.parse ) {

		// Support: Android 2.3
		// Workaround failure to string-cast null input
		return window.JSON.parse( data + "" );
	}

	var requireNonComma,
		depth = null,
		str = jQuery.trim( data + "" );

	// Guard against invalid (and possibly dangerous) input by ensuring that nothing remains
	// after removing valid tokens
	return str && !jQuery.trim( str.replace( rvalidtokens, function( token, comma, open, close ) {

		// Force termination if we see a misplaced comma
		if ( requireNonComma && comma ) {
			depth = 0;
		}

		// Perform no more replacements after returning to outermost depth
		if ( depth === 0 ) {
			return token;
		}

		// Commas must not follow "[", "{", or ","
		requireNonComma = open || comma;

		// Determine new depth
		// array/object open ("[" or "{"): depth += true - false (increment)
		// array/object close ("]" or "}"): depth += false - true (decrement)
		// other cases ("," or primitive): depth += true - true (numeric cast)
		depth += !close - !open;

		// Remove this token
		return "";
	} ) ) ?
		( Function( "return " + str ) )() :
		jQuery.error( "Invalid JSON: " + data );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	try {
		if ( window.DOMParser ) { // Standard
			tmp = new window.DOMParser();
			xml = tmp.parseFromString( data, "text/xml" );
		} else { // IE
			xml = new window.ActiveXObject( "Microsoft.XMLDOM" );
			xml.async = "false";
			xml.loadXML( data );
		}
	} catch ( e ) {
		xml = undefined;
	}
	if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,

	// IE leaves an \r character at EOL
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Document location
	ajaxLocation = location.href,

	// Segment location into parts
	ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType.charAt( 0 ) === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) { // jscs:ignore requireDotNotation
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var

			// Cross-domain detection vars
			parts,

			// Loop variable
			i,

			// URL without anti-cache param
			cacheURL,

			// Response headers as string
			responseHeadersString,

			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,

			// Response headers
			responseHeaders,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// The jqXHR state
			state = 0,

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {

								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" )
			.replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( state === 2 ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );

				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		"throws": true
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapAll( html.call( this, i ) );
			} );
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			var wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function() {
		return this.parent().each( function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		} ).end();
	}
} );


function getDisplay( elem ) {
	return elem.style && elem.style.display || jQuery.css( elem, "display" );
}

function filterHidden( elem ) {

	// Disconnected elements are considered hidden
	if ( !jQuery.contains( elem.ownerDocument || document, elem ) ) {
		return true;
	}
	while ( elem && elem.nodeType === 1 ) {
		if ( getDisplay( elem ) === "none" || elem.type === "hidden" ) {
			return true;
		}
		elem = elem.parentNode;
	}
	return false;
}

jQuery.expr.filters.hidden = function( elem ) {

	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return support.reliableHiddenOffsets() ?
		( elem.offsetWidth <= 0 && elem.offsetHeight <= 0 &&
			!elem.getClientRects().length ) :
			filterHidden( elem );
};

jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {

			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					} ) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject !== undefined ?

	// Support: IE6-IE8
	function() {

		// XHR cannot access local files, always use ActiveX for that case
		if ( this.isLocal ) {
			return createActiveXHR();
		}

		// Support: IE 9-11
		// IE seems to error on cross-domain PATCH requests when ActiveX XHR
		// is used. In IE 9+ always use the native XHR.
		// Note: this condition won't catch Edge as it doesn't define
		// document.documentMode but it also doesn't support ActiveX so it won't
		// reach this code.
		if ( document.documentMode > 8 ) {
			return createStandardXHR();
		}

		// Support: IE<9
		// oldIE XHR does not support non-RFC2616 methods (#13240)
		// See http://msdn.microsoft.com/en-us/library/ie/ms536648(v=vs.85).aspx
		// and http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9
		// Although this check for six methods instead of eight
		// since IE also does not support "trace" and "connect"
		return /^(get|post|head|put|delete|options)$/i.test( this.type ) &&
			createStandardXHR() || createActiveXHR();
	} :

	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

var xhrId = 0,
	xhrCallbacks = {},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE<10
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if ( window.attachEvent ) {
	window.attachEvent( "onunload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	} );
}

// Determine support properties
support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport( function( options ) {

		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !options.crossDomain || support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr(),
						id = ++xhrId;

					// Open the socket
					xhr.open(
						options.type,
						options.url,
						options.async,
						options.username,
						options.password
					);

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {

						// Support: IE<9
						// IE's ActiveXObject throws a 'Type Mismatch' exception when setting
						// request header to a null-value.
						//
						// To keep consistent with other XHR implementations, cast the value
						// to string and ignore `undefined`.
						if ( headers[ i ] !== undefined ) {
							xhr.setRequestHeader( i, headers[ i ] + "" );
						}
					}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( options.hasContent && options.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, statusText, responses;

						// Was never called and is aborted or complete
						if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

							// Clean up
							delete xhrCallbacks[ id ];
							callback = undefined;
							xhr.onreadystatechange = jQuery.noop;

							// Abort manually if needed
							if ( isAbort ) {
								if ( xhr.readyState !== 4 ) {
									xhr.abort();
								}
							} else {
								responses = {};
								status = xhr.status;

								// Support: IE<10
								// Accessing binary-data responseText throws an exception
								// (#11426)
								if ( typeof xhr.responseText === "string" ) {
									responses.text = xhr.responseText;
								}

								// Firefox throws an exception when accessing
								// statusText for faulty cross-domain requests
								try {
									statusText = xhr.statusText;
								} catch ( e ) {

									// We normalize with Webkit giving an empty statusText
									statusText = "";
								}

								// Filter status for non standard behaviors

								// If the request is local and we have data: assume a success
								// (success with no data won't get notified, that's the best we
								// can do given current implementations)
								if ( !status && options.isLocal && !options.crossDomain ) {
									status = responses.text ? 200 : 404;

								// IE - #1450: sometimes returns 1223 when it should be 204
								} else if ( status === 1223 ) {
									status = 204;
								}
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, xhr.getAllResponseHeaders() );
						}
					};

					// Do send the request
					// `xhr.send` may raise an exception, but it will be
					// handled in jQuery.ajax (so no try/catch here)
					if ( !options.async ) {

						// If we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {

						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						window.setTimeout( callback );
					} else {

						// Register the callback, but delay it in case `xhr.send` throws
						// Add to the list of active xhr callbacks
						xhr.onreadystatechange = xhrCallbacks[ id ] = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	} );
}

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
	} catch ( e ) {}
}




// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery( "head" )[ 0 ] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement( "script" );

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// data: string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = jQuery.trim( url.slice( off, url.length ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};





/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			jQuery.inArray( "auto", [ curCSSTop, curCSSLeft ] ) > -1;

		// need to be able to calculate position if either top or left
		// is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var docElem, win,
			box = { top: 0, left: 0 },
			elem = this[ 0 ],
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// If we don't have gBCR, just use 0,0 rather than error
		// BlackBerry 5, iOS 3 (original iPhone)
		if ( typeof elem.getBoundingClientRect !== "undefined" ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
			left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
		// because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {

			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? ( prop in win ) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
} );

// Support: Safari<7-8+, Chrome<37-44+
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// getComputedStyle returns percent when specified for top/left/bottom/right
// rather than make the css module depend on the offset module, we just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// if curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
	function( defaultExtra, funcName ) {

		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {

					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only,
					// but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	} );
} );


jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	} );
}



var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in
// AMD (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}

return jQuery;
}));

},{}],12:[function(require,module,exports){
var CachedProperty = (function() {
    function CachedProperty(init_val, updateFn) {
	this.value = init_val;
	this.updateFn = updateFn;
	this.bound_properties = [];
    }
    CachedProperty.prototype.update = function() {
	this.value = this.updateFn.apply(null, arguments);
	for (var i=0; i<this.bound_properties.length; i++) {
	    this.bound_properties[i].update();
	}
    }
    CachedProperty.prototype.get = function() {
	return this.value;
    }
    CachedProperty.prototype.updateAndGet = function() {
	this.update();
	return this.get();
    }
    CachedProperty.prototype.addBoundProperty = function(cached_property) {
	this.bound_properties.push(cached_property);
    };
    return CachedProperty;
})();

module.exports = CachedProperty;
},{}],13:[function(require,module,exports){
module.exports = function(array, target_key, keyFn, return_closest_if_not_found) {
    var upper_excl = array.length;
    var lower_incl = 0;
    var middle;
    while (lower_incl < upper_excl) {
	middle = Math.floor((upper_excl + lower_incl) / 2);
	var middle_key = keyFn(array[middle]);
	if (middle_key === target_key) {
	    return middle;
	} else if (target_key > middle_key) {
	    lower_incl = middle + 1;
	} else if (target_key < middle_key) {
	    upper_excl = middle;
	} else {
	    // make sure we don't infinite loop in case anything's wrong
	    //	so that those three cases don't cover everything
	    return -1;
	}
    }
    if (return_closest_if_not_found) {
	return lower_incl-1;
    } else {
	return -1;
    }
}
},{}],14:[function(require,module,exports){
module.exports = function (str) {
    var ret = [0, 0, 0, 1];
    if (str[0] === "#") {
	// hex, convert to rgba
	var r = parseInt(str[1] + str[2], 16);
	var g = parseInt(str[3] + str[4], 16);
	var b = parseInt(str[5] + str[6], 16);
	str = 'rgba('+r+','+g+','+b+',1)';
    }
    var match = str.match(/^[\s]*rgba\([\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/);
    if (match && match.length === 5) {
	ret = [parseFloat(match[1]) / 255,
	    parseFloat(match[2]) / 255,
	    parseFloat(match[3]) / 255,
	    parseFloat(match[4])];
    }
    return ret;
};

},{}],15:[function(require,module,exports){
/*
 * Copyright (c) 2016 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


module.exports = function(sorted_list, valueFn, lower_inc_val, upper_exc_val) {
    // in: sorted_list, a list sorted in increasing order of valueFn
    //     valueFn, a function that takes an element of sorted_list and returns a number
    //     lower_inc and upper_ex: define a half-open interval [lower_inc, upper_exc)
    // out: boolean, true iff there are any elements whose image under valueFn is in [lower_inc, upper_exc)
    
    var test_lower_inc = 0;
    var test_upper_exc = sorted_list.length;
    var middle, middle_val;
    var ret = false;
    while (true) {
	if (test_lower_inc >= test_upper_exc) {
	    break;
	}
	middle = Math.floor((test_lower_inc + test_upper_exc) / 2)
	middle_val = valueFn(sorted_list[middle]);
	if (middle_val >= upper_exc_val) {
	    test_upper_exc = middle;
	} else if (middle_val < lower_inc_val) {
	    test_lower_inc = middle + 1;
	} else {
	    // otherwise, the middle value is inside the interval, 
	    // so there's at least one value inside the interval
	    ret = true;
	    break;
	}
    }
    return ret;
};
},{}],16:[function(require,module,exports){
// Colours for the oncoprint heatmap feature
// viridis comes from matplotlib's default colour set, created by Stéfan van der Walt and Nathaniel Smith

module.exports = {
  viridis: [
    [68.086020,1.242870,84.000825,1.000000],
  	[68.470050,2.449275,85.533885,1.000000],
  	[68.835720,3.729375,87.051645,1.000000],
  	[69.182775,5.085210,88.553595,1.000000],
  	[69.511470,6.518565,90.038715,1.000000],
  	[69.821295,8.031735,91.507515,1.000000],
  	[70.112760,9.626760,92.958465,1.000000],
  	[70.385610,11.262585,94.391820,1.000000],
  	[70.639590,12.837720,95.807325,1.000000],
  	[70.874955,14.362620,97.203705,1.000000],
  	[71.091705,15.846975,98.580960,1.000000],
  	[71.289330,17.298180,99.938835,1.000000],
  	[71.468085,18.721335,101.276565,1.000000],
  	[71.627970,20.121285,102.593895,1.000000],
  	[71.768730,21.501600,103.890570,1.000000],
  	[71.890620,22.864830,105.165825,1.000000],
  	[71.993385,24.213525,106.419405,1.000000],
  	[72.077280,25.549980,107.650800,1.000000],
  	[72.142050,26.875215,108.860010,1.000000],
  	[72.188205,28.191015,110.046270,1.000000],
  	[72.215235,29.498400,111.209325,1.000000],
  	[72.223395,30.798135,112.348920,1.000000],
  	[72.212685,32.091240,113.464800,1.000000],
  	[72.183360,33.378225,114.556455,1.000000],
  	[72.135420,34.659600,115.623885,1.000000],
  	[72.068865,35.936130,116.666835,1.000000],
  	[71.983950,37.207560,117.685050,1.000000],
  	[71.881185,38.474655,118.678275,1.000000],
  	[71.760060,39.737670,119.646255,1.000000],
  	[71.621340,40.996605,120.589245,1.000000],
  	[71.465025,42.251715,121.506990,1.000000],
  	[71.291370,43.502745,122.399235,1.000000],
  	[71.100630,44.749950,123.266235,1.000000],
  	[70.893060,45.993585,124.107735,1.000000],
  	[70.669170,47.233140,124.923990,1.000000],
  	[70.429470,48.468870,125.715255,1.000000],
  	[70.173705,49.700775,126.481275,1.000000],
  	[69.902640,50.928855,127.222305,1.000000],
  	[69.616530,52.152600,127.938855,1.000000],
  	[69.316140,53.372265,128.630670,1.000000],
  	[69.001725,54.587595,129.298260,1.000000],
  	[68.673540,55.798590,129.942135,1.000000],
  	[68.331840,57.004995,130.562040,1.000000],
  	[67.977900,58.206810,131.158995,1.000000],
  	[67.611975,59.403780,131.732745,1.000000],
  	[67.234065,60.595905,132.284310,1.000000],
  	[66.845190,61.782930,132.813435,1.000000],
  	[66.445605,62.965110,133.321140,1.000000],
  	[66.036075,64.141935,133.807680,1.000000],
  	[65.617110,65.313150,134.273565,1.000000],
  	[65.189475,66.479265,134.719560,1.000000],
  	[64.753425,67.639770,135.145665,1.000000],
  	[64.309470,68.794665,135.552645,1.000000],
  	[63.858375,69.943950,135.941265,1.000000],
  	[63.400395,71.087625,136.311780,1.000000],
  	[62.936805,72.225435,136.664955,1.000000],
  	[62.467860,73.357125,137.001300,1.000000],
  	[61.993815,74.483460,137.321580,1.000000],
  	[61.515435,75.603675,137.625795,1.000000],
  	[61.033230,76.718025,137.915220,1.000000],
  	[60.547455,77.826510,138.189855,1.000000],
  	[60.059130,78.929385,138.450720,1.000000],
  	[59.568765,80.026140,138.698070,1.000000],
  	[59.076870,81.117030,138.932670,1.000000],
  	[58.583445,82.202055,139.155030,1.000000],
  	[58.089510,83.281470,139.365660,1.000000],
  	[57.595065,84.355275,139.565070,1.000000],
  	[57.100875,85.423470,139.753515,1.000000],
  	[56.607195,86.486055,139.931760,1.000000],
  	[56.114535,87.543285,140.100315,1.000000],
  	[55.623150,88.595160,140.259690,1.000000],
  	[55.133550,89.641425,140.409885,1.000000],
  	[54.645990,90.682845,140.551920,1.000000],
  	[54.160725,91.719165,140.686050,1.000000],
  	[53.678265,92.750385,140.812530,1.000000],
  	[53.198865,93.776760,140.932125,1.000000],
  	[52.722780,94.798290,141.044835,1.000000],
  	[52.250265,95.815230,141.150915,1.000000],
  	[51.781065,96.827580,141.250875,1.000000],
  	[51.315945,97.835850,141.344970,1.000000],
  	[50.854650,98.839785,141.433710,1.000000],
  	[50.397180,99.839640,141.517095,1.000000],
  	[49.944300,100.835415,141.595380,1.000000],
  	[49.495500,101.827365,141.669075,1.000000],
  	[49.051035,102.815745,141.738180,1.000000],
  	[48.610905,103.800555,141.802695,1.000000],
  	[48.175365,104.782050,141.863130,1.000000],
  	[47.743905,105.760230,141.919485,1.000000],
  	[47.316780,106.735350,141.972015,1.000000],
  	[46.893990,107.707665,142.020720,1.000000],
  	[46.475280,108.676920,142.065600,1.000000],
  	[46.060395,109.643625,142.106910,1.000000],
  	[45.649845,110.607780,142.144650,1.000000],
  	[45.242865,111.569385,142.179075,1.000000],
  	[44.839455,112.528950,142.209675,1.000000],
  	[44.439870,113.486220,142.236960,1.000000],
  	[44.043345,114.441705,142.260675,1.000000],
  	[43.649880,115.395150,142.281075,1.000000],
  	[43.259730,116.346810,142.297650,1.000000],
  	[42.872130,117.296940,142.310910,1.000000],
  	[42.487335,118.245540,142.320345,1.000000],
  	[42.104835,119.192865,142.325955,1.000000],
  	[41.724375,120.138915,142.327740,1.000000],
  	[41.346210,121.083690,142.325700,1.000000],
  	[40.969575,122.027700,142.319325,1.000000],
  	[40.594470,122.970435,142.308615,1.000000],
  	[40.220895,123.912660,142.293315,1.000000],
  	[39.848850,124.854120,142.273680,1.000000],
  	[39.477825,125.794815,142.249200,1.000000],
  	[39.107820,126.735000,142.219620,1.000000],
  	[38.739090,127.674675,142.184685,1.000000],
  	[38.371380,128.614095,142.144650,1.000000],
  	[38.004945,129.553005,142.098750,1.000000],
  	[37.639785,130.491915,142.047495,1.000000],
  	[37.275900,131.430315,141.989865,1.000000],
  	[36.913545,132.368715,141.925860,1.000000],
  	[36.552465,133.307115,141.855225,1.000000],
  	[36.193425,134.245515,141.777705,1.000000],
  	[35.836680,135.183660,141.693045,1.000000],
  	[35.482485,136.122060,141.600990,1.000000],
  	[35.131350,137.060460,141.501030,1.000000],
  	[34.784040,137.999115,141.393165,1.000000],
  	[34.441830,138.937515,141.277395,1.000000],
  	[34.104465,139.876425,141.152955,1.000000],
  	[33.773220,140.815080,141.019590,1.000000],
  	[33.448860,141.754245,140.877045,1.000000],
  	[33.132915,142.693410,140.725320,1.000000],
  	[32.825895,143.632575,140.563395,1.000000],
  	[32.529840,144.571995,140.391780,1.000000],
  	[32.245515,145.511415,140.209455,1.000000],
  	[31.975470,146.451090,140.016930,1.000000],
  	[31.720725,147.390510,139.813185,1.000000],
  	[31.483065,148.330185,139.598475,1.000000],
  	[31.264530,149.269605,139.372035,1.000000],
  	[31.066905,150.209025,139.133865,1.000000],
  	[30.892740,151.148445,138.883455,1.000000],
  	[30.744075,152.087610,138.620805,1.000000],
  	[30.623460,153.026520,138.345150,1.000000],
  	[30.533190,153.965175,138.057000,1.000000],
  	[30.475560,154.903320,137.755590,1.000000],
  	[30.452865,155.840955,137.440410,1.000000],
  	[30.468165,156.778335,137.111460,1.000000],
  	[30.523245,157.714950,136.768485,1.000000],
  	[30.620655,158.651055,136.411230,1.000000],
  	[30.762690,159.586140,136.039440,1.000000],
  	[30.951900,160.520460,135.653115,1.000000],
  	[31.189560,161.454015,135.251490,1.000000],
  	[31.478220,162.386295,134.834565,1.000000],
  	[31.818900,163.317555,134.402340,1.000000],
  	[32.213130,164.247285,133.954305,1.000000],
  	[32.662185,165.175995,133.490205,1.000000],
  	[33.167085,166.102920,133.010040,1.000000],
  	[33.728340,167.028570,132.513555,1.000000],
  	[34.346460,167.952180,132.000495,1.000000],
  	[35.021445,168.874260,131.470605,1.000000],
  	[35.753550,169.794045,130.923885,1.000000],
  	[36.542265,170.712045,130.359825,1.000000],
  	[37.387080,171.627750,129.778680,1.000000],
  	[38.287740,172.540905,129.180195,1.000000],
  	[39.242970,173.451765,128.563860,1.000000],
  	[40.252005,174.360075,127.929930,1.000000],
  	[41.314080,175.265580,127.277895,1.000000],
  	[42.427665,176.168280,126.608010,1.000000],
  	[43.591740,177.067920,125.919765,1.000000],
  	[44.805285,177.964500,125.213415,1.000000],
  	[46.066515,178.857510,124.488195,1.000000],
  	[47.374665,179.747205,123.744615,1.000000],
  	[48.727950,180.633330,122.982420,1.000000],
  	[50.125605,181.515885,122.201355,1.000000],
  	[51.565845,182.394360,121.401420,1.000000],
  	[53.047650,183.268755,120.582615,1.000000],
  	[54.570000,184.139070,119.744940,1.000000],
  	[56.131620,185.004795,118.887630,1.000000],
  	[57.731235,185.866440,118.011195,1.000000],
  	[59.367825,186.722985,117.115635,1.000000],
  	[61.040370,187.574940,116.200440,1.000000],
  	[62.747850,188.422050,115.266120,1.000000],
  	[64.489245,189.263805,114.312420,1.000000],
  	[66.263535,190.100460,113.339085,1.000000],
  	[68.069955,190.931505,112.346115,1.000000],
  	[69.907995,191.756940,111.333255,1.000000],
  	[71.776635,192.576765,110.300760,1.000000],
  	[73.674855,193.390470,109.248630,1.000000],
  	[75.602145,194.198055,108.176865,1.000000],
  	[77.557740,194.999520,107.085465,1.000000],
  	[79.540875,195.794610,105.974430,1.000000],
  	[81.551295,196.583070,104.843760,1.000000],
  	[83.587980,197.364900,103.693200,1.000000],
  	[85.650675,198.139590,102.522495,1.000000],
  	[87.738870,198.907395,101.332155,1.000000],
  	[89.851800,199.667805,100.122180,1.000000],
  	[91.988955,200.420820,98.892570,1.000000],
  	[94.149570,201.166440,97.643070,1.000000],
  	[96.333645,201.904155,96.374445,1.000000],
  	[98.540415,202.634220,95.085930,1.000000],
  	[100.769370,203.356125,93.778035,1.000000],
  	[103.020255,204.070125,92.450760,1.000000],
  	[105.292815,204.775455,91.103595,1.000000],
  	[107.586540,205.472370,89.737050,1.000000],
  	[109.900665,206.160615,88.351380,1.000000],
  	[112.234935,206.840190,86.946585,1.000000],
  	[114.588840,207.510840,85.522920,1.000000],
  	[116.961870,208.172565,84.080385,1.000000],
  	[119.353515,208.824855,82.619490,1.000000],
  	[121.763520,209.468220,81.139725,1.000000],
  	[124.191630,210.101895,79.641855,1.000000],
  	[126.636825,210.725880,78.126135,1.000000],
  	[129.099105,211.340430,76.592310,1.000000],
  	[131.577960,211.945290,75.041145,1.000000],
  	[134.072880,212.540205,73.472385,1.000000],
  	[136.583355,213.125175,71.886540,1.000000],
  	[139.108620,213.699945,70.284630,1.000000],
  	[141.648420,214.264770,68.666655,1.000000],
  	[144.201990,214.819650,67.033635,1.000000],
  	[146.768565,215.364330,65.385825,1.000000],
  	[149.347890,215.898555,63.723735,1.000000],
  	[151.938945,216.422835,62.048895,1.000000],
  	[154.541475,216.936915,60.361560,1.000000],
  	[157.154715,217.440795,58.663260,1.000000],
  	[159.777645,217.934475,56.955015,1.000000],
  	[162.410010,218.418210,55.238100,1.000000],
  	[165.050535,218.892000,53.514555,1.000000],
  	[167.698710,219.355845,51.785910,1.000000],
  	[170.353770,219.809745,50.054715,1.000000],
  	[173.014695,220.254210,48.323265,1.000000],
  	[175.680720,220.689240,46.594875,1.000000],
  	[178.350825,221.114835,44.872605,1.000000],
  	[181.023990,221.531505,43.160535,1.000000],
  	[183.699705,221.939250,41.463765,1.000000],
  	[186.376695,222.338580,39.787395,1.000000],
  	[189.053940,222.729495,38.138055,1.000000],
  	[191.730420,223.112505,36.523140,1.000000],
  	[194.405115,223.488120,34.951320,1.000000],
  	[197.077260,223.856340,33.432795,1.000000],
  	[199.745325,224.217675,31.978275,1.000000],
  	[202.408800,224.572890,30.601275,1.000000],
  	[205.066410,224.921730,29.316075,1.000000],
  	[207.716880,225.265215,28.138485,1.000000],
  	[210.359700,225.603600,27.085335,1.000000],
  	[212.993850,225.937395,26.174730,1.000000],
  	[215.618055,226.267110,25.424010,1.000000],
  	[218.231550,226.593255,24.850260,1.000000],
  	[220.833315,226.916340,24.468015,1.000000],
  	[223.422840,227.236875,24.288750,1.000000],
  	[225.999105,227.555370,24.320370,1.000000],
  	[228.561600,227.872080,24.565425,1.000000],
  	[231.109305,228.188025,25.021875,1.000000],
  	[233.641710,228.503205,25.682835,1.000000],
  	[236.157030,228.819150,26.538105,1.000000],
  	[238.655520,229.135350,27.573405,1.000000],
  	[241.137180,229.452825,28.773690,1.000000],
  	[243.601500,229.771575,30.122640,1.000000],
  	[246.047970,230.092365,31.604955,1.000000],
  	[248.476335,230.415450,33.204825,1.000000],
  	[250.886340,230.741085,34.908735,1.000000],
  	[253.278240,231.070035,36.703680,1.000000],
  ],
  inferno: [
    [0.372810,0.118830,3.535830,1.000000],
    [0.578085,0.323850,4.735350,1.000000],
    [0.841245,0.573495,6.180945,1.000000],
    [1.159485,0.864960,7.881795,1.000000],
    [1.531530,1.196460,9.832290,1.000000],
    [1.957380,1.564680,11.943180,1.000000],
    [2.438055,1.966815,14.061465,1.000000],
    [2.974065,2.401335,16.182300,1.000000],
    [3.568725,2.862375,18.324810,1.000000],
    [4.223055,3.349680,20.471910,1.000000],
    [4.940115,3.858915,22.635585,1.000000],
    [5.723985,4.385745,24.818385,1.000000],
    [6.577215,4.929405,27.012150,1.000000],
    [7.505160,5.483265,29.228355,1.000000],
    [8.513175,6.044010,31.466235,1.000000],
    [9.605340,6.609855,33.719160,1.000000],
    [10.774515,7.175445,35.990955,1.000000],
    [11.963325,7.732620,38.291820,1.000000],
    [13.169220,8.280870,40.609770,1.000000],
    [14.394495,8.815095,42.945570,1.000000],
    [15.641700,9.330450,45.298710,1.000000],
    [16.914405,9.818520,47.675310,1.000000],
    [18.214395,10.274970,50.070270,1.000000],
    [19.542435,10.685775,52.478745,1.000000],
    [20.900310,11.048640,54.898695,1.000000],
    [22.289805,11.361780,57.327315,1.000000],
    [23.712450,11.623665,59.761290,1.000000],
    [25.169010,11.832510,62.195520,1.000000],
    [26.660505,11.987040,64.624650,1.000000],
    [28.186680,12.086745,67.042560,1.000000],
    [29.747280,12.131370,69.441855,1.000000],
    [31.341540,12.121680,71.814120,1.000000],
    [32.967675,12.059715,74.150940,1.000000],
    [34.623390,11.948280,76.442880,1.000000],
    [36.306390,11.791710,78.681015,1.000000],
    [38.013615,11.594340,80.856675,1.000000],
    [39.741750,11.362545,82.961190,1.000000],
    [41.485695,11.106270,84.985635,1.000000],
    [43.241625,10.834695,86.922870,1.000000],
    [45.005715,10.557510,88.768305,1.000000],
    [46.774395,10.283895,90.517605,1.000000],
    [48.543585,10.023795,92.168985,1.000000],
    [50.310735,9.792000,93.721425,1.000000],
    [52.073295,9.596160,95.175690,1.000000],
    [53.829225,9.442650,96.533565,1.000000],
    [55.576995,9.336825,97.798110,1.000000],
    [57.314565,9.283275,98.972895,1.000000],
    [59.042190,9.283275,100.062000,1.000000],
    [60.759615,9.338355,101.070015,1.000000],
    [62.466585,9.449025,102.001785,1.000000],
    [64.163100,9.614775,102.861390,1.000000],
    [65.849670,9.835605,103.653675,1.000000],
    [67.526550,10.109985,104.382975,1.000000],
    [69.193485,10.435110,105.053880,1.000000],
    [70.851750,10.800015,105.669960,1.000000],
    [72.501855,11.202915,106.235040,1.000000],
    [74.144565,11.639220,106.752435,1.000000],
    [75.780390,12.104850,107.225205,1.000000],
    [77.409840,12.595980,107.656410,1.000000],
    [79.033425,13.108785,108.048855,1.000000],
    [80.651910,13.639950,108.404580,1.000000],
    [82.265550,14.186670,108.726135,1.000000],
    [83.874855,14.745885,109.015305,1.000000],
    [85.480335,15.315300,109.273620,1.000000],
    [87.082500,15.892875,109.503375,1.000000],
    [88.681605,16.477080,109.705335,1.000000],
    [90.278160,17.065875,109.881030,1.000000],
    [91.872420,17.657985,110.031735,1.000000],
    [93.464895,18.252645,110.158470,1.000000],
    [95.055840,18.848325,110.262000,1.000000],
    [96.645255,19.444515,110.343345,1.000000],
    [98.233140,20.040705,110.403525,1.000000],
    [99.820515,20.636385,110.442795,1.000000],
    [101.406870,21.230535,110.461665,1.000000],
    [102.992970,21.822900,110.460645,1.000000],
    [104.578815,22.413480,110.439990,1.000000],
    [106.164405,23.001765,110.400465,1.000000],
    [107.749995,23.587755,110.342070,1.000000],
    [109.335840,24.171450,110.265060,1.000000],
    [110.921685,24.752595,110.169945,1.000000],
    [112.507785,25.331190,110.056470,1.000000],
    [114.094140,25.907235,109.925400,1.000000],
    [115.681005,26.481240,109.776990,1.000000],
    [117.268125,27.052695,109.610730,1.000000],
    [118.855500,27.622110,109.426875,1.000000],
    [120.443640,28.189485,109.225170,1.000000],
    [122.032290,28.754820,109.006125,1.000000],
    [123.621195,29.318370,108.769740,1.000000],
    [125.210610,29.880645,108.515760,1.000000],
    [126.800535,30.441645,108.244440,1.000000],
    [128.390715,31.001625,107.955780,1.000000],
    [129.981150,31.561095,107.649780,1.000000],
    [131.571585,32.119800,107.326185,1.000000],
    [133.162530,32.678250,106.984995,1.000000],
    [134.753220,33.236955,106.626210,1.000000],
    [136.344165,33.796170,106.250085,1.000000],
    [137.934600,34.355895,105.856365,1.000000],
    [139.525035,34.916895,105.445305,1.000000],
    [141.114960,35.479170,105.016395,1.000000],
    [142.704120,36.043230,104.569890,1.000000],
    [144.292770,36.609585,104.105790,1.000000],
    [145.880655,37.178235,103.624095,1.000000],
    [147.467520,37.749945,103.124805,1.000000],
    [149.052855,38.324970,102.608175,1.000000],
    [150.637170,38.903565,102.073950,1.000000],
    [152.219700,39.486240,101.521875,1.000000],
    [153.800445,40.073505,100.952205,1.000000],
    [155.379150,40.665870,100.365195,1.000000],
    [156.955815,41.263335,99.760845,1.000000],
    [158.529675,41.866920,99.139155,1.000000],
    [160.100985,42.476625,98.500380,1.000000],
    [161.669490,43.092960,97.844520,1.000000],
    [163.234425,43.716690,97.171575,1.000000],
    [164.796300,44.348070,96.481545,1.000000],
    [166.354095,44.987355,95.774430,1.000000],
    [167.908065,45.635310,95.050740,1.000000],
    [169.457700,46.292445,94.310730,1.000000],
    [171.002745,46.959015,93.554145,1.000000],
    [172.542690,47.635785,92.781495,1.000000],
    [174.077280,48.322755,91.993035,1.000000],
    [175.606515,49.020945,91.188765,1.000000],
    [177.129885,49.730355,90.368940,1.000000],
    [178.646880,50.452005,89.533815,1.000000],
    [180.157500,51.185640,88.683135,1.000000],
    [181.660980,51.932280,87.817665,1.000000],
    [183.157320,52.692180,86.937405,1.000000],
    [184.646265,53.465850,86.043120,1.000000],
    [186.126795,54.253545,85.134555,1.000000],
    [187.599165,55.056030,84.212475,1.000000],
    [189.062865,55.873560,83.276880,1.000000],
    [190.517385,56.706390,82.328280,1.000000],
    [191.962470,57.555030,81.366675,1.000000],
    [193.397610,58.419735,80.392830,1.000000],
    [194.822550,59.301270,79.406745,1.000000],
    [196.236780,60.199635,78.408675,1.000000],
    [197.640045,61.115085,77.399130,1.000000],
    [199.031835,62.048385,76.378365,1.000000],
    [200.411895,62.999280,75.346635,1.000000],
    [201.779715,63.968280,74.304450,1.000000],
    [203.134785,64.955640,73.252320,1.000000],
    [204.477105,65.961870,72.190245,1.000000],
    [205.805910,66.986460,71.118990,1.000000],
    [207.120945,68.030430,70.038555,1.000000],
    [208.421955,69.093270,68.949450,1.000000],
    [209.708430,70.175235,67.851675,1.000000],
    [210.979860,71.276835,66.746250,1.000000],
    [212.236245,72.397815,65.632665,1.000000],
    [213.477075,73.538175,64.511940,1.000000],
    [214.702095,74.697915,63.383820,1.000000],
    [215.910795,75.877545,62.248815,1.000000],
    [217.102920,77.076300,61.107180,1.000000],
    [218.277960,78.294690,59.958915,1.000000],
    [219.435915,79.532460,58.804530,1.000000],
    [220.576530,80.789610,57.644025,1.000000],
    [221.699295,82.065885,56.477910,1.000000],
    [222.803955,83.361030,55.305930,1.000000],
    [223.890255,84.675300,54.128340,1.000000],
    [224.957940,86.008185,52.945140,1.000000],
    [226.007010,87.359430,51.756840,1.000000],
    [227.036955,88.729035,50.562930,1.000000],
    [228.047775,90.116745,49.363920,1.000000],
    [229.038960,91.522305,48.159300,1.000000],
    [230.010765,92.945460,46.949580,1.000000],
    [230.962425,94.385700,45.734250,1.000000],
    [231.894450,95.843280,44.513565,1.000000],
    [232.806330,97.317180,43.287525,1.000000],
    [233.697810,98.807655,42.055620,1.000000],
    [234.569145,100.314195,40.817850,1.000000],
    [235.419825,101.836545,39.574215,1.000000],
    [236.249850,103.374195,38.324460,1.000000],
    [237.059220,104.927145,37.068585,1.000000],
    [237.847935,106.494885,35.806335,1.000000],
    [238.615485,108.076905,34.537200,1.000000],
    [239.362125,109.673205,33.261690,1.000000],
    [240.087855,111.283275,31.979295,1.000000],
    [240.792675,112.906860,30.690270,1.000000],
    [241.476075,114.543705,29.394360,1.000000],
    [242.138310,116.193300,28.091820,1.000000],
    [242.779125,117.855390,26.782905,1.000000],
    [243.399030,119.529720,25.467870,1.000000],
    [243.997260,121.215780,24.147225,1.000000],
    [244.574070,122.913570,22.822245,1.000000],
    [245.129715,124.622580,21.493695,1.000000],
    [245.663685,126.342810,20.163615,1.000000],
    [246.176235,128.073495,18.834045,1.000000],
    [246.667110,129.814890,17.508045,1.000000],
    [247.136565,131.566230,16.189440,1.000000],
    [247.584345,133.327515,14.883585,1.000000],
    [248.010450,135.098490,13.597620,1.000000],
    [248.414880,136.878900,12.339960,1.000000],
    [248.797635,138.668490,11.122590,1.000000],
    [249.158460,140.466750,9.957750,1.000000],
    [249.497610,142.273935,8.907405,1.000000],
    [249.814830,144.089535,8.009295,1.000000],
    [250.110120,145.913295,7.269540,1.000000],
    [250.383225,147.744960,6.693750,1.000000],
    [250.634655,149.584530,6.288555,1.000000],
    [250.863645,151.431495,6.061350,1.000000],
    [251.070705,153.286110,6.019530,1.000000],
    [251.255325,155.147610,6.171510,1.000000],
    [251.417760,157.016250,6.525960,1.000000],
    [251.558010,158.891775,7.092570,1.000000],
    [251.675820,160.773675,7.881540,1.000000],
    [251.770935,162.661950,8.903580,1.000000],
    [251.843610,164.556600,10.170930,1.000000],
    [251.893845,166.457115,11.623155,1.000000],
    [251.921130,168.363750,13.196250,1.000000],
    [251.925975,170.275740,14.873895,1.000000],
    [251.907870,172.193085,16.640535,1.000000],
    [251.867070,174.115785,18.484695,1.000000],
    [251.803320,176.043330,20.397450,1.000000],
    [251.716620,177.975720,22.371405,1.000000],
    [251.606970,179.912700,24.401970,1.000000],
    [251.474625,181.854015,26.485065,1.000000],
    [251.319330,183.799410,28.618395,1.000000],
    [251.140575,185.748885,30.800175,1.000000],
    [250.939125,187.702185,33.029385,1.000000],
    [250.714980,189.658290,35.305515,1.000000],
    [250.468140,191.617710,37.629075,1.000000],
    [250.199115,193.579425,40.000065,1.000000],
    [249.908160,195.543435,42.420015,1.000000],
    [249.595530,197.508975,44.889435,1.000000],
    [249.261735,199.475790,47.410365,1.000000],
    [248.907540,201.443370,49.984590,1.000000],
    [248.532690,203.411460,52.614660,1.000000],
    [248.137440,205.379295,55.303635,1.000000],
    [247.724340,207.346110,58.052790,1.000000],
    [247.294665,209.310375,60.864930,1.000000],
    [246.850455,211.271325,63.742860,1.000000],
    [246.391965,213.228705,66.691170,1.000000],
    [245.920470,215.181240,69.714705,1.000000],
    [245.441835,217.126380,72.814230,1.000000],
    [244.959630,219.062595,75.992550,1.000000],
    [244.473600,220.989120,79.259100,1.000000],
    [243.992670,222.902895,82.613370,1.000000],
    [243.524235,224.800095,86.056125,1.000000],
    [243.069825,226.680210,89.599095,1.000000],
    [242.644230,228.537630,93.234885,1.000000],
    [242.254590,230.369295,96.969105,1.000000],
    [241.914165,232.170615,100.798695,1.000000],
    [241.636470,233.936745,104.719575,1.000000],
    [241.436295,235.662840,108.725115,1.000000],
    [241.329960,237.344055,112.803585,1.000000],
    [241.332765,238.975545,116.940960,1.000000],
    [241.460265,240.553740,121.117350,1.000000],
    [241.723935,242.076090,125.313630,1.000000],
    [242.133975,243.541065,129.504300,1.000000],
    [242.693700,244.949685,133.671765,1.000000],
    [243.404895,246.303480,137.792055,1.000000],
    [244.263480,247.605765,141.850125,1.000000],
    [245.262060,248.860620,145.840875,1.000000],
    [246.393495,250.072890,149.737530,1.000000],
    [247.646310,251.246910,153.549270,1.000000],
    [249.010305,252.387015,157.273800,1.000000],
    [250.475535,253.497795,160.909335,1.000000],
    [252.032310,254.582820,164.455620,1.000000],
  ]
}

},{}],17:[function(require,module,exports){
var Oncoprint = require('./oncoprint.js');
if (window) {
	window.Oncoprint = Oncoprint;
}
module.exports = Oncoprint;
},{"./oncoprint.js":19}],18:[function(require,module,exports){
module.exports = function (tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
	if (attrs.hasOwnProperty(k)) {
	    el.setAttribute(k, attrs[k]);
	}
    }
    return el;
};
},{}],19:[function(require,module,exports){
require('./polyfill.js');

var OncoprintModel = require('./oncoprintmodel.js');
var OncoprintWebGLCellView = require('./oncoprintwebglcellview.js');
var OncoprintLabelView = require('./oncoprintlabelview.js');
var OncoprintRuleSet = require('./oncoprintruleset.js');
var OncoprintTrackOptionsView = require('./oncoprinttrackoptionsview.js');
var OncoprintLegendView = require('./oncoprintlegendrenderer.js');//TODO: rename
var OncoprintToolTip = require('./oncoprinttooltip.js');
var OncoprintTrackInfoView = require('./oncoprinttrackinfoview.js');
var OncoprintMinimapView = require('./oncoprintminimapview.js');

var svgfactory = require('./svgfactory.js');
var $ = require('jquery');

var clamp = function(val, lower, upper) {
    return Math.min(Math.max(val, lower), upper);
};

var Oncoprint = (function () {
    // this is the controller
    var nextTrackId = (function () {
	var ctr = 0;
	return function () {
	    ctr += 1;
	    return ctr;
	}
    })();
    function Oncoprint(ctr_selector, width) {
	var self = this;
	this.ctr_selector = ctr_selector;
	
	var $ctr = $('<span></span>').css({'position':'relative', 'display':'inline-block'}).appendTo(ctr_selector);
	var $oncoprint_ctr = $('<div></div>')
			    .css({'position':'relative', 'display':'inline-block'})
			    .appendTo($ctr);
		    
	var $tooltip_ctr = $('<span></span>').css({'position':'absolute'}).appendTo(ctr_selector);
	var $legend_ctr = $('<div></div>').css({'position':'absolute', 'display':'inline-block', 'top':0, 'left':0, 'min-height':1})
			    .appendTo($ctr);
	
	var $label_canvas = $('<canvas></canvas>')
			    .css({'display':'inline-block', 
				'position':'absolute', 
				'left':'0px', 
				'top':'0px'})
			    .addClass("noselect")
			    .attr({'width':'150', 'height':'250'});
		    
	var $track_options_div = $('<div></div>')
				.css({'position':'absolute', 
					'left':'150px', 
					'top':'0px'})
				.addClass("noselect")
				.attr({'width':'50', 'height':'250'});
			
	var $legend_div = $('<div></div>')
			    .css({'position':'absolute', 
				    'top':'250px',
				    'min-height':1})
			    .addClass("noselect");
	
	var $cell_div = $('<div>')
			.css({'width':width,
			    'display':'inline-block', 
			    'position':'absolute', 
			    'left':'200px', 
			    'top':'0px'})
			.addClass("noselect");
		
	var $cell_canvas = $('<canvas></canvas>')
			    .attr({'width':'0px', 'height':'0px'})
			    .css({'position':'absolute', 'top':'0px', 'left':'0px'})
			    .addClass("noselect");
		    
	var $dummy_scroll_div = $('<div>')
				.css({'position':'absolute',
				    'overflow-x':'scroll',
				    'overflow-y':'scroll',
				    'top':'0', 
				    'left':'0px', 
				    'height':'1px',
				});
	
	var $dummy_scroll_div_contents = $('<div>').appendTo($dummy_scroll_div);
				
	var $cell_overlay_canvas = $('<canvas></canvas>')
				    .attr({'width':'0px', 'height':'0px'})
				    .css({'position':'absolute', 
					    'top':'0px', 
					    'left':'0px'})
				    .addClass("noselect");
			    
	var $track_info_div = $('<div>')
				.css({'position':'absolute'});
			
	var $minimap_div = $('<div>').css({'position':'absolute', 'outline':'solid 1px black', 'display': 'none'}).addClass("noselect");
	
	var $minimap_canvas = $('<canvas></canvas>')
				    .attr('width', 300)
				    .attr('height', 300)
				    .css({'position':'absolute', 'top':'0px', 'left':'0px', 'z-index':0})
				    .addClass("noselect");
	var $minimap_overlay_canvas = $('<canvas></canvas>')
				    .attr('width', 300)
				    .attr('height', 300)
				    .css({'position': 'absolute', 'top':'0px', 'left':'0px', 'z-index':1})
				    .addClass("noselect");
	
	$label_canvas.appendTo($oncoprint_ctr);
	$cell_div.appendTo($oncoprint_ctr);
	$track_options_div.appendTo($oncoprint_ctr);
	$track_info_div.appendTo($oncoprint_ctr);
	
	$legend_div.appendTo($legend_ctr);

	$minimap_div.appendTo($ctr);
	
	$cell_canvas.appendTo($cell_div);
	$cell_overlay_canvas.appendTo($cell_div);
	$dummy_scroll_div.appendTo($cell_div);
	$dummy_scroll_div.on("mousemove mousedown mouseup", function(evt) {
	    $cell_overlay_canvas.trigger(evt);
	});
	$minimap_canvas.appendTo($minimap_div);
	$minimap_overlay_canvas.appendTo($minimap_div);
	
	this.$ctr = $ctr;
	this.$oncoprint_ctr = $oncoprint_ctr;
	this.$cell_div = $cell_div;
	this.$legend_div = $legend_div;
	this.$track_options_div = $track_options_div;
	this.$track_info_div = $track_info_div;
	this.$dummy_scroll_div = $dummy_scroll_div;
	this.$minimap_div = $minimap_div;
	
	
	
	this.$cell_canvas = $cell_canvas;
	this.$cell_overlay_canvas = $cell_overlay_canvas;
	
	this.model = new OncoprintModel();
	
	this.cell_view = new OncoprintWebGLCellView($cell_div, $cell_canvas, $cell_overlay_canvas, $dummy_scroll_div_contents, this.model, new OncoprintToolTip($tooltip_ctr), function(left, right) {
	    var enclosed_ids = self.model.getIdsInLeftInterval(left, right);
	    self.setHorzZoom(self.model.getHorzZoomToFit(self.cell_view.visible_area_width, enclosed_ids));
	    self.$dummy_scroll_div.scrollLeft(self.model.getZoomedColumnLeft(enclosed_ids[0]));
	    self.id_clipboard = enclosed_ids;
	},
		(function () {
		    var highlight_timeout = null;
		    var highlight_track = null;
		    return function (track_id, column_id) {
			if (track_id === null) {
			    highlight_track = null;
			    self.highlightTrack(null);
			    clearTimeout(highlight_timeout);
			} else {
			    if (highlight_track !== track_id) {
				self.highlightTrack(null);
				clearTimeout(highlight_timeout);
				highlight_track = track_id;
				highlight_timeout = setTimeout(function() {
				    self.highlightTrack(highlight_track);
				}, 250);
			    }
			}
		    };
		})());
	
	this.minimap_view = new OncoprintMinimapView($minimap_div, $minimap_canvas, $minimap_overlay_canvas, this.model, this.cell_view, 150, 150, function(x,y) {
	    self.setScroll(x,y);
	},
	function(vp) {
	    self.setViewport(vp.col,vp.scroll_y_proportion,vp.num_cols, vp.zoom_y);
	},
	function(val) {
	    var prev_viewport = self.cell_view.getViewportOncoprintSpace(self.model);
	    var prev_center_onc_space = (prev_viewport.left + prev_viewport.right) / 2;
	    var center_column = Math.floor(prev_center_onc_space / (self.model.getCellWidth(true) + self.model.getCellPadding(true)));
	    self.setHorzZoom(val);
	    var viewport = self.cell_view.getViewportOncoprintSpace(self.model);
	    var center_column_x_zoomed = center_column * (self.model.getCellWidth() + self.model.getCellPadding());
	    var half_viewport_width_zoomed = self.model.getHorzZoom() * (viewport.right - viewport.left) / 2;
	    
	    self.setHorzScroll(center_column_x_zoomed - half_viewport_width_zoomed);
	},
	function(val) {
	    var prev_viewport = self.cell_view.getViewportOncoprintSpace(self.model);
	    var center_onc_space = (prev_viewport.top + prev_viewport.bottom) / 2;
	    self.setVertZoom(val);
	    var viewport = self.cell_view.getViewportOncoprintSpace(self.model);
	    var half_viewport_height_zoomed = self.model.getVertZoom() * (viewport.bottom - viewport.top) / 2;
	    
	    self.setVertScroll(center_onc_space * self.model.getVertZoom() - half_viewport_height_zoomed);
	},
	function() {
	    updateHorzZoomToFit(self);
	    var left = self.model.getZoomedColumnLeft();
	    self.setHorzScroll(Math.min.apply(null, self.keep_horz_zoomed_to_fit_ids.map(function(id) { return left[id]; })));
	},
	function() {
	    self.setMinimapVisible(false);
	});
	/*this.minimap_view = {};
	var methods = ['moveTrack','addTracks','removeTrack','setHorzZoom','setVertZoom','setScroll','setZoom','setHorzScroll','setVertScroll','setTrackData','sort','shareRuleSet','setRuleSet','setIdOrder','suppressRendering','releaseRendering','hideIds'];
	for (var i=0; i<methods.length; i++) {
	    this.minimap_view[methods[i]] = function(){};
	}*/
	
	this.track_options_view = new OncoprintTrackOptionsView($track_options_div,
								function(track_id) { 
								    // move up
								    var tracks = self.model.getContainingTrackGroup(track_id);
								    var index = tracks.indexOf(track_id);
								    if (index > 0) {
									var new_previous_track = null;
									if (index >= 2) {
									    new_previous_track = tracks[index-2];
									}
									self.moveTrack(track_id, new_previous_track);
								    }
								},
								function(track_id) {
								    // move down
								    var tracks = self.model.getContainingTrackGroup(track_id);
								    var index = tracks.indexOf(track_id);
								    if (index < tracks.length - 1) {
									self.moveTrack(track_id, tracks[index+1]);
								    }
								},
								function(track_id) { self.removeTrack(track_id); }, 
								function(track_id, dir) { self.setTrackSortDirection(track_id, dir); });
	this.track_info_view = new OncoprintTrackInfoView($track_info_div);
								
	//this.track_info_view = new OncoprintTrackInfoView($track_info_div);

	this.label_view = new OncoprintLabelView($label_canvas, this.model, new OncoprintToolTip($tooltip_ctr, {noselect: true}));
	this.label_view.setDragCallback(function(target_track, new_previous_track) {
	    self.moveTrack(target_track, new_previous_track);
	});
	
	this.legend_view = new OncoprintLegendView($legend_div, 10, 20);
	
	this.keep_sorted = false;
	
	this.keep_horz_zoomed_to_fit = false;
	this.keep_horz_zoomed_to_fit_ids = [];
	
	// We need to handle scrolling this way because for some reason huge 
	//  canvas elements have terrible resolution.
	var cell_view = this.cell_view;
	var model = this.model;
	
	this.target_dummy_scroll_left = 0;
	this.target_dummy_scroll_top = 0;
	
	(function setUpOncoprintScroll(oncoprint) {
	    $dummy_scroll_div.scroll(function (e) {
		var dummy_scroll_left = $dummy_scroll_div.scrollLeft();
		var dummy_scroll_top = $dummy_scroll_div.scrollTop();
		if (dummy_scroll_left !== self.target_dummy_scroll_left || dummy_scroll_top !== self.target_dummy_scroll_top) {
		    // In setDummyScrollDivScroll, where we intend to set the scroll programmatically without
		    //	triggering the handler, we set target_dummy_scroll_left and target_dummy_scroll_top,
		    //	so if they're not set (we get inside this block), then it's a user-triggered scroll.
		    //	
		    // Set oncoprint scroll to match
		    self.target_dummy_scroll_left = dummy_scroll_left;
		    self.target_dummy_scroll_top = dummy_scroll_top;
		    var maximum_dummy_scroll_div_scroll = maxDummyScrollDivScroll(oncoprint);
		    var maximum_div_scroll_left = maximum_dummy_scroll_div_scroll.left;
		    var maximum_div_scroll_top = maximum_dummy_scroll_div_scroll.top;
		    var scroll_left_prop = maximum_div_scroll_left > 0 ? dummy_scroll_left / maximum_div_scroll_left : 0;
		    var scroll_top_prop = maximum_div_scroll_top > 0 ? dummy_scroll_top / maximum_div_scroll_top : 0;
		    scroll_left_prop = clamp(scroll_left_prop, 0, 1);
		    scroll_top_prop = clamp(scroll_top_prop, 0, 1);
		    var maximum_scroll_left = maxOncoprintScrollLeft(self);
		    var maximum_scroll_top = maxOncoprintScrollTop(self);
		    var scroll_left = Math.round(maximum_scroll_left * scroll_left_prop);
		    var scroll_top = Math.round(maximum_scroll_top * scroll_top_prop);
		    self.keep_horz_zoomed_to_fit = false;

		    doSetScroll(self, scroll_left, scroll_top);
		}
	    });
	})(self);
	
	this.horz_zoom_callbacks = [];
	this.minimap_close_callbacks = [];
	
	
	$(window).resize(function() {
	    resizeAndOrganize(self);
	});
	
	
	this.id_clipboard = [];
	this.clipboard_change_callbacks = [];
    }

    var _SetLegendTop = function (oncoprint) {
	if (oncoprint.model.rendering_suppressed_depth > 0) {
	    return;
	}
	oncoprint.$legend_div.css({'top': oncoprint.model.getCellViewHeight() + 30});
    };
    var setLegendTopAfterTimeout = function (oncoprint) {
	if (oncoprint.model.rendering_suppressed_depth > 0) {
	    return;
	}
	setTimeout(function () {
	    setHeight(oncoprint);
	    _SetLegendTop(oncoprint);
	}, 0);
    };

    var setHeight = function(oncoprint) {
	oncoprint.$ctr.css({'min-height': oncoprint.model.getCellViewHeight() + Math.max(oncoprint.$legend_div.outerHeight(), (oncoprint.$minimap_div.is(":visible") ? oncoprint.$minimap_div.outerHeight() : 0)) + 30});
    };
    
    var resizeAndOrganize = function (oncoprint) {
	if (oncoprint.model.rendering_suppressed_depth > 0) {
	    return;
	}
	var ctr_width = $(oncoprint.ctr_selector).width();
	oncoprint.$track_options_div.css({'left': oncoprint.label_view.getWidth()});
	oncoprint.$track_info_div.css({'left': oncoprint.label_view.getWidth() + oncoprint.track_options_view.getWidth()});
	var cell_div_left = oncoprint.label_view.getWidth() + oncoprint.track_options_view.getWidth() + oncoprint.track_info_view.getWidth();
	oncoprint.$cell_div.css('left', cell_div_left);
	oncoprint.cell_view.setWidth(ctr_width - cell_div_left - 20, oncoprint.model);

	_SetLegendTop(oncoprint);
	oncoprint.legend_view.setWidth(ctr_width - oncoprint.$minimap_div.outerWidth() - 20, oncoprint.model);

	setHeight(oncoprint);
	oncoprint.$ctr.css({'min-width': ctr_width});

	setTimeout(function () {
	    if (oncoprint.keep_horz_zoomed_to_fit) {
		updateHorzZoomToFit(oncoprint);
	    }
	}, 0);
    };

    var resizeAndOrganizeAfterTimeout = function (oncoprint) {
	if (oncoprint.model.rendering_suppressed_depth > 0) {
	    return;
	}
	setTimeout(function () {
	    resizeAndOrganize(oncoprint);
	}, 0);
    };
    
    var maxOncoprintScrollLeft = function(oncoprint) {
	return Math.max(0, oncoprint.model.getOncoprintWidth() - oncoprint.cell_view.getWidth());
    };
    
    var maxOncoprintScrollTop = function(oncoprint) {
	return Math.max(0, oncoprint.model.getOncoprintHeight() - oncoprint.model.getCellViewHeight());
    };
    
    var maxDummyScrollDivScroll = function(oncoprint) {
	var dummy_scroll_div_client_size = oncoprint.cell_view.getDummyScrollDivClientSize();
	var maximum_div_scroll_left = Math.max(0, (oncoprint.$dummy_scroll_div[0].scrollWidth - dummy_scroll_div_client_size.width));
	var maximum_div_scroll_top = Math.max(0, (oncoprint.$dummy_scroll_div[0].scrollHeight - dummy_scroll_div_client_size.height));
	return {'left': maximum_div_scroll_left, 'top': maximum_div_scroll_top};
    };
    
    Oncoprint.prototype.setMinimapVisible = function (visible) {
	if (visible) {
	    this.$minimap_div.css({'display': 'block', 'top': this.model.getCellViewHeight() + 30, 'left': $(this.ctr_selector).width() - this.$minimap_div.outerWidth() - 10});
	} else {
	    this.$minimap_div.css('display', 'none');
	    executeMinimapCloseCallbacks(this);
	}
	resizeAndOrganizeAfterTimeout(this);
    }
    
    Oncoprint.prototype.scrollTo = function(left) {
	this.$dummy_scroll_div.scrollLeft(left);
    }
    Oncoprint.prototype.onHorzZoom = function(callback) {
	this.horz_zoom_callbacks.push(callback);
    }
    Oncoprint.prototype.onMinimapClose = function(callback) {
	this.minimap_close_callbacks.push(callback);
    }
    Oncoprint.prototype.moveTrack = function(target_track, new_previous_track) {
	this.model.moveTrack(target_track, new_previous_track);
	this.cell_view.moveTrack(this.model);
	this.label_view.moveTrack(this.model);
	this.track_options_view.moveTrack(this.model);
	this.track_info_view.moveTrack(this.model);
	this.minimap_view.moveTrack(this.model, this.cell_view);
	
	if (this.keep_sorted) {
	    this.sort();
	}
	
	resizeAndOrganizeAfterTimeout(this);
    }
    Oncoprint.prototype.setTrackGroupOrder = function(index, track_order) {
	this.model.setTrackGroupOrder(index, track_order);
	this.cell_view.setTrackGroupOrder(this.model);
	this.label_view.setTrackGroupOrder(this.model);
	this.track_options_view.setTrackGroupOrder(this.model);
	this.track_info_view.setTrackGroupOrder(this.model);
	
	if (this.keep_sorted) {
	    this.sort();
	}
	
	resizeAndOrganizeAfterTimeout(this);
    }
    
    Oncoprint.prototype.keepSorted = function(keep_sorted) {
	this.keep_sorted = (typeof keep_sorted === 'undefined' ? true : keep_sorted);
	if (this.keep_sorted) {
	    this.sort();
	}
    }
    
    Oncoprint.prototype.addTracks = function (params_list) {
	// Update model
	var track_ids = [];
	params_list = params_list.map(function (o) {
	    o.track_id = nextTrackId();
	    o.rule_set = OncoprintRuleSet(o.rule_set_params);
	    track_ids.push(o.track_id);
	    return o;
	});
	
	this.model.addTracks(params_list);
	// Update views
	this.cell_view.addTracks(this.model, track_ids);
	this.label_view.addTracks(this.model, track_ids);
	this.track_options_view.addTracks(this.model);
	this.track_info_view.addTracks(this.model);
	this.legend_view.addTracks(this.model);
	this.minimap_view.addTracks(this.model, this.cell_view);
	
	if (this.keep_sorted) {
	    this.sort();
	}
	resizeAndOrganizeAfterTimeout(this);
	return track_ids;
    }

    Oncoprint.prototype.removeTrack = function (track_id) {
	// Update model
	this.model.removeTrack(track_id);
	// Update views
	this.cell_view.removeTrack(this.model, track_id);
	this.label_view.removeTrack(this.model, track_id);
	this.track_options_view.removeTrack(this.model, track_id);
	this.track_info_view.removeTrack(this.model);
	this.legend_view.removeTrack(this.model);
	this.minimap_view.removeTrack(this.model, this.cell_view);
	
	if (this.keep_sorted) {
	    this.sort();
	}
	resizeAndOrganizeAfterTimeout(this);
    }
    
    Oncoprint.prototype.removeTracks = function(track_ids) {
	this.keepSorted(false);
	this.suppressRendering();
	for (var i=0; i<track_ids.length; i++) {
	    this.removeTrack(track_ids[i]);
	}
	this.keepSorted(true);
	this.releaseRendering();
    }
    
    Oncoprint.prototype.getTracks = function() {
	return this.model.getTracks().slice();
    }
    
    Oncoprint.prototype.removeAllTracks = function() {
	var track_ids = this.model.getTracks();
	this.removeTracks(track_ids);
    }

    Oncoprint.prototype.setHorzZoomToFit = function(ids) {
	this.keep_horz_zoomed_to_fit = true;
	this.updateHorzZoomToFitIds(ids);
	updateHorzZoomToFit(this);
    }
    Oncoprint.prototype.updateHorzZoomToFitIds = function(ids) {
	this.keep_horz_zoomed_to_fit_ids = ids.slice();
	if (this.keep_horz_zoomed_to_fit) {
	    updateHorzZoomToFit(this);
	}
    }
    var updateHorzZoomToFit = function(oncoprint) {
	oncoprint.setHorzZoom(getHorzZoomToFit(oncoprint, oncoprint.keep_horz_zoomed_to_fit_ids), true);
    };
    var getHorzZoomToFit = function(oncoprint, ids) {
	ids = ids || [];
	return oncoprint.model.getHorzZoomToFit(oncoprint.cell_view.visible_area_width, ids);
    }
    var executeHorzZoomCallbacks = function(oncoprint) {
	for (var i=0; i<oncoprint.horz_zoom_callbacks.length; i++) {
	    oncoprint.horz_zoom_callbacks[i](oncoprint.model.getHorzZoom());
	}
    };
    
    var executeMinimapCloseCallbacks = function(oncoprint) {
	for (var i=0; i<oncoprint.minimap_close_callbacks.length; i++) {
	    oncoprint.minimap_close_callbacks[i]();
	}
    };
    
    Oncoprint.prototype.getHorzZoom = function () {
	return this.model.getHorzZoom();
    }
    

    Oncoprint.prototype.setHorzZoom = function (z, still_keep_horz_zoomed_to_fit) {
	this.keep_horz_zoomed_to_fit = this.keep_horz_zoomed_to_fit && still_keep_horz_zoomed_to_fit
	// Update model
	this.model.setHorzZoom(z);
	// Update views
	this.cell_view.setHorzZoom(this.model);
	this.minimap_view.setHorzZoom(this.model, this.cell_view);

	executeHorzZoomCallbacks(this);
	return this.model.getHorzZoom();
    }
    
    Oncoprint.prototype.getVertZoom = function () {
	return this.model.getVertZoom();
    }

    Oncoprint.prototype.setVertZoom = function (z) {
	// Update model
	this.model.setVertZoom(z);
	// Update views
	this.cell_view.setVertZoom(this.model, z);
	this.label_view.setVertZoom(this.model, z);
	this.track_info_view.setVertZoom(this.model);
	this.track_options_view.setVertZoom(this.model);
	this.minimap_view.setVertZoom(this.model, this.cell_view);
	
	resizeAndOrganizeAfterTimeout(this);
	return this.model.getVertZoom();
    }
    
    var doSetScroll = function(oncoprint, scroll_left, scroll_top) {
	// Update model
	scroll_left = Math.min(scroll_left, maxOncoprintScrollLeft(oncoprint));
	scroll_top = Math.min(scroll_top, maxOncoprintScrollTop(oncoprint));
	oncoprint.model.setScroll(scroll_left, scroll_top);
	// Update views
	
	oncoprint.cell_view.setScroll(oncoprint.model);
	oncoprint.label_view.setScroll(oncoprint.model);
	oncoprint.track_info_view.setScroll(oncoprint.model);
	oncoprint.track_options_view.setScroll(oncoprint.model);
	oncoprint.minimap_view.setScroll(oncoprint.model, oncoprint.cell_view);
    };
 
    var setDummyScrollDivScroll = function(oncoprint) {
	var scroll_left = oncoprint.model.getHorzScroll();
	var scroll_top = oncoprint.model.getVertScroll();
	
	var maximum_scroll_left = maxOncoprintScrollLeft(oncoprint);
	var maximum_scroll_top = maxOncoprintScrollTop(oncoprint);
	var onc_scroll_left_prop = maximum_scroll_left > 0 ? scroll_left/maximum_scroll_left : 0;
	var onc_scroll_top_prop = maximum_scroll_top > 0 ? scroll_top/maximum_scroll_top : 0;
	onc_scroll_left_prop = clamp(onc_scroll_left_prop, 0, 1);
	onc_scroll_top_prop = clamp(onc_scroll_top_prop, 0, 1);
	
	var maximum_dummy_scroll_div_scroll = maxDummyScrollDivScroll(oncoprint);
	var maximum_div_scroll_left = maximum_dummy_scroll_div_scroll.left;
	var maximum_div_scroll_top = maximum_dummy_scroll_div_scroll.top;
	
	oncoprint.target_dummy_scroll_left = Math.round(onc_scroll_left_prop * maximum_div_scroll_left);
	oncoprint.target_dummy_scroll_top = Math.round(onc_scroll_top_prop * maximum_div_scroll_top);
	oncoprint.$dummy_scroll_div.scrollLeft(oncoprint.target_dummy_scroll_left);
	oncoprint.$dummy_scroll_div.scrollTop(oncoprint.target_dummy_scroll_top);
    };
    
    Oncoprint.prototype.setScroll = function(scroll_left, scroll_top) {
	doSetScroll(this, scroll_left, scroll_top);
	setDummyScrollDivScroll(this);
    }
    
    Oncoprint.prototype.setZoom = function(zoom_x, zoom_y) {
	// Update model
	this.model.setZoom(zoom_x, zoom_y);
	// Update views
	this.cell_view.setZoom(this.model);
	this.label_view.setZoom(this.model);
	this.track_info_view.setZoom(this.model);
	this.track_options_view.setZoom(this.model);
	this.minimap_view.setZoom(this.model, this.cell_view);
    }
    
    Oncoprint.prototype.setHorzScroll = function(s) {
	// Update model
	this.model.setHorzScroll(Math.min(s, maxOncoprintScrollLeft(this)));
	// Update views
	this.cell_view.setHorzScroll(this.model);
	this.label_view.setHorzScroll(this.model);
	this.track_info_view.setHorzScroll(this.model);
	this.track_options_view.setHorzScroll(this.model);
	this.minimap_view.setHorzScroll(this.model, this.cell_view);
	// Update dummy scroll div
	setDummyScrollDivScroll(this);
	
	return this.model.getHorzScroll();
    }
    Oncoprint.prototype.setVertScroll = function(s) {
	// Update model
	this.model.setVertScroll(Math.min(s, maxOncoprintScrollTop(this)));
	// Update views
	this.cell_view.setVertScroll(this.model);
	this.label_view.setVertScroll(this.model);
	this.track_info_view.setVertScroll(this.model);
	this.track_options_view.setVertScroll(this.model);
	this.minimap_view.setVertScroll(this.model, this.cell_view);
	// Update dummy scroll div
	setDummyScrollDivScroll(this);
	
	return this.model.getVertScroll();
    }
    Oncoprint.prototype.setViewport = function(col, scroll_y_proportion, num_cols, zoom_y) {
	// Zoom
	var zoom_x = this.model.getHorzZoomToFitNumCols(this.cell_view.getWidth(), num_cols);
	this.setZoom(zoom_x, zoom_y);
	// Scroll
	var scroll_left = Math.min(col * (this.model.getCellWidth() + this.model.getCellPadding()), maxOncoprintScrollLeft(this));
	var scroll_top = Math.min(scroll_y_proportion*this.model.getOncoprintHeight(), maxOncoprintScrollTop(this));
	this.setScroll(scroll_left, scroll_top);
	
	executeHorzZoomCallbacks(this);
    }

    Oncoprint.prototype.getTrackData = function (track_id) {
	return this.model.getTrackData(track_id);
    }
    
    Oncoprint.prototype.getTrackDataIdKey = function(track_id) {
	return this.model.getTrackDataIdKey(track_id);
    }
    
    /**
     * Sets the data for an Oncoprint track.
     *
     * @param track_id - the ID that identifies the track
     * @param {Object[]} data - the list of data for the cells
     * @param {string} data_id_key - name of the property of the
     * data objects to use as the (column) key
     */
    Oncoprint.prototype.setTrackData = function (track_id, data, data_id_key) {
	this.model.setTrackData(track_id, data, data_id_key);
	this.cell_view.setTrackData(this.model, track_id);
	this.legend_view.setTrackData(this.model);
	this.minimap_view.setTrackData(this.model, this.cell_view);
	
	if (this.keep_sorted) {
	    this.sort();
	}
	resizeAndOrganizeAfterTimeout(this);
    }
    
    Oncoprint.prototype.setTrackGroupSortPriority = function(priority) {
	this.model.setTrackGroupSortPriority(priority);
	this.cell_view.setTrackGroupSortPriority(this.model);
	
	if (this.keep_sorted) {
	    this.sort();
	}
	resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.setTrackSortDirection = function(track_id, dir) {
	if (this.model.isTrackSortDirectionChangeable(track_id)) {
	    this.model.setTrackSortDirection(track_id, dir);
	    
	    if (this.keep_sorted) {
		this.sort();
	    }
	}
	return this.model.getTrackSortDirection(track_id);
    }
    
    Oncoprint.prototype.setTrackSortComparator = function(track_id, sortCmpFn) {
	this.model.setTrackSortComparator(track_id, sortCmpFn);
	if (this.keep_sorted) {
	    this.sort();
	}
    }
    
    Oncoprint.prototype.getTrackSortDirection = function(track_id) {
	return this.model.getTrackSortDirection(track_id);
    }
    
    Oncoprint.prototype.setTrackInfo = function(track_id, msg) {
	this.model.setTrackInfo(track_id, msg);
	this.track_info_view.setTrackInfo(this.model);
    }
    
    Oncoprint.prototype.setTrackTooltipFn = function(track_id, tooltipFn) {
	this.model.setTrackTooltipFn(track_id, tooltipFn);
    }
    
    Oncoprint.prototype.sort = function() {
	this.model.sort();
	this.cell_view.sort(this.model);
	this.minimap_view.sort(this.model, this.cell_view);
    }
    
    Oncoprint.prototype.shareRuleSet = function(source_track_id, target_track_id) {
	this.model.shareRuleSet(source_track_id, target_track_id);
	this.cell_view.shareRuleSet(this.model, target_track_id);
	this.legend_view.shareRuleSet(this.model);
	this.minimap_view.shareRuleSet(this.model, this.cell_view);
    }
    
    Oncoprint.prototype.setRuleSet = function(track_id, rule_set_params) {
	this.model.setRuleSet(track_id, OncoprintRuleSet(rule_set_params));
	this.cell_view.setRuleSet(this.model, track_id);
	this.legend_view.setRuleSet(this.model);
	this.minimap_view.setRuleSet(this.model, this.cell_view);
	resizeAndOrganizeAfterTimeout(this);
    }
    
    Oncoprint.prototype.setSortConfig = function(params) {
	this.model.setSortConfig(params);
	this.cell_view.setSortConfig(this.model);
	
	if (this.keep_sorted) {
	    this.sort();
	}
    }
    Oncoprint.prototype.setIdOrder = function(ids) {
	// Update model
	this.model.setIdOrder(ids);
	// Update views
	this.cell_view.setIdOrder(this.model, ids);
	this.minimap_view.setIdOrder(this.model, this.cell_view);
	
	if (this.keep_sorted) {
	    this.sort();
	}
    }
    
    Oncoprint.prototype.disableInteraction = function() {
	//this.label_view.disableInteraction();
	//this.cell_view.disableInteraction();
	this.track_options_view.disableInteraction();
	//this.track_info_view.disableInteraction();
	//this.legend_view.disableInteraction();
    }
    Oncoprint.prototype.enableInteraction = function() {
	//this.label_view.enableInteraction();
	//this.cell_view.enableInteraction();
	this.track_options_view.enableInteraction();
	//this.track_info_view.enableInteraction();
	//this.legend_view.enableInteraction();
    }
    Oncoprint.prototype.suppressRendering = function() {
	this.model.rendering_suppressed_depth += 1;
	this.label_view.suppressRendering();
	this.cell_view.suppressRendering();
	this.track_options_view.suppressRendering();
	this.track_info_view.suppressRendering();
	this.legend_view.suppressRendering();
	this.minimap_view.suppressRendering();
    }
    
    Oncoprint.prototype.releaseRendering = function() {
	this.model.rendering_suppressed_depth -= 1;
	this.model.rendering_suppressed_depth = Math.max(0, this.model.rendering_suppressed_depth);
	if (this.model.rendering_suppressed_depth === 0) {
	    this.label_view.releaseRendering(this.model);
	    this.cell_view.releaseRendering(this.model);
	    this.track_options_view.releaseRendering(this.model);
	    this.track_info_view.releaseRendering(this.model);
	    this.legend_view.releaseRendering(this.model);
	    this.minimap_view.releaseRendering(this.model, this.cell_view);
	    resizeAndOrganizeAfterTimeout(this);
	}
    }
    
    Oncoprint.prototype.hideIds = function(to_hide, show_others) {
	this.model.hideIds(to_hide, show_others);
	this.cell_view.hideIds(this.model);
	this.minimap_view.hideIds(this.model, this.cell_view);
    }
    
    Oncoprint.prototype.hideTrackLegends = function(track_ids) {
	track_ids = [].concat(track_ids);
	this.model.hideTrackLegends(track_ids);
	this.legend_view.hideTrackLegends(this.model);
	setLegendTopAfterTimeout(this);
    }
    
    Oncoprint.prototype.showTrackLegends = function(track_ids) {
	track_ids = [].concat(track_ids);
	this.model.showTrackLegends(track_ids);
	this.legend_view.showTrackLegends(this.model);
	setLegendTopAfterTimeout(this);
    }
    
    Oncoprint.prototype.setCellPaddingOn = function(cell_padding_on) {
	this.model.setCellPaddingOn(cell_padding_on);
	this.cell_view.setCellPaddingOn(this.model);
    }
    
    Oncoprint.prototype.toSVG = function(with_background) {
	// Returns svg DOM element
	var root = svgfactory.svg(10, 10);
	this.$ctr.append(root);
	var everything_group = svgfactory.group(0,0);
	root.appendChild(everything_group);
	
	var bgrect = svgfactory.bgrect(10,10,'#ffffff');
	
	if (with_background) {
	    everything_group.appendChild(bgrect);
	}
	
	var label_view_group = this.label_view.toSVGGroup(this.model, true, 0, 0);
	everything_group.appendChild(label_view_group);
	var track_info_group_x = label_view_group.getBBox().width + 30;
	var track_info_group = this.track_info_view.toSVGGroup(this.model, track_info_group_x, 0);
	everything_group.appendChild(track_info_group);
	var cell_view_group_x = track_info_group_x + track_info_group.getBBox().width + 10;
	everything_group.appendChild(this.cell_view.toSVGGroup(this.model, cell_view_group_x, 0));
	everything_group.appendChild(this.legend_view.toSVGGroup(this.model, 0, label_view_group.getBBox().y + label_view_group.getBBox().height+20));
	
	var everything_box = everything_group.getBBox();
	var everything_width = everything_box.x + everything_box.width;
	var everything_height = everything_box.y + everything_box.height;
	root.setAttribute('width', everything_width);
	root.setAttribute('height', everything_height);
	
	if (with_background) {
	    bgrect.setAttribute('width', everything_width);
	    bgrect.setAttribute('height', everything_height);
	}
	root.parentNode.removeChild(root);
	
	return root;
    }
    
    Oncoprint.prototype.toCanvas = function(callback, resolution) {
	// Returns data url, requires IE >= 11
	
	var MAX_CANVAS_SIDE = 8192;
	var svg = this.toSVG(true);
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	var width = parseInt(svg.getAttribute('width'), 10);
	var height = parseInt(svg.getAttribute('height'), 10);
	var canvas = document.createElement('canvas');
	
	resolution = resolution || 1;
	var truncated = width*resolution > MAX_CANVAS_SIDE || height*resolution > MAX_CANVAS_SIDE;
	canvas.setAttribute('width', Math.min(MAX_CANVAS_SIDE, width*resolution));
	canvas.setAttribute('height', Math.min(MAX_CANVAS_SIDE, height*resolution));
	
	var container = document.createElement("div");
	container.appendChild(svg);
	var svg_data_str = container.innerHTML;
	var svg_data_uri = "data:image/svg+xml;base64,"+window.btoa(svg_data_str);
	
	var ctx = canvas.getContext('2d');
	ctx.setTransform(resolution,0,0,resolution,0,0);
	var img = new Image();
	
	img.onload = function() {
	    ctx.drawImage(img, 0, 0);
	    callback(canvas, truncated);
	};
	img.onerror = function() {
	    console.log("IMAGE LOAD ERROR");
	};
	
	img.src = svg_data_uri;
	return img;
    }
    
    Oncoprint.prototype.highlightTrack = function(track_id) {
	this.label_view.highlightTrack(track_id, this.model);
    }
    
    Oncoprint.prototype.getIdOrder = function(all) {
	return this.model.getIdOrder(all);
    }
    
    Oncoprint.prototype.setIdClipboardContents = function(array) {
	this.id_clipboard = array.slice();
	for (var i=0; i<this.clipboard_change_callbacks.length; i++) {
	    this.clipboard_change_callbacks[i](array);
	}
    }
    Oncoprint.prototype.getIdClipboardContents = function() {
	return this.id_clipboard.slice();
    }
    Oncoprint.prototype.onClipboardChange = function(callback) {
	this.clipboard_change_callbacks.push(callback);
    }
    
    return Oncoprint;
})();
module.exports = Oncoprint;
},{"./oncoprintlabelview.js":20,"./oncoprintlegendrenderer.js":21,"./oncoprintminimapview.js":22,"./oncoprintmodel.js":23,"./oncoprintruleset.js":24,"./oncoprinttooltip.js":28,"./oncoprinttrackinfoview.js":29,"./oncoprinttrackoptionsview.js":30,"./oncoprintwebglcellview.js":31,"./polyfill.js":33,"./svgfactory.js":34,"jquery":11}],20:[function(require,module,exports){
var svgfactory = require('./svgfactory.js');
var $ = require('jquery');

var OncoprintLabelView = (function () {
    function OncoprintLabelView($canvas, model, tooltip) {
	var view = this;
	
	this.supersampling_ratio = 2;
	
	this.$canvas = $canvas;
	this.base_font_size = 14;
	this.model = model;
	this.tooltip = tooltip;
	this.tooltip.center = false;
	// stuff from model
	this.cell_tops = {};
	this.cell_tops_view_space = {};
	this.cell_heights = {};
	this.cell_heights_view_space = {};
	this.label_middles_view_space = {};
	this.labels = {};
	this.track_descriptions = {};
	this.tracks = [];
	this.minimum_track_height = Number.POSITIVE_INFINITY;
	this.maximum_label_width = Number.NEGATIVE_INFINITY;
	
	this.maximum_label_length = 18;
	this.rendering_suppressed = false;
	
	this.highlighted_track = null;
	
	setUpContext(this);
	
	(function setUpDragging(view) {
	    view.drag_callback = function(target_track, new_previous_track) {};
	    view.dragged_label_track_id = null;
	    view.drag_mouse_y = null;
	    
	    view.$canvas.on("mousedown", function(evt) {
		view.tooltip.hide();
		var track_id = isMouseOnLabel(view, evt.offsetY);
		if (track_id !== null && model.getContainingTrackGroup(track_id).length > 1) {
		    startDragging(view, track_id, evt.offsetY);
		}
	    });
	    
	    view.$canvas.on("mousemove", function(evt) {
		if (view.dragged_label_track_id !== null) {
		    var track_group = model.getContainingTrackGroup(view.dragged_label_track_id);
		    var max_drag_y = view.track_tops[track_group[track_group.length-1]] + model.getTrackHeight(track_group[track_group.length-1]) - view.scroll_y;
		    var min_drag_y = view.track_tops[track_group[0]] - 5 - view.scroll_y;
		    view.drag_mouse_y = Math.min(evt.pageY - view.$canvas.offset().top, max_drag_y);
		    view.drag_mouse_y = Math.max(view.drag_mouse_y, min_drag_y);
		    renderAllLabels(view);
		} else {
		    var hovered_track = isMouseOnLabel(view, evt.pageY - view.$canvas.offset().top);
		    if (hovered_track !== null) {
			var $tooltip_div = $('<div>');
			var offset = view.$canvas.offset();   
			if (isNecessaryToShortenLabel(view, view.labels[hovered_track])) {
			    $tooltip_div.append($('<b>'+view.labels[hovered_track]+'</b>'));
			}
			var track_description = view.track_descriptions[hovered_track].replace("<", "&lt;").replace(">", "&gt;");
			if (track_description.length > 0) {
			    $tooltip_div.append(track_description + "<br>");
			}
			if (model.getContainingTrackGroup(hovered_track).length > 1) {
			    view.$canvas.css('cursor', 'move');
			    $tooltip_div.append("<b>hold to drag</b>");
			}
			view.tooltip.fadeIn(200, renderedLabelWidth(view, view.labels[hovered_track]) + offset.left, view.cell_tops[hovered_track] + offset.top - view.scroll_y, $tooltip_div);
		    } else {
			view.$canvas.css('cursor', 'auto');
			view.tooltip.hide();
		    }
		}
	    });
	    
	    view.$canvas.on("mouseup mouseleave", function(evt) {
		if (view.dragged_label_track_id !== null) {
		    var track_group = model.getContainingTrackGroup(view.dragged_label_track_id);
		    var previous_track_id = getLabelAboveMouseSpace(view, track_group, evt.offsetY, view.dragged_label_track_id);
		    stopDragging(view, previous_track_id);
		}
		view.tooltip.hide();
	    });
	})(this);
	
    }
    var renderedLabelWidth = function(view, label) {
	return view.ctx.measureText(shortenLabelIfNecessary(view, label)).width/view.supersampling_ratio;
    };
    var updateFromModel = function(view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.scroll_y = model.getVertScroll();
	view.track_tops = model.getZoomedTrackTops();
	view.cell_tops = model.getCellTops();
	view.cell_tops_view_space = {};
	view.cell_heights = {};
	view.tracks = model.getTracks();
	view.track_descriptions = {};
	
	view.ctx.font = 'bold '+view.getFontSize()+'px Arial';
	view.minimum_track_height = Number.POSITIVE_INFINITY;
	view.maximum_label_width = 0;
	for (var i=0; i<view.tracks.length; i++) {
	    view.minimum_track_height = Math.min(view.minimum_track_height, model.getTrackHeight(view.tracks[i]));
	    var shortened_label = shortenLabelIfNecessary(view, view.labels[view.tracks[i]]);
	    view.maximum_label_width = Math.max(view.maximum_label_width, view.ctx.measureText(shortened_label).width);
	    
	    view.cell_tops_view_space[view.tracks[i]] = view.cell_tops[view.tracks[i]]*view.supersampling_ratio - view.scroll_y*view.supersampling_ratio;
	    view.track_descriptions[view.tracks[i]] = model.getTrackDescription(view.tracks[i]);
	    view.cell_heights[view.tracks[i]] = model.getCellHeight(view.tracks[i]);
	    view.cell_heights_view_space[view.tracks[i]] = view.cell_heights[view.tracks[i]]*view.supersampling_ratio;
	    view.label_middles_view_space[view.tracks[i]] = view.cell_tops_view_space[view.tracks[i]] + view.cell_heights_view_space[view.tracks[i]]/2;
	}
    }
    var setUpContext = function(view) {
	view.ctx = view.$canvas[0].getContext('2d');
	view.ctx.textAlign="start";
	view.ctx.textBaseline="middle";
    }
    var resizeAndClear = function(view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	var visible_height = model.getCellViewHeight();
	var visible_width = view.getWidth();
	view.$canvas[0].height = view.supersampling_ratio*visible_height;
	view.$canvas[0].width = view.supersampling_ratio*visible_width;
	view.$canvas[0].style.height = visible_height + 'px';
	view.$canvas[0].style.width = visible_width + 'px';
	setUpContext(view);
    }
    var isNecessaryToShortenLabel = function(view, label) {
	return label.length > view.maximum_label_length;
    };
    var shortenLabelIfNecessary = function(view, label) {
	if (isNecessaryToShortenLabel(view, label)) {
	    return label.substring(0, view.maximum_label_length-3) + '...';
	} else {
	    return label;
	}
    };
    var renderAllLabels = function(view) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.ctx.clearRect(0,0,view.$canvas[0].width,view.$canvas[0].height);
	
	if (view.highlighted_track !== null) {
	    if (view.cell_tops_view_space.hasOwnProperty(view.highlighted_track)) {
		view.ctx.fillStyle = 'rgba(255,255,0,0.4)';
		view.ctx.fillRect(0, view.cell_tops_view_space[view.highlighted_track], view.getWidth()*view.supersampling_ratio, view.cell_heights_view_space[view.highlighted_track]);
	    }
	}
	var font_size = view.getFontSize();
	view.ctx.font = 'bold '+font_size +'px Arial';
	view.ctx.fillStyle = 'black';
	var tracks = view.tracks;
	for (var i=0; i<tracks.length; i++) {
	    view.ctx.fillText(shortenLabelIfNecessary(view, view.labels[tracks[i]]), 0, view.label_middles_view_space[tracks[i]]);
	}
	if (view.dragged_label_track_id !== null) {
	    view.ctx.fillStyle = 'rgba(255,0,0,0.95)';
	    view.ctx.fillText(shortenLabelIfNecessary(view, view.labels[view.dragged_label_track_id]), 0, view.supersampling_ratio*view.drag_mouse_y);
	    view.ctx.fillStyle = 'rgba(0,0,0,0.15)';
	    var group = view.model.getContainingTrackGroup(view.dragged_label_track_id);
	    var label_above_mouse = getLabelAboveMouseSpace(view, group, view.drag_mouse_y, null);
	    var label_below_mouse = getLabelBelowMouseSpace(view, group, view.drag_mouse_y, null);
	    var rect_y, rect_height;
	    if (label_above_mouse === view.dragged_label_track_id || label_below_mouse === view.dragged_label_track_id) {
		return;
	    }
	    if (label_above_mouse !== null && label_below_mouse !== null) {
		rect_y = view.cell_tops_view_space[label_above_mouse] + view.cell_heights_view_space[label_above_mouse];
		rect_height = view.cell_tops_view_space[label_below_mouse] - rect_y;
	    } else if (label_above_mouse === null) {
		rect_y = view.cell_tops_view_space[group[0]] - view.ctx.measureText("m").width;
		rect_height = view.ctx.measureText("m").width;
	    } else if (label_below_mouse === null) {
		rect_y = view.cell_tops_view_space[group[group.length-1]] + view.cell_heights_view_space[group[group.length-1]];
		rect_height = view.ctx.measureText("m").width;
	    }
	    
	    var min_rect_height = 4;
	    rect_height = Math.max(rect_height, min_rect_height);
	    view.ctx.fillRect(0, rect_y, view.getWidth()*view.supersampling_ratio, rect_height);
	}
    }
    
    var isMouseOnLabel = function(view, mouse_y) {
	var candidate_track = getLabelAboveMouseSpace(view, view.tracks, mouse_y, null);
	if (candidate_track === null) {
	    return null;
	}
	if (mouse_y <= view.cell_tops[candidate_track] - view.scroll_y + view.cell_heights[candidate_track]) {
	    return candidate_track;
	} else {
	    return null;
	}
    }
    var getLabelAboveMouseSpace = function(view, track_ids, y, track_to_exclude) {
	if (y < view.cell_tops[track_ids[0]] - view.scroll_y) {
	    return null;
	} else {
	    var candidate_track = null;
	    for (var i=0; i<track_ids.length; i++) {
		if (track_to_exclude !== null && track_to_exclude === track_ids[i]) {
		    continue;
		}
		if (view.cell_tops[track_ids[i]] - view.scroll_y > y) {
		    break;
		} else {
		    candidate_track = track_ids[i];
		}
	    }
	    return candidate_track;
	}
    }
    var getLabelBelowMouseSpace = function(view, track_ids, y, track_to_exclude) {
	if (y > view.cell_tops[track_ids[track_ids.length-1]] - view.scroll_y) {
	    return null;
	} else {
	    var candidate_track = null;
	    for (var i=track_ids.length-1; i>=0; i--) {
		if (track_to_exclude !== null && track_to_exclude === track_ids[i]) {
		    continue;
		}
		if (view.cell_tops[track_ids[i]] - view.scroll_y < y) {
		    break;
		} else {
		    candidate_track = track_ids[i];
		}
	    }
	    return candidate_track;
	}
    }
    
    var startDragging = function(view, track_id, mouse_y) {
	view.dragged_label_track_id = track_id;
	view.drag_mouse_y = mouse_y;
	renderAllLabels(view);
    }
    var stopDragging = function(view, new_previous_track_id) {
	view.drag_callback(view.dragged_label_track_id, new_previous_track_id);
	view.dragged_label_track_id = null;
	renderAllLabels(view);
    }
    
    OncoprintLabelView.prototype.getWidth = function() {
	//return this.maximum_label_width + 20;
	return Math.max(this.maximum_label_width/this.supersampling_ratio + 10, 70);
    }
    OncoprintLabelView.prototype.getFontSize = function(no_supersampling_adjustment) {
	return (no_supersampling_adjustment ? 1 : this.supersampling_ratio) * Math.max(Math.min(this.base_font_size, this.minimum_track_height), 7);
    }
    OncoprintLabelView.prototype.setDragCallback = function(callback) {
	this.drag_callback = callback;
    }
    OncoprintLabelView.prototype.removeTrack = function (model, track_id) {
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this, model);
    }
    OncoprintLabelView.prototype.moveTrack = function (model) {
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this, model);
    }
    OncoprintLabelView.prototype.setTrackGroupOrder = function (model) {
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this, model);
    }
    OncoprintLabelView.prototype.addTracks = function (model, track_ids) {
	for (var i=0; i<track_ids.length; i++) {
	    this.labels[track_ids[i]] = model.getTrackLabel(track_ids[i]);
	}
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this, model);
    }
    
    OncoprintLabelView.prototype.setScroll = function(model) {
	this.setVertScroll(model);
    }
    
    OncoprintLabelView.prototype.setHorzScroll = function(model) {
    }
    
    OncoprintLabelView.prototype.setViewport = function(model) {
	this.setVertScroll(model);
    }
    
    OncoprintLabelView.prototype.setVertScroll = function(model) {
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this, model);
    }
    
    OncoprintLabelView.prototype.setVertZoom = function(model) {
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this, model);
    }
    
    OncoprintLabelView.prototype.setZoom = function(model) {
	this.setVertZoom(model);
    }
    
    OncoprintLabelView.prototype.highlightTrack = function(track_id, model) {
	// track_id is a track id, or null to clear highlight
	this.highlighted_track = track_id;
	renderAllLabels(this, model);
    }
    
    OncoprintLabelView.prototype.suppressRendering = function() {
	this.rendering_suppressed = true;
    }
    
    OncoprintLabelView.prototype.releaseRendering = function(model) {
	this.rendering_suppressed = false;
	updateFromModel(this, model);
	resizeAndClear(this, model);
	renderAllLabels(this);
    }
    
    OncoprintLabelView.prototype.toSVGGroup = function(model, full_labels, offset_x, offset_y) {
	var root = svgfactory.group((offset_x || 0), (offset_y || 0));
	var cell_tops = model.getCellTops();
	var tracks = model.getTracks();
	for (var i=0; i<tracks.length; i++) {
	    var track_id = tracks[i];
	    var y = cell_tops[track_id] + model.getCellHeight(track_id)/2;
	    var label = model.getTrackLabel(track_id);
	    var text_elt = svgfactory.text((full_labels ? label : shortenLabelIfNecessary(this, label)), 0, y, this.getFontSize(true), 'Arial', 'bold', "bottom"); 
	    text_elt.setAttribute("dy", "0.35em");
	    root.appendChild(text_elt);
	}
	return root;
    }

    return OncoprintLabelView;
})();

module.exports = OncoprintLabelView;
},{"./svgfactory.js":34,"jquery":11}],21:[function(require,module,exports){
var svgfactory = require('./svgfactory.js');
var $ = require('jquery');

var nodeIsVisible = function(node) {
    var ret = true;
    while (node.tagName.toLowerCase() !== "html") {
	if ($(node).css('display') === 'none') {
	    ret = false;
	    break;
	}
	node = node.parentNode;
    }
    return ret;
};

var OncoprintLegendView = (function() {
    function OncoprintLegendView($div, base_width, base_height) {
	this.$div = $div;
	this.$svg = $(svgfactory.svg(200,200)).appendTo(this.$div);
	this.base_width = base_width;
	this.base_height = base_height;
	this.rendering_suppressed = false;
	
	this.width = $div.width();
	
	this.rule_set_label_config = {
	    weight: 'bold',
	    size: 12,
	    font: 'Arial'
	};
	this.rule_label_config = {
	    weight: 'normal',
	    size: 12,
	    font: 'Arial'
	};
	
	this.padding_after_rule_set_label = 10;
	this.padding_between_rules = 20;
	this.padding_between_rule_set_rows = 10;
    }
    
    var renderLegend = function(view, model, target_svg, show_all) {
	if (view.rendering_suppressed) {
	    return;
	}
	if (typeof target_svg === 'undefined') {
	    target_svg = view.$svg[0];
	}
	if (!nodeIsVisible(target_svg)) {
	    return;
	}
	$(target_svg).empty();
	var defs = svgfactory.defs();
	target_svg.appendChild(defs);
	
	var everything_group = svgfactory.group(0,0);
	target_svg.appendChild(everything_group);
	
	var rule_sets = model.getRuleSets();
	var y = 0;
	var rule_start_x = 200;
	for (var i=0; i<rule_sets.length; i++) {
	    if (rule_sets[i].exclude_from_legend && !show_all) {
		continue;
	    }
	    var rule_set_group = svgfactory.group(0,y);
	    everything_group.appendChild(rule_set_group);
	    (function addLabel() {
		if ((typeof rule_sets[i].legend_label !== 'undefined') && rule_sets[i].legend_label.length > 0) {
		    var label = svgfactory.text(rule_sets[i].legend_label, 0, 0, 12, 'Arial', 'bold');
		    rule_set_group.appendChild(label);
		    svgfactory.wrapText(label, rule_start_x);
		}
	    })();
	    
	    var x = rule_start_x + view.padding_after_rule_set_label;
	    var in_group_y_offset = 0;
	    
	    var rules = model.getActiveRules(rule_sets[i].rule_set_id);
	    for (var j=0; j<rules.length; j++) {
		var rule = rules[j].rule;
		if (rule.exclude_from_legend) {
		    continue;
		}
		var group = ruleToSVGGroup(rule, view, model, target_svg, defs);
		group.setAttribute('transform', 'translate('+x+','+in_group_y_offset+')');
		rule_set_group.appendChild(group);
		if (x + group.getBBox().width > view.width) {
		    x = rule_start_x + view.padding_after_rule_set_label;
		    in_group_y_offset = rule_set_group.getBBox().height + view.padding_between_rule_set_rows;
		    group.setAttribute('transform', 'translate('+x+','+in_group_y_offset+')');
		}
		x += group.getBBox().width;
		x += view.padding_between_rules;
	    }
	    y += rule_set_group.getBBox().height;
	    y += 3*view.padding_between_rule_set_rows;
	}
	var everything_box = everything_group.getBBox();
	view.$svg[0].setAttribute('width', everything_box.width);
	view.$svg[0].setAttribute('height', everything_box.height);
    };
    
    var ruleToSVGGroup = function(rule, view, model, target_svg, target_defs) {
	var root = svgfactory.group(0,0);
	var config = rule.getLegendConfig();
	if (config.type === 'rule') {
	    var concrete_shapes = rule.apply(config.target, model.getCellWidth(true), view.base_height);
	    for (var i=0; i<concrete_shapes.length; i++) {
		root.appendChild(svgfactory.fromShape(concrete_shapes[i], 0, 0));
	    }
	    if (typeof rule.legend_label !== 'undefined') {
		var font_size = 12;
		var text_node = svgfactory.text(rule.legend_label, model.getCellWidth(true) + 5, view.base_height/2, font_size, 'Arial', 'normal');
		target_svg.appendChild(text_node);
		var height = text_node.getBBox().height;
		text_node.setAttribute('y', parseFloat(text_node.getAttribute('y')) - height/2);
		target_svg.removeChild(text_node);
		root.appendChild(text_node);
	    }
	} else if (config.type === 'number') {
	    var num_decimal_digits = 2;
	    var display_range = config.range.map(function(x) {
		var num_digit_multiplier = Math.pow(10, num_decimal_digits);
		return Math.round(x * num_digit_multiplier) / num_digit_multiplier;
	    });
	    root.appendChild(svgfactory.text(display_range[0], 0, 0, 12, 'Arial', 'normal'));
	    root.appendChild(svgfactory.text(display_range[1], 50, 0, 12, 'Arial', 'normal'));
	    var mesh = 100;
	    var points = [];
	    points.push([5, 20]);
	    for (var i=0; i<mesh; i++) {
		var t = i/mesh;
		var h = config.interpFn((1-t)*config.range[0] + t*config.range[1]);
		var height = 20*h;
		points.push([5 + 40*i/mesh, 20-height]);
	    }
	    points.push([45, 20]);
	    root.appendChild(svgfactory.path(points, config.color, config.color));
	} else if (config.type === 'gradient') {
	    var num_decimal_digits = 2;
	    var display_range = config.range.map(function(x) {
		var num_digit_multiplier = Math.pow(10, num_decimal_digits);
		return Math.round(x * num_digit_multiplier) / num_digit_multiplier;
	    });
	    var gradient = svgfactory.gradient(config.colorFn);
	    var gradient_id = gradient.getAttribute("id");
	    target_defs.appendChild(gradient);
	    root.appendChild(svgfactory.text(display_range[0], 0, 0, 12, 'Arial', 'normal'));
	    root.appendChild(svgfactory.text(display_range[1], 120, 0, 12, 'Arial', 'normal'));
	    root.appendChild(svgfactory.rect(30,0,60,20,"url(#"+gradient_id+")"));
	}
	return root;
    };
    
    OncoprintLegendView.prototype.setWidth = function(w, model) {
	this.width = w;
	renderLegend(this, model);
    }
    OncoprintLegendView.prototype.removeTrack = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.addTracks = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.setTrackData = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.shareRuleSet = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.setRuleSet = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.hideTrackLegends = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.showTrackLegends = function(model) {
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.suppressRendering = function() {
	this.rendering_suppressed = true;
    }
    
    OncoprintLegendView.prototype.releaseRendering = function(model) {
	this.rendering_suppressed = false;
	renderLegend(this, model);
    }
    
    OncoprintLegendView.prototype.toSVGGroup = function(model, offset_x, offset_y) {
	var root = svgfactory.group((offset_x || 0), (offset_y || 0));
	this.$svg.append(root);
	renderLegend(this, model, root, true);
	root.parentNode.removeChild(root);
	return root;
    }
    
    return OncoprintLegendView;
})();

module.exports = OncoprintLegendView;
},{"./svgfactory.js":34,"jquery":11}],22:[function(require,module,exports){
var $ = require('jquery');
var gl_matrix = require('gl-matrix');
var OncoprintZoomSlider = require('./oncoprintzoomslider.js');

var arrayFindIndex = function (arr, callback, start_index) {
    start_index = start_index || 0;
    for (var i = start_index; i < arr.length; i++) {
	if (callback(arr[i])) {
	    return i;
	}
    }
    return -1;
};

var getWebGLCanvasContext = function (view) {
    try {
	var canvas = view.$canvas[0];
	var ctx = canvas.getContext("experimental-webgl", {alpha: false, antialias: true});
	ctx.clearColor(1.0, 1.0, 1.0, 1.0);
	ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
	ctx.viewportWidth = canvas.width;
	ctx.viewportHeight = canvas.height;
	ctx.viewport(0, 0, ctx.viewportWidth, ctx.viewportHeight);
	ctx.enable(ctx.DEPTH_TEST);
	ctx.enable(ctx.BLEND);
	ctx.blendEquation(ctx.FUNC_ADD);
	ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
	ctx.depthMask(false);

	return ctx;
    } catch (e) {
	return null;
    }
};
var createShaderProgram = function (view, vertex_shader, fragment_shader) {
    var program = view.ctx.createProgram();
    view.ctx.attachShader(program, vertex_shader);
    view.ctx.attachShader(program, fragment_shader);

    view.ctx.linkProgram(program);

    var success = view.ctx.getProgramParameter(program, view.ctx.LINK_STATUS);
    if (!success) {
	var msg = view.ctx.getProgramInfoLog(program);
	view.ctx.deleteProgram(program);
	throw "Unable to link shader program: " + msg;
    }

    return program;
};
var createShader = function (view, source, type) {
    var shader = view.ctx.createShader(view.ctx[type]);
    view.ctx.shaderSource(shader, source);
    view.ctx.compileShader(shader);

    var success = view.ctx.getShaderParameter(shader, view.ctx.COMPILE_STATUS);
    if (!success) {
	var msg = view.ctx.getShaderInfoLog(shader);
	view.ctx.deleteShader(shader);
	throw "Unable to compile shader: " + msg;
    }

    return shader;
};
var getWebGLContextAndSetUpMatrices = function (view) {
    view.ctx = getWebGLCanvasContext(view);
    (function initializeMatrices(self) {
	var mvMatrix = gl_matrix.mat4.create();
	gl_matrix.mat4.lookAt(mvMatrix, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
	self.mvMatrix = mvMatrix;

	var pMatrix = gl_matrix.mat4.create();
	gl_matrix.mat4.ortho(pMatrix, 0, self.ctx.viewportWidth, self.ctx.viewportHeight, 0, -5, 1000); // y axis inverted so that y increases down like SVG
	self.pMatrix = pMatrix;
    })(view);
};
var setUpShaders = function(self, vertex_bank_size) {
    var vertex_shader_source = ['precision highp float;',
	'attribute float aPosVertex;',
	'attribute float aColVertex;',
	'attribute float aVertexOncoprintColumn;',
	'uniform float columnWidth;',
	'uniform float zoomX;',
	'uniform float zoomY;',
	'uniform mat4 uMVMatrix;',
	'uniform mat4 uPMatrix;',
	'uniform float offsetY;',
	'uniform float positionBitPackBase;',
	'uniform float texSize;',
	'varying float texCoord;',
	'vec3 unpackVec3(float packedVec3, float base) {',
	'	float pos0 = floor(packedVec3 / (base*base));',
	'	float pos0Contr = pos0*base*base;',
	'	float pos1 = floor((packedVec3 - pos0Contr)/base);',
	'	float pos1Contr = pos1*base;',
	'	float pos2 = packedVec3 - pos0Contr - pos1Contr;',
	'	return vec3(pos0, pos1, pos2);',
	'}',
	'void main(void) {',
	'	gl_Position = vec4(unpackVec3(aPosVertex, positionBitPackBase), 1.0);',
	'	gl_Position[0] += aVertexOncoprintColumn*columnWidth;',
	'	gl_Position[1] += offsetY;',
	'	gl_Position *= vec4(zoomX, zoomY, 1.0, 1.0);',
	'	gl_Position = uPMatrix * uMVMatrix * gl_Position;',
	'	texCoord = (aColVertex + 0.5) / texSize;',
	'}'].join('\n');
	 var fragment_shader_source = ['precision mediump float;',
		'varying float texCoord;',
		'uniform sampler2D uSampler;',
		'void main(void) {',
		'   gl_FragColor = texture2D(uSampler, vec2(texCoord, 0.5));',
		'}'].join('\n');
	var vertex_shader = createShader(self, vertex_shader_source, 'VERTEX_SHADER');
	    var fragment_shader = createShader(self, fragment_shader_source, 'FRAGMENT_SHADER');

	    var shader_program = createShaderProgram(self, vertex_shader, fragment_shader);
	    shader_program.vertexPositionAttribute = self.ctx.getAttribLocation(shader_program, 'aPosVertex');
	    self.ctx.enableVertexAttribArray(shader_program.vertexPositionAttribute);
	    shader_program.vertexColorAttribute = self.ctx.getAttribLocation(shader_program, 'aColVertex');
	    self.ctx.enableVertexAttribArray(shader_program.vertexColorAttribute);
	    shader_program.vertexOncoprintColumnAttribute = self.ctx.getAttribLocation(shader_program, 'aVertexOncoprintColumn');
	    self.ctx.enableVertexAttribArray(shader_program.vertexOncoprintColumnAttribute);

	    shader_program.samplerUniform = self.ctx.getUniformLocation(shader_program, 'uSampler');
	    shader_program.pMatrixUniform = self.ctx.getUniformLocation(shader_program, 'uPMatrix');
	    shader_program.mvMatrixUniform = self.ctx.getUniformLocation(shader_program, 'uMVMatrix');
	    shader_program.columnWidthUniform = self.ctx.getUniformLocation(shader_program, 'columnWidth');
	    shader_program.zoomXUniform = self.ctx.getUniformLocation(shader_program, 'zoomX');
	    shader_program.zoomYUniform = self.ctx.getUniformLocation(shader_program, 'zoomY');
	    shader_program.offsetYUniform = self.ctx.getUniformLocation(shader_program, 'offsetY');
	    shader_program.positionBitPackBaseUniform = self.ctx.getUniformLocation(shader_program, 'positionBitPackBase');
	    shader_program.texSizeUniform = self.ctx.getUniformLocation(shader_program, 'texSize');

	    self.shader_program = shader_program;
};

var clamp = function(x, lower, upper) {
    return Math.max(lower, Math.min(upper, x));
};

var OncoprintMinimapView = (function () {

    function OncoprintMinimapView($div, $canvas, $overlay_canvas, model, cell_view, width, height, drag_callback, viewport_callback, horz_zoom_callback, vert_zoom_callback, zoom_to_fit_callback, close_callback) {
	this.$div = $div;
	this.$canvas = $canvas;
	this.$overlay_canvas = $overlay_canvas;

	var self = this;
	var padding = 4;
	var vertical_zoom_area_width = 20;
	var horizontal_zoom_area_height = 20;
	var window_bar_height = 20;

	this.layout_numbers = {
	    window_width: padding + width + padding + vertical_zoom_area_width,
	    window_height: window_bar_height + padding + height + padding + horizontal_zoom_area_height,
	    vertical_zoom_area_width: vertical_zoom_area_width,
	    horizontal_zoom_area_height: horizontal_zoom_area_height,
	    padding: padding,
	    window_bar_height: window_bar_height,
	    canvas_left: padding,
	    canvas_top: window_bar_height + padding,
	};
	this.$div.css({'min-width': this.layout_numbers.window_width,
			'min-height': this.layout_numbers.window_height,
			'outline':'solid 1px black', 'background-color':'#ffffff'});
		    
	this.$window_bar = $('<div>').css({'position':'absolute', 
					    'min-width': this.layout_numbers.window_width,
					    'min-height': this.layout_numbers.window_bar_height,
					    'background-color':'#cccccc'})
						.appendTo(this.$div);
					
	this.$close_btn = $('<div>').css({'position':'absolute',
					    'top': 3,
					    'left': 3,
					    'min-width': this.layout_numbers.window_bar_height - 6,
					    'min-height': this.layout_numbers.window_bar_height - 6,
					    'cursor': 'pointer'})
						.appendTo(this.$div);
	$('<span>').addClass("icon fa fa-times-circle").css('font-size', (this.layout_numbers.window_bar_height - 6) + "px").appendTo(this.$close_btn);
	
	this.$close_btn.click(close_callback || function(){});
	
	this.$canvas[0].width = width;
	this.$canvas[0].height = height;
	this.$canvas.css({'top': this.layout_numbers.canvas_top, 'left':this.layout_numbers.canvas_left});
	this.$overlay_canvas[0].width = width;
	this.$overlay_canvas[0].height = width;
	this.$overlay_canvas.css({'top': this.layout_numbers.canvas_top, 'left':this.layout_numbers.canvas_left, 'outline':'solid 1px #444444'});
	
	this.horizontal_zoom = new OncoprintZoomSlider(this.$div, {'btn_size': this.layout_numbers.horizontal_zoom_area_height - padding,
								    'horizontal': true,
								    'width': width,
								    'init_val': model.getHorzZoom(),
								    'left': padding,
								    'top': this.layout_numbers.canvas_top + height + padding,
								    'onChange': function(val) { horz_zoom_callback(val); }});
	this.vertical_zoom = new OncoprintZoomSlider(this.$div, {'btn_size': this.layout_numbers.vertical_zoom_area_width - padding,
								    'vertical': true,
								    'height': height,
								    'init_val': model.getVertZoom(),
								    'left': this.layout_numbers.canvas_left + width + padding,
								    'top': this.layout_numbers.window_bar_height + padding,
								    'onChange': function(val) { vert_zoom_callback(val); }});							
	
	(function setUpZoomToFitButton() {
	    var btn_height = self.layout_numbers.horizontal_zoom_area_height - padding;
	    var btn_width = self.layout_numbers.vertical_zoom_area_width - padding;
	    var $btn = $('<div>').css({'position': 'absolute',
		'min-height': btn_height,
		'min-width': btn_width,
		'outline': 'solid 1px black',
		'left': self.layout_numbers.canvas_left + width + padding,
		'top': self.layout_numbers.canvas_top + height + padding,
		'background-size': (btn_width - 4) + 'px '+ (btn_height - 4) + 'px',
		'background-position': '2px 2px',
		'cursor': 'pointer'}).addClass('oncoprint-zoomtofit-btn')
		    .appendTo($div);
	    $btn.hover(function () {
		$(this).css({'background-color': '#cccccc'});
	    }, function () {
		$(this).css({'background-color': '#ffffff'});
	    });
	    
	    zoom_to_fit_callback = zoom_to_fit_callback || function() {};
	    $btn.click(zoom_to_fit_callback);
	})();
	getWebGLContextAndSetUpMatrices(this);
	setUpShaders(this);
	this.overlay_ctx = $overlay_canvas[0].getContext("2d");

	this.img = new Image();
	this.current_rect = {'top': 0, 'left': 0, 'width': 0, 'height': 0, 'col':0, 'num_cols':0};

	var self = this;
	this.img.onload = function () {
	    self.ctx.drawImage(img, 0, 0);
	};

	// Set up dragging
	var resize_hit_zone = 5;
	var mouseInRectDragZone = function (x, y) {
	    return ((x >= self.current_rect.left + resize_hit_zone) &&
		    (x <= self.current_rect.left + self.current_rect.width - resize_hit_zone) &&
		    (y >= self.current_rect.top + resize_hit_zone) &&
		    (y <= self.current_rect.top + self.current_rect.height - resize_hit_zone));
	};
	var mouseInsideRectHitZone = function(x,y) {
	    return (x >= self.current_rect.left - resize_hit_zone) && 
		    (x <= self.current_rect.left + self.current_rect.width + resize_hit_zone) &&
		    (y >= self.current_rect.top - resize_hit_zone) && 
		    (y <= self.current_rect.top + self.current_rect.height + resize_hit_zone);
	};
	var mouseInRightHorzResizeZone = function (x,y) {
	    return !mouseInTopLeftResizeZone(x,y) && !mouseInTopRightResizeZone(x,y) &&
		    !mouseInBottomLeftResizeZone(x,y) && !mouseInBottomRightResizeZone(x,y) &&
		    mouseInsideRectHitZone(x,y) &&
		    (Math.abs(x - (self.current_rect.left + self.current_rect.width)) < resize_hit_zone);
	};
	var mouseInLeftHorzResizeZone = function (x,y) {
	    return !mouseInTopLeftResizeZone(x,y) && !mouseInTopRightResizeZone(x,y) &&
		    !mouseInBottomLeftResizeZone(x,y) && !mouseInBottomRightResizeZone(x,y) &&
		    mouseInsideRectHitZone(x,y) &&
		    (Math.abs(x - self.current_rect.left) < resize_hit_zone);
	};
	var mouseInTopVertResizeZone = function (x,y) {
	    return !mouseInTopLeftResizeZone(x,y) && !mouseInTopRightResizeZone(x,y) &&
		    !mouseInBottomLeftResizeZone(x,y) && !mouseInBottomRightResizeZone(x,y) &&
		    mouseInsideRectHitZone(x,y) &&
		    (Math.abs(y - self.current_rect.top) < resize_hit_zone);
	};
	var mouseInBottomVertResizeZone = function (x, y) {
	    return !mouseInTopLeftResizeZone(x, y) && !mouseInTopRightResizeZone(x, y) &&
		    !mouseInBottomLeftResizeZone(x, y) && !mouseInBottomRightResizeZone(x, y) &&
		    mouseInsideRectHitZone(x,y) &&
		    (Math.abs(y - (self.current_rect.top + self.current_rect.height)) < resize_hit_zone);
	};
	var mouseInTopLeftResizeZone = function(x,y) {
	    return (Math.abs(y - self.current_rect.top) < resize_hit_zone) &&
		    (Math.abs(x - self.current_rect.left) < resize_hit_zone);
	};
	var mouseInBottomLeftResizeZone = function(x,y) {
	    return (Math.abs(y - (self.current_rect.top + self.current_rect.height)) < resize_hit_zone) &&
		    (Math.abs(x - self.current_rect.left) < resize_hit_zone);
	};
	var mouseInTopRightResizeZone = function(x,y) {
	    return (Math.abs(y - self.current_rect.top) < resize_hit_zone) &&
		    (Math.abs(x - (self.current_rect.left + self.current_rect.width)) < resize_hit_zone);
	};
	var mouseInBottomRightResizeZone = function(x,y) {
	    return (Math.abs(y - (self.current_rect.top + self.current_rect.height)) < resize_hit_zone) &&
		    (Math.abs(x - (self.current_rect.left + self.current_rect.width)) < resize_hit_zone);
	};
	
	this.resize_hover = false;
	var updateRectResizeHoverLocation = function(x,y) {
	    if (typeof x === "undefined") {
		self.resize_hover = false;
	    } else {
		if (mouseInRightHorzResizeZone(x, y)) {
		    self.resize_hover = "r";
		} else if (mouseInLeftHorzResizeZone(x, y)) {
		    self.resize_hover = "l";
		} else if (mouseInTopVertResizeZone(x, y)) {
		    self.resize_hover = "t";
		} else if (mouseInBottomVertResizeZone(x, y)) {
		    self.resize_hover = "b";
		} else if (mouseInTopLeftResizeZone(x, y)) {
		    self.resize_hover = "tl";
		} else if (mouseInBottomRightResizeZone(x, y)) {
		    self.resize_hover = "br";
		} else if (mouseInBottomLeftResizeZone(x, y)) {
		    self.resize_hover = "bl";
		} else if (mouseInTopRightResizeZone(x, y)) {
		    self.resize_hover = "tr";
		} else {
		    self.resize_hover = false;
		}
	    }
	};
	var updateCSSCursor = function(x, y) {
	    var cursor_val;
	    if (typeof x === "undefined") {
		cursor_val = 'auto';
	    } else {
		if (mouseInRectDragZone(x, y)) {
		    cursor_val = 'move';
		} else if (mouseInRightHorzResizeZone(x, y) || mouseInLeftHorzResizeZone(x, y)) {
		    cursor_val = 'ew-resize';
		} else if (mouseInTopVertResizeZone(x, y) || mouseInBottomVertResizeZone(x, y)) {
		    cursor_val = 'ns-resize';
		} else if (mouseInTopLeftResizeZone(x, y) || mouseInBottomRightResizeZone(x, y)) {
		    cursor_val = 'nwse-resize';
		} else if (mouseInBottomLeftResizeZone(x, y) || mouseInTopRightResizeZone(x, y)) {
		    cursor_val = 'nesw-resize';
		} else {
		    cursor_val = 'auto';
		}
	    }
	    $div.css('cursor', cursor_val);
	};
	var getCanvasMouse = function(view, div_mouse_x, div_mouse_y) {
	    var canv_top = parseInt(view.$canvas[0].style.top, 10);
	    var canv_left = parseInt(view.$canvas[0].style.left, 10);
	    var canv_width = parseInt(view.$canvas[0].width, 10);
	    var canv_height = parseInt(view.$canvas[0].height, 10);
	    
	    var mouse_x = div_mouse_x - canv_left;
	    var mouse_y = div_mouse_y - canv_top;
	    
	    var outside = mouse_x < 0 || mouse_x >= canv_width || mouse_y < 0 || mouse_y >= canv_height;
	    
	    return {'mouse_x': mouse_x,
		    'mouse_y': mouse_y,
		    'outside': outside};
	};
	var dragging = false;
	var drag_type = false;
	var drag_start_col = -1;
	var drag_start_vert_scroll = -1;
	var drag_start_x = -1;
	var drag_start_y = -1;
	var drag_start_vert_zoom = -1;
	var y_ratio = -1;
	$(document).on("mousedown", function (evt) {
	    var offset = self.$div.offset();
	    var overlay_mouse_x = evt.pageX - offset.left;
	    var overlay_mouse_y = evt.pageY - offset.top;
	    var mouse = getCanvasMouse(self, overlay_mouse_x, overlay_mouse_y);
	    
	    if (!mouse.outside) {
		var mouse_x = mouse.mouse_x;
		var mouse_y = mouse.mouse_y;
		dragging = false;
		drag_type = false;


		y_ratio = model.getOncoprintHeight() / parseInt(self.$canvas[0].height, 10);
		if (mouseInRectDragZone(mouse_x, mouse_y)) {
		    drag_type = "move";
		} else if (mouseInRightHorzResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_r";
		} else if (mouseInLeftHorzResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_l";
		} else if (mouseInTopVertResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_t";
		} else if (mouseInBottomVertResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_b";
		} else if (mouseInTopRightResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_tr";
		} else if (mouseInBottomRightResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_br";
		} else if (mouseInTopLeftResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_tl";
		} else if (mouseInBottomLeftResizeZone(mouse_x, mouse_y)) {
		    drag_type = "resize_bl";
		}
		if (drag_type !== false) {
		    dragging = true;
		    drag_start_x = mouse_x;
		    drag_start_y = mouse_y;
		    drag_start_col = Math.floor(model.getHorzScroll() / (model.getCellWidth() + model.getCellPadding()));
		    drag_start_vert_scroll = model.getVertScroll();
		    drag_start_vert_zoom = model.getVertZoom();
		    drag_start_rect = self.current_rect;
		}
	    }
	});
	$(document).on("mousemove", function (evt) {
	    var offset = self.$div.offset();
	    var overlay_mouse_x = evt.pageX - offset.left;
	    var overlay_mouse_y = evt.pageY - offset.top;
	    var mouse = getCanvasMouse(self, overlay_mouse_x, overlay_mouse_y);
	    var mouse_x = mouse.mouse_x;
	    var mouse_y = mouse.mouse_y;
	    var zoom = getZoom(self, model);
	    var cell_width = model.getCellWidth(true)*zoom.x;
	    if (dragging) {
		evt.preventDefault();
		var delta_col = Math.floor(mouse_x / cell_width) - Math.floor(drag_start_x / cell_width);
		var delta_y = mouse_y - drag_start_y;
		if (drag_type === "move") {
		    var delta_y_scroll = delta_y * y_ratio;
		    drag_callback((drag_start_col + delta_col)*(model.getCellWidth() + model.getCellPadding()), drag_start_vert_scroll + delta_y_scroll);
		} else {
		    var render_rect;
		    var zoom = getZoom(self, model);
		    var max_num_cols = model.getIdOrder().length;
		    var min_num_cols = Math.ceil(cell_view.getWidth() / (model.getCellWidth(true) + model.getCellPadding(true, true)));
		    var max_height = model.getOncoprintHeight(true) * zoom.y;
		    var min_height = model.getCellViewHeight() * zoom.y;
		    var drag_start_right_col = drag_start_rect.col + drag_start_rect.num_cols;
		    var drag_start_bottom = drag_start_rect.top + drag_start_rect.height;
		    if (drag_type === "resize_r") {
			// Width must be valid
			delta_col = clamp(delta_col, 
					min_num_cols - drag_start_rect.num_cols,
					max_num_cols - drag_start_rect.num_cols);
			// Right must be valid
			delta_col = Math.min(delta_col, max_num_cols - drag_start_right_col);
			render_rect = {
			    'top': drag_start_rect.top,
			    'col': drag_start_rect.col,
			    'num_cols': drag_start_rect.num_cols + delta_col,
			    'height': drag_start_rect.height
			};
		    } else if (drag_type === "resize_l") {
			// Width must be valid
			delta_col = clamp(delta_col,
					drag_start_rect.num_cols - max_num_cols,
					drag_start_rect.num_cols - min_num_cols);
			// Left must be valid
			delta_col = Math.max(delta_col, -drag_start_rect.col);
			render_rect = {
			    'top': drag_start_rect.top,
			    'col': drag_start_rect.col + delta_col,
			    'num_cols': drag_start_rect.num_cols - delta_col,
			    'height': drag_start_rect.height
			};
		    } else if (drag_type === "resize_t") {
			// Height must be valid
			delta_y = clamp(delta_y,
					drag_start_rect.height - max_height,
					drag_start_rect.height - min_height);
			// Top must be valid
			delta_y = Math.max(delta_y, -drag_start_rect.top);
			render_rect = {
			    'top': drag_start_rect.top + delta_y,
			    'col': drag_start_rect.col,
			    'num_cols': drag_start_rect.num_cols,
			    'height': drag_start_rect.height - delta_y
			};
		    } else if (drag_type === "resize_b") {
			// Height must be valid
			delta_y = clamp(delta_y,
					min_height - drag_start_rect.height,
					max_height - drag_start_rect.height);
			// Bottom must be valid
			delta_y = Math.min(delta_y, max_height - drag_start_bottom);
			render_rect = {
			    'top': drag_start_rect.top,
			    'col': drag_start_rect.col,
			    'num_cols': drag_start_rect.num_cols,
			    'height': drag_start_rect.height + delta_y
			};
		    } else if (drag_type === "resize_tr") {
			// Width must be valid
			delta_col = clamp(delta_col, 
					min_num_cols - drag_start_rect.num_cols,
					max_num_cols - drag_start_rect.num_cols);
			// Right must be valid
			delta_col = Math.min(delta_col, max_num_cols - drag_start_right_col);
			// Height must be valid
			delta_y = clamp(delta_y,
					drag_start_rect.height - max_height,
					drag_start_rect.height - min_height);
			// Top must be valid
			delta_y = Math.max(delta_y, -drag_start_rect.top);
			render_rect = {
			    'top': drag_start_rect.top + delta_y,
			    'col': drag_start_rect.col,
			    'num_cols': drag_start_rect.num_cols + delta_col,
			    'height': drag_start_rect.height - delta_y
			};
		    } else if (drag_type === "resize_tl") {
			// Width must be valid
			delta_col = clamp(delta_col,
					drag_start_rect.num_cols - max_num_cols,
					drag_start_rect.num_cols - min_num_cols);
			// Left must be valid
			delta_col = Math.max(delta_col, -drag_start_rect.col);
			// Height must be valid
			delta_y = clamp(delta_y,
					drag_start_rect.height - max_height,
					drag_start_rect.height - min_height);
			// Top must be valid
			delta_y = Math.max(delta_y, -drag_start_rect.top);
			render_rect = {
			    'top': drag_start_rect.top + delta_y,
			    'col': drag_start_rect.col + delta_col,
			    'num_cols': drag_start_rect.num_cols - delta_col,
			    'height': drag_start_rect.height - delta_y
			};
		    } else if (drag_type === "resize_br") {
			// Height must be valid
			delta_y = clamp(delta_y,
					min_height - drag_start_rect.height,
					max_height - drag_start_rect.height);
			// Bottom must be valid
			delta_y = Math.min(delta_y, max_height - drag_start_bottom);
			// Width must be valid
			delta_col = clamp(delta_col, 
					min_num_cols - drag_start_rect.num_cols,
					max_num_cols - drag_start_rect.num_cols);
			// Right must be valid
			delta_col = Math.min(delta_col, max_num_cols - drag_start_right_col);
			render_rect = {
			    'top': drag_start_rect.top,
			    'col': drag_start_rect.col,
			    'num_cols': drag_start_rect.num_cols + delta_col,
			    'height': drag_start_rect.height + delta_y
			};
		    } else if (drag_type === "resize_bl") {
			// Height must be valid
			delta_y = clamp(delta_y,
					min_height - drag_start_rect.height,
					max_height - drag_start_rect.height);
			// Bottom must be valid
			delta_y = Math.min(delta_y, max_height - drag_start_bottom);		
			// Width must be valid
			delta_col = clamp(delta_col,
					drag_start_rect.num_cols - max_num_cols,
					drag_start_rect.num_cols - min_num_cols);
			// Left must be valid
			delta_col = Math.max(delta_col, -drag_start_rect.col);
			render_rect = {
			    'top': drag_start_rect.top,
			    'col': drag_start_rect.col + delta_col,
			    'num_cols': drag_start_rect.num_cols - delta_col,
			    'height': drag_start_rect.height + delta_y
			};
		    }
		    var cell_width = model.getCellWidth(true)*zoom.x;
		    // Compute render left and width
		    render_rect.left = render_rect.col * cell_width;
		    render_rect.width = render_rect.num_cols * cell_width;
		    drawOverlayRect(self, null, null, render_rect);
		}
	    } else {
		if (mouse.outside) {
		    updateCSSCursor();
		    updateRectResizeHoverLocation();
		} else {
		    updateCSSCursor(mouse_x, mouse_y);
		    updateRectResizeHoverLocation(mouse_x, mouse_y);
		}
		drawOverlayRect(self, model, cell_view);
	    }
	});
	var endDrag = function() {
	    if (dragging) {
		if (["resize_t", "resize_b", "resize_l", "resize_r",
		    "resize_tl", "resize_tr", "resize_bl", "resize_br"].indexOf(drag_type) > -1) {
		    viewport_callback({
			'col': self.current_rect.col,
			'scroll_y_proportion': (self.current_rect.top / parseInt(self.$canvas[0].height, 10)),
			'num_cols': self.current_rect.num_cols,
			'zoom_y': (drag_start_rect.height / self.current_rect.height) * drag_start_vert_zoom
		    });
		}
		dragging = false;
		drag_type = false;
	    }
	};
	$(document).on("mouseup", function (evt) {
	    var offset = self.$div.offset();
	    var overlay_mouse_x = evt.pageX - offset.left;
	    var overlay_mouse_y = evt.pageY - offset.top;
	    endDrag();
	    var mouse = getCanvasMouse(self, overlay_mouse_x, overlay_mouse_y);
	    if (!mouse.outside) {
		var mouse_x = mouse.mouse_x;
		var mouse_y = mouse.mouse_y;
		updateCSSCursor(mouse_x, mouse_y);
		updateRectResizeHoverLocation(mouse_x, mouse_y);
	    } else {
		updateCSSCursor();
		updateRectResizeHoverLocation();
	    }
	    drawOverlayRect(self, model, cell_view);
	});
	
	(function setUpWindowDrag() {
	    var start_mouse_x;
	    var start_mouse_y;
	    var start_left;
	    var start_top;
	    var handleDrag = function(evt) {
		evt.preventDefault();
		var delta_mouse_x = evt.pageX - start_mouse_x;
		var delta_mouse_y = evt.pageY - start_mouse_y;
		self.setWindowPosition(start_left + delta_mouse_x, start_top + delta_mouse_y);
	    };
	    self.$window_bar.hover(function() {
		$(this).css({'cursor':'move'});
	    }, function() {
		$(this).css({'cursor':'auto'});
	    });
	    
	    self.$window_bar.on("mousedown", function (evt) {
		start_mouse_x = evt.pageX;
		start_mouse_y = evt.pageY;
		start_left = parseInt(self.$div.css('left'), 10);
		start_top = parseInt(self.$div.css('top'), 10);
		$(document).on("mousemove", handleDrag);
	    });
	    $(document).on("mouseup click", function () {
		$(document).off("mousemove", handleDrag);
	    });
	})();
	
    }

    var getTrackBuffers = function (view, cell_view, track_id) {
	var pos_buffer = view.ctx.createBuffer();
	var pos_array = cell_view.vertex_data[track_id].pos_array;

	view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, pos_buffer);
	view.ctx.bufferData(view.ctx.ARRAY_BUFFER, new Float32Array(pos_array), view.ctx.STATIC_DRAW);
	pos_buffer.itemSize = 1;
	pos_buffer.numItems = pos_array.length / pos_buffer.itemSize;
	
	var col_buffer = view.ctx.createBuffer();
	var col_array = cell_view.vertex_data[track_id].col_array;

	view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, col_buffer);
	view.ctx.bufferData(view.ctx.ARRAY_BUFFER, new Float32Array(col_array), view.ctx.STATIC_DRAW);
	col_buffer.itemSize = 1;
	col_buffer.numItems = col_array.length / col_buffer.itemSize;

	var tex = view.ctx.createTexture();
	view.ctx.bindTexture(view.ctx.TEXTURE_2D, tex);

	var color_bank = cell_view.vertex_data[track_id].col_bank;
	var width = Math.pow(2, Math.ceil(Math.log2(color_bank.length / 4)));
	while (color_bank.length < 4 * width) {
	    color_bank.push(0);
	}
	var height = 1;
	view.ctx.texImage2D(view.ctx.TEXTURE_2D, 0, view.ctx.RGBA, width, height, 0, view.ctx.RGBA, view.ctx.UNSIGNED_BYTE, new Uint8Array(color_bank));
	view.ctx.texParameteri(view.ctx.TEXTURE_2D, view.ctx.TEXTURE_MIN_FILTER, view.ctx.NEAREST);
	view.ctx.texParameteri(view.ctx.TEXTURE_2D, view.ctx.TEXTURE_MAG_FILTER, view.ctx.NEAREST);
	
	var color_texture = {'texture': tex, 'size': width};

	var vertex_column_buffer = view.ctx.createBuffer();
	var vertex_column_array = cell_view.vertex_column_array[track_id];
	view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, vertex_column_buffer);
	view.ctx.bufferData(view.ctx.ARRAY_BUFFER, new Float32Array(vertex_column_array), view.ctx.STATIC_DRAW);
	vertex_column_buffer.itemSize = 1;
	vertex_column_buffer.numItems = vertex_column_array.length / vertex_column_buffer.itemSize;

	return {'position': pos_buffer,
		'color': col_buffer,
		'color_tex': color_texture,
		'column': vertex_column_buffer};
    };

    var drawOncoprint = function (view, model, cell_view) {
	if (view.rendering_suppressed) {
	    return;
	}

	var zoom = getZoom(view, model);

	view.ctx.clearColor(1.0, 1.0, 1.0, 1.0);
	view.ctx.clear(view.ctx.COLOR_BUFFER_BIT | view.ctx.DEPTH_BUFFER_BIT);

	var tracks = model.getTracks();
	for (var i = 0; i < tracks.length; i++) {
	    var track_id = tracks[i];
	    var cell_top = model.getCellTops(track_id, true);
	    var buffers = getTrackBuffers(view, cell_view, track_id);
	    if (buffers.position.numItems === 0) {
		continue;
	    }
	    
	    view.ctx.useProgram(view.shader_program);
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, buffers.position);
	    view.ctx.vertexAttribPointer(view.shader_program.vertexPositionAttribute, buffers.position.itemSize, view.ctx.FLOAT, false, 0, 0);
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, buffers.color);
	    view.ctx.vertexAttribPointer(view.shader_program.vertexColorAttribute, buffers.color.itemSize, view.ctx.FLOAT, false, 0, 0);
	    
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, buffers.column);
	    view.ctx.vertexAttribPointer(view.shader_program.vertexOncoprintColumnAttribute, buffers.column.itemSize, view.ctx.FLOAT, false, 0, 0);

	    view.ctx.activeTexture(view.ctx.TEXTURE0);
	    view.ctx.bindTexture(view.ctx.TEXTURE_2D, buffers.color_tex.texture);
	    view.ctx.uniform1i(view.shader_program.samplerUniform, 0);
	    view.ctx.uniform1f(view.shader_program.texSizeUniform, buffers.color_tex.size);
	    
	    view.ctx.uniformMatrix4fv(view.shader_program.pMatrixUniform, false, view.pMatrix);
	    view.ctx.uniformMatrix4fv(view.shader_program.mvMatrixUniform, false, view.mvMatrix);
	    view.ctx.uniform1f(view.shader_program.columnWidthUniform, model.getCellWidth(true));
	    view.ctx.uniform1f(view.shader_program.zoomXUniform, zoom.x);
	    view.ctx.uniform1f(view.shader_program.zoomYUniform, zoom.y);
	    view.ctx.uniform1f(view.shader_program.offsetYUniform, cell_top);
	    view.ctx.uniform1f(view.shader_program.positionBitPackBaseUniform, cell_view.position_bit_pack_base);

	    view.ctx.drawArrays(view.ctx.TRIANGLES, 0, buffers.position.numItems);
	}
    };
    var getZoom = function (view, model) {
	var zoom_x = parseInt(view.$canvas[0].width, 10) / model.getOncoprintWidthNoColumnPadding(true);
	var zoom_y = parseInt(view.$canvas[0].height, 10) / model.getOncoprintHeight(true);
	zoom_x = Math.max(0, Math.min(1, zoom_x));
	zoom_y = Math.max(0, Math.min(1, zoom_y));
	return {
	    x: zoom_x,
	    y: zoom_y
	};
    };
    
    var drawOverlayRect = function (view, model, cell_view, opt_rect) {
	if (view.rendering_suppressed) {
	    return;
	}

	var left, width, top, height, col, num_cols;
	if (opt_rect) {
	    left = opt_rect.left;
	    width = opt_rect.width;
	    top = opt_rect.top;
	    height = opt_rect.height;
	    col = opt_rect.col;
	    num_cols = opt_rect.num_cols;
	} else {
	    var cell_width = model.getCellWidth(true);
	    var cell_padding = model.getCellPadding(true);
	    var viewport = cell_view.getViewportOncoprintSpace(model);

	    var zoom = getZoom(view, model);
	    col = Math.floor(viewport.left / (cell_width + cell_padding));
	    num_cols = Math.min(model.getIdOrder().length - col,
				Math.floor(viewport.right / (cell_width + cell_padding)) - Math.floor(viewport.left / (cell_width + cell_padding)));
	    left = col * cell_width * zoom.x;
	    width = num_cols * cell_width * zoom.x;
	    top = viewport.top * zoom.y;
	    height = (viewport.bottom - viewport.top) * zoom.y;
	}

	var ctx = view.overlay_ctx;
	var canv = view.$overlay_canvas[0];
	var canv_width = parseInt(canv.width, 10);
	var canv_height = parseInt(canv.height, 10);
	
	// Clear
	ctx.fillStyle = "rgba(0,0,0,0)";
	ctx.clearRect(0, 0, canv_width, canv_height);
	// Draw rectangle
	ctx.fillStyle = "rgba(255,255,255,0.4)";
	ctx.fillRect(left, top, width, height);
	// Draw border line by line
	var unhover_color = "rgba(0,0,0,0.75)";
	var hover_color = "rgba(255,0,0,1)";
	var unhover_width = 1;
	var hover_width = 2;
	var top_is_hovered = view.resize_hover === "t" || view.resize_hover === "tr" || view.resize_hover === "tl";
	var right_is_hovered = view.resize_hover === "r" || view.resize_hover === "tr" || view.resize_hover === "br";
	var bottom_is_hovered = view.resize_hover === "b" || view.resize_hover === "br" || view.resize_hover === "bl";
	var left_is_hovered = view.resize_hover === "l" || view.resize_hover === "tl" || view.resize_hover === "bl";
	// Draw top border
	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.strokeStyle = top_is_hovered ? hover_color : unhover_color;
	ctx.lineWidth = top_is_hovered ? hover_width : unhover_width;
	ctx.lineTo(left+width, top);
	ctx.stroke();
	// Draw right border
	ctx.beginPath();
	ctx.moveTo(left+width, top);
	ctx.strokeStyle = right_is_hovered ? hover_color : unhover_color;
	ctx.lineWidth = right_is_hovered ? hover_width : unhover_width;
	ctx.lineTo(left+width, top+height);
	ctx.stroke();
	// Draw bottom border
	ctx.beginPath();
	ctx.moveTo(left+width, top+height);
	ctx.strokeStyle = bottom_is_hovered ? hover_color : unhover_color;
	ctx.lineWidth = bottom_is_hovered ? hover_width : unhover_width;
	ctx.lineTo(left, top+height);
	ctx.stroke();
	// Draw left border
	ctx.beginPath();
	ctx.moveTo(left, top+height);
	ctx.strokeStyle = left_is_hovered ? hover_color : unhover_color;
	ctx.lineWidth = left_is_hovered ? hover_width : unhover_width;
	ctx.lineTo(left, top);
	ctx.stroke();
	
	view.current_rect = {
	    'top':top,
	    'left':left,
	    'width':width,
	    'height':height,
	    'col': col,
	    'num_cols': num_cols
	};
    };
    var drawOncoprintAndOverlayRect = function (view, model, cell_view) {
	if (view.rendering_suppressed) {
	    return;
	}
	drawOncoprint(view, model, cell_view);
	drawOverlayRect(view, model, cell_view);
    };

    OncoprintMinimapView.prototype.moveTrack = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.addTracks = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.removeTrack = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setHorzZoom = function (model, cell_view) {
	drawOverlayRect(this, model, cell_view);
	this.horizontal_zoom.setSliderValue(model.getHorzZoom());
    }
    OncoprintMinimapView.prototype.setVertZoom = function (model, cell_view) {
	drawOverlayRect(this, model, cell_view);
	this.vertical_zoom.setSliderValue(model.getVertZoom());
    }
    OncoprintMinimapView.prototype.setZoom = function(model, cell_view) {
	drawOverlayRect(this, model, cell_view);
	this.horizontal_zoom.setSliderValue(model.getHorzZoom());
	this.vertical_zoom.setSliderValue(model.getVertZoom());
    }
    OncoprintMinimapView.prototype.setScroll = function (model, cell_view) {
	drawOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setHorzScroll = function (model, cell_view) {
	drawOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setVertScroll = function (model, cell_view) {
	drawOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setViewport = function (model, cell_view) {
	drawOverlayRect(this, model, cell_view);
	this.horizontal_zoom.setSliderValue(model.getHorzZoom());
	this.vertical_zoom.setSliderValue(model.getVertZoom());
    }
    OncoprintMinimapView.prototype.sort = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setTrackData = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.shareRuleSet = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setRuleSet = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.setIdOrder = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.suppressRendering = function () {
	this.rendering_suppressed = true;
    }
    OncoprintMinimapView.prototype.releaseRendering = function (model, cell_view) {
	this.rendering_suppressed = false;
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    OncoprintMinimapView.prototype.hideIds = function (model, cell_view) {
	drawOncoprintAndOverlayRect(this, model, cell_view);
    }

    OncoprintMinimapView.prototype.setWindowPosition = function(x, y) {
	this.$div.css({'top': y, 'left': x});
    }
    
    OncoprintMinimapView.prototype.setWidth = function (w, model, cell_view) {
	this.$canvas[0].width = w;
	this.$overlay_canvas[0].width = w;
	getWebGLContextAndSetUpMatrices(this);
	setUpShaders(this);
	this.overlay_ctx = this.$overlay_canvas[0].getContext("2d");

	drawOncoprintAndOverlayRect(this, model, cell_view);
    }
    return OncoprintMinimapView;
})();

module.exports = OncoprintMinimapView;
},{"./oncoprintzoomslider.js":32,"gl-matrix":1,"jquery":11}],23:[function(require,module,exports){
var binarysearch = require('./binarysearch.js');
var hasElementsInInterval = require('./haselementsininterval.js');
var CachedProperty = require('./CachedProperty.js');

function ifndef(x, val) {
    return (typeof x === "undefined" ? val : x);
}

var UnionOfSets = (function() {
    // a set, to be passed in as argument, is an object where the values are truthy
    function UnionOfSets() {
	this.union_count = {};
	this.sets = {};
    }
    var setOfKeys = function (obj) {
	var set = {};
	for (var k in obj) {
	    if (typeof obj[k] !== 'undefined') {
		set[k] = true;
	    }
	}
	return set;
    };
    UnionOfSets.prototype.putSet = function(id, set) {
	this.removeSet(id);
	this.sets[id] = set;
	
	var union_count = this.union_count;
	for (var k in set) {
	    if (set[k]) {
		this.union_count[k] = this.union_count[k] || 0;
		this.union_count[k] += 1;
	    }
	}
    }
    UnionOfSets.prototype.removeSet = function(id) {
	var union_count = this.union_count;
	var old_set = this.sets[id] || {};
	for (var k in old_set) {
	    if (old_set[k]) {
		union_count[k] -= 1;
		if (union_count[k] === 0) {
		    delete union_count[k];
		}
	    }
	}
	delete this.sets[id];
    }
    UnionOfSets.prototype.getUnion = function() {
	return setOfKeys(this.union_count);
    }
    return UnionOfSets;
})();

var setUnion = function(list_of_sets) {
    var union = {};
    for (var i=0; i<list_of_sets.length; i++) {
	var set = list_of_sets[i];
	for (var k in set) {
	    if (set.hasOwnProperty(k)) {
		union[k] = true;
	    }
	}
    }
    return union;
};

var objectValues = function(obj) {
    return Object.keys(obj).map(function(key) {
	return obj[key];
    });
};

var arrayUnique = function(arr) {
    var present = {};
    var unique = [];
    for (var i=0; i<arr.length; i++) {
	if (typeof present[arr[i]] === 'undefined') {
	    present[arr[i]] = true;
	    unique.push(arr[i]);
	}
    }
    return unique;
};

var copyShallowObject = function(obj) {
    var copy = {};
    for (var key in obj) {
	if (obj.hasOwnProperty(key)) {
	    copy[key] = obj[key];
	}
    }
    return copy;
};

var clamp = function(x, lower, upper) {
    return Math.min(upper, Math.max(lower, x));
};

var OncoprintModel = (function () {
    var MIN_ZOOM_PIXELS = 100;
    var MIN_CELL_HEIGHT_PIXELS = 3;
    function OncoprintModel(init_cell_padding, init_cell_padding_on,
	    init_horz_zoom, init_vert_zoom, 
	    init_cell_width, init_track_group_padding) {
		
	var model = this;	
	
	// Global properties
	this.sort_config = {};
	this.rendering_suppressed_depth = 0;
	
	// Rendering Properties
	this.max_height = 500;
	this.cell_width = ifndef(init_cell_width, 6);
	this.horz_zoom = ifndef(init_horz_zoom, 1);
	this.vert_zoom = ifndef(init_vert_zoom, 1);
	this.horz_scroll = 0;
	this.vert_scroll = 0;
	this.bottom_padding = 0;
	this.track_group_padding = ifndef(init_track_group_padding, 10);
	this.cell_padding = ifndef(init_cell_padding, 3);
	this.cell_padding_on = ifndef(init_cell_padding_on, true);
	this.cell_padding_off_cell_width_threshold = 2;
	this.cell_padding_off_because_of_zoom = (this.getCellWidth() < this.cell_padding_off_cell_width_threshold);
	this.id_order = [];
	this.hidden_ids = {};
	
	// Track Properties
	this.track_label = {};
	this.track_description = {};
	this.cell_height = {};
	this.track_padding = {};
	this.track_data_id_key = {};
	this.track_tooltip_fn = {};
	this.track_removable = {};
	this.track_remove_callback = {};
	this.track_sort_cmp_fn = {};
	this.track_sort_direction_changeable = {};
	this.track_sort_direction = {}; // 1: ascending, -1: descending, 0: not
	this.track_data = {};
	this.track_rule_set_id = {}; // track id -> rule set id
	this.track_active_rules = {}; // from track id to active rule map (map with rule ids as keys)
	this.track_info = {};
	this.track_has_column_spacing = {}; // track id -> boolean
	
	// Rule Set Properties
	this.rule_sets = {}; // map from rule set id to rule set
	this.rule_set_active_rules = {}; // map from rule set id to map from rule id to use count
	
	// Cached and Recomputed Properties
	this.visible_id_order = new CachedProperty([], function () {
	    var hidden_ids = model.hidden_ids;
	    return model.id_order.filter(function (id) {
		return !hidden_ids[id];
	    });
	});
	this.track_id_to_datum = new CachedProperty({}, function(model, track_id) {
	    var curr = model.track_id_to_datum.get();
	    if (model.getContainingTrackGroup(track_id) !== null) {
		var map = {};
		var data = model.getTrackData(track_id) || [];
		var data_id_key = model.getTrackDataIdKey(track_id) || '';
		for (var i=0; i<data.length; i++) {
		    map[data[i][data_id_key]] = data[i];
		}
		curr[track_id] = map;
	    } else {
		delete curr[track_id];
	    }
	    return curr;
	});
	this.track_present_ids = new CachedProperty(new UnionOfSets(), function(model, track_id) {
	    var union = model.track_present_ids.get();
	    if (model.getContainingTrackGroup(track_id) !== null) {
		var ids = {};
		var data = model.getTrackData(track_id) || [];
		var data_id_key = model.getTrackDataIdKey(track_id) || '';
		for (var i = 0; i < data.length; i++) {
		    ids[data[i][data_id_key]] = true;
		}
		union.putSet(track_id, ids);
	    } else {
		union.removeSet(track_id);
	    }
	    return union;
	});
	this.present_ids = new CachedProperty({}, function() {
	    return model.track_present_ids.get().getUnion();
	});
	this.track_present_ids.addBoundProperty(this.present_ids);
	
	this.id_to_index = new CachedProperty({}, function() {
	    var id_to_index = {};
	    var id_order = model.getIdOrder(true);
	    for (var i=0; i<id_order.length; i++) {
		id_to_index[id_order[i]] = i;
	    }
	    return id_to_index;
	});
	this.visible_id_to_index = new CachedProperty({}, function() {
	    var id_to_index = {};
	    var id_order = model.getIdOrder();
	    for (var i=0; i<id_order.length; i++) {
		id_to_index[id_order[i]] = i;
	    }
	    return id_to_index;
	});
	this.visible_id_order.addBoundProperty(this.visible_id_to_index);
	
	this.track_groups = [];
	this.track_group_sort_priority = [];
	this.track_group_header = [];
	
	this.track_tops = new CachedProperty({}, function () {
	    var tops = {};
	    var groups = model.getTrackGroups();
	    var y = 0;
	    for (var i = 0; i < groups.length; i++) {
		var group = groups[i];
		if (model.getTrackGroupHeader(i).length > 0 && group.length > 0) {
		    y += model.getTrackGroupHeaderSize();
		}
		for (var j = 0; j < group.length; j++) {
		    var track_id = group[j];
		    tops[track_id] = y;
		    y += model.getTrackHeight(track_id, true);
		}
		if (group.length > 0) {
		    y += model.getTrackGroupPadding(true);
		}
	    }
	    return tops;
	});
	this.cell_tops = new CachedProperty({}, function() {
	    var track_tops = model.track_tops.get();
	    var cell_tops = {};
	    for (var k in track_tops) {
		if (track_tops.hasOwnProperty(k)) {
		    cell_tops[k] = track_tops[k] + model.getTrackPadding(k, true);
		}
	    }
	    return cell_tops;
	});
	this.label_tops = new CachedProperty({}, function() {
	    return model.cell_tops.get();
	});
	
	this.track_tops.addBoundProperty(this.cell_tops);
	this.cell_tops.addBoundProperty(this.label_tops);
	
	this.track_tops_zoomed = new CachedProperty({}, function () {
	    var tops = {};
	    var groups = model.getTrackGroups();
	    var y = 0;
	    for (var i = 0; i < groups.length; i++) {
		var group = groups[i];
		for (var j = 0; j < group.length; j++) {
		    var track_id = group[j];
		    tops[track_id] = y;
		    y += model.getTrackHeight(track_id);
		}
		if (group.length > 0) {
		    y += model.getTrackGroupPadding();
		}
	    }
	    return tops;
	});
	this.cell_tops_zoomed = new CachedProperty({}, function() {
	    var track_tops = model.track_tops_zoomed.get();
	    var cell_tops = {};
	    for (var k in track_tops) {
		if (track_tops.hasOwnProperty(k)) {
		    cell_tops[k] = track_tops[k] + model.getTrackPadding(k);
		}
	    }
	    return cell_tops;
	});
	this.label_tops_zoomed = new CachedProperty({}, function() {
	    return model.cell_tops_zoomed.get();
	});
	
	this.track_tops.addBoundProperty(this.track_tops_zoomed);
	this.track_tops_zoomed.addBoundProperty(this.cell_tops_zoomed);
	this.cell_tops_zoomed.addBoundProperty(this.label_tops_zoomed);
	
	this.column_left = new CachedProperty({}, function() {
	    var cell_width = model.getCellWidth(true);
	    var cell_padding = model.getCellPadding(true);
	    var left = {};
	    var ids = model.getIdOrder();
	    for (var i = 0; i < ids.length; i++) {
		left[ids[i]] = i * (cell_width + cell_padding);
	    }
	    return left;
	});
	
	this.zoomed_column_left = new CachedProperty({}, function() {
	    var cell_width = model.getCellWidth();
	    var cell_padding = model.getCellPadding();
	    var left = {};
	    var ids = model.getIdOrder();
	    for (var i = 0; i < ids.length; i++) {
		left[ids[i]] = i * (cell_width + cell_padding);
	    }
	    return left;
	});
	this.column_left_no_padding = new CachedProperty({}, function() {
	    var cell_width = model.getCellWidth(true);
	    var left = {};
	    var ids = model.getIdOrder();
	    for (var i = 0; i < ids.length; i++) {
		left[ids[i]] = i * cell_width;
	    }
	    return left;
	});
	this.column_left.addBoundProperty(this.zoomed_column_left);
	this.column_left.addBoundProperty(this.column_left_no_padding);
	
	this.precomputed_comparator = new CachedProperty({}, function(model, track_id) {
	    var curr_precomputed_comparator = model.precomputed_comparator.get();
	    curr_precomputed_comparator[track_id] = new PrecomputedComparator(model.getTrackData(track_id),
									    model.getTrackSortComparator(track_id),
									    model.getTrackSortDirection(track_id),
									    model.getTrackDataIdKey(track_id));
	    return curr_precomputed_comparator;
	});// track_id -> PrecomputedComparator
    }

    OncoprintModel.prototype.toggleCellPadding = function () {
	this.cell_padding_on = !this.cell_padding_on;
	this.column_left.update();
	return this.cell_padding_on;
    }

    OncoprintModel.prototype.getCellPadding = function (base, dont_consider_zoom) {
	return (this.cell_padding * (base ? 1 : this.horz_zoom)) * (+this.cell_padding_on) * (dont_consider_zoom ? 1 : +(!this.cell_padding_off_because_of_zoom));
    }

    OncoprintModel.prototype.getHorzZoom = function () {
	return this.horz_zoom;
    }

    OncoprintModel.prototype.getHorzZoomToFitNumCols = function(width, num_cols) {
	var cell_width = this.getCellWidth(true);
	var zoom_if_cell_padding_on = clamp(width / (num_cols*(cell_width + this.cell_padding)),
					    0,1);
	var zoom_if_cell_padding_off = clamp(width / (num_cols*cell_width),
					    0,1);
	var zoom;
	if (!this.cell_padding_on) {
	    zoom = zoom_if_cell_padding_off;
	} else {
	    if (cell_width * zoom_if_cell_padding_on < this.cell_padding_off_cell_width_threshold) {
		if (cell_width * zoom_if_cell_padding_off >= this.cell_padding_off_cell_width_threshold) {
		    // Because of cell padding toggling there's no way to get exactly the desired number of columns.
		    // We can see this by contradiction: if we assume that cell padding is on, and try to fit exactly
		    // our number of columns, we end up turning cell padding off (outer if statement). If we assume that
		    // cell padding is off and try to fit our number of columns, we find that cell padding is on (inner if statement).
		    // Thus, it's impossible to show this exact number of columns - we either under or overshoot it. We
		    // thus should overshoot it by as little as possible, show as few columns as possible while still fitting
		    // this amount. It must be exactly at the threshold for switching.
		    // 
		    var unrounded_zoom = this.cell_padding_off_cell_width_threshold / cell_width;
		    var unrounded_num_cols = width / (unrounded_zoom * cell_width);
		    var rounded_num_cols = Math.ceil(unrounded_num_cols);
		    zoom = width / (rounded_num_cols * cell_width);
		} else {
		    zoom = zoom_if_cell_padding_off;
		}
	    } else {
		zoom = zoom_if_cell_padding_on;
	    }
	}
	return zoom;
    }
    OncoprintModel.prototype.getHorzZoomToFit = function(width, ids) {
	ids = ids || [];
	if (ids.length === 0) {
	    return 1;
	}
	var id_to_index_map = this.getVisibleIdToIndexMap();
	var indexes = ids.map(function(id) { return id_to_index_map[id]; });
	var max = Number.NEGATIVE_INFINITY;
	var min = Number.POSITIVE_INFINITY;
	for (var i=0; i<indexes.length; i++) {
	    max = Math.max(indexes[i], max);
	    min = Math.min(indexes[i], min);
	}
	var num_cols = max - min + 1;
	return this.getHorzZoomToFitNumCols(width, num_cols);
    }
    
    OncoprintModel.prototype.getMinHorzZoom = function() {
	return Math.min(MIN_ZOOM_PIXELS / (this.getIdOrder().length*this.getCellWidth(true) + (this.getIdOrder().length-1)*this.getCellPadding(true)), 1);
    }
    
    OncoprintModel.prototype.getMinVertZoom = function() {
	// Can't zoom to be smaller than max height
	// That zoom would be z*this.getOncoprintHeight(true) = max_height
	return this.max_height / this.getOncoprintHeight(true);
    }
    
    OncoprintModel.prototype.setHorzScroll = function(s) {
	this.horz_scroll = Math.max(0, s);
	return this.horz_scroll;
    }
    OncoprintModel.prototype.setVertScroll = function(s) {
	this.vert_scroll = Math.max(0, s);
	return this.vert_scroll;
    }
    OncoprintModel.prototype.setScroll = function(h, v) {
	this.setHorzScroll(h);
	this.setVertScroll(v);
    }
    OncoprintModel.prototype.getHorzScroll = function() {
	return this.horz_scroll;
    }
    OncoprintModel.prototype.getVertScroll = function() {
	return this.vert_scroll;
    }
    OncoprintModel.prototype.setZoom = function(zoom_x, zoom_y) {
	this.setHorzZoom(zoom_x);
	this.setVertZoom(zoom_y);
    }
    var setCellPaddingOffBecauseOfZoom = function(model, val) {
	model.cell_padding_off_because_of_zoom = val;
	model.column_left.update();
    };
    OncoprintModel.prototype.setHorzZoom = function (z) {
	var min_zoom = this.getMinHorzZoom();
	this.horz_zoom = clamp(z, min_zoom, 1);
	this.column_left.update();
	
	if (this.getCellWidth() < this.cell_padding_off_cell_width_threshold && !this.cell_padding_off_because_of_zoom) {
	    setCellPaddingOffBecauseOfZoom(this, true);
	} else if (this.getCellWidth() >= this.cell_padding_off_cell_width_threshold && this.cell_padding_off_because_of_zoom) {
	    setCellPaddingOffBecauseOfZoom(this, false);
	}
	return this.horz_zoom;
    }
    
    
    OncoprintModel.prototype.getVertZoom = function() {
	return this.vert_zoom;
    }
    
    OncoprintModel.prototype.setVertZoom = function (z) {
	var min_zoom = this.getMinVertZoom();
	this.vert_zoom = clamp(z, min_zoom, 1);
	this.track_tops.update();
	return this.vert_zoom;
    }

    OncoprintModel.prototype.hideTrackLegends = function(track_ids) {
	track_ids = [].concat(track_ids);
	for (var i=0; i<track_ids.length; i++) {
	    this.getRuleSet(track_ids[i]).exclude_from_legend = true;
	}
    }
    
    OncoprintModel.prototype.showTrackLegends = function(track_ids) {
	track_ids = [].concat(track_ids);
	for (var i=0; i<track_ids.length; i++) {
	    this.getRuleSet(track_ids[i]).exclude_from_legend = false;
	}
    }

    var clearTrackActiveRules = function(model, track_id) {
	var rule_set_id = model.track_rule_set_id[track_id];
	var track_active_rules = model.track_active_rules[track_id];
	var rule_set_active_rules = model.rule_set_active_rules[rule_set_id];
	
	var track_active_rule_ids = Object.keys(track_active_rules);
	for (var i=0; i<track_active_rule_ids.length; i++) {
	    var rule_id = track_active_rule_ids[i];
	    if (rule_set_active_rules.hasOwnProperty(rule_id)) {
		rule_set_active_rules[rule_id] -= 1;
		if (rule_set_active_rules[rule_id] <= 0) {
		    delete rule_set_active_rules[rule_id];
		}
	    }
	}
	model.track_active_rules[track_id] = {};
    };
    
    var setTrackActiveRules = function(model, track_id, active_rules) {
	clearTrackActiveRules(model, track_id);
	model.track_active_rules[track_id] = active_rules;
	var rule_set_id = model.track_rule_set_id[track_id];
	var rule_set_active_rules = model.rule_set_active_rules[rule_set_id];
	
	var track_active_rule_ids = Object.keys(active_rules);
	for (var i=0; i<track_active_rule_ids.length; i++) {
	    var rule_id = track_active_rule_ids[i];
	    rule_set_active_rules[rule_id] = rule_set_active_rules[rule_id] || 0;
	    rule_set_active_rules[rule_id] += 1;
	}
    };
    
    OncoprintModel.prototype.getIdentifiedShapeListList = function(track_id, use_base_size, sort_by_z) {
	var active_rules = {};
	var data = this.getTrackData(track_id);
	var id_key = this.getTrackDataIdKey(track_id);
	var spacing = this.getTrackHasColumnSpacing(track_id);
	var width = this.getCellWidth(use_base_size) + (!spacing ? this.getCellPadding(use_base_size, true) : 0);
	var shapes = this.getRuleSet(track_id).apply(data, width, this.getCellHeight(track_id, use_base_size), active_rules);
	
	setTrackActiveRules(this, track_id, active_rules);
	
	
	var z_comparator = function(shapeA, shapeB) {
	    var zA = parseFloat(shapeA.z);
	    var zB = parseFloat(shapeB.z);
	    if (zA < zB) {
		return -1;
	    } else if (zA > zB) {
		return 1;
	    } else {
		return 0;
	    }
	};
	return shapes.map(function(shape_list, index) {
	    if (sort_by_z) {
		shape_list.sort(z_comparator);
	    }
	    return {
		id: data[index][id_key],
		shape_list: shape_list
	    };
	});
    }
    
    OncoprintModel.prototype.getActiveRules = function(rule_set_id) {
	var rule_set_active_rules = this.rule_set_active_rules[rule_set_id];
	if (rule_set_active_rules) {
	    return this.rule_sets[rule_set_id].getRulesWithId().filter(function(rule_with_id) {
		return !!rule_set_active_rules[rule_with_id.id];
	    });
	} else {
	    return [];
	}
    }
    
    OncoprintModel.prototype.getRuleSets = function() {
	// return rule sets, sorted by associating each with the lowest track id its on
	var self = this;
	var sorted_tracks = this.getTracks().sort();
	var rule_set_ids = sorted_tracks.map(function(track_id) {
	    return self.track_rule_set_id[track_id];
	});
	var unique_rule_set_ids = arrayUnique(rule_set_ids);
	return unique_rule_set_ids.map(function(rule_set_id) {
	    return self.rule_sets[rule_set_id];
	});
    }

    OncoprintModel.prototype.getTrackHasColumnSpacing = function(track_id) {
	return !!(this.track_has_column_spacing[track_id]);
    }
    
    OncoprintModel.prototype.getCellWidth = function (base) {
	return this.cell_width * (base ? 1 : this.horz_zoom);
    }

    OncoprintModel.prototype.getCellHeight = function (track_id, base) {
	return this.cell_height[track_id] * (base ? 1 : this.vert_zoom);
    }
    
    OncoprintModel.prototype.getTrackInfo = function(track_id) {
	return this.track_info[track_id];
    }
    
    OncoprintModel.prototype.setTrackInfo = function(track_id, msg) {
	this.track_info[track_id] = msg;
    }
    
    OncoprintModel.prototype.getTrackHeight = function(track_id, base) {
	return this.getCellHeight(track_id, base) + 2*this.getTrackPadding(track_id, base);
    }

    OncoprintModel.prototype.getTrackPadding = function (track_id, base) {
	return this.track_padding[track_id] * (base ? 1 : this.vert_zoom);
    }
    OncoprintModel.prototype.getBottomPadding = function() {
	return this.bottom_padding;
    }
    OncoprintModel.prototype.getTrackSortDirection = function(track_id) {
	return this.track_sort_direction[track_id];
    }
    OncoprintModel.prototype.setTrackSortDirection = function(track_id, dir) {
	// see above for dir options
	this.track_sort_direction[track_id] = dir;
	this.precomputed_comparator.update(this, track_id);
    }
    
    OncoprintModel.prototype.setCellPaddingOn = function(cell_padding_on) {
	this.cell_padding_on = cell_padding_on;
	this.column_left.update();
    }
    OncoprintModel.prototype.getIdOrder = function (all) {
	if (all) {
	    return this.id_order; // TODO: should be read-only
	} else {
	    return this.visible_id_order.get();
	}
    }
    OncoprintModel.prototype.getIdToIndexMap = function() {
	return this.id_to_index.get();
    }
    OncoprintModel.prototype.getVisibleIdToIndexMap = function() {
	return this.visible_id_to_index.get();
    }

    OncoprintModel.prototype.getHiddenIds = function () {
	var hidden_ids = this.hidden_ids;
	return this.id_order.filter(function (id) {
	    return !!hidden_ids[id];
	});
    }

    OncoprintModel.prototype.setIdOrder = function (ids) {
	this.id_order = ids.slice();
	Object.freeze(this.id_order);
	this.id_to_index.update();
	this.visible_id_order.update();
	this.column_left.update();
    }

    OncoprintModel.prototype.hideIds = function (to_hide, show_others) {
	if (show_others) {
	    this.hidden_ids = {};
	}
	for (var j = 0, len = to_hide.length; j < len; j++) {
	    this.hidden_ids[to_hide[j]] = true;
	}
	this.visible_id_order.update();
	this.column_left.update();
    }

    OncoprintModel.prototype.setTrackGroupOrder = function(index, track_order) {
	this.track_groups[index] = track_order;
	
	this.track_tops.update();
    }
    
    OncoprintModel.prototype.moveTrackGroup = function (from_index, to_index) {
	var new_groups = [];
	var new_headers = [];
	var group_to_move = this.track_groups[from_index];
	for (var i = 0; i < this.track_groups.length; i++) {
	    if (i !== from_index && i !== to_index) {
		new_groups.push(this.track_groups[i]);
		new_headers.push(this.track_group_header[i]);
	    }
	    if (i === to_index) {
		new_groups.push(group_to_move);
		new_headers.push(this.track_group_header[from_index]);
	    }
	}
	this.track_groups = new_groups;
	this.track_group_header = new_headers;
	this.track_tops.update();
	return this.track_groups;
    }

    OncoprintModel.prototype.addTracks = function (params_list) {
	for (var i = 0; i < params_list.length; i++) {
	    var params = params_list[i];
	    addTrack(this, params.track_id, params.target_group, params.track_group_header,
		    params.cell_height, params.track_padding, params.has_column_spacing,
		    params.data_id_key, params.tooltipFn,
		    params.removable, params.removeCallback, params.label, params.description, params.track_info,
		    params.sortCmpFn, params.sort_direction_changeable, params.init_sort_direction,
		    params.data, params.rule_set);
	}
	this.track_tops.update();
    }
  
    var addTrack = function (model, track_id, target_group, track_group_header,
	    cell_height, track_padding, has_column_spacing,
	    data_id_key, tooltipFn,
	    removable, removeCallback, label, description, track_info,
	    sortCmpFn, sort_direction_changeable, init_sort_direction,
	    data, rule_set) {
	model.track_label[track_id] = ifndef(label, "Label");
	model.track_description[track_id] = ifndef(description, "");
	model.cell_height[track_id] = ifndef(cell_height, 23);
	model.track_padding[track_id] = ifndef(track_padding, 5);
	model.track_has_column_spacing[track_id] = ifndef(has_column_spacing, true);

	model.track_tooltip_fn[track_id] = ifndef(tooltipFn, function (d) {
	    return d + '';
	});
	model.track_removable[track_id] = ifndef(removable, false);
	model.track_remove_callback[track_id] = ifndef(removeCallback, function() {});
	
	model.track_sort_cmp_fn[track_id] = ifndef(sortCmpFn, function () {
	    return 0;
	});
	
	model.track_sort_direction_changeable[track_id] = ifndef(sort_direction_changeable, false);
	model.track_data[track_id] = ifndef(data, []);
	model.track_data_id_key[track_id] = ifndef(data_id_key, 'id');
	
	model.track_info[track_id] = ifndef(track_info, "");
	
	if (typeof rule_set !== 'undefined') {
	    model.rule_sets[rule_set.rule_set_id] = rule_set;
	    model.rule_set_active_rules[rule_set.rule_set_id] = {};
	    model.track_rule_set_id[track_id] = rule_set.rule_set_id;
	}
	model.track_active_rules[track_id] = {};

	model.track_sort_direction[track_id] = ifndef(init_sort_direction, 1);
	
	target_group = ifndef(target_group, 0);
	while (target_group >= model.track_groups.length) {
	    model.track_groups.push([]);
	    model.track_group_header.push("");
	}
	if (track_group_header) {
	    model.track_group_header[target_group] = track_group_header;
	}
	model.track_groups[target_group].push(track_id);
	
	
	
	model.track_id_to_datum.update(model, track_id);
	model.track_present_ids.update(model, track_id);
	model.precomputed_comparator.update(model, track_id);
	
	model.setIdOrder(Object.keys(model.present_ids.get()));
    }

    var _getContainingTrackGroup = function (oncoprint_model, track_id, return_reference) {
	var group;
	track_id = parseInt(track_id);
	for (var i = 0; i < oncoprint_model.track_groups.length; i++) {
	    if (oncoprint_model.track_groups[i].indexOf(track_id) > -1) {
		group = oncoprint_model.track_groups[i];
		break;
	    }
	}
	if (group) {
	    return (return_reference ? group : group.slice());
	} else {
	    return null;
	}
    }

    var isRuleSetUsed = function(model, rule_set_id) {
	var used = false;
	var tracks = model.getTracks();
	for (var i=0; i<tracks.length; i++) {
	    if (model.track_rule_set_id[tracks[i]] === rule_set_id) {
		used = true;
		break;
	    }
	}
	return used;
    }
    
    var removeRuleSet = function(model, rule_set_id) {
	delete model.rule_sets[rule_set_id];
	delete model.rule_set_active_rules[rule_set_id];
    };
   
    OncoprintModel.prototype.removeTrack = function (track_id) {
	var rule_set_id = this.track_rule_set_id[track_id];
	this.track_remove_callback[track_id](track_id);
	
	delete this.track_data[track_id];
	delete this.track_rule_set_id[track_id];
	delete this.track_label[track_id];
	delete this.cell_height[track_id];
	delete this.track_padding[track_id];
	delete this.track_data_id_key[track_id];
	delete this.track_tooltip_fn[track_id];
	delete this.track_removable[track_id];
	delete this.track_remove_callback[track_id];
	delete this.track_sort_cmp_fn[track_id];
	delete this.track_sort_direction_changeable[track_id];
	delete this.track_sort_direction[track_id];
	delete this.track_info[track_id];
	delete this.track_has_column_spacing[track_id];

	var containing_track_group = _getContainingTrackGroup(this, track_id, true);
	if (containing_track_group !== null) {
	    containing_track_group.splice(
		    containing_track_group.indexOf(track_id), 1);
	}
	this.track_tops.update();
	this.track_present_ids.update(this, track_id);
	this.track_id_to_datum.update(this, track_id);
	this.setIdOrder(Object.keys(this.present_ids.get()));
	
	var rule_set_used = isRuleSetUsed(this, rule_set_id);
	if (!rule_set_used) {
	    removeRuleSet(this, rule_set_id);
	}
    }
    
    OncoprintModel.prototype.getOverlappingCell = function(x,y) {
	// First, see if it's in a column
	var id_order = this.getIdOrder();
	var zoomed_column_left = this.getZoomedColumnLeft();
	var nearest_id_index = binarysearch(id_order, x, function(id) { return zoomed_column_left[id];}, true);
	if (nearest_id_index === -1) {
	    return null;
	}
	var id = id_order[nearest_id_index];
	
	// Next, see if it's in a track
	var tracks = this.getTracks();
	var cell_tops = this.getCellTops();
	var nearest_track_index = binarysearch(tracks, y, function (track) {
	    return cell_tops[track];
	}, true);
	if (nearest_track_index === -1) {
	    return null;
	}
	var nearest_track = tracks[nearest_track_index];
	
	// Finally, see if it's inside a cell
	var hitzone_right = zoomed_column_left[id] + this.getCellWidth();
	if (!this.getTrackHasColumnSpacing(nearest_track)) {
	    hitzone_right += this.getCellPadding();
	}
	if (x <= hitzone_right && y < cell_tops[nearest_track] + this.getCellHeight(nearest_track)) {  
	    return {'id': id, 'track': nearest_track, 'top': cell_tops[nearest_track], 'left': zoomed_column_left[id]};
	}
	return null;
    };
    
    OncoprintModel.prototype.getTrackDatum = function(track_id, id) {
	var datum = this.track_id_to_datum.get()[track_id][id];
	if (typeof datum === 'undefined') {
	    datum = null;
	}
	return datum;
    }
    
    OncoprintModel.prototype.getTrackTops = function (desired_track_id) {
	if (typeof desired_track_id === 'undefined') {
	    return copyShallowObject(this.track_tops.get());
	} else {
	    return this.track_tops.get()[desired_track_id];
	}
    }
    
    OncoprintModel.prototype.getZoomedTrackTops = function (desired_track_id) {
	if (typeof desired_track_id === 'undefined') {
	    return copyShallowObject(this.track_tops_zoomed.get());
	} else {
	    return this.track_tops_zoomed.get()[desired_track_id];
	}
    }
    
    OncoprintModel.prototype.getCellTops = function(desired_track_id, base) {
	if (typeof desired_track_id === 'undefined') {
	    return copyShallowObject((base ? this.cell_tops : this.cell_tops_zoomed).get());
	} else {
	    return (base ? this.cell_tops : this.cell_tops_zoomed).get()[desired_track_id];
	}
    }
    OncoprintModel.prototype.getLabelTops = function(desired_track_id, base) {
	if (typeof desired_track_id === 'undefined') {
	    return copyShallowObject((base ? this.label_tops : this.label_tops_zoomed).get());
	} else {
	    return (base ? this.label_tops : this.label_tops_zoomed).get()[desired_track_id];
	}
    }
    
    OncoprintModel.prototype.getContainingTrackGroup = function (track_id) {
	return _getContainingTrackGroup(this, track_id, false);
    }

    OncoprintModel.prototype.setTrackGroupHeader = function(track_group_id, text) {
	this.track_group_header[track_group_id] = text;
	this.track_tops.update();
    }
    
    OncoprintModel.prototype.getTrackGroupHeader = function(track_group_id) {
	return this.track_group_header[track_group_id] || "";
    }
    
    OncoprintModel.prototype.getTrackGroupHeaderSize = function() {
	return 20;
    }
    
    OncoprintModel.prototype.getTrackGroups = function () {
	// TODO: make read-only
	return this.track_groups;
    }

    OncoprintModel.prototype.getTracks = function () {
	var ret = [];
	for (var i = 0; i < this.track_groups.length; i++) {
	    for (var j = 0; j < this.track_groups[i].length; j++) {
		ret.push(this.track_groups[i][j]);
	    }
	}
	return ret;
    }

    OncoprintModel.prototype.getIdsInLeftInterval = function(left, right) {
	var cell_width = this.getCellWidth();
	var cell_padding = this.getCellPadding();
	var id_order = this.getIdOrder();
	
	// left_id_index and right_id_index are inclusive
	var left_id_index = Math.floor(left/(cell_width + cell_padding));
	var left_remainder = left - left_id_index*(cell_width + cell_padding);
	if (left_remainder > cell_width) {
	    left_id_index += 1;
	}
	var right_id_index = Math.floor(right/(cell_width + cell_padding));
	return id_order.slice(left_id_index, right_id_index+1);
    }
    OncoprintModel.prototype.getColumnLeft = function(id) {
	if (typeof id === 'undefined') {
	    return this.column_left.get();
	} else {
	    return this.column_left.get()[id];
	}
    }
    
    OncoprintModel.prototype.getColumnLeftNoPadding = function(id) {
	if (typeof id === 'undefined') {
	    return this.column_left_no_padding.get();
	} else {
	    return this.column_left_no_padding.get()[id];
	}
    }
    
    OncoprintModel.prototype.getZoomedColumnLeft = function(id) {
	if (typeof id === 'undefined') {
	    return this.zoomed_column_left.get();
	} else {
	    return this.zoomed_column_left.get()[id];
	}
    }
    
    
    OncoprintModel.prototype.getOncoprintHeight = function(base) {
	var tracks = this.getTracks();
	var last_track = tracks[tracks.length-1];
	return (base ? this.getTrackTops(last_track) : this.getZoomedTrackTops(last_track))+this.getTrackHeight(last_track, base)
		    + this.getBottomPadding();
    }
    
    OncoprintModel.prototype.getOncoprintWidth = function(base) {
	return this.getIdOrder().length*(this.getCellWidth(base) + this.getCellPadding(base));
    }
    
    OncoprintModel.prototype.getOncoprintWidthNoColumnPadding = function(base) {
	return this.getIdOrder().length*this.getCellWidth(base);
    }
    
    OncoprintModel.prototype.getCellViewHeight = function() {
	return Math.min(this.max_height, this.getOncoprintHeight());
    }
    
    OncoprintModel.prototype.getCellViewWidth = function() {
	return this.getOncoprintWidth();
    }
    OncoprintModel.prototype.moveTrack = function (track_id, new_previous_track) {
	var track_group = _getContainingTrackGroup(this, track_id, true);
	if (track_group !== null) {
	    track_group.splice(track_group.indexOf(track_id), 1);
	    var new_position = (new_previous_track === null ? 0 : track_group.indexOf(new_previous_track)+1);
	    track_group.splice(new_position, 0, track_id);
	}
	
	this.track_tops.update();
    }

    OncoprintModel.prototype.getTrackLabel = function (track_id) {
	return this.track_label[track_id];
    }
    
    OncoprintModel.prototype.getTrackDescription = function(track_id) {
	return this.track_description[track_id];
    }

    OncoprintModel.prototype.getTrackTooltipFn = function (track_id) {
	return this.track_tooltip_fn[track_id];
    }
    OncoprintModel.prototype.setTrackTooltipFn = function (track_id, tooltipFn) {
	this.track_tooltip_fn[track_id] = tooltipFn;
    }

    OncoprintModel.prototype.getTrackDataIdKey = function (track_id) {
	return this.track_data_id_key[track_id];
    }

    OncoprintModel.prototype.getTrackGroupPadding = function (base) {
	return this.track_group_padding * (base ? 1 : this.vert_zoom);
    }
    
    OncoprintModel.prototype.isTrackRemovable = function (track_id) {
	return this.track_removable[track_id];
    }
    
    OncoprintModel.prototype.isTrackSortDirectionChangeable = function (track_id) {
	return this.track_sort_direction_changeable[track_id];
    }

    OncoprintModel.prototype.getRuleSet = function (track_id) {
	return this.rule_sets[this.track_rule_set_id[track_id]];
    }

    OncoprintModel.prototype.shareRuleSet = function(source_track_id, target_track_id) {
	setTrackActiveRules(this, target_track_id, {});
	
	var old_rule_set_id = this.track_rule_set_id[target_track_id];
	this.track_rule_set_id[target_track_id] = this.track_rule_set_id[source_track_id];
	if (!isRuleSetUsed(this, old_rule_set_id)) {
	    removeRuleSet(this, old_rule_set_id);
	}
    }
    
    OncoprintModel.prototype.setRuleSet = function(track_id, rule_set) {
	setTrackActiveRules(this, track_id, {});
	
	var curr_rule_set_id = this.track_rule_set_id[track_id];
	this.rule_sets[rule_set.rule_set_id] = rule_set;
	this.rule_set_active_rules[rule_set.rule_set_id] = {};
	this.track_rule_set_id[track_id] = rule_set.rule_set_id;
	
	var rule_set_used = isRuleSetUsed(this, curr_rule_set_id);
	if (!rule_set_used) {
	    removeRuleSet(this, curr_rule_set_id);
	}
    }

    OncoprintModel.prototype.getTrackSortComparator = function(track_id) {
	return this.track_sort_cmp_fn[track_id];
    }
    
    OncoprintModel.prototype.setTrackSortComparator = function(track_id, sortCmpFn) {
	this.track_sort_cmp_fn[track_id] = sortCmpFn;
	this.precomputed_comparator.update(this, track_id);
    }
    
    OncoprintModel.prototype.getTrackData = function (track_id) {
	return this.track_data[track_id];
    }
    
    /**
     * Sets the data for an Oncoprint track.
     *
     * @param track_id - the ID that identifies the track
     * @param {Object[]} data - the list of data for the cells
     * @param {string} data_id_key - name of the property of the
     * data objects to use as the (column) key
     */
    OncoprintModel.prototype.setTrackData = function (track_id, data, data_id_key) {
	this.track_data[track_id] = data;
	this.track_data_id_key[track_id] = data_id_key;
	this.track_id_to_datum.update(this, track_id);
	this.track_present_ids.update(this, track_id);
	this.setIdOrder(Object.keys(this.present_ids.get()));
	this.precomputed_comparator.update(this, track_id);
    }
    
    OncoprintModel.prototype.computeTrackIdToDatum = function(track_id) {
	this.track_id_to_datum[track_id] = {};
	
	var track_data = this.track_data[track_id] || [];
	var track_id_key = this.track_data_id_key[track_id];
	for (var i=0; i<track_data.length; i++) {
	    this.track_id_to_datum[track_id][track_data[i][track_id_key]] = track_data[i];
	}
    }
    
    OncoprintModel.prototype.setTrackGroupSortPriority = function(priority) {
	this.track_group_sort_priority = priority;
	this.sort();
    }
    var sortAlphabetical = function(model) {
	var id_order = model.getIdOrder(true).slice();
	id_order.sort(function(a,b) {
	    return a.localeCompare(b);
	});
	model.setIdOrder(id_order);
    };
    var sortByTracks = function(model) {
	var track_group_sort_priority = model.track_group_sort_priority;
	var track_groups = model.getTrackGroups();
	var track_groups_in_sort_order;
	
	if (track_group_sort_priority.length < track_groups.length) {
	    track_groups_in_sort_order = track_groups;
	} else {
	    track_groups_in_sort_order = track_group_sort_priority.map(function(x) {
		return track_groups[x];
	    });
	}
	
	var track_sort_priority = track_groups_in_sort_order.reduce(function(acc, next) {
	    return acc.concat(next);
	}, []);
	
	var precomputed_comparator = model.precomputed_comparator.get();
	var curr_id_to_index = model.getIdToIndexMap();
	var combinedComparator = function(idA, idB) {
	    var res = 0;
            var abs_res = 0;
	    for (var i=0; i<track_sort_priority.length; i++) {
		var next_res = precomputed_comparator[track_sort_priority[i]].compare(idA, idB);
                var abs_next_res = Math.abs(next_res);
		if (abs_next_res > abs_res) {
		    res = next_res;
                    abs_res = abs_next_res;
		}
		if (abs_res === 1) {
		    break;
		}
	    }
	    if (res === 0) {
		// stable sort
		res = ( curr_id_to_index[idA] < curr_id_to_index[idB] ? -1 : 1); // will never be the same, no need to check for 0
	    }
	    return (res > 0) ? 1 : -1;
	}
	var id_order = model.getIdOrder(true).slice();
	id_order.sort(combinedComparator);
	model.setIdOrder(id_order);
    };
    OncoprintModel.prototype.sort = function() {
	this.sort_config = this.sort_config || {};
	if (this.sort_config.type === "alphabetical") {
	    sortAlphabetical(this);
	} else if (this.sort_config.type === "order") {
	    this.setIdOrder(this.sort_config.order);
	} else {
	    sortByTracks(this);
	}
    }
    
    OncoprintModel.prototype.setSortConfig = function(params) {
	this.sort_config = params;
    }

    return OncoprintModel;
})();

var PrecomputedComparator = (function() {
    function PrecomputedComparator(list, comparator, sort_direction, element_identifier_key) {
	var preferred, mandatory;
	if (typeof comparator === "function") {
	    preferred = comparator;
	    mandatory = comparator;
	} else {
	    preferred = comparator.preferred;
	    mandatory = comparator.mandatory;
	}
	var makeDirectedComparator = function(cmp) {
	    return function (d1, d2) {
		if (sort_direction === 0) {
		    return 0;
		}
		var res = cmp(d1, d2);
		if (res === 2) {
		    return 1;
		} else if (res === -2) {
		    return -1;
		} else {
		    return res * sort_direction;
		}
	    };
	};
	var preferredComparator = makeDirectedComparator(preferred);
	var mandatoryComparator = makeDirectedComparator(mandatory);
	var sorted_list = list.sort(preferredComparator);
	
	// i is a change point iff comp(elt[i], elt[i+1]) !== 0
	this.preferred_change_points = []; // i is a preferred change pt iff its a change pt with comp = preferredComparator but not with comp = mandatoryComparator
	this.mandatory_change_points = []; // i is a mandatory change pt iff its a change pt with comp = mandatoryComparator
	
	// note that by the following process, preferred_change_points and mandatory_change_points are sorted
	for (var i=0; i<sorted_list.length; i++) {
	    if (i === sorted_list.length - 1) {
		break;
	    }
	    if (mandatoryComparator(sorted_list[i], sorted_list[i+1]) !== 0) {
		this.mandatory_change_points.push(i);
	    } else if (preferredComparator(sorted_list[i], sorted_list[i+1]) !== 0) {
		this.preferred_change_points.push(i);
	    }
	}
	// Note that by this process change_points is sorted
	this.id_to_index = {};
	for (var i=0; i<sorted_list.length; i++) {
	    this.id_to_index[sorted_list[i][element_identifier_key]] = i;
	}
    }
    PrecomputedComparator.prototype.compare = function(idA, idB) {
	var indA = this.id_to_index[idA];
	var indB = this.id_to_index[idB];
	if (typeof indA === 'undefined' && typeof indB === 'undefined') {
	    return 0;
	} else if (typeof indA === 'undefined') {
	    return 1;
	} else if (typeof indB === 'undefined') {
	    return -1;
	}
	
	var should_negate_result = false;
	if (indA === indB) {
	    return 0;
	} else if (indA > indB) {
	    // switch if necessary to make process WLOG
	    var tmp = indA;
	    indA = indB;
	    indB = tmp;
	    should_negate_result = true;
	}
	// See if any changepoints in [indA, indB)
	var res = 0;
	if (hasElementsInInterval(this.mandatory_change_points, function(x) { return x; }, indA, indB)) {
	    res = -1;
	} else if (hasElementsInInterval(this.preferred_change_points, function(x) { return x; }, indA, indB)) {
	    res = -0.5;
	}
	if (should_negate_result) {
	    res = res * -1;
	}
	return res;
    }
    return PrecomputedComparator;
})();
module.exports = OncoprintModel;

},{"./CachedProperty.js":12,"./binarysearch.js":13,"./haselementsininterval.js":15}],24:[function(require,module,exports){
/* Rule:
 * 
 * condition: function from datum to boolean
 * shapes - a list of Shapes
 * legend_label
 * exclude_from_legend
 * 
 * Shape:
 * type
 * x
 * y
 * ... shape-specific attrs ...
 * 
 * Attrs by shape:
 * 
 * rectangle: x, y, width, height, stroke, stroke-width, fill
 * triangle: x1, y1, x2, y2, x3, y3, stroke, stroke-width, fill
 * ellipse: x, y, width, height, stroke, stroke-width, fill
 * line: x1, y1, x2, y2, stroke, stroke-width
 */

var Shape = require('./oncoprintshape.js');
var extractRGBA = require('./extractrgba.js');
var heatmapColors = require('./heatmapcolors.js');
var binarysearch = require('./binarysearch.js');

function ifndef(x, val) {
    return (typeof x === "undefined" ? val : x);
}

function makeIdCounter() {
    var id = 0;
    return function () {
	id += 1;
	return id;
    };
}

function intRange(length) {
    var ret = [];
    for (var i=0; i<length; i++) {
	ret.push(i);
    }
    return ret;
}

function makeUniqueColorGetter(init_used_colors) {
    init_used_colors = init_used_colors || [];
    var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618",
	"#990099", "#0099c6", "#dd4477", "#66aa00",
	"#b82e2e", "#316395", "#994499", "#22aa99",
	"#aaaa11", "#6633cc", "#e67300", "#8b0707",
	"#651067", "#329262", "#5574a6", "#3b3eac",
	"#b77322", "#16d620", "#b91383", "#f4359e",
	"#9c5935", "#a9c413", "#2a778d", "#668d1c",
	"#bea413", "#0c5922", "#743411"]; // Source: D3
    var index = 0;
    var used_colors = {};
    for (var i=0; i<init_used_colors.length; i++) {
	used_colors[init_used_colors[i]] = true;
    }
    return function() {
	var next_color = colors[index % colors.length];
	while (used_colors[next_color]) {
	    var darker_next_color = darkenHexColor(next_color);
	    if (darker_next_color === next_color) {
		break;
	    }
	    next_color = darker_next_color;
	}
	used_colors[next_color] = true;
	index += 1;
	
	return next_color;
    };
};

function shallowExtend(target, source) {
    var ret = {};
    for (var key in target) {
	if (target.hasOwnProperty(key)) {
	    ret[key] = target[key];
	}
    }
    for (var key in source) {
	if (source.hasOwnProperty(key)) {
	    ret[key] = source[key];
	}
    }
    return ret;
}

function objectValues(obj) {
    return Object.keys(obj).map(function(key) { return obj[key]; });
}

var makeNAShapes = function(z) {
    return [{
	'type': 'rectangle',
	'fill': 'rgba(224, 224, 224, 1)',
	'z': z
    }];
};
var NA_STRING = "na";
var NA_LABEL = "N/A";

var colorToHex = function(str) {
    var r;
    var g;
    var b;
    var rgba_match = str.match(/^[\s]*rgba\([\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/);
    if (rgba_match && rgba_match.length === 5) {
	r = parseInt(rgba_match[1]).toString(16);
	g = parseInt(rgba_match[2]).toString(16);
	b = parseInt(rgba_match[3]).toString(16);
	if (r.length === 1) {
	    r = '0' + r;
	}
	if (g.length === 1) {
	    g = '0' + g;
	}
	if (b.length === 1) {
	    b = '0' + b;
	}
	return '#' + r + g + b;
    }
    
    var rgb_match = str.match(/^[\s]*rgb\([\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*\)[\s]*$/);
    if (rgb_match && rgb_match.length === 4) {
	r = parseInt(rgb_match[1]).toString(16);
	g = parseInt(rgb_match[2]).toString(16);
	b = parseInt(rgb_match[3]).toString(16);
	if (r.length === 1) {
	    r = '0' + r;
	}
	if (g.length === 1) {
	    g = '0' + g;
	}
	if (b.length === 1) {
	    b = '0' + b;
	}
	return '#' + r + g + b;
    }
    
    return str;
};

var darkenHexColor = function(str) {
    var r = str[1] + str[2];
    var g = str[3] + str[4];
    var b = str[5] + str[6];
    var darkenHexChannel = function(c) {
	c = parseInt(c, 16);
	c *= 0.95;
	c = Math.round(c);
	c = c.toString(16);
	if (c.length === 1) {
	    c = '0' + c;
	}
	return c;
    };
    r = darkenHexChannel(r);
    g = darkenHexChannel(g);
    b = darkenHexChannel(b);
    return '#' + r + g + b;
};

var RuleSet = (function () {
    var getRuleSetId = makeIdCounter();
    var getRuleId = makeIdCounter();

    function RuleSet(params) {
	/* params:
	 * - legend_label
	 * - exclude_from_legend
	 */
	this.rule_set_id = getRuleSetId();
	this.legend_label = params.legend_label;
	this.exclude_from_legend = params.exclude_from_legend;
	this.active_rule_ids = {};
	this.rules_with_id = [];

    }

    RuleSet.prototype.getLegendLabel = function () {
	return this.legend_label;
    }

    RuleSet.prototype.getRuleSetId = function () {
	return this.rule_set_id;
    }

    RuleSet.prototype.addRules = function (list_of_params) {
	var self = this;
	return list_of_params.map(function (params) {
	    return self.addRule(params);
	});
    }

    RuleSet.prototype.addRule = function (params) {
	var rule_id = getRuleId();
	this.rules_with_id.push({id: rule_id, rule: new Rule(params)});
	return rule_id;
    }

    RuleSet.prototype.removeRule = function (rule_id) {
	var index = -1;
	for (var i = 0; i < this.rules_with_id.length; i++) {
	    if (this.rules_with_id[i].id === rule_id) {
		index = i;
		break;
	    }
	}
	if (index > -1) {
	    this.rules_with_id.splice(index, 1);
	}
	delete this.active_rule_ids[rule_id];
    }

    RuleSet.prototype.getRuleWithId = function (rule_id) {
	var ret = null;
	for (var i = 0; i < this.rules_with_id.length; i++) {
	    if (this.rules_with_id[i].id === rule_id) {
		ret = this.rules_with_id[i];
		break;
	    }
	}
	return ret;
    }

    RuleSet.prototype.isExcludedFromLegend = function () {
	return this.exclude_from_legend;
    }

    RuleSet.prototype.getRecentlyUsedRules = function () {
	var self = this;
	return Object.keys(this.active_rule_ids).map(
		function (rule_id) {
		    return self.getRule(rule_id);
		});
    }

    RuleSet.prototype.applyRulesToDatum = function (rules_with_id, datum, cell_width, cell_height) {
	var shapes = [];
	var rules_len = rules_with_id.length;
	for (var j = 0; j < rules_len; j++) {
	    shapes = shapes.concat(rules_with_id[j].rule.apply(datum, cell_width, cell_height));
	}
	return shapes;
    }
    RuleSet.prototype.apply = function (data, cell_width, cell_height, out_active_rules) {
	// Returns a list of lists of concrete shapes, in the same order as data
	var ret = [];
	for (var i = 0; i < data.length; i++) {
	    var rules = this.getRulesWithId(data[i]);
	    if (typeof out_active_rules !== 'undefined') {
		for (var j = 0; j < rules.length; j++) {
		    out_active_rules[rules[j].id] = true;
		}
	    }
	    ret.push(this.applyRulesToDatum(rules, data[i], cell_width, cell_height));
	}
	return ret;
    }

    return RuleSet;
})();

var LookupRuleSet = (function () {
    function LookupRuleSet(params) {
	RuleSet.call(this, params);
	this.lookup_map_by_key_and_value = {};
	this.lookup_map_by_key = {};
	this.universal_rules = [];

	this.rule_id_to_conditions = {};
    }
    LookupRuleSet.prototype = Object.create(RuleSet.prototype);

    LookupRuleSet.prototype.getRulesWithId = function (datum) {
	if (typeof datum === 'undefined') {
	    return this.rules_with_id;
	}
	var ret = [];
	ret = ret.concat(this.universal_rules);
	for (var key in datum) {
	    if (typeof datum[key] !== 'undefined') {
		var key_rule = this.lookup_map_by_key[key];
		if (typeof key_rule !== 'undefined') {
		    ret.push(key_rule);
		}
		var key_and_value_rule = (this.lookup_map_by_key_and_value[key] && this.lookup_map_by_key_and_value[key][datum[key]]) || undefined;
		if (typeof key_and_value_rule !== 'undefined') {
		    ret.push(key_and_value_rule);
		}
	    }
	}
	return ret;
    }

    var indexRuleForLookup = function (rule_set, condition_key, condition_value, rule_with_id) {
	if (condition_key === null) {
	    rule_set.universal_rules.push(rule_with_id);
	} else {
	    if (condition_value === null) {
		rule_set.lookup_map_by_key[condition_key] = rule_with_id;
	    } else {
		rule_set.lookup_map_by_key_and_value[condition_key] = rule_set.lookup_map_by_key_and_value[condition_key] || {};
		rule_set.lookup_map_by_key_and_value[condition_key][condition_value] = rule_with_id;
	    }
	}
	rule_set.rule_id_to_conditions[rule_with_id.id] = rule_set.rule_id_to_conditions[rule_with_id.id] || [];
	rule_set.rule_id_to_conditions[rule_with_id.id].push({key: condition_key, value: condition_value});
    };

    LookupRuleSet.prototype.addRule = function (condition_key, condition_value, params) {
	var rule_id = RuleSet.prototype.addRule.call(this, params);

	indexRuleForLookup(this, condition_key, condition_value, this.getRuleWithId(rule_id));

	return rule_id;
    }

    LookupRuleSet.prototype.linkExistingRule = function (condition_key, condition_value, existing_rule_id) {
	indexRuleForLookup(this, condition_key, condition_value, this.getRuleWithId(existing_rule_id));
    }

    LookupRuleSet.prototype.removeRule = function (rule_id) {
	RuleSet.prototype.removeRule.call(this, rule_id);

	while (this.rule_id_to_conditions[rule_id].length > 0) {
	    var condition = this.rule_id_to_conditions[rule_id].pop();
	    if (condition.key === null) {
		var index = -1;
		for (var i = 0; i < this.universal_rules.length; i++) {
		    if (this.universal_rules[i].id === rule_id) {
			index = i;
			break;
		    }
		}
		if (index > -1) {
		    this.universal_rules.splice(index, 1);
		}
	    } else {
		if (condition.value === null) {
		    delete this.lookup_map_by_key[condition.key];
		} else {
		    delete this.lookup_map_by_key_and_value[condition.key][condition.value];
		}
	    }
	}
	delete this.rule_id_to_conditions[rule_id];
    }
    return LookupRuleSet;
})();

var ConditionRuleSet = (function () {
    function ConditionRuleSet(params) {
	RuleSet.call(this, params);
	this.rule_id_to_condition = {};

	this.addRule(function (d) {
	    return d[NA_STRING] === true;
	},
		{shapes: makeNAShapes(params.na_z || 1000),
		    legend_label: NA_LABEL,
		    exclude_from_legend: false,
		    legend_config: {'type': 'rule', 'target': {'na': true}}
		});
    }
    ConditionRuleSet.prototype = Object.create(RuleSet.prototype);

    ConditionRuleSet.prototype.getRulesWithId = function (datum) {
	if (typeof datum === 'undefined') {
	    return this.rules_with_id;
	}
	var ret = [];
	for (var i = 0; i < this.rules_with_id.length; i++) {
	    if (this.rule_id_to_condition[this.rules_with_id[i].id](datum)) {
		ret.push(this.rules_with_id[i]);
	    }
	}
	return ret;
    }

    ConditionRuleSet.prototype.addRule = function (condition, params) {
	var rule_id = RuleSet.prototype.addRule.call(this, params);
	this.rule_id_to_condition[rule_id] = condition;
	return rule_id;
    }

    ConditionRuleSet.prototype.removeRule = function (rule_id) {
	RuleSet.prototype.removeRule.call(this, rule_id);
	delete this.rule_id_to_condition[rule_id];
    }

    return ConditionRuleSet;
})();

var CategoricalRuleSet = (function () {
    function CategoricalRuleSet(params) {
	/* params
	 * - category_key
	 * - categoryToColor
	 */
	LookupRuleSet.call(this, params);
	
	this.addRule(NA_STRING, true, {
	    shapes: makeNAShapes(params.na_z || 1000),
	    legend_label: NA_LABEL,
	    exclude_from_legend: false,
	    legend_config: {'type': 'rule', 'target': {'na': true}}
	});
	
	this.category_key = params.category_key;
	this.category_to_color = ifndef(params.category_to_color, {});
	this.getUnusedColor = makeUniqueColorGetter(objectValues(this.category_to_color).map(colorToHex));
	for (var category in this.category_to_color) {
	    if (this.category_to_color.hasOwnProperty(category)) {
		var color = this.category_to_color[category];
		addCategoryRule(this, category, color);
		this.used_colors[colorToHex(color)] = true;
	    }
	}
    }
    CategoricalRuleSet.prototype = Object.create(LookupRuleSet.prototype);

    var addCategoryRule = function (ruleset, category, color) {
	var legend_rule_target = {};
	legend_rule_target[ruleset.category_key] = category;
	var rule_params = {
	    shapes: [{
		    type: 'rectangle',
		    fill: color,
		}],
	    legend_label: category,
	    exclude_from_legend: false,
	    legend_config: {'type': 'rule', 'target': legend_rule_target}
	};
	ruleset.addRule(ruleset.category_key, category, rule_params);
    };

    CategoricalRuleSet.prototype.apply = function (data, cell_width, cell_height, out_active_rules) {
	// First ensure there is a color for all categories
	for (var i = 0, data_len = data.length; i < data_len; i++) {
	    if (data[i][NA_STRING]) {
		continue;
	    }
	    var category = data[i][this.category_key];
	    if (!this.category_to_color.hasOwnProperty(category)) {
		var color = this.getUnusedColor(this);
		
		this.category_to_color[category] = color;
		addCategoryRule(this, category, color);
	    }
	}
	// Then propagate the call up
	return LookupRuleSet.prototype.apply.call(this, data, cell_width, cell_height, out_active_rules);
    };

    return CategoricalRuleSet;
})();

var LinearInterpRuleSet = (function () {
    function LinearInterpRuleSet(params) {
	/* params
	 * - log_scale
	 * - value_key
	 * - value_range
	 */
	ConditionRuleSet.call(this, params);
	this.value_key = params.value_key;
	this.value_range = params.value_range;
	this.log_scale = params.log_scale; // boolean
	this.inferred_value_range;

	this.makeInterpFn = function () {
	    var range = this.getEffectiveValueRange();

	    if (this.log_scale) {
		var shift_to_make_pos = Math.abs(range[0]) + 1;
		var log_range = Math.log(range[1] + shift_to_make_pos) - Math.log(range[0] + shift_to_make_pos);
		var log_range_lower = Math.log(range[0] + shift_to_make_pos);
		return function (val) {
		    val = parseFloat(val);
		    return (Math.log(val + shift_to_make_pos) - log_range_lower) / log_range;
		};
	    } else {
		var range_spread = range[1] - range[0];
		var range_lower = range[0];
		return function (val) {
		    val = parseFloat(val);
		    if (val <= range[0]) {
			return 0;
		    } else if (val >= range[1]) {
			return 1;
		    } else {
			return (val - range_lower) / range_spread;
		    }
		};
	    }
	};
    }
    LinearInterpRuleSet.prototype = Object.create(ConditionRuleSet.prototype);

    LinearInterpRuleSet.prototype.getEffectiveValueRange = function () {
	var ret = (this.value_range && this.value_range.slice()) || [undefined, undefined];
	if (typeof ret[0] === "undefined") {
	    ret[0] = this.inferred_value_range[0];
	}
	if (typeof ret[1] === "undefined") {
	    ret[1] = this.inferred_value_range[1];
	}
	if (ret[0] === ret[1]) {
	    // Make sure non-empty interval
	    ret[0] -= ret[0] / 2;
	    ret[1] += ret[1] / 2;
	}
	return ret;
    };

    LinearInterpRuleSet.prototype.apply = function (data, cell_width, cell_height, out_active_rules) {
	// First find value range
	var value_min = Number.POSITIVE_INFINITY;
	var value_max = Number.NEGATIVE_INFINITY;
	for (var i = 0, datalen = data.length; i < datalen; i++) {
	    var d = data[i];
	    if (isNaN(d[this.value_key])) {
		continue;
	    }
	    value_min = Math.min(value_min, d[this.value_key]);
	    value_max = Math.max(value_max, d[this.value_key]);
	}
	if (value_min === Number.POSITIVE_INFINITY) {
	    value_min = 0;
	}
	if (value_max === Number.NEGATIVE_INFINITY) {
	    value_max = 0;
	}
	this.inferred_value_range = [value_min, value_max];
	this.updateLinearRules();

	// Then propagate the call up
	return ConditionRuleSet.prototype.apply.call(this, data, cell_width, cell_height, out_active_rules);
    };

    LinearInterpRuleSet.prototype.updateLinearRules = function () {
	throw "Not implemented in abstract class";
    };

    return LinearInterpRuleSet;
})();

var GradientRuleSet = (function () {
    function GradientRuleSet(params) {
	/* params
	 * - colors || colormap_name
	 * - null_color
	 */
	LinearInterpRuleSet.call(this, params);

	this.colors = [];
	if (params.colors) {
	    this.colors = params.colors || [];
	} else if (params.colormap_name) {
	    this.colors = heatmapColors[params.colormap_name] || [];
	}
	if (this.colors.length === 0) {
	    this.colors.push([0,0,0,1],[255,0,0,1]);
	}
	
	this.value_stop_points = params.value_stop_points;

	this.gradient_rule;
	this.null_color = params.null_color || "rgba(211,211,211,1)";
    }
    GradientRuleSet.prototype = Object.create(LinearInterpRuleSet.prototype);

    // interpScaleColors,
    // were adapted from politiken-journalism's scale-color-perceptual repo on Github
    var linInterpColors = function(t, begin_color, end_color) {
	// 0 <= t <= 1
	// begin_color and end_color are 4-element arrays in ([0,255])x([0,255])x([0,255])x([0,1])
	return [
	    Math.round(begin_color[0]*(1-t) + end_color[0]*t),
	    Math.round(begin_color[1]*(1-t) + end_color[1]*t),
	    Math.round(begin_color[2]*(1-t) + end_color[2]*t),
	    begin_color[3]*(1-t) + end_color[3]*t
	];
    };

    GradientRuleSet.prototype.makeColorFn = function(colors, interpFn) {
	var value_stop_points = this.value_stop_points;
	var stop_points;
	if (value_stop_points) {
	    stop_points = value_stop_points.map(interpFn);
	} else {
	    stop_points = intRange(colors.length).map(function(x) { return x/(colors.length -1); });
	}
	return function(t) {
	    // 0 <= t <= 1
	    var begin_interval_index = binarysearch(stop_points, t, function(x) { return x; }, true);
	    if (begin_interval_index === -1) {
		return "rgba(0,0,0,1)";
	    }
	    var end_interval_index = Math.min(colors.length - 1, begin_interval_index + 1);
	    var spread = stop_points[end_interval_index] - stop_points[begin_interval_index];
	    if (spread === 0) {
		return "rgba(" + colors[end_interval_index].join(",") + ")";
	    } else {
		var interval_t = (t - stop_points[begin_interval_index]) / spread;
		var begin_color = colors[begin_interval_index];
		var end_color = colors[end_interval_index];
		return "rgba(" + linInterpColors(interval_t, begin_color, end_color).join(",") + ")";
	    }
	    
	};
    }

    GradientRuleSet.prototype.updateLinearRules = function () {
	if (typeof this.gradient_rule !== "undefined") {
	    this.removeRule(this.gradient_rule);
	}
	var interpFn = this.makeInterpFn();
	var colorFn = this.makeColorFn(this.colors, interpFn);
	var value_key = this.value_key;
	var null_color = this.null_color;
	
	this.gradient_rule = this.addRule(function (d) {
	    return d[NA_STRING] !== true;
	},
		{shapes: [{
			    type: 'rectangle',
			    fill: function(d) {
				if (d[value_key]) {
				    var t = interpFn(d[value_key]);
				    return colorFn(t);
				} else {
				    return null_color;
				}
			    }
			}],
		    exclude_from_legend: false,
		    legend_config: {'type': 'gradient', 'range': this.getEffectiveValueRange(), 'colorFn':colorFn}
		});
    };

    return GradientRuleSet;
})();

var BarRuleSet = (function () {
    function BarRuleSet(params) {
	LinearInterpRuleSet.call(this, params);
	this.bar_rule;
	this.fill = params.fill || 'rgba(156,123,135,1)';
    }
    BarRuleSet.prototype = Object.create(LinearInterpRuleSet.prototype);

    BarRuleSet.prototype.updateLinearRules = function () {
	if (typeof this.bar_rule !== "undefined") {
	    this.removeRule(this.bar_rule);
	}
	var interpFn = this.makeInterpFn();
	var value_key = this.value_key;
	this.bar_rule = this.addRule(function (d) {
	    return d[NA_STRING] !== true;
	},
		{shapes: [{
			    type: 'rectangle',
			    y: function (d) {
				var t = interpFn(d[value_key]);
				return (1 - t) * 100 + "%";
			    },
			    height: function (d) {
				var t = interpFn(d[value_key]);
				return t * 100 + "%";
			    },
			    fill: this.fill,
			}],
		    exclude_from_legend: false,
		    legend_config: {'type': 'number', 
				    'range': this.getEffectiveValueRange(), 
				    'color': this.fill,
				    'interpFn': interpFn}
		});
    };

    return BarRuleSet;
})();

var StackedBarRuleSet = (function() {
    function StackedBarRuleSet(params) {
	/* params
	 * - categories
	 * - value_key
	 * - fills
	 */
	ConditionRuleSet.call(this, params);
	var value_key = params.value_key;
	var fills = params.fills || [];
	var categories = params.categories || [];
	var getUnusedColor = makeUniqueColorGetter(fills);
	
	// Initialize with default values
	while (fills.length < categories.length) {
	    fills.push(getUnusedColor());
	}
	
	var self = this;
	for (var i=0; i < categories.length; i++) {
	    (function(I) {
		var legend_target = {};
		legend_target[value_key] = {};
		for (var j=0; j<categories.length; j++) {
		    legend_target[value_key][categories[j]] = 0;
		}
		legend_target[value_key][categories[I]] = 1;
		self.addRule(function(d) {
		    return d[NA_STRING] !== true;
		},
		{shapes: [{
		    type: 'rectangle',
		    fill: fills[I],
		    width: '100%',
		    height: function(d) {
			var total = 0;
			for (var j=0; j<categories.length; j++) {
			    total += parseFloat(d[value_key][categories[j]]);
			}
			return parseFloat(d[value_key][categories[I]])*100/total + '%';
		    },
		    y: function(d) {
			var total = 0;
			var prev_vals_sum = 0;
			for (var j=0; j<categories.length; j++) {
			    var new_val = parseFloat(d[value_key][categories[j]]);
			    if (j < I) {
				prev_vals_sum += new_val;
			    }
			    total += new_val;
			}
			return prev_vals_sum*100/total + '%';
		    }
		}],
	    exclude_from_legend: false,
	    legend_config: {'type': 'rule', 'target': legend_target},
	    legend_label: categories[I]});
	    })(i);
	}
    }
    StackedBarRuleSet.prototype = Object.create(ConditionRuleSet.prototype);
    return StackedBarRuleSet;
})();
var GeneticAlterationRuleSet = (function () {
    function GeneticAlterationRuleSet(params) {
	/* params:
	 * - rule_params
	 */
	LookupRuleSet.call(this, params);
	(function addRules(self) {
	    var rule_params = params.rule_params;
	    for (var key in rule_params) {
		if (rule_params.hasOwnProperty(key)) {
		    var key_rule_params = rule_params[key];
		    if (key === '*') {
			self.addRule(null, null, shallowExtend(rule_params['*'], {'legend_config': {'type': 'rule', 'target': {}}}));
		    } else {
			for (var value in key_rule_params) {
			    if (key_rule_params.hasOwnProperty(value)) {
				var equiv_values = value.split(",");
				var legend_rule_target = {};
				legend_rule_target[equiv_values[0]] = value;
				var rule_id = self.addRule(key, (equiv_values[0] === '*' ? null : equiv_values[0]), shallowExtend(key_rule_params[value], {'legend_config': {'type': 'rule', 'target': legend_rule_target}}));
				for (var i = 1; i < equiv_values.length; i++) {
				    self.linkExistingRule(key, (equiv_values[i] === '*' ? null : equiv_values[i]), rule_id);
				}
			    }
			}
		    }
		}
	    }
	})(this);
	this.addRule(NA_STRING, true, {
	    shapes: makeNAShapes(params.na_z || 1),
	    legend_label: "Not sequenced",
	    exclude_from_legend: false,
	    legend_config: {'type': 'rule', 'target': {'na': true}}
	});
    }
    GeneticAlterationRuleSet.prototype = Object.create(LookupRuleSet.prototype);

    return GeneticAlterationRuleSet;
})();

var Rule = (function () {
    function Rule(params) {
	this.shapes = params.shapes.map(function (shape) {
	    if (shape.type === 'rectangle') {
		return new Shape.Rectangle(shape);
	    } else if (shape.type === 'triangle') {
		return new Shape.Triangle(shape);
	    } else if (shape.type === 'ellipse') {
		return new Shape.Ellipse(shape);
	    } else if (shape.type === 'line') {
		return new Shape.Line(shape);
	    }
	});
	this.legend_label = typeof params.legend_label === "undefined" ? "" : params.legend_label;
	this.exclude_from_legend = params.exclude_from_legend;
	this.legend_config = params.legend_config;// {'type':'rule', 'target': {'mut_type':'MISSENSE'}} or {'type':'number', 'color':'rgba(1,2,3,1), 'range':[lower, upper]} or {'type':'gradient', 'color_range':['rgba(...)' or '#...', 'rgba(...)' or '#...'], 'number_range':[lower, upper]}
    }
    Rule.prototype.getLegendConfig = function () {
	return this.legend_config;
    }
    Rule.prototype.apply = function (d, cell_width, cell_height) {
	// Gets concrete shapes (i.e. computed
	// real values from percentages)
	var concrete_shapes = [];
	for (var i = 0, shapes_len = this.shapes.length; i < shapes_len; i++) {
	    concrete_shapes.push(this.shapes[i].getComputedParams(d, cell_width, cell_height));
	}
	return concrete_shapes;
    }

    Rule.prototype.isExcludedFromLegend = function () {
	return this.exclude_from_legend;
    }

    return Rule;
})();

module.exports = function (params) {
    if (params.type === 'categorical') {
	return new CategoricalRuleSet(params);
    } else if (params.type === 'gradient') {
	return new GradientRuleSet(params);
    } else if (params.type === 'bar') {
	return new BarRuleSet(params);
    } else if (params.type === 'stacked_bar') {
	return new StackedBarRuleSet(params);
    } else if (params.type === 'gene') {
	return new GeneticAlterationRuleSet(params);
    }
}
},{"./binarysearch.js":13,"./extractrgba.js":14,"./heatmapcolors.js":16,"./oncoprintshape.js":25}],25:[function(require,module,exports){
var Shape = (function() {
    var default_parameter_values = {
	    'width': '100%', 
	    'height': '100%', 
	    'x': '0%', 
	    'y': '0%', 
	    'z': 0,
	    'x1': '0%', 
	    'x2': '0%', 
	    'x3': '0%', 
	    'y1': '0%', 
	    'y2': '0%', 
	    'y3': '0%',
	    'stroke': 'rgba(0,0,0,0)', 
	    'fill': 'rgba(23,23,23,1)', 
	    'stroke-width': '0',
	    'stroke-opacity': '0'
    };
    var parameter_name_to_dimension_index = {
	'stroke-width':0,
	'width': 0,
	'x':0,
	'x1':0,
	'x2':0,
	'x3':0,
	'height':1,
	'y':1,
	'y1':1,
	'y2':1,
	'y3':1
    };
    var hash_parameter_order = Object.keys(default_parameter_values).concat("type");
    
    function Shape(params) {
	this.params = params;
	this.params_with_type = {};
	this.completeWithDefaults();
	this.markParameterTypes();
    }
    
    var getCachedShape = (function() {
	var cache = {}; // shape cache to save memory
    
	return function(computed_params) {
	    var hash = Shape.hashComputedShape(computed_params);
	    cache[hash] = cache[hash] || Object.freeze(computed_params);
	    return cache[hash];
	};
    })();
    
    Shape.prototype.completeWithDefaults = function() {
	var required_parameters = this.getRequiredParameters();
	for (var i=0; i<required_parameters.length; i++) {
	    var param = required_parameters[i];
	    this.params[param] = (typeof this.params[param] === 'undefined' ? default_parameter_values[param] : this.params[param]);
	}
    }
    Shape.prototype.markParameterTypes = function() {
	var parameters = Object.keys(this.params);
	for (var i=0; i<parameters.length; i++) {
	    var param_name = parameters[i];
	    var param_val = this.params[param_name];
	    if (typeof param_val === 'function') {
		this.params_with_type[param_name] = {'type':'function', 'value':param_val};
	    } else {
		this.params_with_type[param_name] = {'type':'value', 'value': param_val};
	    }
	}
    }
    Shape.prototype.getComputedParams = function(d, base_width, base_height) {
	var computed_params = {};
	var param_names = Object.keys(this.params_with_type);
	var dimensions = [base_width, base_height];
	for (var i=0; i<param_names.length; i++) {
	    var param_name = param_names[i];
	    var param_val_map = this.params_with_type[param_name];
	    var param_val = param_val_map.value;
	    if (param_name !== 'type') {
		if (param_val_map.type === 'function') {
		    param_val = param_val(d);
		}
		if (param_val[param_val.length-1] === '%') {
		    // check a couple of commonly-used special cases to avoid slower parseFloat 
		    if (param_val === '100%') {
			param_val = 1;
		    } else {
			param_val = parseFloat(param_val) / 100;
		    }
		    param_val *= dimensions[parameter_name_to_dimension_index[param_name]];
		}
	    }
	    computed_params[param_name] = param_val;
	}
	return getCachedShape(computed_params);
    };
    Shape.hashComputedShape = function (computed_params, z_index) {
	return hash_parameter_order.reduce(function (hash, param_name) {
	    return hash + "," + computed_params[param_name];
	}, "") + "," + z_index;
    };
    return Shape;
})();



var Rectangle = (function() {
    function Rectangle(params) {
	Shape.call(this, params);
    }
    Rectangle.prototype = Object.create(Shape.prototype);
    Rectangle.prototype.getRequiredParameters = function() {
	return ['width', 'height', 'x', 'y', 'z', 'stroke', 'fill', 'stroke-width']; 
    }
    return Rectangle;
})();

var Triangle = (function() {
    function Triangle(params) {
	Shape.call(this, params);
    }
    Triangle.prototype = Object.create(Shape.prototype);
    Triangle.prototype.getRequiredParameters = function() {
	return ['x1', 'x2', 'x3', 'y1', 'y2', 'y3', 'z', 'stroke', 'fill', 'stroke-width']; 
    }
    return Triangle;
})();

var Ellipse = (function() {
    function Ellipse(params) {
	Shape.call(this, params);
    }
    Ellipse.prototype = Object.create(Shape.prototype);
    Ellipse.prototype.getRequiredParameters = function() {
	return ['width', 'height', 'x', 'y', 'z', 'stroke', 'fill', 'stroke-width']; 
    }
    return Ellipse;
})();

var Line = (function() {
    function Line(params) {
	Shape.call(this, params);
    }
    Line.prototype = Object.create(Shape.prototype);
    Line.prototype.getRequiredParameters = function() {
	return ['x1', 'x2', 'y1', 'y2', 'z', 'stroke', 'stroke-width']; 
    }
    return Line;
})();

module.exports = {
    'Rectangle':Rectangle,
    'Triangle':Triangle,
    'Ellipse':Ellipse,
    'Line':Line,
    'Shape':Shape
};
},{}],26:[function(require,module,exports){
var makeSVGElement = function (tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
	if (attrs.hasOwnProperty(k)) {
	    el.setAttribute(k, attrs[k]);
	}
    }
    return el;
};

var extractRGBA = require('./extractrgba.js');

var extractColor = function(str) {
    if (str.indexOf("rgb(") > -1) {
	return {
	    'rgb': str,
	    'opacity': 1
	};
    }
    var rgba_arr = extractRGBA(str);
    return {
	'rgb': 'rgb('+rgba_arr[0]*255+','+rgba_arr[1]*255+','+rgba_arr[2]*255+')',
	'opacity': rgba_arr[3]
    };
};

var rectangleToSVG = function (params, offset_x, offset_y) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('rect', {
	width: params.width,
	height: params.height,
	x: parseFloat(params.x) + offset_x,
	y: parseFloat(params.y) + offset_y,
	stroke: stroke_color.rgb,
	'stroke-opacity': stroke_color.opacity,
	'stroke-width': params['stroke-width'],
	fill: fill_color.rgb,
	'fill-opacity': fill_color.opacity
    });
};

var triangleToSVG = function (params, offset_x, offset_y) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('polygon', {
	points: [[parseFloat(params.x1) + offset_x, parseFloat(params.y1) + offset_y], [parseFloat(params.x2) + offset_x, parseFloat(params.y2) + offset_y], [parseFloat(params.x3) + offset_x, parseFloat(params.y3) + offset_y]].map(function (a) {
	    return a[0] + ',' + a[1];
	}).join(' '),
	stroke: stroke_color.rgb,
	'stroke-opacity': stroke_color.opacity,
	'stroke-width': params['stroke-width'],
	fill: fill_color.rgb,
	'fill-opacity': fill_color.opacity
    });
};

var ellipseToSVG = function (params, offset_x, offset_y) {
    var stroke_color = extractColor(params.stroke);
    var fill_color = extractColor(params.fill);
    return makeSVGElement('ellipse', {
	rx: parseFloat(params.width) / 2,
	height: parseFloat(params.height) / 2,
	cx: parseFloat(params.x) + offset_x,
	cy: parseFloat(params.y) + offset_y,
	stroke: stroke_color.rgb,
	'stroke-opacity': stroke_color.opacity,
	'stroke-width': params['stroke-width'],
	fill: fill_color.rgb,
	'fill-opacity': fill_color.opacity
    });
};

var lineToSVG = function (params, offset_x, offset_y) {
    var stroke_color = extractColor(params.stroke);
    return makeSVGElement('line', {
	x1: parseFloat(params.x1) + offset_x,
	y1: parseFloat(params.y1) + offset_y,
	x2: parseFloat(params.x2) + offset_x,
	y2: parseFloat(params.y2) + offset_y,
	stroke: stroke_color.rgb,
	'stroke-opacity': stroke_color.opacity,
	'stroke-width': params['stroke-width'],
    });
};

module.exports = function(oncoprint_shape_computed_params, offset_x, offset_y) {
    var type = oncoprint_shape_computed_params.type;
    if (type === 'rectangle') {
	return rectangleToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    } else if (type === 'triangle') {
	return triangleToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    } else if (type === 'ellipse') {
	return ellipseToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    } else if (type === 'line') {
	return lineToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    }
};
},{"./extractrgba.js":14}],27:[function(require,module,exports){
var halfsqrt2 = Math.sqrt(2) / 2;

var extractRGBA = function (str) {
    var ret = [0, 0, 0, 1];
    if (str[0] === "#") {
	// hex, convert to rgba
	var r = parseInt(str[1] + str[2], 16);
	var g = parseInt(str[3] + str[4], 16);
	var b = parseInt(str[5] + str[6], 16);
	str = 'rgba('+r+','+g+','+b+',1)';
    }
    var match = str.match(/^[\s]*rgba\([\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/);
    if (match && match.length === 5) {
	ret = [parseFloat(match[1]) / 255,
	    parseFloat(match[2]) / 255,
	    parseFloat(match[3]) / 255,
	    parseFloat(match[4])];
    }
    return ret;
};
    
var rectangleToVertexes = function(params, z_index, addVertex) {
    var x = parseFloat(params.x), y = parseFloat(params.y), height = parseFloat(params.height), width = parseFloat(params.width);

    // Fill
    var fill_rgba = extractRGBA(params.fill);
    addVertex([x,y,z_index], fill_rgba);
    addVertex([x+width, y, z_index], fill_rgba);
    addVertex([x+width, y+height, z_index], fill_rgba);
    
    addVertex([x,y,z_index], fill_rgba);
    addVertex([x+width, y+height, z_index], fill_rgba);
    addVertex([x,y+height,z_index],fill_rgba);

    // Stroke
    var stroke_width = parseFloat(params['stroke-width']);
    if (stroke_width > 0) {
	// left side
	var stroke_rgba = extractRGBA(params.stroke);
	addVertex([x, y, z_index], stroke_rgba);
	addVertex([x + stroke_width, y, z_index], stroke_rgba);
	addVertex([x + stroke_width, y + height, z_index], stroke_rgba);

	addVertex([x, y, z_index], stroke_rgba);
	addVertex([x + stroke_width, y + height, z_index], stroke_rgba);
	addVertex([x, y + height, z_index], stroke_rgba);

	// right side
	addVertex([x + width, y, z_index], stroke_rgba);
	addVertex([x + width - stroke_width, y, z_index], stroke_rgba);
	addVertex([x + width - stroke_width, y + height, z_index], stroke_rgba);

	addVertex([x + width, y, z_index], stroke_rgba);
	addVertex([x + width - stroke_width, y + height, z_index], stroke_rgba);
	addVertex([x + width, y + height, z_index], stroke_rgba);

	// top side
	addVertex([x, y, z_index], stroke_rgba);
	addVertex([x + width, y, z_index], stroke_rgba);
	addVertex([x + width, y + stroke_width, z_index], stroke_rgba);

	addVertex([x, y, z_index], stroke_rgba);
	addVertex([x + width, y + stroke_width, z_index], stroke_rgba);
	addVertex([x, y + stroke_width, z_index], stroke_rgba);

	// bottom side
	addVertex([x, y + height, z_index], stroke_rgba);
	addVertex([x + width, y + height, z_index], stroke_rgba);
	addVertex([x + width, y + height - stroke_width, z_index], stroke_rgba);

	addVertex([x, y + height, z_index], stroke_rgba);
	addVertex([x + width, y + height - stroke_width, z_index], stroke_rgba);
	addVertex([x, y + height - stroke_width, z_index], stroke_rgba);
    }
};
var triangleToVertexes = function(params, z_index, addVertex) {
    var fill_rgba = extractRGBA(params.fill);
    addVertex([parseFloat(params.x1), parseFloat(params.y1), z_index], fill_rgba);
    addVertex([parseFloat(params.x2), parseFloat(params.y2), z_index], fill_rgba);
    addVertex([parseFloat(params.x3), parseFloat(params.y3), z_index], fill_rgba);
};
var ellipseToVertexes = function(params, z_index, addVertex) {
    var center = {x: parseFloat(params.x) + parseFloat(params.width) / 2, y: parseFloat(params.y) + parseFloat(params.height) / 2};
    var horzrad = parseFloat(params.width) / 2;
    var vertrad = parseFloat(params.height) / 2;

    var fill_rgba = extractRGBA(params.fill);
    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + horzrad, center.y, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x, center.y + vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x, center.y + vertrad, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y + halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x - horzrad, center.y, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - horzrad, center.y, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x, center.y - vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x, center.y - vertrad, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + halfsqrt2 * horzrad, center.y - halfsqrt2 * vertrad, z_index], fill_rgba);
    addVertex([center.x + horzrad, center.y, z_index], fill_rgba);
};
var lineToVertexes = function(params, z_index, addVertex) {
    // For simplicity of dealing with webGL we'll implement lines as thin triangle pairs
    var x1 = parseFloat(params.x1);
    var x2 = parseFloat(params.x2);
    var y1 = parseFloat(params.y1);
    var y2 = parseFloat(params.y2);

    if (x1 !== x2) {
	// WLOG make x1,y1 the one on the left
	if (Math.min(x1, x2) === x2) {
	    var tmpx1 = x1;
	    var tmpy1 = y1;
	    x1 = x2;
	    y1 = y2;
	    x2 = tmpx1;
	    y2 = tmpy1;
	}
    }

    var perpendicular_vector = [y2 - y1, x1 - x2];
    var perpendicular_vector_length = Math.sqrt(perpendicular_vector[0] * perpendicular_vector[0] + perpendicular_vector[1] * perpendicular_vector[1]);
    var unit_perp_vector = [perpendicular_vector[0] / perpendicular_vector_length, perpendicular_vector[1] / perpendicular_vector_length];

    var half_stroke_width = parseFloat(params['stroke-width']) / 2;
    var direction1 = [unit_perp_vector[0] * half_stroke_width, unit_perp_vector[1] * half_stroke_width];
    var direction2 = [direction1[0] * -1, direction1[1] * -1];
    var A = [x1 + direction1[0], y1 + direction1[1]];
    var B = [x1 + direction2[0], y1 + direction2[1]];
    var C = [x2 + direction1[0], y2 + direction1[1]];
    var D = [x2 + direction2[0], y2 + direction2[1]];

    var stroke_rgba = extractRGBA(params.stroke);
    addVertex([A[0], A[1], z_index], stroke_rgba);
    addVertex([B[0], B[1], z_index], stroke_rgba);
    addVertex([C[0], C[1], z_index], stroke_rgba);

    addVertex([C[0], C[1], z_index], stroke_rgba);
    addVertex([D[0], D[1], z_index], stroke_rgba);
    addVertex([B[0], B[1], z_index], stroke_rgba);
};
module.exports = function(oncoprint_shape_computed_params, z_index, addVertex) {
    // target_position_array is an array with 3-d float vertexes
    // target_color_array is an array with rgba values in [0,1]
    // We pass them in to save on concatenation costs
    
    var type = oncoprint_shape_computed_params.type;
    if (type === "rectangle") {
	return rectangleToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    } else if (type === "triangle") {
	return triangleToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    } else if (type === "ellipse") {
	return ellipseToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    } else if (type === "line") {
	return lineToVertexes(oncoprint_shape_computed_params, z_index, addVertex);
    }
}
},{}],28:[function(require,module,exports){
var $ = require('jquery');

var OncoprintToolTip = (function() {
    function OncoprintToolTip($container, params) {
	params = params || {};
	this.$container = $container;
	this.$div = $('<div></div>').appendTo($container).css({'background-color':'rgba(255,255,255,1)', 'position':'absolute', 'display':'none', 'border':'1px solid black', 'max-width':300, 'min-width':150});
	if (params.noselect) {
	    this.$div.addClass("noselect");
	}
	this.hide_timeout_id = undefined;
	this.show_timeout_id = undefined;
	this.center = false;
	
	this.shown = false;
	
	var self = this;
	this.$div.on("mousemove", function(evt) {
	    evt.stopPropagation();
	    cancelScheduledHide(self);
	});
	this.$div.on("mouseleave", function(evt) {
	    evt.stopPropagation();
	    self.hide();
	});
    }
    OncoprintToolTip.prototype.show = function(wait, page_x, page_y, $contents, fade) {
	cancelScheduledHide(this);
	
	if (typeof wait !== 'undefined' && !this.shown) {
	    var self = this;
	    cancelScheduledShow(this);
	    this.show_timeout_id = setTimeout(function() {
		doShow(self, page_x, page_y, $contents, fade);
	    }, wait);
	} else {
	    doShow(this, page_x, page_y, $contents, fade);
	}
    }
    var doShow = function(tt, page_x, page_y, $contents, fade) {
	cancelScheduledShow(tt);
	tt.show_timeout_id = undefined;
	tt.$div.empty();
	tt.$div.append($contents);
	if (!fade) {
	    tt.$div.show();
	} else {
	    tt.$div.stop().fadeIn('fast');
	}
	var container_offset = tt.$container.offset();
	var x = page_x - container_offset.left - (tt.center ? tt.$div.width()/2 : 0);
	var y = page_y - container_offset.top - tt.$div.height();
	tt.$div.css({'top':y, 'left':x, 'z-index':9999});
	tt.shown = true;
    };
    var doHide = function(tt, fade) {
	cancelScheduledHide(tt);
	tt.hide_timeout_id = undefined;
	if (!fade) {
	    tt.$div.hide();
	} else {
	    tt.$div.fadeOut();
	}
	tt.shown = false;
    };
    var cancelScheduledShow = function(tt) {
	clearTimeout(tt.show_timeout_id);
	tt.show_timeout_id = undefined;
    };
    var cancelScheduledHide = function(tt) {
	clearTimeout(tt.hide_timeout_id);
	tt.hide_timeout_id = undefined;
    };
    OncoprintToolTip.prototype.showIfNotAlreadyGoingTo = function(wait, page_x, page_y, $contents) {
	if (typeof this.show_timeout_id === 'undefined') {
	    this.show(wait, page_x, page_y, $contents);
	}
    }
    OncoprintToolTip.prototype.hideIfNotAlreadyGoingTo = function(wait) {
	if (typeof this.hide_timeout_id === 'undefined') {
	    this.hide(wait);
	}
    };
    OncoprintToolTip.prototype.hide = function(wait) {
	cancelScheduledShow(this);
	
	if (!this.shown) {
	    return;
	}
	
	if (typeof wait !== 'undefined') {
	    var self = this;
	    cancelScheduledHide(this);
	    this.hide_timeout_id = setTimeout(function() {
		doHide(self);
	    }, wait);
	} else {
	    doHide(this);
	}
    }
    OncoprintToolTip.prototype.fadeIn = function(wait, page_x, page_y, $contents) {
	this.show(wait, page_x, page_y, $contents, true);
    }
    return OncoprintToolTip;
})();

module.exports = OncoprintToolTip;
},{"jquery":11}],29:[function(require,module,exports){
var svgfactory = require('./svgfactory.js');
var $ = require('jquery');

var OncoprintTrackInfoView = (function () {
    function OncoprintTrackInfoView($div) {
	this.$div = $div;
	this.$ctr = $('<div></div>').css({'position': 'absolute', 'overflow-y':'hidden', 'overflow-x':'hidden'}).appendTo(this.$div);
	this.$text_ctr = $('<div></div>').css({'position':'absolute'}).appendTo(this.$ctr);
	this.base_font_size = 12;
	this.font_family = 'Arial';
	this.font_weight = 'bold';
	this.width = 0;

	this.rendering_suppressed = false;
    }

    var renderAllInfo = function (view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$text_ctr.empty();

	var tracks = model.getTracks();
	view.minimum_track_height = Number.POSITIVE_INFINITY;
	for (var i = 0; i < tracks.length; i++) {
	    view.minimum_track_height = Math.min(view.minimum_track_height, model.getTrackHeight(tracks[i]));
	}

	view.width = 40;

	var label_tops = model.getLabelTops();
	scroll(view, model.getVertScroll());
	var font_size = view.getFontSize();
	for (var i = 0; i < tracks.length; i++) {
	    var $new_label = $('<span>').css({'position': 'absolute',
		'font-family': view.font_family,
		'font-weight': view.font_weight,
		'font-size': font_size})
		    .addClass('noselect');
	    $new_label.text(model.getTrackInfo(tracks[i]));
	    $new_label.appendTo(view.$text_ctr);
	    var top = label_tops[tracks[i]] + (model.getCellHeight(tracks[i]) - $new_label.outerHeight()) / 2;
	    $new_label.css({'top': top + 'px'});
	    view.width = Math.max(view.width, $new_label[0].clientWidth);
	}
    };
    var scroll = function (view, scroll_y) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$text_ctr.css({'top': -scroll_y});
    };

    var resize = function (view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$div.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
	view.$ctr.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
    };

    OncoprintTrackInfoView.prototype.getFontSize = function () {
	return Math.max(Math.min(this.base_font_size, this.minimum_track_height), 7);
    }
    OncoprintTrackInfoView.prototype.getWidth = function () {
	return this.width + 10;
    }
    OncoprintTrackInfoView.prototype.addTracks = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.moveTrack = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.setTrackGroupOrder = function(model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.removeTrack = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.setTrackInfo = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.setScroll = function(model) {
	this.setVertScroll(model);
    }
    OncoprintTrackInfoView.prototype.setHorzScroll = function (model) {
    }
    OncoprintTrackInfoView.prototype.setVertScroll = function (model) {
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackInfoView.prototype.setZoom = function(model) {
	this.setVertZoom(model);
    }
    
    OncoprintTrackInfoView.prototype.setViewport = function(model) {
	renderAllInfo(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackInfoView.prototype.setVertZoom = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.suppressRendering = function () {
	this.rendering_suppressed = true;
    }
    OncoprintTrackInfoView.prototype.releaseRendering = function (model) {
	this.rendering_suppressed = false;
	renderAllInfo(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackInfoView.prototype.toSVGGroup = function (model, offset_x, offset_y) {
	var root = svgfactory.group((offset_x || 0), (offset_y || 0));
	var cell_tops = model.getCellTops();
	var tracks = model.getTracks();
	for (var i = 0; i < tracks.length; i++) {
	    var track_id = tracks[i];
	    var y = cell_tops[track_id] + model.getCellHeight(track_id) / 2;
	    var info = model.getTrackInfo(track_id);
	    var text_elt = svgfactory.text(info, 0, y, this.font_size, this.font_family, this.font_weight, "bottom");
	    text_elt.setAttribute("dy", "0.35em");
	    root.appendChild(text_elt);
	}
	return root;
    }
    return OncoprintTrackInfoView;
})();

module.exports = OncoprintTrackInfoView;
},{"./svgfactory.js":34,"jquery":11}],30:[function(require,module,exports){
var $ = require('jquery');
var OncoprintTrackOptionsView = (function () {
    function OncoprintTrackOptionsView($div, moveUpCallback, moveDownCallback, removeCallback, sortChangeCallback) {
	// removeCallback: function(track_id)
	var position = $div.css('position');
	if (position !== 'absolute' && position !== 'relative') {
	    console.log("WARNING: div passed to OncoprintTrackOptionsView must be absolute or relative positioned - layout problems will occur");
	}

	this.moveUpCallback = moveUpCallback;
	this.moveDownCallback = moveDownCallback;
	this.removeCallback = removeCallback; // function(track_id) { ... }
	this.sortChangeCallback = sortChangeCallback; // function(track_id, dir) { ... }

	this.$div = $div;
	this.$ctr = $('<div></div>').css({'position': 'absolute', 'overflow-y':'hidden', 'overflow-x':'hidden'}).appendTo(this.$div);
	this.$buttons_ctr = $('<div></div>').css({'position':'absolute'}).appendTo(this.$ctr);
	this.$dropdown_ctr = $('<div></div>').css({'position': 'absolute'}).appendTo(this.$div);

	this.img_size;

	this.rendering_suppressed = false;

	this.track_options_$elts = {};

	this.menu_shown = {};

	var self = this;
	$(document).click(function() {
	    $(self).trigger('oncoprint-track-options-view.click-out');
	});

	this.interaction_disabled = false;
    }
    
    var renderAllOptions = function(view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	$(view).off('oncoprint-track-options-view.click-out');
	$(view).on('oncoprint-track-options-view.click-out', function() {
	     for (var track_id in view.track_options_$elts) {
		if (view.track_options_$elts.hasOwnProperty(track_id)) {
		    hideTrackMenu(view, track_id);
		}
	    }
	});
	
	view.$buttons_ctr.empty();
	view.$dropdown_ctr.empty();
	scroll(view, model.getVertScroll());

	var tracks = model.getTracks();
	var minimum_track_height = Number.POSITIVE_INFINITY;
	for (var i = 0; i < tracks.length; i++) {
	    minimum_track_height = Math.min(minimum_track_height, model.getTrackHeight(tracks[i]));
	}
	view.img_size = Math.floor(minimum_track_height * 0.75);

	for (var i = 0; i < tracks.length; i++) {
	    renderTrackOptions(view, model, tracks[i]);
	}
    };

    var scroll = function (view, scroll_y) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$buttons_ctr.css({'top': -scroll_y});
	view.$dropdown_ctr.css({'top': -scroll_y});
    };

    var resize = function (view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$div.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
	view.$ctr.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
    };

    var hideTrackMenu = function (view, track_id) {
	view.menu_shown[track_id] = false;
	var $elts = view.track_options_$elts[track_id];
	$elts.$dropdown.css({'z-index': 1});
	$elts.$dropdown.css({'border': '1px solid rgba(125,125,125,0)'});
	$elts.$img.css({'border': '1px solid rgba(125,125,125,0)'});
	$elts.$dropdown.fadeOut(100);
    };

    var showTrackMenu = function (view, track_id) {
	view.menu_shown[track_id] = true;
	var $elts = view.track_options_$elts[track_id];
	$elts.$dropdown.css({'z-index': 10});
	$elts.$dropdown.css({'border': '1px solid rgba(125,125,125,1)'});
	$elts.$img.css({'border': '1px solid rgba(125,125,125,1)'});
	$elts.$dropdown.fadeIn(100);
    };

    var hideMenusExcept = function (view, track_id) {
	track_id = track_id.toString();
	for (var other_track_id in view.track_options_$elts) {
	    if (view.track_options_$elts.hasOwnProperty(other_track_id)) {
		if (other_track_id === track_id) {
		    continue;
		}
		hideTrackMenu(view, other_track_id);
	    }
	}
    };

    var $makeDropdownOption = function (text, weight, callback) {
	return $('<li>').text(text).css({'font-weight': weight, 'font-size': 12, 'cursor': 'pointer', 'border-bottom': '1px solid rgba(0,0,0,0.3)'})
		.click(callback)
		.hover(function () {
		    $(this).css({'background-color': 'rgb(200,200,200)'});
		}, function () {
		    $(this).css({'background-color': 'rgba(255,255,255,0)'});
		});
    };
    var $makeDropdownSeparator = function () {
	return $('<li>').css({'border-top': '1px solid black'});
    };

    var renderTrackOptions = function (view, model, track_id) {
	var $div, $img, $dropdown;
	var top = model.getZoomedTrackTops(track_id);
	$div = $('<div>').appendTo(view.$buttons_ctr).css({'position': 'absolute', 'left': '0px', 'top': top + 'px'});
	$img = $('<img/>').appendTo($div).attr({'src': 'img/menudots.svg', 'width': view.img_size, 'height': view.img_size}).css({'float': 'left', 'cursor': 'pointer', 'border': '1px solid rgba(125,125,125,0)'});
	$dropdown = $('<ul>').appendTo(view.$dropdown_ctr).css({'position':'absolute', 'width': 120, 'display': 'none', 'list-style-type': 'none', 'padding-left': '6', 'padding-right': '6', 'float': 'right', 'background-color': 'rgb(255,255,255)',
								'left':'0px', 'top': top + view.img_size + 'px'});
	view.track_options_$elts[track_id] = {'$div': $div, '$img': $img, '$dropdown': $dropdown};

	$img.hover(function (evt) {
	    if (!view.menu_shown[track_id]) {
		$(this).css({'border': '1px solid rgba(125,125,125,0.3)'});
	    }
	}, function (evt) {
	    if (!view.menu_shown[track_id]) {
		$(this).css({'border': '1px solid rgba(125,125,125,0)'});
	    }
	});
	$img.click(function (evt) {
	    evt.stopPropagation();
	    if ($dropdown.is(":visible")) {
		hideTrackMenu(view, track_id);
	    } else {
		showTrackMenu(view, track_id);
	    }
	    hideMenusExcept(view, track_id);
	});

	$dropdown.append($makeDropdownOption('Move up', 'normal', function (evt) {
	    evt.stopPropagation();
	    view.moveUpCallback(track_id);
	}));
	$dropdown.append($makeDropdownOption('Move down', 'normal', function (evt) {
	    evt.stopPropagation();
	    view.moveDownCallback(track_id);
	}));
	if (model.isTrackRemovable(track_id)) {
	    $dropdown.append($makeDropdownOption('Remove track', 'normal', function (evt) {
		evt.stopPropagation();
		view.removeCallback(track_id);
	    }));
	}
	if (model.isTrackSortDirectionChangeable(track_id)) {
	    $dropdown.append($makeDropdownSeparator());
	    var $sort_inc_li;
	    var $sort_dec_li;
	    var $dont_sort_li;
	    $sort_inc_li = $makeDropdownOption('Sort a-Z', (model.getTrackSortDirection(track_id) === 1 ? 'bold' : 'normal'), function (evt) {
		evt.stopPropagation();
		$sort_inc_li.css('font-weight', 'bold');
		$sort_dec_li.css('font-weight', 'normal');
		$dont_sort_li.css('font-weight', 'normal');
		view.sortChangeCallback(track_id, 1);
	    });
	    $sort_dec_li = $makeDropdownOption('Sort Z-a', (model.getTrackSortDirection(track_id) === -1 ? 'bold' : 'normal'), function (evt) {
		evt.stopPropagation();
		$sort_inc_li.css('font-weight', 'normal');
		$sort_dec_li.css('font-weight', 'bold');
		$dont_sort_li.css('font-weight', 'normal');
		view.sortChangeCallback(track_id, -1);
	    });
	    $dont_sort_li = $makeDropdownOption('Don\'t sort track', (model.getTrackSortDirection(track_id) === 0 ? 'bold' : 'normal'), function (evt) {
		evt.stopPropagation();
		$sort_inc_li.css('font-weight', 'normal');
		$sort_dec_li.css('font-weight', 'normal');
		$dont_sort_li.css('font-weight', 'bold');
		view.sortChangeCallback(track_id, 0);
	    });
	    $dropdown.append($sort_inc_li);
	    $dropdown.append($sort_dec_li);
	    $dropdown.append($dont_sort_li);
	}
    };

    OncoprintTrackOptionsView.prototype.enableInteraction = function () {
	this.interaction_disabled = false;
    }
    OncoprintTrackOptionsView.prototype.disableInteraction = function () {
	this.interaction_disabled = true;
    }
    OncoprintTrackOptionsView.prototype.suppressRendering = function () {
	this.rendering_suppressed = true;
    }
    OncoprintTrackOptionsView.prototype.releaseRendering = function (model) {
	this.rendering_suppressed = false;
	renderAllOptions(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackOptionsView.prototype.setScroll = function(model) {
	this.setVertScroll(model);
    }
    OncoprintTrackOptionsView.prototype.setHorzScroll = function (model) {
    }
    OncoprintTrackOptionsView.prototype.setVertScroll = function (model) {
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackOptionsView.prototype.setZoom = function(model) {
	this.setVertZoom(model);
    }
    OncoprintTrackOptionsView.prototype.setVertZoom = function (model) {
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.setViewport = function(model) {
	renderAllOptions(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackOptionsView.prototype.getWidth = function () {
	return 10 + this.img_size;
    }
    OncoprintTrackOptionsView.prototype.addTracks = function (model) {
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.moveTrack = function (model) {
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.setTrackGroupOrder = function(model) {
	renderAllOptions(this, model);
    }
    OncoprintTrackOptionsView.prototype.removeTrack = function(model, track_id) {
	delete this.track_options_$elts[track_id];
	renderAllOptions(this, model);
	resize(this, model);
    }
    return OncoprintTrackOptionsView;
})();

module.exports = OncoprintTrackOptionsView;
},{"jquery":11}],31:[function(require,module,exports){
var gl_matrix = require('gl-matrix');
var svgfactory = require('./svgfactory.js');
var shapeToVertexes = require('./oncoprintshapetovertexes.js');
var CachedProperty = require('./CachedProperty.js');
var Shape = require('./oncoprintshape.js');
var $ = require('jquery');

var sgndiff = function(a,b) {
    if (a < b) {
	return -1;
    } else if (a > b) {
	return 1;
    } else {
	return 0;
    }
};

var arrayFindIndex = function(arr, callback, start_index) {
    start_index = start_index || 0;
    for (var i=start_index; i<arr.length; i++) {
	if (callback(arr[i])) {
	    return i;
	}
    }
    return -1;
};

var getNewCanvas = function(view) {
    var old_canvas = view.$canvas[0];
    var new_canvas = old_canvas.cloneNode();
    var parent_node = old_canvas.parentNode;
    parent_node.removeChild(old_canvas);
    parent_node.insertBefore(new_canvas, view.$overlay_canvas[0]);
    view.$canvas = $(new_canvas);
};
var getWebGLCanvasContext = function (view) {
    try {
	var canvas = view.$canvas[0];
	var ctx = canvas.getContext("experimental-webgl", {alpha: false, antialias: view.antialias});
	ctx.clearColor(1.0, 1.0, 1.0, 1.0);
	ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
	ctx.viewportWidth = canvas.width;
	ctx.viewportHeight = canvas.height;
	ctx.viewport(0, 0, ctx.viewportWidth, ctx.viewportHeight);
	ctx.enable(ctx.DEPTH_TEST);
	ctx.enable(ctx.BLEND);
	ctx.blendEquation(ctx.FUNC_ADD);
	ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
	ctx.depthMask(false);
	
	return ctx;
    } catch (e) {
	return null;
    }
};

var createShaderProgram = function (view, vertex_shader, fragment_shader) {
    var program = view.ctx.createProgram();
    view.ctx.attachShader(program, vertex_shader);
    view.ctx.attachShader(program, fragment_shader);

    view.ctx.linkProgram(program);

    var success = view.ctx.getProgramParameter(program, view.ctx.LINK_STATUS);
    if (!success) {
	var msg = view.ctx.getProgramInfoLog(program);
	view.ctx.deleteProgram(program);
	throw "Unable to link shader program: " + msg;
    }

    return program;
};
var createShader = function (view, source, type) {
    var shader = view.ctx.createShader(view.ctx[type]);
    view.ctx.shaderSource(shader, source);
    view.ctx.compileShader(shader);

    var success = view.ctx.getShaderParameter(shader, view.ctx.COMPILE_STATUS);
    if (!success) {
	var msg = view.ctx.getShaderInfoLog(shader);
	view.ctx.deleteShader(shader);
	throw "Unable to compile shader: " + msg;
    }

    return shader;
};

var OncoprintWebGLCellView = (function () {
    function OncoprintWebGLCellView($container, $canvas, $overlay_canvas, $dummy_scroll_div_contents, model, tooltip, highlight_area_callback, cell_over_callback) {
	this.$container = $container;
	this.$canvas = $canvas;
	this.$overlay_canvas = $overlay_canvas;
	
	this.supersampling_ratio = 2;
	
	this.antialias = true;
	this.antialias_on_cell_width_thresh = 5;
	
	this.position_bit_pack_base = 128;
	
	getWebGLContextAndSetUpMatrices(this);
	setUpShaders(this);
	getOverlayContextAndClear(this);
	this.visible_area_width = $canvas[0].width;
	
	var self = this;
	
	this.tooltip = tooltip;
	this.tooltip.center = true;
	
	this.scroll_x = 0;
	this.scroll_y = 0;
	this.$dummy_scroll_div_contents = $dummy_scroll_div_contents;
	this.dummy_scroll_div_client_size = new CachedProperty({'width':$dummy_scroll_div_contents.parent()[0].clientWidth, 'height':$dummy_scroll_div_contents.parent()[0].clientHeight}, function() {
	    return {'width':$dummy_scroll_div_contents.parent()[0].clientWidth, 'height':$dummy_scroll_div_contents.parent()[0].clientHeight};
	});

	this.identified_shape_list_list = {};

	this.vertex_data = {}; // track_id -> {vertex_array: list of index in vertex bank, vertex_bank: flat list of concatenated position and color}
	this.vertex_column_array = {}; // track_id -> number list (float list, item size 1)
	
	this.vertex_position_buffer = {}; // track_id -> gl.createBuffer()
	this.vertex_color_buffer = {}; // track_id -> gl.createBuffer()
	this.vertex_column_buffer = {}; // track_id -> gl.createBuffer()
	this.color_texture = {}; // track_id -> gl.createTexture()
	
	this.id_to_first_vertex_index = {}; // track_id -> id -> vertex index of first vertex corresponding to this id

	this.rendering_suppressed = false;
	
	this.highlight_area_callback = (typeof highlight_area_callback === 'undefined' ? function() {} : highlight_area_callback); // function(left, right) { ... }
	
	(function initializeOverlayEvents(self) {
	    var dragging = false;
	    var drag_diff_minimum = 10;
	    var drag_start_x;
	    var drag_end_x;
	    var prev_overlapping_cell = null;
	    
	    var dragIsValid = function(drag_start_x, drag_end_x) {
		return Math.abs(drag_start_x - drag_end_x) >= drag_diff_minimum;
	    };
	    var executeDrag = function() {
		if (!dragging) {
		    return;
		}
		dragging = false;
		
		if (!dragIsValid(drag_start_x, drag_end_x)) {
		    return;
		}
		var left = Math.min(drag_start_x, drag_end_x);
		var right = Math.max(drag_start_x, drag_end_x);
		self.highlight_area_callback(left+self.scroll_x, right+self.scroll_x);
	    };
	    
	    var mouseInOverlayCanvas = function(mouse_x, mouse_y) {
		var offset = self.$overlay_canvas.offset();
		var width = self.$overlay_canvas.width();
		var height = self.$overlay_canvas.height();
		return (mouse_x >= offset.left && mouse_x < width + offset.left && mouse_y >= offset.top && mouse_y < height + offset.top);
	    };
	    $(document).on("mousemove", function(evt) {
		if (!mouseInOverlayCanvas(evt.pageX, evt.pageY)) {
		    clearOverlay(self);
		    tooltip.hide();
		    cell_over_callback(null);
		}
	    });
	    self.$overlay_canvas.on("mouseout mouseleave", function(evt) {
		clearOverlay(self);
		tooltip.hide();
	    });
	    self.$overlay_canvas.on("mousemove", function(evt) {
		if (self.rendering_suppressed) {
		    return;
		}
		clearOverlay(self);
		var offset = self.$overlay_canvas.offset();
		var mouseX = evt.pageX - offset.left;
		var mouseY = evt.pageY - offset.top;
		if (!dragging) {
		    var overlapping_cell = model.getOverlappingCell(mouseX + self.scroll_x, mouseY + self.scroll_y);
		    var overlapping_datum = (overlapping_cell === null ? null : model.getTrackDatum(overlapping_cell.track, overlapping_cell.id));
		    var cell_width = model.getCellWidth();
		    var cell_padding = model.getCellPadding();
		    if (overlapping_datum !== null) {
			cell_over_callback(overlapping_cell.track, overlapping_cell.id);
			var left = model.getZoomedColumnLeft(overlapping_cell.id) - self.scroll_x;
			overlayStrokeRect(self, left, model.getCellTops(overlapping_cell.track) - self.scroll_y, model.getCellWidth() + (model.getTrackHasColumnSpacing(overlapping_cell.track) ? 0 : cell_padding), model.getCellHeight(overlapping_cell.track), "rgba(0,0,0,1)");
			var tracks = model.getTracks();
			for (var i=0; i<tracks.length; i++) {
			    if (model.getTrackDatum(tracks[i], overlapping_cell.id) !== null) {
				overlayStrokeRect(self, left, model.getCellTops(tracks[i]) - self.scroll_y, model.getCellWidth() + (model.getTrackHasColumnSpacing(tracks[i]) ? 0 : cell_padding), model.getCellHeight(tracks[i]), "rgba(0,0,0,0.5)");
			    }
			}
			tooltip.show(250, model.getZoomedColumnLeft(overlapping_cell.id) + model.getCellWidth() / 2 + offset.left - self.scroll_x, model.getCellTops(overlapping_cell.track) + offset.top - self.scroll_y, model.getTrackTooltipFn(overlapping_cell.track)(overlapping_datum));
			prev_overlapping_cell = overlapping_cell;
		    } else {
			tooltip.hideIfNotAlreadyGoingTo(150);
			overlapping_cell = null;
		    }
		} else {
		    overlapping_cell = null;
		    drag_end_x = mouseX;
		    var left = Math.min(mouseX, drag_start_x);
		    var right = Math.max(mouseX, drag_start_x);
		    var drag_rect_fill = dragIsValid(drag_start_x, drag_end_x) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)';
		    overlayFillRect(self, left, 0, right-left, model.getCellViewHeight(), drag_rect_fill);
		}
		if (overlapping_cell === null) {
		    cell_over_callback(null);
		}
	    });
	    
	    self.$overlay_canvas.on("mousedown", function(evt) {
		if (!mouseInOverlayCanvas(evt.pageX, evt.pageY)) {
		    return;
		}
		dragging = true;
		drag_start_x = evt.pageX - self.$overlay_canvas.offset().left;
		drag_end_x = drag_start_x;
		
		tooltip.hide();
	    });
	    self.$overlay_canvas.on("mouseup", function(evt) {
		if (!mouseInOverlayCanvas(evt.pageX, evt.pageY)) {
		    return;
		}
		executeDrag();
	    });
	    self.$overlay_canvas.on("mouseleave", function(evt) {
		executeDrag();
	    });
	    
	})(this);
	
	$dummy_scroll_div_contents.parent().scroll(function() {
	    clearOverlay(self);
	});
    }
    
    var overlayStrokeRect = function(view, x, y, width, height, color) {
	var ctx = view.overlay_ctx;
	ctx.strokeStyle = color;
	ctx.strokeWidth = 10;
	ctx.strokeRect(view.supersampling_ratio*x, view.supersampling_ratio*y, view.supersampling_ratio*width, view.supersampling_ratio*height);
    };
    
    var overlayFillRect = function(view, x, y, width, height, color) {
	var ctx = view.overlay_ctx;
	ctx.fillStyle = color;
	ctx.fillRect(view.supersampling_ratio*x, view.supersampling_ratio*y, view.supersampling_ratio*width, view.supersampling_ratio*height);
    };
    
    var clearOverlay = function(view) {
	view.overlay_ctx.fillStyle = "rgba(0,0,0,0)";
	view.overlay_ctx.clearRect(0,0,view.$overlay_canvas[0].width, view.$overlay_canvas[0].height);
    };
    
    var getOverlayContextAndClear = function(view) {
	view.overlay_ctx = view.$overlay_canvas[0].getContext('2d');
	clearOverlay(view);
    };
    
    var getWebGLContextAndSetUpMatrices = function(view) {
	view.ctx = getWebGLCanvasContext(view);
	(function initializeMatrices(self) {
	    var mvMatrix = gl_matrix.mat4.create();
	    gl_matrix.mat4.lookAt(mvMatrix, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
	    self.mvMatrix = mvMatrix;

	    var pMatrix = gl_matrix.mat4.create();
	    gl_matrix.mat4.ortho(pMatrix, 0, self.ctx.viewportWidth, self.ctx.viewportHeight, 0, -5, 1000); // y axis inverted so that y increases down like SVG
	    self.pMatrix = pMatrix;
	})(view);
    };
    var setUpShaders = function(self) {
	var vertex_shader_source = ['precision highp float;',
		'attribute float aPosVertex;',
		'attribute float aColVertex;',
		'attribute float aVertexOncoprintColumn;',
		'uniform float columnWidth;',
		'uniform float scrollX;',
		'uniform float zoomX;',
		'uniform float scrollY;',
		'uniform float zoomY;',
		'uniform mat4 uMVMatrix;',
		'uniform mat4 uPMatrix;',
		'uniform float offsetY;',
		'uniform float supersamplingRatio;',
		'uniform float positionBitPackBase;', 
		'uniform float texSize;',
		'varying float texCoord;',
		
		'vec3 unpackVec3(float packedVec3, float base) {',
		'	float pos0 = floor(packedVec3 / (base*base));',
		'	float pos0Contr = pos0*base*base;',
		'	float pos1 = floor((packedVec3 - pos0Contr)/base);',
		'	float pos1Contr = pos1*base;',
		'	float pos2 = packedVec3 - pos0Contr - pos1Contr;',
		'	return vec3(pos0, pos1, pos2);',
		'}',
		
		'void main(void) {',
		'	gl_Position = vec4(unpackVec3(aPosVertex, positionBitPackBase), 1.0);',
		'	gl_Position[0] += aVertexOncoprintColumn*columnWidth;',
		'	gl_Position *= vec4(zoomX, zoomY, 1.0, 1.0);',
		'	gl_Position[1] += offsetY;', // offset is given zoomed
		'	gl_Position -= vec4(scrollX, scrollY, 0.0, 0.0);',
		'	gl_Position[0] *= supersamplingRatio;',
		'	gl_Position[1] *= supersamplingRatio;',
		'	gl_Position = uPMatrix * uMVMatrix * gl_Position;',
		
		'	texCoord = (aColVertex + 0.5) / texSize;',
		'}'].join('\n');
	    var fragment_shader_source = ['precision mediump float;',
		'varying float texCoord;',
		'uniform sampler2D uSampler;',
		'void main(void) {',
		'   gl_FragColor = texture2D(uSampler, vec2(texCoord, 0.5));',
		'}'].join('\n');
	    var vertex_shader = createShader(self, vertex_shader_source, 'VERTEX_SHADER');
	    var fragment_shader = createShader(self, fragment_shader_source, 'FRAGMENT_SHADER');

	    var shader_program = createShaderProgram(self, vertex_shader, fragment_shader);
	    shader_program.vertexPositionAttribute = self.ctx.getAttribLocation(shader_program, 'aPosVertex');
	    self.ctx.enableVertexAttribArray(shader_program.vertexPositionAttribute);
	    shader_program.vertexColorAttribute = self.ctx.getAttribLocation(shader_program, 'aColVertex');
	    self.ctx.enableVertexAttribArray(shader_program.vertexColorAttribute);
	    shader_program.vertexOncoprintColumnAttribute = self.ctx.getAttribLocation(shader_program, 'aVertexOncoprintColumn');
	    self.ctx.enableVertexAttribArray(shader_program.vertexOncoprintColumnAttribute);

	    shader_program.samplerUniform = self.ctx.getUniformLocation(shader_program, 'uSampler');
	    shader_program.pMatrixUniform = self.ctx.getUniformLocation(shader_program, 'uPMatrix');
	    shader_program.mvMatrixUniform = self.ctx.getUniformLocation(shader_program, 'uMVMatrix');
	    shader_program.columnWidthUniform = self.ctx.getUniformLocation(shader_program, 'columnWidth');
	    shader_program.scrollXUniform = self.ctx.getUniformLocation(shader_program, 'scrollX');
	    shader_program.scrollYUniform = self.ctx.getUniformLocation(shader_program, 'scrollY');
	    shader_program.zoomXUniform = self.ctx.getUniformLocation(shader_program, 'zoomX');
	    shader_program.zoomYUniform = self.ctx.getUniformLocation(shader_program, 'zoomY');
	    shader_program.offsetYUniform = self.ctx.getUniformLocation(shader_program, 'offsetY');
	    shader_program.supersamplingRatioUniform = self.ctx.getUniformLocation(shader_program, 'supersamplingRatio');
	    shader_program.positionBitPackBaseUniform = self.ctx.getUniformLocation(shader_program, 'positionBitPackBase');
	    shader_program.texSizeUniform = self.ctx.getUniformLocation(shader_program, 'texSize');

	    self.shader_program = shader_program;
    };

    var resizeAndClear = function(view, model) {
	var height = model.getCellViewHeight();
	var total_width = view.getTotalWidth(model);
	var visible_area_width = view.visible_area_width;
	var scrollbar_slack = 20;
	view.$dummy_scroll_div_contents.css({'min-width':total_width, 'min-height':model.getOncoprintHeight()});
	view.$dummy_scroll_div_contents.parent().css({'height': height + scrollbar_slack, 'width': visible_area_width + scrollbar_slack}); // add space for scrollbars
	view.dummy_scroll_div_client_size.update();
	view.$canvas[0].height = view.supersampling_ratio*height;
	view.$canvas[0].style.height = height + 'px';
	view.$overlay_canvas[0].height = view.supersampling_ratio*height;
	view.$overlay_canvas[0].style.height = height + 'px';
	view.$canvas[0].width = view.supersampling_ratio*visible_area_width;
	view.$canvas[0].style.width = visible_area_width + 'px';
	view.$overlay_canvas[0].width = view.supersampling_ratio*visible_area_width;
	view.$overlay_canvas[0].style.width = visible_area_width + 'px';
	view.$container.css('height', height);
	view.$container.css('width', visible_area_width);
	getWebGLContextAndSetUpMatrices(view);
	setUpShaders(view);
	getOverlayContextAndClear(view);
    };
    var renderAllTracks = function (view, model, dont_resize) {
	if (view.rendering_suppressed) {
	    return;
	}
	
	var scroll_x = view.scroll_x;
	var scroll_y = view.scroll_y;
	var zoom_x = model.getHorzZoom();
	var zoom_y = model.getVertZoom();
	
	var viewport = view.getViewportOncoprintSpace(model);
	var window_left = viewport.left;
	var window_right = viewport.right;
	var window_top = viewport.top;
	var window_bottom = viewport.bottom;
	var id_to_left = model.getColumnLeft();
	var id_order = model.getIdOrder();
	var horz_first_id_in_window_index = arrayFindIndex(id_order, function(id) { return id_to_left[id] >= window_left; });
	var horz_first_id_after_window_index = arrayFindIndex(id_order, function(id) { return id_to_left[id] > window_right; }, horz_first_id_in_window_index+1);
	var horz_first_id_in_window = (horz_first_id_in_window_index < 1 ? id_order[0] : id_order[horz_first_id_in_window_index - 1]);
	var horz_first_id_after_window = (horz_first_id_after_window_index === -1 ? null : id_order[horz_first_id_after_window_index]);
	
	if (!dont_resize) {
	    resizeAndClear(view, model);
	}
	view.ctx.clearColor(1.0,1.0,1.0,1.0);
	view.ctx.clear(view.ctx.COLOR_BUFFER_BIT | view.ctx.DEPTH_BUFFER_BIT);
	
	var tracks = model.getTracks();
	for (var i = 0; i < tracks.length; i++) {
	    var track_id = tracks[i];
	    var cell_top = model.getCellTops(track_id);
	    var cell_height = model.getCellHeight(track_id);
	    if ((cell_top / zoom_y) >= window_bottom || ((cell_top + cell_height)/zoom_y) < window_top) {
		// vertical clipping
		continue;
	    }
	    var buffers = getTrackBuffers(view, track_id);
	    if (buffers.position.numItems === 0) {
		continue;
	    }
	    var first_index = view.id_to_first_vertex_index[track_id][horz_first_id_in_window];
	    var first_index_out = horz_first_id_after_window === null ? buffers.position.numItems : view.id_to_first_vertex_index[track_id][horz_first_id_after_window];
	    
	    view.ctx.useProgram(view.shader_program);
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, buffers.position);
	    view.ctx.vertexAttribPointer(view.shader_program.vertexPositionAttribute, buffers.position.itemSize, view.ctx.FLOAT, false, 0, 0);
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, buffers.color);
	    view.ctx.vertexAttribPointer(view.shader_program.vertexColorAttribute, buffers.color.itemSize, view.ctx.FLOAT, false, 0, 0);
	    
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, buffers.column);
	    view.ctx.vertexAttribPointer(view.shader_program.vertexOncoprintColumnAttribute, buffers.column.itemSize, view.ctx.FLOAT, false, 0, 0);

	    view.ctx.activeTexture(view.ctx.TEXTURE0);
	    view.ctx.bindTexture(view.ctx.TEXTURE_2D, buffers.color_tex.texture);
	    view.ctx.uniform1i(view.shader_program.samplerUniform, 0);
	    view.ctx.uniform1f(view.shader_program.texSizeUniform, buffers.color_tex.size);
	    
	    view.ctx.uniformMatrix4fv(view.shader_program.pMatrixUniform, false, view.pMatrix);
	    view.ctx.uniformMatrix4fv(view.shader_program.mvMatrixUniform, false, view.mvMatrix);
	    view.ctx.uniform1f(view.shader_program.columnWidthUniform, model.getCellWidth(true) + model.getCellPadding(true));
	    view.ctx.uniform1f(view.shader_program.scrollXUniform, scroll_x);
	    view.ctx.uniform1f(view.shader_program.scrollYUniform, scroll_y);
	    view.ctx.uniform1f(view.shader_program.zoomXUniform, zoom_x);
	    view.ctx.uniform1f(view.shader_program.zoomYUniform, zoom_y);
	    view.ctx.uniform1f(view.shader_program.offsetYUniform, cell_top);
	    view.ctx.uniform1f(view.shader_program.supersamplingRatioUniform, view.supersampling_ratio);
	    view.ctx.uniform1f(view.shader_program.positionBitPackBaseUniform, view.position_bit_pack_base);
	    
	    view.ctx.drawArrays(view.ctx.TRIANGLES, first_index, first_index_out - first_index);
	}
    };
    
    var clearTrackPositionAndColorBuffers = function(view, model, track_id) {
	var tracks_to_clear;
	if (typeof track_id === 'undefined') {
	    tracks_to_clear = model.getTracks();
	} else {
	    tracks_to_clear = [track_id];
	}
	for (var i=0; i<tracks_to_clear.length; i++) {
	    if (view.vertex_position_buffer[tracks_to_clear[i]]) {
		view.ctx.deleteBuffer(view.vertex_position_buffer[tracks_to_clear[i]]);
		delete view.vertex_position_buffer[tracks_to_clear[i]];
	    }
	    if (view.vertex_color_buffer[tracks_to_clear[i]]) {
		view.ctx.deleteBuffer(view.vertex_color_buffer[tracks_to_clear[i]]);
		delete view.vertex_color_buffer[tracks_to_clear[i]];
	    }
	    if (view.color_texture[tracks_to_clear[i]]) {
		view.ctx.deleteTexture(view.color_texture[tracks_to_clear[i]].texture);
		delete view.color_texture[tracks_to_clear[i]];
	    }
	}
    };
    
     var clearTrackColumnBuffers = function(view, model, track_id) {
	var tracks_to_clear;
	if (typeof track_id === 'undefined') {
	    tracks_to_clear = model.getTracks();
	} else {
	    tracks_to_clear = [track_id];
	}
	for (var i=0; i<tracks_to_clear.length; i++) {
	    if (view.vertex_column_buffer[tracks_to_clear[i]]) {
		view.ctx.deleteBuffer(view.vertex_column_buffer[tracks_to_clear[i]]);
		delete view.vertex_column_buffer[tracks_to_clear[i]];
	    }
	}
    };
    
    
    var getTrackBuffers = function(view, track_id) {
	if (typeof view.vertex_position_buffer[track_id] === 'undefined') {
	    var pos_buffer = view.ctx.createBuffer();
	    var pos_array = view.vertex_data[track_id].pos_array;
	    
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, pos_buffer);
	    view.ctx.bufferData(view.ctx.ARRAY_BUFFER, new Float32Array(pos_array), view.ctx.STATIC_DRAW);
	    pos_buffer.itemSize = 1;
	    pos_buffer.numItems = pos_array.length / pos_buffer.itemSize;

	    view.vertex_position_buffer[track_id] = pos_buffer;
	}
	
	if (typeof view.vertex_color_buffer[track_id] === 'undefined') {
	    var col_buffer = view.ctx.createBuffer();
	    var col_array = view.vertex_data[track_id].col_array;
	    
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, col_buffer);
	    view.ctx.bufferData(view.ctx.ARRAY_BUFFER, new Float32Array(col_array), view.ctx.STATIC_DRAW);
	    col_buffer.itemSize = 1;
	    col_buffer.numItems = col_array.length / col_buffer.itemSize;

	    view.vertex_color_buffer[track_id] = col_buffer;
	}
	
	if (typeof view.color_texture[track_id] === "undefined") {
	    var tex = view.ctx.createTexture();
	    view.ctx.bindTexture(view.ctx.TEXTURE_2D, tex);
	    
	    var color_bank = view.vertex_data[track_id].col_bank;
	    var width = Math.pow(2,Math.ceil(Math.log2(color_bank.length / 4)));
	    while (color_bank.length < 4*width) {
		color_bank.push(0);
	    }
	    var height = 1;
	    view.ctx.texImage2D(view.ctx.TEXTURE_2D, 0, view.ctx.RGBA, width, height, 0, view.ctx.RGBA, view.ctx.UNSIGNED_BYTE, new Uint8Array(color_bank));
	    view.ctx.texParameteri(view.ctx.TEXTURE_2D, view.ctx.TEXTURE_MIN_FILTER, view.ctx.NEAREST);
	    view.ctx.texParameteri(view.ctx.TEXTURE_2D, view.ctx.TEXTURE_MAG_FILTER, view.ctx.NEAREST);
	    view.color_texture[track_id] = {'texture': tex, 'size':width};
	}
	
	if (typeof view.vertex_column_buffer[track_id] === 'undefined') {
	    var vertex_column_buffer = view.ctx.createBuffer();
	    var vertex_column_array = view.vertex_column_array[track_id];
	    view.ctx.bindBuffer(view.ctx.ARRAY_BUFFER, vertex_column_buffer);
	    view.ctx.bufferData(view.ctx.ARRAY_BUFFER, new Float32Array(vertex_column_array), view.ctx.STATIC_DRAW);
	    vertex_column_buffer.itemSize = 1;
	    vertex_column_buffer.numItems = vertex_column_array.length / vertex_column_buffer.itemSize;
	    
	    view.vertex_column_buffer[track_id] = vertex_column_buffer;
	}
	return {'position':view.vertex_position_buffer[track_id],
		'color': view.vertex_color_buffer[track_id],
		'color_tex': view.color_texture[track_id],
		'column': view.vertex_column_buffer[track_id]};
    };
    
    var computeVertexColumns = function(view, model, track_id) {
	if (view.rendering_suppressed) {
	    return;
	}
	var num_items = view.vertex_data[track_id].pos_array.length;
	var id_to_first_vertex_index = view.id_to_first_vertex_index[track_id];
	var id_to_index = model.getVisibleIdToIndexMap();
	var id_and_first_vertex = Object.keys(id_to_first_vertex_index).map(function(id) { return [id, id_to_first_vertex_index[id]]; })
				.sort(function(a,b) { return sgndiff(a[1], b[1]); });
	var vertex_column_array = [];
	for (var i=0; i<id_and_first_vertex.length; i++) {
	    var num_to_add = (i === id_and_first_vertex.length - 1 ? num_items : id_and_first_vertex[i+1][1]) - id_and_first_vertex[i][1];
	    var column = id_to_index[id_and_first_vertex[i][0]];
	    for (var j=0; j<num_to_add; j++) {
		vertex_column_array.push(column);
	    }
	}
	view.vertex_column_array[track_id] = vertex_column_array;
	clearTrackColumnBuffers(view, model, track_id);
    };
    
    var computeVertexPositionsAndVertexColors = function (view, model, track_id) {
	if (view.rendering_suppressed) {
	    return;
	}
	var identified_shape_list_list = view.identified_shape_list_list[track_id];
	var id_to_index = model.getIdToIndexMap();
	identified_shape_list_list.sort(function(a, b) {
	    return sgndiff(id_to_index[a.id], id_to_index[b.id]);
	});
	// Compute vertex array
	var vertex_pos_array = [];
	var vertex_col_array = [];
	var id_to_first_vertex_index = {};
	
	var color_bank = [];
	var color_bank_index = {};
	
	var hashVector = function(vert) {
	    return vert.join(",");
	};
	
	var position_bit_pack_base = view.position_bit_pack_base;
	var packPos = function(pos) {
	    // values must be in [0,255] (integer)
	    return position_bit_pack_base*position_bit_pack_base*pos[0] + position_bit_pack_base*pos[1] + pos[2];
	};
	
	var vertexifiedShapes = {};
	
	
	for (var i = 0; i < identified_shape_list_list.length; i++) {
	    var shape_list = identified_shape_list_list[i].shape_list;
	    var id = identified_shape_list_list[i].id;

	    id_to_first_vertex_index[id] = vertex_pos_array.length;
	    
	    for (var j = 0; j < shape_list.length; j++) {
		var shape = shape_list[j];
		var hash = Shape.Shape.hashComputedShape(shape, j);
		if (!vertexifiedShapes.hasOwnProperty(hash)) {
		    vertexifiedShapes[hash] = {position:[], color:[]};
		    var position = vertexifiedShapes[hash].position;
		    var color = vertexifiedShapes[hash].color;
		    shapeToVertexes(shape, j, function(pos, col) {
			pos = pos.map(Math.round);
			col = col.map(function(x) { return Math.round(x*255);});
			
			position.push(packPos(pos));
			
			var col_hash = hashVector(col);
			var col_index = color_bank_index[col_hash];
			if (typeof col_index === "undefined") {
			    col_index = color_bank.length;
			    color_bank.push(col);
			    color_bank_index[col_hash] = col_index;
			}
			color.push(col_index);
		    });
		}
		vertex_pos_array.push.apply(vertex_pos_array, vertexifiedShapes[hash].position);
		vertex_col_array.push.apply(vertex_col_array, vertexifiedShapes[hash].color);
	    }
	}
	color_bank = color_bank.reduce(function(arr, next) { return arr.concat(next); }, []);
	// minimum color bank to avoid webGL texture errors
	if (color_bank.length === 0) {
	    color_bank.push(0,0,0,0);
	}
	view.vertex_data[track_id] = {
	    pos_array: vertex_pos_array,
	    col_array: vertex_col_array,
	    col_bank: color_bank
	};
	view.id_to_first_vertex_index[track_id] = id_to_first_vertex_index;
	
	clearTrackPositionAndColorBuffers(view, model, track_id);
    };
    
    var getShapes = function(view, model, track_id) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.identified_shape_list_list[track_id] = model.getIdentifiedShapeListList(track_id, true, true);
    };
    
    var refreshCanvas = function(view, model) {
	clearTrackPositionAndColorBuffers(view, model); // whenever you get a new context, you have to get new buffers
	clearTrackColumnBuffers(view, model);
	getNewCanvas(view);
	getWebGLContextAndSetUpMatrices(view, model);
	setUpShaders(view);
    };
    
    OncoprintWebGLCellView.prototype.getViewportOncoprintSpace = function(model) {
	var scroll_x = this.scroll_x;
	var scroll_y = this.scroll_y;
	var zoom_x = model.getHorzZoom();
	var zoom_y = model.getVertZoom();
	
	var window_left = Math.round(scroll_x / zoom_x);
	var window_right = Math.round((scroll_x + this.visible_area_width) / zoom_x);
	var window_top = Math.round(scroll_y / zoom_y);
	var window_bottom = Math.round((scroll_y + model.getCellViewHeight()) / zoom_y);
	
	return {
	    'top': window_top,
	    'bottom': window_bottom,
	    'left': window_left,
	    'right': window_right
	};
    }
    OncoprintWebGLCellView.prototype.isUsable = function () {
	return this.ctx !== null;
    }
    OncoprintWebGLCellView.prototype.removeTrack = function (model, track_id) {
	delete this.identified_shape_list_list[track_id];
	delete this.vertex_data[track_id];
	delete this.vertex_column_array[track_id];
	delete this.id_to_first_vertex_index[track_id];
	
	clearTrackPositionAndColorBuffers(this, model, track_id);
	clearTrackColumnBuffers(this, model, track_id);
	
	if (!this.rendering_suppressed) {
	    renderAllTracks(this, model);
	};
    }
    OncoprintWebGLCellView.prototype.moveTrack = function (model) {
	if (!this.rendering_suppressed) {
	    renderAllTracks(this, model);
	};
    }
    OncoprintWebGLCellView.prototype.setTrackGroupOrder = function(model) {
	renderAllTracks(this, model);
    }
    
    OncoprintWebGLCellView.prototype.addTracks = function (model, track_ids) {
	if (this.rendering_suppressed) {
	    return;
	};
	for (var i=0; i<track_ids.length; i++) {
	    getShapes(this, model, track_ids[i]);
	    computeVertexPositionsAndVertexColors(this, model, track_ids[i]);
	    computeVertexColumns(this, model, track_ids[i]);
	}
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.setIdOrder = function(model, ids) {
	if (this.rendering_suppressed) {
	    return;
	};
	var track_ids = model.getTracks();
	for (var i=0; i<track_ids.length; i++) {
	    computeVertexColumns(this, model, track_ids[i]);
	}
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.setTrackGroupSortPriority = function(model) {
	if (this.rendering_suppressed) {
	    return;
	};
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.sort = function(model) {
	if (this.rendering_suppressed) {
	    return;
	};
	var track_ids = model.getTracks();
	for (var i=0; i<track_ids.length; i++) {
	    computeVertexPositionsAndVertexColors(this, model, track_ids[i]); // need to recompute because the vertexes are in sorted order for clipping
	    computeVertexColumns(this, model, track_ids[i]);
	}
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.suppressRendering = function() {
	this.rendering_suppressed = true;
    }
    OncoprintWebGLCellView.prototype.releaseRendering = function(model) {
	this.rendering_suppressed = false;
	var track_ids = model.getTracks();
	for (var i=0; i<track_ids.length; i++) {
	    getShapes(this, model, track_ids[i]);
	    computeVertexPositionsAndVertexColors(this, model, track_ids[i]);
	    computeVertexColumns(this, model, track_ids[i]);
	}
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.hideIds = function(model) {
	if (this.rendering_suppressed) {
	    return;
	};
	var track_ids = model.getTracks();
	for (var i=0; i<track_ids.length; i++) {
	    computeVertexColumns(this, model, track_ids[i]);
	}
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.setTrackData = function(model, track_id) {
	if (this.rendering_suppressed) {
	    return;
	};
	getShapes(this, model, track_id);
	computeVertexPositionsAndVertexColors(this, model, track_id);
	computeVertexColumns(this, model, track_id);
	renderAllTracks(this, model);
    }
     OncoprintWebGLCellView.prototype.setRuleSet = function(model, target_track_id) {
	 if (this.rendering_suppressed) {
	    return;
	};
	getShapes(this, model, target_track_id);
	computeVertexPositionsAndVertexColors(this, model, target_track_id);
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.shareRuleSet = function(model, target_track_id) {
	if (this.rendering_suppressed) {
	    return;
	};
	getShapes(this, model, target_track_id);
	computeVertexPositionsAndVertexColors(this, model, target_track_id);
	renderAllTracks(this, model);
    }
    OncoprintWebGLCellView.prototype.setSortConfig = function(model) {
	if (this.rendering_suppressed) {
	    return;
	};
	this.sort(model);
    }
    
    OncoprintWebGLCellView.prototype.setHorzScroll = function(model) {
	this.setScroll(model);
    }
    
    OncoprintWebGLCellView.prototype.setVertScroll = function(model) {
	this.setScroll(model);
    }
    
    OncoprintWebGLCellView.prototype.setScroll = function(model) {
	this.scroll_x = model.getHorzScroll();
	this.scroll_y = model.getVertScroll();
	if (!this.rendering_suppressed) {
	    renderAllTracks(this, model, true);
	};
    }
    
    var updateAntialiasSetting = function(view, model) {
	var cell_width = model.getCellWidth();
	if (cell_width < view.antialias_on_cell_width_thresh) {
	    if (!view.antialias) {
		view.antialias = true;
		refreshCanvas(view, model);
	    }
	} else {
	    if (view.antialias) {
		view.antialias = false;
		refreshCanvas(view, model);
	    }
	}
    };
    
    OncoprintWebGLCellView.prototype.setZoom = function(model) {
	updateAntialiasSetting(this, model);
	if (!this.rendering_suppressed) {
	    renderAllTracks(this, model);
	};
    }
    
    OncoprintWebGLCellView.prototype.setHorzZoom = function(model) {
	updateAntialiasSetting(this, model);
	if (!this.rendering_suppressed) {
	    renderAllTracks(this, model);
	};
    }
    
    OncoprintWebGLCellView.prototype.setVertZoom = function(model) {
	if (this.rendering_suppressed) {
	    return;
	};
	renderAllTracks(this, model);
    }
    
    OncoprintWebGLCellView.prototype.setViewport = function(model) {
	this.scroll_x = model.getHorzScroll();
	this.scroll_y = model.getVertScroll();
	updateAntialiasSetting(this, model);
	if (!this.rendering_suppressed) {
	    renderAllTracks(this, model);
	};
    }
    
    OncoprintWebGLCellView.prototype.getTotalWidth = function(model, base) {
	return (model.getCellWidth(base) + model.getCellPadding(base))*model.getIdOrder().length;
    }
    
    OncoprintWebGLCellView.prototype.getWidth = function() {
	return this.visible_area_width;
    }
    
    OncoprintWebGLCellView.prototype.setWidth = function(w, model) {
	this.visible_area_width = w;
	if (this.rendering_suppressed) {
	    return;
	};
	renderAllTracks(this, model); // in the process it will call resizeAndClear
    }
    
    OncoprintWebGLCellView.prototype.setCellPaddingOn = function(model) {
	if (this.rendering_suppressed) {
	    return;
	};
	var track_ids = model.getTracks();
	for (var i=0; i<track_ids.length; i++) {
	    if (!model.getTrackHasColumnSpacing(track_ids[i])) {
		// We need to recompute shapes for tracks that don't have column spacing,
		// because for those we're redefining the base width for shape generation.
		getShapes(this, model, track_ids[i]);
		computeVertexPositionsAndVertexColors(this, model, track_ids[i]);
	    }
	    computeVertexColumns(this, model, track_ids[i]);
	}
	renderAllTracks(this, model);
    }
    
    OncoprintWebGLCellView.prototype.getDummyScrollDivClientSize = function() {
	return this.dummy_scroll_div_client_size.get();
    }
    
    OncoprintWebGLCellView.prototype.toSVGGroup = function(model, offset_x, offset_y) {
	var root = svgfactory.group((offset_x || 0), (offset_y || 0));
	var cell_tops = model.getCellTops();
	var tracks = model.getTracks();
	var zoomedColumnLeft = model.getZoomedColumnLeft();
	for (var i=0; i<tracks.length; i++) {
	    var track_id = tracks[i];
	    var offset_y = cell_tops[track_id];
	    var identified_shape_list_list = model.getIdentifiedShapeListList(track_id, false, true);
	    for (var j=0; j<identified_shape_list_list.length; j++) {
		var id_sl = identified_shape_list_list[j];
		var id = id_sl.id;
		var sl = id_sl.shape_list;
		var offset_x = zoomedColumnLeft[id];
		if (typeof offset_x === 'undefined') {
		    // hidden id
		    continue;
		}
		for (var h=0; h<sl.length; h++) {
		    root.appendChild(svgfactory.fromShape(sl[h], offset_x, offset_y));
		}
	    }
	}
	return root;
    }
    return OncoprintWebGLCellView;
})();

module.exports = OncoprintWebGLCellView;

},{"./CachedProperty.js":12,"./oncoprintshape.js":25,"./oncoprintshapetovertexes.js":27,"./svgfactory.js":34,"gl-matrix":1,"jquery":11}],32:[function(require,module,exports){
var $ = require('jquery');

var OncoprintZoomSlider = (function() {
    var VERTICAL = "v";
    var HORIZONTAL = "h";
    
    var clamp = function(x) {
	return Math.max(Math.min(x, 1), 0);
    };
    
    var initialize = function(component, params) {
	var $ctr = component.$div;
	var icon_size = Math.round(params.btn_size * 0.7);
	var icon_padding = Math.round((params.btn_size - icon_size)/2);
	var $slider_bar = $('<div>').css({'position':'absolute',
					'background-color':'#ffffff',
					'outline': 'solid 1px black'}).appendTo($ctr);
	var $slider = $('<div>').css({'position':'absolute',
				    'background-color':'#ffffff',
				    'border': 'solid 1px black',
				    'border-radius': '3px',
				    'cursor': 'pointer'}).appendTo($ctr);
				
	var $plus_btn = $('<div>').css({'position':'absolute',
					    'min-height': params.btn_size,
					    'min-width': params.btn_size,
					    'background-color':'#ffffff',
					    'border': 'solid 1px black',
					    'border-radius': '3px',
					    'cursor': 'pointer'})
						.appendTo($ctr);
	$('<span>').addClass("icon fa fa-plus").css({'position':'absolute', 
							'top':icon_padding,
							'left':icon_padding,
							'min-width':icon_size,
							'min-height':icon_size})
						.appendTo($plus_btn);
	var $minus_btn = $('<div>').css({'position':'absolute',
					    'min-height': params.btn_size,
					    'min-width': params.btn_size,
					    'background-color':'#ffffff',
					    'border': 'solid 1px black',
					    'border-radius': '3px',
					    'cursor': 'pointer'})
						.appendTo($ctr);
	$('<span>').addClass("icon fa fa-minus").css({'position':'absolute', 
							'top':icon_padding,
							'left':icon_padding,
							'min-width':icon_size,
							'min-height':icon_size})
						.appendTo($minus_btn);
	if (params.vertical) {
	    $slider_bar.css({'min-height': params.height - 2 * params.btn_size,
		'min-width': Math.round(params.btn_size / 5)});
	    $slider.css({'min-height': Math.round(params.btn_size / 2),
		'min-width': params.btn_size});

	    $plus_btn.css({'top': 0, 'left': 0});
	    $minus_btn.css({'top': params.height - params.btn_size, 'left': 0});
	    $slider_bar.css({'top': params.btn_size, 'left': 0.4 * params.btn_size});
	    $slider.css({'left': 0});
	    component.orientation = VERTICAL;
	} else {
	    $slider_bar.css({'min-height': Math.round(params.btn_size / 5),
		'min-width': params.width - 2 * params.btn_size});
	    $slider.css({'min-height': params.btn_size,
		'min-width': Math.round(params.btn_size / 2)});
	    
	    $plus_btn.css({'top': 0, 'left': params.width - params.btn_size});
	    $minus_btn.css({'top': 0, 'left': 0});
	    $slider_bar.css({'top': 0.4*params.btn_size, 'left': params.btn_size});
	    $slider.css({'top': 0});
	    component.orientation = HORIZONTAL;
	}
	
	$plus_btn.click(function() {
	    component.value /= 0.7;
	    params.onChange(component.value);
	});				
	$minus_btn.click(function() {
	    component.value *= 0.7;
	    params.onChange(component.value);
	});
	
	[$slider, $plus_btn, $minus_btn].map(function($btn) { $btn.hover(function() {
	    $(this).css({'background-color':'#cccccc'});
	}, function() {
	    $(this).css({'background-color': '#ffffff'});
	}); });
    
    
    
	component.$slider = $slider;
	component.$plus_btn = $plus_btn;
	component.$minus_btn = $minus_btn;
	
	(function setUpSliderDrag() {
	    var start_mouse;
	    var start_val;
	    var dragging;
	    var handleSliderDrag = function (evt) {
		evt.stopPropagation();
		evt.preventDefault();
		var delta_mouse;
		if (component.orientation === VERTICAL) {
		    delta_mouse = start_mouse - evt.pageY; // vertical zoom, positive is up, but CSS positive is down, so we need to invert
		} else {
		    delta_mouse = evt.pageX - start_mouse;
		}
		var delta_val = delta_mouse / component.slider_bar_size;
		component.setSliderValue(start_val + delta_val);
	    };
	    var stopSliderDrag = function () {
		if (dragging && start_val !== component.value) {
		    component.onChange(component.value);
		}
		dragging = false;
	    };
	    component.$slider.on("mousedown", function (evt) {
		if (component.orientation === VERTICAL) {
		    start_mouse = evt.pageY;
		} else {
		    start_mouse = evt.pageX;
		}
		start_val = component.value;
		dragging = true;
		$(document).on("mousemove", handleSliderDrag);
	    });
	    $(document).on("mouseup click", function () {
		$(document).off("mousemove", handleSliderDrag);
		stopSliderDrag();
	    });
	})()
    };
    
    var setSliderPos = function(component, proportion) {
	var $slider = component.$slider;
	var bounds = getSliderBounds(component);
	if (component.orientation === VERTICAL) {
	    $slider.css('top', bounds.bottom*(1-proportion) + bounds.top*proportion);
	} else if (component.orientation === HORIZONTAL) {
	    $slider.css('left', bounds.left*(1-proportion) + bounds.right*proportion);
	}
    };
    
    var getSliderBounds = function(component) {
	if (component.orientation === VERTICAL) {
	    return {bottom: parseInt(component.$minus_btn.css('top'), 10) - parseInt(component.$slider.css('min-height'), 10),
		    top: parseInt(component.$plus_btn.css('top'), 10) + parseInt(component.$plus_btn.css('min-height'), 10)};
	} else { 
	    return {left: parseInt(component.$minus_btn.css('left'), 10) + parseInt(component.$minus_btn.css('min-width'), 10),
		    right: parseInt(component.$plus_btn.css('left'), 10) - parseInt(component.$slider.css('min-width'), 10)};
	}
    };
    
    var updateSliderPos = function(component) {
	setSliderPos(component, component.value);
    };
    
    function OncoprintZoomSlider($container, params) {
	this.$div = $('<div>').css({'position':'absolute',
				    'top': params.top || 0,
				    'left': params.left || 0}).appendTo($container);
	params = params || {};
	params.btn_size = params.btn_size || 13;
	this.onChange = params.onChange || function() {};
	initialize(this, params);
	this.value = params.init_val || 0.5;
	this.slider_bar_size = (this.orientation === VERTICAL ? params.height : params.width) - 2*params.btn_size;
	updateSliderPos(this);
    }
    
    OncoprintZoomSlider.prototype.setSliderValue = function(proportion, trigger_callback) {
	this.value = clamp(proportion);
	updateSliderPos(this);
    }
    
    
    return OncoprintZoomSlider;
    })();
    
module.exports = OncoprintZoomSlider;
},{"jquery":11}],33:[function(require,module,exports){
/*
 * Copyright (c) 2016 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = (function setPolyfills() {
    Math.log2 = Math.log2 || function(x) { return Math.log(x) / Math.LN2; };
})();
},{}],34:[function(require,module,exports){
var makeSVGElement = require('./makesvgelement.js');
var shapeToSVG = require('./oncoprintshapetosvg.js');
var extractRGBA = require('./extractrgba.js');

var extractColor = function(str) {
    if (str.indexOf("rgb(") > -1) {
	return {
	    'rgb': str,
	    'opacity': 1
	};
    }
    var rgba_arr = extractRGBA(str);
    return {
	'rgb': 'rgb('+Math.round(rgba_arr[0]*255)+','+Math.round(rgba_arr[1]*255)+','+Math.round(rgba_arr[2]*255)+')',
	'opacity': rgba_arr[3]
    };
};

function makeIdCounter() {
    var id = 0;
    return function () {
	id += 1;
	return id;
    };
}

var gradientId = makeIdCounter();

module.exports = {
    text: function(content,x,y,size,family,weight,alignment_baseline) {
	size = size || 12;
	var alignment_baseline_y_offset = size;
	if (alignment_baseline === "middle") {
	    alignment_baseline_y_offset = size/2;
	} else if (alignment_baseline === "bottom") {
	    alignment_baseline_y_offset = 0;
	}
	var elt = makeSVGElement('text', {
	    'x':(x || 0),
	    'y':(y || 0) + alignment_baseline_y_offset,
	    'font-size':size,
	    'font-family':(family || 'serif'),
	    'font-weight':(weight || 'normal'),
	    'text-anchor':'start',
	});
	elt.textContent = content + '';
	return elt;
    },
    group: function(x,y) {
	x = x || 0;
	y = y || 0;
	return makeSVGElement('g', {
	    'transform':'translate('+x+','+y+')',
	    'x':x,
	    'y':y
	});
    },
    svg: function(width, height) {
	return makeSVGElement('svg', {
	    'width':(width || 0), 
	    'height':(height || 0),
	});
    },
    wrapText: function(in_dom_text_svg_elt, width) {
	var text = in_dom_text_svg_elt.textContent;
	in_dom_text_svg_elt.textContent = "";
	
	var words = text.split(" ");
	var dy = 0;
	var tspan = makeSVGElement('tspan', {'x':'0', 'dy':dy});
	in_dom_text_svg_elt.appendChild(tspan);
	
	var curr_tspan_words = [];
	for (var i=0; i<words.length; i++) {
	    curr_tspan_words.push(words[i]);
	    tspan.textContent = curr_tspan_words.join(" ");
	    if (tspan.getComputedTextLength() > width) {
		tspan.textContent = curr_tspan_words.slice(0, curr_tspan_words.length-1).join(" ");
		dy = in_dom_text_svg_elt.getBBox().height;
		curr_tspan_words = [words[i]];
		tspan = makeSVGElement('tspan', {'x':'0', 'dy':dy});
		in_dom_text_svg_elt.appendChild(tspan);
		tspan.textContent = words[i];
	    }
	}
    },
    fromShape: function(oncoprint_shape_computed_params, offset_x, offset_y) {
	return shapeToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    },
    polygon: function(points, fill) {
	return makeSVGElement('polygon', {'points': points, 'fill':fill});
    },
    rect: function(x,y,width,height,fill) {
	return makeSVGElement('rect', {'x':x, 'y':y, 'width':width, 'height':height, 'fill':fill});
    },
    bgrect: function(width, height, fill) {
	return makeSVGElement('rect', {'width':width, 'height':height, 'fill':fill});
    },
    path: function(points, stroke, fill) {
	points = points.map(function(pt) { return pt.join(","); });
	points[0] = 'M'+points[0];
	for (var i=1; i<points.length; i++) {
	    points[i] = 'L'+points[i];
	}
	stroke = extractColor(stroke);
	fill = extractColor(fill);
	return makeSVGElement('path', {
	    'd': points.join(" "),
	    'stroke': stroke.rgb,
	    'stroke-opacity': stroke.opacity,
	    'fill': fill.rgb,
	    'fill-opacity': fill.opacity
	});
    },
    defs: function() {
	return makeSVGElement('defs');
    },
    gradient: function(colorFn) {
	var gradient = makeSVGElement('linearGradient', {
	    'id': 'gradient'+gradientId(),
	    'x1':0,
	    'y1':0,
	    'x2':1,
	    'y2':0
	});
	for (var i=0; i<=100; i++) {
	    var color = extractColor(colorFn(i/100));
	    gradient.appendChild(makeSVGElement('stop', {
		'offset': i + '%',
		'stop-color':color.rgb,
		'stop-opacity': color.opacity
	    }));
	}
	return gradient;
    }
};



},{"./extractrgba.js":14,"./makesvgelement.js":18,"./oncoprintshapetosvg.js":26}]},{},[17]);
