import type {
  CSSMatrixInput,
  JSONMatrix,
  Matrix,
  Matrix3d,
  PointTuple,
} from "./types";

/** A model for JSONMatrix */
const JSON_MATRIX: JSONMatrix = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
  m11: 1,
  m12: 0,
  m13: 0,
  m14: 0,
  m21: 0,
  m22: 1,
  m23: 0,
  m24: 0,
  m31: 0,
  m32: 0,
  m33: 1,
  m34: 0,
  m41: 0,
  m42: 0,
  m43: 0,
  m44: 1,
  is2D: true,
  isIdentity: true,
};

// CSSMatrix Static methods
// * `fromArray` is a more simple implementation, should also accept Float[32/64]Array;
// * `fromMatrix` load values from another CSSMatrix/DOMMatrix instance or JSON object;
// * `fromString` parses and loads values from any valid CSS transform string (TransformList).
// * `isCompatibleArray` Checks if an array is compatible with CSSMatrix.
// * `isCompatibleObject` Checks if an object is compatible with CSSMatrix.

/** Checks if an array is compatible with CSSMatrix */
const isCompatibleArray = (
  array?: unknown,
): array is Matrix | Matrix3d | Float32Array | Float64Array => {
  return (
    (array instanceof Float64Array ||
      array instanceof Float32Array ||
      (Array.isArray(array) && array.every((x) => typeof x === "number"))) &&
    [6, 16].some((x) => array.length === x)
  );
};

/** Checks if an object is compatible with CSSMatrix */
const isCompatibleObject = (
  object?: unknown,
): object is CSSMatrix | DOMMatrix | JSONMatrix => {
  return (
    object instanceof DOMMatrix ||
    object instanceof CSSMatrix ||
    (typeof object === "object" &&
      Object.keys(JSON_MATRIX).every((k) => object && k in object))
  );
};

/**
 * Creates a new mutable `CSSMatrix` instance given an array of 16/6 floating point values.
 * This static method invalidates arrays that contain non-number elements.
 *
 * If the array has six values, the result is a 2D matrix; if the array has 16 values,
 * the result is a 3D matrix. Otherwise, a TypeError exception is thrown.
 *
 * @param array an `Array` to feed values from.
 * @return the resulted matrix.
 */
const fromArray = (
  array: number[] | Float32Array | Float64Array,
): CSSMatrix => {
  const m = new CSSMatrix();
  const a = Array.from(array);

  if (!isCompatibleArray(a)) {
    throw TypeError(
      `CSSMatrix: "${a.join(",")}" must be an array with 6/16 numbers.`,
    );
  }
  // istanbul ignore else @preserve
  if (a.length === 16) {
    const [
      m11,
      m12,
      m13,
      m14,
      m21,
      m22,
      m23,
      m24,
      m31,
      m32,
      m33,
      m34,
      m41,
      m42,
      m43,
      m44,
    ] = a;

    m.m11 = m11;
    m.a = m11;

    m.m21 = m21;
    m.c = m21;

    m.m31 = m31;

    m.m41 = m41;
    m.e = m41;

    m.m12 = m12;
    m.b = m12;

    m.m22 = m22;
    m.d = m22;

    m.m32 = m32;

    m.m42 = m42;
    m.f = m42;

    m.m13 = m13;
    m.m23 = m23;
    m.m33 = m33;
    m.m43 = m43;
    m.m14 = m14;
    m.m24 = m24;
    m.m34 = m34;
    m.m44 = m44;
  } else if (a.length === 6) {
    const [M11, M12, M21, M22, M41, M42] = a;

    m.m11 = M11;
    m.a = M11;

    m.m12 = M12;
    m.b = M12;

    m.m21 = M21;
    m.c = M21;

    m.m22 = M22;
    m.d = M22;

    m.m41 = M41;
    m.e = M41;

    m.m42 = M42;
    m.f = M42;
  }
  return m;
};

