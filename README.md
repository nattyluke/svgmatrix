# SVGMatrix
This is a fork of DOMMatrix...

# DOMMatrix
[![Coverage Status](https://coveralls.io/repos/github/thednp/svgmatrix/badge.svg)](https://coveralls.io/github/thednp/svgmatrix) 
[![NPM Version](https://img.shields.io/npm/v/@thednp/svgmatrix.svg)](https://www.npmjs.com/package/@thednp/svgmatrix)
[![NPM Downloads](https://img.shields.io/npm/dm/@thednp/svgmatrix.svg)](http://npm-stat.com/charts.html?@thednp/svgmatrix)
[![ci](https://github.com/thednp/svgmatrix/actions/workflows/ci.yml/badge.svg)](https://github.com/thednp/svgmatrix/actions/workflows/ci.yml)
[![jsDeliver](https://data.jsdelivr.com/v1/package/npm/@thednp/svgmatrix/badge)](https://www.jsdelivr.com/package/npm/@thednp/svgmatrix)
[![typescript version](https://img.shields.io/badge/typescript-5.8.3-brightgreen)](https://www.typescriptlang.org/)
[![vitest version](https://img.shields.io/badge/vitest-2.1.9-brightgreen)](https://vitest.dev/)
[![vite version](https://img.shields.io/badge/vite-5.4.19-brightgreen)](https://vitejs.dev/)

A TypeScript sourced [DOMMatrix](https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix) shim for **Node.js** apps and legacy browsers. Since this source is modernized, legacy browsers might need some additional shims.

The constructor is close to the **DOMMatrix Interface** in many respects, but tries to keep a sense of simplicity. In that note, we haven't implemented [DOMMatrixReadOnly](https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrixReadOnly) methods like `flipX()` or `inverse()` or aliases for the main methods like `translateSelf` or the old `rotate3d`.

DOMMatrix shim is meant to be a light pocket tool for [many things](http://thednp.github.io/svg-path-commander), for a complete polyfill you might want to also consider more  [geometry-interfaces](https://github.com/trusktr/geometry-interfaces)
and [geometry-polyfill](https://github.com/jarek-foksa/geometry-polyfill).

This library implements a full transform string parsing via the static method `.fromString()`, which produce results inline with the DOMMatrix Interface as well as a very [elegant method](https://github.com/jsidea/jsidea/blob/2b4486c131d5cca2334293936fa13454b34fcdef/ts/jsidea/geom/Matrix3D.ts#L788) to determine `is2D`. Before moving to the [technical details](#More-info) of this script, have a look at the demo.


# Demo
See DOMMatrix shim in action, [click me](https://thednp.github.io/svgmatrix) and start transforming.


# Installation
```js
npm install @thednp/svgmatrix
```
Download the latest version and copy the `dist/svgmatrix.js` file to your project assets folder, then load the file in your front-end:
```html
<script src="./assets/js/svgmatrix.js">
```

Alternativelly you can load from CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@thednp/svgmatrix/dist/svgmatrix.js">
```

# Usage
In your regular day to day usage, you will find yourself writing something like this:
```js
import CSSMatrix from '@thednp/svgmatrix';

// init
let myMatrix = new CSSMatrix('matrix(1,0.25,-0.25,1,0,0)');

// apply methods
myMatrix.translate(15);
myMatrix.rotate(15);

// apply to styling to target
element.style.transform = myMatrix.toString();
```
For the complete JavaScript API, check the [JavaScript API](https://github.com/thednp/DOMMatrix/wiki/JavaScript-API) section in our wiki.

# WIKI
For more indepth guides, head over to the [wiki pages](https://github.com/thednp/DOMMatrix/wiki) for developer guidelines.

# More Info
In contrast with the [original source](https://github.com/arian/CSSMatrix/) there have been a series of changes to the prototype for consistency, performance as well as requirements to better accomodate the **DOMMatrix** interface:

* **changed** how the constructor determines if the matrix is 2D, based on a [more accurate method](https://github.com/jsidea/jsidea/blob/2b4486c131d5cca2334293936fa13454b34fcdef/ts/jsidea/geom/Matrix3D.ts#L788) which is actually checking the designated values of the 3D space; in contrast, the old *CSSMatrix* constructor sets `afine` property at initialization only and based on the number of arguments or the type of the input CSS transform syntax; 
* **fixed** the `translate()`, `scale()` and `rotate()` instance methods to work with one axis transformation, also inline with **DOMMatrix**;
* **changed** `toString()` instance method to utilize the new method `toArray()` described below;
* **changed** `setMatrixValue()` instance method to do all the heavy duty work with parameters;
* **added** `is2D` (*getter* and *setter*) property;
* **added** `isIdentity` (*getter* and *setter*) property;
* **added** `skew()` public method to work in line with native DOMMatrix;
* **added** `Skew()` static method to work with the above `skew()` instance method;
* **added** `fromMatrix` static method, not present in the constructor prototype;
* **added** `fromString` static method, not present in the constructor prototype;
* **added** `fromArray()` static method, not present in the constructor prototype, should also process *Float32Array* / *Float64Array* via `Array.from()`;
* **added** `toFloat64Array()` and `toFloat32Array()` instance methods, the updated `toString()` method makes use of them alongside `toArray`;
* **added** `toArray()` instance method, normalizes values and is used by the `toString()` instance method;
* **added** `toJSON()` instance method will generate a standard *Object* which includes `{a,b,c,d,e,f}` and `{m11,m12,m13,..m44}` properties and excludes `is2D` & `isIdentity` properties;
* **added** `transformPoint()` instance method which works like the original.
* **added** `isCompatibleArray()` static method to check if an array is a compatible array of 6/16 numbers.
* **added** `isCompatibleObject()` static method to checks if an object is compatible with CSSMatrix, usually another CSSMatrix / DOMMatrix instance or the result of these instances toJSON() method call.
* *removed* `afine` property, it's a very old *WebKitCSSMatrix* defined property;
* *removed* `inverse()` instance method, will be re-added later for other implementations (probably going to be accompanied by `determinant()`, `transpose()` and others);
* *removed* `transform` instance method, not present in the native **DOMMatrix** prototype;
* *removed* `setIdentity()` instance method due to code rework for enabling better TypeScript definitions;
* *removed* `toFullString()` instance method, probably something also from *WebKitCSSMatrix*;
* *removed* `feedFromArray` static method, not present in the constructor prototype, `fromArray()` will cover that;
* *not supported* `fromFloat64Array()` and `fromFloat32Array()` static methods are not supported, our `fromArray()` should handle them just as well;
* *not supported* `flipX()` or `flipY()` instance methods of the *DOMMatrixReadOnly* prototype are not supported,
* *not supported* `translateSelf()` or `rotateSelf()` instance methods of the *DOMMatrix* prototype are not supported, instead we only implemented the most used *DOMMatrixReadOnly* instance methods.
* *not supported* `scaleNonUniformSelf()` or `rotate3d()` with `{x, y, z}` transform origin parameters are not implemented.


# Thanks
* Joe Pea for his [geometry-interfaces](https://github.com/trusktr/geometry-interfaces)
* Jarek Foksa for his [geometry-polyfill](https://github.com/jarek-foksa/geometry-polyfill)
* Arian Stolwijk for his [CSSMatrix](https://github.com/arian/CSSMatrix/)

# License
DOMMatrix shim is [MIT Licensed](https://github.com/thednp/DOMMatrix/blob/master/LICENSE).