/**
 * Creates a new mutable `CSSMatrix` instance given an existing matrix or a
 * `DOMMatrix` instance which provides the values for its properties.
 *
 * @param m the source matrix to feed values from.
 * @return the resulted matrix.
 */
const fromMatrix = (m: CSSMatrix | DOMMatrix | JSONMatrix): CSSMatrix => {
  if (isCompatibleObject(m)) {
    return fromArray([
      m.m11,
      m.m12,
      m.m13,
      m.m14,
      m.m21,
      m.m22,
      m.m23,
      m.m24,
      m.m31,
      m.m32,
      m.m33,
      m.m34,
      m.m41,
      m.m42,
      m.m43,
      m.m44,
    ]);
  }
  throw TypeError(
    `CSSMatrix: "${
      JSON.stringify(m)
    }" is not a DOMMatrix / CSSMatrix / JSON compatible object.`,
  );
};

/**
 * Creates a new mutable `CSSMatrix` given any valid CSS transform string,
 * or what we call `TransformList`:
 *
 * * `matrix(a, b, c, d, e, f)` - valid matrix() transform function
 * * `matrix3d(m11, m12, m13, ...m44)` - valid matrix3d() transform function
 * * `translate(tx, ty) rotateX(alpha)` - any valid transform function(s)
 *
 * @copyright thednp © 2021
 *
 * @param source valid CSS transform string syntax.
 * @return the resulted matrix.
 */
const fromString = (source: string): CSSMatrix => {
  if (typeof source !== "string") {
    throw TypeError(`CSSMatrix: "${JSON.stringify(source)}" is not a string.`);
  }
  const str = String(source).replace(/\s/g, "");
  let m = new CSSMatrix();
  const invalidStringError = `CSSMatrix: invalid transform string "${source}"`;

  // const px = ['perspective'];
  // const length = ['translate', 'translate3d', 'translateX', 'translateY', 'translateZ'];
  // const deg = ['rotate', 'rotate3d', 'rotateX', 'rotateY', 'rotateZ', 'skew', 'skewX', 'skewY'];
  // const abs = ['scale', 'scale3d', 'matrix', 'matrix3d'];
  // const transformFunctions = px.concat(length, deg, abs);

  str
    .split(")")
    .filter((f) => f)
    .forEach((tf) => {
      const [prop, value] = tf.split("(");

      // invalidate empty string
      if (!value) throw TypeError(invalidStringError);

      const components = value
        .split(",")
        .map((
          n,
        ) => (n.includes("rad")
          ? parseFloat(n) * (180 / Math.PI)
          : parseFloat(n))
        );

      const [x, y, z, a] = components;
      const xyz = [x, y, z];
      const xyza = [x, y, z, a];

      // single number value expected
      if (
        prop === "perspective" && x && [y, z].every((n) => n === undefined)
      ) {
        m.m34 = -1 / x;
        // 6/16 number values expected
      } else if (
        prop.includes("matrix") &&
        [6, 16].includes(components.length) &&
        components.every((n) => !Number.isNaN(+n))
      ) {
        const values = components.map((n) => (Math.abs(n) < 1e-6 ? 0 : n));
        m = m.multiply(fromArray(values as Matrix | Matrix3d));
        // 3 values expected
      } else if (
        prop === "translate3d" && xyz.every((n) => !Number.isNaN(+n))
      ) {
        m = m.translate(x, y, z);
        // single/double number value(s) expected
      } else if (prop === "translate" && z === undefined) {
        m = m.translate(x, y || 0, 0);
        // all 4 values expected
      } else if (
        prop === "rotate3d" && xyza.every((n) => !Number.isNaN(+n)) && a
      ) {
        m = m.rotateAxisAngle(x, y, z, a);
        // single value expected
      } else if (
        prop === "rotate" && x && [y, z].every((n) => n === undefined)
      ) {
        m = m.rotate(0, 0, x);
        // 3 values expected
      } else if (
        prop === "scale3d" && xyz.every((n) => !Number.isNaN(+n)) &&
        xyz.some((n) => n !== 1)
      ) {
        m = m.scale(x, y, z);
        // single value expected
      } else if (
        // prop === "scale" && !Number.isNaN(x) && x !== 1 && z === undefined
        // prop === "scale" && !Number.isNaN(x) && [x, y].some((n) => n !== 1) &&
        prop === "scale" && !Number.isNaN(x) &&
        z === undefined
      ) {
        const nosy = Number.isNaN(+y);
        const sy = nosy ? x : y;
        m = m.scale(x, sy, 1);
        // single/double value expected
      } else if (
        prop === "skew" && (x || (!Number.isNaN(x) && y)) && z === undefined
      ) {
        m = m.skew(x, y || 0);
      } else if (
        ["translate", "rotate", "scale", "skew"].some((p) =>
          prop.includes(p)
        ) &&
        /[XYZ]/.test(prop) &&
        x &&
        [y, z].every((n) => n === undefined) // a single value expected
      ) {
        if ("skewX" === prop || "skewY" === prop) {
          m = m[prop](x);
        } else {
          const fn = prop.replace(/[XYZ]/, "") as
            | "scale"
            | "translate"
            | "rotate";
          const axis = prop.replace(fn, "");
          const idx = ["X", "Y", "Z"].indexOf(axis);
          const def = fn === "scale" ? 1 : 0;
          const axeValues: [number, number, number] = [
            idx === 0 ? x : def,
            idx === 1 ? x : def,
            idx === 2 ? x : def,
          ];
          m = m[fn](...axeValues);
        }
      } else {
        throw TypeError(invalidStringError);
      }
    });

  return m;
};

/**
 * Returns an *Array* containing elements which comprise the matrix.
 * The method can return either the 16 elements or the 6 elements
 * depending on the value of the `is2D` parameter.
 *
 * @param m the source matrix to feed values from.
 * @param is2D *Array* representation of the matrix
 * @return an *Array* representation of the matrix
 */
const toArray = (
  m: CSSMatrix | DOMMatrix | JSONMatrix,
  is2D?: boolean,
): Matrix | Matrix3d => {
  if (is2D) {
    return [m.a, m.b, m.c, m.d, m.e, m.f];
  }
  return [
    m.m11,
    m.m12,
    m.m13,
    m.m14,
    m.m21,
    m.m22,
    m.m23,
    m.m24,
    m.m31,
    m.m32,
    m.m33,
    m.m34,
    m.m41,
    m.m42,
    m.m43,
    m.m44,
  ];
};

// Transform Functions
// https://www.w3.org/TR/css-transforms-1/#transform-functions

/**
 * Creates a new `CSSMatrix` for the translation matrix and returns it.
 * This method is equivalent to the CSS `translate3d()` function.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translate3d
 *
 * @param x the `x-axis` position.
 * @param y the `y-axis` position.
 * @param z the `z-axis` position.
 * @return the resulted matrix.
 */
const Translate = (x: number, y: number, z: number): CSSMatrix => {
  const m = new CSSMatrix();
  m.m41 = x;
  m.e = x;
  m.m42 = y;
  m.f = y;
  m.m43 = z;
  return m;
};

/**
 * Creates a new `CSSMatrix` for the rotation matrix and returns it.
 *
 * http://en.wikipedia.org/wiki/Rotation_matrix
 *
 * @param rx the `x-axis` rotation.
 * @param ry the `y-axis` rotation.
 * @param rz the `z-axis` rotation.
 * @return the resulted matrix.
 */
const Rotate = (rx: number, ry: number, rz: number): CSSMatrix => {
  const m = new CSSMatrix();
  const degToRad = Math.PI / 180;
  const radX = rx * degToRad;
  const radY = ry * degToRad;
  const radZ = rz * degToRad;

  // minus sin() because of right-handed system
  const cosx = Math.cos(radX);
  const sinx = -Math.sin(radX);
  const cosy = Math.cos(radY);
  const siny = -Math.sin(radY);
  const cosz = Math.cos(radZ);
  const sinz = -Math.sin(radZ);

  const m11 = cosy * cosz;
  const m12 = -cosy * sinz;

  m.m11 = m11;
  m.a = m11;

  m.m12 = m12;
  m.b = m12;

  m.m13 = siny;

  const m21 = sinx * siny * cosz + cosx * sinz;
  m.m21 = m21;
  m.c = m21;

  const m22 = cosx * cosz - sinx * siny * sinz;
  m.m22 = m22;
  m.d = m22;

  m.m23 = -sinx * cosy;

  m.m31 = sinx * sinz - cosx * siny * cosz;
  m.m32 = sinx * cosz + cosx * siny * sinz;
  m.m33 = cosx * cosy;

  return m;
};

/**
 * Creates a new `CSSMatrix` for the rotation matrix and returns it.
 * This method is equivalent to the CSS `rotate3d()` function.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate3d
 *
 * @param x the `x-axis` vector length.
 * @param y the `y-axis` vector length.
 * @param z the `z-axis` vector length.
 * @param alpha the value in degrees of the rotation.
 * @return the resulted matrix.
 */
const RotateAxisAngle = (
  x: number,
  y: number,
  z: number,
  alpha: number,
): CSSMatrix => {
  const m = new CSSMatrix();
  const length = Math.sqrt(x * x + y * y + z * z);

  if (length === 0) {
    // bad vector length, return identity
    return m;
  }

  const X = x / length;
  const Y = y / length;
  const Z = z / length;

  const angle = alpha * (Math.PI / 360);
  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);
  const sinA2 = sinA * sinA;
  const x2 = X * X;
  const y2 = Y * Y;
  const z2 = Z * Z;

  const m11 = 1 - 2 * (y2 + z2) * sinA2;
  m.m11 = m11;
  m.a = m11;

  const m12 = 2 * (X * Y * sinA2 + Z * sinA * cosA);
  m.m12 = m12;
  m.b = m12;

  m.m13 = 2 * (X * Z * sinA2 - Y * sinA * cosA);

  const m21 = 2 * (Y * X * sinA2 - Z * sinA * cosA);
  m.m21 = m21;
  m.c = m21;

  const m22 = 1 - 2 * (z2 + x2) * sinA2;
  m.m22 = m22;
  m.d = m22;

  m.m23 = 2 * (Y * Z * sinA2 + X * sinA * cosA);
  m.m31 = 2 * (Z * X * sinA2 + Y * sinA * cosA);
  m.m32 = 2 * (Z * Y * sinA2 - X * sinA * cosA);
  m.m33 = 1 - 2 * (x2 + y2) * sinA2;

  return m;
};

/**
 * Creates a new `CSSMatrix` for the scale matrix and returns it.
 * This method is equivalent to the CSS `scale3d()` function, except it doesn't
 * accept {x, y, z} transform origin parameters.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/scale3d
 *
 * @param x the `x-axis` scale.
 * @param y the `y-axis` scale.
 * @param z the `z-axis` scale.
 * @return the resulted matrix.
 */
const Scale = (x: number, y: number, z: number): CSSMatrix => {
  const m = new CSSMatrix();
  m.m11 = x;
  m.a = x;

  m.m22 = y;
  m.d = y;

  m.m33 = z;
  return m;
};

/**
 * Creates a new `CSSMatrix` for the shear of both the `x-axis` and`y-axis`
 * matrix and returns it. This method is equivalent to the CSS `skew()` function.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/skew
 *
 * @param angleX the X-angle in degrees.
 * @param angleY the Y-angle in degrees.
 * @return the resulted matrix.
 */
const Skew = (angleX: number, angleY: number): CSSMatrix => {
  const m = new CSSMatrix();
  if (angleX) {
    const radX = (angleX * Math.PI) / 180;
    const tX = Math.tan(radX);
    m.m21 = tX;
    m.c = tX;
  }
  if (angleY) {
    const radY = (angleY * Math.PI) / 180;
    const tY = Math.tan(radY);
    m.m12 = tY;
    m.b = tY;
  }
  return m;
};

/**
 * Creates a new `CSSMatrix` for the shear of the `x-axis` rotation matrix and
 * returns it. This method is equivalent to the CSS `skewX()` function.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/skewX
 *
 * @param angle the angle in degrees.
 * @return the resulted matrix.
 */
const SkewX = (angle: number): CSSMatrix => {
  return Skew(angle, 0);
};

/**
 * Creates a new `CSSMatrix` for the shear of the `y-axis` rotation matrix and
 * returns it. This method is equivalent to the CSS `skewY()` function.
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/skewY
 *
 * @param angle the angle in degrees.
 * @return the resulted matrix.
 */
const SkewY = (angle: number): CSSMatrix => {
  return Skew(0, angle);
};

/**
 * Creates a new `CSSMatrix` resulted from the multiplication of two matrixes
 * and returns it. Both matrixes are not changed.
 *
 * @param m1 the first matrix.
 * @param m2 the second matrix.
 * @return the resulted matrix.
 */
const Multiply = (
  m1: CSSMatrix | DOMMatrix | JSONMatrix,
  m2: CSSMatrix | DOMMatrix | JSONMatrix,
): CSSMatrix => {
  const m11 = m2.m11 * m1.m11 + m2.m12 * m1.m21 + m2.m13 * m1.m31 +
    m2.m14 * m1.m41;
  const m12 = m2.m11 * m1.m12 + m2.m12 * m1.m22 + m2.m13 * m1.m32 +
    m2.m14 * m1.m42;
  const m13 = m2.m11 * m1.m13 + m2.m12 * m1.m23 + m2.m13 * m1.m33 +
    m2.m14 * m1.m43;
  const m14 = m2.m11 * m1.m14 + m2.m12 * m1.m24 + m2.m13 * m1.m34 +
    m2.m14 * m1.m44;

  const m21 = m2.m21 * m1.m11 + m2.m22 * m1.m21 + m2.m23 * m1.m31 +
    m2.m24 * m1.m41;
  const m22 = m2.m21 * m1.m12 + m2.m22 * m1.m22 + m2.m23 * m1.m32 +
    m2.m24 * m1.m42;
  const m23 = m2.m21 * m1.m13 + m2.m22 * m1.m23 + m2.m23 * m1.m33 +
    m2.m24 * m1.m43;
  const m24 = m2.m21 * m1.m14 + m2.m22 * m1.m24 + m2.m23 * m1.m34 +
    m2.m24 * m1.m44;

  const m31 = m2.m31 * m1.m11 + m2.m32 * m1.m21 + m2.m33 * m1.m31 +
    m2.m34 * m1.m41;
  const m32 = m2.m31 * m1.m12 + m2.m32 * m1.m22 + m2.m33 * m1.m32 +
    m2.m34 * m1.m42;
  const m33 = m2.m31 * m1.m13 + m2.m32 * m1.m23 + m2.m33 * m1.m33 +
    m2.m34 * m1.m43;
  const m34 = m2.m31 * m1.m14 + m2.m32 * m1.m24 + m2.m33 * m1.m34 +
    m2.m34 * m1.m44;

  const m41 = m2.m41 * m1.m11 + m2.m42 * m1.m21 + m2.m43 * m1.m31 +
    m2.m44 * m1.m41;
  const m42 = m2.m41 * m1.m12 + m2.m42 * m1.m22 + m2.m43 * m1.m32 +
    m2.m44 * m1.m42;
  const m43 = m2.m41 * m1.m13 + m2.m42 * m1.m23 + m2.m43 * m1.m33 +
    m2.m44 * m1.m43;
  const m44 = m2.m41 * m1.m14 + m2.m42 * m1.m24 + m2.m43 * m1.m34 +
    m2.m44 * m1.m44;

  return fromArray([
    m11,
    m12,
    m13,
    m14,
    m21,
    m22,
    m23,
    m24,
    m31,
    m32,
    m33,
    m34,
    m41,
    m42,
    m43,
    m44,
  ]);
};

/**
 * Creates and returns a new `DOMMatrix` compatible instance
 * with equivalent instance.
 *
 * @class CSSMatrix
 *
 * @author thednp <https://github.com/thednp/DOMMatrix/>
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix
 */
export default class CSSMatrix {
  declare m11: number;
  declare m12: number;
  declare m13: number;
  declare m14: number;
  declare m21: number;
  declare m22: number;
  declare m23: number;
  declare m24: number;
  declare m31: number;
  declare m32: number;
  declare m33: number;
  declare m34: number;
  declare m41: number;
  declare m42: number;
  declare m43: number;
  declare m44: number;
  declare a: number;
  declare b: number;
  declare c: number;
  declare d: number;
  declare e: number;
  declare f: number;
  static Translate = Translate;
  static Rotate = Rotate;
  static RotateAxisAngle = RotateAxisAngle;
  static Scale = Scale;
  static SkewX = SkewX;
  static SkewY = SkewY;
  static Skew = Skew;
  static Multiply = Multiply;
  static fromArray = fromArray;
  static fromMatrix = fromMatrix;
  static fromString = fromString;
  static toArray = toArray;
  static isCompatibleArray = isCompatibleArray;
  static isCompatibleObject = isCompatibleObject;

  /**
   * @constructor
   * @param init accepts all parameter configurations:
   * * valid CSS transform string,
   * * CSSMatrix/DOMMatrix instance,
   * * a 6/16 elements *Array*.
   */
  constructor(init?: CSSMatrixInput) {
    // array 6
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    // array 16
    this.m11 = 1;
    this.m12 = 0;
    this.m13 = 0;
    this.m14 = 0;
    this.m21 = 0;
    this.m22 = 1;
    this.m23 = 0;
    this.m24 = 0;
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m41 = 0;
    this.m42 = 0;
    this.m43 = 0;
    this.m44 = 1;

    if (init) {
      return this.setMatrixValue(init);
    }
    return this;
  }

  /**
   * A `Boolean` whose value is `true` if the matrix is the identity matrix. The identity
   * matrix is one in which every value is 0 except those on the main diagonal from top-left
   * to bottom-right corner (in other words, where the offsets in each direction are equal).
   *
   * @return the current property value
   */
  get isIdentity(): boolean {
    return (
      this.m11 === 1 &&
      this.m12 === 0 &&
      this.m13 === 0 &&
      this.m14 === 0 &&
      this.m21 === 0 &&
      this.m22 === 1 &&
      this.m23 === 0 &&
      this.m24 === 0 &&
      this.m31 === 0 &&
      this.m32 === 0 &&
      this.m33 === 1 &&
      this.m34 === 0 &&
      this.m41 === 0 &&
      this.m42 === 0 &&
      this.m43 === 0 &&
      this.m44 === 1
    );
  }

  /**
   * A `Boolean` flag whose value is `true` if the matrix was initialized as a 2D matrix
   * and `false` if the matrix is 3D.
   *
   * @return the current property value
   */
  get is2D(): boolean {
    return this.m31 === 0 && this.m32 === 0 && this.m33 === 1 &&
      this.m34 === 0 && this.m43 === 0 && this.m44 === 1;
  }

  /**
   * The `setMatrixValue` method replaces the existing matrix with one computed
   * in the browser. EG: `matrix(1,0.25,-0.25,1,0,0)`
   *
   * The method accepts any *Array* values, the result of
   * `DOMMatrix` instance method `toFloat64Array()` / `toFloat32Array()` calls
   * or `CSSMatrix` instance method `toArray()`.
   *
   * This method expects valid *matrix()* / *matrix3d()* string values, as well
   * as other transform functions like *translateX(10px)*.
   *
   * @param source
   * @return the matrix instance
   */
  setMatrixValue(source?: CSSMatrixInput): CSSMatrix {
    // CSS transform string source - TransformList first
    if (typeof source === "string" && source.length && source !== "none") {
      return fromString(source);
    }

    // [Array | Float[32/64]Array] come next
    if (
      Array.isArray(source) || source instanceof Float64Array ||
      source instanceof Float32Array
    ) {
      return fromArray(source);
    }

    // new CSSMatrix(CSSMatrix | DOMMatrix | JSONMatrix) last
    if (typeof source === "object") {
      return fromMatrix(source);
    }

    return this;
  }

  /**
   * Returns a *Float32Array* containing elements which comprise the matrix.
   * The method can return either the 16 elements or the 6 elements
   * depending on the value of the `is2D` parameter.
   *
   * @param is2D *Array* representation of the matrix
   * @return an *Array* representation of the matrix
   */
  toFloat32Array(is2D?: boolean): Float32Array {
    return Float32Array.from(toArray(this, is2D));
  }

  /**
   * Returns a *Float64Array* containing elements which comprise the matrix.
   * The method can return either the 16 elements or the 6 elements
   * depending on the value of the `is2D` parameter.
   *
   * @param is2D *Array* representation of the matrix
   * @return an *Array* representation of the matrix
   */
  toFloat64Array(is2D?: boolean): Float64Array {
    return Float64Array.from(toArray(this, is2D));
  }

  /**
   * Creates and returns a string representation of the matrix in `CSS` matrix syntax,
   * using the appropriate `CSS` matrix notation.
   *
   * matrix3d *matrix3d(m11, m12, m13, m14, m21, ...)*
   * matrix *matrix(a, b, c, d, e, f)*
   *
   * @return a string representation of the matrix
   */
  toString(): string {
    const { is2D } = this;
    const values = this.toFloat64Array(is2D).join(", ");
    const type = is2D ? "matrix" : "matrix3d";
    return `${type}(${values})`;
  }

  /**
   * Returns a JSON representation of the `CSSMatrix` instance, a standard *Object*
   * that includes `{a,b,c,d,e,f}` and `{m11,m12,m13,..m44}` properties as well
   * as the `is2D` & `isIdentity` properties.
   *
   * The result can also be used as a second parameter for the `fromMatrix` static method
   * to load values into another matrix instance.
   *
   * @return an *Object* with all matrix values.
   */
  toJSON(): JSONMatrix {
    const { is2D, isIdentity } = this;
    return { ...this, is2D, isIdentity };
  }

  /**
   * The Multiply method returns a new CSSMatrix which is the result of this
   * matrix multiplied by the passed matrix, with the passed matrix to the right.
   * This matrix is not modified.
   *
   * @param m2 CSSMatrix
   * @return The resulted matrix.
   */
  multiply(m2: CSSMatrix | DOMMatrix | JSONMatrix): CSSMatrix {
    return Multiply(this, m2);
  }

  /**
   * The translate method returns a new matrix which is this matrix post
   * multiplied by a translation matrix containing the passed values. If the z
   * component is undefined, a 0 value is used in its place. This matrix is not
   * modified.
   *
   * @param x X component of the translation value.
   * @param y Y component of the translation value.
   * @param z Z component of the translation value.
   * @return The resulted matrix
   */
  translate(x: number, y?: number, z?: number): CSSMatrix {
    const X = x;
    let Y = y;
    let Z = z;
    if (typeof Y === "undefined") Y = 0;
    if (typeof Z === "undefined") Z = 0;
    return Multiply(this, Translate(X, Y, Z));
  }

  /**
   * The scale method returns a new matrix which is this matrix post multiplied by
   * a scale matrix containing the passed values. If the z component is undefined,
   * a 1 value is used in its place. If the y component is undefined, the x
   * component value is used in its place. This matrix is not modified.
   *
   * @param x The X component of the scale value.
   * @param y The Y component of the scale value.
   * @param z The Z component of the scale value.
   * @return The resulted matrix
   */
  scale(x: number, y?: number, z?: number): CSSMatrix {
    const X = x;
    let Y = y;
    let Z = z;
    if (typeof Y === "undefined") Y = x;
    if (typeof Z === "undefined") Z = 1; // Z must be 1 if undefined

    return Multiply(this, Scale(X, Y, Z));
  }

  /**
   * The rotate method returns a new matrix which is this matrix post multiplied
   * by each of 3 rotation matrices about the major axes, first X, then Y, then Z.
   * If the y and z components are undefined, the x value is used to rotate the
   * object about the z axis, as though the vector (0,0,x) were passed. All
   * rotation values are in degrees. This matrix is not modified.
   *
   * @param rx The X component of the rotation, or Z if Y and Z are null.
   * @param ry The (optional) Y component of the rotation value.
   * @param rz The (optional) Z component of the rotation value.
   * @return The resulted matrix
   */
  rotate(rx: number, ry?: number, rz?: number): CSSMatrix {
    let RX = rx;
    let RY = ry || 0;
    let RZ = rz || 0;

    if (
      typeof rx === "number" && typeof ry === "undefined" &&
      typeof rz === "undefined"
    ) {
      RZ = RX;
      RX = 0;
      RY = 0;
    }

    return Multiply(this, Rotate(RX, RY, RZ));
  }

  /**
   * The rotateAxisAngle method returns a new matrix which is this matrix post
   * multiplied by a rotation matrix with the given axis and `angle`. The right-hand
   * rule is used to determine the direction of rotation. All rotation values are
   * in degrees. This matrix is not modified.
   *
   * @param x The X component of the axis vector.
   * @param y The Y component of the axis vector.
   * @param z The Z component of the axis vector.
   * @param angle The angle of rotation about the axis vector, in degrees.
   * @return The resulted matrix
   */
  rotateAxisAngle(x: number, y: number, z: number, angle: number): CSSMatrix {
    if ([x, y, z, angle].some((n) => Number.isNaN(+n))) {
      throw new TypeError("CSSMatrix: expecting 4 values");
    }
    return Multiply(this, RotateAxisAngle(x, y, z, angle));
  }

  /**
   * Specifies a skew transformation along the `x-axis` by the given angle.
   * This matrix is not modified.
   *
   * @param angle The angle amount in degrees to skew.
   * @return The resulted matrix
   */
  skewX(angle: number): CSSMatrix {
    return Multiply(this, SkewX(angle));
  }

  /**
   * Specifies a skew transformation along the `y-axis` by the given angle.
   * This matrix is not modified.
   *
   * @param angle The angle amount in degrees to skew.
   * @return The resulted matrix
   */
  skewY(angle: number): CSSMatrix {
    return Multiply(this, SkewY(angle));
  }

  /**
   * Specifies a skew transformation along both the `x-axis` and `y-axis`.
   * This matrix is not modified.
   *
   * @param angleX The X-angle amount in degrees to skew.
   * @param angleY The angle amount in degrees to skew.
   * @return The resulted matrix
   */
  skew(angleX: number, angleY: number): CSSMatrix {
    return Multiply(this, Skew(angleX, angleY));
  }

  /**
   * Transforms a specified vector using the matrix, returning a new
   * {x,y,z,w} Tuple *Object* comprising the transformed vector.
   * Neither the matrix nor the original vector are altered.
   *
   * The method is equivalent with `transformPoint()` method
   * of the `DOMMatrix` constructor.
   *
   * @param t Tuple with `{x,y,z,w}` components
   * @return the resulting Tuple
   */
  transformPoint(t: PointTuple | DOMPoint): PointTuple | DOMPoint {
    const x = this.m11 * t.x + this.m21 * t.y + this.m31 * t.z + this.m41 * t.w;
    const y = this.m12 * t.x + this.m22 * t.y + this.m32 * t.z + this.m42 * t.w;
    const z = this.m13 * t.x + this.m23 * t.y + this.m33 * t.z + this.m43 * t.w;
    const w = this.m14 * t.x + this.m24 * t.y + this.m34 * t.z + this.m44 * t.w;

    return t instanceof DOMPoint ? new DOMPoint(x, y, z, w) : {
      x,
      y,
      z,
      w,
    };
  }
}
