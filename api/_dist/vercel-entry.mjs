import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/bn.js@4.12.3/node_modules/bn.js/lib/bn.js
var require_bn = __commonJS({
  "../../node_modules/.pnpm/bn.js@4.12.3/node_modules/bn.js/lib/bn.js"(exports, module) {
    (function(module2, exports2) {
      "use strict";
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
      function BN(number, base, endian) {
        if (BN.isBN(number)) {
          return number;
        }
        this.negative = 0;
        this.words = null;
        this.length = 0;
        this.red = null;
        if (number !== null) {
          if (base === "le" || base === "be") {
            endian = base;
            base = 10;
          }
          this._init(number || 0, base || 10, endian || "be");
        }
      }
      if (typeof module2 === "object") {
        module2.exports = BN;
      } else {
        exports2.BN = BN;
      }
      BN.BN = BN;
      BN.wordSize = 26;
      var Buffer2;
      try {
        if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") {
          Buffer2 = window.Buffer;
        } else {
          Buffer2 = __require("buffer").Buffer;
        }
      } catch (e) {
      }
      BN.isBN = function isBN(num) {
        if (num instanceof BN) {
          return true;
        }
        return num !== null && typeof num === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
      };
      BN.max = function max(left, right) {
        if (left.cmp(right) > 0) return left;
        return right;
      };
      BN.min = function min(left, right) {
        if (left.cmp(right) < 0) return left;
        return right;
      };
      BN.prototype._init = function init(number, base, endian) {
        if (typeof number === "number") {
          return this._initNumber(number, base, endian);
        }
        if (typeof number === "object") {
          return this._initArray(number, base, endian);
        }
        if (base === "hex") {
          base = 16;
        }
        assert(base === (base | 0) && base >= 2 && base <= 36);
        number = number.toString().replace(/\s+/g, "");
        var start = 0;
        if (number[0] === "-") {
          start++;
          this.negative = 1;
        }
        if (start < number.length) {
          if (base === 16) {
            this._parseHex(number, start, endian);
          } else {
            this._parseBase(number, base, start);
            if (endian === "le") {
              this._initArray(this.toArray(), base, endian);
            }
          }
        }
      };
      BN.prototype._initNumber = function _initNumber(number, base, endian) {
        if (number < 0) {
          this.negative = 1;
          number = -number;
        }
        if (number < 67108864) {
          this.words = [number & 67108863];
          this.length = 1;
        } else if (number < 4503599627370496) {
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863
          ];
          this.length = 2;
        } else {
          assert(number < 9007199254740992);
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863,
            1
          ];
          this.length = 3;
        }
        if (endian !== "le") return;
        this._initArray(this.toArray(), base, endian);
      };
      BN.prototype._initArray = function _initArray(number, base, endian) {
        assert(typeof number.length === "number");
        if (number.length <= 0) {
          this.words = [0];
          this.length = 1;
          return this;
        }
        this.length = Math.ceil(number.length / 3);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var j, w;
        var off = 0;
        if (endian === "be") {
          for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
            w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        } else if (endian === "le") {
          for (i = 0, j = 0; i < number.length; i += 3) {
            w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        }
        return this.strip();
      };
      function parseHex4Bits(string, index) {
        var c = string.charCodeAt(index);
        if (c >= 65 && c <= 70) {
          return c - 55;
        } else if (c >= 97 && c <= 102) {
          return c - 87;
        } else {
          return c - 48 & 15;
        }
      }
      function parseHexByte(string, lowerBound, index) {
        var r = parseHex4Bits(string, index);
        if (index - 1 >= lowerBound) {
          r |= parseHex4Bits(string, index - 1) << 4;
        }
        return r;
      }
      BN.prototype._parseHex = function _parseHex(number, start, endian) {
        this.length = Math.ceil((number.length - start) / 6);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var off = 0;
        var j = 0;
        var w;
        if (endian === "be") {
          for (i = number.length - 1; i >= start; i -= 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        } else {
          var parseLength = number.length - start;
          for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        }
        this.strip();
      };
      function parseBase(str, start, end, mul) {
        var r = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul;
          if (c >= 49) {
            r += c - 49 + 10;
          } else if (c >= 17) {
            r += c - 17 + 10;
          } else {
            r += c;
          }
        }
        return r;
      }
      BN.prototype._parseBase = function _parseBase(number, base, start) {
        this.words = [0];
        this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) {
          limbLen++;
        }
        limbLen--;
        limbPow = limbPow / base | 0;
        var total = number.length - start;
        var mod = total % limbLen;
        var end = Math.min(total, total - mod) + start;
        var word = 0;
        for (var i = start; i < end; i += limbLen) {
          word = parseBase(number, i, i + limbLen, base);
          this.imuln(limbPow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        if (mod !== 0) {
          var pow = 1;
          word = parseBase(number, i, number.length, base);
          for (i = 0; i < mod; i++) {
            pow *= base;
          }
          this.imuln(pow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        this.strip();
      };
      BN.prototype.copy = function copy(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          dest.words[i] = this.words[i];
        }
        dest.length = this.length;
        dest.negative = this.negative;
        dest.red = this.red;
      };
      BN.prototype.clone = function clone() {
        var r = new BN(null);
        this.copy(r);
        return r;
      };
      BN.prototype._expand = function _expand(size) {
        while (this.length < size) {
          this.words[this.length++] = 0;
        }
        return this;
      };
      BN.prototype.strip = function strip() {
        while (this.length > 1 && this.words[this.length - 1] === 0) {
          this.length--;
        }
        return this._normSign();
      };
      BN.prototype._normSign = function _normSign() {
        if (this.length === 1 && this.words[0] === 0) {
          this.negative = 0;
        }
        return this;
      };
      BN.prototype.inspect = function inspect() {
        return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
      };
      var zeros = [
        "",
        "0",
        "00",
        "000",
        "0000",
        "00000",
        "000000",
        "0000000",
        "00000000",
        "000000000",
        "0000000000",
        "00000000000",
        "000000000000",
        "0000000000000",
        "00000000000000",
        "000000000000000",
        "0000000000000000",
        "00000000000000000",
        "000000000000000000",
        "0000000000000000000",
        "00000000000000000000",
        "000000000000000000000",
        "0000000000000000000000",
        "00000000000000000000000",
        "000000000000000000000000",
        "0000000000000000000000000"
      ];
      var groupSizes = [
        0,
        0,
        25,
        16,
        12,
        11,
        10,
        9,
        8,
        8,
        7,
        7,
        7,
        7,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5
      ];
      var groupBases = [
        0,
        0,
        33554432,
        43046721,
        16777216,
        48828125,
        60466176,
        40353607,
        16777216,
        43046721,
        1e7,
        19487171,
        35831808,
        62748517,
        7529536,
        11390625,
        16777216,
        24137569,
        34012224,
        47045881,
        64e6,
        4084101,
        5153632,
        6436343,
        7962624,
        9765625,
        11881376,
        14348907,
        17210368,
        20511149,
        243e5,
        28629151,
        33554432,
        39135393,
        45435424,
        52521875,
        60466176
      ];
      BN.prototype.toString = function toString(base, padding) {
        base = base || 10;
        padding = padding | 0 || 1;
        var out;
        if (base === 16 || base === "hex") {
          out = "";
          var off = 0;
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = this.words[i];
            var word = ((w << off | carry) & 16777215).toString(16);
            carry = w >>> 24 - off & 16777215;
            off += 2;
            if (off >= 26) {
              off -= 26;
              i--;
            }
            if (carry !== 0 || i !== this.length - 1) {
              out = zeros[6 - word.length] + word + out;
            } else {
              out = word + out;
            }
          }
          if (carry !== 0) {
            out = carry.toString(16) + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        if (base === (base | 0) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base];
          var groupBase = groupBases[base];
          out = "";
          var c = this.clone();
          c.negative = 0;
          while (!c.isZero()) {
            var r = c.modn(groupBase).toString(base);
            c = c.idivn(groupBase);
            if (!c.isZero()) {
              out = zeros[groupSize - r.length] + r + out;
            } else {
              out = r + out;
            }
          }
          if (this.isZero()) {
            out = "0" + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        assert(false, "Base should be between 2 and 36");
      };
      BN.prototype.toNumber = function toNumber() {
        var ret = this.words[0];
        if (this.length === 2) {
          ret += this.words[1] * 67108864;
        } else if (this.length === 3 && this.words[2] === 1) {
          ret += 4503599627370496 + this.words[1] * 67108864;
        } else if (this.length > 2) {
          assert(false, "Number can only safely store up to 53 bits");
        }
        return this.negative !== 0 ? -ret : ret;
      };
      BN.prototype.toJSON = function toJSON() {
        return this.toString(16);
      };
      BN.prototype.toBuffer = function toBuffer(endian, length) {
        assert(typeof Buffer2 !== "undefined");
        return this.toArrayLike(Buffer2, endian, length);
      };
      BN.prototype.toArray = function toArray(endian, length) {
        return this.toArrayLike(Array, endian, length);
      };
      BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
        var byteLength = this.byteLength();
        var reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, "byte array longer than desired length");
        assert(reqLength > 0, "Requested array length <= 0");
        this.strip();
        var littleEndian = endian === "le";
        var res = new ArrayType(reqLength);
        var b, i;
        var q = this.clone();
        if (!littleEndian) {
          for (i = 0; i < reqLength - byteLength; i++) {
            res[i] = 0;
          }
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[reqLength - i - 1] = b;
          }
        } else {
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[i] = b;
          }
          for (; i < reqLength; i++) {
            res[i] = 0;
          }
        }
        return res;
      };
      if (Math.clz32) {
        BN.prototype._countBits = function _countBits(w) {
          return 32 - Math.clz32(w);
        };
      } else {
        BN.prototype._countBits = function _countBits(w) {
          var t = w;
          var r = 0;
          if (t >= 4096) {
            r += 13;
            t >>>= 13;
          }
          if (t >= 64) {
            r += 7;
            t >>>= 7;
          }
          if (t >= 8) {
            r += 4;
            t >>>= 4;
          }
          if (t >= 2) {
            r += 2;
            t >>>= 2;
          }
          return r + t;
        };
      }
      BN.prototype._zeroBits = function _zeroBits(w) {
        if (w === 0) return 26;
        var t = w;
        var r = 0;
        if ((t & 8191) === 0) {
          r += 13;
          t >>>= 13;
        }
        if ((t & 127) === 0) {
          r += 7;
          t >>>= 7;
        }
        if ((t & 15) === 0) {
          r += 4;
          t >>>= 4;
        }
        if ((t & 3) === 0) {
          r += 2;
          t >>>= 2;
        }
        if ((t & 1) === 0) {
          r++;
        }
        return r;
      };
      BN.prototype.bitLength = function bitLength() {
        var w = this.words[this.length - 1];
        var hi = this._countBits(w);
        return (this.length - 1) * 26 + hi;
      };
      function toBitArray(num) {
        var w = new Array(num.bitLength());
        for (var bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
        }
        return w;
      }
      BN.prototype.zeroBits = function zeroBits() {
        if (this.isZero()) return 0;
        var r = 0;
        for (var i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          r += b;
          if (b !== 26) break;
        }
        return r;
      };
      BN.prototype.byteLength = function byteLength() {
        return Math.ceil(this.bitLength() / 8);
      };
      BN.prototype.toTwos = function toTwos(width) {
        if (this.negative !== 0) {
          return this.abs().inotn(width).iaddn(1);
        }
        return this.clone();
      };
      BN.prototype.fromTwos = function fromTwos(width) {
        if (this.testn(width - 1)) {
          return this.notn(width).iaddn(1).ineg();
        }
        return this.clone();
      };
      BN.prototype.isNeg = function isNeg() {
        return this.negative !== 0;
      };
      BN.prototype.neg = function neg() {
        return this.clone().ineg();
      };
      BN.prototype.ineg = function ineg() {
        if (!this.isZero()) {
          this.negative ^= 1;
        }
        return this;
      };
      BN.prototype.iuor = function iuor(num) {
        while (this.length < num.length) {
          this.words[this.length++] = 0;
        }
        for (var i = 0; i < num.length; i++) {
          this.words[i] = this.words[i] | num.words[i];
        }
        return this.strip();
      };
      BN.prototype.ior = function ior(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuor(num);
      };
      BN.prototype.or = function or(num) {
        if (this.length > num.length) return this.clone().ior(num);
        return num.clone().ior(this);
      };
      BN.prototype.uor = function uor(num) {
        if (this.length > num.length) return this.clone().iuor(num);
        return num.clone().iuor(this);
      };
      BN.prototype.iuand = function iuand(num) {
        var b;
        if (this.length > num.length) {
          b = num;
        } else {
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = this.words[i] & num.words[i];
        }
        this.length = b.length;
        return this.strip();
      };
      BN.prototype.iand = function iand(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuand(num);
      };
      BN.prototype.and = function and(num) {
        if (this.length > num.length) return this.clone().iand(num);
        return num.clone().iand(this);
      };
      BN.prototype.uand = function uand(num) {
        if (this.length > num.length) return this.clone().iuand(num);
        return num.clone().iuand(this);
      };
      BN.prototype.iuxor = function iuxor(num) {
        var a;
        var b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = a.words[i] ^ b.words[i];
        }
        if (this !== a) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = a.length;
        return this.strip();
      };
      BN.prototype.ixor = function ixor(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuxor(num);
      };
      BN.prototype.xor = function xor(num) {
        if (this.length > num.length) return this.clone().ixor(num);
        return num.clone().ixor(this);
      };
      BN.prototype.uxor = function uxor(num) {
        if (this.length > num.length) return this.clone().iuxor(num);
        return num.clone().iuxor(this);
      };
      BN.prototype.inotn = function inotn(width) {
        assert(typeof width === "number" && width >= 0);
        var bytesNeeded = Math.ceil(width / 26) | 0;
        var bitsLeft = width % 26;
        this._expand(bytesNeeded);
        if (bitsLeft > 0) {
          bytesNeeded--;
        }
        for (var i = 0; i < bytesNeeded; i++) {
          this.words[i] = ~this.words[i] & 67108863;
        }
        if (bitsLeft > 0) {
          this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
        }
        return this.strip();
      };
      BN.prototype.notn = function notn(width) {
        return this.clone().inotn(width);
      };
      BN.prototype.setn = function setn(bit, val) {
        assert(typeof bit === "number" && bit >= 0);
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        this._expand(off + 1);
        if (val) {
          this.words[off] = this.words[off] | 1 << wbit;
        } else {
          this.words[off] = this.words[off] & ~(1 << wbit);
        }
        return this.strip();
      };
      BN.prototype.iadd = function iadd(num) {
        var r;
        if (this.negative !== 0 && num.negative === 0) {
          this.negative = 0;
          r = this.isub(num);
          this.negative ^= 1;
          return this._normSign();
        } else if (this.negative === 0 && num.negative !== 0) {
          num.negative = 0;
          r = this.isub(num);
          num.negative = 1;
          return r._normSign();
        }
        var a, b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        this.length = a.length;
        if (carry !== 0) {
          this.words[this.length] = carry;
          this.length++;
        } else if (a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        return this;
      };
      BN.prototype.add = function add(num) {
        var res;
        if (num.negative !== 0 && this.negative === 0) {
          num.negative = 0;
          res = this.sub(num);
          num.negative ^= 1;
          return res;
        } else if (num.negative === 0 && this.negative !== 0) {
          this.negative = 0;
          res = num.sub(this);
          this.negative = 1;
          return res;
        }
        if (this.length > num.length) return this.clone().iadd(num);
        return num.clone().iadd(this);
      };
      BN.prototype.isub = function isub(num) {
        if (num.negative !== 0) {
          num.negative = 0;
          var r = this.iadd(num);
          num.negative = 1;
          return r._normSign();
        } else if (this.negative !== 0) {
          this.negative = 0;
          this.iadd(num);
          this.negative = 1;
          return this._normSign();
        }
        var cmp = this.cmp(num);
        if (cmp === 0) {
          this.negative = 0;
          this.length = 1;
          this.words[0] = 0;
          return this;
        }
        var a, b;
        if (cmp > 0) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        if (carry === 0 && i < a.length && a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = Math.max(this.length, i);
        if (a !== this) {
          this.negative = 1;
        }
        return this.strip();
      };
      BN.prototype.sub = function sub(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        var len = self.length + num.length | 0;
        out.length = len;
        len = len - 1 | 0;
        var a = self.words[0] | 0;
        var b = num.words[0] | 0;
        var r = a * b;
        var lo = r & 67108863;
        var carry = r / 67108864 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          var ncarry = carry >>> 26;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = self.words[i] | 0;
            b = num.words[j] | 0;
            r = a * b + rword;
            ncarry += r / 67108864 | 0;
            rword = r & 67108863;
          }
          out.words[k] = rword | 0;
          carry = ncarry | 0;
        }
        if (carry !== 0) {
          out.words[k] = carry | 0;
        } else {
          out.length--;
        }
        return out.strip();
      }
      var comb10MulTo = function comb10MulTo2(self, num, out) {
        var a = self.words;
        var b = num.words;
        var o = out.words;
        var c = 0;
        var lo;
        var mid;
        var hi;
        var a0 = a[0] | 0;
        var al0 = a0 & 8191;
        var ah0 = a0 >>> 13;
        var a1 = a[1] | 0;
        var al1 = a1 & 8191;
        var ah1 = a1 >>> 13;
        var a2 = a[2] | 0;
        var al2 = a2 & 8191;
        var ah2 = a2 >>> 13;
        var a3 = a[3] | 0;
        var al3 = a3 & 8191;
        var ah3 = a3 >>> 13;
        var a4 = a[4] | 0;
        var al4 = a4 & 8191;
        var ah4 = a4 >>> 13;
        var a5 = a[5] | 0;
        var al5 = a5 & 8191;
        var ah5 = a5 >>> 13;
        var a6 = a[6] | 0;
        var al6 = a6 & 8191;
        var ah6 = a6 >>> 13;
        var a7 = a[7] | 0;
        var al7 = a7 & 8191;
        var ah7 = a7 >>> 13;
        var a8 = a[8] | 0;
        var al8 = a8 & 8191;
        var ah8 = a8 >>> 13;
        var a9 = a[9] | 0;
        var al9 = a9 & 8191;
        var ah9 = a9 >>> 13;
        var b0 = b[0] | 0;
        var bl0 = b0 & 8191;
        var bh0 = b0 >>> 13;
        var b1 = b[1] | 0;
        var bl1 = b1 & 8191;
        var bh1 = b1 >>> 13;
        var b2 = b[2] | 0;
        var bl2 = b2 & 8191;
        var bh2 = b2 >>> 13;
        var b3 = b[3] | 0;
        var bl3 = b3 & 8191;
        var bh3 = b3 >>> 13;
        var b4 = b[4] | 0;
        var bl4 = b4 & 8191;
        var bh4 = b4 >>> 13;
        var b5 = b[5] | 0;
        var bl5 = b5 & 8191;
        var bh5 = b5 >>> 13;
        var b6 = b[6] | 0;
        var bl6 = b6 & 8191;
        var bh6 = b6 >>> 13;
        var b7 = b[7] | 0;
        var bl7 = b7 & 8191;
        var bh7 = b7 >>> 13;
        var b8 = b[8] | 0;
        var bl8 = b8 & 8191;
        var bh8 = b8 >>> 13;
        var b9 = b[9] | 0;
        var bl9 = b9 & 8191;
        var bh9 = b9 >>> 13;
        out.negative = self.negative ^ num.negative;
        out.length = 19;
        lo = Math.imul(al0, bl0);
        mid = Math.imul(al0, bh0);
        mid = mid + Math.imul(ah0, bl0) | 0;
        hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
        w0 &= 67108863;
        lo = Math.imul(al1, bl0);
        mid = Math.imul(al1, bh0);
        mid = mid + Math.imul(ah1, bl0) | 0;
        hi = Math.imul(ah1, bh0);
        lo = lo + Math.imul(al0, bl1) | 0;
        mid = mid + Math.imul(al0, bh1) | 0;
        mid = mid + Math.imul(ah0, bl1) | 0;
        hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
        w1 &= 67108863;
        lo = Math.imul(al2, bl0);
        mid = Math.imul(al2, bh0);
        mid = mid + Math.imul(ah2, bl0) | 0;
        hi = Math.imul(ah2, bh0);
        lo = lo + Math.imul(al1, bl1) | 0;
        mid = mid + Math.imul(al1, bh1) | 0;
        mid = mid + Math.imul(ah1, bl1) | 0;
        hi = hi + Math.imul(ah1, bh1) | 0;
        lo = lo + Math.imul(al0, bl2) | 0;
        mid = mid + Math.imul(al0, bh2) | 0;
        mid = mid + Math.imul(ah0, bl2) | 0;
        hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
        w2 &= 67108863;
        lo = Math.imul(al3, bl0);
        mid = Math.imul(al3, bh0);
        mid = mid + Math.imul(ah3, bl0) | 0;
        hi = Math.imul(ah3, bh0);
        lo = lo + Math.imul(al2, bl1) | 0;
        mid = mid + Math.imul(al2, bh1) | 0;
        mid = mid + Math.imul(ah2, bl1) | 0;
        hi = hi + Math.imul(ah2, bh1) | 0;
        lo = lo + Math.imul(al1, bl2) | 0;
        mid = mid + Math.imul(al1, bh2) | 0;
        mid = mid + Math.imul(ah1, bl2) | 0;
        hi = hi + Math.imul(ah1, bh2) | 0;
        lo = lo + Math.imul(al0, bl3) | 0;
        mid = mid + Math.imul(al0, bh3) | 0;
        mid = mid + Math.imul(ah0, bl3) | 0;
        hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
        w3 &= 67108863;
        lo = Math.imul(al4, bl0);
        mid = Math.imul(al4, bh0);
        mid = mid + Math.imul(ah4, bl0) | 0;
        hi = Math.imul(ah4, bh0);
        lo = lo + Math.imul(al3, bl1) | 0;
        mid = mid + Math.imul(al3, bh1) | 0;
        mid = mid + Math.imul(ah3, bl1) | 0;
        hi = hi + Math.imul(ah3, bh1) | 0;
        lo = lo + Math.imul(al2, bl2) | 0;
        mid = mid + Math.imul(al2, bh2) | 0;
        mid = mid + Math.imul(ah2, bl2) | 0;
        hi = hi + Math.imul(ah2, bh2) | 0;
        lo = lo + Math.imul(al1, bl3) | 0;
        mid = mid + Math.imul(al1, bh3) | 0;
        mid = mid + Math.imul(ah1, bl3) | 0;
        hi = hi + Math.imul(ah1, bh3) | 0;
        lo = lo + Math.imul(al0, bl4) | 0;
        mid = mid + Math.imul(al0, bh4) | 0;
        mid = mid + Math.imul(ah0, bl4) | 0;
        hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
        w4 &= 67108863;
        lo = Math.imul(al5, bl0);
        mid = Math.imul(al5, bh0);
        mid = mid + Math.imul(ah5, bl0) | 0;
        hi = Math.imul(ah5, bh0);
        lo = lo + Math.imul(al4, bl1) | 0;
        mid = mid + Math.imul(al4, bh1) | 0;
        mid = mid + Math.imul(ah4, bl1) | 0;
        hi = hi + Math.imul(ah4, bh1) | 0;
        lo = lo + Math.imul(al3, bl2) | 0;
        mid = mid + Math.imul(al3, bh2) | 0;
        mid = mid + Math.imul(ah3, bl2) | 0;
        hi = hi + Math.imul(ah3, bh2) | 0;
        lo = lo + Math.imul(al2, bl3) | 0;
        mid = mid + Math.imul(al2, bh3) | 0;
        mid = mid + Math.imul(ah2, bl3) | 0;
        hi = hi + Math.imul(ah2, bh3) | 0;
        lo = lo + Math.imul(al1, bl4) | 0;
        mid = mid + Math.imul(al1, bh4) | 0;
        mid = mid + Math.imul(ah1, bl4) | 0;
        hi = hi + Math.imul(ah1, bh4) | 0;
        lo = lo + Math.imul(al0, bl5) | 0;
        mid = mid + Math.imul(al0, bh5) | 0;
        mid = mid + Math.imul(ah0, bl5) | 0;
        hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
        w5 &= 67108863;
        lo = Math.imul(al6, bl0);
        mid = Math.imul(al6, bh0);
        mid = mid + Math.imul(ah6, bl0) | 0;
        hi = Math.imul(ah6, bh0);
        lo = lo + Math.imul(al5, bl1) | 0;
        mid = mid + Math.imul(al5, bh1) | 0;
        mid = mid + Math.imul(ah5, bl1) | 0;
        hi = hi + Math.imul(ah5, bh1) | 0;
        lo = lo + Math.imul(al4, bl2) | 0;
        mid = mid + Math.imul(al4, bh2) | 0;
        mid = mid + Math.imul(ah4, bl2) | 0;
        hi = hi + Math.imul(ah4, bh2) | 0;
        lo = lo + Math.imul(al3, bl3) | 0;
        mid = mid + Math.imul(al3, bh3) | 0;
        mid = mid + Math.imul(ah3, bl3) | 0;
        hi = hi + Math.imul(ah3, bh3) | 0;
        lo = lo + Math.imul(al2, bl4) | 0;
        mid = mid + Math.imul(al2, bh4) | 0;
        mid = mid + Math.imul(ah2, bl4) | 0;
        hi = hi + Math.imul(ah2, bh4) | 0;
        lo = lo + Math.imul(al1, bl5) | 0;
        mid = mid + Math.imul(al1, bh5) | 0;
        mid = mid + Math.imul(ah1, bl5) | 0;
        hi = hi + Math.imul(ah1, bh5) | 0;
        lo = lo + Math.imul(al0, bl6) | 0;
        mid = mid + Math.imul(al0, bh6) | 0;
        mid = mid + Math.imul(ah0, bl6) | 0;
        hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
        w6 &= 67108863;
        lo = Math.imul(al7, bl0);
        mid = Math.imul(al7, bh0);
        mid = mid + Math.imul(ah7, bl0) | 0;
        hi = Math.imul(ah7, bh0);
        lo = lo + Math.imul(al6, bl1) | 0;
        mid = mid + Math.imul(al6, bh1) | 0;
        mid = mid + Math.imul(ah6, bl1) | 0;
        hi = hi + Math.imul(ah6, bh1) | 0;
        lo = lo + Math.imul(al5, bl2) | 0;
        mid = mid + Math.imul(al5, bh2) | 0;
        mid = mid + Math.imul(ah5, bl2) | 0;
        hi = hi + Math.imul(ah5, bh2) | 0;
        lo = lo + Math.imul(al4, bl3) | 0;
        mid = mid + Math.imul(al4, bh3) | 0;
        mid = mid + Math.imul(ah4, bl3) | 0;
        hi = hi + Math.imul(ah4, bh3) | 0;
        lo = lo + Math.imul(al3, bl4) | 0;
        mid = mid + Math.imul(al3, bh4) | 0;
        mid = mid + Math.imul(ah3, bl4) | 0;
        hi = hi + Math.imul(ah3, bh4) | 0;
        lo = lo + Math.imul(al2, bl5) | 0;
        mid = mid + Math.imul(al2, bh5) | 0;
        mid = mid + Math.imul(ah2, bl5) | 0;
        hi = hi + Math.imul(ah2, bh5) | 0;
        lo = lo + Math.imul(al1, bl6) | 0;
        mid = mid + Math.imul(al1, bh6) | 0;
        mid = mid + Math.imul(ah1, bl6) | 0;
        hi = hi + Math.imul(ah1, bh6) | 0;
        lo = lo + Math.imul(al0, bl7) | 0;
        mid = mid + Math.imul(al0, bh7) | 0;
        mid = mid + Math.imul(ah0, bl7) | 0;
        hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
        w7 &= 67108863;
        lo = Math.imul(al8, bl0);
        mid = Math.imul(al8, bh0);
        mid = mid + Math.imul(ah8, bl0) | 0;
        hi = Math.imul(ah8, bh0);
        lo = lo + Math.imul(al7, bl1) | 0;
        mid = mid + Math.imul(al7, bh1) | 0;
        mid = mid + Math.imul(ah7, bl1) | 0;
        hi = hi + Math.imul(ah7, bh1) | 0;
        lo = lo + Math.imul(al6, bl2) | 0;
        mid = mid + Math.imul(al6, bh2) | 0;
        mid = mid + Math.imul(ah6, bl2) | 0;
        hi = hi + Math.imul(ah6, bh2) | 0;
        lo = lo + Math.imul(al5, bl3) | 0;
        mid = mid + Math.imul(al5, bh3) | 0;
        mid = mid + Math.imul(ah5, bl3) | 0;
        hi = hi + Math.imul(ah5, bh3) | 0;
        lo = lo + Math.imul(al4, bl4) | 0;
        mid = mid + Math.imul(al4, bh4) | 0;
        mid = mid + Math.imul(ah4, bl4) | 0;
        hi = hi + Math.imul(ah4, bh4) | 0;
        lo = lo + Math.imul(al3, bl5) | 0;
        mid = mid + Math.imul(al3, bh5) | 0;
        mid = mid + Math.imul(ah3, bl5) | 0;
        hi = hi + Math.imul(ah3, bh5) | 0;
        lo = lo + Math.imul(al2, bl6) | 0;
        mid = mid + Math.imul(al2, bh6) | 0;
        mid = mid + Math.imul(ah2, bl6) | 0;
        hi = hi + Math.imul(ah2, bh6) | 0;
        lo = lo + Math.imul(al1, bl7) | 0;
        mid = mid + Math.imul(al1, bh7) | 0;
        mid = mid + Math.imul(ah1, bl7) | 0;
        hi = hi + Math.imul(ah1, bh7) | 0;
        lo = lo + Math.imul(al0, bl8) | 0;
        mid = mid + Math.imul(al0, bh8) | 0;
        mid = mid + Math.imul(ah0, bl8) | 0;
        hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
        w8 &= 67108863;
        lo = Math.imul(al9, bl0);
        mid = Math.imul(al9, bh0);
        mid = mid + Math.imul(ah9, bl0) | 0;
        hi = Math.imul(ah9, bh0);
        lo = lo + Math.imul(al8, bl1) | 0;
        mid = mid + Math.imul(al8, bh1) | 0;
        mid = mid + Math.imul(ah8, bl1) | 0;
        hi = hi + Math.imul(ah8, bh1) | 0;
        lo = lo + Math.imul(al7, bl2) | 0;
        mid = mid + Math.imul(al7, bh2) | 0;
        mid = mid + Math.imul(ah7, bl2) | 0;
        hi = hi + Math.imul(ah7, bh2) | 0;
        lo = lo + Math.imul(al6, bl3) | 0;
        mid = mid + Math.imul(al6, bh3) | 0;
        mid = mid + Math.imul(ah6, bl3) | 0;
        hi = hi + Math.imul(ah6, bh3) | 0;
        lo = lo + Math.imul(al5, bl4) | 0;
        mid = mid + Math.imul(al5, bh4) | 0;
        mid = mid + Math.imul(ah5, bl4) | 0;
        hi = hi + Math.imul(ah5, bh4) | 0;
        lo = lo + Math.imul(al4, bl5) | 0;
        mid = mid + Math.imul(al4, bh5) | 0;
        mid = mid + Math.imul(ah4, bl5) | 0;
        hi = hi + Math.imul(ah4, bh5) | 0;
        lo = lo + Math.imul(al3, bl6) | 0;
        mid = mid + Math.imul(al3, bh6) | 0;
        mid = mid + Math.imul(ah3, bl6) | 0;
        hi = hi + Math.imul(ah3, bh6) | 0;
        lo = lo + Math.imul(al2, bl7) | 0;
        mid = mid + Math.imul(al2, bh7) | 0;
        mid = mid + Math.imul(ah2, bl7) | 0;
        hi = hi + Math.imul(ah2, bh7) | 0;
        lo = lo + Math.imul(al1, bl8) | 0;
        mid = mid + Math.imul(al1, bh8) | 0;
        mid = mid + Math.imul(ah1, bl8) | 0;
        hi = hi + Math.imul(ah1, bh8) | 0;
        lo = lo + Math.imul(al0, bl9) | 0;
        mid = mid + Math.imul(al0, bh9) | 0;
        mid = mid + Math.imul(ah0, bl9) | 0;
        hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
        w9 &= 67108863;
        lo = Math.imul(al9, bl1);
        mid = Math.imul(al9, bh1);
        mid = mid + Math.imul(ah9, bl1) | 0;
        hi = Math.imul(ah9, bh1);
        lo = lo + Math.imul(al8, bl2) | 0;
        mid = mid + Math.imul(al8, bh2) | 0;
        mid = mid + Math.imul(ah8, bl2) | 0;
        hi = hi + Math.imul(ah8, bh2) | 0;
        lo = lo + Math.imul(al7, bl3) | 0;
        mid = mid + Math.imul(al7, bh3) | 0;
        mid = mid + Math.imul(ah7, bl3) | 0;
        hi = hi + Math.imul(ah7, bh3) | 0;
        lo = lo + Math.imul(al6, bl4) | 0;
        mid = mid + Math.imul(al6, bh4) | 0;
        mid = mid + Math.imul(ah6, bl4) | 0;
        hi = hi + Math.imul(ah6, bh4) | 0;
        lo = lo + Math.imul(al5, bl5) | 0;
        mid = mid + Math.imul(al5, bh5) | 0;
        mid = mid + Math.imul(ah5, bl5) | 0;
        hi = hi + Math.imul(ah5, bh5) | 0;
        lo = lo + Math.imul(al4, bl6) | 0;
        mid = mid + Math.imul(al4, bh6) | 0;
        mid = mid + Math.imul(ah4, bl6) | 0;
        hi = hi + Math.imul(ah4, bh6) | 0;
        lo = lo + Math.imul(al3, bl7) | 0;
        mid = mid + Math.imul(al3, bh7) | 0;
        mid = mid + Math.imul(ah3, bl7) | 0;
        hi = hi + Math.imul(ah3, bh7) | 0;
        lo = lo + Math.imul(al2, bl8) | 0;
        mid = mid + Math.imul(al2, bh8) | 0;
        mid = mid + Math.imul(ah2, bl8) | 0;
        hi = hi + Math.imul(ah2, bh8) | 0;
        lo = lo + Math.imul(al1, bl9) | 0;
        mid = mid + Math.imul(al1, bh9) | 0;
        mid = mid + Math.imul(ah1, bl9) | 0;
        hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
        w10 &= 67108863;
        lo = Math.imul(al9, bl2);
        mid = Math.imul(al9, bh2);
        mid = mid + Math.imul(ah9, bl2) | 0;
        hi = Math.imul(ah9, bh2);
        lo = lo + Math.imul(al8, bl3) | 0;
        mid = mid + Math.imul(al8, bh3) | 0;
        mid = mid + Math.imul(ah8, bl3) | 0;
        hi = hi + Math.imul(ah8, bh3) | 0;
        lo = lo + Math.imul(al7, bl4) | 0;
        mid = mid + Math.imul(al7, bh4) | 0;
        mid = mid + Math.imul(ah7, bl4) | 0;
        hi = hi + Math.imul(ah7, bh4) | 0;
        lo = lo + Math.imul(al6, bl5) | 0;
        mid = mid + Math.imul(al6, bh5) | 0;
        mid = mid + Math.imul(ah6, bl5) | 0;
        hi = hi + Math.imul(ah6, bh5) | 0;
        lo = lo + Math.imul(al5, bl6) | 0;
        mid = mid + Math.imul(al5, bh6) | 0;
        mid = mid + Math.imul(ah5, bl6) | 0;
        hi = hi + Math.imul(ah5, bh6) | 0;
        lo = lo + Math.imul(al4, bl7) | 0;
        mid = mid + Math.imul(al4, bh7) | 0;
        mid = mid + Math.imul(ah4, bl7) | 0;
        hi = hi + Math.imul(ah4, bh7) | 0;
        lo = lo + Math.imul(al3, bl8) | 0;
        mid = mid + Math.imul(al3, bh8) | 0;
        mid = mid + Math.imul(ah3, bl8) | 0;
        hi = hi + Math.imul(ah3, bh8) | 0;
        lo = lo + Math.imul(al2, bl9) | 0;
        mid = mid + Math.imul(al2, bh9) | 0;
        mid = mid + Math.imul(ah2, bl9) | 0;
        hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
        w11 &= 67108863;
        lo = Math.imul(al9, bl3);
        mid = Math.imul(al9, bh3);
        mid = mid + Math.imul(ah9, bl3) | 0;
        hi = Math.imul(ah9, bh3);
        lo = lo + Math.imul(al8, bl4) | 0;
        mid = mid + Math.imul(al8, bh4) | 0;
        mid = mid + Math.imul(ah8, bl4) | 0;
        hi = hi + Math.imul(ah8, bh4) | 0;
        lo = lo + Math.imul(al7, bl5) | 0;
        mid = mid + Math.imul(al7, bh5) | 0;
        mid = mid + Math.imul(ah7, bl5) | 0;
        hi = hi + Math.imul(ah7, bh5) | 0;
        lo = lo + Math.imul(al6, bl6) | 0;
        mid = mid + Math.imul(al6, bh6) | 0;
        mid = mid + Math.imul(ah6, bl6) | 0;
        hi = hi + Math.imul(ah6, bh6) | 0;
        lo = lo + Math.imul(al5, bl7) | 0;
        mid = mid + Math.imul(al5, bh7) | 0;
        mid = mid + Math.imul(ah5, bl7) | 0;
        hi = hi + Math.imul(ah5, bh7) | 0;
        lo = lo + Math.imul(al4, bl8) | 0;
        mid = mid + Math.imul(al4, bh8) | 0;
        mid = mid + Math.imul(ah4, bl8) | 0;
        hi = hi + Math.imul(ah4, bh8) | 0;
        lo = lo + Math.imul(al3, bl9) | 0;
        mid = mid + Math.imul(al3, bh9) | 0;
        mid = mid + Math.imul(ah3, bl9) | 0;
        hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
        w12 &= 67108863;
        lo = Math.imul(al9, bl4);
        mid = Math.imul(al9, bh4);
        mid = mid + Math.imul(ah9, bl4) | 0;
        hi = Math.imul(ah9, bh4);
        lo = lo + Math.imul(al8, bl5) | 0;
        mid = mid + Math.imul(al8, bh5) | 0;
        mid = mid + Math.imul(ah8, bl5) | 0;
        hi = hi + Math.imul(ah8, bh5) | 0;
        lo = lo + Math.imul(al7, bl6) | 0;
        mid = mid + Math.imul(al7, bh6) | 0;
        mid = mid + Math.imul(ah7, bl6) | 0;
        hi = hi + Math.imul(ah7, bh6) | 0;
        lo = lo + Math.imul(al6, bl7) | 0;
        mid = mid + Math.imul(al6, bh7) | 0;
        mid = mid + Math.imul(ah6, bl7) | 0;
        hi = hi + Math.imul(ah6, bh7) | 0;
        lo = lo + Math.imul(al5, bl8) | 0;
        mid = mid + Math.imul(al5, bh8) | 0;
        mid = mid + Math.imul(ah5, bl8) | 0;
        hi = hi + Math.imul(ah5, bh8) | 0;
        lo = lo + Math.imul(al4, bl9) | 0;
        mid = mid + Math.imul(al4, bh9) | 0;
        mid = mid + Math.imul(ah4, bl9) | 0;
        hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
        w13 &= 67108863;
        lo = Math.imul(al9, bl5);
        mid = Math.imul(al9, bh5);
        mid = mid + Math.imul(ah9, bl5) | 0;
        hi = Math.imul(ah9, bh5);
        lo = lo + Math.imul(al8, bl6) | 0;
        mid = mid + Math.imul(al8, bh6) | 0;
        mid = mid + Math.imul(ah8, bl6) | 0;
        hi = hi + Math.imul(ah8, bh6) | 0;
        lo = lo + Math.imul(al7, bl7) | 0;
        mid = mid + Math.imul(al7, bh7) | 0;
        mid = mid + Math.imul(ah7, bl7) | 0;
        hi = hi + Math.imul(ah7, bh7) | 0;
        lo = lo + Math.imul(al6, bl8) | 0;
        mid = mid + Math.imul(al6, bh8) | 0;
        mid = mid + Math.imul(ah6, bl8) | 0;
        hi = hi + Math.imul(ah6, bh8) | 0;
        lo = lo + Math.imul(al5, bl9) | 0;
        mid = mid + Math.imul(al5, bh9) | 0;
        mid = mid + Math.imul(ah5, bl9) | 0;
        hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
        w14 &= 67108863;
        lo = Math.imul(al9, bl6);
        mid = Math.imul(al9, bh6);
        mid = mid + Math.imul(ah9, bl6) | 0;
        hi = Math.imul(ah9, bh6);
        lo = lo + Math.imul(al8, bl7) | 0;
        mid = mid + Math.imul(al8, bh7) | 0;
        mid = mid + Math.imul(ah8, bl7) | 0;
        hi = hi + Math.imul(ah8, bh7) | 0;
        lo = lo + Math.imul(al7, bl8) | 0;
        mid = mid + Math.imul(al7, bh8) | 0;
        mid = mid + Math.imul(ah7, bl8) | 0;
        hi = hi + Math.imul(ah7, bh8) | 0;
        lo = lo + Math.imul(al6, bl9) | 0;
        mid = mid + Math.imul(al6, bh9) | 0;
        mid = mid + Math.imul(ah6, bl9) | 0;
        hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
        w15 &= 67108863;
        lo = Math.imul(al9, bl7);
        mid = Math.imul(al9, bh7);
        mid = mid + Math.imul(ah9, bl7) | 0;
        hi = Math.imul(ah9, bh7);
        lo = lo + Math.imul(al8, bl8) | 0;
        mid = mid + Math.imul(al8, bh8) | 0;
        mid = mid + Math.imul(ah8, bl8) | 0;
        hi = hi + Math.imul(ah8, bh8) | 0;
        lo = lo + Math.imul(al7, bl9) | 0;
        mid = mid + Math.imul(al7, bh9) | 0;
        mid = mid + Math.imul(ah7, bl9) | 0;
        hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
        w16 &= 67108863;
        lo = Math.imul(al9, bl8);
        mid = Math.imul(al9, bh8);
        mid = mid + Math.imul(ah9, bl8) | 0;
        hi = Math.imul(ah9, bh8);
        lo = lo + Math.imul(al8, bl9) | 0;
        mid = mid + Math.imul(al8, bh9) | 0;
        mid = mid + Math.imul(ah8, bl9) | 0;
        hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
        w17 &= 67108863;
        lo = Math.imul(al9, bl9);
        mid = Math.imul(al9, bh9);
        mid = mid + Math.imul(ah9, bl9) | 0;
        hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
        w18 &= 67108863;
        o[0] = w0;
        o[1] = w1;
        o[2] = w2;
        o[3] = w3;
        o[4] = w4;
        o[5] = w5;
        o[6] = w6;
        o[7] = w7;
        o[8] = w8;
        o[9] = w9;
        o[10] = w10;
        o[11] = w11;
        o[12] = w12;
        o[13] = w13;
        o[14] = w14;
        o[15] = w15;
        o[16] = w16;
        o[17] = w17;
        o[18] = w18;
        if (c !== 0) {
          o[19] = c;
          out.length++;
        }
        return out;
      };
      if (!Math.imul) {
        comb10MulTo = smallMulTo;
      }
      function bigMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        out.length = self.length + num.length;
        var carry = 0;
        var hncarry = 0;
        for (var k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j;
            var a = self.words[i] | 0;
            var b = num.words[j] | 0;
            var r = a * b;
            var lo = r & 67108863;
            ncarry = ncarry + (r / 67108864 | 0) | 0;
            lo = lo + rword | 0;
            rword = lo & 67108863;
            ncarry = ncarry + (lo >>> 26) | 0;
            hncarry += ncarry >>> 26;
            ncarry &= 67108863;
          }
          out.words[k] = rword;
          carry = ncarry;
          ncarry = hncarry;
        }
        if (carry !== 0) {
          out.words[k] = carry;
        } else {
          out.length--;
        }
        return out.strip();
      }
      function jumboMulTo(self, num, out) {
        var fftm = new FFTM();
        return fftm.mulp(self, num, out);
      }
      BN.prototype.mulTo = function mulTo(num, out) {
        var res;
        var len = this.length + num.length;
        if (this.length === 10 && num.length === 10) {
          res = comb10MulTo(this, num, out);
        } else if (len < 63) {
          res = smallMulTo(this, num, out);
        } else if (len < 1024) {
          res = bigMulTo(this, num, out);
        } else {
          res = jumboMulTo(this, num, out);
        }
        return res;
      };
      function FFTM(x, y) {
        this.x = x;
        this.y = y;
      }
      FFTM.prototype.makeRBT = function makeRBT(N) {
        var t = new Array(N);
        var l = BN.prototype._countBits(N) - 1;
        for (var i = 0; i < N; i++) {
          t[i] = this.revBin(i, l, N);
        }
        return t;
      };
      FFTM.prototype.revBin = function revBin(x, l, N) {
        if (x === 0 || x === N - 1) return x;
        var rb = 0;
        for (var i = 0; i < l; i++) {
          rb |= (x & 1) << l - i - 1;
          x >>= 1;
        }
        return rb;
      };
      FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++) {
          rtws[i] = rws[rbt[i]];
          itws[i] = iws[rbt[i]];
        }
      };
      FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1) {
          var l = s << 1;
          var rtwdf = Math.cos(2 * Math.PI / l);
          var itwdf = Math.sin(2 * Math.PI / l);
          for (var p = 0; p < N; p += l) {
            var rtwdf_ = rtwdf;
            var itwdf_ = itwdf;
            for (var j = 0; j < s; j++) {
              var re = rtws[p + j];
              var ie = itws[p + j];
              var ro = rtws[p + j + s];
              var io = itws[p + j + s];
              var rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro;
              ro = rx;
              rtws[p + j] = re + ro;
              itws[p + j] = ie + io;
              rtws[p + j + s] = re - ro;
              itws[p + j + s] = ie - io;
              if (j !== l) {
                rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                rtwdf_ = rx;
              }
            }
          }
        }
      };
      FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
        var N = Math.max(m, n) | 1;
        var odd = N & 1;
        var i = 0;
        for (N = N / 2 | 0; N; N = N >>> 1) {
          i++;
        }
        return 1 << i + 1 + odd;
      };
      FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
        if (N <= 1) return;
        for (var i = 0; i < N / 2; i++) {
          var t = rws[i];
          rws[i] = rws[N - i - 1];
          rws[N - i - 1] = t;
          t = iws[i];
          iws[i] = -iws[N - i - 1];
          iws[N - i - 1] = -t;
        }
      };
      FFTM.prototype.normalize13b = function normalize13b(ws2, N) {
        var carry = 0;
        for (var i = 0; i < N / 2; i++) {
          var w = Math.round(ws2[2 * i + 1] / N) * 8192 + Math.round(ws2[2 * i] / N) + carry;
          ws2[i] = w & 67108863;
          if (w < 67108864) {
            carry = 0;
          } else {
            carry = w / 67108864 | 0;
          }
        }
        return ws2;
      };
      FFTM.prototype.convert13b = function convert13b(ws2, len, rws, N) {
        var carry = 0;
        for (var i = 0; i < len; i++) {
          carry = carry + (ws2[i] | 0);
          rws[2 * i] = carry & 8191;
          carry = carry >>> 13;
          rws[2 * i + 1] = carry & 8191;
          carry = carry >>> 13;
        }
        for (i = 2 * len; i < N; ++i) {
          rws[i] = 0;
        }
        assert(carry === 0);
        assert((carry & ~8191) === 0);
      };
      FFTM.prototype.stub = function stub(N) {
        var ph = new Array(N);
        for (var i = 0; i < N; i++) {
          ph[i] = 0;
        }
        return ph;
      };
      FFTM.prototype.mulp = function mulp(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length);
        var rbt = this.makeRBT(N);
        var _ = this.stub(N);
        var rws = new Array(N);
        var rwst = new Array(N);
        var iwst = new Array(N);
        var nrws = new Array(N);
        var nrwst = new Array(N);
        var niwst = new Array(N);
        var rmws = out.words;
        rmws.length = N;
        this.convert13b(x.words, x.length, rws, N);
        this.convert13b(y.words, y.length, nrws, N);
        this.transform(rws, _, rwst, iwst, N, rbt);
        this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
          rwst[i] = rx;
        }
        this.conjugate(rwst, iwst, N);
        this.transform(rwst, iwst, rmws, _, N, rbt);
        this.conjugate(rmws, _, N);
        this.normalize13b(rmws, N);
        out.negative = x.negative ^ y.negative;
        out.length = x.length + y.length;
        return out.strip();
      };
      BN.prototype.mul = function mul(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return this.mulTo(num, out);
      };
      BN.prototype.mulf = function mulf(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return jumboMulTo(this, num, out);
      };
      BN.prototype.imul = function imul(num) {
        return this.clone().mulTo(num, this);
      };
      BN.prototype.imuln = function imuln(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        var carry = 0;
        for (var i = 0; i < this.length; i++) {
          var w = (this.words[i] | 0) * num;
          var lo = (w & 67108863) + (carry & 67108863);
          carry >>= 26;
          carry += w / 67108864 | 0;
          carry += lo >>> 26;
          this.words[i] = lo & 67108863;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        this.length = num === 0 ? 1 : this.length;
        return this;
      };
      BN.prototype.muln = function muln(num) {
        return this.clone().imuln(num);
      };
      BN.prototype.sqr = function sqr() {
        return this.mul(this);
      };
      BN.prototype.isqr = function isqr() {
        return this.imul(this.clone());
      };
      BN.prototype.pow = function pow(num) {
        var w = toBitArray(num);
        if (w.length === 0) return new BN(1);
        var res = this;
        for (var i = 0; i < w.length; i++, res = res.sqr()) {
          if (w[i] !== 0) break;
        }
        if (++i < w.length) {
          for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
            if (w[i] === 0) continue;
            res = res.mul(q);
          }
        }
        return res;
      };
      BN.prototype.iushln = function iushln(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        var carryMask = 67108863 >>> 26 - r << 26 - r;
        var i;
        if (r !== 0) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask;
            var c = (this.words[i] | 0) - newCarry << r;
            this.words[i] = c | carry;
            carry = newCarry >>> 26 - r;
          }
          if (carry) {
            this.words[i] = carry;
            this.length++;
          }
        }
        if (s !== 0) {
          for (i = this.length - 1; i >= 0; i--) {
            this.words[i + s] = this.words[i];
          }
          for (i = 0; i < s; i++) {
            this.words[i] = 0;
          }
          this.length += s;
        }
        return this.strip();
      };
      BN.prototype.ishln = function ishln(bits) {
        assert(this.negative === 0);
        return this.iushln(bits);
      };
      BN.prototype.iushrn = function iushrn(bits, hint, extended) {
        assert(typeof bits === "number" && bits >= 0);
        var h;
        if (hint) {
          h = (hint - hint % 26) / 26;
        } else {
          h = 0;
        }
        var r = bits % 26;
        var s = Math.min((bits - r) / 26, this.length);
        var mask = 67108863 ^ 67108863 >>> r << r;
        var maskedWords = extended;
        h -= s;
        h = Math.max(0, h);
        if (maskedWords) {
          for (var i = 0; i < s; i++) {
            maskedWords.words[i] = this.words[i];
          }
          maskedWords.length = s;
        }
        if (s === 0) {
        } else if (this.length > s) {
          this.length -= s;
          for (i = 0; i < this.length; i++) {
            this.words[i] = this.words[i + s];
          }
        } else {
          this.words[0] = 0;
          this.length = 1;
        }
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
          var word = this.words[i] | 0;
          this.words[i] = carry << 26 - r | word >>> r;
          carry = word & mask;
        }
        if (maskedWords && carry !== 0) {
          maskedWords.words[maskedWords.length++] = carry;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.ishrn = function ishrn(bits, hint, extended) {
        assert(this.negative === 0);
        return this.iushrn(bits, hint, extended);
      };
      BN.prototype.shln = function shln(bits) {
        return this.clone().ishln(bits);
      };
      BN.prototype.ushln = function ushln(bits) {
        return this.clone().iushln(bits);
      };
      BN.prototype.shrn = function shrn(bits) {
        return this.clone().ishrn(bits);
      };
      BN.prototype.ushrn = function ushrn(bits) {
        return this.clone().iushrn(bits);
      };
      BN.prototype.testn = function testn(bit) {
        assert(typeof bit === "number" && bit >= 0);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) return false;
        var w = this.words[s];
        return !!(w & q);
      };
      BN.prototype.imaskn = function imaskn(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        assert(this.negative === 0, "imaskn works only with positive numbers");
        if (this.length <= s) {
          return this;
        }
        if (r !== 0) {
          s++;
        }
        this.length = Math.min(s, this.length);
        if (r !== 0) {
          var mask = 67108863 ^ 67108863 >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.maskn = function maskn(bits) {
        return this.clone().imaskn(bits);
      };
      BN.prototype.iaddn = function iaddn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.isubn(-num);
        if (this.negative !== 0) {
          if (this.length === 1 && (this.words[0] | 0) < num) {
            this.words[0] = num - (this.words[0] | 0);
            this.negative = 0;
            return this;
          }
          this.negative = 0;
          this.isubn(num);
          this.negative = 1;
          return this;
        }
        return this._iaddn(num);
      };
      BN.prototype._iaddn = function _iaddn(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
          this.words[i] -= 67108864;
          if (i === this.length - 1) {
            this.words[i + 1] = 1;
          } else {
            this.words[i + 1]++;
          }
        }
        this.length = Math.max(this.length, i + 1);
        return this;
      };
      BN.prototype.isubn = function isubn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.iaddn(-num);
        if (this.negative !== 0) {
          this.negative = 0;
          this.iaddn(num);
          this.negative = 1;
          return this;
        }
        this.words[0] -= num;
        if (this.length === 1 && this.words[0] < 0) {
          this.words[0] = -this.words[0];
          this.negative = 1;
        } else {
          for (var i = 0; i < this.length && this.words[i] < 0; i++) {
            this.words[i] += 67108864;
            this.words[i + 1] -= 1;
          }
        }
        return this.strip();
      };
      BN.prototype.addn = function addn(num) {
        return this.clone().iaddn(num);
      };
      BN.prototype.subn = function subn(num) {
        return this.clone().isubn(num);
      };
      BN.prototype.iabs = function iabs() {
        this.negative = 0;
        return this;
      };
      BN.prototype.abs = function abs() {
        return this.clone().iabs();
      };
      BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
        var len = num.length + shift;
        var i;
        this._expand(len);
        var w;
        var carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (this.words[i + shift] | 0) + carry;
          var right = (num.words[i] | 0) * mul;
          w -= right & 67108863;
          carry = (w >> 26) - (right / 67108864 | 0);
          this.words[i + shift] = w & 67108863;
        }
        for (; i < this.length - shift; i++) {
          w = (this.words[i + shift] | 0) + carry;
          carry = w >> 26;
          this.words[i + shift] = w & 67108863;
        }
        if (carry === 0) return this.strip();
        assert(carry === -1);
        carry = 0;
        for (i = 0; i < this.length; i++) {
          w = -(this.words[i] | 0) + carry;
          carry = w >> 26;
          this.words[i] = w & 67108863;
        }
        this.negative = 1;
        return this.strip();
      };
      BN.prototype._wordDiv = function _wordDiv(num, mode) {
        var shift = this.length - num.length;
        var a = this.clone();
        var b = num;
        var bhi = b.words[b.length - 1] | 0;
        var bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits;
        if (shift !== 0) {
          b = b.ushln(shift);
          a.iushln(shift);
          bhi = b.words[b.length - 1] | 0;
        }
        var m = a.length - b.length;
        var q;
        if (mode !== "mod") {
          q = new BN(null);
          q.length = m + 1;
          q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++) {
            q.words[i] = 0;
          }
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        if (diff.negative === 0) {
          a = diff;
          if (q) {
            q.words[m] = 1;
          }
        }
        for (var j = m - 1; j >= 0; j--) {
          var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
          qj = Math.min(qj / bhi | 0, 67108863);
          a._ishlnsubmul(b, qj, j);
          while (a.negative !== 0) {
            qj--;
            a.negative = 0;
            a._ishlnsubmul(b, 1, j);
            if (!a.isZero()) {
              a.negative ^= 1;
            }
          }
          if (q) {
            q.words[j] = qj;
          }
        }
        if (q) {
          q.strip();
        }
        a.strip();
        if (mode !== "div" && shift !== 0) {
          a.iushrn(shift);
        }
        return {
          div: q || null,
          mod: a
        };
      };
      BN.prototype.divmod = function divmod(num, mode, positive) {
        assert(!num.isZero());
        if (this.isZero()) {
          return {
            div: new BN(0),
            mod: new BN(0)
          };
        }
        var div, mod, res;
        if (this.negative !== 0 && num.negative === 0) {
          res = this.neg().divmod(num, mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.iadd(num);
            }
          }
          return {
            div,
            mod
          };
        }
        if (this.negative === 0 && num.negative !== 0) {
          res = this.divmod(num.neg(), mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          return {
            div,
            mod: res.mod
          };
        }
        if ((this.negative & num.negative) !== 0) {
          res = this.neg().divmod(num.neg(), mode);
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.isub(num);
            }
          }
          return {
            div: res.div,
            mod
          };
        }
        if (num.length > this.length || this.cmp(num) < 0) {
          return {
            div: new BN(0),
            mod: this
          };
        }
        if (num.length === 1) {
          if (mode === "div") {
            return {
              div: this.divn(num.words[0]),
              mod: null
            };
          }
          if (mode === "mod") {
            return {
              div: null,
              mod: new BN(this.modn(num.words[0]))
            };
          }
          return {
            div: this.divn(num.words[0]),
            mod: new BN(this.modn(num.words[0]))
          };
        }
        return this._wordDiv(num, mode);
      };
      BN.prototype.div = function div(num) {
        return this.divmod(num, "div", false).div;
      };
      BN.prototype.mod = function mod(num) {
        return this.divmod(num, "mod", false).mod;
      };
      BN.prototype.umod = function umod(num) {
        return this.divmod(num, "mod", true).mod;
      };
      BN.prototype.divRound = function divRound(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;
        var half = num.ushrn(1);
        var r2 = num.andln(1);
        var cmp = mod.cmp(half);
        if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
        return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
      };
      BN.prototype.modn = function modn(num) {
        assert(num <= 67108863);
        var p = (1 << 26) % num;
        var acc = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          acc = (p * acc + (this.words[i] | 0)) % num;
        }
        return acc;
      };
      BN.prototype.idivn = function idivn(num) {
        assert(num <= 67108863);
        var carry = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var w = (this.words[i] | 0) + carry * 67108864;
          this.words[i] = w / num | 0;
          carry = w % num;
        }
        return this.strip();
      };
      BN.prototype.divn = function divn(num) {
        return this.clone().idivn(num);
      };
      BN.prototype.egcd = function egcd(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var x = this;
        var y = p.clone();
        if (x.negative !== 0) {
          x = x.umod(p);
        } else {
          x = x.clone();
        }
        var A = new BN(1);
        var B = new BN(0);
        var C = new BN(0);
        var D = new BN(1);
        var g = 0;
        while (x.isEven() && y.isEven()) {
          x.iushrn(1);
          y.iushrn(1);
          ++g;
        }
        var yp = y.clone();
        var xp = x.clone();
        while (!x.isZero()) {
          for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            x.iushrn(i);
            while (i-- > 0) {
              if (A.isOdd() || B.isOdd()) {
                A.iadd(yp);
                B.isub(xp);
              }
              A.iushrn(1);
              B.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            y.iushrn(j);
            while (j-- > 0) {
              if (C.isOdd() || D.isOdd()) {
                C.iadd(yp);
                D.isub(xp);
              }
              C.iushrn(1);
              D.iushrn(1);
            }
          }
          if (x.cmp(y) >= 0) {
            x.isub(y);
            A.isub(C);
            B.isub(D);
          } else {
            y.isub(x);
            C.isub(A);
            D.isub(B);
          }
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      };
      BN.prototype._invmp = function _invmp(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var a = this;
        var b = p.clone();
        if (a.negative !== 0) {
          a = a.umod(p);
        } else {
          a = a.clone();
        }
        var x1 = new BN(1);
        var x2 = new BN(0);
        var delta = b.clone();
        while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
          for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            a.iushrn(i);
            while (i-- > 0) {
              if (x1.isOdd()) {
                x1.iadd(delta);
              }
              x1.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            b.iushrn(j);
            while (j-- > 0) {
              if (x2.isOdd()) {
                x2.iadd(delta);
              }
              x2.iushrn(1);
            }
          }
          if (a.cmp(b) >= 0) {
            a.isub(b);
            x1.isub(x2);
          } else {
            b.isub(a);
            x2.isub(x1);
          }
        }
        var res;
        if (a.cmpn(1) === 0) {
          res = x1;
        } else {
          res = x2;
        }
        if (res.cmpn(0) < 0) {
          res.iadd(p);
        }
        return res;
      };
      BN.prototype.gcd = function gcd(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone();
        var b = num.clone();
        a.negative = 0;
        b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++) {
          a.iushrn(1);
          b.iushrn(1);
        }
        do {
          while (a.isEven()) {
            a.iushrn(1);
          }
          while (b.isEven()) {
            b.iushrn(1);
          }
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b;
            b = t;
          } else if (r === 0 || b.cmpn(1) === 0) {
            break;
          }
          a.isub(b);
        } while (true);
        return b.iushln(shift);
      };
      BN.prototype.invm = function invm(num) {
        return this.egcd(num).a.umod(num);
      };
      BN.prototype.isEven = function isEven() {
        return (this.words[0] & 1) === 0;
      };
      BN.prototype.isOdd = function isOdd() {
        return (this.words[0] & 1) === 1;
      };
      BN.prototype.andln = function andln(num) {
        return this.words[0] & num;
      };
      BN.prototype.bincn = function bincn(bit) {
        assert(typeof bit === "number");
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) {
          this._expand(s + 1);
          this.words[s] |= q;
          return this;
        }
        var carry = q;
        for (var i = s; carry !== 0 && i < this.length; i++) {
          var w = this.words[i] | 0;
          w += carry;
          carry = w >>> 26;
          w &= 67108863;
          this.words[i] = w;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.isZero = function isZero() {
        return this.length === 1 && this.words[0] === 0;
      };
      BN.prototype.cmpn = function cmpn(num) {
        var negative = num < 0;
        if (this.negative !== 0 && !negative) return -1;
        if (this.negative === 0 && negative) return 1;
        this.strip();
        var res;
        if (this.length > 1) {
          res = 1;
        } else {
          if (negative) {
            num = -num;
          }
          assert(num <= 67108863, "Number is too big");
          var w = this.words[0] | 0;
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.cmp = function cmp(num) {
        if (this.negative !== 0 && num.negative === 0) return -1;
        if (this.negative === 0 && num.negative !== 0) return 1;
        var res = this.ucmp(num);
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.ucmp = function ucmp(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        var res = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var a = this.words[i] | 0;
          var b = num.words[i] | 0;
          if (a === b) continue;
          if (a < b) {
            res = -1;
          } else if (a > b) {
            res = 1;
          }
          break;
        }
        return res;
      };
      BN.prototype.gtn = function gtn(num) {
        return this.cmpn(num) === 1;
      };
      BN.prototype.gt = function gt(num) {
        return this.cmp(num) === 1;
      };
      BN.prototype.gten = function gten(num) {
        return this.cmpn(num) >= 0;
      };
      BN.prototype.gte = function gte(num) {
        return this.cmp(num) >= 0;
      };
      BN.prototype.ltn = function ltn(num) {
        return this.cmpn(num) === -1;
      };
      BN.prototype.lt = function lt(num) {
        return this.cmp(num) === -1;
      };
      BN.prototype.lten = function lten(num) {
        return this.cmpn(num) <= 0;
      };
      BN.prototype.lte = function lte(num) {
        return this.cmp(num) <= 0;
      };
      BN.prototype.eqn = function eqn(num) {
        return this.cmpn(num) === 0;
      };
      BN.prototype.eq = function eq(num) {
        return this.cmp(num) === 0;
      };
      BN.red = function red(num) {
        return new Red(num);
      };
      BN.prototype.toRed = function toRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        assert(this.negative === 0, "red works only with positives");
        return ctx.convertTo(this)._forceRed(ctx);
      };
      BN.prototype.fromRed = function fromRed() {
        assert(this.red, "fromRed works only with numbers in reduction context");
        return this.red.convertFrom(this);
      };
      BN.prototype._forceRed = function _forceRed(ctx) {
        this.red = ctx;
        return this;
      };
      BN.prototype.forceRed = function forceRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        return this._forceRed(ctx);
      };
      BN.prototype.redAdd = function redAdd(num) {
        assert(this.red, "redAdd works only with red numbers");
        return this.red.add(this, num);
      };
      BN.prototype.redIAdd = function redIAdd(num) {
        assert(this.red, "redIAdd works only with red numbers");
        return this.red.iadd(this, num);
      };
      BN.prototype.redSub = function redSub(num) {
        assert(this.red, "redSub works only with red numbers");
        return this.red.sub(this, num);
      };
      BN.prototype.redISub = function redISub(num) {
        assert(this.red, "redISub works only with red numbers");
        return this.red.isub(this, num);
      };
      BN.prototype.redShl = function redShl(num) {
        assert(this.red, "redShl works only with red numbers");
        return this.red.shl(this, num);
      };
      BN.prototype.redMul = function redMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.mul(this, num);
      };
      BN.prototype.redIMul = function redIMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.imul(this, num);
      };
      BN.prototype.redSqr = function redSqr() {
        assert(this.red, "redSqr works only with red numbers");
        this.red._verify1(this);
        return this.red.sqr(this);
      };
      BN.prototype.redISqr = function redISqr() {
        assert(this.red, "redISqr works only with red numbers");
        this.red._verify1(this);
        return this.red.isqr(this);
      };
      BN.prototype.redSqrt = function redSqrt() {
        assert(this.red, "redSqrt works only with red numbers");
        this.red._verify1(this);
        return this.red.sqrt(this);
      };
      BN.prototype.redInvm = function redInvm() {
        assert(this.red, "redInvm works only with red numbers");
        this.red._verify1(this);
        return this.red.invm(this);
      };
      BN.prototype.redNeg = function redNeg() {
        assert(this.red, "redNeg works only with red numbers");
        this.red._verify1(this);
        return this.red.neg(this);
      };
      BN.prototype.redPow = function redPow(num) {
        assert(this.red && !num.red, "redPow(normalNum)");
        this.red._verify1(this);
        return this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name;
        this.p = new BN(p, 16);
        this.n = this.p.bitLength();
        this.k = new BN(1).iushln(this.n).isub(this.p);
        this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function _tmp() {
        var tmp = new BN(null);
        tmp.words = new Array(Math.ceil(this.n / 13));
        return tmp;
      };
      MPrime.prototype.ireduce = function ireduce(num) {
        var r = num;
        var rlen;
        do {
          this.split(r, this.tmp);
          r = this.imulK(r);
          r = r.iadd(this.tmp);
          rlen = r.bitLength();
        } while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        if (cmp === 0) {
          r.words[0] = 0;
          r.length = 1;
        } else if (cmp > 0) {
          r.isub(this.p);
        } else {
          if (r.strip !== void 0) {
            r.strip();
          } else {
            r._strip();
          }
        }
        return r;
      };
      MPrime.prototype.split = function split(input, out) {
        input.iushrn(this.n, 0, out);
      };
      MPrime.prototype.imulK = function imulK(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(
          this,
          "k256",
          "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f"
        );
      }
      inherits(K256, MPrime);
      K256.prototype.split = function split(input, output) {
        var mask = 4194303;
        var outLen = Math.min(input.length, 9);
        for (var i = 0; i < outLen; i++) {
          output.words[i] = input.words[i];
        }
        output.length = outLen;
        if (input.length <= 9) {
          input.words[0] = 0;
          input.length = 1;
          return;
        }
        var prev = input.words[9];
        output.words[output.length++] = prev & mask;
        for (i = 10; i < input.length; i++) {
          var next = input.words[i] | 0;
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
          prev = next;
        }
        prev >>>= 22;
        input.words[i - 10] = prev;
        if (prev === 0 && input.length > 10) {
          input.length -= 10;
        } else {
          input.length -= 9;
        }
      };
      K256.prototype.imulK = function imulK(num) {
        num.words[num.length] = 0;
        num.words[num.length + 1] = 0;
        num.length += 2;
        var lo = 0;
        for (var i = 0; i < num.length; i++) {
          var w = num.words[i] | 0;
          lo += w * 977;
          num.words[i] = lo & 67108863;
          lo = w * 64 + (lo / 67108864 | 0);
        }
        if (num.words[num.length - 1] === 0) {
          num.length--;
          if (num.words[num.length - 1] === 0) {
            num.length--;
          }
        }
        return num;
      };
      function P224() {
        MPrime.call(
          this,
          "p224",
          "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001"
        );
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(
          this,
          "p192",
          "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff"
        );
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(
          this,
          "25519",
          "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed"
        );
      }
      inherits(P25519, MPrime);
      P25519.prototype.imulK = function imulK(num) {
        var carry = 0;
        for (var i = 0; i < num.length; i++) {
          var hi = (num.words[i] | 0) * 19 + carry;
          var lo = hi & 67108863;
          hi >>>= 26;
          num.words[i] = lo;
          carry = hi;
        }
        if (carry !== 0) {
          num.words[num.length++] = carry;
        }
        return num;
      };
      BN._prime = function prime(name) {
        if (primes[name]) return primes[name];
        var prime2;
        if (name === "k256") {
          prime2 = new K256();
        } else if (name === "p224") {
          prime2 = new P224();
        } else if (name === "p192") {
          prime2 = new P192();
        } else if (name === "p25519") {
          prime2 = new P25519();
        } else {
          throw new Error("Unknown prime " + name);
        }
        primes[name] = prime2;
        return prime2;
      };
      function Red(m) {
        if (typeof m === "string") {
          var prime = BN._prime(m);
          this.m = prime.p;
          this.prime = prime;
        } else {
          assert(m.gtn(1), "modulus must be greater than 1");
          this.m = m;
          this.prime = null;
        }
      }
      Red.prototype._verify1 = function _verify1(a) {
        assert(a.negative === 0, "red works only with positives");
        assert(a.red, "red works only with red numbers");
      };
      Red.prototype._verify2 = function _verify2(a, b) {
        assert((a.negative | b.negative) === 0, "red works only with positives");
        assert(
          a.red && a.red === b.red,
          "red works only with red numbers"
        );
      };
      Red.prototype.imod = function imod(a) {
        if (this.prime) return this.prime.ireduce(a)._forceRed(this);
        return a.umod(this.m)._forceRed(this);
      };
      Red.prototype.neg = function neg(a) {
        if (a.isZero()) {
          return a.clone();
        }
        return this.m.sub(a)._forceRed(this);
      };
      Red.prototype.add = function add(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.iadd = function iadd(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res;
      };
      Red.prototype.sub = function sub(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.isub = function isub(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res;
      };
      Red.prototype.shl = function shl(a, num) {
        this._verify1(a);
        return this.imod(a.ushln(num));
      };
      Red.prototype.imul = function imul(a, b) {
        this._verify2(a, b);
        return this.imod(a.imul(b));
      };
      Red.prototype.mul = function mul(a, b) {
        this._verify2(a, b);
        return this.imod(a.mul(b));
      };
      Red.prototype.isqr = function isqr(a) {
        return this.imul(a, a.clone());
      };
      Red.prototype.sqr = function sqr(a) {
        return this.mul(a, a);
      };
      Red.prototype.sqrt = function sqrt(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        assert(mod3 % 2 === 1);
        if (mod3 === 3) {
          var pow = this.m.add(new BN(1)).iushrn(2);
          return this.pow(a, pow);
        }
        var q = this.m.subn(1);
        var s = 0;
        while (!q.isZero() && q.andln(1) === 0) {
          s++;
          q.iushrn(1);
        }
        assert(!q.isZero());
        var one = new BN(1).toRed(this);
        var nOne = one.redNeg();
        var lpow = this.m.subn(1).iushrn(1);
        var z = this.m.bitLength();
        z = new BN(2 * z * z).toRed(this);
        while (this.pow(z, lpow).cmp(nOne) !== 0) {
          z.redIAdd(nOne);
        }
        var c = this.pow(z, q);
        var r = this.pow(a, q.addn(1).iushrn(1));
        var t = this.pow(a, q);
        var m = s;
        while (t.cmp(one) !== 0) {
          var tmp = t;
          for (var i = 0; tmp.cmp(one) !== 0; i++) {
            tmp = tmp.redSqr();
          }
          assert(i < m);
          var b = this.pow(c, new BN(1).iushln(m - i - 1));
          r = r.redMul(b);
          c = b.redSqr();
          t = t.redMul(c);
          m = i;
        }
        return r;
      };
      Red.prototype.invm = function invm(a) {
        var inv = a._invmp(this.m);
        if (inv.negative !== 0) {
          inv.negative = 0;
          return this.imod(inv).redNeg();
        } else {
          return this.imod(inv);
        }
      };
      Red.prototype.pow = function pow(a, num) {
        if (num.isZero()) return new BN(1).toRed(this);
        if (num.cmpn(1) === 0) return a.clone();
        var windowSize = 4;
        var wnd = new Array(1 << windowSize);
        wnd[0] = new BN(1).toRed(this);
        wnd[1] = a;
        for (var i = 2; i < wnd.length; i++) {
          wnd[i] = this.mul(wnd[i - 1], a);
        }
        var res = wnd[0];
        var current = 0;
        var currentLen = 0;
        var start = num.bitLength() % 26;
        if (start === 0) {
          start = 26;
        }
        for (i = num.length - 1; i >= 0; i--) {
          var word = num.words[i];
          for (var j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            if (res !== wnd[0]) {
              res = this.sqr(res);
            }
            if (bit === 0 && current === 0) {
              currentLen = 0;
              continue;
            }
            current <<= 1;
            current |= bit;
            currentLen++;
            if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
            res = this.mul(res, wnd[current]);
            currentLen = 0;
            current = 0;
          }
          start = 26;
        }
        return res;
      };
      Red.prototype.convertTo = function convertTo(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      };
      Red.prototype.convertFrom = function convertFrom(num) {
        var res = num.clone();
        res.red = null;
        return res;
      };
      BN.mont = function mont(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m);
        this.shift = this.m.bitLength();
        if (this.shift % 26 !== 0) {
          this.shift += 26 - this.shift % 26;
        }
        this.r = new BN(1).iushln(this.shift);
        this.r2 = this.imod(this.r.sqr());
        this.rinv = this.r._invmp(this.m);
        this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
        this.minv = this.minv.umod(this.r);
        this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red);
      Mont.prototype.convertTo = function convertTo(num) {
        return this.imod(num.ushln(this.shift));
      };
      Mont.prototype.convertFrom = function convertFrom(num) {
        var r = this.imod(num.mul(this.rinv));
        r.red = null;
        return r;
      };
      Mont.prototype.imul = function imul(a, b) {
        if (a.isZero() || b.isZero()) {
          a.words[0] = 0;
          a.length = 1;
          return a;
        }
        var t = a.imul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.mul = function mul(a, b) {
        if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
        var t = a.mul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.invm = function invm(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })(typeof module === "undefined" || module, exports);
  }
});

// ../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js"(exports, module) {
    if (typeof Object.create === "function") {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// ../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js"(exports, module) {
    try {
      util2 = __require("util");
      if (typeof util2.inherits !== "function") throw "";
      module.exports = util2.inherits;
    } catch (e) {
      module.exports = require_inherits_browser();
    }
    var util2;
  }
});

// ../../node_modules/.pnpm/safer-buffer@2.1.2/node_modules/safer-buffer/safer.js
var require_safer = __commonJS({
  "../../node_modules/.pnpm/safer-buffer@2.1.2/node_modules/safer-buffer/safer.js"(exports, module) {
    "use strict";
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    var safer = {};
    var key;
    for (key in buffer) {
      if (!buffer.hasOwnProperty(key)) continue;
      if (key === "SlowBuffer" || key === "Buffer") continue;
      safer[key] = buffer[key];
    }
    var Safer = safer.Buffer = {};
    for (key in Buffer2) {
      if (!Buffer2.hasOwnProperty(key)) continue;
      if (key === "allocUnsafe" || key === "allocUnsafeSlow") continue;
      Safer[key] = Buffer2[key];
    }
    safer.Buffer.prototype = Buffer2.prototype;
    if (!Safer.from || Safer.from === Uint8Array.from) {
      Safer.from = function(value, encodingOrOffset, length) {
        if (typeof value === "number") {
          throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value);
        }
        if (value && typeof value.length === "undefined") {
          throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
        }
        return Buffer2(value, encodingOrOffset, length);
      };
    }
    if (!Safer.alloc) {
      Safer.alloc = function(size, fill, encoding) {
        if (typeof size !== "number") {
          throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size);
        }
        if (size < 0 || size >= 2 * (1 << 30)) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
        var buf = Buffer2(size);
        if (!fill || fill.length === 0) {
          buf.fill(0);
        } else if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
        return buf;
      };
    }
    if (!safer.kStringMaxLength) {
      try {
        safer.kStringMaxLength = process.binding("buffer").kStringMaxLength;
      } catch (e) {
      }
    }
    if (!safer.constants) {
      safer.constants = {
        MAX_LENGTH: safer.kMaxLength
      };
      if (safer.kStringMaxLength) {
        safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
      }
    }
    module.exports = safer;
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/reporter.js
var require_reporter = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/reporter.js"(exports) {
    "use strict";
    var inherits = require_inherits();
    function Reporter(options) {
      this._reporterState = {
        obj: null,
        path: [],
        options: options || {},
        errors: []
      };
    }
    exports.Reporter = Reporter;
    Reporter.prototype.isError = function isError(obj) {
      return obj instanceof ReporterError;
    };
    Reporter.prototype.save = function save() {
      const state = this._reporterState;
      return { obj: state.obj, pathLen: state.path.length };
    };
    Reporter.prototype.restore = function restore(data) {
      const state = this._reporterState;
      state.obj = data.obj;
      state.path = state.path.slice(0, data.pathLen);
    };
    Reporter.prototype.enterKey = function enterKey(key) {
      return this._reporterState.path.push(key);
    };
    Reporter.prototype.exitKey = function exitKey(index) {
      const state = this._reporterState;
      state.path = state.path.slice(0, index - 1);
    };
    Reporter.prototype.leaveKey = function leaveKey(index, key, value) {
      const state = this._reporterState;
      this.exitKey(index);
      if (state.obj !== null)
        state.obj[key] = value;
    };
    Reporter.prototype.path = function path3() {
      return this._reporterState.path.join("/");
    };
    Reporter.prototype.enterObject = function enterObject() {
      const state = this._reporterState;
      const prev = state.obj;
      state.obj = {};
      return prev;
    };
    Reporter.prototype.leaveObject = function leaveObject(prev) {
      const state = this._reporterState;
      const now = state.obj;
      state.obj = prev;
      return now;
    };
    Reporter.prototype.error = function error(msg) {
      let err;
      const state = this._reporterState;
      const inherited = msg instanceof ReporterError;
      if (inherited) {
        err = msg;
      } else {
        err = new ReporterError(state.path.map(function(elem) {
          return "[" + JSON.stringify(elem) + "]";
        }).join(""), msg.message || msg, msg.stack);
      }
      if (!state.options.partial)
        throw err;
      if (!inherited)
        state.errors.push(err);
      return err;
    };
    Reporter.prototype.wrapResult = function wrapResult(result) {
      const state = this._reporterState;
      if (!state.options.partial)
        return result;
      return {
        result: this.isError(result) ? null : result,
        errors: state.errors
      };
    };
    function ReporterError(path3, msg) {
      this.path = path3;
      this.rethrow(msg);
    }
    inherits(ReporterError, Error);
    ReporterError.prototype.rethrow = function rethrow(msg) {
      this.message = msg + " at: " + (this.path || "(shallow)");
      if (Error.captureStackTrace)
        Error.captureStackTrace(this, ReporterError);
      if (!this.stack) {
        try {
          throw new Error(this.message);
        } catch (e) {
          this.stack = e.stack;
        }
      }
      return this;
    };
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/buffer.js
var require_buffer = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/buffer.js"(exports) {
    "use strict";
    var inherits = require_inherits();
    var Reporter = require_reporter().Reporter;
    var Buffer2 = require_safer().Buffer;
    function DecoderBuffer(base, options) {
      Reporter.call(this, options);
      if (!Buffer2.isBuffer(base)) {
        this.error("Input not Buffer");
        return;
      }
      this.base = base;
      this.offset = 0;
      this.length = base.length;
    }
    inherits(DecoderBuffer, Reporter);
    exports.DecoderBuffer = DecoderBuffer;
    DecoderBuffer.isDecoderBuffer = function isDecoderBuffer(data) {
      if (data instanceof DecoderBuffer) {
        return true;
      }
      const isCompatible = typeof data === "object" && Buffer2.isBuffer(data.base) && data.constructor.name === "DecoderBuffer" && typeof data.offset === "number" && typeof data.length === "number" && typeof data.save === "function" && typeof data.restore === "function" && typeof data.isEmpty === "function" && typeof data.readUInt8 === "function" && typeof data.skip === "function" && typeof data.raw === "function";
      return isCompatible;
    };
    DecoderBuffer.prototype.save = function save() {
      return { offset: this.offset, reporter: Reporter.prototype.save.call(this) };
    };
    DecoderBuffer.prototype.restore = function restore(save) {
      const res = new DecoderBuffer(this.base);
      res.offset = save.offset;
      res.length = this.offset;
      this.offset = save.offset;
      Reporter.prototype.restore.call(this, save.reporter);
      return res;
    };
    DecoderBuffer.prototype.isEmpty = function isEmpty() {
      return this.offset === this.length;
    };
    DecoderBuffer.prototype.readUInt8 = function readUInt8(fail) {
      if (this.offset + 1 <= this.length)
        return this.base.readUInt8(this.offset++, true);
      else
        return this.error(fail || "DecoderBuffer overrun");
    };
    DecoderBuffer.prototype.skip = function skip(bytes, fail) {
      if (!(this.offset + bytes <= this.length))
        return this.error(fail || "DecoderBuffer overrun");
      const res = new DecoderBuffer(this.base);
      res._reporterState = this._reporterState;
      res.offset = this.offset;
      res.length = this.offset + bytes;
      this.offset += bytes;
      return res;
    };
    DecoderBuffer.prototype.raw = function raw(save) {
      return this.base.slice(save ? save.offset : this.offset, this.length);
    };
    function EncoderBuffer(value, reporter) {
      if (Array.isArray(value)) {
        this.length = 0;
        this.value = value.map(function(item) {
          if (!EncoderBuffer.isEncoderBuffer(item))
            item = new EncoderBuffer(item, reporter);
          this.length += item.length;
          return item;
        }, this);
      } else if (typeof value === "number") {
        if (!(0 <= value && value <= 255))
          return reporter.error("non-byte EncoderBuffer value");
        this.value = value;
        this.length = 1;
      } else if (typeof value === "string") {
        this.value = value;
        this.length = Buffer2.byteLength(value);
      } else if (Buffer2.isBuffer(value)) {
        this.value = value;
        this.length = value.length;
      } else {
        return reporter.error("Unsupported type: " + typeof value);
      }
    }
    exports.EncoderBuffer = EncoderBuffer;
    EncoderBuffer.isEncoderBuffer = function isEncoderBuffer(data) {
      if (data instanceof EncoderBuffer) {
        return true;
      }
      const isCompatible = typeof data === "object" && data.constructor.name === "EncoderBuffer" && typeof data.length === "number" && typeof data.join === "function";
      return isCompatible;
    };
    EncoderBuffer.prototype.join = function join(out, offset) {
      if (!out)
        out = Buffer2.alloc(this.length);
      if (!offset)
        offset = 0;
      if (this.length === 0)
        return out;
      if (Array.isArray(this.value)) {
        this.value.forEach(function(item) {
          item.join(out, offset);
          offset += item.length;
        });
      } else {
        if (typeof this.value === "number")
          out[offset] = this.value;
        else if (typeof this.value === "string")
          out.write(this.value, offset);
        else if (Buffer2.isBuffer(this.value))
          this.value.copy(out, offset);
        offset += this.length;
      }
      return out;
    };
  }
});

// ../../node_modules/.pnpm/minimalistic-assert@1.0.1/node_modules/minimalistic-assert/index.js
var require_minimalistic_assert = __commonJS({
  "../../node_modules/.pnpm/minimalistic-assert@1.0.1/node_modules/minimalistic-assert/index.js"(exports, module) {
    module.exports = assert;
    function assert(val, msg) {
      if (!val)
        throw new Error(msg || "Assertion failed");
    }
    assert.equal = function assertEqual(l, r, msg) {
      if (l != r)
        throw new Error(msg || "Assertion failed: " + l + " != " + r);
    };
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/node.js
var require_node = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/node.js"(exports, module) {
    "use strict";
    var Reporter = require_reporter().Reporter;
    var EncoderBuffer = require_buffer().EncoderBuffer;
    var DecoderBuffer = require_buffer().DecoderBuffer;
    var assert = require_minimalistic_assert();
    var tags = [
      "seq",
      "seqof",
      "set",
      "setof",
      "objid",
      "bool",
      "gentime",
      "utctime",
      "null_",
      "enum",
      "int",
      "objDesc",
      "bitstr",
      "bmpstr",
      "charstr",
      "genstr",
      "graphstr",
      "ia5str",
      "iso646str",
      "numstr",
      "octstr",
      "printstr",
      "t61str",
      "unistr",
      "utf8str",
      "videostr"
    ];
    var methods = [
      "key",
      "obj",
      "use",
      "optional",
      "explicit",
      "implicit",
      "def",
      "choice",
      "any",
      "contains"
    ].concat(tags);
    var overrided = [
      "_peekTag",
      "_decodeTag",
      "_use",
      "_decodeStr",
      "_decodeObjid",
      "_decodeTime",
      "_decodeNull",
      "_decodeInt",
      "_decodeBool",
      "_decodeList",
      "_encodeComposite",
      "_encodeStr",
      "_encodeObjid",
      "_encodeTime",
      "_encodeNull",
      "_encodeInt",
      "_encodeBool"
    ];
    function Node(enc, parent, name) {
      const state = {};
      this._baseState = state;
      state.name = name;
      state.enc = enc;
      state.parent = parent || null;
      state.children = null;
      state.tag = null;
      state.args = null;
      state.reverseArgs = null;
      state.choice = null;
      state.optional = false;
      state.any = false;
      state.obj = false;
      state.use = null;
      state.useDecoder = null;
      state.key = null;
      state["default"] = null;
      state.explicit = null;
      state.implicit = null;
      state.contains = null;
      if (!state.parent) {
        state.children = [];
        this._wrap();
      }
    }
    module.exports = Node;
    var stateProps = [
      "enc",
      "parent",
      "children",
      "tag",
      "args",
      "reverseArgs",
      "choice",
      "optional",
      "any",
      "obj",
      "use",
      "alteredUse",
      "key",
      "default",
      "explicit",
      "implicit",
      "contains"
    ];
    Node.prototype.clone = function clone() {
      const state = this._baseState;
      const cstate = {};
      stateProps.forEach(function(prop) {
        cstate[prop] = state[prop];
      });
      const res = new this.constructor(cstate.parent);
      res._baseState = cstate;
      return res;
    };
    Node.prototype._wrap = function wrap() {
      const state = this._baseState;
      methods.forEach(function(method) {
        this[method] = function _wrappedMethod() {
          const clone = new this.constructor(this);
          state.children.push(clone);
          return clone[method].apply(clone, arguments);
        };
      }, this);
    };
    Node.prototype._init = function init(body) {
      const state = this._baseState;
      assert(state.parent === null);
      body.call(this);
      state.children = state.children.filter(function(child) {
        return child._baseState.parent === this;
      }, this);
      assert.equal(state.children.length, 1, "Root node can have only one child");
    };
    Node.prototype._useArgs = function useArgs(args) {
      const state = this._baseState;
      const children = args.filter(function(arg) {
        return arg instanceof this.constructor;
      }, this);
      args = args.filter(function(arg) {
        return !(arg instanceof this.constructor);
      }, this);
      if (children.length !== 0) {
        assert(state.children === null);
        state.children = children;
        children.forEach(function(child) {
          child._baseState.parent = this;
        }, this);
      }
      if (args.length !== 0) {
        assert(state.args === null);
        state.args = args;
        state.reverseArgs = args.map(function(arg) {
          if (typeof arg !== "object" || arg.constructor !== Object)
            return arg;
          const res = {};
          Object.keys(arg).forEach(function(key) {
            if (key == (key | 0))
              key |= 0;
            const value = arg[key];
            res[value] = key;
          });
          return res;
        });
      }
    };
    overrided.forEach(function(method) {
      Node.prototype[method] = function _overrided() {
        const state = this._baseState;
        throw new Error(method + " not implemented for encoding: " + state.enc);
      };
    });
    tags.forEach(function(tag) {
      Node.prototype[tag] = function _tagMethod() {
        const state = this._baseState;
        const args = Array.prototype.slice.call(arguments);
        assert(state.tag === null);
        state.tag = tag;
        this._useArgs(args);
        return this;
      };
    });
    Node.prototype.use = function use(item) {
      assert(item);
      const state = this._baseState;
      assert(state.use === null);
      state.use = item;
      return this;
    };
    Node.prototype.optional = function optional() {
      const state = this._baseState;
      state.optional = true;
      return this;
    };
    Node.prototype.def = function def(val) {
      const state = this._baseState;
      assert(state["default"] === null);
      state["default"] = val;
      state.optional = true;
      return this;
    };
    Node.prototype.explicit = function explicit(num) {
      const state = this._baseState;
      assert(state.explicit === null && state.implicit === null);
      state.explicit = num;
      return this;
    };
    Node.prototype.implicit = function implicit(num) {
      const state = this._baseState;
      assert(state.explicit === null && state.implicit === null);
      state.implicit = num;
      return this;
    };
    Node.prototype.obj = function obj() {
      const state = this._baseState;
      const args = Array.prototype.slice.call(arguments);
      state.obj = true;
      if (args.length !== 0)
        this._useArgs(args);
      return this;
    };
    Node.prototype.key = function key(newKey) {
      const state = this._baseState;
      assert(state.key === null);
      state.key = newKey;
      return this;
    };
    Node.prototype.any = function any() {
      const state = this._baseState;
      state.any = true;
      return this;
    };
    Node.prototype.choice = function choice(obj) {
      const state = this._baseState;
      assert(state.choice === null);
      state.choice = obj;
      this._useArgs(Object.keys(obj).map(function(key) {
        return obj[key];
      }));
      return this;
    };
    Node.prototype.contains = function contains(item) {
      const state = this._baseState;
      assert(state.use === null);
      state.contains = item;
      return this;
    };
    Node.prototype._decode = function decode(input, options) {
      const state = this._baseState;
      if (state.parent === null)
        return input.wrapResult(state.children[0]._decode(input, options));
      let result = state["default"];
      let present = true;
      let prevKey = null;
      if (state.key !== null)
        prevKey = input.enterKey(state.key);
      if (state.optional) {
        let tag = null;
        if (state.explicit !== null)
          tag = state.explicit;
        else if (state.implicit !== null)
          tag = state.implicit;
        else if (state.tag !== null)
          tag = state.tag;
        if (tag === null && !state.any) {
          const save = input.save();
          try {
            if (state.choice === null)
              this._decodeGeneric(state.tag, input, options);
            else
              this._decodeChoice(input, options);
            present = true;
          } catch (e) {
            present = false;
          }
          input.restore(save);
        } else {
          present = this._peekTag(input, tag, state.any);
          if (input.isError(present))
            return present;
        }
      }
      let prevObj;
      if (state.obj && present)
        prevObj = input.enterObject();
      if (present) {
        if (state.explicit !== null) {
          const explicit = this._decodeTag(input, state.explicit);
          if (input.isError(explicit))
            return explicit;
          input = explicit;
        }
        const start = input.offset;
        if (state.use === null && state.choice === null) {
          let save;
          if (state.any)
            save = input.save();
          const body = this._decodeTag(
            input,
            state.implicit !== null ? state.implicit : state.tag,
            state.any
          );
          if (input.isError(body))
            return body;
          if (state.any)
            result = input.raw(save);
          else
            input = body;
        }
        if (options && options.track && state.tag !== null)
          options.track(input.path(), start, input.length, "tagged");
        if (options && options.track && state.tag !== null)
          options.track(input.path(), input.offset, input.length, "content");
        if (state.any) {
        } else if (state.choice === null) {
          result = this._decodeGeneric(state.tag, input, options);
        } else {
          result = this._decodeChoice(input, options);
        }
        if (input.isError(result))
          return result;
        if (!state.any && state.choice === null && state.children !== null) {
          state.children.forEach(function decodeChildren(child) {
            child._decode(input, options);
          });
        }
        if (state.contains && (state.tag === "octstr" || state.tag === "bitstr")) {
          const data = new DecoderBuffer(result);
          result = this._getUse(state.contains, input._reporterState.obj)._decode(data, options);
        }
      }
      if (state.obj && present)
        result = input.leaveObject(prevObj);
      if (state.key !== null && (result !== null || present === true))
        input.leaveKey(prevKey, state.key, result);
      else if (prevKey !== null)
        input.exitKey(prevKey);
      return result;
    };
    Node.prototype._decodeGeneric = function decodeGeneric(tag, input, options) {
      const state = this._baseState;
      if (tag === "seq" || tag === "set")
        return null;
      if (tag === "seqof" || tag === "setof")
        return this._decodeList(input, tag, state.args[0], options);
      else if (/str$/.test(tag))
        return this._decodeStr(input, tag, options);
      else if (tag === "objid" && state.args)
        return this._decodeObjid(input, state.args[0], state.args[1], options);
      else if (tag === "objid")
        return this._decodeObjid(input, null, null, options);
      else if (tag === "gentime" || tag === "utctime")
        return this._decodeTime(input, tag, options);
      else if (tag === "null_")
        return this._decodeNull(input, options);
      else if (tag === "bool")
        return this._decodeBool(input, options);
      else if (tag === "objDesc")
        return this._decodeStr(input, tag, options);
      else if (tag === "int" || tag === "enum")
        return this._decodeInt(input, state.args && state.args[0], options);
      if (state.use !== null) {
        return this._getUse(state.use, input._reporterState.obj)._decode(input, options);
      } else {
        return input.error("unknown tag: " + tag);
      }
    };
    Node.prototype._getUse = function _getUse(entity, obj) {
      const state = this._baseState;
      state.useDecoder = this._use(entity, obj);
      assert(state.useDecoder._baseState.parent === null);
      state.useDecoder = state.useDecoder._baseState.children[0];
      if (state.implicit !== state.useDecoder._baseState.implicit) {
        state.useDecoder = state.useDecoder.clone();
        state.useDecoder._baseState.implicit = state.implicit;
      }
      return state.useDecoder;
    };
    Node.prototype._decodeChoice = function decodeChoice(input, options) {
      const state = this._baseState;
      let result = null;
      let match = false;
      Object.keys(state.choice).some(function(key) {
        const save = input.save();
        const node = state.choice[key];
        try {
          const value = node._decode(input, options);
          if (input.isError(value))
            return false;
          result = { type: key, value };
          match = true;
        } catch (e) {
          input.restore(save);
          return false;
        }
        return true;
      }, this);
      if (!match)
        return input.error("Choice not matched");
      return result;
    };
    Node.prototype._createEncoderBuffer = function createEncoderBuffer(data) {
      return new EncoderBuffer(data, this.reporter);
    };
    Node.prototype._encode = function encode(data, reporter, parent) {
      const state = this._baseState;
      if (state["default"] !== null && state["default"] === data)
        return;
      const result = this._encodeValue(data, reporter, parent);
      if (result === void 0)
        return;
      if (this._skipDefault(result, reporter, parent))
        return;
      return result;
    };
    Node.prototype._encodeValue = function encode(data, reporter, parent) {
      const state = this._baseState;
      if (state.parent === null)
        return state.children[0]._encode(data, reporter || new Reporter());
      let result = null;
      this.reporter = reporter;
      if (state.optional && data === void 0) {
        if (state["default"] !== null)
          data = state["default"];
        else
          return;
      }
      let content = null;
      let primitive = false;
      if (state.any) {
        result = this._createEncoderBuffer(data);
      } else if (state.choice) {
        result = this._encodeChoice(data, reporter);
      } else if (state.contains) {
        content = this._getUse(state.contains, parent)._encode(data, reporter);
        primitive = true;
      } else if (state.children) {
        content = state.children.map(function(child) {
          if (child._baseState.tag === "null_")
            return child._encode(null, reporter, data);
          if (child._baseState.key === null)
            return reporter.error("Child should have a key");
          const prevKey = reporter.enterKey(child._baseState.key);
          if (typeof data !== "object")
            return reporter.error("Child expected, but input is not object");
          const res = child._encode(data[child._baseState.key], reporter, data);
          reporter.leaveKey(prevKey);
          return res;
        }, this).filter(function(child) {
          return child;
        });
        content = this._createEncoderBuffer(content);
      } else {
        if (state.tag === "seqof" || state.tag === "setof") {
          if (!(state.args && state.args.length === 1))
            return reporter.error("Too many args for : " + state.tag);
          if (!Array.isArray(data))
            return reporter.error("seqof/setof, but data is not Array");
          const child = this.clone();
          child._baseState.implicit = null;
          content = this._createEncoderBuffer(data.map(function(item) {
            const state2 = this._baseState;
            return this._getUse(state2.args[0], data)._encode(item, reporter);
          }, child));
        } else if (state.use !== null) {
          result = this._getUse(state.use, parent)._encode(data, reporter);
        } else {
          content = this._encodePrimitive(state.tag, data);
          primitive = true;
        }
      }
      if (!state.any && state.choice === null) {
        const tag = state.implicit !== null ? state.implicit : state.tag;
        const cls = state.implicit === null ? "universal" : "context";
        if (tag === null) {
          if (state.use === null)
            reporter.error("Tag could be omitted only for .use()");
        } else {
          if (state.use === null)
            result = this._encodeComposite(tag, primitive, cls, content);
        }
      }
      if (state.explicit !== null)
        result = this._encodeComposite(state.explicit, false, "context", result);
      return result;
    };
    Node.prototype._encodeChoice = function encodeChoice(data, reporter) {
      const state = this._baseState;
      const node = state.choice[data.type];
      if (!node) {
        assert(
          false,
          data.type + " not found in " + JSON.stringify(Object.keys(state.choice))
        );
      }
      return node._encode(data.value, reporter);
    };
    Node.prototype._encodePrimitive = function encodePrimitive(tag, data) {
      const state = this._baseState;
      if (/str$/.test(tag))
        return this._encodeStr(data, tag);
      else if (tag === "objid" && state.args)
        return this._encodeObjid(data, state.reverseArgs[0], state.args[1]);
      else if (tag === "objid")
        return this._encodeObjid(data, null, null);
      else if (tag === "gentime" || tag === "utctime")
        return this._encodeTime(data, tag);
      else if (tag === "null_")
        return this._encodeNull();
      else if (tag === "int" || tag === "enum")
        return this._encodeInt(data, state.args && state.reverseArgs[0]);
      else if (tag === "bool")
        return this._encodeBool(data);
      else if (tag === "objDesc")
        return this._encodeStr(data, tag);
      else
        throw new Error("Unsupported tag: " + tag);
    };
    Node.prototype._isNumstr = function isNumstr(str) {
      return /^[0-9 ]*$/.test(str);
    };
    Node.prototype._isPrintstr = function isPrintstr(str) {
      return /^[A-Za-z0-9 '()+,-./:=?]*$/.test(str);
    };
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/der.js
var require_der = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/der.js"(exports) {
    "use strict";
    function reverse(map) {
      const res = {};
      Object.keys(map).forEach(function(key) {
        if ((key | 0) == key)
          key = key | 0;
        const value = map[key];
        res[value] = key;
      });
      return res;
    }
    exports.tagClass = {
      0: "universal",
      1: "application",
      2: "context",
      3: "private"
    };
    exports.tagClassByName = reverse(exports.tagClass);
    exports.tag = {
      0: "end",
      1: "bool",
      2: "int",
      3: "bitstr",
      4: "octstr",
      5: "null_",
      6: "objid",
      7: "objDesc",
      8: "external",
      9: "real",
      10: "enum",
      11: "embed",
      12: "utf8str",
      13: "relativeOid",
      16: "seq",
      17: "set",
      18: "numstr",
      19: "printstr",
      20: "t61str",
      21: "videostr",
      22: "ia5str",
      23: "utctime",
      24: "gentime",
      25: "graphstr",
      26: "iso646str",
      27: "genstr",
      28: "unistr",
      29: "charstr",
      30: "bmpstr"
    };
    exports.tagByName = reverse(exports.tag);
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/der.js
var require_der2 = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/der.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var Buffer2 = require_safer().Buffer;
    var Node = require_node();
    var der = require_der();
    function DEREncoder(entity) {
      this.enc = "der";
      this.name = entity.name;
      this.entity = entity;
      this.tree = new DERNode();
      this.tree._init(entity.body);
    }
    module.exports = DEREncoder;
    DEREncoder.prototype.encode = function encode(data, reporter) {
      return this.tree._encode(data, reporter).join();
    };
    function DERNode(parent) {
      Node.call(this, "der", parent);
    }
    inherits(DERNode, Node);
    DERNode.prototype._encodeComposite = function encodeComposite(tag, primitive, cls, content) {
      const encodedTag = encodeTag(tag, primitive, cls, this.reporter);
      if (content.length < 128) {
        const header2 = Buffer2.alloc(2);
        header2[0] = encodedTag;
        header2[1] = content.length;
        return this._createEncoderBuffer([header2, content]);
      }
      let lenOctets = 1;
      for (let i = content.length; i >= 256; i >>= 8)
        lenOctets++;
      const header = Buffer2.alloc(1 + 1 + lenOctets);
      header[0] = encodedTag;
      header[1] = 128 | lenOctets;
      for (let i = 1 + lenOctets, j = content.length; j > 0; i--, j >>= 8)
        header[i] = j & 255;
      return this._createEncoderBuffer([header, content]);
    };
    DERNode.prototype._encodeStr = function encodeStr(str, tag) {
      if (tag === "bitstr") {
        return this._createEncoderBuffer([str.unused | 0, str.data]);
      } else if (tag === "bmpstr") {
        const buf = Buffer2.alloc(str.length * 2);
        for (let i = 0; i < str.length; i++) {
          buf.writeUInt16BE(str.charCodeAt(i), i * 2);
        }
        return this._createEncoderBuffer(buf);
      } else if (tag === "numstr") {
        if (!this._isNumstr(str)) {
          return this.reporter.error("Encoding of string type: numstr supports only digits and space");
        }
        return this._createEncoderBuffer(str);
      } else if (tag === "printstr") {
        if (!this._isPrintstr(str)) {
          return this.reporter.error("Encoding of string type: printstr supports only latin upper and lower case letters, digits, space, apostrophe, left and rigth parenthesis, plus sign, comma, hyphen, dot, slash, colon, equal sign, question mark");
        }
        return this._createEncoderBuffer(str);
      } else if (/str$/.test(tag)) {
        return this._createEncoderBuffer(str);
      } else if (tag === "objDesc") {
        return this._createEncoderBuffer(str);
      } else {
        return this.reporter.error("Encoding of string type: " + tag + " unsupported");
      }
    };
    DERNode.prototype._encodeObjid = function encodeObjid(id, values, relative) {
      if (typeof id === "string") {
        if (!values)
          return this.reporter.error("string objid given, but no values map found");
        if (!values.hasOwnProperty(id))
          return this.reporter.error("objid not found in values map");
        id = values[id].split(/[\s.]+/g);
        for (let i = 0; i < id.length; i++)
          id[i] |= 0;
      } else if (Array.isArray(id)) {
        id = id.slice();
        for (let i = 0; i < id.length; i++)
          id[i] |= 0;
      }
      if (!Array.isArray(id)) {
        return this.reporter.error("objid() should be either array or string, got: " + JSON.stringify(id));
      }
      if (!relative) {
        if (id[1] >= 40)
          return this.reporter.error("Second objid identifier OOB");
        id.splice(0, 2, id[0] * 40 + id[1]);
      }
      let size = 0;
      for (let i = 0; i < id.length; i++) {
        let ident = id[i];
        for (size++; ident >= 128; ident >>= 7)
          size++;
      }
      const objid = Buffer2.alloc(size);
      let offset = objid.length - 1;
      for (let i = id.length - 1; i >= 0; i--) {
        let ident = id[i];
        objid[offset--] = ident & 127;
        while ((ident >>= 7) > 0)
          objid[offset--] = 128 | ident & 127;
      }
      return this._createEncoderBuffer(objid);
    };
    function two(num) {
      if (num < 10)
        return "0" + num;
      else
        return num;
    }
    DERNode.prototype._encodeTime = function encodeTime(time, tag) {
      let str;
      const date = new Date(time);
      if (tag === "gentime") {
        str = [
          two(date.getUTCFullYear()),
          two(date.getUTCMonth() + 1),
          two(date.getUTCDate()),
          two(date.getUTCHours()),
          two(date.getUTCMinutes()),
          two(date.getUTCSeconds()),
          "Z"
        ].join("");
      } else if (tag === "utctime") {
        str = [
          two(date.getUTCFullYear() % 100),
          two(date.getUTCMonth() + 1),
          two(date.getUTCDate()),
          two(date.getUTCHours()),
          two(date.getUTCMinutes()),
          two(date.getUTCSeconds()),
          "Z"
        ].join("");
      } else {
        this.reporter.error("Encoding " + tag + " time is not supported yet");
      }
      return this._encodeStr(str, "octstr");
    };
    DERNode.prototype._encodeNull = function encodeNull() {
      return this._createEncoderBuffer("");
    };
    DERNode.prototype._encodeInt = function encodeInt(num, values) {
      if (typeof num === "string") {
        if (!values)
          return this.reporter.error("String int or enum given, but no values map");
        if (!values.hasOwnProperty(num)) {
          return this.reporter.error("Values map doesn't contain: " + JSON.stringify(num));
        }
        num = values[num];
      }
      if (typeof num !== "number" && !Buffer2.isBuffer(num)) {
        const numArray = num.toArray();
        if (!num.sign && numArray[0] & 128) {
          numArray.unshift(0);
        }
        num = Buffer2.from(numArray);
      }
      if (Buffer2.isBuffer(num)) {
        let size2 = num.length;
        if (num.length === 0)
          size2++;
        const out2 = Buffer2.alloc(size2);
        num.copy(out2);
        if (num.length === 0)
          out2[0] = 0;
        return this._createEncoderBuffer(out2);
      }
      if (num < 128)
        return this._createEncoderBuffer(num);
      if (num < 256)
        return this._createEncoderBuffer([0, num]);
      let size = 1;
      for (let i = num; i >= 256; i >>= 8)
        size++;
      const out = new Array(size);
      for (let i = out.length - 1; i >= 0; i--) {
        out[i] = num & 255;
        num >>= 8;
      }
      if (out[0] & 128) {
        out.unshift(0);
      }
      return this._createEncoderBuffer(Buffer2.from(out));
    };
    DERNode.prototype._encodeBool = function encodeBool(value) {
      return this._createEncoderBuffer(value ? 255 : 0);
    };
    DERNode.prototype._use = function use(entity, obj) {
      if (typeof entity === "function")
        entity = entity(obj);
      return entity._getEncoder("der").tree;
    };
    DERNode.prototype._skipDefault = function skipDefault(dataBuffer, reporter, parent) {
      const state = this._baseState;
      let i;
      if (state["default"] === null)
        return false;
      const data = dataBuffer.join();
      if (state.defaultBuffer === void 0)
        state.defaultBuffer = this._encodeValue(state["default"], reporter, parent).join();
      if (data.length !== state.defaultBuffer.length)
        return false;
      for (i = 0; i < data.length; i++)
        if (data[i] !== state.defaultBuffer[i])
          return false;
      return true;
    };
    function encodeTag(tag, primitive, cls, reporter) {
      let res;
      if (tag === "seqof")
        tag = "seq";
      else if (tag === "setof")
        tag = "set";
      if (der.tagByName.hasOwnProperty(tag))
        res = der.tagByName[tag];
      else if (typeof tag === "number" && (tag | 0) === tag)
        res = tag;
      else
        return reporter.error("Unknown tag: " + tag);
      if (res >= 31)
        return reporter.error("Multi-octet tag encoding unsupported");
      if (!primitive)
        res |= 32;
      res |= der.tagClassByName[cls || "universal"] << 6;
      return res;
    }
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/pem.js
var require_pem = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/pem.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var DEREncoder = require_der2();
    function PEMEncoder(entity) {
      DEREncoder.call(this, entity);
      this.enc = "pem";
    }
    inherits(PEMEncoder, DEREncoder);
    module.exports = PEMEncoder;
    PEMEncoder.prototype.encode = function encode(data, options) {
      const buf = DEREncoder.prototype.encode.call(this, data);
      const p = buf.toString("base64");
      const out = ["-----BEGIN " + options.label + "-----"];
      for (let i = 0; i < p.length; i += 64)
        out.push(p.slice(i, i + 64));
      out.push("-----END " + options.label + "-----");
      return out.join("\n");
    };
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/index.js
var require_encoders = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/encoders/index.js"(exports) {
    "use strict";
    var encoders = exports;
    encoders.der = require_der2();
    encoders.pem = require_pem();
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/der.js
var require_der3 = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/der.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var bignum = require_bn();
    var DecoderBuffer = require_buffer().DecoderBuffer;
    var Node = require_node();
    var der = require_der();
    function DERDecoder(entity) {
      this.enc = "der";
      this.name = entity.name;
      this.entity = entity;
      this.tree = new DERNode();
      this.tree._init(entity.body);
    }
    module.exports = DERDecoder;
    DERDecoder.prototype.decode = function decode(data, options) {
      if (!DecoderBuffer.isDecoderBuffer(data)) {
        data = new DecoderBuffer(data, options);
      }
      return this.tree._decode(data, options);
    };
    function DERNode(parent) {
      Node.call(this, "der", parent);
    }
    inherits(DERNode, Node);
    DERNode.prototype._peekTag = function peekTag(buffer, tag, any) {
      if (buffer.isEmpty())
        return false;
      const state = buffer.save();
      const decodedTag = derDecodeTag(buffer, 'Failed to peek tag: "' + tag + '"');
      if (buffer.isError(decodedTag))
        return decodedTag;
      buffer.restore(state);
      return decodedTag.tag === tag || decodedTag.tagStr === tag || decodedTag.tagStr + "of" === tag || any;
    };
    DERNode.prototype._decodeTag = function decodeTag(buffer, tag, any) {
      const decodedTag = derDecodeTag(
        buffer,
        'Failed to decode tag of "' + tag + '"'
      );
      if (buffer.isError(decodedTag))
        return decodedTag;
      let len = derDecodeLen(
        buffer,
        decodedTag.primitive,
        'Failed to get length of "' + tag + '"'
      );
      if (buffer.isError(len))
        return len;
      if (!any && decodedTag.tag !== tag && decodedTag.tagStr !== tag && decodedTag.tagStr + "of" !== tag) {
        return buffer.error('Failed to match tag: "' + tag + '"');
      }
      if (decodedTag.primitive || len !== null)
        return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
      const state = buffer.save();
      const res = this._skipUntilEnd(
        buffer,
        'Failed to skip indefinite length body: "' + this.tag + '"'
      );
      if (buffer.isError(res))
        return res;
      len = buffer.offset - state.offset;
      buffer.restore(state);
      return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
    };
    DERNode.prototype._skipUntilEnd = function skipUntilEnd(buffer, fail) {
      for (; ; ) {
        const tag = derDecodeTag(buffer, fail);
        if (buffer.isError(tag))
          return tag;
        const len = derDecodeLen(buffer, tag.primitive, fail);
        if (buffer.isError(len))
          return len;
        let res;
        if (tag.primitive || len !== null)
          res = buffer.skip(len);
        else
          res = this._skipUntilEnd(buffer, fail);
        if (buffer.isError(res))
          return res;
        if (tag.tagStr === "end")
          break;
      }
    };
    DERNode.prototype._decodeList = function decodeList(buffer, tag, decoder, options) {
      const result = [];
      while (!buffer.isEmpty()) {
        const possibleEnd = this._peekTag(buffer, "end");
        if (buffer.isError(possibleEnd))
          return possibleEnd;
        const res = decoder.decode(buffer, "der", options);
        if (buffer.isError(res) && possibleEnd)
          break;
        result.push(res);
      }
      return result;
    };
    DERNode.prototype._decodeStr = function decodeStr(buffer, tag) {
      if (tag === "bitstr") {
        const unused = buffer.readUInt8();
        if (buffer.isError(unused))
          return unused;
        return { unused, data: buffer.raw() };
      } else if (tag === "bmpstr") {
        const raw = buffer.raw();
        if (raw.length % 2 === 1)
          return buffer.error("Decoding of string type: bmpstr length mismatch");
        let str = "";
        for (let i = 0; i < raw.length / 2; i++) {
          str += String.fromCharCode(raw.readUInt16BE(i * 2));
        }
        return str;
      } else if (tag === "numstr") {
        const numstr = buffer.raw().toString("ascii");
        if (!this._isNumstr(numstr)) {
          return buffer.error("Decoding of string type: numstr unsupported characters");
        }
        return numstr;
      } else if (tag === "octstr") {
        return buffer.raw();
      } else if (tag === "objDesc") {
        return buffer.raw();
      } else if (tag === "printstr") {
        const printstr = buffer.raw().toString("ascii");
        if (!this._isPrintstr(printstr)) {
          return buffer.error("Decoding of string type: printstr unsupported characters");
        }
        return printstr;
      } else if (/str$/.test(tag)) {
        return buffer.raw().toString();
      } else {
        return buffer.error("Decoding of string type: " + tag + " unsupported");
      }
    };
    DERNode.prototype._decodeObjid = function decodeObjid(buffer, values, relative) {
      let result;
      const identifiers = [];
      let ident = 0;
      let subident = 0;
      while (!buffer.isEmpty()) {
        subident = buffer.readUInt8();
        ident <<= 7;
        ident |= subident & 127;
        if ((subident & 128) === 0) {
          identifiers.push(ident);
          ident = 0;
        }
      }
      if (subident & 128)
        identifiers.push(ident);
      const first = identifiers[0] / 40 | 0;
      const second = identifiers[0] % 40;
      if (relative)
        result = identifiers;
      else
        result = [first, second].concat(identifiers.slice(1));
      if (values) {
        let tmp = values[result.join(" ")];
        if (tmp === void 0)
          tmp = values[result.join(".")];
        if (tmp !== void 0)
          result = tmp;
      }
      return result;
    };
    DERNode.prototype._decodeTime = function decodeTime(buffer, tag) {
      const str = buffer.raw().toString();
      let year;
      let mon;
      let day;
      let hour;
      let min;
      let sec;
      if (tag === "gentime") {
        year = str.slice(0, 4) | 0;
        mon = str.slice(4, 6) | 0;
        day = str.slice(6, 8) | 0;
        hour = str.slice(8, 10) | 0;
        min = str.slice(10, 12) | 0;
        sec = str.slice(12, 14) | 0;
      } else if (tag === "utctime") {
        year = str.slice(0, 2) | 0;
        mon = str.slice(2, 4) | 0;
        day = str.slice(4, 6) | 0;
        hour = str.slice(6, 8) | 0;
        min = str.slice(8, 10) | 0;
        sec = str.slice(10, 12) | 0;
        if (year < 70)
          year = 2e3 + year;
        else
          year = 1900 + year;
      } else {
        return buffer.error("Decoding " + tag + " time is not supported yet");
      }
      return Date.UTC(year, mon - 1, day, hour, min, sec, 0);
    };
    DERNode.prototype._decodeNull = function decodeNull() {
      return null;
    };
    DERNode.prototype._decodeBool = function decodeBool(buffer) {
      const res = buffer.readUInt8();
      if (buffer.isError(res))
        return res;
      else
        return res !== 0;
    };
    DERNode.prototype._decodeInt = function decodeInt(buffer, values) {
      const raw = buffer.raw();
      let res = new bignum(raw);
      if (values)
        res = values[res.toString(10)] || res;
      return res;
    };
    DERNode.prototype._use = function use(entity, obj) {
      if (typeof entity === "function")
        entity = entity(obj);
      return entity._getDecoder("der").tree;
    };
    function derDecodeTag(buf, fail) {
      let tag = buf.readUInt8(fail);
      if (buf.isError(tag))
        return tag;
      const cls = der.tagClass[tag >> 6];
      const primitive = (tag & 32) === 0;
      if ((tag & 31) === 31) {
        let oct = tag;
        tag = 0;
        while ((oct & 128) === 128) {
          oct = buf.readUInt8(fail);
          if (buf.isError(oct))
            return oct;
          tag <<= 7;
          tag |= oct & 127;
        }
      } else {
        tag &= 31;
      }
      const tagStr = der.tag[tag];
      return {
        cls,
        primitive,
        tag,
        tagStr
      };
    }
    function derDecodeLen(buf, primitive, fail) {
      let len = buf.readUInt8(fail);
      if (buf.isError(len))
        return len;
      if (!primitive && len === 128)
        return null;
      if ((len & 128) === 0) {
        return len;
      }
      const num = len & 127;
      if (num > 4)
        return buf.error("length octect is too long");
      len = 0;
      for (let i = 0; i < num; i++) {
        len <<= 8;
        const j = buf.readUInt8(fail);
        if (buf.isError(j))
          return j;
        len |= j;
      }
      return len;
    }
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/pem.js
var require_pem2 = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/pem.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var Buffer2 = require_safer().Buffer;
    var DERDecoder = require_der3();
    function PEMDecoder(entity) {
      DERDecoder.call(this, entity);
      this.enc = "pem";
    }
    inherits(PEMDecoder, DERDecoder);
    module.exports = PEMDecoder;
    PEMDecoder.prototype.decode = function decode(data, options) {
      const lines = data.toString().split(/[\r\n]+/g);
      const label = options.label.toUpperCase();
      const re = /^-----(BEGIN|END) ([^-]+)-----$/;
      let start = -1;
      let end = -1;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(re);
        if (match === null)
          continue;
        if (match[2] !== label)
          continue;
        if (start === -1) {
          if (match[1] !== "BEGIN")
            break;
          start = i;
        } else {
          if (match[1] !== "END")
            break;
          end = i;
          break;
        }
      }
      if (start === -1 || end === -1)
        throw new Error("PEM section not found for: " + label);
      const base64 = lines.slice(start + 1, end).join("");
      base64.replace(/[^a-z0-9+/=]+/gi, "");
      const input = Buffer2.from(base64, "base64");
      return DERDecoder.prototype.decode.call(this, input, options);
    };
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/index.js
var require_decoders = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/decoders/index.js"(exports) {
    "use strict";
    var decoders = exports;
    decoders.der = require_der3();
    decoders.pem = require_pem2();
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/api.js
var require_api = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/api.js"(exports) {
    "use strict";
    var encoders = require_encoders();
    var decoders = require_decoders();
    var inherits = require_inherits();
    var api = exports;
    api.define = function define(name, body) {
      return new Entity(name, body);
    };
    function Entity(name, body) {
      this.name = name;
      this.body = body;
      this.decoders = {};
      this.encoders = {};
    }
    Entity.prototype._createNamed = function createNamed(Base) {
      const name = this.name;
      function Generated(entity) {
        this._initNamed(entity, name);
      }
      inherits(Generated, Base);
      Generated.prototype._initNamed = function _initNamed(entity, name2) {
        Base.call(this, entity, name2);
      };
      return new Generated(this);
    };
    Entity.prototype._getDecoder = function _getDecoder(enc) {
      enc = enc || "der";
      if (!this.decoders.hasOwnProperty(enc))
        this.decoders[enc] = this._createNamed(decoders[enc]);
      return this.decoders[enc];
    };
    Entity.prototype.decode = function decode(data, enc, options) {
      return this._getDecoder(enc).decode(data, options);
    };
    Entity.prototype._getEncoder = function _getEncoder(enc) {
      enc = enc || "der";
      if (!this.encoders.hasOwnProperty(enc))
        this.encoders[enc] = this._createNamed(encoders[enc]);
      return this.encoders[enc];
    };
    Entity.prototype.encode = function encode(data, enc, reporter) {
      return this._getEncoder(enc).encode(data, reporter);
    };
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/index.js
var require_base = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/base/index.js"(exports) {
    "use strict";
    var base = exports;
    base.Reporter = require_reporter().Reporter;
    base.DecoderBuffer = require_buffer().DecoderBuffer;
    base.EncoderBuffer = require_buffer().EncoderBuffer;
    base.Node = require_node();
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/index.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1/constants/index.js"(exports) {
    "use strict";
    var constants = exports;
    constants._reverse = function reverse(map) {
      const res = {};
      Object.keys(map).forEach(function(key) {
        if ((key | 0) == key)
          key = key | 0;
        const value = map[key];
        res[value] = key;
      });
      return res;
    };
    constants.der = require_der();
  }
});

// ../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1.js
var require_asn1 = __commonJS({
  "../../node_modules/.pnpm/asn1.js@5.4.1/node_modules/asn1.js/lib/asn1.js"(exports) {
    "use strict";
    var asn1 = exports;
    asn1.bignum = require_bn();
    asn1.define = require_api().define;
    asn1.base = require_base();
    asn1.constants = require_constants();
    asn1.decoders = require_decoders();
    asn1.encoders = require_encoders();
  }
});

// ../../node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "../../node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/data-stream.js
var require_data_stream = __commonJS({
  "../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/data-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var Stream = __require("stream");
    var util2 = __require("util");
    function DataStream(data) {
      this.buffer = null;
      this.writable = true;
      this.readable = true;
      if (!data) {
        this.buffer = Buffer2.alloc(0);
        return this;
      }
      if (typeof data.pipe === "function") {
        this.buffer = Buffer2.alloc(0);
        data.pipe(this);
        return this;
      }
      if (data.length || typeof data === "object") {
        this.buffer = data;
        this.writable = false;
        process.nextTick(function() {
          this.emit("end", data);
          this.readable = false;
          this.emit("close");
        }.bind(this));
        return this;
      }
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util2.inherits(DataStream, Stream);
    DataStream.prototype.write = function write(data) {
      this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]);
      this.emit("data", data);
    };
    DataStream.prototype.end = function end(data) {
      if (data)
        this.write(data);
      this.emit("end", data);
      this.emit("close");
      this.writable = false;
      this.readable = false;
    };
    module.exports = DataStream;
  }
});

// ../../node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "../../node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module.exports = getParamBytesForAlg;
  }
});

// ../../node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "../../node_modules/.pnpm/ecdsa-sig-formatter@1.0.11/node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var getParamBytesForAlg = require_param_bytes_for_alg();
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer2.isBuffer(signature)) {
        return signature;
      } else if ("string" === typeof signature) {
        return Buffer2.from(signature, "base64");
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var maxEncodedParamLength = paramBytes + 1;
      var inputLength = signature.length;
      var offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
      var dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
      dst = dst.toString("base64");
      dst = base64Url(dst);
      return dst;
    }
    function countPadding(buf, start, stop) {
      var padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      var needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes);
      var sPadding = countPadding(signature, paramBytes, signature.length);
      var rLength = paramBytes - rPadding;
      var sLength = paramBytes - sPadding;
      var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      var shortLength = rsBytes < MAX_OCTET;
      var dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      var offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
      } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
      } else {
        signature.copy(dst, offset, paramBytes + sPadding);
      }
      return dst;
    }
    module.exports = {
      derToJose,
      joseToDer
    };
  }
});

// ../../node_modules/.pnpm/buffer-equal-constant-time@1.0.1/node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "../../node_modules/.pnpm/buffer-equal-constant-time@1.0.1/node_modules/buffer-equal-constant-time/index.js"(exports, module) {
    "use strict";
    var Buffer2 = __require("buffer").Buffer;
    var SlowBuffer = __require("buffer").SlowBuffer;
    module.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      var c = 0;
      for (var i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer2.prototype.equal;
    var origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer2.prototype.equal = origBufEqual;
      SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// ../../node_modules/.pnpm/jwa@2.0.1/node_modules/jwa/index.js
var require_jwa = __commonJS({
  "../../node_modules/.pnpm/jwa@2.0.1/node_modules/jwa/index.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto3 = __require("crypto");
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util2 = __require("util");
    var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
    var MSG_INVALID_SECRET = "secret must be a string or buffer";
    var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
    var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
    var supportsKeyObjects = typeof crypto3.createPublicKey === "function";
    if (supportsKeyObjects) {
      MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
      MSG_INVALID_SECRET += "or a KeyObject";
    }
    function checkIsPublicKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.type !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.asymmetricKeyType !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
    function checkIsPrivateKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (typeof key === "object") {
        return;
      }
      throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return key;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (key.type !== "secret") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase64(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4) {
        for (var i = 0; i < padding; ++i) {
          base64url += "=";
        }
      }
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1);
      var errMsg = util2.format.bind(util2, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer2.isBuffer(obj) || typeof obj === "string";
    }
    function normalizeInput(thing) {
      if (!bufferOrString(thing))
        thing = JSON.stringify(thing);
      return thing;
    }
    function createHmacSigner(bits) {
      return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto3.createHmac("sha" + bits, secret);
        var sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual;
    var timingSafeEqual2 = "timingSafeEqual" in crypto3 ? function timingSafeEqual3(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      return crypto3.timingSafeEqual(a, b);
    } : function timingSafeEqual3(a, b) {
      if (!bufferEqual) {
        bufferEqual = require_buffer_equal_constant_time();
      }
      return bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual2(Buffer2.from(signature), Buffer2.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto3.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto3.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto3.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto3.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto3.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto3.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify({
          key: publicKey,
          padding: crypto3.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto3.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, "ES" + bits);
        return signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function sign() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function verify(thing, signature) {
        return signature === "";
      };
    }
    module.exports = function jwa(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      };
      var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      };
      var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match[1] || match[3]).toLowerCase();
      var bits = match[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/tostring.js"(exports, module) {
    var Buffer2 = __require("buffer").Buffer;
    module.exports = function toString(obj) {
      if (typeof obj === "string")
        return obj;
      if (typeof obj === "number" || Buffer2.isBuffer(obj))
        return obj.toString();
      return JSON.stringify(obj);
    };
  }
});

// ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/sign-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util2 = __require("util");
    function base64url(string, encoding) {
      return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary");
      var encodedPayload = base64url(toString(payload), encoding);
      return util2.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header;
      var payload = opts.payload;
      var secretOrKey = opts.secret || opts.privateKey;
      var encoding = opts.encoding;
      var algo = jwa(header.alg);
      var securedInput = jwsSecuredInput(header, payload, encoding);
      var signature = algo.sign(securedInput, secretOrKey);
      return util2.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret;
      secret = secret == null ? opts.privateKey : secret;
      secret = secret == null ? opts.key : secret;
      if (/^hs/i.test(opts.header.alg) === true && secret == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secret);
      this.readable = true;
      this.header = opts.header;
      this.encoding = opts.encoding;
      this.secret = this.privateKey = this.key = secretStream;
      this.payload = new DataStream(opts.payload);
      this.secret.once("close", function() {
        if (!this.payload.writable && this.readable)
          this.sign();
      }.bind(this));
      this.payload.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.sign();
      }.bind(this));
    }
    util2.inherits(SignStream, Stream);
    SignStream.prototype.sign = function sign() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        this.emit("done", signature);
        this.emit("data", signature);
        this.emit("end");
        this.readable = false;
        return signature;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module.exports = SignStream;
  }
});

// ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/lib/verify-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util2 = __require("util");
    var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch (e) {
        return void 0;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer2.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig);
      var securedInput = securedInputFromJWS(jwsSig);
      var algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      opts = opts || {};
      jwsSig = toString(jwsSig);
      if (!isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      if (header.typ === "JWT" || opts.json)
        payload = JSON.parse(payload, opts.encoding);
      return {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret;
      secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
      secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
      if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secretOrKey);
      this.readable = true;
      this.algorithm = opts.algorithm;
      this.encoding = opts.encoding;
      this.secret = this.publicKey = this.key = secretStream;
      this.signature = new DataStream(opts.signature);
      this.secret.once("close", function() {
        if (!this.signature.writable && this.readable)
          this.verify();
      }.bind(this));
      this.signature.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.verify();
      }.bind(this));
    }
    util2.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function verify() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit("done", valid, obj);
        this.emit("data", valid);
        this.emit("end");
        this.readable = false;
        return valid;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module.exports = VerifyStream;
  }
});

// ../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/index.js
var require_jws = __commonJS({
  "../../node_modules/.pnpm/jws@4.0.1/node_modules/jws/index.js"(exports) {
    var SignStream = require_sign_stream();
    var VerifyStream = require_verify_stream();
    var ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports.ALGORITHMS = ALGORITHMS;
    exports.sign = SignStream.sign;
    exports.verify = VerifyStream.verify;
    exports.decode = VerifyStream.decode;
    exports.isValid = VerifyStream.isValid;
    exports.createSign = function createSign(opts) {
      return new SignStream(opts);
    };
    exports.createVerify = function createVerify(opts) {
      return new VerifyStream(opts);
    };
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-constants.js
var require_web_push_constants = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-constants.js"(exports, module) {
    "use strict";
    var WebPushConstants = {};
    WebPushConstants.supportedContentEncodings = {
      AES_GCM: "aesgcm",
      AES_128_GCM: "aes128gcm"
    };
    WebPushConstants.supportedUrgency = {
      VERY_LOW: "very-low",
      LOW: "low",
      NORMAL: "normal",
      HIGH: "high"
    };
    module.exports = WebPushConstants;
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/urlsafe-base64-helper.js
var require_urlsafe_base64_helper = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/urlsafe-base64-helper.js"(exports, module) {
    "use strict";
    function validate(base64) {
      return /^[A-Za-z0-9\-_]+$/.test(base64);
    }
    module.exports = {
      validate
    };
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/vapid-helper.js
var require_vapid_helper = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/vapid-helper.js"(exports, module) {
    "use strict";
    var crypto3 = __require("crypto");
    var asn1 = require_asn1();
    var jws = require_jws();
    var { URL: URL2 } = __require("url");
    var WebPushConstants = require_web_push_constants();
    var urlBase64Helper = require_urlsafe_base64_helper();
    var DEFAULT_EXPIRATION_SECONDS = 12 * 60 * 60;
    var MAX_EXPIRATION_SECONDS = 24 * 60 * 60;
    var ECPrivateKeyASN = asn1.define("ECPrivateKey", function() {
      this.seq().obj(
        this.key("version").int(),
        this.key("privateKey").octstr(),
        this.key("parameters").explicit(0).objid().optional(),
        this.key("publicKey").explicit(1).bitstr().optional()
      );
    });
    function toPEM(key) {
      return ECPrivateKeyASN.encode({
        version: 1,
        privateKey: key,
        parameters: [1, 2, 840, 10045, 3, 1, 7]
        // prime256v1
      }, "pem", {
        label: "EC PRIVATE KEY"
      });
    }
    function generateVAPIDKeys() {
      const curve = crypto3.createECDH("prime256v1");
      curve.generateKeys();
      let publicKeyBuffer = curve.getPublicKey();
      let privateKeyBuffer = curve.getPrivateKey();
      if (privateKeyBuffer.length < 32) {
        const padding = Buffer.alloc(32 - privateKeyBuffer.length);
        padding.fill(0);
        privateKeyBuffer = Buffer.concat([padding, privateKeyBuffer]);
      }
      if (publicKeyBuffer.length < 65) {
        const padding = Buffer.alloc(65 - publicKeyBuffer.length);
        padding.fill(0);
        publicKeyBuffer = Buffer.concat([padding, publicKeyBuffer]);
      }
      return {
        publicKey: publicKeyBuffer.toString("base64url"),
        privateKey: privateKeyBuffer.toString("base64url")
      };
    }
    function validateSubject(subject) {
      if (!subject) {
        throw new Error("No subject set in vapidDetails.subject.");
      }
      if (typeof subject !== "string" || subject.length === 0) {
        throw new Error("The subject value must be a string containing an https: URL or mailto: address. " + subject);
      }
      let subjectParseResult = null;
      try {
        subjectParseResult = new URL2(subject);
      } catch (err) {
        throw new Error("Vapid subject is not a valid URL. " + subject);
      }
      if (!["https:", "mailto:"].includes(subjectParseResult.protocol)) {
        throw new Error("Vapid subject is not an https: or mailto: URL. " + subject);
      }
      if (subjectParseResult.hostname === "localhost") {
        console.warn("Vapid subject points to a localhost web URI, which is unsupported by Apple's push notification server and will result in a BadJwtToken error when sending notifications.");
      }
    }
    function validatePublicKey(publicKey) {
      if (!publicKey) {
        throw new Error("No key set vapidDetails.publicKey");
      }
      if (typeof publicKey !== "string") {
        throw new Error("Vapid public key is must be a URL safe Base 64 encoded string.");
      }
      if (!urlBase64Helper.validate(publicKey)) {
        throw new Error('Vapid public key must be a URL safe Base 64 (without "=")');
      }
      publicKey = Buffer.from(publicKey, "base64url");
      if (publicKey.length !== 65) {
        throw new Error("Vapid public key should be 65 bytes long when decoded.");
      }
    }
    function validatePrivateKey(privateKey) {
      if (!privateKey) {
        throw new Error("No key set in vapidDetails.privateKey");
      }
      if (typeof privateKey !== "string") {
        throw new Error("Vapid private key must be a URL safe Base 64 encoded string.");
      }
      if (!urlBase64Helper.validate(privateKey)) {
        throw new Error('Vapid private key must be a URL safe Base 64 (without "=")');
      }
      privateKey = Buffer.from(privateKey, "base64url");
      if (privateKey.length !== 32) {
        throw new Error("Vapid private key should be 32 bytes long when decoded.");
      }
    }
    function getFutureExpirationTimestamp(numSeconds) {
      const futureExp = /* @__PURE__ */ new Date();
      futureExp.setSeconds(futureExp.getSeconds() + numSeconds);
      return Math.floor(futureExp.getTime() / 1e3);
    }
    function validateExpiration(expiration) {
      if (!Number.isInteger(expiration)) {
        throw new Error("`expiration` value must be a number");
      }
      if (expiration < 0) {
        throw new Error("`expiration` must be a positive integer");
      }
      const maxExpirationTimestamp = getFutureExpirationTimestamp(MAX_EXPIRATION_SECONDS);
      if (expiration >= maxExpirationTimestamp) {
        throw new Error("`expiration` value is greater than maximum of 24 hours");
      }
    }
    function getVapidHeaders(audience, subject, publicKey, privateKey, contentEncoding, expiration) {
      if (!audience) {
        throw new Error("No audience could be generated for VAPID.");
      }
      if (typeof audience !== "string" || audience.length === 0) {
        throw new Error("The audience value must be a string containing the origin of a push service. " + audience);
      }
      try {
        new URL2(audience);
      } catch (err) {
        throw new Error("VAPID audience is not a url. " + audience);
      }
      validateSubject(subject);
      validatePublicKey(publicKey);
      validatePrivateKey(privateKey);
      privateKey = Buffer.from(privateKey, "base64url");
      if (expiration) {
        validateExpiration(expiration);
      } else {
        expiration = getFutureExpirationTimestamp(DEFAULT_EXPIRATION_SECONDS);
      }
      const header = {
        typ: "JWT",
        alg: "ES256"
      };
      const jwtPayload = {
        aud: audience,
        exp: expiration,
        sub: subject
      };
      const jwt = jws.sign({
        header,
        payload: jwtPayload,
        privateKey: toPEM(privateKey)
      });
      if (contentEncoding === WebPushConstants.supportedContentEncodings.AES_128_GCM) {
        return {
          Authorization: "vapid t=" + jwt + ", k=" + publicKey
        };
      }
      if (contentEncoding === WebPushConstants.supportedContentEncodings.AES_GCM) {
        return {
          Authorization: "WebPush " + jwt,
          "Crypto-Key": "p256ecdsa=" + publicKey
        };
      }
      throw new Error("Unsupported encoding type specified.");
    }
    module.exports = {
      generateVAPIDKeys,
      getFutureExpirationTimestamp,
      getVapidHeaders,
      validateSubject,
      validatePublicKey,
      validatePrivateKey,
      validateExpiration
    };
  }
});

// ../../node_modules/.pnpm/http_ece@1.2.0/node_modules/http_ece/ece.js
var require_ece = __commonJS({
  "../../node_modules/.pnpm/http_ece@1.2.0/node_modules/http_ece/ece.js"(exports, module) {
    "use strict";
    var crypto3 = __require("crypto");
    var AES_GCM = "aes-128-gcm";
    var PAD_SIZE = { "aes128gcm": 1, "aesgcm": 2 };
    var TAG_LENGTH = 16;
    var KEY_LENGTH = 16;
    var NONCE_LENGTH = 12;
    var SHA_256_LENGTH = 32;
    var MODE_ENCRYPT = "encrypt";
    var MODE_DECRYPT = "decrypt";
    var keylog;
    if (process.env.ECE_KEYLOG === "1") {
      keylog = function(m, k) {
        console.warn(m + " [" + k.length + "]: " + k.toString("base64url"));
        return k;
      };
    } else {
      keylog = function(m, k) {
        return k;
      };
    }
    function decode(b) {
      if (typeof b === "string") {
        return Buffer.from(b, "base64url");
      }
      return b;
    }
    function HMAC_hash(key, input) {
      var hmac = crypto3.createHmac("sha256", key);
      hmac.update(input);
      return hmac.digest();
    }
    function HKDF_extract(salt, ikm) {
      keylog("salt", salt);
      keylog("ikm", ikm);
      return keylog("extract", HMAC_hash(salt, ikm));
    }
    function HKDF_expand(prk, info2, l) {
      keylog("prk", prk);
      keylog("info", info2);
      var output = Buffer.alloc(0);
      var T = Buffer.alloc(0);
      info2 = Buffer.from(info2, "ascii");
      var counter = 0;
      var cbuf = Buffer.alloc(1);
      while (output.length < l) {
        cbuf.writeUIntBE(++counter, 0, 1);
        T = HMAC_hash(prk, Buffer.concat([T, info2, cbuf]));
        output = Buffer.concat([output, T]);
      }
      return keylog("expand", output.slice(0, l));
    }
    function HKDF(salt, ikm, info2, len) {
      return HKDF_expand(HKDF_extract(salt, ikm), info2, len);
    }
    function info(base, context) {
      var result = Buffer.concat([
        Buffer.from("Content-Encoding: " + base + "\0", "ascii"),
        context
      ]);
      keylog("info " + base, result);
      return result;
    }
    function lengthPrefix(buffer) {
      var b = Buffer.concat([Buffer.alloc(2), buffer]);
      b.writeUIntBE(buffer.length, 0, 2);
      return b;
    }
    function extractDH(header, mode) {
      var key = header.privateKey;
      var senderPubKey, receiverPubKey;
      if (mode === MODE_ENCRYPT) {
        senderPubKey = key.getPublicKey();
        receiverPubKey = header.dh;
      } else if (mode === MODE_DECRYPT) {
        senderPubKey = header.dh;
        receiverPubKey = key.getPublicKey();
      } else {
        throw new Error("Unknown mode only " + MODE_ENCRYPT + " and " + MODE_DECRYPT + " supported");
      }
      return {
        secret: key.computeSecret(header.dh),
        context: Buffer.concat([
          Buffer.from(header.keylabel, "ascii"),
          Buffer.from([0]),
          lengthPrefix(receiverPubKey),
          // user agent
          lengthPrefix(senderPubKey)
          // application server
        ])
      };
    }
    function extractSecretAndContext(header, mode) {
      var result = { secret: null, context: Buffer.alloc(0) };
      if (header.key) {
        result.secret = header.key;
        if (result.secret.length !== KEY_LENGTH) {
          throw new Error("An explicit key must be " + KEY_LENGTH + " bytes");
        }
      } else if (header.dh) {
        result = extractDH(header, mode);
      } else if (typeof header.keyid !== void 0) {
        result.secret = header.keymap[header.keyid];
      }
      if (!result.secret) {
        throw new Error("Unable to determine key");
      }
      keylog("secret", result.secret);
      keylog("context", result.context);
      if (header.authSecret) {
        result.secret = HKDF(
          header.authSecret,
          result.secret,
          info("auth", Buffer.alloc(0)),
          SHA_256_LENGTH
        );
        keylog("authsecret", result.secret);
      }
      return result;
    }
    function webpushSecret(header, mode) {
      if (!header.authSecret) {
        throw new Error("No authentication secret for webpush");
      }
      keylog("authsecret", header.authSecret);
      var remotePubKey, senderPubKey, receiverPubKey;
      if (mode === MODE_ENCRYPT) {
        senderPubKey = header.privateKey.getPublicKey();
        remotePubKey = receiverPubKey = header.dh;
      } else if (mode === MODE_DECRYPT) {
        remotePubKey = senderPubKey = header.keyid;
        receiverPubKey = header.privateKey.getPublicKey();
      } else {
        throw new Error("Unknown mode only " + MODE_ENCRYPT + " and " + MODE_DECRYPT + " supported");
      }
      keylog("remote pubkey", remotePubKey);
      keylog("sender pubkey", senderPubKey);
      keylog("receiver pubkey", receiverPubKey);
      return keylog(
        "secret dh",
        HKDF(
          header.authSecret,
          header.privateKey.computeSecret(remotePubKey),
          Buffer.concat([
            Buffer.from("WebPush: info\0"),
            receiverPubKey,
            senderPubKey
          ]),
          SHA_256_LENGTH
        )
      );
    }
    function extractSecret(header, mode, keyLookupCallback) {
      if (keyLookupCallback) {
        if (!isFunction(keyLookupCallback)) {
          throw new Error("Callback is not a function");
        }
      }
      if (header.key) {
        if (header.key.length !== KEY_LENGTH) {
          throw new Error("An explicit key must be " + KEY_LENGTH + " bytes");
        }
        return keylog("secret key", header.key);
      }
      if (!header.privateKey) {
        if (!keyLookupCallback) {
          var key = header.keymap && header.keymap[header.keyid];
        } else {
          var key = keyLookupCallback(header.keyid);
        }
        if (!key) {
          throw new Error('No saved key (keyid: "' + header.keyid + '")');
        }
        return key;
      }
      return webpushSecret(header, mode);
    }
    function deriveKeyAndNonce(header, mode, lookupKeyCallback) {
      if (!header.salt) {
        throw new Error("must include a salt parameter for " + header.version);
      }
      var keyInfo;
      var nonceInfo;
      var secret;
      if (header.version === "aesgcm") {
        var s = extractSecretAndContext(header, mode, lookupKeyCallback);
        keyInfo = info("aesgcm", s.context);
        nonceInfo = info("nonce", s.context);
        secret = s.secret;
      } else if (header.version === "aes128gcm") {
        keyInfo = Buffer.from("Content-Encoding: aes128gcm\0");
        nonceInfo = Buffer.from("Content-Encoding: nonce\0");
        secret = extractSecret(header, mode, lookupKeyCallback);
      } else {
        throw new Error("Unable to set context for mode " + header.version);
      }
      var prk = HKDF_extract(header.salt, secret);
      var result = {
        key: HKDF_expand(prk, keyInfo, KEY_LENGTH),
        nonce: HKDF_expand(prk, nonceInfo, NONCE_LENGTH)
      };
      keylog("key", result.key);
      keylog("nonce base", result.nonce);
      return result;
    }
    function parseParams(params) {
      var header = {};
      header.version = params.version || "aes128gcm";
      header.rs = parseInt(params.rs, 10);
      if (isNaN(header.rs)) {
        header.rs = 4096;
      }
      var overhead = PAD_SIZE[header.version];
      if (header.version === "aes128gcm") {
        overhead += TAG_LENGTH;
      }
      if (header.rs <= overhead) {
        throw new Error("The rs parameter has to be greater than " + overhead);
      }
      if (params.salt) {
        header.salt = decode(params.salt);
        if (header.salt.length !== KEY_LENGTH) {
          throw new Error("The salt parameter must be " + KEY_LENGTH + " bytes");
        }
      }
      header.keyid = params.keyid;
      if (params.key) {
        header.key = decode(params.key);
      } else {
        header.privateKey = params.privateKey;
        if (!header.privateKey) {
          header.keymap = params.keymap;
        }
        if (header.version !== "aes128gcm") {
          header.keylabel = params.keylabel || "P-256";
        }
        if (params.dh) {
          header.dh = decode(params.dh);
        }
      }
      if (params.authSecret) {
        header.authSecret = decode(params.authSecret);
      }
      return header;
    }
    function generateNonce(base, counter) {
      var nonce = Buffer.from(base);
      var m = nonce.readUIntBE(nonce.length - 6, 6);
      var x = ((m ^ counter) & 16777215) + ((m / 16777216 ^ counter / 16777216) & 16777215) * 16777216;
      nonce.writeUIntBE(x, nonce.length - 6, 6);
      keylog("nonce" + counter, nonce);
      return nonce;
    }
    function readHeader(buffer, header) {
      var idsz = buffer.readUIntBE(20, 1);
      header.salt = buffer.slice(0, KEY_LENGTH);
      header.rs = buffer.readUIntBE(KEY_LENGTH, 4);
      header.keyid = buffer.slice(21, 21 + idsz);
      return 21 + idsz;
    }
    function unpadLegacy(data, version) {
      var padSize = PAD_SIZE[version];
      var pad = data.readUIntBE(0, padSize);
      if (pad + padSize > data.length) {
        throw new Error("padding exceeds block size");
      }
      keylog("padding", data.slice(0, padSize + pad));
      var padCheck = Buffer.alloc(pad);
      padCheck.fill(0);
      if (padCheck.compare(data.slice(padSize, padSize + pad)) !== 0) {
        throw new Error("invalid padding");
      }
      return data.slice(padSize + pad);
    }
    function unpad(data, last) {
      var i = data.length - 1;
      while (i >= 0) {
        if (data[i]) {
          if (last) {
            if (data[i] !== 2) {
              throw new Error("last record needs to start padding with a 2");
            }
          } else {
            if (data[i] !== 1) {
              throw new Error("last record needs to start padding with a 2");
            }
          }
          return data.slice(0, i);
        }
        --i;
      }
      throw new Error("all zero plaintext");
    }
    function decryptRecord(key, counter, buffer, header, last) {
      keylog("decrypt", buffer);
      var nonce = generateNonce(key.nonce, counter);
      var gcm = crypto3.createDecipheriv(AES_GCM, key.key, nonce);
      gcm.setAuthTag(buffer.slice(buffer.length - TAG_LENGTH));
      var data = gcm.update(buffer.slice(0, buffer.length - TAG_LENGTH));
      data = Buffer.concat([data, gcm.final()]);
      keylog("decrypted", data);
      if (header.version !== "aes128gcm") {
        return unpadLegacy(data, header.version);
      }
      return unpad(data, last);
    }
    function decrypt2(buffer, params, keyLookupCallback) {
      var header = parseParams(params);
      if (header.version === "aes128gcm") {
        var headerLength = readHeader(buffer, header);
        buffer = buffer.slice(headerLength);
      }
      var key = deriveKeyAndNonce(header, MODE_DECRYPT, keyLookupCallback);
      var start = 0;
      var result = Buffer.alloc(0);
      var chunkSize = header.rs;
      if (header.version !== "aes128gcm") {
        chunkSize += TAG_LENGTH;
      }
      for (var i = 0; start < buffer.length; ++i) {
        var end = start + chunkSize;
        if (header.version !== "aes128gcm" && end === buffer.length) {
          throw new Error("Truncated payload");
        }
        end = Math.min(end, buffer.length);
        if (end - start <= TAG_LENGTH) {
          throw new Error("Invalid block: too small at " + i);
        }
        var block = decryptRecord(
          key,
          i,
          buffer.slice(start, end),
          header,
          end >= buffer.length
        );
        result = Buffer.concat([result, block]);
        start = end;
      }
      return result;
    }
    function encryptRecord(key, counter, buffer, pad, header, last) {
      keylog("encrypt", buffer);
      pad = pad || 0;
      var nonce = generateNonce(key.nonce, counter);
      var gcm = crypto3.createCipheriv(AES_GCM, key.key, nonce);
      var ciphertext = [];
      var padSize = PAD_SIZE[header.version];
      var padding = Buffer.alloc(pad + padSize);
      padding.fill(0);
      if (header.version !== "aes128gcm") {
        padding.writeUIntBE(pad, 0, padSize);
        keylog("padding", padding);
        ciphertext.push(gcm.update(padding));
        ciphertext.push(gcm.update(buffer));
        if (!last && padding.length + buffer.length < header.rs) {
          throw new Error("Unable to pad to record size");
        }
      } else {
        ciphertext.push(gcm.update(buffer));
        padding.writeUIntBE(last ? 2 : 1, 0, 1);
        keylog("padding", padding);
        ciphertext.push(gcm.update(padding));
      }
      gcm.final();
      var tag = gcm.getAuthTag();
      if (tag.length !== TAG_LENGTH) {
        throw new Error("invalid tag generated");
      }
      ciphertext.push(tag);
      return keylog("encrypted", Buffer.concat(ciphertext));
    }
    function writeHeader(header) {
      var ints = Buffer.alloc(5);
      var keyid = Buffer.from(header.keyid || []);
      if (keyid.length > 255) {
        throw new Error("keyid is too large");
      }
      ints.writeUIntBE(header.rs, 0, 4);
      ints.writeUIntBE(keyid.length, 4, 1);
      return Buffer.concat([header.salt, ints, keyid]);
    }
    function encrypt2(buffer, params, keyLookupCallback) {
      if (!Buffer.isBuffer(buffer)) {
        throw new Error("buffer argument must be a Buffer");
      }
      var header = parseParams(params);
      if (!header.salt) {
        header.salt = crypto3.randomBytes(KEY_LENGTH);
      }
      var result;
      if (header.version === "aes128gcm") {
        if (header.privateKey && !header.keyid) {
          header.keyid = header.privateKey.getPublicKey();
        }
        result = writeHeader(header);
      } else {
        result = Buffer.alloc(0);
      }
      var key = deriveKeyAndNonce(header, MODE_ENCRYPT, keyLookupCallback);
      var start = 0;
      var padSize = PAD_SIZE[header.version];
      var overhead = padSize;
      if (header.version === "aes128gcm") {
        overhead += TAG_LENGTH;
      }
      var pad = isNaN(parseInt(params.pad, 10)) ? 0 : parseInt(params.pad, 10);
      var counter = 0;
      var last = false;
      while (!last) {
        var recordPad = Math.min(header.rs - overhead - 1, pad);
        if (header.version !== "aes128gcm") {
          recordPad = Math.min((1 << padSize * 8) - 1, recordPad);
        }
        if (pad > 0 && recordPad === 0) {
          ++recordPad;
        }
        pad -= recordPad;
        var end = start + header.rs - overhead - recordPad;
        if (header.version !== "aes128gcm") {
          last = end > buffer.length;
        } else {
          last = end >= buffer.length;
        }
        last = last && pad <= 0;
        var block = encryptRecord(
          key,
          counter,
          buffer.slice(start, end),
          recordPad,
          header,
          last
        );
        result = Buffer.concat([result, block]);
        start = end;
        ++counter;
      }
      return result;
    }
    function isFunction(object) {
      return typeof object === "function";
    }
    module.exports = {
      decrypt: decrypt2,
      encrypt: encrypt2
    };
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/encryption-helper.js
var require_encryption_helper = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/encryption-helper.js"(exports, module) {
    "use strict";
    var crypto3 = __require("crypto");
    var ece = require_ece();
    var encrypt2 = function(userPublicKey, userAuth, payload, contentEncoding) {
      if (!userPublicKey) {
        throw new Error("No user public key provided for encryption.");
      }
      if (typeof userPublicKey !== "string") {
        throw new Error("The subscription p256dh value must be a string.");
      }
      if (Buffer.from(userPublicKey, "base64url").length !== 65) {
        throw new Error("The subscription p256dh value should be 65 bytes long.");
      }
      if (!userAuth) {
        throw new Error("No user auth provided for encryption.");
      }
      if (typeof userAuth !== "string") {
        throw new Error("The subscription auth key must be a string.");
      }
      if (Buffer.from(userAuth, "base64url").length < 16) {
        throw new Error("The subscription auth key should be at least 16 bytes long");
      }
      if (typeof payload !== "string" && !Buffer.isBuffer(payload)) {
        throw new Error("Payload must be either a string or a Node Buffer.");
      }
      if (typeof payload === "string" || payload instanceof String) {
        payload = Buffer.from(payload);
      }
      const localCurve = crypto3.createECDH("prime256v1");
      const localPublicKey = localCurve.generateKeys();
      const salt = crypto3.randomBytes(16).toString("base64url");
      const cipherText = ece.encrypt(payload, {
        version: contentEncoding,
        dh: userPublicKey,
        privateKey: localCurve,
        salt,
        authSecret: userAuth
      });
      return {
        localPublicKey,
        salt,
        cipherText
      };
    };
    module.exports = {
      encrypt: encrypt2
    };
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-error.js
var require_web_push_error = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-error.js"(exports, module) {
    "use strict";
    function WebPushError(message, statusCode, headers, body, endpoint) {
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.message = message;
      this.statusCode = statusCode;
      this.headers = headers;
      this.body = body;
      this.endpoint = endpoint;
    }
    __require("util").inherits(WebPushError, Error);
    module.exports = WebPushError;
  }
});

// ../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js
var require_ms = __commonJS({
  "../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js
var require_common = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js"(exports, module) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce2;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce2(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module.exports = setup;
  }
});

// ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js"(exports, module) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// ../../node_modules/.pnpm/has-flag@4.0.0/node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "../../node_modules/.pnpm/has-flag@4.0.0/node_modules/has-flag/index.js"(exports, module) {
    "use strict";
    module.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// ../../node_modules/.pnpm/supports-color@8.1.1/node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "../../node_modules/.pnpm/supports-color@8.1.1/node_modules/supports-color/index.js"(exports, module) {
    "use strict";
    var os = __require("os");
    var tty = __require("tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var flagForceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      flagForceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      flagForceColor = 1;
    }
    function envForceColor() {
      if ("FORCE_COLOR" in env) {
        if (env.FORCE_COLOR === "true") {
          return 1;
        }
        if (env.FORCE_COLOR === "false") {
          return 0;
        }
        return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
      const noFlagForceColor = envForceColor();
      if (noFlagForceColor !== void 0) {
        flagForceColor = noFlagForceColor;
      }
      const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
      if (forceColor === 0) {
        return 0;
      }
      if (sniffFlags) {
        if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
          return 3;
        }
        if (hasFlag("color=256")) {
          return 2;
        }
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream, options = {}) {
      const level = supportsColor(stream, {
        streamIsTTY: stream && stream.isTTY,
        ...options
      });
      return translateLevel(level);
    }
    module.exports = {
      supportsColor: getSupportLevel,
      stdout: getSupportLevel({ isTTY: tty.isatty(1) }),
      stderr: getSupportLevel({ isTTY: tty.isatty(2) })
    };
  }
});

// ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js
var require_node2 = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js"(exports, module) {
    var tty = __require("tty");
    var util2 = __require("util");
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util2.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util2.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  }
});

// ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js
var require_src = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js"(exports, module) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node2();
    }
  }
});

// ../../node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/helpers.js
var require_helpers = __commonJS({
  "../../node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/helpers.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.req = exports.json = exports.toBuffer = void 0;
    var http = __importStar(__require("http"));
    var https = __importStar(__require("https"));
    async function toBuffer(stream) {
      let length = 0;
      const chunks = [];
      for await (const chunk of stream) {
        length += chunk.length;
        chunks.push(chunk);
      }
      return Buffer.concat(chunks, length);
    }
    exports.toBuffer = toBuffer;
    async function json(stream) {
      const buf = await toBuffer(stream);
      const str = buf.toString("utf8");
      try {
        return JSON.parse(str);
      } catch (_err) {
        const err = _err;
        err.message += ` (input: ${str})`;
        throw err;
      }
    }
    exports.json = json;
    function req(url, opts = {}) {
      const href = typeof url === "string" ? url : url.href;
      const req2 = (href.startsWith("https:") ? https : http).request(url, opts);
      const promise = new Promise((resolve, reject) => {
        req2.once("response", resolve).once("error", reject).end();
      });
      req2.then = promise.then.bind(promise);
      return req2;
    }
    exports.req = req;
  }
});

// ../../node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/.pnpm/agent-base@7.1.4/node_modules/agent-base/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Agent = void 0;
    var net = __importStar(__require("net"));
    var http = __importStar(__require("http"));
    var https_1 = __require("https");
    __exportStar(require_helpers(), exports);
    var INTERNAL = /* @__PURE__ */ Symbol("AgentBaseInternalState");
    var Agent = class extends http.Agent {
      constructor(opts) {
        super(opts);
        this[INTERNAL] = {};
      }
      /**
       * Determine whether this is an `http` or `https` request.
       */
      isSecureEndpoint(options) {
        if (options) {
          if (typeof options.secureEndpoint === "boolean") {
            return options.secureEndpoint;
          }
          if (typeof options.protocol === "string") {
            return options.protocol === "https:";
          }
        }
        const { stack } = new Error();
        if (typeof stack !== "string")
          return false;
        return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
      }
      // In order to support async signatures in `connect()` and Node's native
      // connection pooling in `http.Agent`, the array of sockets for each origin
      // has to be updated synchronously. This is so the length of the array is
      // accurate when `addRequest()` is next called. We achieve this by creating a
      // fake socket and adding it to `sockets[origin]` and incrementing
      // `totalSocketCount`.
      incrementSockets(name) {
        if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) {
          return null;
        }
        if (!this.sockets[name]) {
          this.sockets[name] = [];
        }
        const fakeSocket = new net.Socket({ writable: false });
        this.sockets[name].push(fakeSocket);
        this.totalSocketCount++;
        return fakeSocket;
      }
      decrementSockets(name, socket) {
        if (!this.sockets[name] || socket === null) {
          return;
        }
        const sockets = this.sockets[name];
        const index = sockets.indexOf(socket);
        if (index !== -1) {
          sockets.splice(index, 1);
          this.totalSocketCount--;
          if (sockets.length === 0) {
            delete this.sockets[name];
          }
        }
      }
      // In order to properly update the socket pool, we need to call `getName()` on
      // the core `https.Agent` if it is a secureEndpoint.
      getName(options) {
        const secureEndpoint = this.isSecureEndpoint(options);
        if (secureEndpoint) {
          return https_1.Agent.prototype.getName.call(this, options);
        }
        return super.getName(options);
      }
      createSocket(req, options, cb) {
        const connectOpts = {
          ...options,
          secureEndpoint: this.isSecureEndpoint(options)
        };
        const name = this.getName(connectOpts);
        const fakeSocket = this.incrementSockets(name);
        Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
          this.decrementSockets(name, fakeSocket);
          if (socket instanceof http.Agent) {
            try {
              return socket.addRequest(req, connectOpts);
            } catch (err) {
              return cb(err);
            }
          }
          this[INTERNAL].currentSocket = socket;
          super.createSocket(req, options, cb);
        }, (err) => {
          this.decrementSockets(name, fakeSocket);
          cb(err);
        });
      }
      createConnection() {
        const socket = this[INTERNAL].currentSocket;
        this[INTERNAL].currentSocket = void 0;
        if (!socket) {
          throw new Error("No socket was returned in the `connect()` function");
        }
        return socket;
      }
      get defaultPort() {
        return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
      }
      set defaultPort(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].defaultPort = v;
        }
      }
      get protocol() {
        return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
      }
      set protocol(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].protocol = v;
        }
      }
    };
    exports.Agent = Agent;
  }
});

// ../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/parse-proxy-response.js
var require_parse_proxy_response = __commonJS({
  "../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/parse-proxy-response.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseProxyResponse = void 0;
    var debug_1 = __importDefault(require_src());
    var debug = (0, debug_1.default)("https-proxy-agent:parse-proxy-response");
    function parseProxyResponse(socket) {
      return new Promise((resolve, reject) => {
        let buffersLength = 0;
        const buffers = [];
        function read() {
          const b = socket.read();
          if (b)
            ondata(b);
          else
            socket.once("readable", read);
        }
        function cleanup() {
          socket.removeListener("end", onend);
          socket.removeListener("error", onerror);
          socket.removeListener("readable", read);
        }
        function onend() {
          cleanup();
          debug("onend");
          reject(new Error("Proxy connection ended before receiving CONNECT response"));
        }
        function onerror(err) {
          cleanup();
          debug("onerror %o", err);
          reject(err);
        }
        function ondata(b) {
          buffers.push(b);
          buffersLength += b.length;
          const buffered = Buffer.concat(buffers, buffersLength);
          const endOfHeaders = buffered.indexOf("\r\n\r\n");
          if (endOfHeaders === -1) {
            debug("have not received end of HTTP headers yet...");
            read();
            return;
          }
          const headerParts = buffered.slice(0, endOfHeaders).toString("ascii").split("\r\n");
          const firstLine = headerParts.shift();
          if (!firstLine) {
            socket.destroy();
            return reject(new Error("No header received from proxy CONNECT response"));
          }
          const firstLineParts = firstLine.split(" ");
          const statusCode = +firstLineParts[1];
          const statusText = firstLineParts.slice(2).join(" ");
          const headers = {};
          for (const header of headerParts) {
            if (!header)
              continue;
            const firstColon = header.indexOf(":");
            if (firstColon === -1) {
              socket.destroy();
              return reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
            }
            const key = header.slice(0, firstColon).toLowerCase();
            const value = header.slice(firstColon + 1).trimStart();
            const current = headers[key];
            if (typeof current === "string") {
              headers[key] = [current, value];
            } else if (Array.isArray(current)) {
              current.push(value);
            } else {
              headers[key] = value;
            }
          }
          debug("got proxy server response: %o %o", firstLine, headers);
          cleanup();
          resolve({
            connect: {
              statusCode,
              statusText,
              headers
            },
            buffered
          });
        }
        socket.on("error", onerror);
        socket.on("end", onend);
        read();
      });
    }
    exports.parseProxyResponse = parseProxyResponse;
  }
});

// ../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js
var require_dist2 = __commonJS({
  "../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpsProxyAgent = void 0;
    var net = __importStar(__require("net"));
    var tls = __importStar(__require("tls"));
    var assert_1 = __importDefault(__require("assert"));
    var debug_1 = __importDefault(require_src());
    var agent_base_1 = require_dist();
    var url_1 = __require("url");
    var parse_proxy_response_1 = require_parse_proxy_response();
    var debug = (0, debug_1.default)("https-proxy-agent");
    var setServernameFromNonIpHost = (options) => {
      if (options.servername === void 0 && options.host && !net.isIP(options.host)) {
        return {
          ...options,
          servername: options.host
        };
      }
      return options;
    };
    var HttpsProxyAgent = class extends agent_base_1.Agent {
      constructor(proxy, opts) {
        super(opts);
        this.options = { path: void 0 };
        this.proxy = typeof proxy === "string" ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, "");
        const port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
        this.connectOpts = {
          // Attempt to negotiate http/1.1 for proxy servers that support http/2
          ALPNProtocols: ["http/1.1"],
          ...opts ? omit(opts, "headers") : null,
          host,
          port
        };
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       */
      async connect(req, opts) {
        const { proxy } = this;
        if (!opts.host) {
          throw new TypeError('No "host" provided');
        }
        let socket;
        if (proxy.protocol === "https:") {
          debug("Creating `tls.Socket`: %o", this.connectOpts);
          socket = tls.connect(setServernameFromNonIpHost(this.connectOpts));
        } else {
          debug("Creating `net.Socket`: %o", this.connectOpts);
          socket = net.connect(this.connectOpts);
        }
        const headers = typeof this.proxyHeaders === "function" ? this.proxyHeaders() : { ...this.proxyHeaders };
        const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
        let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r
`;
        if (proxy.username || proxy.password) {
          const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
          headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
        }
        headers.Host = `${host}:${opts.port}`;
        if (!headers["Proxy-Connection"]) {
          headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close";
        }
        for (const name of Object.keys(headers)) {
          payload += `${name}: ${headers[name]}\r
`;
        }
        const proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
        socket.write(`${payload}\r
`);
        const { connect, buffered } = await proxyResponsePromise;
        req.emit("proxyConnect", connect);
        this.emit("proxyConnect", connect, req);
        if (connect.statusCode === 200) {
          req.once("socket", resume);
          if (opts.secureEndpoint) {
            debug("Upgrading socket connection to TLS");
            return tls.connect({
              ...omit(setServernameFromNonIpHost(opts), "host", "path", "port"),
              socket
            });
          }
          return socket;
        }
        socket.destroy();
        const fakeSocket = new net.Socket({ writable: false });
        fakeSocket.readable = true;
        req.once("socket", (s) => {
          debug("Replaying proxy buffer for failed request");
          (0, assert_1.default)(s.listenerCount("data") > 0);
          s.push(buffered);
          s.push(null);
        });
        return fakeSocket;
      }
    };
    HttpsProxyAgent.protocols = ["http", "https"];
    exports.HttpsProxyAgent = HttpsProxyAgent;
    function resume(socket) {
      socket.resume();
    }
    function omit(obj, ...keys) {
      const ret = {};
      let key;
      for (key in obj) {
        if (!keys.includes(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-lib.js
var require_web_push_lib = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/web-push-lib.js"(exports, module) {
    "use strict";
    var url = __require("url");
    var https = __require("https");
    var WebPushError = require_web_push_error();
    var vapidHelper = require_vapid_helper();
    var encryptionHelper = require_encryption_helper();
    var webPushConstants = require_web_push_constants();
    var urlBase64Helper = require_urlsafe_base64_helper();
    var DEFAULT_TTL = 2419200;
    var gcmAPIKey = "";
    var vapidDetails;
    function WebPushLib() {
    }
    WebPushLib.prototype.setGCMAPIKey = function(apiKey) {
      if (apiKey === null) {
        gcmAPIKey = null;
        return;
      }
      if (typeof apiKey === "undefined" || typeof apiKey !== "string" || apiKey.length === 0) {
        throw new Error("The GCM API Key should be a non-empty string or null.");
      }
      gcmAPIKey = apiKey;
    };
    WebPushLib.prototype.setVapidDetails = function(subject, publicKey, privateKey) {
      if (arguments.length === 1 && arguments[0] === null) {
        vapidDetails = null;
        return;
      }
      vapidHelper.validateSubject(subject);
      vapidHelper.validatePublicKey(publicKey);
      vapidHelper.validatePrivateKey(privateKey);
      vapidDetails = {
        subject,
        publicKey,
        privateKey
      };
    };
    WebPushLib.prototype.generateRequestDetails = function(subscription, payload, options) {
      if (!subscription || !subscription.endpoint) {
        throw new Error("You must pass in a subscription with at least an endpoint.");
      }
      if (typeof subscription.endpoint !== "string" || subscription.endpoint.length === 0) {
        throw new Error("The subscription endpoint must be a string with a valid URL.");
      }
      if (payload) {
        if (typeof subscription !== "object" || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          throw new Error("To send a message with a payload, the subscription must have 'auth' and 'p256dh' keys.");
        }
      }
      let currentGCMAPIKey = gcmAPIKey;
      let currentVapidDetails = vapidDetails;
      let timeToLive = DEFAULT_TTL;
      let extraHeaders = {};
      let contentEncoding = webPushConstants.supportedContentEncodings.AES_128_GCM;
      let urgency = webPushConstants.supportedUrgency.NORMAL;
      let topic;
      let proxy;
      let agent;
      let timeout;
      if (options) {
        const validOptionKeys = [
          "headers",
          "gcmAPIKey",
          "vapidDetails",
          "TTL",
          "contentEncoding",
          "urgency",
          "topic",
          "proxy",
          "agent",
          "timeout"
        ];
        const optionKeys = Object.keys(options);
        for (let i = 0; i < optionKeys.length; i += 1) {
          const optionKey = optionKeys[i];
          if (!validOptionKeys.includes(optionKey)) {
            throw new Error("'" + optionKey + "' is an invalid option. The valid options are ['" + validOptionKeys.join("', '") + "'].");
          }
        }
        if (options.headers) {
          extraHeaders = options.headers;
          let duplicates = Object.keys(extraHeaders).filter(function(header) {
            return typeof options[header] !== "undefined";
          });
          if (duplicates.length > 0) {
            throw new Error("Duplicated headers defined [" + duplicates.join(",") + "]. Please either define the header in thetop level options OR in the 'headers' key.");
          }
        }
        if (options.gcmAPIKey) {
          currentGCMAPIKey = options.gcmAPIKey;
        }
        if (options.vapidDetails !== void 0) {
          currentVapidDetails = options.vapidDetails;
        }
        if (options.TTL !== void 0) {
          timeToLive = Number(options.TTL);
          if (timeToLive < 0) {
            throw new Error("TTL should be a number and should be at least 0");
          }
        }
        if (options.contentEncoding) {
          if (options.contentEncoding === webPushConstants.supportedContentEncodings.AES_128_GCM || options.contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM) {
            contentEncoding = options.contentEncoding;
          } else {
            throw new Error("Unsupported content encoding specified.");
          }
        }
        if (options.urgency) {
          if (options.urgency === webPushConstants.supportedUrgency.VERY_LOW || options.urgency === webPushConstants.supportedUrgency.LOW || options.urgency === webPushConstants.supportedUrgency.NORMAL || options.urgency === webPushConstants.supportedUrgency.HIGH) {
            urgency = options.urgency;
          } else {
            throw new Error("Unsupported urgency specified.");
          }
        }
        if (options.topic) {
          if (!urlBase64Helper.validate(options.topic)) {
            throw new Error("Unsupported characters set use the URL or filename-safe Base64 characters set");
          }
          if (options.topic.length > 32) {
            throw new Error("use maximum of 32 characters from the URL or filename-safe Base64 characters set");
          }
          topic = options.topic;
        }
        if (options.proxy) {
          if (typeof options.proxy === "string" || typeof options.proxy.host === "string") {
            proxy = options.proxy;
          } else {
            console.warn("Attempt to use proxy option, but invalid type it should be a string or proxy options object.");
          }
        }
        if (options.agent) {
          if (options.agent instanceof https.Agent) {
            if (proxy) {
              console.warn("Agent option will be ignored because proxy option is defined.");
            }
            agent = options.agent;
          } else {
            console.warn("Wrong type for the agent option, it should be an instance of https.Agent.");
          }
        }
        if (typeof options.timeout === "number") {
          timeout = options.timeout;
        }
      }
      if (typeof timeToLive === "undefined") {
        timeToLive = DEFAULT_TTL;
      }
      const requestDetails = {
        method: "POST",
        headers: {
          TTL: timeToLive
        }
      };
      Object.keys(extraHeaders).forEach(function(header) {
        requestDetails.headers[header] = extraHeaders[header];
      });
      let requestPayload = null;
      if (payload) {
        const encrypted = encryptionHelper.encrypt(subscription.keys.p256dh, subscription.keys.auth, payload, contentEncoding);
        requestDetails.headers["Content-Length"] = encrypted.cipherText.length;
        requestDetails.headers["Content-Type"] = "application/octet-stream";
        if (contentEncoding === webPushConstants.supportedContentEncodings.AES_128_GCM) {
          requestDetails.headers["Content-Encoding"] = webPushConstants.supportedContentEncodings.AES_128_GCM;
        } else if (contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM) {
          requestDetails.headers["Content-Encoding"] = webPushConstants.supportedContentEncodings.AES_GCM;
          requestDetails.headers.Encryption = "salt=" + encrypted.salt;
          requestDetails.headers["Crypto-Key"] = "dh=" + encrypted.localPublicKey.toString("base64url");
        }
        requestPayload = encrypted.cipherText;
      } else {
        requestDetails.headers["Content-Length"] = 0;
      }
      const isGCM = subscription.endpoint.startsWith("https://android.googleapis.com/gcm/send");
      const isFCM = subscription.endpoint.startsWith("https://fcm.googleapis.com/fcm/send");
      if (isGCM) {
        if (!currentGCMAPIKey) {
          console.warn("Attempt to send push notification to GCM endpoint, but no GCM key is defined. Please use setGCMApiKey() or add 'gcmAPIKey' as an option.");
        } else {
          requestDetails.headers.Authorization = "key=" + currentGCMAPIKey;
        }
      } else if (currentVapidDetails) {
        const parsedUrl = url.parse(subscription.endpoint);
        const audience = parsedUrl.protocol + "//" + parsedUrl.host;
        const vapidHeaders = vapidHelper.getVapidHeaders(
          audience,
          currentVapidDetails.subject,
          currentVapidDetails.publicKey,
          currentVapidDetails.privateKey,
          contentEncoding
        );
        requestDetails.headers.Authorization = vapidHeaders.Authorization;
        if (contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM) {
          if (requestDetails.headers["Crypto-Key"]) {
            requestDetails.headers["Crypto-Key"] += ";" + vapidHeaders["Crypto-Key"];
          } else {
            requestDetails.headers["Crypto-Key"] = vapidHeaders["Crypto-Key"];
          }
        }
      } else if (isFCM && currentGCMAPIKey) {
        requestDetails.headers.Authorization = "key=" + currentGCMAPIKey;
      }
      requestDetails.headers.Urgency = urgency;
      if (topic) {
        requestDetails.headers.Topic = topic;
      }
      requestDetails.body = requestPayload;
      requestDetails.endpoint = subscription.endpoint;
      if (proxy) {
        requestDetails.proxy = proxy;
      }
      if (agent) {
        requestDetails.agent = agent;
      }
      if (timeout) {
        requestDetails.timeout = timeout;
      }
      return requestDetails;
    };
    WebPushLib.prototype.sendNotification = function(subscription, payload, options) {
      let requestDetails;
      try {
        requestDetails = this.generateRequestDetails(subscription, payload, options);
      } catch (err) {
        return Promise.reject(err);
      }
      return new Promise(function(resolve, reject) {
        const httpsOptions = {};
        const urlParts = url.parse(requestDetails.endpoint);
        httpsOptions.hostname = urlParts.hostname;
        httpsOptions.port = urlParts.port;
        httpsOptions.path = urlParts.path;
        httpsOptions.headers = requestDetails.headers;
        httpsOptions.method = requestDetails.method;
        if (requestDetails.timeout) {
          httpsOptions.timeout = requestDetails.timeout;
        }
        if (requestDetails.agent) {
          httpsOptions.agent = requestDetails.agent;
        }
        if (requestDetails.proxy) {
          const { HttpsProxyAgent } = require_dist2();
          httpsOptions.agent = new HttpsProxyAgent(requestDetails.proxy);
        }
        const pushRequest = https.request(httpsOptions, function(pushResponse) {
          let responseText = "";
          pushResponse.on("data", function(chunk) {
            responseText += chunk;
          });
          pushResponse.on("end", function() {
            if (pushResponse.statusCode < 200 || pushResponse.statusCode > 299) {
              reject(new WebPushError(
                "Received unexpected response code",
                pushResponse.statusCode,
                pushResponse.headers,
                responseText,
                requestDetails.endpoint
              ));
            } else {
              resolve({
                statusCode: pushResponse.statusCode,
                body: responseText,
                headers: pushResponse.headers
              });
            }
          });
        });
        if (requestDetails.timeout) {
          pushRequest.on("timeout", function() {
            pushRequest.destroy(new Error("Socket timeout"));
          });
        }
        pushRequest.on("error", function(e) {
          reject(e);
        });
        if (requestDetails.body) {
          pushRequest.write(requestDetails.body);
        }
        pushRequest.end();
      });
    };
    module.exports = WebPushLib;
  }
});

// ../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/index.js
var require_src2 = __commonJS({
  "../../node_modules/.pnpm/web-push@3.6.7/node_modules/web-push/src/index.js"(exports, module) {
    "use strict";
    var vapidHelper = require_vapid_helper();
    var encryptionHelper = require_encryption_helper();
    var WebPushLib = require_web_push_lib();
    var WebPushError = require_web_push_error();
    var WebPushConstants = require_web_push_constants();
    var webPush = new WebPushLib();
    module.exports = {
      WebPushError,
      supportedContentEncodings: WebPushConstants.supportedContentEncodings,
      encrypt: encryptionHelper.encrypt,
      getVapidHeaders: vapidHelper.getVapidHeaders,
      generateVAPIDKeys: vapidHelper.generateVAPIDKeys,
      setGCMAPIKey: webPush.setGCMAPIKey,
      setVapidDetails: webPush.setVapidDetails,
      generateRequestDetails: webPush.generateRequestDetails,
      sendNotification: webPush.sendNotification.bind(webPush)
    };
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/middleware.js
var require_middleware = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/middleware.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TARGET_URL_HEADER = void 0;
    exports.withMiddleware = withMiddleware;
    exports.withProxy = withProxy;
    function withMiddleware(...middlewares) {
      return (config2) => middlewares.reduce((configPromise, middleware) => configPromise.then((req) => middleware(req)), Promise.resolve(config2));
    }
    exports.TARGET_URL_HEADER = "x-fal-target-url";
    function withProxy(config2) {
      if (typeof window === "undefined") {
        return (requestConfig) => Promise.resolve(requestConfig);
      }
      return (requestConfig) => Promise.resolve(Object.assign(Object.assign({}, requestConfig), { url: config2.targetUrl, headers: Object.assign(Object.assign({}, requestConfig.headers || {}), { [exports.TARGET_URL_HEADER]: requestConfig.url }) }));
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/response.js
var require_response = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/response.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValidationError = exports.ApiError = void 0;
    exports.defaultResponseHandler = defaultResponseHandler;
    var ApiError = class extends Error {
      constructor({ message, status, body }) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
      }
    };
    exports.ApiError = ApiError;
    var ValidationError = class extends ApiError {
      constructor(args) {
        super(args);
        this.name = "ValidationError";
      }
      get fieldErrors() {
        if (typeof this.body.detail === "string") {
          return [
            {
              loc: ["body"],
              msg: this.body.detail,
              type: "value_error"
            }
          ];
        }
        return this.body.detail || [];
      }
      getFieldErrors(field) {
        return this.fieldErrors.filter((error) => error.loc[error.loc.length - 1] === field);
      }
    };
    exports.ValidationError = ValidationError;
    function defaultResponseHandler(response) {
      return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { status, statusText } = response;
        const contentType = (_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "";
        if (!response.ok) {
          if (contentType.includes("application/json")) {
            const body = yield response.json();
            const ErrorType = status === 422 ? ValidationError : ApiError;
            throw new ErrorType({
              message: body.message || statusText,
              status,
              body
            });
          }
          throw new ApiError({ message: `HTTP ${status}: ${statusText}`, status });
        }
        if (contentType.includes("application/json")) {
          return response.json();
        }
        if (contentType.includes("text/html")) {
          return response.text();
        }
        if (contentType.includes("application/octet-stream")) {
          return response.arrayBuffer();
        }
        return response.text();
      });
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/config.js
var require_config = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.credentialsFromEnv = void 0;
    exports.resolveDefaultFetch = resolveDefaultFetch;
    exports.config = config2;
    exports.getConfig = getConfig;
    exports.getRestApiUrl = getRestApiUrl;
    var middleware_1 = require_middleware();
    var response_1 = require_response();
    function resolveDefaultFetch() {
      if (typeof fetch === "undefined") {
        throw new Error("Your environment does not support fetch. Please provide your own fetch implementation.");
      }
      return fetch;
    }
    function hasEnvVariables() {
      return typeof process !== "undefined" && process.env && (typeof process.env.FAL_KEY !== "undefined" || typeof process.env.FAL_KEY_ID !== "undefined" && typeof process.env.FAL_KEY_SECRET !== "undefined");
    }
    var credentialsFromEnv = () => {
      if (!hasEnvVariables()) {
        return void 0;
      }
      if (typeof process.env.FAL_KEY !== "undefined") {
        return process.env.FAL_KEY;
      }
      return `${process.env.FAL_KEY_ID}:${process.env.FAL_KEY_SECRET}`;
    };
    exports.credentialsFromEnv = credentialsFromEnv;
    var DEFAULT_CONFIG = {
      credentials: exports.credentialsFromEnv,
      suppressLocalCredentialsWarning: false,
      requestMiddleware: (request) => Promise.resolve(request),
      responseHandler: response_1.defaultResponseHandler
    };
    var configuration;
    function config2(config3) {
      var _a;
      configuration = Object.assign(Object.assign(Object.assign({}, DEFAULT_CONFIG), config3), { fetch: (_a = config3.fetch) !== null && _a !== void 0 ? _a : resolveDefaultFetch() });
      if (config3.proxyUrl) {
        configuration = Object.assign(Object.assign({}, configuration), { requestMiddleware: (0, middleware_1.withMiddleware)((0, middleware_1.withProxy)({ targetUrl: config3.proxyUrl }), configuration.requestMiddleware) });
      }
      const { credentials: resolveCredentials, suppressLocalCredentialsWarning } = configuration;
      const credentials = typeof resolveCredentials === "function" ? resolveCredentials() : resolveCredentials;
      if (typeof window !== "undefined" && credentials && !suppressLocalCredentialsWarning) {
        console.warn("The fal credentials are exposed in the browser's environment. That's not recommended for production use cases.");
      }
    }
    function getConfig() {
      if (!configuration) {
        console.info("Using default configuration for the fal client");
        return Object.assign(Object.assign({}, DEFAULT_CONFIG), { fetch: resolveDefaultFetch() });
      }
      return configuration;
    }
    function getRestApiUrl() {
      return "https://rest.alpha.fal.ai";
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/package.json
var require_package = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/package.json"(exports, module) {
    module.exports = {
      name: "@fal-ai/serverless-client",
      description: "Deprecation note: this library has been deprecated in favor of @fal-ai/client",
      version: "0.15.0",
      license: "MIT",
      repository: {
        type: "git",
        url: "https://github.com/fal-ai/fal-js.git",
        directory: "libs/client"
      },
      keywords: [
        "fal",
        "serverless",
        "client",
        "ai",
        "ml"
      ],
      dependencies: {
        "@msgpack/msgpack": "^3.0.0-beta2",
        "eventsource-parser": "^1.1.2",
        robot3: "^0.4.1"
      },
      engines: {
        node: ">=18.0.0"
      },
      main: "./src/index.js",
      type: "commonjs"
    };
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/runtime.js
var require_runtime = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/runtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isBrowser = isBrowser;
    exports.getUserAgent = getUserAgent;
    function isBrowser() {
      return typeof window !== "undefined" && typeof window.document !== "undefined";
    }
    var memoizedUserAgent = null;
    function getUserAgent() {
      if (memoizedUserAgent !== null) {
        return memoizedUserAgent;
      }
      const packageInfo = require_package();
      memoizedUserAgent = `${packageInfo.name}/${packageInfo.version}`;
      return memoizedUserAgent;
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/request.js
var require_request = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/request.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __rest = exports && exports.__rest || function(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
        }
      return t;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dispatchRequest = dispatchRequest;
    var config_1 = require_config();
    var runtime_1 = require_runtime();
    var isCloudflareWorkers = typeof navigator !== "undefined" && (navigator === null || navigator === void 0 ? void 0 : navigator.userAgent) === "Cloudflare-Workers";
    function dispatchRequest(method_1, targetUrl_1, input_1) {
      return __awaiter(this, arguments, void 0, function* (method, targetUrl, input, options = {}) {
        var _a;
        const { credentials: credentialsValue, requestMiddleware, responseHandler, fetch: fetch2 } = (0, config_1.getConfig)();
        const userAgent = (0, runtime_1.isBrowser)() ? {} : { "User-Agent": (0, runtime_1.getUserAgent)() };
        const credentials = typeof credentialsValue === "function" ? credentialsValue() : credentialsValue;
        const { url, headers } = yield requestMiddleware({
          url: targetUrl,
          method: method.toUpperCase()
        });
        const authHeader = credentials ? { Authorization: `Key ${credentials}` } : {};
        const requestHeaders = Object.assign(Object.assign(Object.assign(Object.assign({}, authHeader), { Accept: "application/json", "Content-Type": "application/json" }), userAgent), headers !== null && headers !== void 0 ? headers : {});
        const { responseHandler: customResponseHandler } = options, requestInit = __rest(options, ["responseHandler"]);
        const response = yield fetch2(url, Object.assign(Object.assign(Object.assign(Object.assign({}, requestInit), { method, headers: Object.assign(Object.assign({}, requestHeaders), (_a = requestInit.headers) !== null && _a !== void 0 ? _a : {}) }), !isCloudflareWorkers && { mode: "cors" }), { body: method.toLowerCase() !== "get" && input ? JSON.stringify(input) : void 0 }));
        const handleResponse = customResponseHandler !== null && customResponseHandler !== void 0 ? customResponseHandler : responseHandler;
        return yield handleResponse(response);
      });
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ensureAppIdFormat = ensureAppIdFormat;
    exports.parseAppId = parseAppId;
    exports.isValidUrl = isValidUrl;
    exports.throttle = throttle;
    exports.isReact = isReact;
    exports.isPlainObject = isPlainObject;
    function ensureAppIdFormat(id) {
      const parts = id.split("/");
      if (parts.length > 1) {
        return id;
      }
      const [, appOwner, appId] = /^([0-9]+)-([a-zA-Z0-9-]+)$/.exec(id) || [];
      if (appOwner && appId) {
        return `${appOwner}/${appId}`;
      }
      throw new Error(`Invalid app id: ${id}. Must be in the format <appOwner>/<appId>`);
    }
    var APP_NAMESPACES = ["workflows", "comfy"];
    function parseAppId(id) {
      const normalizedId = ensureAppIdFormat(id);
      const parts = normalizedId.split("/");
      if (APP_NAMESPACES.includes(parts[0])) {
        return {
          owner: parts[1],
          alias: parts[2],
          path: parts.slice(3).join("/") || void 0,
          namespace: parts[0]
        };
      }
      return {
        owner: parts[0],
        alias: parts[1],
        path: parts.slice(2).join("/") || void 0
      };
    }
    function isValidUrl(url) {
      try {
        const { host } = new URL(url);
        return /(fal\.(ai|run))$/.test(host);
      } catch (_) {
        return false;
      }
    }
    function throttle(func, limit, leading = false) {
      let lastFunc;
      let lastRan;
      return (...args) => {
        if (!lastRan && leading) {
          func(...args);
          lastRan = Date.now();
        } else {
          if (lastFunc) {
            clearTimeout(lastFunc);
          }
          lastFunc = setTimeout(() => {
            if (Date.now() - lastRan >= limit) {
              func(...args);
              lastRan = Date.now();
            }
          }, limit - (Date.now() - lastRan));
        }
      };
    }
    var isRunningInReact;
    function isReact() {
      if (isRunningInReact === void 0) {
        const stack = new Error().stack;
        isRunningInReact = !!stack && (stack.includes("node_modules/react-dom/") || stack.includes("node_modules/next/"));
      }
      return isRunningInReact;
    }
    function isPlainObject(value) {
      return !!value && Object.getPrototypeOf(value) === Object.prototype;
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/storage.js
var require_storage = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/storage.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.storageImpl = void 0;
    var config_1 = require_config();
    var request_1 = require_request();
    var utils_1 = require_utils();
    function getExtensionFromContentType(contentType) {
      var _a;
      const [_, fileType] = contentType.split("/");
      return (_a = fileType.split(/[-;]/)[0]) !== null && _a !== void 0 ? _a : "bin";
    }
    function initiateUpload(file) {
      return __awaiter(this, void 0, void 0, function* () {
        const contentType = file.type || "application/octet-stream";
        const filename = file.name || `${Date.now()}.${getExtensionFromContentType(contentType)}`;
        return yield (0, request_1.dispatchRequest)("POST", `${(0, config_1.getRestApiUrl)()}/storage/upload/initiate`, {
          content_type: contentType,
          file_name: filename
        });
      });
    }
    exports.storageImpl = {
      upload: (file) => __awaiter(void 0, void 0, void 0, function* () {
        const { fetch: fetch2 } = (0, config_1.getConfig)();
        const { upload_url: uploadUrl, file_url: url } = yield initiateUpload(file);
        const response = yield fetch2(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream"
          }
        });
        const { responseHandler } = (0, config_1.getConfig)();
        yield responseHandler(response);
        return url;
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformInput: (input) => __awaiter(void 0, void 0, void 0, function* () {
        if (Array.isArray(input)) {
          return Promise.all(input.map((item) => exports.storageImpl.transformInput(item)));
        } else if (input instanceof Blob) {
          return yield exports.storageImpl.upload(input);
        } else if ((0, utils_1.isPlainObject)(input)) {
          const inputObject = input;
          const promises = Object.entries(inputObject).map((_a) => __awaiter(void 0, [_a], void 0, function* ([key, value]) {
            return [key, yield exports.storageImpl.transformInput(value)];
          }));
          const results = yield Promise.all(promises);
          return Object.fromEntries(results);
        }
        return input;
      })
    };
  }
});

// ../../node_modules/.pnpm/eventsource-parser@1.1.2/node_modules/eventsource-parser/dist/index.cjs
var require_dist3 = __commonJS({
  "../../node_modules/.pnpm/eventsource-parser@1.1.2/node_modules/eventsource-parser/dist/index.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function createParser(onParse) {
      let isFirstChunk;
      let buffer;
      let startingPosition;
      let startingFieldLength;
      let eventId;
      let eventName;
      let data;
      reset();
      return {
        feed,
        reset
      };
      function reset() {
        isFirstChunk = true;
        buffer = "";
        startingPosition = 0;
        startingFieldLength = -1;
        eventId = void 0;
        eventName = void 0;
        data = "";
      }
      function feed(chunk) {
        buffer = buffer ? buffer + chunk : chunk;
        if (isFirstChunk && hasBom(buffer)) {
          buffer = buffer.slice(BOM.length);
        }
        isFirstChunk = false;
        const length = buffer.length;
        let position = 0;
        let discardTrailingNewline = false;
        while (position < length) {
          if (discardTrailingNewline) {
            if (buffer[position] === "\n") {
              ++position;
            }
            discardTrailingNewline = false;
          }
          let lineLength = -1;
          let fieldLength = startingFieldLength;
          let character;
          for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
            character = buffer[index];
            if (character === ":" && fieldLength < 0) {
              fieldLength = index - position;
            } else if (character === "\r") {
              discardTrailingNewline = true;
              lineLength = index - position;
            } else if (character === "\n") {
              lineLength = index - position;
            }
          }
          if (lineLength < 0) {
            startingPosition = length - position;
            startingFieldLength = fieldLength;
            break;
          } else {
            startingPosition = 0;
            startingFieldLength = -1;
          }
          parseEventStreamLine(buffer, position, fieldLength, lineLength);
          position += lineLength + 1;
        }
        if (position === length) {
          buffer = "";
        } else if (position > 0) {
          buffer = buffer.slice(position);
        }
      }
      function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
        if (lineLength === 0) {
          if (data.length > 0) {
            onParse({
              type: "event",
              id: eventId,
              event: eventName || void 0,
              data: data.slice(0, -1)
              // remove trailing newline
            });
            data = "";
            eventId = void 0;
          }
          eventName = void 0;
          return;
        }
        const noValue = fieldLength < 0;
        const field = lineBuffer.slice(index, index + (noValue ? lineLength : fieldLength));
        let step = 0;
        if (noValue) {
          step = lineLength;
        } else if (lineBuffer[index + fieldLength + 1] === " ") {
          step = fieldLength + 2;
        } else {
          step = fieldLength + 1;
        }
        const position = index + step;
        const valueLength = lineLength - step;
        const value = lineBuffer.slice(position, position + valueLength).toString();
        if (field === "data") {
          data += value ? "".concat(value, "\n") : "\n";
        } else if (field === "event") {
          eventName = value;
        } else if (field === "id" && !value.includes("\0")) {
          eventId = value;
        } else if (field === "retry") {
          const retry = parseInt(value, 10);
          if (!Number.isNaN(retry)) {
            onParse({
              type: "reconnect-interval",
              value: retry
            });
          }
        }
      }
    }
    var BOM = [239, 187, 191];
    function hasBom(buffer) {
      return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
    }
    exports.createParser = createParser;
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/auth.js
var require_auth = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/auth.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TOKEN_EXPIRATION_SECONDS = void 0;
    exports.getTemporaryAuthToken = getTemporaryAuthToken;
    var config_1 = require_config();
    var request_1 = require_request();
    var utils_1 = require_utils();
    exports.TOKEN_EXPIRATION_SECONDS = 120;
    function getTemporaryAuthToken(app2) {
      return __awaiter(this, void 0, void 0, function* () {
        const appId = (0, utils_1.parseAppId)(app2);
        const token = yield (0, request_1.dispatchRequest)("POST", `${(0, config_1.getRestApiUrl)()}/tokens/`, {
          allowed_apps: [appId.alias],
          token_expiration: exports.TOKEN_EXPIRATION_SECONDS
        });
        if (typeof token !== "string" && token["detail"]) {
          return token["detail"];
        }
        return token;
      });
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/streaming.js
var require_streaming = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/streaming.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __await = exports && exports.__await || function(v) {
      return this instanceof __await ? (this.v = v, this) : new __await(v);
    };
    var __asyncGenerator = exports && exports.__asyncGenerator || function(thisArg, _arguments, generator) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var g = generator.apply(thisArg, _arguments || []), i, q = [];
      return i = {}, verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
        return this;
      }, i;
      function awaitReturn(f) {
        return function(v) {
          return Promise.resolve(v).then(f, reject);
        };
      }
      function verb(n, f) {
        if (g[n]) {
          i[n] = function(v) {
            return new Promise(function(a, b) {
              q.push([n, v, a, b]) > 1 || resume(n, v);
            });
          };
          if (f) i[n] = f(i[n]);
        }
      }
      function resume(n, v) {
        try {
          step(g[n](v));
        } catch (e) {
          settle(q[0][3], e);
        }
      }
      function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
      }
      function fulfill(value) {
        resume("next", value);
      }
      function reject(value) {
        resume("throw", value);
      }
      function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FalStream = void 0;
    exports.stream = stream;
    var eventsource_parser_1 = require_dist3();
    var auth_1 = require_auth();
    var config_1 = require_config();
    var function_1 = require_function();
    var request_1 = require_request();
    var response_1 = require_response();
    var storage_1 = require_storage();
    var CONTENT_TYPE_EVENT_STREAM = "text/event-stream";
    var EVENT_STREAM_TIMEOUT = 15 * 1e3;
    var FalStream = class {
      constructor(endpointId, options) {
        var _a;
        this.listeners = /* @__PURE__ */ new Map();
        this.buffer = [];
        this.currentData = void 0;
        this.lastEventTimestamp = 0;
        this.streamClosed = false;
        this.abortController = new AbortController();
        this.start = () => __awaiter(this, void 0, void 0, function* () {
          var _a2, _b;
          const { endpointId: endpointId2, options: options2 } = this;
          const { input, method = "post", connectionMode = "server" } = options2;
          try {
            if (connectionMode === "client") {
              const token = yield (0, auth_1.getTemporaryAuthToken)(endpointId2);
              const { fetch: fetch2 } = (0, config_1.getConfig)();
              const parsedUrl = new URL(this.url);
              parsedUrl.searchParams.set("fal_jwt_token", token);
              const response = yield fetch2(parsedUrl.toString(), {
                method: method.toUpperCase(),
                headers: {
                  accept: (_a2 = options2.accept) !== null && _a2 !== void 0 ? _a2 : CONTENT_TYPE_EVENT_STREAM,
                  "content-type": "application/json"
                },
                body: input && method !== "get" ? JSON.stringify(input) : void 0,
                signal: this.abortController.signal
              });
              return yield this.handleResponse(response);
            }
            return yield (0, request_1.dispatchRequest)(method.toUpperCase(), this.url, input, {
              headers: {
                accept: (_b = options2.accept) !== null && _b !== void 0 ? _b : CONTENT_TYPE_EVENT_STREAM
              },
              responseHandler: this.handleResponse,
              signal: this.abortController.signal
            });
          } catch (error) {
            this.handleError(error);
          }
        });
        this.handleResponse = (response) => __awaiter(this, void 0, void 0, function* () {
          var _a2;
          if (!response.ok) {
            try {
              yield (0, response_1.defaultResponseHandler)(response);
            } catch (error) {
              this.emit("error", error);
            }
            return;
          }
          const body = response.body;
          if (!body) {
            this.emit("error", new response_1.ApiError({
              message: "Response body is empty.",
              status: 400,
              body: void 0
            }));
            return;
          }
          const isEventStream = response.headers.get("content-type").startsWith(CONTENT_TYPE_EVENT_STREAM);
          if (!isEventStream) {
            const reader2 = body.getReader();
            const emitRawChunk = () => {
              reader2.read().then(({ done, value }) => {
                if (done) {
                  this.emit("done", this.currentData);
                  return;
                }
                this.currentData = value;
                this.emit("data", value);
                emitRawChunk();
              });
            };
            emitRawChunk();
            return;
          }
          const decoder = new TextDecoder("utf-8");
          const reader = response.body.getReader();
          const parser = (0, eventsource_parser_1.createParser)((event) => {
            if (event.type === "event") {
              const data = event.data;
              try {
                const parsedData = JSON.parse(data);
                this.buffer.push(parsedData);
                this.currentData = parsedData;
                this.emit("data", parsedData);
                this.emit("message", parsedData);
              } catch (e) {
                this.emit("error", e);
              }
            }
          });
          const timeout = (_a2 = this.options.timeout) !== null && _a2 !== void 0 ? _a2 : EVENT_STREAM_TIMEOUT;
          const readPartialResponse = () => __awaiter(this, void 0, void 0, function* () {
            const { value, done } = yield reader.read();
            this.lastEventTimestamp = Date.now();
            parser.feed(decoder.decode(value));
            if (Date.now() - this.lastEventTimestamp > timeout) {
              this.emit("error", new response_1.ApiError({
                message: `Event stream timed out after ${(timeout / 1e3).toFixed(0)} seconds with no messages.`,
                status: 408
              }));
            }
            if (!done) {
              readPartialResponse().catch(this.handleError);
            } else {
              this.emit("done", this.currentData);
            }
          });
          readPartialResponse().catch(this.handleError);
          return;
        });
        this.handleError = (error) => {
          var _a2;
          const apiError = error instanceof response_1.ApiError ? error : new response_1.ApiError({
            message: (_a2 = error.message) !== null && _a2 !== void 0 ? _a2 : "An unknown error occurred",
            status: 500
          });
          this.emit("error", apiError);
          return;
        };
        this.on = (type, listener) => {
          var _a2;
          if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
          }
          (_a2 = this.listeners.get(type)) === null || _a2 === void 0 ? void 0 : _a2.push(listener);
        };
        this.emit = (type, event) => {
          const listeners = this.listeners.get(type) || [];
          for (const listener of listeners) {
            listener(event);
          }
        };
        this.done = () => __awaiter(this, void 0, void 0, function* () {
          return this.donePromise;
        });
        this.abort = () => {
          this.abortController.abort();
        };
        this.endpointId = endpointId;
        this.url = (_a = options.url) !== null && _a !== void 0 ? _a : (0, function_1.buildUrl)(endpointId, {
          path: "/stream",
          query: options.queryParams
        });
        this.options = options;
        this.donePromise = new Promise((resolve, reject) => {
          if (this.streamClosed) {
            reject(new response_1.ApiError({
              message: "Streaming connection is already closed.",
              status: 400,
              body: void 0
            }));
          }
          this.on("done", (data) => {
            this.streamClosed = true;
            resolve(data);
          });
          this.on("error", (error) => {
            this.streamClosed = true;
            reject(error);
          });
        });
        this.start().catch(this.handleError);
      }
      [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
          let running = true;
          const stopAsyncIterator = () => running = false;
          this.on("error", stopAsyncIterator);
          this.on("done", stopAsyncIterator);
          while (running) {
            const data = this.buffer.shift();
            if (data) {
              yield yield __await(data);
            }
            yield __await(new Promise((resolve) => setTimeout(resolve, 16)));
          }
        });
      }
    };
    exports.FalStream = FalStream;
    function stream(endpointId, options) {
      return __awaiter(this, void 0, void 0, function* () {
        const input = options.input && options.autoUpload !== false ? yield storage_1.storageImpl.transformInput(options.input) : options.input;
        return new FalStream(endpointId, Object.assign(Object.assign({}, options), { input }));
      });
    }
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/function.js
var require_function = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/function.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __rest = exports && exports.__rest || function(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
        }
      return t;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.queue = void 0;
    exports.buildUrl = buildUrl;
    exports.send = send;
    exports.run = run;
    exports.subscribe = subscribe2;
    var request_1 = require_request();
    var storage_1 = require_storage();
    var streaming_1 = require_streaming();
    var utils_1 = require_utils();
    function buildUrl(id, options = {}) {
      var _a, _b;
      const method = ((_a = options.method) !== null && _a !== void 0 ? _a : "post").toLowerCase();
      const path3 = ((_b = options.path) !== null && _b !== void 0 ? _b : "").replace(/^\//, "").replace(/\/{2,}/, "/");
      const input = options.input;
      const params = Object.assign(Object.assign({}, options.query || {}), method === "get" ? input : {});
      const queryParams = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
      if ((0, utils_1.isValidUrl)(id)) {
        const url2 = id.endsWith("/") ? id : `${id}/`;
        return `${url2}${path3}${queryParams}`;
      }
      const appId = (0, utils_1.ensureAppIdFormat)(id);
      const subdomain = options.subdomain ? `${options.subdomain}.` : "";
      const url = `https://${subdomain}fal.run/${appId}/${path3}`;
      return `${url.replace(/\/$/, "")}${queryParams}`;
    }
    function send(id_1) {
      return __awaiter(this, arguments, void 0, function* (id, options = {}) {
        var _a;
        const input = options.input && options.autoUpload !== false ? yield storage_1.storageImpl.transformInput(options.input) : options.input;
        return (0, request_1.dispatchRequest)((_a = options.method) !== null && _a !== void 0 ? _a : "post", buildUrl(id, options), input);
      });
    }
    function run(id_1) {
      return __awaiter(this, arguments, void 0, function* (id, options = {}) {
        return send(id, options);
      });
    }
    var DEFAULT_POLL_INTERVAL = 500;
    exports.queue = {
      submit(endpointId, options) {
        return __awaiter(this, void 0, void 0, function* () {
          const { webhookUrl, path: path3 = "" } = options, runOptions = __rest(options, ["webhookUrl", "path"]);
          return send(endpointId, Object.assign(Object.assign({}, runOptions), { subdomain: "queue", method: "post", path: path3, query: webhookUrl ? { fal_webhook: webhookUrl } : void 0 }));
        });
      },
      status(endpointId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (endpointId, { requestId, logs = false }) {
          const appId = (0, utils_1.parseAppId)(endpointId);
          const prefix = appId.namespace ? `${appId.namespace}/` : "";
          return send(`${prefix}${appId.owner}/${appId.alias}`, {
            subdomain: "queue",
            method: "get",
            path: `/requests/${requestId}/status`,
            input: {
              logs: logs ? "1" : "0"
            }
          });
        });
      },
      streamStatus(endpointId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (endpointId, { requestId, logs = false, connectionMode }) {
          const appId = (0, utils_1.parseAppId)(endpointId);
          const prefix = appId.namespace ? `${appId.namespace}/` : "";
          const queryParams = {
            logs: logs ? "1" : "0"
          };
          const url = buildUrl(`${prefix}${appId.owner}/${appId.alias}`, {
            subdomain: "queue",
            path: `/requests/${requestId}/status/stream`,
            query: queryParams
          });
          return new streaming_1.FalStream(endpointId, {
            url,
            method: "get",
            connectionMode,
            queryParams
          });
        });
      },
      subscribeToStatus(endpointId, options) {
        return __awaiter(this, void 0, void 0, function* () {
          const requestId = options.requestId;
          const timeout = options.timeout;
          let timeoutId = void 0;
          const handleCancelError = () => {
          };
          if (options.mode === "streaming") {
            const status = yield exports.queue.streamStatus(endpointId, {
              requestId,
              logs: options.logs,
              connectionMode: "connectionMode" in options ? options.connectionMode : void 0
            });
            const logs = [];
            if (timeout) {
              timeoutId = setTimeout(() => {
                status.abort();
                exports.queue.cancel(endpointId, { requestId }).catch(handleCancelError);
                throw new Error(`Client timed out waiting for the request to complete after ${timeout}ms`);
              }, timeout);
            }
            status.on("data", (data) => {
              if (options.onQueueUpdate) {
                if ("logs" in data && Array.isArray(data.logs) && data.logs.length > 0) {
                  logs.push(...data.logs);
                }
                options.onQueueUpdate("logs" in data ? Object.assign(Object.assign({}, data), { logs }) : data);
              }
            });
            const doneStatus = yield status.done();
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            return doneStatus;
          }
          return new Promise((resolve, reject) => {
            var _a;
            let pollingTimeoutId;
            const pollInterval = "pollInterval" in options && typeof options.pollInterval === "number" ? (_a = options.pollInterval) !== null && _a !== void 0 ? _a : DEFAULT_POLL_INTERVAL : DEFAULT_POLL_INTERVAL;
            const clearScheduledTasks = () => {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              if (pollingTimeoutId) {
                clearTimeout(pollingTimeoutId);
              }
            };
            if (timeout) {
              timeoutId = setTimeout(() => {
                clearScheduledTasks();
                exports.queue.cancel(endpointId, { requestId }).catch(handleCancelError);
                reject(new Error(`Client timed out waiting for the request to complete after ${timeout}ms`));
              }, timeout);
            }
            const poll = () => __awaiter(this, void 0, void 0, function* () {
              var _a2;
              try {
                const requestStatus = yield exports.queue.status(endpointId, {
                  requestId,
                  logs: (_a2 = options.logs) !== null && _a2 !== void 0 ? _a2 : false
                });
                if (options.onQueueUpdate) {
                  options.onQueueUpdate(requestStatus);
                }
                if (requestStatus.status === "COMPLETED") {
                  clearScheduledTasks();
                  resolve(requestStatus);
                  return;
                }
                pollingTimeoutId = setTimeout(poll, pollInterval);
              } catch (error) {
                clearScheduledTasks();
                reject(error);
              }
            });
            poll().catch(reject);
          });
        });
      },
      result(endpointId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (endpointId, { requestId }) {
          const appId = (0, utils_1.parseAppId)(endpointId);
          const prefix = appId.namespace ? `${appId.namespace}/` : "";
          return send(`${prefix}${appId.owner}/${appId.alias}`, {
            subdomain: "queue",
            method: "get",
            path: `/requests/${requestId}`
          });
        });
      },
      cancel(endpointId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (endpointId, { requestId }) {
          const appId = (0, utils_1.parseAppId)(endpointId);
          const prefix = appId.namespace ? `${appId.namespace}/` : "";
          yield send(`${prefix}${appId.owner}/${appId.alias}`, {
            subdomain: "queue",
            method: "put",
            path: `/requests/${requestId}/cancel`
          });
        });
      }
    };
    function subscribe2(endpointId_1) {
      return __awaiter(this, arguments, void 0, function* (endpointId, options = {}) {
        const { request_id: requestId } = yield exports.queue.submit(endpointId, options);
        if (options.onEnqueue) {
          options.onEnqueue(requestId);
        }
        yield exports.queue.subscribeToStatus(endpointId, Object.assign({ requestId }, options));
        return exports.queue.result(endpointId, { requestId });
      });
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/utf8.cjs
var require_utf8 = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/utf8.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.utf8Count = utf8Count;
    exports.utf8EncodeJs = utf8EncodeJs;
    exports.utf8EncodeTE = utf8EncodeTE;
    exports.utf8Encode = utf8Encode;
    exports.utf8DecodeJs = utf8DecodeJs;
    exports.utf8DecodeTD = utf8DecodeTD;
    exports.utf8Decode = utf8Decode;
    function utf8Count(str) {
      const strLength = str.length;
      let byteLength = 0;
      let pos = 0;
      while (pos < strLength) {
        let value = str.charCodeAt(pos++);
        if ((value & 4294967168) === 0) {
          byteLength++;
          continue;
        } else if ((value & 4294965248) === 0) {
          byteLength += 2;
        } else {
          if (value >= 55296 && value <= 56319) {
            if (pos < strLength) {
              const extra = str.charCodeAt(pos);
              if ((extra & 64512) === 56320) {
                ++pos;
                value = ((value & 1023) << 10) + (extra & 1023) + 65536;
              }
            }
          }
          if ((value & 4294901760) === 0) {
            byteLength += 3;
          } else {
            byteLength += 4;
          }
        }
      }
      return byteLength;
    }
    function utf8EncodeJs(str, output, outputOffset) {
      const strLength = str.length;
      let offset = outputOffset;
      let pos = 0;
      while (pos < strLength) {
        let value = str.charCodeAt(pos++);
        if ((value & 4294967168) === 0) {
          output[offset++] = value;
          continue;
        } else if ((value & 4294965248) === 0) {
          output[offset++] = value >> 6 & 31 | 192;
        } else {
          if (value >= 55296 && value <= 56319) {
            if (pos < strLength) {
              const extra = str.charCodeAt(pos);
              if ((extra & 64512) === 56320) {
                ++pos;
                value = ((value & 1023) << 10) + (extra & 1023) + 65536;
              }
            }
          }
          if ((value & 4294901760) === 0) {
            output[offset++] = value >> 12 & 15 | 224;
            output[offset++] = value >> 6 & 63 | 128;
          } else {
            output[offset++] = value >> 18 & 7 | 240;
            output[offset++] = value >> 12 & 63 | 128;
            output[offset++] = value >> 6 & 63 | 128;
          }
        }
        output[offset++] = value & 63 | 128;
      }
    }
    var sharedTextEncoder = new TextEncoder();
    var TEXT_ENCODER_THRESHOLD = 50;
    function utf8EncodeTE(str, output, outputOffset) {
      sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
    }
    function utf8Encode(str, output, outputOffset) {
      if (str.length > TEXT_ENCODER_THRESHOLD) {
        utf8EncodeTE(str, output, outputOffset);
      } else {
        utf8EncodeJs(str, output, outputOffset);
      }
    }
    var CHUNK_SIZE = 4096;
    function utf8DecodeJs(bytes, inputOffset, byteLength) {
      let offset = inputOffset;
      const end = offset + byteLength;
      const units = [];
      let result = "";
      while (offset < end) {
        const byte1 = bytes[offset++];
        if ((byte1 & 128) === 0) {
          units.push(byte1);
        } else if ((byte1 & 224) === 192) {
          const byte2 = bytes[offset++] & 63;
          units.push((byte1 & 31) << 6 | byte2);
        } else if ((byte1 & 240) === 224) {
          const byte2 = bytes[offset++] & 63;
          const byte3 = bytes[offset++] & 63;
          units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
        } else if ((byte1 & 248) === 240) {
          const byte2 = bytes[offset++] & 63;
          const byte3 = bytes[offset++] & 63;
          const byte4 = bytes[offset++] & 63;
          let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
          if (unit > 65535) {
            unit -= 65536;
            units.push(unit >>> 10 & 1023 | 55296);
            unit = 56320 | unit & 1023;
          }
          units.push(unit);
        } else {
          units.push(byte1);
        }
        if (units.length >= CHUNK_SIZE) {
          result += String.fromCharCode(...units);
          units.length = 0;
        }
      }
      if (units.length > 0) {
        result += String.fromCharCode(...units);
      }
      return result;
    }
    var sharedTextDecoder = new TextDecoder();
    var TEXT_DECODER_THRESHOLD = 200;
    function utf8DecodeTD(bytes, inputOffset, byteLength) {
      const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
      return sharedTextDecoder.decode(stringBytes);
    }
    function utf8Decode(bytes, inputOffset, byteLength) {
      if (byteLength > TEXT_DECODER_THRESHOLD) {
        return utf8DecodeTD(bytes, inputOffset, byteLength);
      } else {
        return utf8DecodeJs(bytes, inputOffset, byteLength);
      }
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/ExtData.cjs
var require_ExtData = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/ExtData.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtData = void 0;
    var ExtData = class {
      type;
      data;
      constructor(type, data) {
        this.type = type;
        this.data = data;
      }
    };
    exports.ExtData = ExtData;
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/DecodeError.cjs
var require_DecodeError = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/DecodeError.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecodeError = void 0;
    var DecodeError = class _DecodeError extends Error {
      constructor(message) {
        super(message);
        const proto = Object.create(_DecodeError.prototype);
        Object.setPrototypeOf(this, proto);
        Object.defineProperty(this, "name", {
          configurable: true,
          enumerable: false,
          value: _DecodeError.name
        });
      }
    };
    exports.DecodeError = DecodeError;
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/int.cjs
var require_int = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/int.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UINT32_MAX = void 0;
    exports.setUint64 = setUint64;
    exports.setInt64 = setInt64;
    exports.getInt64 = getInt64;
    exports.getUint64 = getUint64;
    exports.UINT32_MAX = 4294967295;
    function setUint64(view, offset, value) {
      const high = value / 4294967296;
      const low = value;
      view.setUint32(offset, high);
      view.setUint32(offset + 4, low);
    }
    function setInt64(view, offset, value) {
      const high = Math.floor(value / 4294967296);
      const low = value;
      view.setUint32(offset, high);
      view.setUint32(offset + 4, low);
    }
    function getInt64(view, offset) {
      const high = view.getInt32(offset);
      const low = view.getUint32(offset + 4);
      return high * 4294967296 + low;
    }
    function getUint64(view, offset) {
      const high = view.getUint32(offset);
      const low = view.getUint32(offset + 4);
      return high * 4294967296 + low;
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/timestamp.cjs
var require_timestamp = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/timestamp.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timestampExtension = exports.EXT_TIMESTAMP = void 0;
    exports.encodeTimeSpecToTimestamp = encodeTimeSpecToTimestamp;
    exports.encodeDateToTimeSpec = encodeDateToTimeSpec;
    exports.encodeTimestampExtension = encodeTimestampExtension;
    exports.decodeTimestampToTimeSpec = decodeTimestampToTimeSpec;
    exports.decodeTimestampExtension = decodeTimestampExtension;
    var DecodeError_ts_1 = require_DecodeError();
    var int_ts_1 = require_int();
    exports.EXT_TIMESTAMP = -1;
    var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
    var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
    function encodeTimeSpecToTimestamp({ sec, nsec }) {
      if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
        if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
          const rv = new Uint8Array(4);
          const view = new DataView(rv.buffer);
          view.setUint32(0, sec);
          return rv;
        } else {
          const secHigh = sec / 4294967296;
          const secLow = sec & 4294967295;
          const rv = new Uint8Array(8);
          const view = new DataView(rv.buffer);
          view.setUint32(0, nsec << 2 | secHigh & 3);
          view.setUint32(4, secLow);
          return rv;
        }
      } else {
        const rv = new Uint8Array(12);
        const view = new DataView(rv.buffer);
        view.setUint32(0, nsec);
        (0, int_ts_1.setInt64)(view, 4, sec);
        return rv;
      }
    }
    function encodeDateToTimeSpec(date) {
      const msec = date.getTime();
      const sec = Math.floor(msec / 1e3);
      const nsec = (msec - sec * 1e3) * 1e6;
      const nsecInSec = Math.floor(nsec / 1e9);
      return {
        sec: sec + nsecInSec,
        nsec: nsec - nsecInSec * 1e9
      };
    }
    function encodeTimestampExtension(object) {
      if (object instanceof Date) {
        const timeSpec = encodeDateToTimeSpec(object);
        return encodeTimeSpecToTimestamp(timeSpec);
      } else {
        return null;
      }
    }
    function decodeTimestampToTimeSpec(data) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      switch (data.byteLength) {
        case 4: {
          const sec = view.getUint32(0);
          const nsec = 0;
          return { sec, nsec };
        }
        case 8: {
          const nsec30AndSecHigh2 = view.getUint32(0);
          const secLow32 = view.getUint32(4);
          const sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
          const nsec = nsec30AndSecHigh2 >>> 2;
          return { sec, nsec };
        }
        case 12: {
          const sec = (0, int_ts_1.getInt64)(view, 4);
          const nsec = view.getUint32(0);
          return { sec, nsec };
        }
        default:
          throw new DecodeError_ts_1.DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
      }
    }
    function decodeTimestampExtension(data) {
      const timeSpec = decodeTimestampToTimeSpec(data);
      return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
    }
    exports.timestampExtension = {
      type: exports.EXT_TIMESTAMP,
      encode: encodeTimestampExtension,
      decode: decodeTimestampExtension
    };
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/ExtensionCodec.cjs
var require_ExtensionCodec = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/ExtensionCodec.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionCodec = void 0;
    var ExtData_ts_1 = require_ExtData();
    var timestamp_ts_1 = require_timestamp();
    var ExtensionCodec = class _ExtensionCodec {
      static defaultCodec = new _ExtensionCodec();
      // ensures ExtensionCodecType<X> matches ExtensionCodec<X>
      // this will make type errors a lot more clear
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __brand;
      // built-in extensions
      builtInEncoders = [];
      builtInDecoders = [];
      // custom extensions
      encoders = [];
      decoders = [];
      constructor() {
        this.register(timestamp_ts_1.timestampExtension);
      }
      register({ type, encode, decode }) {
        if (type >= 0) {
          this.encoders[type] = encode;
          this.decoders[type] = decode;
        } else {
          const index = -1 - type;
          this.builtInEncoders[index] = encode;
          this.builtInDecoders[index] = decode;
        }
      }
      tryToEncode(object, context) {
        for (let i = 0; i < this.builtInEncoders.length; i++) {
          const encodeExt = this.builtInEncoders[i];
          if (encodeExt != null) {
            const data = encodeExt(object, context);
            if (data != null) {
              const type = -1 - i;
              return new ExtData_ts_1.ExtData(type, data);
            }
          }
        }
        for (let i = 0; i < this.encoders.length; i++) {
          const encodeExt = this.encoders[i];
          if (encodeExt != null) {
            const data = encodeExt(object, context);
            if (data != null) {
              const type = i;
              return new ExtData_ts_1.ExtData(type, data);
            }
          }
        }
        if (object instanceof ExtData_ts_1.ExtData) {
          return object;
        }
        return null;
      }
      decode(data, type, context) {
        const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
        if (decodeExt) {
          return decodeExt(data, type, context);
        } else {
          return new ExtData_ts_1.ExtData(type, data);
        }
      }
    };
    exports.ExtensionCodec = ExtensionCodec;
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/typedArrays.cjs
var require_typedArrays = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/typedArrays.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ensureUint8Array = ensureUint8Array;
    function isArrayBufferLike(buffer) {
      return buffer instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
    }
    function ensureUint8Array(buffer) {
      if (buffer instanceof Uint8Array) {
        return buffer;
      } else if (ArrayBuffer.isView(buffer)) {
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } else if (isArrayBufferLike(buffer)) {
        return new Uint8Array(buffer);
      } else {
        return Uint8Array.from(buffer);
      }
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/Encoder.cjs
var require_Encoder = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/Encoder.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Encoder = exports.DEFAULT_INITIAL_BUFFER_SIZE = exports.DEFAULT_MAX_DEPTH = void 0;
    var utf8_ts_1 = require_utf8();
    var ExtensionCodec_ts_1 = require_ExtensionCodec();
    var int_ts_1 = require_int();
    var typedArrays_ts_1 = require_typedArrays();
    exports.DEFAULT_MAX_DEPTH = 100;
    exports.DEFAULT_INITIAL_BUFFER_SIZE = 2048;
    var Encoder = class _Encoder {
      extensionCodec;
      context;
      useBigInt64;
      maxDepth;
      initialBufferSize;
      sortKeys;
      forceFloat32;
      ignoreUndefined;
      forceIntegerToFloat;
      pos;
      view;
      bytes;
      entered = false;
      constructor(options) {
        this.extensionCodec = options?.extensionCodec ?? ExtensionCodec_ts_1.ExtensionCodec.defaultCodec;
        this.context = options?.context;
        this.useBigInt64 = options?.useBigInt64 ?? false;
        this.maxDepth = options?.maxDepth ?? exports.DEFAULT_MAX_DEPTH;
        this.initialBufferSize = options?.initialBufferSize ?? exports.DEFAULT_INITIAL_BUFFER_SIZE;
        this.sortKeys = options?.sortKeys ?? false;
        this.forceFloat32 = options?.forceFloat32 ?? false;
        this.ignoreUndefined = options?.ignoreUndefined ?? false;
        this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;
        this.pos = 0;
        this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
        this.bytes = new Uint8Array(this.view.buffer);
      }
      clone() {
        return new _Encoder({
          extensionCodec: this.extensionCodec,
          context: this.context,
          useBigInt64: this.useBigInt64,
          maxDepth: this.maxDepth,
          initialBufferSize: this.initialBufferSize,
          sortKeys: this.sortKeys,
          forceFloat32: this.forceFloat32,
          ignoreUndefined: this.ignoreUndefined,
          forceIntegerToFloat: this.forceIntegerToFloat
        });
      }
      reinitializeState() {
        this.pos = 0;
      }
      /**
       * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
       *
       * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
       */
      encodeSharedRef(object) {
        if (this.entered) {
          const instance = this.clone();
          return instance.encodeSharedRef(object);
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.doEncode(object, 1);
          return this.bytes.subarray(0, this.pos);
        } finally {
          this.entered = false;
        }
      }
      /**
       * @returns Encodes the object and returns a copy of the encoder's internal buffer.
       */
      encode(object) {
        if (this.entered) {
          const instance = this.clone();
          return instance.encode(object);
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.doEncode(object, 1);
          return this.bytes.slice(0, this.pos);
        } finally {
          this.entered = false;
        }
      }
      doEncode(object, depth) {
        if (depth > this.maxDepth) {
          throw new Error(`Too deep objects in depth ${depth}`);
        }
        if (object == null) {
          this.encodeNil();
        } else if (typeof object === "boolean") {
          this.encodeBoolean(object);
        } else if (typeof object === "number") {
          if (!this.forceIntegerToFloat) {
            this.encodeNumber(object);
          } else {
            this.encodeNumberAsFloat(object);
          }
        } else if (typeof object === "string") {
          this.encodeString(object);
        } else if (this.useBigInt64 && typeof object === "bigint") {
          this.encodeBigInt64(object);
        } else {
          this.encodeObject(object, depth);
        }
      }
      ensureBufferSizeToWrite(sizeToWrite) {
        const requiredSize = this.pos + sizeToWrite;
        if (this.view.byteLength < requiredSize) {
          this.resizeBuffer(requiredSize * 2);
        }
      }
      resizeBuffer(newSize) {
        const newBuffer = new ArrayBuffer(newSize);
        const newBytes = new Uint8Array(newBuffer);
        const newView = new DataView(newBuffer);
        newBytes.set(this.bytes);
        this.view = newView;
        this.bytes = newBytes;
      }
      encodeNil() {
        this.writeU8(192);
      }
      encodeBoolean(object) {
        if (object === false) {
          this.writeU8(194);
        } else {
          this.writeU8(195);
        }
      }
      encodeNumber(object) {
        if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
          if (object >= 0) {
            if (object < 128) {
              this.writeU8(object);
            } else if (object < 256) {
              this.writeU8(204);
              this.writeU8(object);
            } else if (object < 65536) {
              this.writeU8(205);
              this.writeU16(object);
            } else if (object < 4294967296) {
              this.writeU8(206);
              this.writeU32(object);
            } else if (!this.useBigInt64) {
              this.writeU8(207);
              this.writeU64(object);
            } else {
              this.encodeNumberAsFloat(object);
            }
          } else {
            if (object >= -32) {
              this.writeU8(224 | object + 32);
            } else if (object >= -128) {
              this.writeU8(208);
              this.writeI8(object);
            } else if (object >= -32768) {
              this.writeU8(209);
              this.writeI16(object);
            } else if (object >= -2147483648) {
              this.writeU8(210);
              this.writeI32(object);
            } else if (!this.useBigInt64) {
              this.writeU8(211);
              this.writeI64(object);
            } else {
              this.encodeNumberAsFloat(object);
            }
          }
        } else {
          this.encodeNumberAsFloat(object);
        }
      }
      encodeNumberAsFloat(object) {
        if (this.forceFloat32) {
          this.writeU8(202);
          this.writeF32(object);
        } else {
          this.writeU8(203);
          this.writeF64(object);
        }
      }
      encodeBigInt64(object) {
        if (object >= BigInt(0)) {
          this.writeU8(207);
          this.writeBigUint64(object);
        } else {
          this.writeU8(211);
          this.writeBigInt64(object);
        }
      }
      writeStringHeader(byteLength) {
        if (byteLength < 32) {
          this.writeU8(160 + byteLength);
        } else if (byteLength < 256) {
          this.writeU8(217);
          this.writeU8(byteLength);
        } else if (byteLength < 65536) {
          this.writeU8(218);
          this.writeU16(byteLength);
        } else if (byteLength < 4294967296) {
          this.writeU8(219);
          this.writeU32(byteLength);
        } else {
          throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
        }
      }
      encodeString(object) {
        const maxHeaderSize = 1 + 4;
        const byteLength = (0, utf8_ts_1.utf8Count)(object);
        this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
        this.writeStringHeader(byteLength);
        (0, utf8_ts_1.utf8Encode)(object, this.bytes, this.pos);
        this.pos += byteLength;
      }
      encodeObject(object, depth) {
        const ext = this.extensionCodec.tryToEncode(object, this.context);
        if (ext != null) {
          this.encodeExtension(ext);
        } else if (Array.isArray(object)) {
          this.encodeArray(object, depth);
        } else if (ArrayBuffer.isView(object)) {
          this.encodeBinary(object);
        } else if (typeof object === "object") {
          this.encodeMap(object, depth);
        } else {
          throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
        }
      }
      encodeBinary(object) {
        const size = object.byteLength;
        if (size < 256) {
          this.writeU8(196);
          this.writeU8(size);
        } else if (size < 65536) {
          this.writeU8(197);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(198);
          this.writeU32(size);
        } else {
          throw new Error(`Too large binary: ${size}`);
        }
        const bytes = (0, typedArrays_ts_1.ensureUint8Array)(object);
        this.writeU8a(bytes);
      }
      encodeArray(object, depth) {
        const size = object.length;
        if (size < 16) {
          this.writeU8(144 + size);
        } else if (size < 65536) {
          this.writeU8(220);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(221);
          this.writeU32(size);
        } else {
          throw new Error(`Too large array: ${size}`);
        }
        for (const item of object) {
          this.doEncode(item, depth + 1);
        }
      }
      countWithoutUndefined(object, keys) {
        let count = 0;
        for (const key of keys) {
          if (object[key] !== void 0) {
            count++;
          }
        }
        return count;
      }
      encodeMap(object, depth) {
        const keys = Object.keys(object);
        if (this.sortKeys) {
          keys.sort();
        }
        const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
        if (size < 16) {
          this.writeU8(128 + size);
        } else if (size < 65536) {
          this.writeU8(222);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(223);
          this.writeU32(size);
        } else {
          throw new Error(`Too large map object: ${size}`);
        }
        for (const key of keys) {
          const value = object[key];
          if (!(this.ignoreUndefined && value === void 0)) {
            this.encodeString(key);
            this.doEncode(value, depth + 1);
          }
        }
      }
      encodeExtension(ext) {
        if (typeof ext.data === "function") {
          const data = ext.data(this.pos + 6);
          const size2 = data.length;
          if (size2 >= 4294967296) {
            throw new Error(`Too large extension object: ${size2}`);
          }
          this.writeU8(201);
          this.writeU32(size2);
          this.writeI8(ext.type);
          this.writeU8a(data);
          return;
        }
        const size = ext.data.length;
        if (size === 1) {
          this.writeU8(212);
        } else if (size === 2) {
          this.writeU8(213);
        } else if (size === 4) {
          this.writeU8(214);
        } else if (size === 8) {
          this.writeU8(215);
        } else if (size === 16) {
          this.writeU8(216);
        } else if (size < 256) {
          this.writeU8(199);
          this.writeU8(size);
        } else if (size < 65536) {
          this.writeU8(200);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(201);
          this.writeU32(size);
        } else {
          throw new Error(`Too large extension object: ${size}`);
        }
        this.writeI8(ext.type);
        this.writeU8a(ext.data);
      }
      writeU8(value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setUint8(this.pos, value);
        this.pos++;
      }
      writeU8a(values) {
        const size = values.length;
        this.ensureBufferSizeToWrite(size);
        this.bytes.set(values, this.pos);
        this.pos += size;
      }
      writeI8(value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setInt8(this.pos, value);
        this.pos++;
      }
      writeU16(value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setUint16(this.pos, value);
        this.pos += 2;
      }
      writeI16(value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setInt16(this.pos, value);
        this.pos += 2;
      }
      writeU32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setUint32(this.pos, value);
        this.pos += 4;
      }
      writeI32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setInt32(this.pos, value);
        this.pos += 4;
      }
      writeF32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setFloat32(this.pos, value);
        this.pos += 4;
      }
      writeF64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setFloat64(this.pos, value);
        this.pos += 8;
      }
      writeU64(value) {
        this.ensureBufferSizeToWrite(8);
        (0, int_ts_1.setUint64)(this.view, this.pos, value);
        this.pos += 8;
      }
      writeI64(value) {
        this.ensureBufferSizeToWrite(8);
        (0, int_ts_1.setInt64)(this.view, this.pos, value);
        this.pos += 8;
      }
      writeBigUint64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setBigUint64(this.pos, value);
        this.pos += 8;
      }
      writeBigInt64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setBigInt64(this.pos, value);
        this.pos += 8;
      }
    };
    exports.Encoder = Encoder;
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/encode.cjs
var require_encode = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/encode.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.encode = encode;
    var Encoder_ts_1 = require_Encoder();
    function encode(value, options) {
      const encoder = new Encoder_ts_1.Encoder(options);
      return encoder.encodeSharedRef(value);
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/prettyByte.cjs
var require_prettyByte = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/prettyByte.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prettyByte = prettyByte;
    function prettyByte(byte) {
      return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/CachedKeyDecoder.cjs
var require_CachedKeyDecoder = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/CachedKeyDecoder.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedKeyDecoder = void 0;
    var utf8_ts_1 = require_utf8();
    var DEFAULT_MAX_KEY_LENGTH = 16;
    var DEFAULT_MAX_LENGTH_PER_KEY = 16;
    var CachedKeyDecoder = class {
      hit = 0;
      miss = 0;
      caches;
      maxKeyLength;
      maxLengthPerKey;
      constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
        this.maxKeyLength = maxKeyLength;
        this.maxLengthPerKey = maxLengthPerKey;
        this.caches = [];
        for (let i = 0; i < this.maxKeyLength; i++) {
          this.caches.push([]);
        }
      }
      canBeCached(byteLength) {
        return byteLength > 0 && byteLength <= this.maxKeyLength;
      }
      find(bytes, inputOffset, byteLength) {
        const records = this.caches[byteLength - 1];
        FIND_CHUNK: for (const record of records) {
          const recordBytes = record.bytes;
          for (let j = 0; j < byteLength; j++) {
            if (recordBytes[j] !== bytes[inputOffset + j]) {
              continue FIND_CHUNK;
            }
          }
          return record.str;
        }
        return null;
      }
      store(bytes, value) {
        const records = this.caches[bytes.length - 1];
        const record = { bytes, str: value };
        if (records.length >= this.maxLengthPerKey) {
          records[Math.random() * records.length | 0] = record;
        } else {
          records.push(record);
        }
      }
      decode(bytes, inputOffset, byteLength) {
        const cachedValue = this.find(bytes, inputOffset, byteLength);
        if (cachedValue != null) {
          this.hit++;
          return cachedValue;
        }
        this.miss++;
        const str = (0, utf8_ts_1.utf8DecodeJs)(bytes, inputOffset, byteLength);
        const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
        this.store(slicedCopyOfBytes, str);
        return str;
      }
    };
    exports.CachedKeyDecoder = CachedKeyDecoder;
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/Decoder.cjs
var require_Decoder = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/Decoder.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Decoder = void 0;
    var prettyByte_ts_1 = require_prettyByte();
    var ExtensionCodec_ts_1 = require_ExtensionCodec();
    var int_ts_1 = require_int();
    var utf8_ts_1 = require_utf8();
    var typedArrays_ts_1 = require_typedArrays();
    var CachedKeyDecoder_ts_1 = require_CachedKeyDecoder();
    var DecodeError_ts_1 = require_DecodeError();
    var STATE_ARRAY = "array";
    var STATE_MAP_KEY = "map_key";
    var STATE_MAP_VALUE = "map_value";
    var mapKeyConverter = (key) => {
      if (typeof key === "string" || typeof key === "number") {
        return key;
      }
      throw new DecodeError_ts_1.DecodeError("The type of key must be string or number but " + typeof key);
    };
    var StackPool = class {
      stack = [];
      stackHeadPosition = -1;
      get length() {
        return this.stackHeadPosition + 1;
      }
      top() {
        return this.stack[this.stackHeadPosition];
      }
      pushArrayState(size) {
        const state = this.getUninitializedStateFromPool();
        state.type = STATE_ARRAY;
        state.position = 0;
        state.size = size;
        state.array = new Array(size);
      }
      pushMapState(size) {
        const state = this.getUninitializedStateFromPool();
        state.type = STATE_MAP_KEY;
        state.readCount = 0;
        state.size = size;
        state.map = {};
      }
      getUninitializedStateFromPool() {
        this.stackHeadPosition++;
        if (this.stackHeadPosition === this.stack.length) {
          const partialState = {
            type: void 0,
            size: 0,
            array: void 0,
            position: 0,
            readCount: 0,
            map: void 0,
            key: null
          };
          this.stack.push(partialState);
        }
        return this.stack[this.stackHeadPosition];
      }
      release(state) {
        const topStackState = this.stack[this.stackHeadPosition];
        if (topStackState !== state) {
          throw new Error("Invalid stack state. Released state is not on top of the stack.");
        }
        if (state.type === STATE_ARRAY) {
          const partialState = state;
          partialState.size = 0;
          partialState.array = void 0;
          partialState.position = 0;
          partialState.type = void 0;
        }
        if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
          const partialState = state;
          partialState.size = 0;
          partialState.map = void 0;
          partialState.readCount = 0;
          partialState.type = void 0;
        }
        this.stackHeadPosition--;
      }
      reset() {
        this.stack.length = 0;
        this.stackHeadPosition = -1;
      }
    };
    var HEAD_BYTE_REQUIRED = -1;
    var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
    var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
    try {
      EMPTY_VIEW.getInt8(0);
    } catch (e) {
      if (!(e instanceof RangeError)) {
        throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
      }
    }
    var MORE_DATA = new RangeError("Insufficient data");
    var sharedCachedKeyDecoder = new CachedKeyDecoder_ts_1.CachedKeyDecoder();
    var Decoder = class _Decoder {
      extensionCodec;
      context;
      useBigInt64;
      rawStrings;
      maxStrLength;
      maxBinLength;
      maxArrayLength;
      maxMapLength;
      maxExtLength;
      keyDecoder;
      mapKeyConverter;
      totalPos = 0;
      pos = 0;
      view = EMPTY_VIEW;
      bytes = EMPTY_BYTES;
      headByte = HEAD_BYTE_REQUIRED;
      stack = new StackPool();
      entered = false;
      constructor(options) {
        this.extensionCodec = options?.extensionCodec ?? ExtensionCodec_ts_1.ExtensionCodec.defaultCodec;
        this.context = options?.context;
        this.useBigInt64 = options?.useBigInt64 ?? false;
        this.rawStrings = options?.rawStrings ?? false;
        this.maxStrLength = options?.maxStrLength ?? int_ts_1.UINT32_MAX;
        this.maxBinLength = options?.maxBinLength ?? int_ts_1.UINT32_MAX;
        this.maxArrayLength = options?.maxArrayLength ?? int_ts_1.UINT32_MAX;
        this.maxMapLength = options?.maxMapLength ?? int_ts_1.UINT32_MAX;
        this.maxExtLength = options?.maxExtLength ?? int_ts_1.UINT32_MAX;
        this.keyDecoder = options?.keyDecoder !== void 0 ? options.keyDecoder : sharedCachedKeyDecoder;
        this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
      }
      clone() {
        return new _Decoder({
          extensionCodec: this.extensionCodec,
          context: this.context,
          useBigInt64: this.useBigInt64,
          rawStrings: this.rawStrings,
          maxStrLength: this.maxStrLength,
          maxBinLength: this.maxBinLength,
          maxArrayLength: this.maxArrayLength,
          maxMapLength: this.maxMapLength,
          maxExtLength: this.maxExtLength,
          keyDecoder: this.keyDecoder
        });
      }
      reinitializeState() {
        this.totalPos = 0;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack.reset();
      }
      setBuffer(buffer) {
        const bytes = (0, typedArrays_ts_1.ensureUint8Array)(buffer);
        this.bytes = bytes;
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        this.pos = 0;
      }
      appendBuffer(buffer) {
        if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
          this.setBuffer(buffer);
        } else {
          const remainingData = this.bytes.subarray(this.pos);
          const newData = (0, typedArrays_ts_1.ensureUint8Array)(buffer);
          const newBuffer = new Uint8Array(remainingData.length + newData.length);
          newBuffer.set(remainingData);
          newBuffer.set(newData, remainingData.length);
          this.setBuffer(newBuffer);
        }
      }
      hasRemaining(size) {
        return this.view.byteLength - this.pos >= size;
      }
      createExtraByteError(posToShow) {
        const { view, pos } = this;
        return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
      }
      /**
       * @throws {@link DecodeError}
       * @throws {@link RangeError}
       */
      decode(buffer) {
        if (this.entered) {
          const instance = this.clone();
          return instance.decode(buffer);
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.setBuffer(buffer);
          const object = this.doDecodeSync();
          if (this.hasRemaining(1)) {
            throw this.createExtraByteError(this.pos);
          }
          return object;
        } finally {
          this.entered = false;
        }
      }
      *decodeMulti(buffer) {
        if (this.entered) {
          const instance = this.clone();
          yield* instance.decodeMulti(buffer);
          return;
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.setBuffer(buffer);
          while (this.hasRemaining(1)) {
            yield this.doDecodeSync();
          }
        } finally {
          this.entered = false;
        }
      }
      async decodeAsync(stream) {
        if (this.entered) {
          const instance = this.clone();
          return instance.decodeAsync(stream);
        }
        try {
          this.entered = true;
          let decoded = false;
          let object;
          for await (const buffer of stream) {
            if (decoded) {
              this.entered = false;
              throw this.createExtraByteError(this.totalPos);
            }
            this.appendBuffer(buffer);
            try {
              object = this.doDecodeSync();
              decoded = true;
            } catch (e) {
              if (!(e instanceof RangeError)) {
                throw e;
              }
            }
            this.totalPos += this.pos;
          }
          if (decoded) {
            if (this.hasRemaining(1)) {
              throw this.createExtraByteError(this.totalPos);
            }
            return object;
          }
          const { headByte, pos, totalPos } = this;
          throw new RangeError(`Insufficient data in parsing ${(0, prettyByte_ts_1.prettyByte)(headByte)} at ${totalPos} (${pos} in the current buffer)`);
        } finally {
          this.entered = false;
        }
      }
      decodeArrayStream(stream) {
        return this.decodeMultiAsync(stream, true);
      }
      decodeStream(stream) {
        return this.decodeMultiAsync(stream, false);
      }
      async *decodeMultiAsync(stream, isArray) {
        if (this.entered) {
          const instance = this.clone();
          yield* instance.decodeMultiAsync(stream, isArray);
          return;
        }
        try {
          this.entered = true;
          let isArrayHeaderRequired = isArray;
          let arrayItemsLeft = -1;
          for await (const buffer of stream) {
            if (isArray && arrayItemsLeft === 0) {
              throw this.createExtraByteError(this.totalPos);
            }
            this.appendBuffer(buffer);
            if (isArrayHeaderRequired) {
              arrayItemsLeft = this.readArraySize();
              isArrayHeaderRequired = false;
              this.complete();
            }
            try {
              while (true) {
                yield this.doDecodeSync();
                if (--arrayItemsLeft === 0) {
                  break;
                }
              }
            } catch (e) {
              if (!(e instanceof RangeError)) {
                throw e;
              }
            }
            this.totalPos += this.pos;
          }
        } finally {
          this.entered = false;
        }
      }
      doDecodeSync() {
        DECODE: while (true) {
          const headByte = this.readHeadByte();
          let object;
          if (headByte >= 224) {
            object = headByte - 256;
          } else if (headByte < 192) {
            if (headByte < 128) {
              object = headByte;
            } else if (headByte < 144) {
              const size = headByte - 128;
              if (size !== 0) {
                this.pushMapState(size);
                this.complete();
                continue DECODE;
              } else {
                object = {};
              }
            } else if (headByte < 160) {
              const size = headByte - 144;
              if (size !== 0) {
                this.pushArrayState(size);
                this.complete();
                continue DECODE;
              } else {
                object = [];
              }
            } else {
              const byteLength = headByte - 160;
              object = this.decodeString(byteLength, 0);
            }
          } else if (headByte === 192) {
            object = null;
          } else if (headByte === 194) {
            object = false;
          } else if (headByte === 195) {
            object = true;
          } else if (headByte === 202) {
            object = this.readF32();
          } else if (headByte === 203) {
            object = this.readF64();
          } else if (headByte === 204) {
            object = this.readU8();
          } else if (headByte === 205) {
            object = this.readU16();
          } else if (headByte === 206) {
            object = this.readU32();
          } else if (headByte === 207) {
            if (this.useBigInt64) {
              object = this.readU64AsBigInt();
            } else {
              object = this.readU64();
            }
          } else if (headByte === 208) {
            object = this.readI8();
          } else if (headByte === 209) {
            object = this.readI16();
          } else if (headByte === 210) {
            object = this.readI32();
          } else if (headByte === 211) {
            if (this.useBigInt64) {
              object = this.readI64AsBigInt();
            } else {
              object = this.readI64();
            }
          } else if (headByte === 217) {
            const byteLength = this.lookU8();
            object = this.decodeString(byteLength, 1);
          } else if (headByte === 218) {
            const byteLength = this.lookU16();
            object = this.decodeString(byteLength, 2);
          } else if (headByte === 219) {
            const byteLength = this.lookU32();
            object = this.decodeString(byteLength, 4);
          } else if (headByte === 220) {
            const size = this.readU16();
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else if (headByte === 221) {
            const size = this.readU32();
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else if (headByte === 222) {
            const size = this.readU16();
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte === 223) {
            const size = this.readU32();
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte === 196) {
            const size = this.lookU8();
            object = this.decodeBinary(size, 1);
          } else if (headByte === 197) {
            const size = this.lookU16();
            object = this.decodeBinary(size, 2);
          } else if (headByte === 198) {
            const size = this.lookU32();
            object = this.decodeBinary(size, 4);
          } else if (headByte === 212) {
            object = this.decodeExtension(1, 0);
          } else if (headByte === 213) {
            object = this.decodeExtension(2, 0);
          } else if (headByte === 214) {
            object = this.decodeExtension(4, 0);
          } else if (headByte === 215) {
            object = this.decodeExtension(8, 0);
          } else if (headByte === 216) {
            object = this.decodeExtension(16, 0);
          } else if (headByte === 199) {
            const size = this.lookU8();
            object = this.decodeExtension(size, 1);
          } else if (headByte === 200) {
            const size = this.lookU16();
            object = this.decodeExtension(size, 2);
          } else if (headByte === 201) {
            const size = this.lookU32();
            object = this.decodeExtension(size, 4);
          } else {
            throw new DecodeError_ts_1.DecodeError(`Unrecognized type byte: ${(0, prettyByte_ts_1.prettyByte)(headByte)}`);
          }
          this.complete();
          const stack = this.stack;
          while (stack.length > 0) {
            const state = stack.top();
            if (state.type === STATE_ARRAY) {
              state.array[state.position] = object;
              state.position++;
              if (state.position === state.size) {
                object = state.array;
                stack.release(state);
              } else {
                continue DECODE;
              }
            } else if (state.type === STATE_MAP_KEY) {
              if (object === "__proto__") {
                throw new DecodeError_ts_1.DecodeError("The key __proto__ is not allowed");
              }
              state.key = this.mapKeyConverter(object);
              state.type = STATE_MAP_VALUE;
              continue DECODE;
            } else {
              state.map[state.key] = object;
              state.readCount++;
              if (state.readCount === state.size) {
                object = state.map;
                stack.release(state);
              } else {
                state.key = null;
                state.type = STATE_MAP_KEY;
                continue DECODE;
              }
            }
          }
          return object;
        }
      }
      readHeadByte() {
        if (this.headByte === HEAD_BYTE_REQUIRED) {
          this.headByte = this.readU8();
        }
        return this.headByte;
      }
      complete() {
        this.headByte = HEAD_BYTE_REQUIRED;
      }
      readArraySize() {
        const headByte = this.readHeadByte();
        switch (headByte) {
          case 220:
            return this.readU16();
          case 221:
            return this.readU32();
          default: {
            if (headByte < 160) {
              return headByte - 144;
            } else {
              throw new DecodeError_ts_1.DecodeError(`Unrecognized array type byte: ${(0, prettyByte_ts_1.prettyByte)(headByte)}`);
            }
          }
        }
      }
      pushMapState(size) {
        if (size > this.maxMapLength) {
          throw new DecodeError_ts_1.DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
        }
        this.stack.pushMapState(size);
      }
      pushArrayState(size) {
        if (size > this.maxArrayLength) {
          throw new DecodeError_ts_1.DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
        }
        this.stack.pushArrayState(size);
      }
      decodeString(byteLength, headerOffset) {
        if (!this.rawStrings || this.stateIsMapKey()) {
          return this.decodeUtf8String(byteLength, headerOffset);
        }
        return this.decodeBinary(byteLength, headerOffset);
      }
      /**
       * @throws {@link RangeError}
       */
      decodeUtf8String(byteLength, headerOffset) {
        if (byteLength > this.maxStrLength) {
          throw new DecodeError_ts_1.DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
        }
        if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
          throw MORE_DATA;
        }
        const offset = this.pos + headerOffset;
        let object;
        if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
          object = this.keyDecoder.decode(this.bytes, offset, byteLength);
        } else {
          object = (0, utf8_ts_1.utf8Decode)(this.bytes, offset, byteLength);
        }
        this.pos += headerOffset + byteLength;
        return object;
      }
      stateIsMapKey() {
        if (this.stack.length > 0) {
          const state = this.stack.top();
          return state.type === STATE_MAP_KEY;
        }
        return false;
      }
      /**
       * @throws {@link RangeError}
       */
      decodeBinary(byteLength, headOffset) {
        if (byteLength > this.maxBinLength) {
          throw new DecodeError_ts_1.DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
        }
        if (!this.hasRemaining(byteLength + headOffset)) {
          throw MORE_DATA;
        }
        const offset = this.pos + headOffset;
        const object = this.bytes.subarray(offset, offset + byteLength);
        this.pos += headOffset + byteLength;
        return object;
      }
      decodeExtension(size, headOffset) {
        if (size > this.maxExtLength) {
          throw new DecodeError_ts_1.DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
        }
        const extType = this.view.getInt8(this.pos + headOffset);
        const data = this.decodeBinary(
          size,
          headOffset + 1
          /* extType */
        );
        return this.extensionCodec.decode(data, extType, this.context);
      }
      lookU8() {
        return this.view.getUint8(this.pos);
      }
      lookU16() {
        return this.view.getUint16(this.pos);
      }
      lookU32() {
        return this.view.getUint32(this.pos);
      }
      readU8() {
        const value = this.view.getUint8(this.pos);
        this.pos++;
        return value;
      }
      readI8() {
        const value = this.view.getInt8(this.pos);
        this.pos++;
        return value;
      }
      readU16() {
        const value = this.view.getUint16(this.pos);
        this.pos += 2;
        return value;
      }
      readI16() {
        const value = this.view.getInt16(this.pos);
        this.pos += 2;
        return value;
      }
      readU32() {
        const value = this.view.getUint32(this.pos);
        this.pos += 4;
        return value;
      }
      readI32() {
        const value = this.view.getInt32(this.pos);
        this.pos += 4;
        return value;
      }
      readU64() {
        const value = (0, int_ts_1.getUint64)(this.view, this.pos);
        this.pos += 8;
        return value;
      }
      readI64() {
        const value = (0, int_ts_1.getInt64)(this.view, this.pos);
        this.pos += 8;
        return value;
      }
      readU64AsBigInt() {
        const value = this.view.getBigUint64(this.pos);
        this.pos += 8;
        return value;
      }
      readI64AsBigInt() {
        const value = this.view.getBigInt64(this.pos);
        this.pos += 8;
        return value;
      }
      readF32() {
        const value = this.view.getFloat32(this.pos);
        this.pos += 4;
        return value;
      }
      readF64() {
        const value = this.view.getFloat64(this.pos);
        this.pos += 8;
        return value;
      }
    };
    exports.Decoder = Decoder;
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/decode.cjs
var require_decode = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/decode.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decode = decode;
    exports.decodeMulti = decodeMulti;
    var Decoder_ts_1 = require_Decoder();
    function decode(buffer, options) {
      const decoder = new Decoder_ts_1.Decoder(options);
      return decoder.decode(buffer);
    }
    function decodeMulti(buffer, options) {
      const decoder = new Decoder_ts_1.Decoder(options);
      return decoder.decodeMulti(buffer);
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/stream.cjs
var require_stream = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/utils/stream.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAsyncIterable = isAsyncIterable;
    exports.asyncIterableFromStream = asyncIterableFromStream;
    exports.ensureAsyncIterable = ensureAsyncIterable;
    function isAsyncIterable(object) {
      return object[Symbol.asyncIterator] != null;
    }
    async function* asyncIterableFromStream(stream) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            return;
          }
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    }
    function ensureAsyncIterable(streamLike) {
      if (isAsyncIterable(streamLike)) {
        return streamLike;
      } else {
        return asyncIterableFromStream(streamLike);
      }
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/decodeAsync.cjs
var require_decodeAsync = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/decodeAsync.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeAsync = decodeAsync;
    exports.decodeArrayStream = decodeArrayStream;
    exports.decodeMultiStream = decodeMultiStream;
    var Decoder_ts_1 = require_Decoder();
    var stream_ts_1 = require_stream();
    async function decodeAsync(streamLike, options) {
      const stream = (0, stream_ts_1.ensureAsyncIterable)(streamLike);
      const decoder = new Decoder_ts_1.Decoder(options);
      return decoder.decodeAsync(stream);
    }
    function decodeArrayStream(streamLike, options) {
      const stream = (0, stream_ts_1.ensureAsyncIterable)(streamLike);
      const decoder = new Decoder_ts_1.Decoder(options);
      return decoder.decodeArrayStream(stream);
    }
    function decodeMultiStream(streamLike, options) {
      const stream = (0, stream_ts_1.ensureAsyncIterable)(streamLike);
      const decoder = new Decoder_ts_1.Decoder(options);
      return decoder.decodeStream(stream);
    }
  }
});

// ../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/index.cjs
var require_dist4 = __commonJS({
  "../../node_modules/.pnpm/@msgpack+msgpack@3.1.3/node_modules/@msgpack/msgpack/dist.cjs/index.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeTimestampExtension = exports.encodeTimestampExtension = exports.decodeTimestampToTimeSpec = exports.encodeTimeSpecToTimestamp = exports.encodeDateToTimeSpec = exports.EXT_TIMESTAMP = exports.ExtData = exports.ExtensionCodec = exports.Encoder = exports.DecodeError = exports.Decoder = exports.decodeMultiStream = exports.decodeArrayStream = exports.decodeAsync = exports.decodeMulti = exports.decode = exports.encode = void 0;
    var encode_ts_1 = require_encode();
    Object.defineProperty(exports, "encode", { enumerable: true, get: function() {
      return encode_ts_1.encode;
    } });
    var decode_ts_1 = require_decode();
    Object.defineProperty(exports, "decode", { enumerable: true, get: function() {
      return decode_ts_1.decode;
    } });
    Object.defineProperty(exports, "decodeMulti", { enumerable: true, get: function() {
      return decode_ts_1.decodeMulti;
    } });
    var decodeAsync_ts_1 = require_decodeAsync();
    Object.defineProperty(exports, "decodeAsync", { enumerable: true, get: function() {
      return decodeAsync_ts_1.decodeAsync;
    } });
    Object.defineProperty(exports, "decodeArrayStream", { enumerable: true, get: function() {
      return decodeAsync_ts_1.decodeArrayStream;
    } });
    Object.defineProperty(exports, "decodeMultiStream", { enumerable: true, get: function() {
      return decodeAsync_ts_1.decodeMultiStream;
    } });
    var Decoder_ts_1 = require_Decoder();
    Object.defineProperty(exports, "Decoder", { enumerable: true, get: function() {
      return Decoder_ts_1.Decoder;
    } });
    var DecodeError_ts_1 = require_DecodeError();
    Object.defineProperty(exports, "DecodeError", { enumerable: true, get: function() {
      return DecodeError_ts_1.DecodeError;
    } });
    var Encoder_ts_1 = require_Encoder();
    Object.defineProperty(exports, "Encoder", { enumerable: true, get: function() {
      return Encoder_ts_1.Encoder;
    } });
    var ExtensionCodec_ts_1 = require_ExtensionCodec();
    Object.defineProperty(exports, "ExtensionCodec", { enumerable: true, get: function() {
      return ExtensionCodec_ts_1.ExtensionCodec;
    } });
    var ExtData_ts_1 = require_ExtData();
    Object.defineProperty(exports, "ExtData", { enumerable: true, get: function() {
      return ExtData_ts_1.ExtData;
    } });
    var timestamp_ts_1 = require_timestamp();
    Object.defineProperty(exports, "EXT_TIMESTAMP", { enumerable: true, get: function() {
      return timestamp_ts_1.EXT_TIMESTAMP;
    } });
    Object.defineProperty(exports, "encodeDateToTimeSpec", { enumerable: true, get: function() {
      return timestamp_ts_1.encodeDateToTimeSpec;
    } });
    Object.defineProperty(exports, "encodeTimeSpecToTimestamp", { enumerable: true, get: function() {
      return timestamp_ts_1.encodeTimeSpecToTimestamp;
    } });
    Object.defineProperty(exports, "decodeTimestampToTimeSpec", { enumerable: true, get: function() {
      return timestamp_ts_1.decodeTimestampToTimeSpec;
    } });
    Object.defineProperty(exports, "encodeTimestampExtension", { enumerable: true, get: function() {
      return timestamp_ts_1.encodeTimestampExtension;
    } });
    Object.defineProperty(exports, "decodeTimestampExtension", { enumerable: true, get: function() {
      return timestamp_ts_1.decodeTimestampExtension;
    } });
  }
});

// ../../node_modules/.pnpm/robot3@0.4.1/node_modules/robot3/dist/machine.js
var require_machine = __commonJS({
  "../../node_modules/.pnpm/robot3@0.4.1/node_modules/robot3/dist/machine.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function valueEnumerable(value) {
      return { enumerable: true, value };
    }
    function valueEnumerableWritable(value) {
      return { enumerable: true, writable: true, value };
    }
    var d = {};
    var truthy = () => true;
    var empty = () => ({});
    var identity = (a) => a;
    var callBoth = (par, fn, self, args) => par.apply(self, args) && fn.apply(self, args);
    var callForward = (par, fn, self, [a, b]) => fn.call(self, par.call(self, a, b), b);
    var create = (a, b) => Object.freeze(Object.create(a, b));
    function stack(fns, def, caller) {
      return fns.reduce((par, fn) => {
        return function(...args) {
          return caller(par, fn, this, args);
        };
      }, def);
    }
    function fnType(fn) {
      return create(this, { fn: valueEnumerable(fn) });
    }
    var reduceType = {};
    var reduce = fnType.bind(reduceType);
    var action = (fn) => reduce((ctx, ev) => !!~fn(ctx, ev) && ctx);
    var guardType = {};
    var guard = fnType.bind(guardType);
    function filter(Type, arr) {
      return arr.filter((value) => Type.isPrototypeOf(value));
    }
    function makeTransition(from, to, ...args) {
      let guards = stack(filter(guardType, args).map((t) => t.fn), truthy, callBoth);
      let reducers = stack(filter(reduceType, args).map((t) => t.fn), identity, callForward);
      return create(this, {
        from: valueEnumerable(from),
        to: valueEnumerable(to),
        guards: valueEnumerable(guards),
        reducers: valueEnumerable(reducers)
      });
    }
    var transitionType = {};
    var immediateType = {};
    var transition = makeTransition.bind(transitionType);
    var immediate = makeTransition.bind(immediateType, null);
    function enterImmediate(machine2, service2, event) {
      return transitionTo(service2, machine2, event, this.immediates) || machine2;
    }
    function transitionsToMap(transitions) {
      let m = /* @__PURE__ */ new Map();
      for (let t of transitions) {
        if (!m.has(t.from)) m.set(t.from, []);
        m.get(t.from).push(t);
      }
      return m;
    }
    var stateType = { enter: identity };
    function state(...args) {
      let transitions = filter(transitionType, args);
      let immediates = filter(immediateType, args);
      let desc = {
        final: valueEnumerable(args.length === 0),
        transitions: valueEnumerable(transitionsToMap(transitions))
      };
      if (immediates.length) {
        desc.immediates = valueEnumerable(immediates);
        desc.enter = valueEnumerable(enterImmediate);
      }
      return create(stateType, desc);
    }
    var invokeFnType = {
      enter(machine2, service2, event) {
        let rn = this.fn.call(service2, service2.context, event);
        if (machine.isPrototypeOf(rn))
          return create(invokeMachineType, {
            machine: valueEnumerable(rn),
            transitions: valueEnumerable(this.transitions)
          }).enter(machine2, service2, event);
        rn.then((data) => service2.send({ type: "done", data })).catch((error) => service2.send({ type: "error", error }));
        return machine2;
      }
    };
    var invokeMachineType = {
      enter(machine2, service2, event) {
        service2.child = interpret(this.machine, (s) => {
          service2.onChange(s);
          if (service2.child == s && s.machine.state.value.final) {
            delete service2.child;
            service2.send({ type: "done", data: s.context });
          }
        }, service2.context, event);
        if (service2.child.machine.state.value.final) {
          let data = service2.child.context;
          delete service2.child;
          return transitionTo(service2, machine2, { type: "done", data }, this.transitions.get("done"));
        }
        return machine2;
      }
    };
    function invoke(fn, ...transitions) {
      let t = valueEnumerable(transitionsToMap(transitions));
      return machine.isPrototypeOf(fn) ? create(invokeMachineType, {
        machine: valueEnumerable(fn),
        transitions: t
      }) : create(invokeFnType, {
        fn: valueEnumerable(fn),
        transitions: t
      });
    }
    var machine = {
      get state() {
        return {
          name: this.current,
          value: this.states[this.current]
        };
      }
    };
    function createMachine(current, states, contextFn = empty) {
      if (typeof current !== "string") {
        contextFn = states || empty;
        states = current;
        current = Object.keys(states)[0];
      }
      if (d._create) d._create(current, states);
      return create(machine, {
        context: valueEnumerable(contextFn),
        current: valueEnumerable(current),
        states: valueEnumerable(states)
      });
    }
    function transitionTo(service2, machine2, fromEvent, candidates) {
      let { context } = service2;
      for (let { to, guards, reducers } of candidates) {
        if (guards(context, fromEvent)) {
          service2.context = reducers.call(service2, context, fromEvent);
          let original = machine2.original || machine2;
          let newMachine = create(original, {
            current: valueEnumerable(to),
            original: { value: original }
          });
          if (d._onEnter) d._onEnter(machine2, to, service2.context, context, fromEvent);
          let state2 = newMachine.state.value;
          return state2.enter(newMachine, service2, fromEvent);
        }
      }
    }
    function send(service2, event) {
      let eventName = event.type || event;
      let { machine: machine2 } = service2;
      let { value: state2, name: currentStateName } = machine2.state;
      if (state2.transitions.has(eventName)) {
        return transitionTo(service2, machine2, event, state2.transitions.get(eventName)) || machine2;
      } else {
        if (d._send) d._send(eventName, currentStateName);
      }
      return machine2;
    }
    var service = {
      send(event) {
        this.machine = send(this, event);
        this.onChange(this);
      }
    };
    function interpret(machine2, onChange, initialContext, event) {
      let s = Object.create(service, {
        machine: valueEnumerableWritable(machine2),
        context: valueEnumerableWritable(machine2.context(initialContext, event)),
        onChange: valueEnumerable(onChange)
      });
      s.send = s.send.bind(s);
      s.machine = s.machine.state.value.enter(s.machine, s, event);
      return s;
    }
    exports.action = action;
    exports.createMachine = createMachine;
    exports.d = d;
    exports.guard = guard;
    exports.immediate = immediate;
    exports.interpret = interpret;
    exports.invoke = invoke;
    exports.reduce = reduce;
    exports.state = state;
    exports.transition = transition;
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/realtime.js
var require_realtime = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/realtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.realtimeImpl = void 0;
    var msgpack_1 = require_dist4();
    var robot3_1 = require_machine();
    var auth_1 = require_auth();
    var response_1 = require_response();
    var runtime_1 = require_runtime();
    var utils_1 = require_utils();
    var initialState = () => ({
      enqueuedMessage: void 0
    });
    function hasToken(context) {
      return context.token !== void 0;
    }
    function noToken(context) {
      return !hasToken(context);
    }
    function enqueueMessage(context, event) {
      return Object.assign(Object.assign({}, context), { enqueuedMessage: event.message });
    }
    function closeConnection(context) {
      if (context.websocket && context.websocket.readyState === WebSocket.OPEN) {
        context.websocket.close();
      }
      return Object.assign(Object.assign({}, context), { websocket: void 0 });
    }
    function sendMessage(context, event) {
      if (context.websocket && context.websocket.readyState === WebSocket.OPEN) {
        if (event.message instanceof Uint8Array) {
          context.websocket.send(event.message);
        } else {
          context.websocket.send((0, msgpack_1.encode)(event.message));
        }
        return Object.assign(Object.assign({}, context), { enqueuedMessage: void 0 });
      }
      return Object.assign(Object.assign({}, context), { enqueuedMessage: event.message });
    }
    function expireToken(context) {
      return Object.assign(Object.assign({}, context), { token: void 0 });
    }
    function setToken(context, event) {
      return Object.assign(Object.assign({}, context), { token: event.token });
    }
    function connectionEstablished(context, event) {
      return Object.assign(Object.assign({}, context), { websocket: event.websocket });
    }
    var connectionStateMachine = (0, robot3_1.createMachine)("idle", {
      idle: (0, robot3_1.state)((0, robot3_1.transition)("send", "connecting", (0, robot3_1.reduce)(enqueueMessage)), (0, robot3_1.transition)("expireToken", "idle", (0, robot3_1.reduce)(expireToken)), (0, robot3_1.transition)("close", "idle", (0, robot3_1.reduce)(closeConnection))),
      connecting: (0, robot3_1.state)((0, robot3_1.transition)("connecting", "connecting"), (0, robot3_1.transition)("connected", "active", (0, robot3_1.reduce)(connectionEstablished)), (0, robot3_1.transition)("connectionClosed", "idle", (0, robot3_1.reduce)(closeConnection)), (0, robot3_1.transition)("send", "connecting", (0, robot3_1.reduce)(enqueueMessage)), (0, robot3_1.transition)("close", "idle", (0, robot3_1.reduce)(closeConnection)), (0, robot3_1.immediate)("authRequired", (0, robot3_1.guard)(noToken))),
      authRequired: (0, robot3_1.state)((0, robot3_1.transition)("initiateAuth", "authInProgress"), (0, robot3_1.transition)("send", "authRequired", (0, robot3_1.reduce)(enqueueMessage)), (0, robot3_1.transition)("close", "idle", (0, robot3_1.reduce)(closeConnection))),
      authInProgress: (0, robot3_1.state)((0, robot3_1.transition)("authenticated", "connecting", (0, robot3_1.reduce)(setToken)), (0, robot3_1.transition)("unauthorized", "idle", (0, robot3_1.reduce)(expireToken), (0, robot3_1.reduce)(closeConnection)), (0, robot3_1.transition)("send", "authInProgress", (0, robot3_1.reduce)(enqueueMessage)), (0, robot3_1.transition)("close", "idle", (0, robot3_1.reduce)(closeConnection))),
      active: (0, robot3_1.state)((0, robot3_1.transition)("send", "active", (0, robot3_1.reduce)(sendMessage)), (0, robot3_1.transition)("unauthorized", "idle", (0, robot3_1.reduce)(expireToken)), (0, robot3_1.transition)("connectionClosed", "idle", (0, robot3_1.reduce)(closeConnection)), (0, robot3_1.transition)("close", "idle", (0, robot3_1.reduce)(closeConnection))),
      failed: (0, robot3_1.state)((0, robot3_1.transition)("send", "failed"), (0, robot3_1.transition)("close", "idle", (0, robot3_1.reduce)(closeConnection)))
    }, initialState);
    function buildRealtimeUrl(app2, { token, maxBuffering }) {
      if (maxBuffering !== void 0 && (maxBuffering < 1 || maxBuffering > 60)) {
        throw new Error("The `maxBuffering` must be between 1 and 60 (inclusive)");
      }
      const queryParams = new URLSearchParams({
        fal_jwt_token: token
      });
      if (maxBuffering !== void 0) {
        queryParams.set("max_buffering", maxBuffering.toFixed(0));
      }
      const appId = (0, utils_1.ensureAppIdFormat)(app2);
      return `wss://fal.run/${appId}/realtime?${queryParams.toString()}`;
    }
    var DEFAULT_THROTTLE_INTERVAL = 128;
    function isUnauthorizedError(message) {
      return message["status"] === "error" && message["error"] === "Unauthorized";
    }
    var WebSocketErrorCodes = {
      NORMAL_CLOSURE: 1e3,
      GOING_AWAY: 1001
    };
    var connectionCache = /* @__PURE__ */ new Map();
    var connectionCallbacks = /* @__PURE__ */ new Map();
    function reuseInterpreter(key, throttleInterval, onChange) {
      if (!connectionCache.has(key)) {
        const machine = (0, robot3_1.interpret)(connectionStateMachine, onChange);
        connectionCache.set(key, Object.assign(Object.assign({}, machine), { throttledSend: throttleInterval > 0 ? (0, utils_1.throttle)(machine.send, throttleInterval, true) : machine.send }));
      }
      return connectionCache.get(key);
    }
    var noop = () => {
    };
    var NoOpConnection = {
      send: noop,
      close: noop
    };
    function isSuccessfulResult(data) {
      return data.status !== "error" && data.type !== "x-fal-message" && !isFalErrorResult(data);
    }
    function isFalErrorResult(data) {
      return data.type === "x-fal-error";
    }
    exports.realtimeImpl = {
      connect(app2, handler2) {
        const {
          // if running on React in the server, set clientOnly to true by default
          clientOnly = (0, utils_1.isReact)() && !(0, runtime_1.isBrowser)(),
          connectionKey = crypto.randomUUID(),
          maxBuffering,
          throttleInterval = DEFAULT_THROTTLE_INTERVAL
        } = handler2;
        if (clientOnly && !(0, runtime_1.isBrowser)()) {
          return NoOpConnection;
        }
        let previousState;
        connectionCallbacks.set(connectionKey, {
          onError: handler2.onError,
          onResult: handler2.onResult
        });
        const getCallbacks = () => connectionCallbacks.get(connectionKey);
        const stateMachine = reuseInterpreter(connectionKey, throttleInterval, ({ context, machine, send: send2 }) => {
          const { enqueuedMessage, token } = context;
          if (machine.current === "active" && enqueuedMessage) {
            send2({ type: "send", message: enqueuedMessage });
          }
          if (machine.current === "authRequired" && token === void 0 && previousState !== machine.current) {
            send2({ type: "initiateAuth" });
            (0, auth_1.getTemporaryAuthToken)(app2).then((token2) => {
              send2({ type: "authenticated", token: token2 });
              const tokenExpirationTimeout = Math.round(auth_1.TOKEN_EXPIRATION_SECONDS * 0.9 * 1e3);
              setTimeout(() => {
                send2({ type: "expireToken" });
              }, tokenExpirationTimeout);
            }).catch((error) => {
              send2({ type: "unauthorized", error });
            });
          }
          if (machine.current === "connecting" && previousState !== machine.current && token !== void 0) {
            const ws2 = new WebSocket(buildRealtimeUrl(app2, { token, maxBuffering }));
            ws2.onopen = () => {
              send2({ type: "connected", websocket: ws2 });
            };
            ws2.onclose = (event) => {
              if (event.code !== WebSocketErrorCodes.NORMAL_CLOSURE) {
                const { onError = noop } = getCallbacks();
                onError(new response_1.ApiError({
                  message: `Error closing the connection: ${event.reason}`,
                  status: event.code
                }));
              }
              send2({ type: "connectionClosed", code: event.code });
            };
            ws2.onerror = (event) => {
              const { onError = noop } = getCallbacks();
              onError(new response_1.ApiError({ message: "Unknown error", status: 500 }));
            };
            ws2.onmessage = (event) => {
              const { onResult } = getCallbacks();
              if (event.data instanceof ArrayBuffer) {
                const result = (0, msgpack_1.decode)(new Uint8Array(event.data));
                onResult(result);
                return;
              }
              if (event.data instanceof Uint8Array) {
                const result = (0, msgpack_1.decode)(event.data);
                onResult(result);
                return;
              }
              if (event.data instanceof Blob) {
                event.data.arrayBuffer().then((buffer) => {
                  const result = (0, msgpack_1.decode)(new Uint8Array(buffer));
                  onResult(result);
                });
                return;
              }
              const data = JSON.parse(event.data);
              if (isUnauthorizedError(data)) {
                send2({ type: "unauthorized", error: new Error("Unauthorized") });
                return;
              }
              if (isSuccessfulResult(data)) {
                onResult(data);
                return;
              }
              if (isFalErrorResult(data)) {
                if (data.error === "TIMEOUT") {
                  return;
                }
                const { onError = noop } = getCallbacks();
                onError(new response_1.ApiError({
                  message: `${data.error}: ${data.reason}`,
                  // TODO better error status code
                  status: 400,
                  body: data
                }));
                return;
              }
            };
          }
          previousState = machine.current;
        });
        const send = (input) => {
          var _a;
          const message = input instanceof Uint8Array ? input : Object.assign(Object.assign({}, input), { request_id: (_a = input["request_id"]) !== null && _a !== void 0 ? _a : crypto.randomUUID() });
          stateMachine.throttledSend({
            type: "send",
            message
          });
        };
        const close = () => {
          stateMachine.send({ type: "close" });
        };
        return {
          send,
          close
        };
      }
    };
  }
});

// ../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/index.js
var require_src3 = __commonJS({
  "../../node_modules/.pnpm/@fal-ai+serverless-client@0.15.0/node_modules/@fal-ai/serverless-client/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseAppId = exports.stream = exports.storage = exports.ValidationError = exports.ApiError = exports.realtime = exports.withProxy = exports.withMiddleware = exports.subscribe = exports.run = exports.queue = exports.getConfig = exports.config = void 0;
    var config_1 = require_config();
    Object.defineProperty(exports, "config", { enumerable: true, get: function() {
      return config_1.config;
    } });
    Object.defineProperty(exports, "getConfig", { enumerable: true, get: function() {
      return config_1.getConfig;
    } });
    var function_1 = require_function();
    Object.defineProperty(exports, "queue", { enumerable: true, get: function() {
      return function_1.queue;
    } });
    Object.defineProperty(exports, "run", { enumerable: true, get: function() {
      return function_1.run;
    } });
    Object.defineProperty(exports, "subscribe", { enumerable: true, get: function() {
      return function_1.subscribe;
    } });
    var middleware_1 = require_middleware();
    Object.defineProperty(exports, "withMiddleware", { enumerable: true, get: function() {
      return middleware_1.withMiddleware;
    } });
    Object.defineProperty(exports, "withProxy", { enumerable: true, get: function() {
      return middleware_1.withProxy;
    } });
    var realtime_1 = require_realtime();
    Object.defineProperty(exports, "realtime", { enumerable: true, get: function() {
      return realtime_1.realtimeImpl;
    } });
    var response_1 = require_response();
    Object.defineProperty(exports, "ApiError", { enumerable: true, get: function() {
      return response_1.ApiError;
    } });
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
      return response_1.ValidationError;
    } });
    var storage_1 = require_storage();
    Object.defineProperty(exports, "storage", { enumerable: true, get: function() {
      return storage_1.storageImpl;
    } });
    var streaming_1 = require_streaming();
    Object.defineProperty(exports, "stream", { enumerable: true, get: function() {
      return streaming_1.stream;
    } });
    var utils_1 = require_utils();
    Object.defineProperty(exports, "parseAppId", { enumerable: true, get: function() {
      return utils_1.parseAppId;
    } });
  }
});

// src/lib/load-env.ts
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
var apiServerRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
var repoRoot = path.resolve(apiServerRoot, "../..");
if (!process.env.VERCEL) {
  config({ path: path.join(repoRoot, ".env") });
}

// src/app.ts
import fs from "node:fs";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit2 from "express-rate-limit";

// src/routes/index.ts
import { Router as Router34 } from "express";

// src/lib/security.ts
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// src/lib/auth-middleware.ts
import { randomBytes } from "crypto";

// src/lib/config.ts
function resolveDefaultCoupleCode() {
  const fromEnv = process.env.DEFAULT_COUPLE_CODE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    throw new Error("DEFAULT_COUPLE_CODE must be set in production");
  }
  return "change-me-before-hosting";
}
var appConfig = {
  defaultCoupleCode: resolveDefaultCoupleCode(),
  defaultProfiles: [
    {
      id: "me",
      username: process.env.DEFAULT_USER1_USERNAME || "mustaq",
      name: process.env.DEFAULT_USER1_NAME || "Mustaq",
      bio: process.env.DEFAULT_USER1_BIO || "Just us two \u2665",
      avatar: process.env.DEFAULT_USER1_AVATAR || ""
    },
    {
      id: "wife",
      username: process.env.DEFAULT_USER2_USERNAME || "sara",
      name: process.env.DEFAULT_USER2_NAME || "Sara",
      bio: process.env.DEFAULT_USER2_BIO || "My person \u2665",
      avatar: process.env.DEFAULT_USER2_AVATAR || ""
    }
  ],
  partnerMapping: {
    me: "wife",
    wife: "me"
  }
};

// src/lib/postgres-pool.ts
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
function normalizePostgresUrl(raw) {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}
function isNeonHost(connectionString) {
  try {
    return new URL(connectionString).hostname.includes("neon.tech");
  } catch {
    return connectionString.includes("neon.tech");
  }
}
async function createPostgresPool(connectionString) {
  const normalized = normalizePostgresUrl(connectionString);
  if (isNeonHost(normalized)) {
    neonConfig.webSocketConstructor = ws;
    return new NeonPool({
      connectionString: normalized,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 1e4,
      connectionTimeoutMillis: process.env.VERCEL ? 15e3 : 3e4
    });
  }
  const pg = await import("pg");
  const url = new URL(normalized);
  const sslmode = url.searchParams.get("sslmode");
  const needsSsl = sslmode === "require" || sslmode === "verify-full" || sslmode === "verify-ca";
  return new pg.default.Pool({
    connectionString: normalized,
    idleTimeoutMillis: 1e4,
    connectionTimeoutMillis: 3e4,
    max: 10,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1e4,
    ssl: needsSsl ? { rejectUnauthorized: false } : void 0
  });
}

// src/lib/db.ts
function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  const databaseUrl = normalizePostgresUrl(raw);
  const envIsPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
  if (!envIsPostgres) {
    throw new Error(
      "FATAL: Only PostgreSQL/Neon is supported. Use DATABASE_URL=postgresql://... from https://console.neon.tech"
    );
  }
  return databaseUrl;
}
function prepareSql(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
var pgPool = null;
var poolInit = null;
var dbRef = { handle: null };
function setActiveDb(handle) {
  dbRef.handle = handle;
}
function createPostgresDb(pool) {
  return {
    execute: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(prepareSql(sql), params);
        return { rows: result.rows, changes: result.rowCount ?? 0 };
      } finally {
        client.release();
      }
    },
    query: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(prepareSql(sql), params);
        return { rows: result.rows };
      } finally {
        client.release();
      }
    }
  };
}
async function ensurePool() {
  if (pgPool) return pgPool;
  if (!poolInit) {
    poolInit = (async () => {
      const databaseUrl = resolveDatabaseUrl();
      const pool = await createPostgresPool(databaseUrl);
      pgPool = pool;
      setActiveDb(createPostgresDb(pool));
      console.log(
        isNeonHost(databaseUrl) ? "[neon] Using PostgreSQL (Neon cloud, WebSocket)" : "[db] Using PostgreSQL"
      );
      return pool;
    })();
  }
  return poolInit;
}
var db = {
  execute: async (sql, params) => {
    await ensurePool();
    return dbRef.handle.execute(sql, params);
  },
  query: async (sql, params) => {
    await ensurePool();
    return dbRef.handle.query(sql, params);
  }
};
var db_default = db;
var dbReady = false;
function isDbReady() {
  return dbReady;
}
async function pingDatabase() {
  try {
    const pool = await ensurePool();
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
async function verifyPostgresConnection(retries = process.env.VERCEL ? 2 : 5) {
  const pool = await ensurePool();
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("[neon] PostgreSQL connected successfully");
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.error(`[neon] Connection attempt ${attempt}/${retries} failed:`, err);
        await sleep(2e3 * attempt);
      }
    }
  }
  throw new Error(`FATAL: Cannot connect to PostgreSQL after ${retries} attempts: ${lastErr}`);
}
async function initDb() {
  try {
    await verifyPostgresConnection();
    const tsCol = "BIGINT";
    await db.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT,
        avatar TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        ip TEXT NOT NULL,
        created_at ${tsCol} NOT NULL,
        last_seen ${tsCol} NOT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        created_at ${tsCol} NOT NULL,
        expires_at ${tsCol} NOT NULL,
        csrf_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        refresh_token_expires_at ${tsCol} NOT NULL,
        device_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);
    {
      for (const sql of [
        "ALTER TABLE devices ALTER COLUMN created_at TYPE BIGINT",
        "ALTER TABLE devices ALTER COLUMN last_seen TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN created_at TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN expires_at TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN refresh_token_expires_at TYPE BIGINT"
      ]) {
        try {
          await db.execute(sql);
        } catch {
        }
      }
    }
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`);
    try {
      await db.execute("ALTER TABLE devices ADD COLUMN typing_until BIGINT NOT NULL DEFAULT 0");
    } catch {
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS primary_access_tokens (
        token_hash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_primary_access_expires_at ON primary_access_tokens(expires_at)`);
    for (const col of ["client_id TEXT", "origin TEXT"]) {
      try {
        await db.execute(`ALTER TABLE primary_access_tokens ADD COLUMN ${col}`);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        audio_data TEXT,
        gif_url TEXT,
        image_data TEXT,
        timestamp TEXT NOT NULL,
        liked INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        variant TEXT,
        companion_sticker TEXT
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted)`);
    for (const sql of [
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_data TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS location TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_parent_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_reply_count INTEGER DEFAULT 0",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_text TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_sender_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS font_style TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_font_style TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_image_url TEXT"
    ]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        caption TEXT,
        location TEXT,
        aspect_ratio TEXT,
        created_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'story',
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `);
    for (const sql of ["ALTER TABLE stories ADD COLUMN IF NOT EXISTS text_overlay TEXT"]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS avatar_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_avatar_notes_user ON avatar_notes(user_id)`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_reactions (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at)`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS shared_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id)`);
    for (const sql of ["ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT"]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS hidden_messages (
        user_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        hidden_at TEXT NOT NULL,
        PRIMARY KEY (user_id, message_id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_clear_state (
        user_id TEXT PRIMARY KEY,
        cleared_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS duas (
        id TEXT PRIMARY KEY,
        arabic TEXT NOT NULL,
        translation TEXT,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`CREATE TABLE IF NOT EXISTS couple_code (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE
    )`);
    await db.execute(
      "INSERT INTO couple_code (code) VALUES ($1) ON CONFLICT (code) DO NOTHING",
      [appConfig.defaultCoupleCode]
    );
    await db.execute(`CREATE TABLE IF NOT EXISTS profile_codes (
      profile_id TEXT PRIMARY KEY,
      code TEXT NOT NULL
    )`);
    const sharedCodeRow = await db.execute("SELECT code FROM couple_code ORDER BY id LIMIT 1", []);
    const seedCode = String(sharedCodeRow.rows[0]?.code ?? "").trim() || appConfig.defaultCoupleCode;
    for (const profileId of ["me", "wife"]) {
      await db.execute(
        `INSERT INTO profile_codes (profile_id, code) VALUES ($1, $2) ON CONFLICT (profile_id) DO NOTHING`,
        [profileId, seedCode]
      );
    }
    for (const profile of appConfig.defaultProfiles) {
      await db.execute(
        `INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [profile.id, profile.username, profile.name, profile.bio, profile.avatar]
      );
    }
    for (const profile of appConfig.defaultProfiles) {
      await db.execute(
        `UPDATE profiles SET avatar = $1
         WHERE id = $2 AND (avatar IS NULL OR avatar = '' OR avatar LIKE '%picsum%' OR avatar LIKE '%dicebear%' OR avatar LIKE '%1516035069371%')`,
        [profile.avatar, profile.id]
      );
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS couple_prefs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        from_name TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        read INTEGER DEFAULT 0
      )
    `);
    for (const sql of [
      "ALTER TABLE activity_feed ADD COLUMN actor_id TEXT",
      "ALTER TABLE activity_feed ADD COLUMN target_path TEXT"
    ]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(
      `INSERT INTO couple_prefs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      ["chat_theme", "default"]
    );
    for (const [key, val] of [
      ["read_receipts", "on"],
      ["show_presence", "on"],
      ["notifications", "on"],
      ["note_me", ""],
      ["note_wife", ""]
    ]) {
      await db.execute(
        `INSERT INTO couple_prefs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, val]
      );
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        user_id TEXT PRIMARY KEY,
        subscription TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        user_id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS public_keys (
        user_id TEXT PRIMARY KEY,
        public_key TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        user_id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        enabled INTEGER DEFAULT 0,
        backup_codes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        read_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_media_opens (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_message_media_opens_message_user ON message_media_opens(message_id, user_id)`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS forwarded_messages (
        id TEXT PRIMARY KEY,
        original_message_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        forwarded_at TEXT NOT NULL,
        FOREIGN KEY (original_message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_edits (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        old_text TEXT,
        new_text TEXT,
        edited_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pinned_messages (
        user_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        pinned_at TEXT NOT NULL,
        PRIMARY KEY (user_id, message_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        description TEXT,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS library_books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        cover_url TEXT,
        description TEXT,
        epub_url TEXT,
        source TEXT DEFAULT 'Unknown',
        added_by TEXT NOT NULL,
        added_at TEXT NOT NULL,
        status TEXT DEFAULT 'reading',
        current_page INTEGER DEFAULT 0,
        total_pages INTEGER DEFAULT 100
      )
    `);
    for (const sql of [
      "ALTER TABLE library_books ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Unknown'",
      "ALTER TABLE library_books ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE"
    ]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS library_reading_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 0,
        pages_read INTEGER DEFAULT 0
      )
    `);
    for (const sql of ["ALTER TABLE library_reading_sessions ADD COLUMN IF NOT EXISTS pages_read INTEGER DEFAULT 0"]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS library_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        banner_url TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS library_collection_books (
        collection_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        added_at TEXT NOT NULL,
        PRIMARY KEY (collection_id, book_id),
        FOREIGN KEY (collection_id) REFERENCES library_collections(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS library_notes (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        chapter_or_page TEXT,
        text TEXT NOT NULL,
        author_id TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS relationship_milestones (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS secret_notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        title TEXT,
        color TEXT,
        icon TEXT
      )
    `);
    for (const sql of [
      "ALTER TABLE secret_notes ADD COLUMN IF NOT EXISTS title TEXT",
      "ALTER TABLE secret_notes ADD COLUMN IF NOT EXISTS color TEXT",
      "ALTER TABLE secret_notes ADD COLUMN IF NOT EXISTS icon TEXT"
    ]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        audio_data TEXT,
        gif_url TEXT,
        image_data TEXT,
        variant TEXT,
        companion_sticker TEXT,
        scheduled_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent INTEGER DEFAULT 0
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS call_signals (
        id SERIAL PRIMARY KEY,
        receiver_id TEXT NOT NULL,
        event TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `);
    for (const sql of ["ALTER TABLE call_signals ADD COLUMN IF NOT EXISTS expires_at BIGINT NOT NULL DEFAULT 0"]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_call_signals_receiver ON call_signals(receiver_id)`);
    dbReady = true;
  } catch (err) {
    console.error("Database initialization error:", err);
    throw new Error(`Failed to initialize database: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// src/lib/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ],
  ...isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// src/lib/auth-middleware.ts
var SESSION_DURATION = 30 * 24 * 60 * 60 * 1e3;
var REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1e3;
function generateDeviceId() {
  const randomBytesBuffer = randomBytes(16);
  return randomBytesBuffer.toString("hex");
}
function generateCSRFToken() {
  const randomBytesBuffer = randomBytes(32);
  return randomBytesBuffer.toString("hex");
}
function generateSessionToken() {
  const timestamp = Date.now().toString(36);
  const randomBytesBuffer = randomBytes(32);
  const randomString = randomBytesBuffer.toString("base64");
  return `${timestamp}.${randomString}`;
}
async function createSession(userId, username, userAgent, ip) {
  const token = generateSessionToken();
  const csrfToken = generateCSRFToken();
  const refreshToken = generateSessionToken();
  const deviceId = generateDeviceId();
  const now = Date.now();
  try {
    await db_default.execute(
      `INSERT INTO devices (id, user_id, user_agent, ip, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)`,
      [deviceId, userId, userAgent || "Unknown", ip || "Unknown", now, now]
    );
    await db_default.execute(
      `INSERT INTO sessions (token, user_id, username, created_at, expires_at, csrf_token, refresh_token, refresh_token_expires_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, userId, username, now, now + SESSION_DURATION, csrfToken, refreshToken, now + REFRESH_TOKEN_DURATION, deviceId]
    );
    return { token, csrfToken, refreshToken, deviceId };
  } catch (err) {
    logger.error({ err, userId }, "Failed to create session");
    throw err;
  }
}
async function validateSession(token) {
  try {
    const result = await db_default.execute(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > ?",
      [token, Date.now()]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      userId: row.user_id,
      username: row.username,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      csrfToken: row.csrf_token,
      refreshToken: row.refresh_token,
      refreshTokenExpiresAt: row.refresh_token_expires_at,
      deviceId: row.device_id,
      deviceInfo: {
        userAgent: "Unknown",
        ip: "Unknown",
        lastSeen: Date.now()
      }
    };
  } catch (err) {
    logger.error({ err }, "Failed to validate session");
    return null;
  }
}
async function validateRefreshToken(refreshToken) {
  try {
    const result = await db_default.execute(
      "SELECT * FROM sessions WHERE refresh_token = ? AND refresh_token_expires_at > ?",
      [refreshToken, Date.now()]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      userId: row.user_id,
      username: row.username,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      csrfToken: row.csrf_token,
      refreshToken: row.refresh_token,
      refreshTokenExpiresAt: row.refresh_token_expires_at,
      deviceId: row.device_id,
      deviceInfo: {
        userAgent: "Unknown",
        ip: "Unknown",
        lastSeen: Date.now()
      }
    };
  } catch (err) {
    console.error("Failed to validate refresh token:", err);
    return null;
  }
}
async function refreshSession(refreshToken) {
  const session = await validateRefreshToken(refreshToken);
  if (!session) return null;
  const newToken = generateSessionToken();
  const newCsrfToken = generateCSRFToken();
  const newRefreshToken = generateSessionToken();
  const now = Date.now();
  try {
    await db_default.execute("DELETE FROM sessions WHERE refresh_token = ?", [refreshToken]);
    await db_default.execute(
      `INSERT INTO sessions (token, user_id, username, created_at, expires_at, csrf_token, refresh_token, refresh_token_expires_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newToken, session.userId, session.username, now, now + SESSION_DURATION, newCsrfToken, newRefreshToken, now + REFRESH_TOKEN_DURATION, session.deviceId]
    );
    return { token: newToken, csrfToken: newCsrfToken, refreshToken: newRefreshToken };
  } catch (err) {
    logger.error({ err }, "Failed to refresh session");
    return null;
  }
}
async function getUserDevices(userId) {
  try {
    const result = await db_default.execute(
      "SELECT * FROM devices WHERE user_id = ?",
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userAgent: row.user_agent,
      ip: row.ip,
      createdAt: row.created_at,
      lastSeen: row.last_seen
    }));
  } catch (err) {
    console.error("Failed to get user devices:", err);
    return [];
  }
}
async function revokeDevice(userId, deviceId) {
  try {
    const deviceResult = await db_default.execute(
      "SELECT * FROM devices WHERE id = ? AND user_id = ?",
      [deviceId, userId]
    );
    if (deviceResult.rows.length === 0) return false;
    await db_default.execute("DELETE FROM devices WHERE id = ?", [deviceId]);
    await db_default.execute("DELETE FROM sessions WHERE device_id = ?", [deviceId]);
    return true;
  } catch (err) {
    console.error("Failed to revoke device:", err);
    return false;
  }
}
async function updateDeviceLastSeen(deviceId) {
  try {
    await db_default.execute(
      "UPDATE devices SET last_seen = ? WHERE id = ?",
      [Date.now(), deviceId]
    );
  } catch (err) {
    logger.error({ err, deviceId }, "Failed to update device last seen");
  }
}
async function validateCSRFToken(token, csrfToken) {
  try {
    const result = await db_default.execute(
      "SELECT csrf_token, expires_at FROM sessions WHERE token = ? AND expires_at > ?",
      [token, Date.now()]
    );
    if (result.rows.length === 0) return false;
    return result.rows[0].csrf_token === csrfToken;
  } catch (err) {
    console.error("Failed to validate CSRF token:", err);
    return false;
  }
}
async function destroySession(token) {
  try {
    await db_default.execute("DELETE FROM sessions WHERE token = ?", [token]);
  } catch (err) {
    logger.error({ err }, "Failed to destroy session");
  }
}
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : void 0;
  if ((!authHeader || !authHeader.startsWith("Bearer ")) && !cookieToken) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;
  const session = await validateSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    return;
  }
  await updateDeviceLastSeen(session.deviceId);
  req.user = {
    id: session.userId,
    username: session.username,
    deviceId: session.deviceId
  };
  next();
}
async function authenticateBearerOrQuery(req, res, next) {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === "string" ? req.query.token : void 0;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : queryToken;
  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  const session = await validateSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    return;
  }
  await updateDeviceLastSeen(session.deviceId);
  req.user = {
    id: session.userId,
    username: session.username,
    deviceId: session.deviceId
  };
  next();
}
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : void 0;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;
  if (token) {
    const session = await validateSession(token);
    if (session) {
      req.user = {
        id: session.userId,
        username: session.username,
        deviceId: session.deviceId
      };
    }
  }
  next();
}
var cleanupInterval = null;
function startSessionCleanup() {
  if (cleanupInterval) {
    logger.warn("Session cleanup already running");
    return;
  }
  cleanupInterval = setInterval(async () => {
    try {
      await db_default.execute("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]);
    } catch (err) {
      logger.error({ err }, "Failed to clean up expired sessions");
    }
  }, 60 * 60 * 1e3);
  logger.info("Session cleanup started");
}
startSessionCleanup();

// src/lib/security.ts
var cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "https://images.unsplash.com",
    "https://res.cloudinary.com",
    "https://media.giphy.com",
    "https://i.giphy.com"
  ],
  connectSrc: [
    "'self'",
    "https://api.giphy.com",
    "https://images.unsplash.com",
    "https://res.cloudinary.com",
    "https://media.giphy.com",
    "https://i.giphy.com"
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "https://media.giphy.com", "https://res.cloudinary.com", "https:"],
  frameSrc: ["'none'"]
};
function setupSecurity(app2) {
  const isProd = process.env.NODE_ENV === "production";
  app2.use(
    helmet({
      contentSecurityPolicy: isProd ? { directives: cspDirectives } : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd ? {
        maxAge: 31536e3,
        includeSubDomains: true,
        preload: true
      } : false
    })
  );
}
var rateLimiters = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: process.env.NODE_ENV === "production" ? 12 : 5,
    message: { error: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false
  }),
  // Moderate rate limit for message operations (disabled for development)
  messages: rateLimit({
    windowMs: 1 * 60 * 1e3,
    // 1 minute
    max: process.env.NODE_ENV === "production" ? 240 : 2e3,
    message: { error: "Too many message requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false
  }),
  // Lenient rate limit for read operations
  read: rateLimit({
    windowMs: 1 * 60 * 1e3,
    // 1 minute
    max: 100,
    // 100 requests per minute
    message: { error: "Too many requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false
  }),
  // Strict rate limit for file uploads
  upload: rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: process.env.NODE_ENV === "production" ? 60 : 120,
    message: { error: "Too many upload attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
  })
};
function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }
  const path3 = req.path || "";
  const url = (req.originalUrl || "").split("?")[0];
  const publicAuthPaths = ["/auth/primary-login", "/auth/login", "/auth/refresh"];
  const isPublicAuth = publicAuthPaths.some(
    (p) => path3 === p || path3.endsWith(p) || url === p || url.endsWith(p) || url.endsWith(`/api${p}`)
  );
  if (isPublicAuth) {
    next();
    return;
  }
  const token = (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : req.cookies?.grova_token) || "";
  const csrfToken = String(req.headers["x-csrf-token"] || "");
  if (!token) {
    next();
    return;
  }
  if (!csrfToken) {
    res.status(403).json({ error: "CSRF token missing" });
    return;
  }
  void validateCSRFToken(token, csrfToken).then((isValid2) => {
    if (!isValid2) {
      res.status(403).json({ error: "CSRF token invalid" });
      return;
    }
    next();
  });
}
function sanitizeInput(req, res, next) {
  if (req.body) {
    const sanitize = (obj) => {
      if (typeof obj === "string") {
        if (obj.startsWith("data:") || obj.startsWith("e2e:") || /^https?:\/\//i.test(obj)) {
          return obj;
        }
        let sanitized = obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+\s*=\s*["'].*?["']/gi, "").replace(/javascript:/gi, "").replace(/vbscript:/gi, "").replace(/file:/gi, "");
        if (sanitized.length > 1e4) {
          sanitized = sanitized.substring(0, 1e4);
        }
        return sanitized;
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === "object") {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          const sanitizedKey = key.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          sanitized[sanitizedKey] = sanitize(value);
        }
        return sanitized;
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
}
function validateEnv() {
  const required = ["ENCRYPTION_KEY", "ENCRYPTION_PASSWORD"];
  const missing = [];
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const encryptionKey = (process.env.ENCRYPTION_KEY || "").trim();
  if (encryptionKey.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 characters (32 bytes in hex); got ${encryptionKey.length} after trim`
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (0-9, a-f only)");
  }
  const encryptionPassword = (process.env.ENCRYPTION_PASSWORD || "").trim();
  if (encryptionPassword.length < 8) {
    throw new Error("ENCRYPTION_PASSWORD must be at least 8 characters long");
  }
  const primaryEmails = (process.env.PRIMARY_AUTH_EMAILS || "").trim();
  const primaryPasswords = (process.env.PRIMARY_AUTH_PASSWORDS || "").trim();
  const primaryPasswordDirect = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4
  ].some((p) => String(p || "").trim());
  const primaryPasswordHashes = (process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim();
  if (!primaryEmails || !primaryPasswords && !primaryPasswordDirect && !primaryPasswordHashes) {
    throw new Error("PRIMARY_AUTH_EMAILS and at least one PRIMARY_AUTH_PASSWORD (or hash) are required");
  }
  if (process.env.NODE_ENV === "production" && !process.env.DEFAULT_COUPLE_CODE?.trim()) {
    throw new Error("DEFAULT_COUPLE_CODE is required in production");
  }
  if (!/^postgres(ql)?:\/\//.test(String(process.env.DATABASE_URL || ""))) {
    throw new Error("DATABASE_URL must be a Neon postgresql:// connection string");
  }
  if (process.env.NODE_ENV === "production") {
    const allowedOrigins2 = (process.env.ALLOWED_ORIGINS || "").trim();
    const vercelHost = (process.env.VERCEL_URL || "").trim();
    if (!allowedOrigins2 && !vercelHost) {
      throw new Error(
        "ALLOWED_ORIGINS is required in production (or deploy on Vercel where VERCEL_URL is set automatically)"
      );
    }
  }
}
var suspiciousAgentPattern = /(bot|spider|crawler|scrapy|curl|wget|python-requests|httpclient|go-http-client|postmanruntime)/i;
function blockSuspiciousBots(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }
  const userAgent = String(req.headers["user-agent"] || "");
  if (!userAgent || suspiciousAgentPattern.test(userAgent)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  next();
}

// src/lib/validation.ts
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field];
      const result = validator(value);
      if (result !== true) {
        errors.push(result || `${field} is invalid`);
      }
    }
    if (errors.length > 0) {
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }
    next();
  };
}
var validators = {
  // String validators
  nonEmptyString: (value) => {
    if (typeof value !== "string") return "must be a string";
    if (value.trim().length === 0) return "cannot be empty";
    return true;
  },
  stringOfLength: (min, max) => (value) => {
    if (typeof value !== "string") return "must be a string";
    if (value.length < min) return `must be at least ${min} characters`;
    if (value.length > max) return `must be at most ${max} characters`;
    return true;
  },
  // Number validators
  positiveNumber: (value) => {
    if (typeof value !== "number") return "must be a number";
    if (value <= 0) return "must be positive";
    return true;
  },
  // Enum validators
  enum: (allowedValues) => (value) => {
    if (!allowedValues.includes(value)) return `must be one of: ${allowedValues.join(", ")}`;
    return true;
  },
  // Email validator
  email: (value) => {
    if (typeof value !== "string") return "must be a string";
    const emailRegex2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex2.test(value)) return "must be a valid email";
    return true;
  },
  // URL validator
  url: (value) => {
    if (typeof value !== "string") return "must be a string";
    try {
      new URL(value);
      return true;
    } catch {
      return "must be a valid URL";
    }
  },
  // UUID validator
  uuid: (value) => {
    if (typeof value !== "string") return "must be a string";
    const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex2.test(value)) return "must be a valid UUID";
    return true;
  },
  // Safe UUID validator for route parameters (allows both UUID and simple IDs like "me", "wife")
  safeId: (value) => {
    if (typeof value !== "string") return "must be a string";
    const simpleIdRegex = /^[a-zA-Z0-9_-]+$/;
    const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!simpleIdRegex.test(value) && !uuidRegex2.test(value)) return "must be a valid ID";
    return true;
  }
};
function validateRouteParams(params) {
  return (req, res, next) => {
    const paramsToValidate = Object.keys(params).length > 0 ? params : req.params;
    for (const [paramName, validator] of Object.entries(paramsToValidate)) {
      const paramValue = req.params[paramName];
      if (!paramValue) {
        res.status(400).json({ error: `Missing required parameter: ${paramName}` });
        return;
      }
      const value = Array.isArray(paramValue) ? paramValue[0] : paramValue;
      const validatorType = typeof validator === "string" ? validator : "safeId";
      if (validatorType === "safeId") {
        const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
        const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!safeIdRegex.test(value) && !uuidRegex2.test(value)) {
          res.status(400).json({ error: `Invalid parameter format: ${paramName}` });
          return;
        }
      } else if (validatorType === "uuid") {
        const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex2.test(value)) {
          res.status(400).json({ error: `Invalid UUID format: ${paramName}` });
          return;
        }
      }
    }
    next();
  };
}

// src/routes/health.ts
import { Router } from "express";
var router = Router();
router.get("/healthz", async (_req, res) => {
  const dbConnected = await pingDatabase();
  const authEmailsConfigured = (process.env.PRIMARY_AUTH_EMAILS || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean).length;
  const hasPassword = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4
  ].some((p) => String(p || "").trim()) || Boolean((process.env.PRIMARY_AUTH_PASSWORDS || "").trim()) || Boolean((process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim());
  const encryptionKey = (process.env.ENCRYPTION_KEY || "").trim();
  const encryptionConfigured = encryptionKey.length === 64 && /^[0-9a-fA-F]{64}$/.test(encryptionKey) && (process.env.ENCRYPTION_PASSWORD || "").trim().length >= 8;
  const cloudinaryUrl = (process.env.CLOUDINARY_URL || "").trim();
  const cloudinaryConfigured = cloudinaryUrl.startsWith("cloudinary://") || Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
  const ok = dbConnected && isDbReady() && authEmailsConfigured > 0 && hasPassword && encryptionConfigured;
  res.status(200).json({
    status: ok ? "ok" : "degraded",
    db: dbConnected && isDbReady(),
    dbConfigured: dbConnected && isDbReady(),
    authConfigured: authEmailsConfigured > 0 && hasPassword,
    encryptionConfigured,
    cloudinaryConfigured
  });
});
var health_default = router;

// src/routes/auth.ts
import { Router as Router2 } from "express";
import { createHash, randomBytes as randomBytes2, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

// src/lib/avatar-url.ts
import { randomUUID } from "crypto";

// src/lib/storage.ts
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";

// src/lib/cloudinary-config.ts
function parseCloudinaryCredentials() {
  const url = (process.env.CLOUDINARY_URL || "").trim();
  if (url.startsWith("cloudinary://")) {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return {
        apiKey: match[1].trim(),
        apiSecret: match[2].trim(),
        cloudName: match[3].trim()
      };
    }
    return null;
  }
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  return null;
}
function requireCloudinaryCredentials() {
  const creds = parseCloudinaryCredentials();
  if (!creds) {
    throw new Error(
      "Cloudinary not configured. Set CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME in Vercel."
    );
  }
  return creds;
}

// src/lib/storage.ts
var cloudinaryReady = false;
function ensureCloudinary() {
  if (cloudinaryReady) return;
  const creds = parseCloudinaryCredentials();
  if (!creds) {
    throw new Error(
      "Cloudinary not configured. Set CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME in Vercel Environment Variables."
    );
  }
  cloudinary.config({
    cloud_name: creds.cloudName,
    api_key: creds.apiKey,
    api_secret: creds.apiSecret,
    secure: true
  });
  cloudinaryReady = true;
}
function cloudinaryResourceType(contentType) {
  if (contentType.startsWith("video/") || contentType.startsWith("audio/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "raw";
}
async function uploadToCloudinary(key, buffer, contentType) {
  ensureCloudinary();
  const resourceType = cloudinaryResourceType(contentType);
  const publicId = resourceType === "raw" || resourceType === "video" ? `grova/${key}` : `grova/${key.replace(/\.[^.]+$/, "")}`;
  const opts = {
    public_id: publicId,
    resource_type: resourceType,
    overwrite: true
  };
  if (resourceType === "video" || resourceType === "raw" || buffer.length > 512 * 1024) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(opts, (err, result2) => {
        if (err) reject(err);
        else if (!result2?.secure_url) reject(new Error("Cloudinary upload returned no URL"));
        else resolve(result2.secure_url);
      });
      Readable.from(buffer).pipe(upload);
    });
  }
  const result = await cloudinary.uploader.upload(
    `data:${contentType};base64,${buffer.toString("base64")}`,
    opts
  );
  return result.secure_url;
}
async function uploadMedia(key, buffer, contentType) {
  try {
    return await uploadToCloudinary(key, buffer, contentType);
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to upload media to Cloudinary");
  }
}
async function deleteImage(key) {
  ensureCloudinary();
  const publicIdNoExt = `grova/${key.replace(/\.[^.]+$/, "")}`;
  const publicIdWithExt = `grova/${key}`;
  await Promise.all([
    cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "image" }).catch(() => {
    }),
    cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "raw" }).catch(() => {
    }),
    cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "video" }).catch(() => {
    }),
    // Also try with extension for video/raw which may have been uploaded with it
    cloudinary.uploader.destroy(publicIdWithExt, { resource_type: "video" }).catch(() => {
    }),
    cloudinary.uploader.destroy(publicIdWithExt, { resource_type: "raw" }).catch(() => {
    })
  ]);
}
async function deleteCloudinaryAsset(publicId, resourceType) {
  ensureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
  });
  if (resourceType !== "image") {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {
    });
  }
}

// src/lib/avatar-url.ts
var FALLBACK = {
  me: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop",
  wife: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop"
};
async function persistAvatarIfNeeded(userId, avatar) {
  const s = typeof avatar === "string" ? avatar.trim() : "";
  if (!s) return FALLBACK[userId] ?? FALLBACK.me;
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  if (s.startsWith("data:")) {
    try {
      const base64 = s.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const key = `avatars/${userId}-${randomUUID()}.jpg`;
      const url = await uploadMedia(key, buffer, "image/jpeg");
      await db_default.execute("UPDATE profiles SET avatar = $1 WHERE id = $2", [url, userId]);
      return url;
    } catch (err) {
      console.error("[avatar] Failed to upload avatar:", err);
      return FALLBACK[userId] ?? FALLBACK.me;
    }
  }
  return s;
}
function sanitizeAvatarForClient(userId, avatar) {
  const fallback = FALLBACK[userId] ?? FALLBACK.me;
  const s = typeof avatar === "string" ? avatar.trim() : "";
  if (!s) return fallback;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return fallback;
}

// src/routes/auth.ts
var router2 = Router2();
router2.use((req, res, next) => {
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  if (!ua || ua.length < 8) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (/bot|crawler|spider|scrapy|headless|python-requests|curl\/|wget\/|semrush|ahrefs/i.test(ua)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});
var PRIMARY_SESSION_MS = 30 * 24 * 60 * 60 * 1e3;
var SESSION_MS = 30 * 24 * 60 * 60 * 1e3;
var PRIMARY_SESSION_RENEW_MS = 30 * 24 * 60 * 60 * 1e3;
var PRIMARY_MAX_FAILED_ATTEMPTS = 2;
var PRIMARY_BLOCK_MS = 30 * 60 * 1e3;
var primaryLoginAttempts = /* @__PURE__ */ new Map();
var CODE_MAX_FAILED_ATTEMPTS = 10;
var CODE_BLOCK_MS = 30 * 60 * 1e3;
var coupleCodeAttempts = /* @__PURE__ */ new Map();
function cookieConfig(maxAge) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "lax" : "strict",
    maxAge,
    path: "/"
  };
}
function setAuthCookies(res, data) {
  if (data.token) res.cookie("grova_token", data.token, cookieConfig(SESSION_MS));
  if (data.csrfToken) res.cookie("grova_csrf", data.csrfToken, cookieConfig(SESSION_MS));
  if (data.refreshToken) res.cookie("grova_refresh", data.refreshToken, cookieConfig(SESSION_MS));
  if (data.primaryToken) res.cookie("grova_primary", data.primaryToken, cookieConfig(PRIMARY_SESSION_MS));
}
function clearAuthCookies(res) {
  const opts = { path: "/" };
  res.clearCookie("grova_token", opts);
  res.clearCookie("grova_csrf", opts);
  res.clearCookie("grova_refresh", opts);
  res.clearCookie("grova_primary", opts);
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function listFromEnv(key) {
  return (process.env[key] || "").split(/[,;]/).map((s) => s.trim().replace(/^['"]|['"]$/g, "").toLowerCase()).filter(Boolean);
}
function getPrimaryPasswords() {
  const direct = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4
  ].map((s) => String(s || "").trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  if (direct.length > 0) return direct;
  return (process.env.PRIMARY_AUTH_PASSWORDS || "").split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}
function getPrimaryPasswordHashes() {
  return (process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}
function safeEq(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}
function isAllowedPrimaryCredential(email, password) {
  const allowedEmails = listFromEnv("PRIMARY_AUTH_EMAILS");
  const allowedPasswords = getPrimaryPasswords();
  const allowedPasswordHashes = getPrimaryPasswordHashes();
  const normalizedInput = email.trim().toLowerCase();
  const strictEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!strictEmailPattern.test(normalizedInput)) return false;
  if (!allowedEmails.includes(normalizedInput)) return false;
  if (allowedPasswordHashes.length > 0) {
    return allowedPasswordHashes.some((hash) => bcrypt.compareSync(password, hash));
  }
  return allowedPasswords.some((p) => safeEq(p, password));
}
function primaryAttemptKey(req, email) {
  const ip = (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0] : "") || (typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : "") || req.socket.remoteAddress || "unknown";
  return `${ip.trim().toLowerCase()}::${email.trim().toLowerCase()}`;
}
function requestUserAgent(req) {
  return String(req.headers["user-agent"] || "Unknown");
}
function requestClientId(req) {
  return String(req.headers["x-client-id"] || "").trim();
}
function requestClientOrigin(req) {
  const fromHeader = String(req.headers["x-client-origin"] || "").trim();
  if (fromHeader) return fromHeader;
  const origin = req.headers.origin;
  return typeof origin === "string" ? origin.trim() : "";
}
async function validateAndRenewPrimaryToken(req, primaryToken) {
  const tokenHash = sha256(primaryToken);
  const now = Date.now();
  const clientId = requestClientId(req);
  const origin = requestClientOrigin(req);
  const userAgent = requestUserAgent(req);
  const result = await db_default.execute(
    "SELECT token_hash, client_id, origin, user_agent FROM primary_access_tokens WHERE token_hash = $1 AND expires_at > $2",
    [tokenHash, now]
  );
  if (result.rows.length === 0) return false;
  const row = result.rows[0];
  const storedClientId = String(row.client_id ?? "").trim();
  const storedOrigin = String(row.origin ?? "").trim();
  const storedUa = String(row.user_agent ?? "");
  if (storedClientId) {
    if (!clientId || clientId !== storedClientId) return false;
  } else if (storedUa !== userAgent) {
    return false;
  }
  if (storedOrigin && origin && storedOrigin !== origin) return false;
  await db_default.execute("UPDATE primary_access_tokens SET expires_at = $1 WHERE token_hash = $2", [
    now + PRIMARY_SESSION_RENEW_MS,
    tokenHash
  ]);
  return true;
}
async function clearExpiredPrimaryTokens() {
  await db_default.execute("DELETE FROM primary_access_tokens WHERE expires_at <= $1", [Date.now()]);
}
function bootstrapCodeFromEnv() {
  return String(process.env.DEFAULT_COUPLE_CODE || "").trim();
}
async function getEffectiveCoupleCode() {
  const codeResult = await db_default.execute("SELECT code FROM couple_code ORDER BY id LIMIT 1", []);
  const fromDb = String(codeResult.rows[0]?.code ?? "").trim();
  if (fromDb) return fromDb;
  const fromEnv = bootstrapCodeFromEnv();
  return fromEnv || null;
}
async function getProfileCode(profileId) {
  const codeResult = await db_default.execute("SELECT code FROM profile_codes WHERE profile_id = $1", [profileId]);
  const fromDb = String(codeResult.rows[0]?.code ?? "").trim();
  if (fromDb) return fromDb;
  return getEffectiveCoupleCode();
}
async function setProfileCode(profileId, newCode) {
  const trimmed = newCode.trim();
  await db_default.execute(
    `INSERT INTO profile_codes (profile_id, code) VALUES ($1, $2)
     ON CONFLICT (profile_id) DO UPDATE SET code = $2`,
    [profileId, trimmed]
  );
}
function codeAttemptKey(req, userId) {
  const ip = (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0] : "") || (typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : "") || req.socket.remoteAddress || "unknown";
  return `${ip.trim().toLowerCase()}::${userId.trim().toLowerCase()}`;
}
router2.get("/auth/profiles", rateLimiters.read, async (_req, res) => {
  try {
    const primaryFromCookie = _req && typeof _req.cookies?.grova_primary === "string" ? _req.cookies.grova_primary : "";
    const primaryToken = String(_req.headers["x-primary-token"] || primaryFromCookie || "");
    if (!await validateAndRenewPrimaryToken(_req, primaryToken)) {
      res.status(401).json({ error: "Primary authentication required" });
      return;
    }
    const defaults = [
      { id: "me", username: "mustaq", name: "Mustaq", bio: "Just us two \u2665", avatar: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop" },
      { id: "wife", username: "sara", name: "Sara", bio: "My person \u2665", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop" }
    ];
    for (const profile of defaults) {
      try {
        const existsResult = await db_default.execute(
          "SELECT id FROM profiles WHERE id = $1",
          [profile.id]
        );
        if (existsResult.rows.length === 0) {
          await db_default.execute(
            "INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)",
            [profile.id, profile.username, profile.name, profile.bio, profile.avatar]
          );
        }
      } catch {
      }
    }
    const result = await db_default.execute(
      "SELECT id, name, avatar FROM profiles WHERE id IN ('me', 'wife')",
      []
    );
    const rows = result.rows;
    const merged = await Promise.all(
      defaults.map(async (d) => {
        const row = rows.find((r) => r.id === d.id);
        return row ? { id: row.id, name: row.name, avatar: sanitizeAvatarForClient(row.id, row.avatar) } : d;
      })
    );
    res.json(merged);
  } catch {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});
async function profileToUser(row, userId) {
  return {
    id: userId,
    username: String(row.username ?? (userId === "me" ? "mustaq" : "sara")),
    name: String(row.name ?? ""),
    bio: String(row.bio ?? ""),
    avatar: sanitizeAvatarForClient(userId, row.avatar)
  };
}
router2.get("/auth/session", rateLimiters.read, async (req, res) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : null;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const session = await validateSession(token);
    if (!session) {
      res.status(401).json({ error: "Session expired" });
      return;
    }
    const profileResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [session.userId]);
    const meRow = profileResult.rows[0];
    if (!meRow) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const partnerId = session.userId === "me" ? "wife" : "me";
    const partnerResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [partnerId]);
    const partnerRow = partnerResult.rows[0];
    res.json({
      user: await profileToUser(meRow, session.userId),
      partner: partnerRow ? await profileToUser(partnerRow, partnerId) : null
    });
  } catch {
    res.status(500).json({ error: "Failed to restore session" });
  }
});
router2.post("/auth/login", validateBody({
  userId: validators.nonEmptyString,
  code: validators.stringOfLength(4, 50)
}), async (req, res) => {
  const { userId, code } = req.body;
  const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
  const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
  try {
    if (!await validateAndRenewPrimaryToken(req, primaryToken)) {
      res.status(401).json({ error: "Primary authentication required" });
      return;
    }
    const codeKey = codeAttemptKey(req, userId);
    const codeState = coupleCodeAttempts.get(codeKey);
    if (codeState && codeState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many wrong code attempts. Try again later.",
        retryAfterMs: codeState.blockedUntil - Date.now(),
        attemptsRemaining: 0
      });
      return;
    }
    const storedCode = await getProfileCode(userId);
    if (!storedCode || code.trim() !== storedCode.trim()) {
      const nextCount = (codeState?.count || 0) + 1;
      if (nextCount >= CODE_MAX_FAILED_ATTEMPTS) {
        coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: Date.now() + CODE_BLOCK_MS });
        res.status(429).json({
          error: "Too many wrong code attempts. Try again later.",
          retryAfterMs: CODE_BLOCK_MS,
          attemptsRemaining: 0
        });
        return;
      }
      coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid code", attemptsRemaining: CODE_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    coupleCodeAttempts.delete(codeKey);
    const encryptionKey = await getEffectiveCoupleCode() || storedCode;
    const profileResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
    const p = profileResult.rows[0];
    if (!p) {
      const defaultProfile = userId === "me" ? { id: "me", username: "mustaq", name: "Mustaq", bio: "Just us two \u2665", avatar: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop" } : { id: "wife", username: "sara", name: "Sara", bio: "My person \u2665", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop" };
      await db_default.execute(
        `INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)`,
        [defaultProfile.id, defaultProfile.username, defaultProfile.name, defaultProfile.bio, defaultProfile.avatar]
      );
      const newProfileResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
      const newP = newProfileResult.rows[0];
      if (!newP) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }
      const userAgent2 = req.headers["user-agent"] || "Unknown";
      const ip2 = req.headers["x-forwarded-for"]?.split(",")[0] || req.headers["x-real-ip"] || req.socket.remoteAddress || "Unknown";
      const { token: token2, csrfToken: csrfToken2, refreshToken: refreshToken2, deviceId: deviceId2 } = await createSession(userId, userId === "me" ? "mustaq" : "sara", userAgent2, ip2);
      setAuthCookies(res, {
        token: token2,
        csrfToken: csrfToken2,
        refreshToken: refreshToken2
      });
      res.json({
        token: token2,
        csrfToken: csrfToken2,
        refreshToken: refreshToken2,
        deviceId: deviceId2,
        encryptionKey,
        user: {
          id: userId,
          username: userId === "me" ? "mustaq" : "sara",
          name: newP.name,
          bio: newP.bio,
          avatar: await persistAvatarIfNeeded(userId, newP.avatar)
        }
      });
      return;
    }
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.headers["x-real-ip"] || req.socket.remoteAddress || "Unknown";
    const { token, csrfToken, refreshToken, deviceId } = await createSession(userId, userId === "me" ? "mustaq" : "sara", userAgent, ip);
    setAuthCookies(res, {
      token,
      csrfToken,
      refreshToken
    });
    res.json({
      token,
      csrfToken,
      refreshToken,
      deviceId,
      encryptionKey,
      user: {
        id: userId,
        username: userId === "me" ? "mustaq" : "sara",
        name: p.name,
        bio: p.bio,
        avatar: await persistAvatarIfNeeded(userId, p.avatar)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});
router2.post("/auth/logout", authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : void 0;
    const token = authHeader?.substring(7) || tokenFromCookie;
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (token) {
      destroySession(token);
    }
    clearAuthCookies(res);
    if (primaryToken) {
      setAuthCookies(res, {
        primaryToken
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});
router2.post("/auth/primary-login", rateLimiters.auth, validateBody({
  email: validators.nonEmptyString,
  password: validators.nonEmptyString
}), async (req, res) => {
  const { email, password, clientId, origin } = req.body;
  try {
    await clearExpiredPrimaryTokens();
    const attemptKey = primaryAttemptKey(req, email);
    const attemptState = primaryLoginAttempts.get(attemptKey);
    if (attemptState && attemptState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many failed attempts. Try again later.",
        retryAfterMs: attemptState.blockedUntil - Date.now(),
        attemptsRemaining: 0
      });
      return;
    }
    if (!isAllowedPrimaryCredential(email, password)) {
      const nextCount = (attemptState?.count || 0) + 1;
      if (nextCount >= PRIMARY_MAX_FAILED_ATTEMPTS) {
        primaryLoginAttempts.set(attemptKey, {
          count: nextCount,
          blockedUntil: Date.now() + PRIMARY_BLOCK_MS
        });
        res.status(429).json({
          error: "Too many failed attempts. Try again later.",
          retryAfterMs: PRIMARY_BLOCK_MS,
          attemptsRemaining: 0
        });
        return;
      }
      primaryLoginAttempts.set(attemptKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid email or password", attemptsRemaining: PRIMARY_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    primaryLoginAttempts.delete(attemptKey);
    const primaryToken = randomBytes2(32).toString("hex");
    const tokenHash = sha256(primaryToken);
    const now = Date.now();
    const userAgent = String(req.headers["user-agent"] || "Unknown");
    const trustedClientId = String(clientId || requestClientId(req)).trim();
    const trustedOrigin = String(origin || requestClientOrigin(req)).trim();
    await db_default.execute(
      "INSERT INTO primary_access_tokens (token_hash, email, user_agent, client_id, origin, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [tokenHash, email.toLowerCase(), userAgent, trustedClientId, trustedOrigin, now, now + PRIMARY_SESSION_MS]
    );
    setAuthCookies(res, {
      primaryToken
    });
    res.json({ ok: true, expiresAt: now + PRIMARY_SESSION_MS });
  } catch (err) {
    console.error("[auth] primary-login failed:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/connect|database|postgres|neon|timeout|ECONNREFUSED/i.test(msg)) {
      res.status(503).json({ error: "Database unavailable. Check DATABASE_URL on Vercel and redeploy." });
      return;
    }
    res.status(500).json({ error: "Primary login failed" });
  }
});
router2.post("/auth/revoke-trust", rateLimiters.auth, async (req, res) => {
  try {
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (primaryToken) {
      const tokenHash = sha256(primaryToken);
      await db_default.execute("DELETE FROM primary_access_tokens WHERE token_hash = $1", [tokenHash]);
    }
    res.clearCookie("grova_primary", { path: "/" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to revoke trust" });
  }
});
router2.get("/auth/primary-session", async (req, res) => {
  try {
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (!primaryToken) {
      res.status(401).json({ error: "Primary session missing" });
      return;
    }
    const ok = await validateAndRenewPrimaryToken(req, primaryToken);
    if (!ok) {
      res.status(401).json({ error: "Primary session expired" });
      return;
    }
    res.json({ ok: true, expiresInDays: 30, sessionMs: PRIMARY_SESSION_MS });
  } catch {
    res.status(500).json({ error: "Failed to validate primary session" });
  }
});
router2.get("/auth/codes", async (req, res) => {
  try {
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (!primaryToken) {
      res.status(401).json({ error: "Primary session missing" });
      return;
    }
    const ok = await validateAndRenewPrimaryToken(req, primaryToken);
    if (!ok) {
      res.status(401).json({ error: "Primary session expired" });
      return;
    }
    const meCode = await getProfileCode("me");
    const wifeCode = await getProfileCode("wife");
    res.json({ me: meCode, wife: wifeCode });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch codes" });
  }
});
router2.post("/auth/unlock", authenticate, validateBody({
  code: validators.stringOfLength(4, 50)
}), async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.id;
    const codeKey = codeAttemptKey(req, userId);
    const codeState = coupleCodeAttempts.get(codeKey);
    if (codeState && codeState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many wrong code attempts. Try again later.",
        retryAfterMs: codeState.blockedUntil - Date.now(),
        attemptsRemaining: 0
      });
      return;
    }
    const storedCode = await getProfileCode(userId);
    if (!storedCode || code.trim() !== storedCode.trim()) {
      const nextCount = (codeState?.count || 0) + 1;
      if (nextCount >= CODE_MAX_FAILED_ATTEMPTS) {
        coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: Date.now() + CODE_BLOCK_MS });
        res.status(429).json({
          error: "Too many wrong code attempts. Try again later.",
          retryAfterMs: CODE_BLOCK_MS,
          attemptsRemaining: 0
        });
        return;
      }
      coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid code", attemptsRemaining: CODE_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    coupleCodeAttempts.delete(codeKey);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Unlock failed" });
  }
});
router2.put("/auth/couple-code", authenticate, validateBody({
  newCode: validators.stringOfLength(4, 50),
  currentCode: validators.stringOfLength(4, 50)
}), async (req, res) => {
  const { newCode, currentCode } = req.body;
  try {
    const profileId = req.user.id;
    const profileCode = await getProfileCode(profileId);
    if (!profileCode || currentCode.trim() !== profileCode.trim()) {
      res.status(401).json({ error: "Current code is wrong" });
      return;
    }
    await setProfileCode(profileId, newCode);
    res.json({ success: true, message: "Profile code updated for your account only" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update code" });
  }
});
router2.post("/auth/refresh", rateLimiters.auth, async (req, res) => {
  try {
    const refreshFromCookie = req && typeof req.cookies?.grova_refresh === "string" ? req.cookies.grova_refresh : void 0;
    const { refreshToken: refreshFromBody } = req.body;
    const refreshToken = refreshFromBody || refreshFromCookie || "";
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }
    const newTokens = await refreshSession(refreshToken);
    if (!newTokens) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }
    setAuthCookies(res, {
      token: newTokens.token,
      csrfToken: newTokens.csrfToken,
      refreshToken: newTokens.refreshToken
    });
    res.json({
      token: newTokens.token,
      csrfToken: newTokens.csrfToken,
      refreshToken: newTokens.refreshToken
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh token" });
  }
});
router2.get("/auth/devices", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await getUserDevices(userId);
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: "Failed to get devices" });
  }
});
router2.delete("/auth/devices/:deviceId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    const success = await revokeDevice(userId, deviceId);
    if (!success) {
      res.status(404).json({ error: "Device not found or does not belong to user" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke device" });
  }
});
var auth_default = router2;

// src/routes/messages.ts
import { Router as Router3 } from "express";
import { randomUUID as randomUUID3 } from "crypto";

// src/lib/sse.ts
var clients = /* @__PURE__ */ new Map();
function addClient(id, res, userId) {
  clients.set(id, { res, userId });
  res.on("close", () => {
    removeClient(id);
  });
}
function removeClient(id) {
  clients.delete(id);
}
function broadcast(event, data, targetUserId) {
  const chunk = `event: ${event}
data: ${JSON.stringify(data)}

`;
  for (const [id, client] of clients.entries()) {
    try {
      if (targetUserId && client.userId !== targetUserId) {
        continue;
      }
      client.res.write(chunk);
    } catch {
      clients.delete(id);
    }
  }
}

// src/lib/activity-feed.ts
import { randomUUID as randomUUID2 } from "crypto";
async function postCoupleActivity(type, actorId, fromName, text, targetPath) {
  const id = randomUUID2();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  await db_default.execute(
    "INSERT INTO activity_feed (id, type, actor_id, from_name, text, timestamp, read, target_path) VALUES ($1, $2, $3, $4, $5, $6, 0, $7)",
    [id, type, actorId, fromName, text, timestamp, targetPath ?? null]
  );
  broadcast("activity-added", {
    id,
    type,
    actorId,
    fromName,
    text,
    timestamp,
    read: false,
    targetPath: targetPath ?? void 0
  });
}
async function profileDisplayName(userId) {
  const result = await db_default.execute("SELECT name FROM profiles WHERE id = $1", [userId]);
  const row = result.rows[0];
  return row?.name || userId;
}

// src/lib/encryption.ts
import crypto2 from "crypto";
var ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || "").trim();
var ENCRYPTION_PASSWORD = (process.env.ENCRYPTION_PASSWORD || "").trim();
var ALGORITHM = "aes-256-gcm";
var currentKeyVersion = 1;
var keyVersions = /* @__PURE__ */ new Map();
var isAuthenticated = false;
if (ENCRYPTION_KEY) {
  keyVersions.set(1, {
    version: 1,
    key: ENCRYPTION_KEY,
    createdAt: /* @__PURE__ */ new Date()
  });
}
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}
if (ENCRYPTION_KEY.length !== 64) {
  throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes in hex)");
}
if (!ENCRYPTION_PASSWORD) {
  throw new Error("ENCRYPTION_PASSWORD environment variable is required to access encryption key");
}
var REQUIRED_ENCRYPTION_PASSWORD = ENCRYPTION_PASSWORD;
function getKey(version) {
  const keyVersion = version || currentKeyVersion;
  const keyData = keyVersions.get(keyVersion);
  if (!keyData) {
    throw new Error(`Key version ${keyVersion} not found`);
  }
  return Buffer.from(keyData.key, "hex");
}
function authenticateEncryption(password) {
  const passwordHash = crypto2.createHash("sha256").update(password).digest("hex");
  const storedPasswordHash = crypto2.createHash("sha256").update(REQUIRED_ENCRYPTION_PASSWORD).digest("hex");
  if (passwordHash === storedPasswordHash) {
    isAuthenticated = true;
    console.log("[encryption] \u2705 Encryption access granted");
    return true;
  }
  isAuthenticated = false;
  console.error("[encryption] \u274C Authentication failed - incorrect password");
  return false;
}
function checkAuthentication() {
  if (!isAuthenticated) {
    throw new Error("\u{1F512} Encryption access denied. Must authenticate with password first. Call authenticateEncryption(password)");
  }
}
function encrypt(text, version) {
  checkAuthentication();
  const key = getKey(version);
  const iv = crypto2.randomBytes(16);
  const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  const keyVersion = version || currentKeyVersion;
  return `${keyVersion}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
function decrypt(encryptedText) {
  checkAuthentication();
  if (!encryptedText) {
    return "";
  }
  const parts = encryptedText.split(":");
  if (parts.length === 3) {
    const key = getKey();
    try {
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];
      const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err) {
      console.error("Decryption failed, returning original text:", err);
      return encryptedText;
    }
  }
  if (parts.length === 4) {
    const version = parseInt(parts[0], 10);
    try {
      const key = getKey(version);
      const iv = Buffer.from(parts[1], "hex");
      const authTag = Buffer.from(parts[2], "hex");
      const encrypted = parts[3];
      const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err) {
      console.error("Decryption failed, returning original text:", err);
      return encryptedText;
    }
  }
  return encryptedText;
}

// src/lib/message-storage.ts
var CIPHER_RE = /^(?:\d+:)?[0-9a-f]{16,}:[0-9a-f]{16,}:[0-9a-f]+$/i;
function isEncryptedPayload(value) {
  return CIPHER_RE.test(value);
}
function encryptStoredField(value) {
  if (!value) return null;
  if (isEncryptedPayload(value)) return value;
  return encrypt(value);
}
function decryptStoredField(value) {
  if (value == null || value === "") return void 0;
  const s = String(value);
  if (!isEncryptedPayload(s)) return s;
  return decrypt(s);
}

// src/lib/chat-clear.ts
async function getChatClearedAtForUser(userId) {
  const result = await db_default.execute("SELECT cleared_at FROM chat_clear_state WHERE user_id = $1", [userId]);
  const row = result.rows[0];
  return row?.cleared_at ? String(row.cleared_at) : null;
}
async function setChatClearedForUser(userId, clearedAt) {
  await db_default.execute(
    `INSERT INTO chat_clear_state (user_id, cleared_at) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET cleared_at = EXCLUDED.cleared_at`,
    [userId, clearedAt]
  );
}

// src/lib/file-mime.ts
var EXT_TO_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  rtf: "application/rtf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  json: "application/json",
  xml: "application/xml",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8"
};
var MIME_TO_EXT = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "application/zip": "zip"
};
function extFromName(fileName) {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m?.[1] ?? null;
}
function extensionForMime(mime) {
  if (!mime) return null;
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (MIME_TO_EXT[base]) return MIME_TO_EXT[base];
  if (base.startsWith("image/")) return base.slice(6) === "jpeg" ? "jpg" : base.slice(6);
  if (base.startsWith("video/")) return base.slice(6);
  if (base.startsWith("audio/")) return base.slice(6) === "mpeg" ? "mp3" : base.slice(6);
  return null;
}
function ensureFileNameWithExtension(fileName, mimeHint) {
  const trimmed = fileName.trim() || "file";
  if (extFromName(trimmed)) return trimmed;
  const ext = extensionForMime(mimeHint);
  return ext ? `${trimmed}.${ext}` : trimmed;
}
function resolveContentType(fileName, mimeHint, upstreamType) {
  const ext = extFromName(fileName);
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  const hint = mimeHint?.split(";")[0]?.trim().toLowerCase();
  if (hint && hint !== "application/octet-stream") return hint;
  const up = upstreamType?.split(";")[0]?.trim().toLowerCase();
  if (up && up !== "application/octet-stream") return up;
  return "application/octet-stream";
}
function sniffBufferMime(buffer, headerMime) {
  const header = headerMime?.split(";")[0]?.trim().toLowerCase() || "";
  if (header && header !== "application/json" && header !== "application/octet-stream") {
    return header;
  }
  if (buffer.length >= 12 && buffer[4] === 102 && buffer[5] === 116 && buffer[6] === 121 && buffer[7] === 112) {
    const brand = buffer.toString("ascii", 8, 12);
    const heicBrands = /* @__PURE__ */ new Set(["heic", "heix", "hevc", "hevx", "heis", "heim", "mif1", "msf1", "avif", "avis"]);
    if (heicBrands.has(brand)) return brand.startsWith("avif") ? "image/avif" : "image/heic";
    return "video/mp4";
  }
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) {
    return "image/png";
  }
  if (buffer.length >= 6 && buffer[0] === 71 && buffer[1] === 73 && buffer[2] === 70) {
    return "image/gif";
  }
  if (buffer.length >= 12 && buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 70) {
    const webm = buffer[8] === 87 && buffer[9] === 69 && buffer[10] === 66 && buffer[11] === 77;
    return webm ? "video/webm" : "audio/wav";
  }
  if (buffer.length >= 4 && buffer[0] === 37 && buffer[1] === 80 && buffer[2] === 68 && buffer[3] === 70) {
    return "application/pdf";
  }
  return header || "application/octet-stream";
}
function extForContentType(contentType) {
  const c = contentType.toLowerCase();
  for (const [mime, ext] of Object.entries(MIME_TO_EXT)) {
    if (c.includes(mime.split("/")[1]) || c === mime) return ext;
  }
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("pdf")) return "pdf";
  if (c.includes("mp4")) return "mp4";
  if (c.includes("quicktime")) return "mov";
  if (c.includes("webm")) return "webm";
  if (c.includes("mpeg") || c.includes("mp3")) return "mp3";
  if (c.includes("wav")) return "wav";
  if (c.includes("zip")) return "zip";
  if (c.includes("word") || c.includes("document")) return "docx";
  if (c.includes("sheet") || c.includes("excel")) return "xlsx";
  if (c.includes("presentation") || c.includes("powerpoint")) return "pptx";
  if (c.includes("text/plain")) return "txt";
  if (c.includes("json")) return "json";
  return "bin";
}

// src/lib/fcm.ts
import * as admin from "firebase-admin";
var fcmInitialized = false;
var fcmApp = null;
function initFirebase() {
  if (fcmInitialized && fcmApp) return true;
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT env variable is missing. Push notifications are disabled.");
      return false;
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (admin.apps.length > 0) {
      fcmApp = admin.apps[0];
    } else {
      fcmApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    fcmInitialized = true;
    console.log("[FCM] Firebase Admin initialized successfully.");
    return true;
  } catch (error) {
    console.error("[FCM] Failed to initialize Firebase Admin:", error);
    return false;
  }
}
async function sendPushNotification(token, title, body, data) {
  if (!initFirebase() || !fcmApp) return false;
  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        title,
        body,
        channelId: "grova_messages",
        sound: "default",
        ...data ?? {}
      },
      android: {
        priority: "high",
        ttl: 4 * 60 * 60 * 1e3,
        collapseKey: "grova_message",
        directBootOk: true,
        notification: {
          channelId: "grova_messages",
          sound: "default",
          clickAction: "FCM_PLUGIN_ACTIVITY"
        }
      },
      // FCM options for delivery analytics
      fcmOptions: {
        analyticsLabel: "grova_message"
      }
    };
    const response = await admin.messaging(fcmApp).send(message);
    console.log(`[FCM] Sent data message to ${token.substring(0, 8)}...: ${response}`);
    return true;
  } catch (error) {
    const errCode = error?.errorInfo?.code ?? error?.code ?? "";
    if (errCode.includes("registration-token-not-registered") || errCode.includes("invalid-registration-token")) {
      console.warn(`[FCM] Stale token for ${token.substring(0, 8)}... \u2014 should be removed from DB`);
    } else {
      console.error("[FCM] Error sending push notification:", error);
    }
    return false;
  }
}

// src/routes/messages.ts
async function autoUploadBase64Field(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    const mime = match?.[1] || "application/octet-stream";
    const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const key = `${randomUUID3()}.${extForContentType(mime)}`;
    const url = await uploadMedia(key, buffer, mime);
    return url;
  } catch (error) {
    console.error("Auto upload of base64 field failed:", error);
    throw new Error("Failed to upload media content to Cloudinary: " + (error instanceof Error ? error.message : String(error)));
  }
}
var router3 = Router3();
function validateVariant(variant) {
  return typeof variant === "string" && (variant === "cute" || variant === "default" || variant === "doodle_invite");
}
function parseMediaViewMode(companionSticker) {
  if (companionSticker === "__vm:once") return "once";
  if (companionSticker === "__vm:twice") return "twice";
  return "keep";
}
function displayReactionForViewer(row, viewerId) {
  const myReaction = row.my_reaction ? String(row.my_reaction) : void 0;
  const partnerReaction = row.partner_reaction ? String(row.partner_reaction) : void 0;
  if (viewerId) {
    const senderId = String(row.sender_id);
    return senderId === viewerId ? partnerReaction : myReaction;
  }
  return row.reaction ? String(row.reaction) : myReaction ?? partnerReaction;
}
function rowToMessage(row, viewerId) {
  const partnerRead = row.partner_read_at ? String(row.partner_read_at) : void 0;
  let location;
  if (row.location) {
    try {
      location = JSON.parse(String(row.location));
    } catch {
      location = void 0;
    }
  }
  const mediaViewMode = parseMediaViewMode(row.companion_sticker ? String(row.companion_sticker) : void 0);
  const mediaOpenCount = Number(row.viewer_media_open_count || 0);
  const mediaOpenedAt = row.partner_media_opened_at ? String(row.partner_media_opened_at) : void 0;
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    text: row.text ? decryptStoredField(row.text) : void 0,
    type: row.type,
    audioData: decryptStoredField(row.audio_data),
    gifUrl: row.gif_url ? String(row.gif_url) : void 0,
    imageData: decryptStoredField(row.image_data),
    imageUrl: row.image_url ? String(row.image_url) : void 0,
    fileData: decryptStoredField(row.file_data),
    fileType: row.file_type ? String(row.file_type) : void 0,
    fileSize: row.file_size ? Number(row.file_size) : void 0,
    location,
    timestamp: String(row.timestamp),
    liked: row.liked === 1 || row.liked === true,
    deleted: row.deleted === 1 || row.deleted === true,
    deletedAt: row.deleted_at ? String(row.deleted_at) : void 0,
    variant: validateVariant(row.variant) ? row.variant : void 0,
    companionSticker: row.companion_sticker ? String(row.companion_sticker) : void 0,
    reaction: displayReactionForViewer(row, viewerId),
    replyToId: row.reply_to_id ? String(row.reply_to_id) : void 0,
    replyToText: row.reply_to_text ? decryptStoredField(row.reply_to_text) : void 0,
    replyToSenderId: row.reply_to_sender_id ? String(row.reply_to_sender_id) : void 0,
    threadId: row.thread_id ? String(row.thread_id) : void 0,
    threadParentId: row.thread_parent_id ? String(row.thread_parent_id) : void 0,
    threadReplyCount: row.thread_reply_count ? Number(row.thread_reply_count) : void 0,
    mediaViewMode,
    mediaOpenCount,
    mediaOpenedAt,
    readAt: partnerRead,
    seenByPartner: Boolean(partnerRead),
    fontStyle: row.font_style ? row.font_style : void 0,
    replyToFontStyle: row.reply_to_font_style ? row.reply_to_font_style : void 0,
    replyToImageUrl: row.reply_to_image_url ? String(row.reply_to_image_url) : void 0,
    pinned: Boolean(row.is_pinned)
  };
}
router3.get("/messages", optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id ?? "me";
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const cursor = req.query.cursor;
    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);
    let query = `
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as my_reaction,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as partner_reaction,
             (SELECT read_at FROM message_read_receipts WHERE message_id = m.id AND user_id = ? LIMIT 1) as partner_read_at,
             (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count,
             (SELECT MAX(opened_at) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as partner_media_opened_at,
             EXISTS(SELECT 1 FROM pinned_messages WHERE message_id = m.id AND user_id = ?) as is_pinned
      FROM messages m
      WHERE (m.sender_id = ? OR m.sender_id = ?)
    `;
    const params = [
      authenticatedUserId,
      partnerId,
      partnerId,
      authenticatedUserId,
      partnerId,
      authenticatedUserId,
      authenticatedUserId,
      partnerId
    ];
    if (chatClearedAt) {
      query += " AND m.timestamp > ?";
      params.push(chatClearedAt);
    }
    if (cursor) {
      query += " AND m.timestamp < ?";
      params.push(cursor);
    }
    query += " ORDER BY m.timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const result = await db_default.query(query, params);
    console.log("Database query result:", result.rows.length, "messages found");
    const messages = result.rows.map((row) => rowToMessage(row, authenticatedUserId)).reverse();
    let countSql = "SELECT COUNT(*) as total FROM messages WHERE (sender_id = ? OR sender_id = ?)";
    const countParams = [authenticatedUserId, partnerId];
    if (chatClearedAt) {
      countSql += " AND timestamp > ?";
      countParams.push(chatClearedAt);
    }
    if (cursor) {
      countSql += " AND timestamp < ?";
      countParams.push(cursor);
    }
    const countResult = await db_default.query(countSql, countParams);
    const total = Number(countResult.rows[0]?.total || 0);
    res.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        // hasMore: are there more rows older than what we just fetched?
        hasMore: offset + messages.length < total,
        nextCursor: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      }
    });
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router3.get("/messages/context/:messageId", optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id ?? "me";
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const radius = Math.min(Math.max(parseInt(req.query.radius, 10) || 30, 10), 60);
    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);
    const targetResult = await db_default.query(
      `SELECT timestamp FROM messages
       WHERE id = ? AND (sender_id = ? OR sender_id = ?)
       ${chatClearedAt ? "AND timestamp > ?" : ""}
       LIMIT 1`,
      chatClearedAt ? [messageId, authenticatedUserId, partnerId, chatClearedAt] : [messageId, authenticatedUserId, partnerId]
    );
    if (targetResult.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const targetTs = String(targetResult.rows[0].timestamp);
    const selectCols = `
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as my_reaction,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as partner_reaction,
             (SELECT read_at FROM message_read_receipts WHERE message_id = m.id AND user_id = ? LIMIT 1) as partner_read_at,
             (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count,
             (SELECT MAX(opened_at) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as partner_media_opened_at,
             EXISTS(SELECT 1 FROM pinned_messages WHERE message_id = m.id AND user_id = ?) as is_pinned
      FROM messages m
      WHERE (m.sender_id = ? OR m.sender_id = ?)
    `;
    const baseParams = [
      authenticatedUserId,
      partnerId,
      partnerId,
      authenticatedUserId,
      partnerId,
      authenticatedUserId,
      authenticatedUserId,
      partnerId
    ];
    let olderSql = `${selectCols}`;
    const olderParams = [...baseParams];
    if (chatClearedAt) {
      olderSql += " AND m.timestamp > ?";
      olderParams.push(chatClearedAt);
    }
    olderSql += " AND m.timestamp < ? ORDER BY m.timestamp DESC LIMIT ?";
    olderParams.push(targetTs, radius);
    let newerSql = `${selectCols}`;
    const newerParams = [...baseParams];
    if (chatClearedAt) {
      newerSql += " AND m.timestamp > ?";
      newerParams.push(chatClearedAt);
    }
    newerSql += " AND m.timestamp >= ? ORDER BY m.timestamp ASC LIMIT ?";
    newerParams.push(targetTs, radius + 1);
    const [olderResult, newerResult] = await Promise.all([
      db_default.query(olderSql, olderParams),
      db_default.query(newerSql, newerParams)
    ]);
    const older = olderResult.rows.map((row) => rowToMessage(row, authenticatedUserId)).reverse();
    const newer = newerResult.rows.map((row) => rowToMessage(row, authenticatedUserId));
    const merged = [...older, ...newer];
    const byId = /* @__PURE__ */ new Map();
    for (const m of merged) byId.set(m.id, m);
    const messages = Array.from(byId.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let countSql = "SELECT COUNT(*) as total FROM messages WHERE (sender_id = ? OR sender_id = ?)";
    const countParams = [authenticatedUserId, partnerId];
    if (chatClearedAt) {
      countSql += " AND timestamp > ?";
      countParams.push(chatClearedAt);
    }
    const countResult = await db_default.query(countSql, countParams);
    const total = Number(countResult.rows[0]?.total || 0);
    res.json({
      messages,
      targetId: messageId,
      pagination: {
        total,
        hasMoreBefore: older.length >= radius,
        hasMoreAfter: newer.length >= radius + 1
      }
    });
  } catch (err) {
    console.error("Failed to fetch message context:", err);
    res.status(500).json({ error: "Failed to fetch message context" });
  }
});
router3.get("/messages/unread-count", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);
    const sinceRaw = typeof req.query.since === "string" ? req.query.since : void 0;
    const sinceOpened = sinceRaw && !Number.isNaN(new Date(sinceRaw).getTime()) ? sinceRaw : void 0;
    let effectiveSince = chatClearedAt;
    if (sinceOpened) {
      if (!effectiveSince || sinceOpened > effectiveSince) {
        effectiveSince = sinceOpened;
      }
    }
    let sql = `
      SELECT COUNT(*) AS count
      FROM messages m
      WHERE m.deleted = 0
        AND m.sender_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM message_read_receipts r
          WHERE r.message_id = m.id AND r.user_id = ?
        )
    `;
    const params = [partnerId, authenticatedUserId];
    if (effectiveSince) {
      sql += " AND m.timestamp > ?";
      params.push(effectiveSince);
    }
    const result = await db_default.query(sql, params);
    const row = result.rows[0];
    const count = Number(row?.count ?? 0);
    res.json({ count: Number.isFinite(count) ? count : 0 });
  } catch (err) {
    console.error("Failed to fetch unread chat count:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});
router3.post("/messages", authenticate, validateBody({
  senderId: validators.nonEmptyString,
  type: validators.enum(["text", "audio", "heart", "sticker", "gif", "image", "video", "file", "location", "doodle"])
}), async (req, res) => {
  const body = req.body;
  const authenticatedUserId = req.user.id;
  let {
    senderId,
    text,
    type,
    audioData,
    gifUrl,
    imageData,
    imageUrl,
    fileData,
    fileType,
    fileSize,
    location,
    variant,
    companionSticker,
    replyToId,
    replyToText,
    replyToSenderId,
    fontStyle,
    replyToFontStyle,
    replyToImageUrl
  } = body;
  if (senderId !== authenticatedUserId) {
    senderId = authenticatedUserId;
  }
  if (text && text.length > 1e4) {
    res.status(400).json({ error: "text is too long (max 10000 characters)" });
    return;
  }
  if (audioData && audioData.length > 1e7) {
    res.status(400).json({ error: "audio data is too large (max 10MB)" });
    return;
  }
  if (imageData && imageData.length > 1e7) {
    res.status(400).json({ error: "image data is too large (max 10MB)" });
    return;
  }
  if (fileData && fileData.length > 28e6) {
    res.status(400).json({ error: "file data is too large (max 20MB)" });
    return;
  }
  try {
    if (imageData && imageData.startsWith("data:")) {
      imageUrl = await autoUploadBase64Field(imageData);
      imageData = void 0;
    }
    if (audioData && audioData.startsWith("data:")) {
      audioData = await autoUploadBase64Field(audioData);
    }
    if (fileData && fileData.startsWith("data:")) {
      fileData = await autoUploadBase64Field(fileData);
    }
  } catch (err) {
    console.error("Auto upload failed:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Media upload failed" });
    return;
  }
  const id = randomUUID3();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const encryptedText = encryptStoredField(text ?? void 0);
  const encryptedReplyText = encryptStoredField(replyToText ?? void 0);
  const encryptedAudio = encryptStoredField(audioData);
  const encryptedImage = encryptStoredField(imageData);
  const encryptedFile = encryptStoredField(fileData);
  const locationJson = location ? JSON.stringify(location) : null;
  try {
    await db_default.execute(
      `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, image_url, file_data, file_type, file_size, location, timestamp, liked, deleted, variant, companion_sticker, reply_to_id, reply_to_text, reply_to_sender_id, font_style, reply_to_font_style, reply_to_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        senderId,
        encryptedText ?? null,
        type || "text",
        encryptedAudio ?? null,
        gifUrl ?? null,
        encryptedImage ?? null,
        imageUrl ?? null,
        encryptedFile ?? null,
        fileType ?? null,
        fileSize ?? null,
        locationJson,
        timestamp,
        0,
        0,
        variant ?? "default",
        companionSticker ?? null,
        replyToId ?? null,
        encryptedReplyText ?? null,
        replyToSenderId ?? null,
        fontStyle ?? null,
        replyToFontStyle ?? null,
        replyToImageUrl ?? null
      ]
    );
    const msg = {
      id,
      senderId,
      text,
      type: type || "text",
      audioData,
      gifUrl,
      imageData,
      imageUrl,
      fileData,
      fileType,
      fileSize,
      location,
      timestamp,
      liked: false,
      variant: variant ?? "default",
      companionSticker,
      replyToId,
      replyToText,
      replyToSenderId,
      fontStyle,
      replyToFontStyle,
      replyToImageUrl
    };
    const partnerId = senderId === "me" ? "wife" : "me";
    broadcast("new-message", msg, partnerId);
    const fromName = await profileDisplayName(senderId);
    if (companionSticker === "\u{1F932}") {
      await postCoupleActivity("dua", senderId, fromName, "shared a dua with you \u{1F932}", "/dua").catch(() => {
      });
    }
    try {
      const tokenResult = await db_default.query(
        "SELECT token FROM fcm_tokens WHERE user_id = ?",
        [partnerId]
      );
      if (tokenResult.rows.length > 0) {
        const token = tokenResult.rows[0].token;
        let pushBody = "New message";
        if (type === "text") pushBody = text || "Text message";
        else if (type === "image") pushBody = "\u{1F5BC}\uFE0F Sent an image";
        else if (type === "video") pushBody = "\u{1F3A5} Sent a video";
        else if (type === "audio") pushBody = "\u{1F3A4} Sent a voice message";
        else if (type === "location") pushBody = "\u{1F4CD} Shared a location";
        else if (type === "file") pushBody = "\u{1F4C4} Sent a file";
        else if (type === "heart") pushBody = "\u2764\uFE0F Sent a heart";
        await sendPushNotification(token, fromName, pushBody, {
          type: "message",
          messageId: id,
          senderId
        });
      }
    } catch (pushErr) {
      console.error("Failed to send push notification:", pushErr);
    }
    res.json(msg);
  } catch (err) {
    console.error("Failed to create message:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});
router3.post("/messages/:id/open-media", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count
       FROM messages m
       WHERE m.id = ?`,
      [authenticatedUserId, messageId]
    );
    const row = result.rows[0];
    if (!row || row.deleted === 1 || row.deleted === true) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const senderId = String(row.sender_id);
    if (senderId !== authenticatedUserId && senderId !== partnerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const viewMode = parseMediaViewMode(row.companion_sticker ? String(row.companion_sticker) : void 0);
    const limit = viewMode === "once" ? 1 : viewMode === "twice" ? 2 : 0;
    const currentCount = Number(row.viewer_media_open_count || 0);
    const mediaUrl = (row.type === "image" ? row.image_url ? String(row.image_url) : decryptStoredField(row.image_data) : void 0) || (row.type === "video" ? decryptStoredField(row.file_data) : void 0);
    if (!mediaUrl || row.type !== "image" && row.type !== "video") {
      res.status(400).json({ error: "Message does not contain viewable media" });
      return;
    }
    let newCount = currentCount;
    let openedAt;
    if (limit > 0 && senderId !== authenticatedUserId) {
      if (currentCount >= limit) {
        res.status(410).json({ error: "Media no longer available" });
        return;
      }
      openedAt = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        "INSERT INTO message_media_opens (id, message_id, user_id, opened_at) VALUES (?, ?, ?, ?)",
        [randomUUID3(), messageId, authenticatedUserId, openedAt]
      );
      newCount = currentCount + 1;
      broadcast("message-media-opened", { messageId, userId: authenticatedUserId, mediaOpenCount: newCount, mediaOpenedAt: openedAt });
    }
    res.json({ ok: true, url: mediaUrl, kind: row.type === "video" ? "video" : "image", mediaOpenCount: newCount, mediaOpenedAt: openedAt });
  } catch (err) {
    console.error("Failed to open media message:", err);
    res.status(500).json({ error: "Failed to open media" });
  }
});
router3.patch("/messages/:id/like", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as my_reaction,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as partner_reaction
      FROM messages m
      WHERE m.id = ?
    `, [authenticatedUserId, partnerId, messageId]);
    const row = result.rows[0];
    if (!row || row.deleted === 1) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId && row.sender_id !== partnerId) {
      res.status(403).json({ error: "Forbidden: Can only like messages from you or your partner" });
      return;
    }
    const newLiked = row.liked === 1 || row.liked === true ? 0 : 1;
    await db_default.execute("UPDATE messages SET liked = ? WHERE id = ?", [newLiked, messageId]);
    const msg = rowToMessage(row, authenticatedUserId);
    msg.liked = newLiked === 1;
    broadcast("message-liked", { ...msg, likedBy: authenticatedUserId }, String(row.sender_id));
    res.json({ ...msg, likedBy: authenticatedUserId });
  } catch (err) {
    res.status(500).json({ error: "Failed to like message" });
  }
});
router3.patch("/messages/:id/edit", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { text, userId } = req.body;
    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "Text is required" });
      return;
    }
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as my_reaction,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as partner_reaction
      FROM messages m
      WHERE m.id = ?
    `, [authenticatedUserId, partnerId, messageId]);
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only edit your own messages" });
      return;
    }
    if (row.type !== "text") {
      res.status(400).json({ error: "Can only edit text messages" });
      return;
    }
    const encryptedText = encryptStoredField(text.trim());
    await db_default.execute(
      "UPDATE messages SET text = ? WHERE id = ?",
      [encryptedText, messageId]
    );
    const msg = rowToMessage(row, authenticatedUserId);
    msg.text = text.trim();
    broadcast("message-edited", msg);
    res.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error("Failed to edit message:", err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});
router3.delete("/messages/:id", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as my_reaction,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id AND user_id = ? ORDER BY timestamp DESC LIMIT 1) as partner_reaction
      FROM messages m
      WHERE m.id = ?
    `, [authenticatedUserId, partnerId, messageId]);
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    if (String(row.sender_id) !== authenticatedUserId) {
      res.status(403).json({ error: "You can only unsend your own messages" });
      return;
    }
    const alreadyDeleted = row.deleted === 1 || row.deleted === true;
    const deletedAt = row.deleted_at ? String(row.deleted_at) : (/* @__PURE__ */ new Date()).toISOString();
    if (!alreadyDeleted) {
      try {
        await db_default.execute(
          "UPDATE messages SET deleted = 1, deleted_at = ?, text = NULL, audio_data = NULL, gif_url = NULL, image_data = NULL, image_url = NULL, file_data = NULL, location = NULL WHERE id = ?",
          [deletedAt, messageId]
        );
      } catch (updateErr) {
        console.error("Full message delete update failed, retrying minimal:", updateErr);
        await db_default.execute(
          "UPDATE messages SET deleted = 1, deleted_at = ? WHERE id = ?",
          [deletedAt, messageId]
        );
      }
    }
    const msg = rowToMessage(row, authenticatedUserId);
    msg.text = void 0;
    msg.audioData = void 0;
    msg.gifUrl = void 0;
    msg.imageData = void 0;
    msg.imageUrl = void 0;
    msg.fileData = void 0;
    msg.location = void 0;
    msg.deleted = true;
    msg.deletedAt = deletedAt;
    broadcast("message-deleted", msg);
    res.json(msg);
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});
var messages_default = router3;

// src/routes/duas.ts
import { Router as Router4 } from "express";
import { randomUUID as randomUUID4 } from "crypto";
var router4 = Router4();
router4.get("/duas", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM duas ORDER BY timestamp DESC");
    const duas = result.rows.map((row) => ({
      id: row.id,
      arabic: row.arabic,
      translation: row.translation,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(duas);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch duas" });
  }
});
router4.post("/duas", rateLimiters.messages, authenticate, async (req, res) => {
  const { arabic, translation, author } = req.body;
  if (!arabic || !author) {
    res.status(400).json({ error: "arabic and author required" });
    return;
  }
  const id = randomUUID4();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO duas (id, arabic, translation, author, timestamp) VALUES ($1, $2, $3, $4, $5)",
      [id, arabic, translation || "", author, timestamp]
    );
    const dua = {
      id,
      arabic,
      translation: translation || "",
      author,
      timestamp
    };
    broadcast("dua-added", dua);
    await postCoupleActivity("dua", author, await profileDisplayName(author), "added a new dua").catch(() => {
    });
    res.json(dua);
  } catch (err) {
    res.status(500).json({ error: "Failed to create dua" });
  }
});
router4.delete("/duas/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = req.user?.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author FROM duas WHERE id = $1", [id]);
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own duas" });
      return;
    }
    await db_default.execute("DELETE FROM duas WHERE id = $1", [id]);
    broadcast("dua-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete dua" });
  }
});
var duas_default = router4;

// src/routes/events.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/sse", authenticate, (req, res) => {
  if (process.env.VERCEL) {
    res.status(200).json({ mode: "poll", pollIntervalMs: 1e3 });
    return;
  }
  const q = req.query.userId;
  const fromQuery = typeof q === "string" ? q : Array.isArray(q) ? q[0] : void 0;
  const userId = fromQuery === "wife" || fromQuery === "me" ? fromQuery : "anon";
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const clientId = `${userId}-${Date.now()}`;
  addClient(clientId, res, userId);
  const hb = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(hb);
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(hb);
    removeClient(clientId);
  });
  res.write("event: connected\ndata: {}\n\n");
});
var events_default = router5;

// src/routes/calendar-events.ts
import { Router as Router6 } from "express";
import { randomUUID as randomUUID5 } from "crypto";
var router6 = Router6();
router6.get("/calendar/events", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM calendar_events ORDER BY date ASC");
    const events = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time,
      description: row.description,
      type: row.type,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});
router6.post("/calendar/events", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, date, time, description, type, author } = req.body;
  if (!title || !date || !type || !author) {
    res.status(400).json({ error: "title, date, type, and author required" });
    return;
  }
  const id = randomUUID5();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO calendar_events (id, title, date, time, description, type, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, title, date, time || null, description || null, type, author, timestamp]
    );
    const event = {
      id,
      title,
      date,
      time,
      description,
      type,
      author,
      timestamp
    };
    broadcast("event-added", event);
    const fromName = await profileDisplayName(author);
    void postCoupleActivity(
      "calendar",
      author,
      fromName,
      `added a new event in calendar: ${title.trim()}`,
      `/calendar?event=${id}`
    ).catch(() => {
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});
router6.put("/calendar/events/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, date, time, description, type } = req.body;
  try {
    const updateParts = [];
    const values = [];
    let paramIndex = 1;
    if (title !== void 0) {
      updateParts.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (date !== void 0) {
      updateParts.push(`date = $${paramIndex++}`);
      values.push(date);
    }
    if (time !== void 0) {
      updateParts.push(`time = $${paramIndex++}`);
      values.push(time);
    }
    if (description !== void 0) {
      updateParts.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (type !== void 0) {
      updateParts.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (updateParts.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    values.push(id);
    await db_default.execute(
      `UPDATE calendar_events SET ${updateParts.join(", ")} WHERE id = $${paramIndex}`,
      values
    );
    const result = await db_default.execute("SELECT * FROM calendar_events WHERE id = $1", [id]);
    const event = result.rows[0];
    broadcast("event-updated", event);
    res.json({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      description: event.description,
      type: event.type,
      author: event.author,
      timestamp: event.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update event" });
  }
});
router6.delete("/calendar/events/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM calendar_events WHERE id = $1", [id]);
    broadcast("event-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});
var calendar_events_default = router6;

// src/routes/checkins.ts
import { Router as Router7 } from "express";
import { randomUUID as randomUUID6 } from "crypto";
var router7 = Router7();
router7.get("/checkins", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM daily_checkins ORDER BY timestamp DESC");
    const checkins = result.rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      mood: row.mood,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch checkins" });
  }
});
router7.post("/checkins", rateLimiters.messages, authenticate, async (req, res) => {
  const { question, answer, mood, author } = req.body;
  if (!question || !answer || !mood || !author) {
    res.status(400).json({ error: "question, answer, mood, and author required" });
    return;
  }
  const id = randomUUID6();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO daily_checkins (id, question, answer, mood, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, question, answer, mood, author, timestamp]
    );
    const checkin = {
      id,
      question,
      answer,
      mood,
      author,
      timestamp
    };
    broadcast("checkin-added", checkin);
    const fromName = await profileDisplayName(author);
    void postCoupleActivity(
      "checkin",
      author,
      fromName,
      "responded in check-in",
      `/checkin?highlight=${id}`
    ).catch(() => {
    });
    res.json(checkin);
  } catch (err) {
    res.status(500).json({ error: "Failed to create checkin" });
  }
});
router7.delete("/checkins/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM daily_checkins WHERE id = $1", [id]);
    broadcast("checkin-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete checkin" });
  }
});
var checkins_default = router7;

// src/routes/tasks.ts
import { Router as Router8 } from "express";
import { randomUUID as randomUUID7 } from "crypto";
var router8 = Router8();
router8.get("/tasks", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM shared_tasks ORDER BY completed ASC, priority DESC, timestamp DESC");
    const tasks = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      assignedTo: row.assigned_to,
      priority: row.priority,
      completed: Boolean(row.completed),
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});
router8.post("/tasks", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, assignedTo, priority, author } = req.body;
  if (!title || !assignedTo || !priority || !author) {
    res.status(400).json({ error: "title, assignedTo, priority, and author required" });
    return;
  }
  const id = randomUUID7();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO shared_tasks (id, title, assigned_to, priority, completed, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, title, assignedTo, priority, 0, author, timestamp]
    );
    const task = {
      id,
      title,
      assignedTo,
      priority,
      completed: false,
      author,
      timestamp
    };
    broadcast("task-added", task);
    const fromName = await profileDisplayName(author);
    void postCoupleActivity(
      "task",
      author,
      fromName,
      `added a new task: ${title}`,
      `/tasks?highlight=${id}`
    ).catch(() => {
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});
router8.put("/tasks/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  if (completed === void 0) {
    res.status(400).json({ error: "completed field required" });
    return;
  }
  try {
    await db_default.execute("UPDATE shared_tasks SET completed = $1 WHERE id = $2", [completed ? 1 : 0, id]);
    const result = await db_default.execute("SELECT * FROM shared_tasks WHERE id = $1", [id]);
    const task = result.rows[0];
    broadcast("task-updated", {
      id: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      priority: task.priority,
      completed: task.completed,
      author: task.author,
      timestamp: task.timestamp
    });
    res.json({
      id: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      priority: task.priority,
      completed: task.completed,
      author: task.author,
      timestamp: task.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});
router8.delete("/tasks/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM shared_tasks WHERE id = $1", [id]);
    broadcast("task-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});
var tasks_default = router8;

// src/routes/milestones.ts
import { Router as Router9 } from "express";
import { randomUUID as randomUUID8 } from "crypto";
var router9 = Router9();
router9.get("/milestones", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM relationship_milestones ORDER BY date DESC");
    const milestones = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      description: row.description,
      type: row.type,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});
router9.post("/milestones", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, date, description, type, author } = req.body;
  if (!title || !date || !type || !author) {
    res.status(400).json({ error: "title, date, type, and author required" });
    return;
  }
  const id = randomUUID8();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO relationship_milestones (id, title, date, description, type, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, title, date, description || null, type, author, timestamp]
    );
    const milestone = {
      id,
      title,
      date,
      description,
      type,
      author,
      timestamp
    };
    broadcast("milestone-added", milestone);
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed to create milestone" });
  }
});
router9.delete("/milestones/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM relationship_milestones WHERE id = $1", [id]);
    broadcast("milestone-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});
var milestones_default = router9;

// src/routes/secret-notes.ts
import { Router as Router10 } from "express";
import { randomUUID as randomUUID9 } from "crypto";
var router10 = Router10();
router10.get("/secret-notes", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM secret_notes ORDER BY timestamp DESC");
    const notes = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch secret notes" });
  }
});
router10.post("/secret-notes", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: "content required" });
    return;
  }
  const id = randomUUID9();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const author = authId;
  try {
    await db_default.execute(
      "INSERT INTO secret_notes (id, content, author, timestamp) VALUES ($1, $2, $3, $4)",
      [id, content.trim(), author, timestamp]
    );
    const note = {
      id,
      content,
      author,
      timestamp
    };
    broadcast("secret-note-added", note);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to create secret note" });
  }
});
router10.delete("/secret-notes/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author FROM secret_notes WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (String(existing.rows[0].author) !== authId) {
      res.status(403).json({ error: "Only the creator can delete this note" });
      return;
    }
    await db_default.execute("DELETE FROM secret_notes WHERE id = $1", [id]);
    broadcast("secret-note-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete secret note" });
  }
});
var secret_notes_default = router10;

// src/routes/call.ts
import { Router as Router11 } from "express";

// src/lib/webrtc.ts
function getWebRTCConfiguration() {
  const turnServers = getTurnServers();
  const stunServers = getStunServers();
  return {
    iceServers: [
      ...stunServers,
      ...turnServers
    ]
  };
}
function getStunServers() {
  const defaultStunServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ];
  const customStunUrls = process.env.STUN_SERVERS?.split(",").filter(Boolean) || [];
  if (customStunUrls.length > 0) {
    return customStunUrls.map((url) => ({ urls: url.trim() }));
  }
  return defaultStunServers;
}
function getTurnServers() {
  const turnUrls = process.env.TURN_SERVERS?.split(",").filter(Boolean) || [];
  const turnUsername = process.env.TURN_USERNAME;
  const turnSecret = process.env.TURN_CREDENTIAL;
  if (turnUrls.length === 0 || !turnUsername || !turnSecret) {
    console.warn("TURN server not configured via env vars. Falling back to public openrelay.metered.ca TURN servers.");
    return [
      {
        urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"],
        username: "openrelayproject",
        credential: "openrelayproject",
        credentialType: "password"
      }
    ];
  }
  const { username, credential: credential2 } = generateTurnCredentials(turnUsername, turnSecret);
  return turnUrls.map((url) => ({
    urls: url.trim(),
    username,
    credential: credential2,
    credentialType: "password"
  }));
}
function generateTurnCredentials(username, secret, ttl = 86400) {
  const timestamp = Math.floor(Date.now() / 1e3) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  const crypto3 = __require("crypto");
  const hmac = crypto3.createHmac("sha1", secret);
  hmac.update(turnUsername);
  const credential2 = hmac.digest("base64");
  return { username: turnUsername, credential: credential2 };
}

// src/routes/call.ts
var import_web_push = __toESM(require_src2(), 1);
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    import_web_push.default.setVapidDetails(
      "mailto:admin@example.com",
      process.env.VITE_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error("Failed to initialize web-push:", err);
  }
}
var router11 = Router11();
function partnerIdFor(userId) {
  return userId === "me" ? "wife" : "me";
}
router11.get("/call/rtc-config", authenticate, (_req, res) => {
  res.json(getWebRTCConfiguration());
});
router11.post("/call/signal", rateLimiters.messages, authenticate, (req, res) => {
  const authenticatedUserId = req.user.id;
  const { type, senderId, ...rest } = req.body;
  if (senderId !== authenticatedUserId) {
    res.status(403).json({ error: "Forbidden: Can only send signals as yourself" });
    return;
  }
  const partnerId = partnerIdFor(authenticatedUserId);
  const event = `call-${type}`;
  const payload = { from: senderId, ...rest };
  broadcast(event, payload, partnerId);
  const expiresAt = Date.now() + 6e4;
  db_default.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [partnerId, event, JSON.stringify(payload), Date.now(), expiresAt]
  ).catch((err) => console.error("Failed to save call signal:", err));
  if (type === "reject" || type === "answer") {
    db_default.execute(
      "DELETE FROM call_signals WHERE receiver_id = $1 AND event IN ('call-offer', 'call-ring')",
      [authenticatedUserId]
    ).catch((err) => console.error("Failed to clear signals on answer/reject:", err));
  } else if (type === "end") {
    db_default.execute(
      "DELETE FROM call_signals WHERE (receiver_id = $1 OR receiver_id = $2) AND event IN ('call-offer', 'call-ring')",
      [authenticatedUserId, partnerId]
    ).catch((err) => console.error("Failed to clear signals on end:", err));
  }
  if (type === "offer") {
    db_default.execute("SELECT subscription FROM push_subscriptions WHERE user_id = $1", [partnerId]).then((subRes) => {
      if (subRes.rows.length > 0) {
        const sub = JSON.parse(subRes.rows[0].subscription);
        const notificationPayload = JSON.stringify({
          type: "call",
          title: "Incoming Call",
          body: `Incoming ${rest.callType === "video" ? "video" : "audio"} call...`,
          icon: "/favicon.svg"
        });
        import_web_push.default.sendNotification(sub, notificationPayload).catch((err) => console.error("Web push failed:", err));
      }
    }).catch((err) => console.error("Failed to fetch push subscription:", err));
  }
  res.json({ ok: true });
});
router11.post("/call/notify", rateLimiters.messages, authenticate, (req, res) => {
  const authenticatedUserId = req.user.id;
  const { from, callType } = req.body;
  if (from !== authenticatedUserId) {
    res.status(403).json({ error: "Forbidden: Can only send notifications as yourself" });
    return;
  }
  const partnerId = partnerIdFor(authenticatedUserId);
  const event = "call-ring";
  const payload = { from, callType };
  broadcast(event, payload, partnerId);
  const expiresAt = Date.now() + 6e4;
  db_default.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [partnerId, event, JSON.stringify(payload), Date.now(), expiresAt]
  ).catch((err) => console.error("Failed to save call notification:", err));
  profileDisplayName(from).then((fromName) => {
    db_default.query("SELECT token FROM fcm_tokens WHERE user_id = ?", [partnerId]).then((tokenResult) => {
      if (tokenResult.rows.length > 0) {
        const token = tokenResult.rows[0].token;
        sendPushNotification(token, "Incoming Call", `${fromName} is calling you via ${callType}...`, {
          type: "call",
          callType,
          senderId: from
        });
      }
    });
  }).catch((err) => console.error("Failed to fetch FCM token for call:", err));
  res.json({ ok: true });
});
router11.get("/call/signals", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const result = await db_default.execute(
      "SELECT * FROM call_signals WHERE receiver_id = $1 AND expires_at > $2",
      [authenticatedUserId, Date.now()]
    );
    db_default.execute("DELETE FROM call_signals WHERE expires_at <= $1", [Date.now()]).catch(() => {
    });
    const signals = result.rows.map((row) => ({
      event: row.event,
      data: JSON.parse(row.data)
    }));
    res.json(signals);
  } catch (err) {
    console.error("Failed to fetch call signals:", err);
    res.status(500).json({ error: "Failed to fetch call signals" });
  }
});
var call_default = router11;

// src/routes/profile.ts
import { Router as Router12 } from "express";

// src/services/profile-service.ts
function usernameFromDisplayName(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return slug.slice(0, 30) || "user";
}
var ProfileService = class {
  /**
   * Get profiles for authenticated user and their partner
   */
  async getUserProfiles(userId) {
    const partnerId = appConfig.partnerMapping[userId] || userId;
    const result = await db_default.execute(
      "SELECT * FROM profiles WHERE id = $1 OR id = $2",
      [userId, partnerId]
    );
    const rows = [];
    for (const row of result.rows) {
      const r = row;
      const id = String(r.id);
      const avatar = sanitizeAvatarForClient(id, r.avatar);
      rows.push({
        id,
        username: r.username,
        name: r.name,
        bio: r.bio,
        avatar
      });
    }
    return rows;
  }
  /**
   * Update a user's profile
   */
  async updateProfile(userId, updates) {
    const { name, bio, avatar } = updates;
    const updateFields = [];
    const params = [];
    let n = 1;
    let previousName;
    if (name !== void 0) {
      const existing = await db_default.execute("SELECT name FROM profiles WHERE id = $1", [userId]);
      previousName = existing.rows[0]?.name;
      updateFields.push(`name = $${n++}`);
      params.push(name);
      updateFields.push(`username = $${n++}`);
      params.push(usernameFromDisplayName(name));
    }
    if (bio !== void 0) {
      updateFields.push(`bio = $${n++}`);
      params.push(bio);
    }
    if (avatar !== void 0) {
      if (typeof avatar === "string" && avatar.length > 3e6) {
        throw new Error("Avatar image is too large");
      }
      const storedAvatar = await persistAvatarIfNeeded(userId, avatar);
      updateFields.push(`avatar = $${n++}`);
      params.push(storedAvatar);
    }
    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }
    params.push(userId);
    await db_default.execute(
      `UPDATE profiles SET ${updateFields.join(", ")} WHERE id = $${n}`,
      params
    );
    const result = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
    const profile = result.rows[0];
    const publicAvatar = sanitizeAvatarForClient(userId, profile.avatar);
    broadcast("profile-updated", {
      userId,
      id: profile.id,
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: publicAvatar
    });
    if (name !== void 0) {
      await db_default.execute(
        `UPDATE activity_feed SET from_name = $1
         WHERE actor_id = $2 OR ($3::text IS NOT NULL AND from_name = $3)`,
        [profile.name, userId, previousName ?? null]
      );
    }
    const displayName = profile.name || userId;
    if (name !== void 0) {
      await postCoupleActivity("story", userId, displayName, `changed their name to ${name}`).catch(() => {
      });
    } else if (bio !== void 0) {
      await postCoupleActivity("story", userId, displayName, "updated their bio").catch(() => {
      });
    } else if (avatar !== void 0) {
      await postCoupleActivity("story", userId, displayName, "changed their profile photo").catch(() => {
      });
    }
    return {
      id: String(profile.id),
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: publicAvatar
    };
  }
  /**
   * Validate profile update payload
   */
  validateProfileUpdate(payload) {
    const errors = [];
    if (payload.name !== void 0) {
      if (typeof payload.name !== "string") {
        errors.push("Name must be a string");
      } else if (payload.name.length < 1 || payload.name.length > 100) {
        errors.push("Name must be between 1 and 100 characters");
      }
    }
    if (payload.bio !== void 0) {
      if (typeof payload.bio !== "string") {
        errors.push("Bio must be a string");
      } else if (payload.bio.length > 500) {
        errors.push("Bio must not exceed 500 characters");
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
var profileService = new ProfileService();

// src/routes/profile.ts
function getParam(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router12 = Router12();
router12.get("/users", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const profiles = await profileService.getUserProfiles(userId);
    res.json(profiles);
  } catch (err) {
    logger.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
router12.put("/users/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const normalizedId = getParam(id);
  const authId = req.user.id;
  if (normalizedId !== "me" && normalizedId !== "wife") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (normalizedId !== authId) {
    res.status(403).json({ error: "Can only update your own profile" });
    return;
  }
  const { name, bio, avatar } = req.body;
  const validation = profileService.validateProfileUpdate({ name, bio });
  if (!validation.valid) {
    res.status(400).json({ error: "Validation failed", details: validation.errors });
    return;
  }
  try {
    const profile = await profileService.updateProfile(normalizedId, { name, bio, avatar });
    res.json(profile);
  } catch (err) {
    logger.error({ err, userId: normalizedId }, "Failed to update profile");
    if (err instanceof Error && err.message === "No fields to update") {
      res.status(400).json({ error: "No fields to update" });
    } else {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
});
var profile_default = router12;

// src/routes/presence.ts
import { Router as Router13 } from "express";

// src/lib/schedule-worker.ts
import { randomUUID as randomUUID10 } from "crypto";
async function deliverScheduledRow(row) {
  const id = randomUUID10();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const senderId = String(row.sender_id);
  const type = String(row.type || "text");
  const text = row.text ? decryptStoredField(row.text) : void 0;
  const audioData = decryptStoredField(row.audio_data);
  const gifUrl = row.gif_url ? String(row.gif_url) : void 0;
  const imageData = decryptStoredField(row.image_data);
  const variant = row.variant ? String(row.variant) : "default";
  const companionSticker = row.companion_sticker ? String(row.companion_sticker) : void 0;
  await db_default.execute(
    `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, image_url, timestamp, liked, deleted, variant, companion_sticker)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      senderId,
      encryptStoredField(text) ?? null,
      type,
      encryptStoredField(audioData) ?? null,
      gifUrl ?? null,
      encryptStoredField(imageData) ?? null,
      null,
      timestamp,
      0,
      0,
      variant,
      companionSticker ?? null
    ]
  );
  await db_default.execute("UPDATE scheduled_messages SET sent = 1 WHERE id = $1", [String(row.id)]);
  broadcast("new-message", {
    id,
    senderId,
    text,
    type,
    audioData,
    gifUrl,
    imageData,
    timestamp,
    liked: false,
    variant,
    companionSticker
  });
}
var lastTickTime = 0;
async function runScheduleTick() {
  const nowMs = Date.now();
  if (nowMs - lastTickTime < 1e4) return;
  lastTickTime = nowMs;
  try {
    const nowStr = new Date(nowMs).toISOString();
    const result = await db_default.execute(
      "SELECT * FROM scheduled_messages WHERE sent = 0 AND scheduled_at <= $1 ORDER BY scheduled_at ASC LIMIT 20",
      [nowStr]
    );
    for (const row of result.rows) {
      try {
        await deliverScheduledRow(row);
      } catch (err) {
        logger.error({ err, id: row.id }, "Failed to deliver scheduled message");
      }
    }
  } catch (err) {
    logger.error({ err }, "Schedule worker tick failed");
  }
}

// src/routes/presence.ts
var lastSeen = {};
var inLibraryState = {};
var router13 = Router13();
router13.post("/presence/heartbeat", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = req.user?.id;
  if (!authenticatedUserId || authenticatedUserId !== "me" && authenticatedUserId !== "wife") {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const { inLibrary } = req.body || {};
  const now = Date.now();
  lastSeen[authenticatedUserId] = now;
  inLibraryState[authenticatedUserId] = !!inLibrary;
  const partnerId = authenticatedUserId === "me" ? "wife" : "me";
  try {
    await db_default.execute("UPDATE devices SET last_seen = ? WHERE user_id = ?", [now, authenticatedUserId]);
  } catch {
  }
  broadcast("presence", { userId: authenticatedUserId, lastSeen: now, inLibrary: !!inLibrary }, partnerId);
  res.json({ userId: authenticatedUserId, lastSeen: now, inLibrary: !!inLibrary });
});
router13.get("/presence", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== "me" && authenticatedUserId !== "wife") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const lastSeenMap = { ...lastSeen };
    const typing = {};
    const now = Date.now();
    let result;
    try {
      result = await db_default.execute(
        `
        SELECT user_id, MAX(last_seen) AS last_seen, MAX(typing_until) AS typing_until
        FROM devices
        WHERE user_id = ? OR user_id = ?
        GROUP BY user_id
        `,
        [authenticatedUserId, partnerId]
      );
    } catch {
      result = await db_default.execute(
        `
        SELECT user_id, MAX(last_seen) AS last_seen
        FROM devices
        WHERE user_id = ? OR user_id = ?
        GROUP BY user_id
        `,
        [authenticatedUserId, partnerId]
      );
    }
    for (const row of result.rows) {
      const id = row.user_id ? String(row.user_id) : "";
      if (!id) continue;
      const persisted = Number(row.last_seen ?? 0);
      if (Number.isFinite(persisted) && persisted > 0) {
        lastSeenMap[id] = Math.max(lastSeenMap[id] ?? 0, persisted);
      }
      const typingUntil = Number(row.typing_until ?? 0);
      typing[id] = Number.isFinite(typingUntil) && typingUntil > now;
    }
    res.json({ lastSeen: lastSeenMap, typing, inLibrary: inLibraryState });
    void runScheduleTick().catch(() => {
    });
  } catch (err) {
    console.error("Failed to fetch presence:", err);
    res.status(500).json({ error: "Failed to fetch presence" });
  }
});
var presence_default = router13;

// src/routes/images.ts
import { Router as Router14 } from "express";
import { randomUUID as randomUUID11 } from "crypto";
function getParam2(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router14 = Router14();
function allowedMediaHostname(hostname) {
  const host = hostname.toLowerCase();
  if (host === "res.cloudinary.com" || host.endsWith(".cloudinary.com")) return true;
  if (host.includes("backblazeb2.com")) return true;
  try {
    const b2 = process.env.B2_ENDPOINT ? new URL(process.env.B2_ENDPOINT).hostname : "";
    if (b2 && (host === b2 || host.endsWith(b2))) return true;
  } catch {
  }
  if (process.env.B2_PUBLIC_URL) {
    try {
      const pubHost = new URL(process.env.B2_PUBLIC_URL).hostname;
      if (pubHost && (host === pubHost || host.endsWith("." + pubHost))) return true;
    } catch {
    }
  }
  return false;
}
router14.get("/media/inline", rateLimiters.read, authenticateBearerOrQuery, async (req, res) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  const fileNameRaw = typeof req.query.name === "string" ? req.query.name : "file";
  const mimeHint = typeof req.query.type === "string" ? req.query.type : void 0;
  const asDownload = req.query.download === "1";
  if (!rawUrl) {
    res.status(400).json({ error: "url required" });
    return;
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    res.status(400).json({ error: "Invalid url scheme" });
    return;
  }
  if (!allowedMediaHostname(parsed.hostname)) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }
  try {
    const upstream = await fetch(rawUrl);
    if (!upstream.ok) {
      res.status(502).json({ error: "Failed to fetch file" });
      return;
    }
    const safeName = ensureFileNameWithExtension(
      fileNameRaw.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "file",
      mimeHint
    );
    const contentType = resolveContentType(
      safeName,
      mimeHint,
      upstream.headers.get("content-type")
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${asDownload ? "attachment" : "inline"}; filename="${safeName}"`
    );
    res.setHeader("Cache-Control", "private, max-age=3600");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Media inline proxy error:", error);
    res.status(500).json({ error: "Failed to open file" });
  }
});
async function handleMediaUpload(req, res) {
  try {
    if (!req.body?.data) {
      res.status(400).json({ error: "No media data provided" });
      return;
    }
    const { data, contentType, fileName } = req.body;
    const mime = contentType || "image/jpeg";
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > 200 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 200MB)" });
      return;
    }
    let ext = extForContentType(mime);
    if (ext === "bin" && fileName) {
      const nameExt = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
      if (nameExt && nameExt !== fileName.toLowerCase()) {
        ext = nameExt;
      }
    }
    const key = `${randomUUID11()}.${ext}`;
    const url = await uploadMedia(key, buffer, mime);
    res.json({ url, key });
  } catch (error) {
    console.error("Media upload error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload media";
    res.status(500).json({ error: msg });
  }
}
router14.post("/images/upload", rateLimiters.upload, authenticate, async (req, res) => {
  if (req.body?.image && !req.body?.data) {
    req.body.data = req.body.image;
  }
  await handleMediaUpload(req, res);
});
router14.get("/media/sign", authenticate, async (req, res) => {
  try {
    const creds = requireCloudinaryCredentials();
    const timestamp = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
    const resourceType = typeof req.query.resourceType === "string" && req.query.resourceType === "raw" ? "raw" : "auto";
    const paramsToSign = { timestamp };
    const { v2: cloudinary2 } = await import("cloudinary");
    cloudinary2.config({
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
      secure: true
    });
    const signature = cloudinary2.utils.api_sign_request(paramsToSign, creds.apiSecret);
    res.json({
      timestamp,
      signature,
      apiKey: creds.apiKey,
      cloudName: creds.cloudName,
      resourceType
    });
  } catch (err) {
    console.error("Error generating signature:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate upload signature";
    res.status(err instanceof Error && err.message.includes("not configured") ? 501 : 500).json({ error: msg });
  }
});
router14.get("/media/b2-sign", authenticate, async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const region = process.env.AWS_REGION || "us-east-005";
    const endpoint = process.env.B2_ENDPOINT;
    const bucket = process.env.B2_BUCKET_NAME;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      res.status(501).json({ error: "Backblaze B2 is not configured in Environment Variables." });
      return;
    }
    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey }
    });
    const fileId = randomUUID11();
    const key = `pdfs/${fileId}.pdf`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "application/pdf"
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const fileUrl = `${endpoint}/${bucket}/${key}`;
    res.json({ uploadUrl, fileUrl, key });
  } catch (err) {
    console.error("Error generating B2 presigned URL:", err);
    res.status(500).json({ error: "Failed to generate B2 upload URL" });
  }
});
router14.get("/media/b2-sign-story", authenticate, async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const region = process.env.AWS_REGION || "us-east-005";
    const endpoint = process.env.B2_ENDPOINT;
    const bucket = process.env.B2_BUCKET_NAME;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      res.status(501).json({ error: "Backblaze B2 is not configured in Environment Variables." });
      return;
    }
    const s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey }
    });
    const fileId = randomUUID11();
    const isVideo = req.query.type === "video";
    const key = `stories/${fileId}.${isVideo ? "mp4" : "jpg"}`;
    const contentType = isVideo ? "video/mp4" : "image/jpeg";
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    let fileUrl;
    if (process.env.B2_PUBLIC_URL) {
      fileUrl = `${process.env.B2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    } else {
      const endpointHost = new URL(endpoint).hostname;
      const clusterMatch = endpointHost.match(/us-east-(\d+)/);
      const clusterNum = clusterMatch ? clusterMatch[1].padStart(3, "0") : "005";
      fileUrl = `https://f${clusterNum}.backblazeb2.com/file/${bucket}/${key}`;
    }
    res.json({ uploadUrl, fileUrl, key });
  } catch (err) {
    console.error("Error generating B2 story presigned URL:", err);
    res.status(500).json({ error: "Failed to generate B2 story upload URL" });
  }
});
router14.post("/media/upload", rateLimiters.upload, authenticate, async (req, res) => {
  await handleMediaUpload(req, res);
});
async function handleBinaryMediaUpload(req, res) {
  try {
    const raw = req.body;
    if (!raw || typeof raw !== "object" && typeof raw !== "string") {
      res.status(400).json({ error: "No media data provided" });
      return;
    }
    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    if (buffer.length === 0) {
      res.status(400).json({ error: "Empty upload" });
      return;
    }
    if (buffer.length > 200 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 200MB)" });
      return;
    }
    const headerMime = String(req.headers["content-type"] || "application/octet-stream").split(";")[0].trim();
    const mime = sniffBufferMime(buffer, headerMime);
    let ext = extForContentType(mime);
    const fileNameHeader = req.headers["x-file-name"];
    if (ext === "bin" && fileNameHeader) {
      const fileName = decodeURIComponent(String(fileNameHeader));
      const nameExt = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
      if (nameExt && nameExt !== fileName.toLowerCase()) {
        ext = nameExt;
      }
    }
    const key = `${randomUUID11()}.${ext}`;
    const url = await uploadMedia(key, buffer, mime);
    res.json({ url, key });
  } catch (error) {
    console.error("Binary media upload error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload media";
    res.status(500).json({ error: msg });
  }
}
router14.delete("/images/:key", rateLimiters.upload, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const key = getParam2(req.params["key"]);
    const result = await db_default.execute(
      "SELECT sender_id FROM messages WHERE image_url LIKE $1 OR image_data LIKE $2 OR gif_url LIKE $3 LIMIT 1",
      [`%${key}%`, `%${key}%`, `%${key}%`]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    const messageSenderId = result.rows[0].sender_id;
    if (messageSenderId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own images" });
      return;
    }
    await deleteImage(key);
    res.json({ success: true });
  } catch (error) {
    console.error("Image deletion error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});
var images_default = router14;

// src/routes/notifications.ts
import { Router as Router15 } from "express";
function getParam3(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router15 = Router15();
router15.post("/notifications/subscribe", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
      res.status(400).json({ error: "subscription and userId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only manage your own subscriptions" });
      return;
    }
    const existing = await db_default.execute(
      "SELECT * FROM push_subscriptions WHERE user_id = $1",
      [userId]
    );
    if (existing.rows.length > 0) {
      await db_default.execute(
        "UPDATE push_subscriptions SET subscription = $1 WHERE user_id = $2",
        [JSON.stringify(subscription), userId]
      );
    } else {
      await db_default.execute(
        "INSERT INTO push_subscriptions (user_id, subscription) VALUES ($1, $2)",
        [userId, JSON.stringify(subscription)]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save push subscription:", err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});
router15.get("/notifications/subscribe/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam3(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own subscriptions" });
      return;
    }
    const result = await db_default.execute(
      "SELECT subscription FROM push_subscriptions WHERE user_id = $1",
      [normalizedUserId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    const subscription = JSON.parse(String(result.rows[0].subscription));
    res.json(subscription);
  } catch (err) {
    console.error("Failed to get push subscription:", err);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});
router15.delete("/notifications/subscribe/:userId", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam3(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own subscriptions" });
      return;
    }
    await db_default.execute(
      "DELETE FROM push_subscriptions WHERE user_id = $1",
      [normalizedUserId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete push subscription:", err);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});
router15.post("/keys/public", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, publicKey } = req.body;
    if (!userId || !publicKey) {
      res.status(400).json({ error: "userId and publicKey required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only set your own public key" });
      return;
    }
    await db_default.execute(
      "INSERT INTO public_keys (user_id, public_key) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET public_key = excluded.public_key",
      [userId, publicKey]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save public key:", err);
    res.status(500).json({ error: "Failed to save public key" });
  }
});
router15.get("/keys/public/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam3(userId);
    const result = await db_default.execute(
      "SELECT public_key FROM public_keys WHERE user_id = ?",
      [normalizedUserId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Public key not found" });
      return;
    }
    res.json({ publicKey: result.rows[0].public_key });
  } catch (err) {
    console.error("Failed to get public key:", err);
    res.status(500).json({ error: "Failed to get public key" });
  }
});
var notifications_default = router15;

// src/routes/twoFactor.ts
import { Router as Router16 } from "express";
import speakeasy from "speakeasy";
function getParam4(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router16 = Router16();
router16.post("/2fa/setup", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const authenticatedUserId = req.user.id;
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only setup 2FA for yourself" });
      return;
    }
    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }
    const secret = speakeasy.generateSecret({
      name: `Grova (${userId})`,
      issuer: "Grova"
    });
    await db_default.execute(
      "INSERT INTO two_factor_auth (user_id, secret, enabled) VALUES ($1, $2, 0) ON CONFLICT (user_id) DO UPDATE SET secret = $2",
      [userId, secret.base32]
    );
    res.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url
    });
  } catch (err) {
    console.error("Failed to setup 2FA:", err);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});
router16.post("/2fa/enable", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId, token } = req.body;
    const authenticatedUserId = req.user.id;
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only enable 2FA for yourself" });
      return;
    }
    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }
    const result = await db_default.execute(
      "SELECT secret FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }
    const secret = String(result.rows[0].secret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token
    });
    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    await db_default.execute(
      "UPDATE two_factor_auth SET enabled = 1 WHERE user_id = $1",
      [userId]
    );
    const backupCodes = Array.from(
      { length: 10 },
      () => speakeasy.generateSecret({ length: 20 }).base32.substring(0, 8)
    );
    await db_default.execute(
      "UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2",
      [JSON.stringify(backupCodes), userId]
    );
    res.json({ success: true, backupCodes });
  } catch (err) {
    console.error("Failed to enable 2FA:", err);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});
router16.post("/2fa/verify", async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }
    const result = await db_default.execute(
      "SELECT secret, enabled, backup_codes FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }
    const row = result.rows[0];
    const secret = String(row.secret);
    const enabled = row.enabled === 1;
    const backupCodes = row.backup_codes ? JSON.parse(String(row.backup_codes)) : [];
    if (!enabled) {
      res.status(400).json({ error: "2FA not enabled for this user" });
      return;
    }
    if (backupCodes.includes(token)) {
      const remainingCodes = backupCodes.filter((code) => code !== token);
      await db_default.execute(
        "UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2",
        [JSON.stringify(remainingCodes), userId]
      );
      res.json({ success: true, backupCodeUsed: true });
      return;
    }
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2
      // Allow 2 time steps (1 minute) for clock drift
    });
    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to verify 2FA:", err);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
});
router16.post("/2fa/disable", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId, token } = req.body;
    const authenticatedUserId = req.user.id;
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only disable 2FA for yourself" });
      return;
    }
    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }
    const result = await db_default.execute(
      "SELECT secret FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }
    const secret = String(result.rows[0].secret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token
    });
    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    await db_default.execute(
      "UPDATE two_factor_auth SET enabled = 0 WHERE user_id = $1",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to disable 2FA:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});
router16.get("/2fa/status/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam4(userId);
    const authenticatedUserId = req.user.id;
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only check your own 2FA status" });
      return;
    }
    const result = await db_default.execute(
      "SELECT enabled FROM two_factor_auth WHERE user_id = $1",
      [normalizedUserId]
    );
    if (result.rows.length === 0) {
      res.json({ enabled: false });
      return;
    }
    res.json({ enabled: result.rows[0].enabled === 1 });
  } catch (err) {
    console.error("Failed to get 2FA status:", err);
    res.status(500).json({ error: "Failed to get 2FA status" });
  }
});
var twoFactor_default = router16;

// src/routes/reactions.ts
import { Router as Router17 } from "express";
import { randomUUID as randomUUID12 } from "crypto";
function getParam5(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router17 = Router17();
router17.post("/reactions", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, userId, emoji } = req.body;
    if (!messageId || !userId || !emoji) {
      res.status(400).json({ error: "messageId, userId, and emoji required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only react as yourself" });
      return;
    }
    const existing = await db_default.execute(
      "SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );
    if (existing.rows.length > 0) {
      await db_default.execute(
        "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
        [messageId, userId, emoji]
      );
    } else {
      await db_default.execute(
        "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2",
        [messageId, userId]
      );
      const id = randomUUID12();
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        "INSERT INTO message_reactions (id, message_id, user_id, emoji, timestamp) VALUES ($1, $2, $3, $4, $5)",
        [id, messageId, userId, emoji, timestamp]
      );
      const msgRow = await db_default.execute("SELECT sender_id FROM messages WHERE id = $1", [messageId]);
      const messageSenderId = msgRow.rows[0]?.sender_id;
      if (messageSenderId && messageSenderId !== userId) {
        const fromName = await profileDisplayName(userId);
        await postCoupleActivity("reaction", userId, fromName, `reacted with ${emoji}`, `/chat?highlight=${messageId}`).catch(() => {
        });
      }
    }
    const reactionsResult = await db_default.execute(
      "SELECT emoji, user_id FROM message_reactions WHERE message_id = $1",
      [messageId]
    );
    const reactions = reactionsResult.rows.map((row) => ({
      emoji: row.emoji,
      userId: row.user_id
    }));
    broadcast("message-reaction", { messageId, reactions, byUserId: userId });
    res.json({ success: true, reactions });
  } catch (err) {
    console.error("Failed to add reaction:", err);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});
router17.get("/reactions/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam5(messageId);
    const result = await db_default.execute(
      "SELECT emoji, user_id FROM message_reactions WHERE message_id = $1",
      [normalizedMessageId]
    );
    const reactions = result.rows.map((row) => ({
      emoji: row.emoji,
      userId: row.user_id
    }));
    res.json(reactions);
  } catch (err) {
    console.error("Failed to get reactions:", err);
    res.status(500).json({ error: "Failed to get reactions" });
  }
});
router17.delete("/reactions", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, userId, emoji } = req.body;
    if (!messageId || !userId || !emoji) {
      res.status(400).json({ error: "messageId, userId, and emoji required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own reactions" });
      return;
    }
    await db_default.execute(
      "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete reaction:", err);
    res.status(500).json({ error: "Failed to delete reaction" });
  }
});
var reactions_default = router17;

// src/routes/typing.ts
import { Router as Router18 } from "express";
var router18 = Router18();
router18.post("/typing", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const { userId, partnerId, typing, doodling } = req.body;
    const authenticatedUserId = req.user?.id;
    if (!userId || !partnerId || typeof typing !== "boolean") {
      res.status(400).json({ error: "userId, partnerId, and typing required" });
      return;
    }
    if (authenticatedUserId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const until = typing ? Date.now() + 8e3 : 0;
    try {
      await db_default.execute("UPDATE devices SET typing_until = ? WHERE user_id = ?", [until, userId]);
    } catch {
    }
    broadcast("typing-indicator", { userId, typing, doodling: Boolean(doodling) }, partnerId);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send typing indicator:", err);
    res.status(500).json({ error: "Failed to send typing indicator" });
  }
});
var typing_default = router18;

// src/routes/readReceipts.ts
import { Router as Router19 } from "express";
import { randomUUID as randomUUID13 } from "crypto";
function getParam6(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router19 = Router19();
router19.post("/read-receipts", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, userId } = req.body;
    if (!messageId || !userId) {
      res.status(400).json({ error: "messageId and userId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only mark messages as read for yourself" });
      return;
    }
    const existing = await db_default.execute(
      "SELECT * FROM message_read_receipts WHERE message_id = $1 AND user_id = $2",
      [messageId, userId]
    );
    if (existing.rows.length === 0) {
      const id = randomUUID13();
      const readAt = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        "INSERT INTO message_read_receipts (id, message_id, user_id, read_at) VALUES ($1, $2, $3, $4)",
        [id, messageId, userId, readAt]
      );
      const senderResult = await db_default.execute(
        "SELECT sender_id FROM messages WHERE id = $1",
        [messageId]
      );
      const senderId = senderResult.rows[0]?.sender_id;
      broadcast("message-read", { messageId, userId, readAt }, senderId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to mark message as read:", err);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});
router19.post("/read-receipts/batch", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageIds, userId } = req.body;
    if (!userId || userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only mark messages as read for yourself" });
      return;
    }
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({ error: "messageIds array required" });
      return;
    }
    const readAt = (/* @__PURE__ */ new Date()).toISOString();
    const marked = [];
    for (const messageId of messageIds.slice(0, 100)) {
      const existing = await db_default.execute(
        "SELECT * FROM message_read_receipts WHERE message_id = $1 AND user_id = $2",
        [messageId, userId]
      );
      if (existing.rows.length === 0) {
        const id = randomUUID13();
        await db_default.execute(
          "INSERT INTO message_read_receipts (id, message_id, user_id, read_at) VALUES ($1, $2, $3, $4)",
          [id, messageId, userId, readAt]
        );
        const senderResult = await db_default.execute(
          "SELECT sender_id FROM messages WHERE id = $1",
          [messageId]
        );
        const senderId = senderResult.rows[0]?.sender_id;
        marked.push({ messageId, senderId });
      }
    }
    for (const { messageId, senderId } of marked) {
      broadcast("message-read", { messageId, userId, readAt }, senderId);
    }
    res.json({ success: true, marked: marked.length, readAt });
  } catch (err) {
    console.error("Failed to batch mark messages as read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});
router19.get("/read-receipts/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam6(messageId);
    const result = await db_default.execute(
      "SELECT user_id, read_at FROM message_read_receipts WHERE message_id = $1",
      [normalizedMessageId]
    );
    const receipts = result.rows.map((row) => ({
      userId: row.user_id,
      readAt: row.read_at
    }));
    res.json(receipts);
  } catch (err) {
    console.error("Failed to get read receipts:", err);
    res.status(500).json({ error: "Failed to get read receipts" });
  }
});
var readReceipts_default = router19;

// src/routes/forward.ts
import { Router as Router20 } from "express";
import { randomUUID as randomUUID14 } from "crypto";
function getParam7(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router20 = Router20();
router20.post("/forward", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, fromUserId, toUserId } = req.body;
    if (!messageId || !fromUserId || !toUserId) {
      res.status(400).json({ error: "messageId, fromUserId, and toUserId required" });
      return;
    }
    if (fromUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only forward messages as yourself" });
      return;
    }
    const originalMsg = await db_default.execute(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    if (originalMsg.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const msg = originalMsg.rows[0];
    const newId = randomUUID14();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, timestamp, liked, deleted, variant, companion_sticker)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newId,
        fromUserId,
        msg.text,
        msg.type,
        msg.audio_data,
        msg.gif_url,
        msg.image_data,
        timestamp,
        0,
        0,
        msg.variant,
        msg.companion_sticker
      ]
    );
    const forwardId = randomUUID14();
    await db_default.execute(
      "INSERT INTO forwarded_messages (id, original_message_id, from_user_id, to_user_id, forwarded_at) VALUES ($1, $2, $3, $4, $5)",
      [forwardId, messageId, fromUserId, toUserId, timestamp]
    );
    res.json({ success: true, messageId: newId });
  } catch (err) {
    console.error("Failed to forward message:", err);
    res.status(500).json({ error: "Failed to forward message" });
  }
});
router20.get("/forward/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam7(messageId);
    const result = await db_default.execute(
      "SELECT * FROM forwarded_messages WHERE original_message_id = $1",
      [normalizedMessageId]
    );
    const forwards = result.rows.map((row) => ({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      forwardedAt: row.forwarded_at
    }));
    res.json(forwards);
  } catch (err) {
    console.error("Failed to get forwarded messages:", err);
    res.status(500).json({ error: "Failed to get forwarded messages" });
  }
});
var forward_default = router20;

// src/routes/edit.ts
import { Router as Router21 } from "express";
import { randomUUID as randomUUID15 } from "crypto";
function getParam8(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router21 = Router21();
router21.patch("/messages/:id/edit", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { id } = req.params;
    const messageId = getParam8(id);
    const { text, userId } = req.body;
    if (!text || !userId) {
      res.status(400).json({ error: "text and userId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only edit your own messages" });
      return;
    }
    const currentMsg = await db_default.execute(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    if (currentMsg.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const msg = currentMsg.rows[0];
    if (msg.sender_id !== userId) {
      res.status(403).json({ error: "You can only edit your own messages" });
      return;
    }
    const ageMs = Date.now() - new Date(String(msg.timestamp)).getTime();
    if (ageMs > 60 * 60 * 1e3) {
      res.status(400).json({ error: "Messages can only be edited within 1 hour" });
      return;
    }
    const editId = randomUUID15();
    const editedAt = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      "INSERT INTO message_edits (id, message_id, old_text, new_text, edited_at) VALUES ($1, $2, $3, $4, $5)",
      [editId, messageId, msg.text, text, editedAt]
    );
    await db_default.execute("UPDATE messages SET text = $1 WHERE id = $2", [
      encryptStoredField(text),
      messageId
    ]);
    broadcast("message-edited", { messageId, newText: text, editedAt });
    res.json({ success: true, text, editedAt });
  } catch (err) {
    console.error("Failed to edit message:", err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});
router21.get("/messages/:id/edits", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const messageId = getParam8(id);
    const result = await db_default.execute(
      "SELECT * FROM message_edits WHERE message_id = $1 ORDER BY edited_at ASC",
      [messageId]
    );
    const edits = result.rows.map((row) => ({
      id: row.id,
      oldText: row.old_text,
      newText: row.new_text,
      editedAt: row.edited_at
    }));
    res.json(edits);
  } catch (err) {
    console.error("Failed to get edit history:", err);
    res.status(500).json({ error: "Failed to get edit history" });
  }
});
var edit_default = router21;

// src/routes/pin.ts
import { Router as Router22 } from "express";
function getParam9(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router22 = Router22();
router22.post("/pin", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, messageId } = req.body;
    if (!userId || !messageId) {
      res.status(400).json({ error: "userId and messageId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only pin messages for yourself" });
      return;
    }
    const pinnedAt = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      "INSERT INTO pinned_messages (user_id, message_id, pinned_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, message_id) DO UPDATE SET pinned_at = $3",
      [userId, messageId, pinnedAt]
    );
    res.json({ success: true, pinnedAt });
  } catch (err) {
    console.error("Failed to pin message:", err);
    res.status(500).json({ error: "Failed to pin message" });
  }
});
router22.delete("/pin", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, messageId } = req.body;
    if (!userId || !messageId) {
      res.status(400).json({ error: "userId and messageId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only unpin messages for yourself" });
      return;
    }
    await db_default.execute(
      "DELETE FROM pinned_messages WHERE user_id = $1 AND message_id = $2",
      [userId, messageId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to unpin message:", err);
    res.status(500).json({ error: "Failed to unpin message" });
  }
});
router22.get("/pin/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam9(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own pinned messages" });
      return;
    }
    const result = await db_default.execute(
      `SELECT m.* FROM messages m
       INNER JOIN pinned_messages p ON m.id = p.message_id
       WHERE p.user_id = $1
       ORDER BY p.pinned_at DESC`,
      [normalizedUserId]
    );
    const pinnedMessages = result.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      timestamp: row.timestamp,
      liked: row.liked === 1,
      deleted: row.deleted === 1,
      deletedAt: row.deleted_at,
      variant: row.variant,
      companionSticker: row.companion_sticker
    }));
    res.json(pinnedMessages);
  } catch (err) {
    console.error("Failed to get pinned messages:", err);
    res.status(500).json({ error: "Failed to get pinned messages" });
  }
});
router22.get("/pin/:userId/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, messageId } = req.params;
    const normalizedUserId = getParam9(userId);
    const normalizedMessageId = getParam9(messageId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only check your own pin status" });
      return;
    }
    const result = await db_default.execute(
      "SELECT pinned_at FROM pinned_messages WHERE user_id = $1 AND message_id = $2",
      [normalizedUserId, normalizedMessageId]
    );
    if (result.rows.length === 0) {
      res.json({ pinned: false });
      return;
    }
    res.json({ pinned: true, pinnedAt: result.rows[0].pinned_at });
  } catch (err) {
    console.error("Failed to check pin status:", err);
    res.status(500).json({ error: "Failed to check pin status" });
  }
});
var pin_default = router22;

// src/routes/schedule.ts
import { Router as Router23 } from "express";
import { randomUUID as randomUUID16 } from "crypto";
function getParam10(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router23 = Router23();
router23.post("/schedule", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { senderId, text, type, audioData, gifUrl, imageData, variant, companionSticker, scheduledAt } = req.body;
    if (!senderId || !type || !scheduledAt) {
      res.status(400).json({ error: "senderId, type, and scheduledAt required" });
      return;
    }
    if (senderId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only schedule messages for yourself" });
      return;
    }
    const id = randomUUID16();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      `INSERT INTO scheduled_messages (id, sender_id, text, type, audio_data, gif_url, image_data, variant, companion_sticker, scheduled_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, senderId, encryptStoredField(text), type, encryptStoredField(audioData), gifUrl || null, encryptStoredField(imageData), variant || null, companionSticker || null, scheduledAt, createdAt]
    );
    res.json({ success: true, id, scheduledAt });
  } catch (err) {
    console.error("Failed to schedule message:", err);
    res.status(500).json({ error: "Failed to schedule message" });
  }
});
router23.get("/schedule/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam10(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own scheduled messages" });
      return;
    }
    const result = await db_default.execute(
      "SELECT * FROM scheduled_messages WHERE sender_id = $1 AND sent = 0 ORDER BY scheduled_at ASC",
      [normalizedUserId]
    );
    const scheduledMessages = result.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      variant: row.variant,
      companionSticker: row.companion_sticker,
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at
    }));
    res.json(scheduledMessages);
  } catch (err) {
    console.error("Failed to get scheduled messages:", err);
    res.status(500).json({ error: "Failed to get scheduled messages" });
  }
});
router23.delete("/schedule/:id", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const normalizedId = getParam10(req.params.id);
    const existing = await db_default.execute(
      "SELECT sender_id FROM scheduled_messages WHERE id = $1",
      [normalizedId]
    );
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db_default.execute("DELETE FROM scheduled_messages WHERE id = $1", [normalizedId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete scheduled message:", err);
    res.status(500).json({ error: "Failed to delete scheduled message" });
  }
});
var schedule_default = router23;

// src/routes/media.ts
import { Router as Router24 } from "express";
import { randomUUID as randomUUID17 } from "crypto";
var STORY_TTL_MS = 24 * 60 * 60 * 1e3;
var MAX_POSTS_PER_USER = 20;
var router24 = Router24();
function parsePostMedia(row) {
  const mediaUrl = String(row.media_url ?? "");
  const raw = row.media_urls;
  if (raw && typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const urls = parsed.filter((u) => typeof u === "string" && u.length > 0);
        if (urls.length > 0) {
          return { mediaUrl: urls[0], mediaUrls: urls };
        }
      }
    } catch {
    }
  }
  return { mediaUrl, mediaUrls: mediaUrl ? [mediaUrl] : [] };
}
function rowToPostPayload(row, extras) {
  const { mediaUrl, mediaUrls } = parsePostMedia(row);
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    mediaUrl,
    mediaUrls,
    caption: String(row.caption ?? ""),
    location: String(row.location ?? ""),
    aspectRatio: String(row.aspect_ratio ?? "4:5"),
    createdAt: String(row.created_at),
    ...extras
  };
}
async function enrichSinglePost(postId, userId) {
  const result = await db_default.execute("SELECT * FROM posts WHERE id = $1", [postId]);
  const row = result.rows[0];
  if (!row) return null;
  const [likes, comments, reactionsResult] = await Promise.all([
    db_default.execute("SELECT user_id FROM post_likes WHERE post_id = $1", [postId]),
    db_default.execute("SELECT COUNT(*)::int AS cnt FROM post_comments WHERE post_id = $1", [postId]),
    db_default.execute("SELECT emoji, user_id FROM post_reactions WHERE post_id = $1", [postId])
  ]);
  const likeRows = likes.rows;
  const commentCount = Number(comments.rows[0]?.cnt ?? 0);
  const reactionRows = reactionsResult.rows;
  const reactionCounts = {};
  for (const r of reactionRows) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }
  const myReaction = reactionRows.find((r) => r.user_id === userId)?.emoji;
  return rowToPostPayload(row, {
    likeCount: likeRows.length,
    likedByMe: likeRows.some((l) => l.user_id === userId),
    commentCount,
    myReaction,
    reactionCounts
  });
}
async function enrichPosts(userId) {
  const result = await db_default.execute(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT 50",
    []
  );
  const posts = result.rows;
  const enriched = await Promise.all(
    posts.map(async (row) => {
      const id = String(row.id);
      const likes = await db_default.execute(
        "SELECT user_id FROM post_likes WHERE post_id = $1",
        [id]
      );
      const comments = await db_default.execute(
        "SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = $1",
        [id]
      );
      const likeRows = likes.rows;
      const commentCount = Number(comments.rows[0]?.cnt ?? 0);
      const reactionsResult = await db_default.execute(
        "SELECT emoji, user_id FROM post_reactions WHERE post_id = $1",
        [id]
      );
      const reactionRows = reactionsResult.rows;
      const reactionCounts = {};
      for (const r of reactionRows) {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
      }
      const myReaction = reactionRows.find((r) => r.user_id === userId)?.emoji;
      return rowToPostPayload(row, {
        likeCount: likeRows.length,
        likedByMe: likeRows.some((l) => l.user_id === userId),
        commentCount,
        myReaction,
        reactionCounts
      });
    })
  );
  return enriched;
}
router24.get("/posts", rateLimiters.read, authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    res.json(await enrichPosts(userId));
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});
router24.get("/posts/:id", rateLimiters.read, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  try {
    const result = await db_default.execute("SELECT * FROM posts WHERE id = $1", [postId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const row = result.rows[0];
    const id = String(row.id);
    const likes = await db_default.execute("SELECT user_id FROM post_likes WHERE post_id = $1", [id]);
    const comments = await db_default.execute("SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = $1", [id]);
    const likeRows = likes.rows;
    const commentCount = Number(comments.rows[0]?.cnt ?? 0);
    const reactionsResult = await db_default.execute("SELECT emoji, user_id FROM post_reactions WHERE post_id = $1", [id]);
    const reactionRows = reactionsResult.rows;
    const reactionCounts = {};
    for (const r of reactionRows) {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
    }
    const myReaction = reactionRows.find((r) => r.user_id === userId)?.emoji;
    const post = rowToPostPayload(row, {
      likeCount: likeRows.length,
      likedByMe: likeRows.some((l) => l.user_id === userId),
      commentCount,
      myReaction,
      reactionCounts
    });
    res.json(post);
  } catch (err) {
    console.error("Failed to fetch post:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});
router24.post("/posts", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { mediaUrl, mediaUrls, caption, location, aspectRatio } = req.body;
  const urls = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls.filter((u) => typeof u === "string" && u.length > 0) : mediaUrl ? [mediaUrl] : [];
  if (urls.length === 0) {
    res.status(400).json({ error: "mediaUrl or mediaUrls required" });
    return;
  }
  const rowsResult = await db_default.execute(
    "SELECT media_url, media_urls FROM posts WHERE author_id = $1",
    [userId]
  );
  let imageCount = 0;
  for (const row of rowsResult.rows) {
    imageCount += parsePostMedia(row).mediaUrls.length;
  }
  if (imageCount + urls.length > MAX_POSTS_PER_USER) {
    const remaining = Math.max(0, MAX_POSTS_PER_USER - imageCount);
    res.status(400).json({
      error: remaining === 0 ? `Maximum ${MAX_POSTS_PER_USER} photos allowed. Delete some from your grid to add more.` : `You can only add ${remaining} more photo(s).`
    });
    return;
  }
  const id = randomUUID17();
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const primaryUrl = urls[0];
  const mediaUrlsJson = urls.length > 1 ? JSON.stringify(urls) : null;
  try {
    try {
      await db_default.execute(
        "INSERT INTO posts (id, author_id, media_url, media_urls, caption, location, aspect_ratio, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, userId, primaryUrl, mediaUrlsJson, caption ?? "", location ?? "", aspectRatio ?? "4:5", createdAt]
      );
    } catch {
      await db_default.execute(
        "INSERT INTO posts (id, author_id, media_url, caption, location, aspect_ratio, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, userId, primaryUrl, caption ?? "", location ?? "", aspectRatio ?? "4:5", createdAt]
      );
    }
    const post = {
      id,
      authorId: userId,
      mediaUrl: primaryUrl,
      mediaUrls: urls,
      caption: caption ?? "",
      location: location ?? "",
      aspectRatio: aspectRatio ?? "4:5",
      createdAt,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0
    };
    broadcast("post-added", post);
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity("story", userId, fromName, "shared a new post", `/?post=${id}`).catch(() => {
    });
    res.json(post);
  } catch (err) {
    console.error("Failed to create post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});
router24.post("/posts/:id/react", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  const { emoji } = req.body;
  if (!emoji?.trim()) {
    res.status(400).json({ error: "emoji required" });
    return;
  }
  try {
    const existing = await db_default.execute(
      "SELECT emoji FROM post_reactions WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );
    const row = existing.rows[0];
    if (row?.emoji === emoji) {
      await db_default.execute("DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    } else {
      await db_default.execute(
        `INSERT INTO post_reactions (post_id, user_id, emoji, created_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (post_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = EXCLUDED.created_at`,
        [postId, userId, emoji, (/* @__PURE__ */ new Date()).toISOString()]
      );
    }
    const post = await enrichSinglePost(postId, userId);
    if (post) broadcast("post-reacted", post);
    res.json(post ?? { success: true });
  } catch {
    res.status(500).json({ error: "Failed to react" });
  }
});
router24.post("/posts/:id/like", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  try {
    const existing = await db_default.execute(
      "SELECT user_id FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );
    if (existing.rows.length > 0) {
      await db_default.execute("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    } else {
      await db_default.execute(
        "INSERT INTO post_likes (post_id, user_id, created_at) VALUES ($1, $2, $3)",
        [postId, userId, (/* @__PURE__ */ new Date()).toISOString()]
      );
      const authorRow = await db_default.execute("SELECT author_id FROM posts WHERE id = $1", [postId]);
      const authorId = authorRow.rows[0]?.author_id ? String(authorRow.rows[0].author_id) : null;
      if (authorId && authorId !== userId) {
        const fromName = await profileDisplayName(userId);
        await postCoupleActivity("like", userId, fromName, "liked your post", `/?post=${postId}`).catch(() => {
        });
      }
    }
    const post = await enrichSinglePost(postId, userId);
    if (post) broadcast("post-liked", post);
    res.json(post ?? { success: true });
  } catch {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});
router24.get("/posts/:id/comments", rateLimiters.read, authenticate, async (req, res) => {
  const postId = String(req.params.id);
  try {
    const result = await db_default.execute(
      "SELECT * FROM post_comments WHERE post_id = $1 ORDER BY created_at ASC",
      [postId]
    );
    res.json(
      result.rows.map((row) => ({
        id: String(row.id),
        postId: String(row.post_id),
        authorId: String(row.author_id),
        text: String(row.text),
        createdAt: String(row.created_at)
      }))
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});
router24.post("/posts/:id/comments", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  const { text } = req.body;
  if (!text?.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const id = randomUUID17();
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO post_comments (id, post_id, author_id, text, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, postId, userId, text.trim(), createdAt]
    );
    const comment = { id, postId, authorId: userId, text: text.trim(), createdAt };
    broadcast("post-commented", comment);
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity("comment", userId, fromName, `commented: ${text.trim().slice(0, 80)}`, `/?post=${postId}&comment=${id}`).catch(() => {
    });
    res.json(comment);
  } catch {
    res.status(500).json({ error: "Failed to add comment" });
  }
});
router24.delete("/posts/:postId/comments/:commentId", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.postId);
  const commentId = String(req.params.commentId);
  try {
    const existing = await db_default.execute(
      "SELECT author_id FROM post_comments WHERE id = $1 AND post_id = $2",
      [commentId, postId]
    );
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db_default.execute("DELETE FROM post_comments WHERE id = $1", [commentId]);
    broadcast("post-comment-deleted", { id: commentId, postId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});
router24.delete("/posts/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author_id FROM posts WHERE id = $1", [id]);
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db_default.execute("DELETE FROM post_likes WHERE post_id = $1", [id]);
    await db_default.execute("DELETE FROM post_comments WHERE post_id = $1", [id]);
    await db_default.execute("DELETE FROM post_reactions WHERE post_id = $1", [id]);
    await db_default.execute("DELETE FROM posts WHERE id = $1", [id]);
    broadcast("post-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});
var media_default = router24;

// src/routes/hidden-messages.ts
import { Router as Router25 } from "express";
var router25 = Router25();
router25.post("/hidden-messages/clear-chat", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const clearedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await setChatClearedForUser(authId, clearedAt);
    res.json({ success: true, clearedAt });
  } catch (err) {
    console.error("clear-chat failed:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});
router25.get("/hidden-messages/:userId", rateLimiters.read, authenticate, async (req, res) => {
  const authId = req.user.id;
  const userId = String(req.params.userId);
  if (userId !== authId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const result = await db_default.execute(
      "SELECT message_id FROM hidden_messages WHERE user_id = $1",
      [userId]
    );
    const clearedAt = await getChatClearedAtForUser(userId);
    res.json({
      messageIds: result.rows.map((r) => String(r.message_id)),
      clearedAt
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch hidden messages" });
  }
});
router25.post("/hidden-messages", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const { userId, messageId } = req.body;
  if (!userId || !messageId || userId !== authId) {
    res.status(400).json({ error: "userId and messageId required" });
    return;
  }
  try {
    await db_default.execute(
      "INSERT INTO hidden_messages (user_id, message_id, hidden_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [userId, messageId, (/* @__PURE__ */ new Date()).toISOString()]
    );
    broadcast("message-hidden", { userId, messageId }, userId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to hide message" });
  }
});
var hidden_messages_default = router25;

// src/routes/export.ts
import { Router as Router26 } from "express";
function getParam11(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router26 = Router26();
router26.get("/export/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam11(userId);
    const authenticatedUserId = req.user.id;
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only export your own data" });
      return;
    }
    const profileResult = await db_default.execute(
      "SELECT * FROM profiles WHERE id = $1",
      [normalizedUserId]
    );
    const messagesResult = await db_default.execute(
      "SELECT * FROM messages WHERE deleted = 0 AND sender_id = $1 ORDER BY timestamp ASC",
      [normalizedUserId]
    );
    const duasResult = await db_default.execute(
      "SELECT * FROM duas WHERE user_id = $1 ORDER BY timestamp DESC",
      [normalizedUserId]
    );
    const exportData = {
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      user: profileResult.rows[0] || null,
      messages: messagesResult.rows.map((row) => ({
        id: row.id,
        senderId: row.sender_id,
        text: decryptStoredField(row.text),
        type: row.type,
        audioData: decryptStoredField(row.audio_data),
        gifUrl: row.gif_url,
        imageData: decryptStoredField(row.image_data),
        timestamp: row.timestamp,
        liked: row.liked === 1,
        variant: row.variant,
        companionSticker: row.companion_sticker
      })),
      duas: duasResult.rows.map((row) => ({
        id: row.id,
        arabic: row.arabic,
        translation: row.translation,
        author: row.author,
        timestamp: row.timestamp
      }))
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="grova-export-${normalizedUserId}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error("Failed to export data:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});
router26.get("/export/:userId/messages", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam11(userId);
    const authenticatedUserId = req.user.id;
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only export your own data" });
      return;
    }
    const result = await db_default.execute(
      "SELECT * FROM messages WHERE deleted = 0 AND sender_id = $1 ORDER BY timestamp ASC",
      [normalizedUserId]
    );
    const messages = result.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      timestamp: row.timestamp,
      liked: row.liked === 1,
      variant: row.variant,
      companionSticker: row.companion_sticker
    }));
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="grova-messages-${normalizedUserId}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
    res.json(messages);
  } catch (err) {
    console.error("Failed to export messages:", err);
    res.status(500).json({ error: "Failed to export messages" });
  }
});
var export_default = router26;

// src/routes/couple-sync.ts
import { Router as Router27 } from "express";
var router27 = Router27();
function parseStoredNote(raw) {
  if (!raw) return { text: "", at: "" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === "string") {
      return { text: parsed.text, at: parsed.at || "" };
    }
  } catch {
  }
  return { text: raw, at: (/* @__PURE__ */ new Date()).toISOString() };
}
function noteIfFresh(raw) {
  const { text, at } = parseStoredNote(raw);
  if (!text) return "";
  if (!at) return text;
  const age = Date.now() - new Date(at).getTime();
  if (age > 24 * 60 * 60 * 1e3) return "";
  return text;
}
function prefsFromRows(rows) {
  const prefs = {};
  for (const row of rows) prefs[row.key] = row.value;
  let quickEmojis = [];
  let customStickerz = [];
  try {
    if (prefs.quick_emojis) {
      const parsed = JSON.parse(prefs.quick_emojis);
      if (Array.isArray(parsed)) {
        quickEmojis = parsed.filter((e) => typeof e === "string").slice(0, 5);
      }
    }
  } catch {
  }
  try {
    if (prefs.custom_stickerz) {
      const parsed = JSON.parse(prefs.custom_stickerz);
      if (Array.isArray(parsed)) {
        customStickerz = parsed;
      }
    }
  } catch {
  }
  return {
    chatTheme: prefs.chat_theme || "default",
    appTheme: prefs.app_theme || "grova",
    readReceipts: prefs.read_receipts !== "off",
    showPresence: prefs.show_presence !== "off",
    notifications: prefs.notifications !== "off",
    noteMe: noteIfFresh(prefs.note_me || ""),
    noteWife: noteIfFresh(prefs.note_wife || ""),
    quickEmojis,
    customStickerz
  };
}
async function loadPrefsPayload() {
  const result = await db_default.execute("SELECT key, value FROM couple_prefs", []);
  return prefsFromRows(result.rows);
}
router27.get("/couple/prefs", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    res.json(await loadPrefsPayload());
  } catch (err) {
    logger.error({ err }, "Failed to fetch couple prefs");
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});
router27.put("/couple/prefs", rateLimiters.messages, authenticate, async (req, res) => {
  const { chatTheme, appTheme, readReceipts, showPresence, notifications, quickEmojis, customStickerz } = req.body;
  try {
    const upsert = async (key, value) => {
      await db_default.execute(
        `INSERT INTO couple_prefs (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    };
    if (chatTheme !== void 0) await upsert("chat_theme", chatTheme);
    if (appTheme !== void 0) await upsert("app_theme", appTheme);
    if (readReceipts !== void 0) await upsert("read_receipts", readReceipts ? "on" : "off");
    if (showPresence !== void 0) await upsert("show_presence", showPresence ? "on" : "off");
    if (notifications !== void 0) await upsert("notifications", notifications ? "on" : "off");
    if (quickEmojis !== void 0) {
      await upsert("quick_emojis", JSON.stringify(quickEmojis.slice(0, 5)));
    }
    if (customStickerz !== void 0) {
      await upsert("custom_stickerz", JSON.stringify(customStickerz));
    }
    const payload = await loadPrefsPayload();
    broadcast("prefs-updated", payload);
    res.json(payload);
  } catch (err) {
    logger.error({ err }, "Failed to update couple prefs");
    res.status(500).json({ error: "Failed to update preferences" });
  }
});
router27.get("/couple/notes", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const payload = await loadPrefsPayload();
    res.json({ me: payload.noteMe, wife: payload.noteWife });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});
router27.put("/couple/notes", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { text } = req.body;
  if (text === void 0) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const key = userId === "wife" ? "note_wife" : "note_me";
  const trimmed = text.slice(0, 60);
  const payload = JSON.stringify({ text: trimmed, at: (/* @__PURE__ */ new Date()).toISOString() });
  try {
    await db_default.execute(
      `INSERT INTO couple_prefs (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, payload]
    );
    broadcast("note-updated", { userId, text: trimmed });
    const notes = await loadPrefsPayload();
    res.json({ me: notes.noteMe, wife: notes.noteWife });
  } catch (err) {
    res.status(500).json({ error: "Failed to save note" });
  }
});
router27.get("/couple/activity", rateLimiters.read, authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const [result, profilesResult] = await Promise.all([
      db_default.execute(
        `SELECT id, type, actor_id, from_name, text, timestamp, read, target_path
         FROM activity_feed
         WHERE actor_id != $1
           AND (target_path IS NULL OR target_path NOT LIKE '/chat%')
           AND type NOT IN ('doodle', 'file', 'greeting', 'reaction', 'location', 'call', 'message')
         ORDER BY timestamp DESC LIMIT 50`,
        [userId]
      ),
      db_default.execute("SELECT id, name FROM profiles WHERE id IN ('me', 'wife')", [])
    ]);
    const nameByActor = new Map(
      profilesResult.rows.map((row) => {
        const r = row;
        return [r.id, r.name];
      })
    );
    res.json({
      notifications: result.rows.map((r) => {
        const actorId = r.actor_id ? String(r.actor_id) : void 0;
        const currentName = actorId ? nameByActor.get(actorId) : void 0;
        return {
          id: r.id,
          type: r.type,
          actorId,
          fromName: currentName || r.from_name,
          text: r.text,
          timestamp: r.timestamp,
          read: r.read === 1 || r.read === true,
          targetPath: r.target_path ? String(r.target_path) : void 0
        };
      })
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch activity");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});
router27.post("/couple/activity", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { type, text, targetPath } = req.body;
  if (!type || !text) {
    res.status(400).json({ error: "type and text required" });
    return;
  }
  try {
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity(type, userId, fromName, text, targetPath);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to add activity");
    res.status(500).json({ error: "Failed to add notification" });
  }
});
router27.put("/couple/activity/read-all", rateLimiters.messages, authenticate, async (_req, res) => {
  try {
    await db_default.execute("UPDATE activity_feed SET read = 1", []);
    broadcast("activity-read-all", {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark read" });
  }
});
router27.delete("/couple/activity", rateLimiters.messages, authenticate, async (_req, res) => {
  try {
    await db_default.execute("DELETE FROM activity_feed", []);
    broadcast("activity-read-all", {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});
var couple_sync_default = router27;

// src/routes/library.ts
import { Router as Router28 } from "express";
import { randomUUID as randomUUID19 } from "crypto";

// src/lib/github-indexer.ts
import { randomUUID as randomUUID18 } from "crypto";
var githubCache = [];
var isInitialized = false;
var REPOS_TREES = [
  { repo: "canaveensetia/Books", branch: "master", label: "Tech & Productivity" },
  { repo: "rishabhmodi03/BOOKS", branch: "master", label: "General Collection" },
  { repo: "Abdalrahman-Alhamod/Books", branch: "main", label: "Arabic & Engineering" },
  { repo: "EbookFoundation/free-programming-books", branch: "main", label: "Programming PDFs" }
];
var REPOS_RELEASES = [];
async function initGithubIndexer() {
  if (isInitialized) return;
  try {
    const promises = [];
    for (const target of REPOS_TREES) {
      promises.push(
        fetch(`https://api.github.com/repos/${target.repo}/git/trees/${target.branch}?recursive=1`, {
          headers: { "User-Agent": "Grova-Library-Indexer" }
        }).then((r) => r.json()).then((data) => {
          if (!data.tree) return;
          const files = data.tree.filter((f) => f.path.toLowerCase().endsWith(".pdf"));
          files.forEach((f) => {
            const filename = f.path.split("/").pop();
            if (!filename) return;
            const title = filename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
            githubCache.push({
              id: `gh_${randomUUID18().substring(0, 8)}`,
              title: title.trim(),
              author: "GitHub Open Source",
              epubUrl: `https://cdn.jsdelivr.net/gh/${target.repo}@${target.branch}/${f.path.split("/").map(encodeURIComponent).join("/")}`,
              coverUrl: null,
              description: `A file from the ${target.label} GitHub repository (${target.repo}).`,
              source: `GitHub (${target.repo.split("/")[0]})`,
              totalPages: 250
            });
          });
        }).catch((err) => console.error(`Failed to index ${target.repo}:`, err.message))
      );
    }
    for (const target of REPOS_RELEASES) {
      promises.push(
        fetch(`https://api.github.com/repos/${target.repo}/releases`, {
          headers: { "User-Agent": "Grova-Library-Indexer" }
        }).then((r) => r.json()).then((releases) => {
          if (!Array.isArray(releases)) return;
          releases.forEach((release) => {
            (release.assets || []).forEach((asset) => {
              if (asset.name.toLowerCase().endsWith(".pdf")) {
                githubCache.push({
                  id: `gh_rel_${randomUUID18().substring(0, 8)}`,
                  title: asset.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
                  author: "Open Source Contributor",
                  epubUrl: asset.browser_download_url,
                  coverUrl: null,
                  description: `High-quality Arabic release from ${target.label} (${target.repo}).`,
                  source: `GitHub (${target.repo.split("/")[0]})`,
                  totalPages: 300
                });
              }
            });
          });
        }).catch((err) => console.error(`Failed to index release ${target.repo}:`, err.message))
      );
    }
    await Promise.allSettled(promises);
    isInitialized = true;
    console.log(`[GitHub Indexer] Successfully indexed ${githubCache.length} direct PDF files into memory.`);
  } catch (error) {
    console.error("[GitHub Indexer] Initialization failed:", error);
  }
}
async function searchGithubIndex(query, limit = 6) {
  if (!isInitialized) {
    await initGithubIndexer();
  }
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  const matches = githubCache.filter(
    (book) => book.epubUrl.toLowerCase().includes(".pdf") && (book.title.toLowerCase().includes(lowerQuery) || book.author.toLowerCase().includes(lowerQuery))
  );
  return matches.slice(0, limit);
}

// src/lib/book-catalog.ts
var BOOK_CATALOG = [
  // ── Arabic Poetry & Classical Stories (verified IA) ───────────────────────
  {
    id: "cat_hdesaddar",
    title: "\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0627\u0631",
    author: "\u0627\u0644\u0633\u064A\u062F \u0639\u0644\u064A \u0627\u0644\u062D\u0633\u064A\u0646\u064A \u0627\u0644\u0645\u064A\u0644\u0627\u0646\u064A",
    coverUrl: "https://archive.org/services/img/hdesaddar",
    description: "\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0627\u0631 \u2014 \u0643\u062A\u0627\u0628 \u0639\u0631\u0628\u064A PDF \u0645\u062C\u0627\u0646\u064A.",
    epubUrl: "https://archive.org/download/hdesaddar/hdesaddar.pdf",
    totalPages: 38,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["\u0639\u0631\u0628\u064A", "\u062D\u062F\u064A\u062B"]
  },
  {
    id: "cat_alf_layla_1",
    title: "\u0623\u0644\u0641 \u0644\u064A\u0644\u0629 \u0648\u0644\u064A\u0644\u0629 (1)",
    author: "\u062A\u0631\u0627\u062B \u0639\u0631\u0628\u064A",
    coverUrl: "https://archive.org/services/img/1_20200728_20200728",
    description: "\u0623\u0644\u0641 \u0644\u064A\u0644\u0629 \u0648\u0644\u064A\u0644\u0629 \u2014 \u0627\u0644\u062D\u0643\u0627\u064A\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0634\u0639\u0628\u064A\u0629.",
    epubUrl: "https://archive.org/download/1_20200728_20200728/%D8%A3%D9%84%D9%81%20%D9%84%D9%8A%D9%84%D8%A9%20%D9%88%D9%84%D9%8A%D9%84%D8%A9%201.pdf",
    totalPages: 400,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["\u0642\u0635\u0635", "\u062D\u0643\u0627\u064A\u0627\u062A", "\u0623\u0644\u0641 \u0644\u064A\u0644\u0629"]
  },
  {
    id: "cat_poetry_diwan",
    title: "\u062F\u064Awan \u0634\u0639\u0631 \u2014 \u0637\u0628\u0639\u0629 \u0646\u0627\u062F\u0631\u0629",
    author: "\u0634\u0627\u0639\u0631 \u0639\u0631\u0628\u064A",
    coverUrl: "https://archive.org/services/img/qnlhc_12921_en",
    description: "\u062F\u064Awan \u0634\u0639\u0631 \u0639\u0631\u0628\u064A \u2014 PDF \u0645\u062C\u0627\u0646\u064A \u0645\u0646 Internet Archive.",
    epubUrl: "https://archive.org/download/qnlhc_12921_en/qnlhc_12921_en.pdf",
    totalPages: 120,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["\u0634\u0639\u0631", "\u062F\u064Awan", "poetry"]
  },
  {
    id: "cat_hanzala",
    title: "\u0631\u0628\u0627\u0639\u064A\u0629 \u062D\u0646\u0638\u0644\u0629 \u2014 \u0634\u0639\u0631",
    author: "\u062D\u0646\u0638\u0644\u0629",
    coverUrl: "https://archive.org/services/img/AAlexandrina-115822",
    description: "\u0631\u0628\u0627\u0639\u064A\u0629 \u062D\u0646\u0638\u0644\u0629 \u2014 \u0634\u0639\u0631 \u0639\u0631\u0628\u064A \u0645\u0639\u0627\u0635\u0631.",
    epubUrl: "https://archive.org/download/AAlexandrina-115822/115822%20-%20%D8%B1%D8%A8%D8%A7%D8%B9%D9%8A%D8%A9%20%D8%AD%D9%86%D8%B8%D9%84%D8%A9%20-%20%D8%B4%D8%B9%D8%B1.pdf",
    totalPages: 40,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["\u0634\u0639\u0631", "\u062D\u0646\u0638\u0644\u0629"]
  },
  {
    id: "cat_karham",
    title: "\u0643\u0631\u062D\u0645 \u063A\u0627\u0628\u0629 \u2014 \u0634\u0639\u0631",
    author: "\u062A\u0631\u0627\u062B",
    coverUrl: "https://archive.org/services/img/AAlexandrina-100028",
    description: "\u0643\u0631\u062D\u0645 \u063A\u0627\u0628\u0629 \u2014 \u0642\u0635\u0627\u0626\u062F \u0639\u0631\u0628\u064A\u0629.",
    epubUrl: "https://archive.org/download/AAlexandrina-100028/100028%20-%20%D9%83%D8%B1%D8%AD%D9%85%20%D8%BA%D8%A7%D8%A8%D8%A9%20-%20%D8%B4%D8%B9%D8%B1.pdf",
    totalPages: 50,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["\u0634\u0639\u0631", "\u0642\u0635\u0627\u0626\u062F"]
  },
  {
    id: "cat_shahab_poetry",
    title: "\u0634\u0639\u0631 \u0627\u0644\u0634\u0647\u0627\u0628 \u0627\u0644\u0645\u062D\u0645\u0648\u062F\u064A",
    author: "\u0627\u0644\u0634\u0647\u0627\u0628 \u0627\u0644\u0645\u062D\u0645\u0648\u062F\u064A",
    coverUrl: "https://archive.org/services/img/AAlexandrina-438144",
    description: "\u0623\u0635\u062F\u0627\u0621 \u0627\u0644\u063A\u0632\u0648\u064A\u0646 \u0627\u0644\u0635\u0644\u064A\u0628\u064A \u0648\u0627\u0644\u0645\u063A\u0648\u0644\u064A \u0641\u064A \u0634\u0639\u0631 \u0627\u0644\u0634\u0647\u0627\u0628 \u0627\u0644\u0645\u062D\u0645\u0648\u062F\u064A.",
    epubUrl: "https://archive.org/download/AAlexandrina-438144/438144_%D8%A3%D8%B5%D8%AF%D8%A7%D8%A1_%D8%A7%D9%84%D8%BA%D8%B2%D9%88%D9%8A%D9%86_%D8%A7%D9%84%D8%B5%D9%84%D9%8A%D8%A8%D9%8A_%D9%88%D8%A7%D9%84%D9%85%D8%BA%D9%88%D9%84%D9%8A_%D9%81%D9%8A_%D8%B4%D8%B9%D8%B1_%D8%A7%D9%84%D8%B4%D9%87%D8%A7%D8%A8_%D9%85%D8%AD_725%D9%87.pdf",
    totalPages: 200,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["\u0634\u0639\u0631", "\u062A\u0627\u0631\u064A\u062E", "\u0623\u062F\u0628"]
  },
  // ── Darija & Moroccan ─────────────────────────────────────────────────────
  {
    id: "cat_morocco_guide",
    title: "Guide Marocain des Associations",
    author: "Collectif",
    coverUrl: "https://archive.org/services/img/guide-marocain-des-associations",
    description: "Guide marocain \u2014 culture et soci\xE9t\xE9 au Maroc.",
    epubUrl: "https://archive.org/download/guide-marocain-des-associations/guide-marocain-des-associations.pdf",
    totalPages: 120,
    source: "Moroccan Heritage",
    category: "Darija & Moroccan",
    tags: ["maroc", "maghreb", "darija"]
  },
  // ── English Classics (Gutenberg — always reliable) ──────────────────────────
  {
    id: "cat_pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    description: "Jane Austen's classic romance.",
    epubUrl: "https://www.planetebook.com/free-ebooks/pride-and-prejudice.pdf",
    totalPages: 350,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "classic"]
  },
  {
    id: "cat_moby",
    title: "Moby Dick",
    author: "Herman Melville",
    coverUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
    description: "American literary masterpiece.",
    epubUrl: "https://www.planetebook.com/free-ebooks/moby-dick.pdf",
    totalPages: 600,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english"]
  },
  {
    id: "cat_sherlock",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    coverUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
    description: "Detective stories classic collection.",
    epubUrl: "https://sherlock-holm.es/stories/pdf/a4/1-sided/advs.pdf",
    totalPages: 280,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "mystery"]
  },
  {
    id: "cat_dracula",
    title: "Dracula",
    author: "Bram Stoker",
    coverUrl: "https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg",
    description: "Gothic horror classic.",
    epubUrl: "https://www.planetebook.com/free-ebooks/dracula.pdf",
    totalPages: 400,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "horror"]
  },
  {
    id: "cat_alice",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    description: "Beloved children's classic.",
    epubUrl: "https://www.planetebook.com/free-ebooks/alices-adventures-in-wonderland.pdf",
    totalPages: 120,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "children"]
  },
  {
    id: "cat_frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    description: "Birth of science fiction.",
    epubUrl: "https://www.planetebook.com/free-ebooks/frankenstein.pdf",
    totalPages: 250,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "scifi"]
  },
  // ── Self-Help & Wealth ────────────────────────────────────────────────────
  {
    id: "cat_art_of_war",
    title: "The Art of War",
    author: "Sun Tzu",
    coverUrl: "https://www.gutenberg.org/cache/epub/132/pg132.cover.medium.jpg",
    description: "Strategy and leadership classic.",
    epubUrl: "https://sites.ualberta.ca/~enoch/Readings/The_Art_Of_War.pdf",
    totalPages: 100,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["strategy", "self-help"]
  },
  {
    id: "cat_meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    coverUrl: "https://www.gutenberg.org/cache/epub/2680/pg2680.cover.medium.jpg",
    description: "Stoic philosophy for daily life.",
    epubUrl: "https://sellula.com/pdf/meditations.pdf",
    totalPages: 180,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["stoicism", "philosophy"]
  },
  {
    id: "cat_as_man_thinketh",
    title: "As a Man Thinketh",
    author: "James Allen",
    coverUrl: "https://www.gutenberg.org/cache/epub/4507/pg4507.cover.medium.jpg",
    description: "Your thoughts shape your life.",
    epubUrl: "https://wahiduddin.net/thinketh/as_a_man_thinketh.pdf",
    totalPages: 60,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["self-help", "mindset"]
  },
  {
    id: "cat_science_getting_rich",
    title: "The Science of Getting Rich",
    author: "Wallace D. Wattles",
    coverUrl: "https://www.gutenberg.org/cache/epub/59852/pg59852.cover.medium.jpg",
    description: "Wealth creation philosophy.",
    epubUrl: "https://www.thesecret.tv/wp-content/uploads/2015/05/The-Science-of-Getting-Rich.pdf",
    totalPages: 90,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["wealth", "rich"]
  },
  {
    id: "cat_nicomachean",
    title: "Nicomachean Ethics",
    author: "Aristotle",
    coverUrl: "https://www.gutenberg.org/cache/epub/8438/pg8438.cover.medium.jpg",
    description: "Virtue and the good life.",
    epubUrl: "https://socialsciences.mcmaster.ca/econ/ugcm/3ll3/aristotle/Ethics.pdf",
    totalPages: 300,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["philosophy", "ethics"]
  },
  // ── Mustaq's Picks ────────────────────────────────────────────────────────
  {
    id: "cat_i_missed_a_prayer",
    title: "\u0631\u0648\u0627\u064A\u0629 \u0641\u0627\u062A\u062A\u0646\u064A \u0635\u0644\u0627\u0629",
    author: "\u0625\u0633\u0644\u0627\u0645 \u062C\u0645\u0627\u0644",
    coverUrl: "https://archive.org/services/img/noor-book.com_202012",
    description: "\u0643\u062A\u0627\u0628 \u0641\u0627\u062A\u062A\u0646\u064A \u0635\u0644\u0627\u0629 \u0644\u0644\u0643\u0627\u062A\u0628 \u0625\u0633\u0644\u0627\u0645 \u062C\u0645\u0627\u0644.",
    epubUrl: "https://archive.org/download/noor-book.com_202012/Noor-Book.com%20%20%D9%81%D8%A7%D8%AA%D8%AA%D9%86%D9%89%20%D8%B5%D9%84%D8%A7%D8%A9%20%D8%A7%D8%B3%D9%84%D8%A7%D9%85%20%D8%AC%D9%85%D8%A7%D9%84.pdf",
    totalPages: 220,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["arabic", "islamic", "self-help", "i missed a prayer", "islam jamal"]
  },
  {
    id: "cat_cant_hurt_me",
    title: "Can't Hurt Me",
    author: "David Goggins",
    coverUrl: "https://archive.org/services/img/cant-hurt-me-david-goggins_202111",
    description: "Master Your Mind and Defy the Odds.",
    epubUrl: "https://archive.org/download/cant-hurt-me-david-goggins_202111/Can%27t%20Hurt%20Me%20-%20David%20Goggins.pdf",
    totalPages: 364,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["mindset", "self-help"]
  },
  {
    id: "cat_rich_dad",
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    coverUrl: "https://archive.org/services/img/rich-dad-poor-dad-what-the-rich-teach-their-kids-about-money-that-the-poor-and-m_20240320",
    description: "What the Rich Teach Their Kids About Money.",
    epubUrl: "https://archive.org/download/rich-dad-poor-dad-what-the-rich-teach-their-kids-about-money-that-the-poor-and-m_20240320/Rich%20Dad%20Poor%20Dad%20What%20the%20Rich%20Teach%20Their%20Kids%20About%20Money%E2%80%94That%20the%20Poor%20and%20Middle%20Class%20Do%20Not%20by%20Robert%20T.%20Kiyosaki%20%28z-lib.org%29.epub%20%281%29.pdf",
    totalPages: 336,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["wealth", "finance"]
  },
  {
    id: "cat_atomic_habits",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://archive.org/services/img/atomic-habits-pdfdrive",
    description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones.",
    epubUrl: "https://ia903102.us.archive.org/32/items/atomic-habits-pdfdrive/Atomic%20habits%20%28%20PDFDrive%20%29.pdf",
    totalPages: 320,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["habits", "self-help"]
  },
  {
    id: "cat_white_nights",
    title: "White Nights",
    author: "Fyodor Dostoevsky",
    coverUrl: "https://archive.org/services/img/fydor-dostoyevsky-white-nights-flph-1950",
    description: "A short story by Fyodor Dostoevsky.",
    epubUrl: "https://archive.org/download/fydor-dostoyevsky-white-nights-flph-1950/Fydor_Dostoyevsky_-_White_Nights_-_FLPH_1950.pdf",
    totalPages: 80,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["dostoevsky", "classic"]
  },
  // ── German (Gutenberg) ────────────────────────────────────────────────────
  {
    id: "cat_faust",
    title: "Faust (Erster Teil)",
    author: "Johann Wolfgang von Goethe",
    coverUrl: "https://www.gutenberg.org/cache/epub/2229/pg2229.cover.medium.jpg",
    description: "Goethes Faust \u2014 deutscher Klassiker.",
    epubUrl: "https://www.planetebook.com/free-ebooks/faust.pdf",
    totalPages: 350,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "goethe"]
  },
  {
    id: "cat_grimm",
    title: "Grimm's M\xE4rchen",
    author: "Br\xFCder Grimm",
    coverUrl: "https://www.gutenberg.org/cache/epub/2591/pg2591.cover.medium.jpg",
    description: "Deutsche Volksm\xE4rchen.",
    epubUrl: "https://www.planetebook.com/free-ebooks/grimms-fairy-tales.pdf",
    totalPages: 400,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "m\xE4rchen"]
  },
  // ── French (Gutenberg) ──────────────────────────────────────────────────
  {
    id: "cat_les_mis",
    title: "Les Mis\xE9rables",
    author: "Victor Hugo",
    coverUrl: "https://www.gutenberg.org/cache/epub/135/pg135.cover.medium.jpg",
    description: "Roman classique fran\xE7ais.",
    epubUrl: "https://www.planetebook.com/free-ebooks/les-miserables.pdf",
    totalPages: 1200,
    source: "French Classics",
    category: "French",
    tags: ["fran\xE7ais", "hugo"]
  },
  {
    id: "cat_candide",
    title: "Candide",
    author: "Voltaire",
    coverUrl: "https://www.gutenberg.org/cache/epub/19942/pg19942.cover.medium.jpg",
    description: "Satire philosophique.",
    epubUrl: "https://www.planetebook.com/free-ebooks/candide.pdf",
    totalPages: 150,
    source: "French Classics",
    category: "French",
    tags: ["fran\xE7ais", "voltaire"]
  },
  {
    id: "cat_madame_bovary",
    title: "Madame Bovary",
    author: "Gustave Flaubert",
    coverUrl: "https://www.gutenberg.org/cache/epub/2413/pg2413.cover.medium.jpg",
    description: "R\xE9alisme litt\xE9raire fran\xE7ais.",
    epubUrl: "https://www.planetebook.com/free-ebooks/madame-bovary.pdf",
    totalPages: 450,
    source: "French Classics",
    category: "French",
    tags: ["fran\xE7ais", "flaubert"]
  },
  // ── Comics & Illustrated (verified IA) ────────────────────────────────────
  {
    id: "cat_little_nemo",
    title: "Little Nemo 1905\u20131914",
    author: "Winsor McCay",
    coverUrl: "https://archive.org/services/img/LittleNemo1905-1914ByWinsorMccay",
    description: "Classic comic strips \u2014 public domain illustrated PDF.",
    epubUrl: "https://archive.org/download/LittleNemo1905-1914ByWinsorMccay/little-nemo.pdf",
    totalPages: 200,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["comics", "illustrated"]
  }
];
function catalogAsHits() {
  return BOOK_CATALOG.map(({ category: _c, tags: _t, ...hit }) => hit);
}
function searchBookCatalog(query, limit = 20) {
  const q = query.trim().toLowerCase();
  if (!q) return catalogAsHits().slice(0, limit);
  const scored = BOOK_CATALOG.map((entry) => {
    let score = 0;
    const title = entry.title.toLowerCase();
    const author = entry.author.toLowerCase();
    const tags = (entry.tags || []).join(" ").toLowerCase();
    const cat = entry.category.toLowerCase();
    if (title.includes(q)) score += 90;
    if (author.includes(q)) score += 80;
    if (tags.includes(q)) score += 70;
    if (cat.includes(q)) score += 50;
    const terms = q.split(/\s+/).filter((w) => w.length > 1);
    for (const term of terms) {
      if (title.includes(term)) score += 15;
      if (author.includes(term)) score += 12;
      if (tags.includes(term)) score += 10;
      if (cat.includes(term)) score += 8;
    }
    return { entry, score };
  }).filter(({ score }) => score >= 30).sort((a, b) => b.score - a.score).slice(0, limit);
  return scored.map(({ entry }) => {
    const { category: _c, tags: _t, ...hit } = entry;
    return hit;
  });
}
var ARABIC_FEATURED = catalogAsHits().filter(
  (b) => b.source.includes("Arabic") || b.source.includes("Shamela") || b.source.includes("Moroccan")
);
var ENGLISH_FEATURED = catalogAsHits().filter(
  (b) => ["Gutendex", "Self-Help", "Comics"].includes(b.source)
);

// src/lib/library-sources.ts
function iaPdfUrl(identifier, filename) {
  return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
}
async function iaResolvePdfUrl(identifier) {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.metadata?.access_restricted_item && data.metadata.access_restricted_item !== "false") return null;
    const pdf = (data.files || []).find(
      (f) => (f.name?.toLowerCase().endsWith(".pdf") || f.format === "Text PDF" || f.format === "PDF") && !f.name?.toLowerCase().includes("_encrypted") && !f.name?.toLowerCase().includes("_sample")
    );
    if (pdf?.name) return iaPdfUrl(identifier, pdf.name);
    return null;
  } catch {
    return null;
  }
}
function scoreBookMatch(query, hit) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const title = hit.title.toLowerCase().trim();
  const author = (hit.author || "").toLowerCase().trim();
  if (title === q) return 100;
  if (title.includes(q)) return 85;
  if (author === q) return 80;
  if (author.includes(q)) return 75;
  const terms = q.split(/\s+/).filter((w) => w.length > 1);
  if (terms.length === 0) {
    return title.includes(q) || author.includes(q) ? 55 : 0;
  }
  let matched = 0;
  for (const term of terms) {
    if (title.includes(term) || author.includes(term)) matched++;
  }
  if (matched === terms.length) return 65 + Math.min(terms.length * 5, 20);
  if (matched > 0) return matched * 12;
  return 0;
}
async function searchInternetArchive(query, opts = {}) {
  const limit = opts.limit ?? (opts.arabic ? 15 : 25);
  let langClause = "";
  if (opts.arabic) langClause = "language:Arabic AND ";
  else if (opts.german) langClause = "language:German AND ";
  else if (opts.french) langClause = "language:French AND ";
  const q = `${langClause}mediatype:texts AND format:PDF AND -access-restricted-item:true AND (title:(${query}) OR creator:(${query}) OR ${query})`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,description&rows=${limit}&output=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    signal: AbortSignal.timeout(12e3)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const hits = [];
  const docs = data.response?.docs || [];
  const pdfUrls = await Promise.all(docs.map((d) => d.identifier ? iaResolvePdfUrl(d.identifier) : Promise.resolve(null)));
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const pdfUrl = pdfUrls[i];
    if (!doc?.identifier || !pdfUrl) continue;
    const author = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "Unknown";
    hits.push({
      id: `ia_${doc.identifier}`,
      title: doc.title || doc.identifier,
      author: String(author),
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
      description: (doc.description || "Free PDF from Internet Archive.").toString().slice(0, 200),
      epubUrl: pdfUrl,
      totalPages: 300,
      source: opts.arabic ? "Internet Archive (AR)" : "Internet Archive"
    });
  }
  return hits;
}
async function searchOpenLibrary(query, limit = 8) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&public_scan_b=true&limit=${limit}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    signal: AbortSignal.timeout(12e3)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const hits = [];
  const docs = data.docs || [];
  const pdfUrls = await Promise.all(
    docs.map((doc) => doc.ia?.[0] ? iaResolvePdfUrl(doc.ia[0]) : Promise.resolve(null))
  );
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const pdfUrl = pdfUrls[i];
    if (!doc?.title || !pdfUrl) continue;
    hits.push({
      id: `ol_${(doc.key || "").replace(/\//g, "_")}`,
      title: doc.title,
      author: doc.author_name?.[0] || "Unknown Author",
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      description: doc.first_sentence?.[0] || "Public domain PDF via Open Library.",
      epubUrl: pdfUrl,
      totalPages: 250,
      source: "Open Library"
    });
  }
  return hits;
}
async function searchShamelaCatalog(query, limit = 12) {
  const q = `collection:booksbylanguage_arabic AND format:PDF AND -access-restricted-item:true AND (title:(${query}) OR creator:(${query}) OR ${query})`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,description&rows=${limit}&output=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Grova-Library/1.0" },
    signal: AbortSignal.timeout(12e3)
  });
  if (!res.ok) return [];
  const data = await res.json();
  const hits = [];
  const docs = data.response?.docs || [];
  const pdfUrls = await Promise.all(docs.map((d) => d.identifier ? iaResolvePdfUrl(d.identifier) : Promise.resolve(null)));
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const pdfUrl = pdfUrls[i];
    if (!doc?.identifier || !pdfUrl) continue;
    const author = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "\u062A\u0631\u0627\u062B";
    hits.push({
      id: `shamela_ia_${doc.identifier}`,
      title: doc.title || doc.identifier,
      author: String(author),
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
      description: "\u0643\u062A\u0627\u0628 \u0639\u0631\u0628\u064A PDF \u0645\u062C\u0627\u0646\u064A \u2014 \u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0639\u0644\u0649 Internet Archive.",
      epubUrl: pdfUrl,
      totalPages: 400,
      source: "Shamela / Arabic"
    });
  }
  return hits;
}
var ARABIC_FEATURED2 = ARABIC_FEATURED.length > 0 ? ARABIC_FEATURED : [
  {
    id: "feat_hdesaddar",
    title: "\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0627\u0631",
    author: "\u0627\u0644\u0633\u064A\u062F \u0639\u0644\u064A \u0627\u0644\u062D\u0633\u064A\u0646\u064A \u0627\u0644\u0645\u064A\u0644\u0627\u0646\u064A",
    coverUrl: "https://archive.org/services/img/hdesaddar",
    description: "\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0627\u0631 \u2014 \u0643\u062A\u0627\u0628 \u0639\u0631\u0628\u064A PDF \u0645\u0646 Internet Archive.",
    epubUrl: "https://archive.org/download/hdesaddar/hdesaddar.pdf",
    totalPages: 38,
    source: "Arabic Classics"
  }
];
var ENGLISH_FEATURED2 = ENGLISH_FEATURED;
function isPdfBookUrl(url) {
  const lower = url.toLowerCase().split("?")[0] ?? "";
  if (lower.endsWith(".pdf") || lower.includes(".pdf/")) return true;
  if (/cloudinary\.com/i.test(url) && /\/raw\//i.test(url)) return true;
  if (/res\.cloudinary\.com/i.test(url)) return true;
  if (/backblazeb2\.com/i.test(url)) return true;
  if (/archive\.org\/download\//i.test(url)) return true;
  return false;
}

// src/routes/library.ts
var libraryRouter = Router28();
function isArabicQuery(q) {
  return /[\u0600-\u06FF]/.test(q);
}
function isGermanQuery(q) {
  return /[äöüßÄÖÜ]/.test(q) || /\b(und|der|die|das|ein|eine|nicht|mit|für|deutsch)\b/i.test(q);
}
function isFrenchQuery(q) {
  return /[àâçéèêëïîôùûü]/i.test(q) || /\b(les|des|une|dans|pour|français|avec)\b/i.test(q);
}
var CACHE_TTL_MS = 10 * 60 * 1e3;
var searchCache = /* @__PURE__ */ new Map();
function getCached(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry;
}
function setCache(key, results, meta) {
  if (searchCache.size >= 200) {
    const oldest = [...searchCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) searchCache.delete(oldest[0]);
  }
  searchCache.set(key, { results, meta, ts: Date.now() });
}
function isPrivateHost(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "127.0.0.1" || h.startsWith("127.")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h.startsWith("169.254.")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}
function isSafeBookUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (isPrivateHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
function guessBookContentType(url) {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "application/pdf";
  if (lower.includes(".epub")) return "application/epub+zip";
  return "application/octet-stream";
}
function gutenbergFetchCandidates(url) {
  const out = [url];
  const m = url.match(/gutenberg\.org\/ebooks\/(\d+)/i);
  if (m) {
    const id = m[1];
    out.push(`https://www.gutenberg.org/files/${id}/${id}-0.pdf`);
  }
  const filesMatch = url.match(/gutenberg\.org\/files\/(\d+)\//i);
  if (filesMatch) {
    const id = filesMatch[1];
    out.push(`https://www.gutenberg.org/files/${id}/${id}-0.pdf`);
  }
  return [...new Set(out)];
}
function isValidBookBuffer(buf) {
  if (buf.length < 4) return false;
  return buf[0] === 37 && buf[1] === 80 && buf[2] === 68 && buf[3] === 70;
}
async function archivePdfCandidates(url) {
  const out = [url];
  const m = url.match(/archive\.org\/download\/([^/]+)/i);
  if (!m?.[1]) return out;
  const resolved = await iaResolvePdfUrl(m[1]);
  if (resolved && !out.includes(resolved)) out.unshift(resolved);
  return out;
}
async function fetchBookUpstream(url) {
  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/epub+zip,application/pdf,*/*"
    },
    signal: AbortSignal.timeout(9e4),
    redirect: "follow"
  });
  if (!upstream.ok) return null;
  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (!isValidBookBuffer(buffer)) return null;
  const contentType = upstream.headers.get("content-type")?.split(";")[0]?.trim() || guessBookContentType(url);
  return { buffer, contentType };
}
async function findExistingLibraryBook(addedBy, title, epubUrl) {
  const normTitle = title.toLowerCase().trim();
  const url = epubUrl?.trim() || "";
  const result = await db_default.query(
    `SELECT id FROM library_books
     WHERE added_by = $1
       AND (
         LOWER(TRIM(title)) = $2
         OR ($3 <> '' AND epub_url = $3)
       )
     LIMIT 1`,
    [addedBy, normTitle, url]
  );
  return result.rows[0] ?? null;
}
libraryRouter.get("/library/catalog", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
  const category = typeof req.query.category === "string" ? req.query.category : void 0;
  const q = (req.query.q || "").trim();
  try {
    const books = q ? searchBookCatalog(q, 40) : catalogAsHits();
    const filtered = category ? books.filter((b) => b.source.toLowerCase().includes(category.toLowerCase())) : books;
    return res.json({ books: filtered.slice(0, 40) });
  } catch (err) {
    console.error("Library catalog GET error:", err);
    return res.status(500).json({ error: "Failed to fetch catalog" });
  }
});
libraryRouter.get("/library/search", authenticate, async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) return res.json({ results: [], meta: { cached: false, sources: {} } });
  const enc = encodeURIComponent(query);
  const arabic = isArabicQuery(query);
  const german = !arabic && isGermanQuery(query);
  const french = !arabic && !german && isFrenchQuery(query);
  const exactLower = query.toLowerCase().trim();
  const MIN_MATCH_SCORE = 45;
  const cacheKey = `pdf-v2:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ results: cached.results, meta: { ...cached.meta, cached: true } });
  }
  const sourceMeta = {};
  const skipGutendex = arabic;
  const skipWikiEn = true;
  const skipWikiAr = true;
  const skipWikiFr = true;
  const skipWikiDe = true;
  const skipStandard = true;
  const skipFeedbooks = true;
  if (skipGutendex) sourceMeta["Gutendex"] = "skipped";
  if (skipWikiEn) sourceMeta["Wikisource EN"] = "skipped";
  if (skipWikiAr) sourceMeta["Wikisource AR"] = "skipped";
  if (skipWikiFr) sourceMeta["Wikisource FR"] = "skipped";
  if (skipWikiDe) sourceMeta["Wikisource DE"] = "skipped";
  if (skipStandard) sourceMeta["Standard Ebooks"] = "skipped";
  if (skipFeedbooks) sourceMeta["Feedbooks"] = "skipped";
  const gutendexFetch = skipGutendex ? Promise.resolve(null) : fetch(`https://gutendex.com/books/?search=${enc}`);
  const standardFetch = Promise.resolve(null);
  const feedbooksFetch = Promise.resolve(null);
  const oapenFetch = fetch(`https://library.oapen.org/rest/search?query=${enc}&expand=metadata,bitstreams`, { signal: AbortSignal.timeout(6e3) }).catch(() => null);
  const wikiArFetch = Promise.resolve(null);
  const wikiEnFetch = Promise.resolve(null);
  const wikiFrFetch = Promise.resolve(null);
  const wikiDeFetch = Promise.resolve(null);
  const [
    gutendexRes,
    standardRes,
    feedbooksRes,
    oapenRes,
    wikiArRes,
    wikiEnRes,
    wikiFrRes,
    wikiDeRes
  ] = await Promise.allSettled([
    gutendexFetch,
    standardFetch,
    feedbooksFetch,
    oapenFetch,
    wikiArFetch,
    wikiEnFetch,
    wikiFrFetch,
    wikiDeFetch
  ]);
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  function dedup(title) {
    const key = title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }
  let catalogAdded = 0;
  for (const hit of searchBookCatalog(query, 16)) {
    if (!dedup(hit.title)) continue;
    results.push(hit);
    catalogAdded++;
  }
  sourceMeta["Curated Catalog"] = catalogAdded > 0 ? "ok" : "empty";
  const shamelaPromise = arabic ? searchShamelaCatalog(query, 15) : Promise.resolve([]);
  const githubIndexPromise = searchGithubIndex(query, arabic ? 12 : 8).catch(() => []);
  const iaLangOpts = arabic ? { arabic: true, limit: 15 } : german ? { german: true, limit: 12 } : french ? { french: true, limit: 12 } : { limit: arabic ? 15 : 14 };
  const [iaSettled, olSettled, shamelaSettled, githubSettled] = await Promise.allSettled([
    searchInternetArchive(query, iaLangOpts),
    searchOpenLibrary(query, arabic ? 8 : 10),
    shamelaPromise,
    githubIndexPromise
  ]);
  const ingestCatalog = (settled, label) => {
    if (settled.status !== "fulfilled") {
      sourceMeta[label] = "timeout";
      return;
    }
    let added = 0;
    for (const hit of settled.value) {
      if (!dedup(hit.title)) continue;
      results.push(hit);
      added++;
    }
    sourceMeta[label] = added > 0 ? "ok" : "empty";
  };
  ingestCatalog(iaSettled, arabic ? "Internet Archive (AR)" : "Internet Archive");
  if (arabic) ingestCatalog(shamelaSettled, "Shamela / Arabic");
  else sourceMeta["Shamela / Arabic"] = "skipped";
  ingestCatalog(olSettled, "Open Library");
  const featured = arabic ? ARABIC_FEATURED2 : ENGLISH_FEATURED2;
  for (const feat of featured) {
    if (scoreBookMatch(query, feat) >= 60 && dedup(feat.title)) {
      results.unshift(feat);
    }
  }
  sourceMeta[arabic ? "Arabic Classics" : "English Classics"] = results.some((r) => r.source.includes("Classics")) ? "ok" : "empty";
  if (githubSettled.status === "fulfilled") {
    let added = 0;
    for (const ghBook of githubSettled.value) {
      if (!isPdfBookUrl(ghBook.epubUrl)) continue;
      if (!dedup(ghBook.title)) continue;
      results.push(ghBook);
      added++;
    }
    sourceMeta["GitHub Omni"] = added > 0 ? "ok" : "empty";
  } else {
    sourceMeta["GitHub Omni"] = "timeout";
  }
  sourceMeta["GitHub Global"] = "skipped";
  if (!skipGutendex) {
    if (gutendexRes.status === "fulfilled" && gutendexRes.value?.ok) {
      try {
        const data = await gutendexRes.value.json();
        let added = 0;
        for (const item of (data.results || []).slice(0, 6)) {
          if (!item.title || !dedup(item.title)) continue;
          const fileUrl = item.formats?.["application/pdf"] || null;
          if (!fileUrl) continue;
          results.push({
            id: `guten_${item.id}`,
            title: item.title,
            author: item.authors?.[0]?.name || "Unknown Author",
            coverUrl: item.formats?.["image/jpeg"] || null,
            description: "Public domain PDF from Project Gutenberg.",
            epubUrl: fileUrl,
            totalPages: 200,
            source: "Gutendex"
          });
          added++;
        }
        sourceMeta["Gutendex"] = added > 0 ? "ok" : "empty";
      } catch {
        sourceMeta["Gutendex"] = "timeout";
      }
    } else {
      sourceMeta["Gutendex"] = gutendexRes.status === "rejected" ? "timeout" : "empty";
    }
  }
  if (oapenRes.status === "fulfilled" && oapenRes.value?.ok) {
    try {
      const data = await oapenRes.value.json();
      let added = 0;
      for (const item of (data || []).slice(0, 3)) {
        if (!item.name || !dedup(item.name)) continue;
        const metadata = item.metadata || [];
        const authorField = metadata.find((m) => m.key === "dc.contributor.author");
        const abstractField = metadata.find((m) => m.key === "dc.description.abstract");
        const bitstream = (item.bitstreams || []).find((b) => b.name?.endsWith(".pdf"));
        if (!bitstream) continue;
        results.push({
          id: `oapen_${item.uuid}`,
          title: item.name,
          author: authorField?.value || "Academic Authors",
          coverUrl: null,
          description: (abstractField?.value || "Open Access academic book from OAPEN Library.").substring(0, 200) + "...",
          epubUrl: `https://library.oapen.org${bitstream.link}`,
          // PDF bitstream!
          totalPages: 300,
          source: "OAPEN"
        });
        added++;
      }
      sourceMeta["OAPEN"] = added > 0 ? "ok" : "empty";
    } catch {
      sourceMeta["OAPEN"] = "timeout";
    }
  } else {
    sourceMeta["OAPEN"] = oapenRes.status === "rejected" ? "timeout" : "empty";
  }
  let finalResults = results.filter((r) => r.epubUrl && isPdfBookUrl(r.epubUrl)).map((r) => {
    let score = scoreBookMatch(query, r);
    if (r.source.includes("Internet Archive") || r.source.includes("Shamela")) {
      score += 30;
    }
    return { ...r, _score: score };
  }).filter((r) => r._score >= MIN_MATCH_SCORE);
  finalResults.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    const sourceRank = (s) => {
      if (s.includes("Internet Archive")) return 0;
      if (s.includes("Shamela")) return 0;
      if (s === "Open Library") return 1;
      if (s.includes("Classics") || s === "Curated Catalog" || s.includes("Self-Help") || s.includes("Comics")) return 2;
      if (s === "Gutendex") return 3;
      if (s === "OAPEN") return 4;
      return 5;
    };
    return sourceRank(a.source) - sourceRank(b.source);
  });
  finalResults = finalResults.slice(0, 28).map(({ _score, ...r }) => r);
  const meta = { cached: false, sources: sourceMeta, total: finalResults.length };
  setCache(cacheKey, finalResults, { cached: false, sources: sourceMeta, total: finalResults.length });
  return res.json({ results: finalResults, meta });
});
libraryRouter.get("/library", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
  try {
    const result = await db_default.query(
      `SELECT id, title, author,
              cover_url AS "coverUrl",
              description,
              epub_url AS "epubUrl",
              source,
              added_by AS "addedBy",
              added_at AS "addedAt",
              status,
              current_page AS "currentPage",
              total_pages AS "totalPages",
              is_favorite AS "isFavorite"
       FROM library_books
       ORDER BY added_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library GET error:", err);
    return res.status(500).json({ error: "Failed to fetch library" });
  }
});
libraryRouter.get("/library/stats", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const sessions = await db_default.query(
      `SELECT DISTINCT date FROM library_reading_sessions WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );
    let streakDays = 0;
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const sessionDateSet = new Set(
      sessions.rows.map((r) => {
        const raw = r.date;
        if (typeof raw === "string") return raw.split("T")[0];
        return raw.toISOString().split("T")[0];
      })
    );
    let cursor = /* @__PURE__ */ new Date(todayStr + "T00:00:00.000Z");
    if (!sessionDateSet.has(todayStr)) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (true) {
      const key = cursor.toISOString().split("T")[0];
      if (!sessionDateSet.has(key)) break;
      streakDays++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    const todayDate = todayStr;
    const currentYear = todayDate.split("-")[0];
    const dailyResult = await db_default.query(
      `SELECT SUM(duration_minutes) as total FROM library_reading_sessions WHERE user_id = $1 AND date = $2`,
      [userId, todayDate]
    );
    const annualResult = await db_default.query(
      `SELECT SUM(duration_minutes) as total FROM library_reading_sessions WHERE user_id = $1 AND CAST(date AS TEXT) LIKE $2`,
      [userId, `${currentYear}-%`]
    );
    const totalMetricsResult = await db_default.query(
      `SELECT SUM(duration_minutes) as total_duration, SUM(pages_read) as total_pages FROM library_reading_sessions WHERE user_id = $1`,
      [userId]
    );
    const totalDuration = Number(totalMetricsResult.rows[0]?.total_duration) || 0;
    const totalPagesRead = Number(totalMetricsResult.rows[0]?.total_pages) || 0;
    const avgTimePerPage = totalPagesRead > 0 ? (totalDuration / totalPagesRead).toFixed(1) : 0;
    const weekStart = /* @__PURE__ */ new Date(todayDate + "T00:00:00.000Z");
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weeklyRows = await db_default.query(
      `SELECT date, SUM(pages_read) AS total
       FROM library_reading_sessions
       WHERE user_id = $1 AND date >= $2
       GROUP BY date`,
      [userId, weekStartStr]
    );
    const weeklyMap = /* @__PURE__ */ new Map();
    for (const row of weeklyRows.rows) {
      const d = row.date;
      const key = typeof d === "string" ? d.split("T")[0] : d.toISOString().split("T")[0];
      weeklyMap.set(key, Number(row.total) || 0);
    }
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date(todayDate + "T00:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      weeklyData.push({ date: dateStr, pages: weeklyMap.get(dateStr) || 0 });
    }
    const monthlyRows = await db_default.query(
      `SELECT SUBSTRING(CAST(date AS TEXT), 6, 2) AS month, SUM(pages_read) AS total
       FROM library_reading_sessions
       WHERE user_id = $1 AND CAST(date AS TEXT) LIKE $2
       GROUP BY SUBSTRING(CAST(date AS TEXT), 6, 2)`,
      [userId, `${currentYear}-%`]
    );
    const monthlyMap = /* @__PURE__ */ new Map();
    for (const row of monthlyRows.rows) {
      monthlyMap.set(String(row.month), Number(row.total) || 0);
    }
    const monthlyData = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, "0");
      monthlyData.push({ month: monthStr, pages: monthlyMap.get(monthStr) || 0 });
    }
    const finishedResult = await db_default.query(
      `SELECT COUNT(*) as total FROM library_books WHERE added_by = $1 AND status = 'finished'`,
      [userId]
    );
    const booksRead = Number(finishedResult.rows[0]?.total || 0);
    return res.json({
      streakDays,
      dailyMinutes: Number(dailyResult.rows[0]?.total || 0),
      annualMinutes: Number(annualResult.rows[0]?.total || 0),
      totalPagesRead,
      avgTimePerPage: Number(avgTimePerPage),
      weeklyData,
      monthlyData,
      booksRead
    });
  } catch (err) {
    console.error("Library stats GET error:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});
libraryRouter.get("/library/notes", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const partnerId = userId ? appConfig.partnerMapping[userId] : void 0;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const result = await db_default.query(
      `SELECT n.id, n.book_id AS "bookId", n.chapter_or_page AS "chapterOrPage",
              n.text, n.author_id AS "authorId", n.timestamp,
              b.title AS "bookTitle"
       FROM library_notes n
       JOIN library_books b ON n.book_id = b.id
       WHERE b.added_by = $1 OR b.added_by = $2
       ORDER BY n.timestamp DESC`,
      [userId, partnerId || userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library all notes GET error:", err);
    return res.status(500).json({ error: "Failed to fetch all notes" });
  }
});
libraryRouter.get("/library/:id/file-url", authenticate, async (req, res) => {
  try {
    const result = await db_default.query(
      `SELECT epub_url AS "epubUrl" FROM library_books WHERE id = $1`,
      [req.params.id]
    );
    const epubUrl = result.rows[0]?.epubUrl;
    if (!epubUrl?.trim()) return res.status(404).json({ error: "No file URL" });
    if (/cloudinary\.com|backblazeb2\.com/i.test(epubUrl)) {
      return res.json({ proxy: true, url: epubUrl });
    }
    if (epubUrl.includes("archive.org/download/")) {
      const upstream = await fetch(epubUrl, { redirect: "manual" });
      if (upstream.status >= 300 && upstream.status < 400) {
        const loc = upstream.headers.get("location");
        if (loc) return res.json({ proxy: false, url: loc });
      }
    }
    return res.json({ proxy: false, url: epubUrl });
  } catch (err) {
    console.error("Library file-url error:", err);
    return res.status(500).json({ error: "Failed to resolve file URL" });
  }
});
libraryRouter.get("/library/:id/file", authenticate, async (req, res) => {
  try {
    const result = await db_default.query(
      `SELECT epub_url AS "epubUrl" FROM library_books WHERE id = $1`,
      [req.params.id]
    );
    const epubUrl = result.rows[0]?.epubUrl;
    if (!epubUrl?.trim()) {
      return res.status(404).json({ error: "No file URL for this book" });
    }
    if (!isSafeBookUrl(epubUrl)) {
      return res.status(400).json({ error: "Book URL is not a valid public link" });
    }
    if (/cloudinary\.com|backblazeb2\.com/i.test(epubUrl)) {
      try {
        let fetchUrl = epubUrl;
        if (/backblazeb2\.com/i.test(epubUrl) && process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY) {
          const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
          const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
          const s3 = new S3Client({
            region: process.env.AWS_REGION || "us-east-005",
            endpoint: process.env.B2_ENDPOINT,
            credentials: {
              accessKeyId: process.env.B2_KEY_ID,
              secretAccessKey: process.env.B2_APPLICATION_KEY
            }
          });
          const bucket = process.env.B2_BUCKET_NAME;
          const urlObj = new URL(epubUrl);
          const key = urlObj.pathname.split(`/${bucket}/`)[1] || urlObj.pathname.replace(/^\//, "");
          const command = new GetObjectCommand({ Bucket: bucket, Key: key });
          fetchUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        }
        const upstream = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(6e4),
          headers: { Accept: "application/pdf,*/*" }
        });
        if (upstream.ok) {
          const raw = Buffer.from(await upstream.arrayBuffer());
          let buffer = raw;
          if (raw[0] === 31 && raw[1] === 139) {
            const { gunzipSync } = await import("zlib");
            try {
              buffer = Buffer.from(gunzipSync(raw));
            } catch {
              buffer = raw;
            }
          }
          if (isValidBookBuffer(buffer)) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Cache-Control", "private, max-age=3600");
            res.setHeader("Content-Disposition", "inline");
            return res.send(buffer);
          } else {
            console.error("Buffer not a valid PDF (first 4 bytes):", Array.from(buffer.slice(0, 4)));
          }
        } else {
          console.error("Upstream B2/Cloudinary fetch failed:", upstream.status, await upstream.text().catch(() => ""));
        }
      } catch (err) {
        console.error("Error fetching from B2/Cloudinary:", err);
      }
    }
    const candidates = epubUrl.includes("archive.org") ? await archivePdfCandidates(epubUrl) : epubUrl.includes("gutenberg.org") ? gutenbergFetchCandidates(epubUrl) : [epubUrl];
    for (const url of candidates) {
      if (!isSafeBookUrl(url)) continue;
      try {
        const fetched = await fetchBookUpstream(url);
        if (!fetched) continue;
        res.setHeader("Content-Type", fetched.contentType);
        res.setHeader("Cache-Control", "private, max-age=3600");
        res.setHeader("Content-Disposition", "inline");
        return res.send(fetched.buffer);
      } catch {
      }
    }
    return res.status(502).json({ error: "Could not download book file from source" });
  } catch (err) {
    console.error("Library file proxy error:", err);
    return res.status(500).json({ error: "Failed to fetch book file" });
  }
});
libraryRouter.get("/library/:id", authenticate, async (req, res) => {
  try {
    const result = await db_default.query(
      `SELECT id, title, author,
              cover_url AS "coverUrl",
              description,
              epub_url AS "epubUrl",
              source,
              added_by AS "addedBy",
              added_at AS "addedAt",
              current_page AS "currentPage",
              total_pages AS "totalPages",
              is_favorite AS "isFavorite"
       FROM library_books WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Book not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Library GET/:id error:", err);
    return res.status(500).json({ error: "Failed to fetch book" });
  }
});
libraryRouter.post("/library/batch", authenticate, async (req, res) => {
  try {
    const books = Array.isArray(req.body?.books) ? req.body.books : [];
    if (books.length === 0) return res.status(400).json({ error: "books array required" });
    const authorId = req.user?.id || "mustaq";
    const added = [];
    for (const body of books.slice(0, 25)) {
      if (!body?.title || !body?.epubUrl?.trim() || !isPdfBookUrl(body.epubUrl)) continue;
      const dup = await findExistingLibraryBook(authorId, body.title, body.epubUrl);
      if (dup) {
        added.push({ id: dup.id, title: body.title });
        continue;
      }
      const id = randomUUID19();
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        `INSERT INTO library_books
           (id, title, author, cover_url, description, epub_url, source, added_by, added_at, current_page, total_pages)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          body.title,
          body.author || "Unknown Author",
          body.coverUrl || null,
          body.description || null,
          body.epubUrl,
          body.source || "Unknown",
          authorId,
          timestamp,
          0,
          body.totalPages || 100
        ]
      );
      added.push({ id, title: body.title });
    }
    return res.json({ success: true, added: added.length, books: added });
  } catch (err) {
    console.error("Library batch POST error:", err);
    return res.status(500).json({ error: "Failed to batch add books" });
  }
});
libraryRouter.post("/library", authenticate, async (req, res) => {
  try {
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: "title is required" });
    if (body.epubUrl?.trim() && !isPdfBookUrl(body.epubUrl)) {
      return res.status(400).json({ error: "Only PDF books are supported" });
    }
    const id = randomUUID19();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const authorId = req.user?.id || "mustaq";
    const existing = await findExistingLibraryBook(authorId, body.title, body.epubUrl);
    if (existing) {
      return res.json({ success: true, id: existing.id, duplicate: true });
    }
    await db_default.execute(
      `INSERT INTO library_books
         (id, title, author, cover_url, description, epub_url, source, added_by, added_at, current_page, total_pages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        body.title,
        body.author || "Unknown Author",
        body.coverUrl || null,
        body.description || null,
        body.epubUrl || null,
        body.source || "Unknown",
        authorId,
        timestamp,
        0,
        body.totalPages || 100
      ]
    );
    return res.json({ success: true, id });
  } catch (err) {
    console.error("Library POST error:", err);
    return res.status(500).json({ error: "Failed to add book" });
  }
});
libraryRouter.put("/library/:id/progress", authenticate, async (req, res) => {
  try {
    const { page, status, totalPages } = req.body;
    if (page === void 0) return res.status(400).json({ error: "page is required" });
    const newStatus = status || (page > 0 ? "reading" : "reading");
    if (totalPages !== void 0 && totalPages > 0) {
      await db_default.execute(
        `UPDATE library_books SET current_page = $1, status = $2, total_pages = $3 WHERE id = $4`,
        [page, newStatus, totalPages, req.params.id]
      );
    } else {
      await db_default.execute(
        `UPDATE library_books SET current_page = $1, status = $2 WHERE id = $3`,
        [page, newStatus, req.params.id]
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Library PUT progress error:", err);
    return res.status(500).json({ error: "Failed to update progress" });
  }
});
libraryRouter.post("/library/:id/sync", authenticate, async (req, res) => {
  try {
    const { epubcifi } = req.body;
    const partnerId = req.user?.id === "me" ? "wife" : "me";
    broadcast("page-sync", { bookId: req.params.id, epubcifi }, partnerId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Library POST sync error:", err);
    return res.status(500).json({ error: "Failed to sync page" });
  }
});
libraryRouter.post("/library/:id/session", authenticate, async (req, res) => {
  try {
    const { durationMinutes, pagesRead } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const mins = Math.max(0, Number(durationMinutes) || 1);
    const pages = Math.max(0, Number(pagesRead) || 0);
    const existing = await db_default.query(
      `SELECT id FROM library_reading_sessions WHERE user_id = $1 AND book_id = $2 AND date = $3 LIMIT 1`,
      [userId, req.params.id, date]
    );
    if (existing.rows[0]) {
      await db_default.execute(
        `UPDATE library_reading_sessions
         SET duration_minutes = duration_minutes + $1, pages_read = pages_read + $2
         WHERE id = $3`,
        [mins, pages, existing.rows[0].id]
      );
    } else {
      const id = randomUUID19();
      await db_default.execute(
        `INSERT INTO library_reading_sessions (id, user_id, book_id, date, duration_minutes, pages_read)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, req.params.id, date, mins, pages]
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Library POST session error:", err);
    return res.status(500).json({ error: "Failed to log session" });
  }
});
libraryRouter.patch("/library/:id/status", authenticate, async (req, res) => {
  try {
    const { status, favorite } = req.body;
    if (status) {
      const validStatuses = ["reading", "finished", "wishlist", "paused", "gave_up"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await db_default.execute(`UPDATE library_books SET status = $1 WHERE id = $2`, [status, req.params.id]);
    }
    if (favorite !== void 0) {
      await db_default.execute(`UPDATE library_books SET is_favorite = $1 WHERE id = $2`, [Boolean(favorite), req.params.id]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Library PATCH status error:", err);
    return res.status(500).json({ error: "Failed to update status" });
  }
});
libraryRouter.delete("/library/:id", authenticate, async (req, res) => {
  try {
    await db_default.execute(`DELETE FROM library_books WHERE id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("Library DELETE error:", err);
    return res.status(500).json({ error: "Failed to delete book" });
  }
});
libraryRouter.get("/library/:id/notes", authenticate, async (req, res) => {
  try {
    const result = await db_default.query(
      `SELECT id, book_id AS "bookId", chapter_or_page AS "chapterOrPage",
              text, author_id AS "authorId", timestamp
       FROM library_notes WHERE book_id = $1 ORDER BY timestamp ASC`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library notes GET error:", err);
    return res.status(500).json({ error: "Failed to fetch notes" });
  }
});
libraryRouter.post("/library/:id/notes", authenticate, async (req, res) => {
  try {
    const { text, chapterOrPage } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });
    const id = randomUUID19();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const authorId = req.user?.id || "mustaq";
    await db_default.execute(
      `INSERT INTO library_notes (id, book_id, chapter_or_page, text, author_id, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.params.id, chapterOrPage || null, text, authorId, timestamp]
    );
    return res.json({ success: true, id });
  } catch (err) {
    console.error("Library notes POST error:", err);
    return res.status(500).json({ error: "Failed to add note" });
  }
});
libraryRouter.get("/library/collections", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const result = await db_default.query(
      `SELECT c.id, c.name, c.banner_url AS "bannerUrl", c.created_at AS "createdAt",
              (SELECT COUNT(*) FROM library_collection_books cb WHERE cb.collection_id = c.id) AS "bookCount"
       FROM library_collections c
       WHERE c.created_by = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library collections GET error:", err);
    return res.status(500).json({ error: "Failed to fetch collections" });
  }
});
libraryRouter.post("/library/collections", authenticate, async (req, res) => {
  try {
    const { name, bannerUrl } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = randomUUID19();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      `INSERT INTO library_collections (id, name, banner_url, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, bannerUrl || null, userId, timestamp]
    );
    return res.json({ id, name, bannerUrl, createdAt: timestamp, bookCount: 0 });
  } catch (err) {
    console.error("Library collection POST error:", err);
    return res.status(500).json({ error: "Failed to create collection" });
  }
});
libraryRouter.delete("/library/collections/:id", authenticate, async (req, res) => {
  try {
    await db_default.execute(`DELETE FROM library_collections WHERE id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("Library collection DELETE error:", err);
    return res.status(500).json({ error: "Failed to delete collection" });
  }
});
libraryRouter.get("/library/collections/:id", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
  try {
    const colResult = await db_default.query(
      `SELECT id, name, banner_url AS "bannerUrl", created_at AS "createdAt"
       FROM library_collections WHERE id = $1`,
      [req.params.id]
    );
    if (!colResult.rows[0]) return res.status(404).json({ error: "Collection not found" });
    const booksResult = await db_default.query(
      `SELECT b.id, b.title, b.author, b.cover_url AS "coverUrl", b.description,
              b.epub_url AS "epubUrl", b.source, b.added_by AS "addedBy",
              b.added_at AS "addedAt", b.status, b.current_page AS "currentPage",
              b.total_pages AS "totalPages", b.is_favorite AS "isFavorite",
              cb.added_at AS "collectionAddedAt"
       FROM library_collection_books cb
       JOIN library_books b ON cb.book_id = b.id
       WHERE cb.collection_id = $1
       ORDER BY cb.added_at DESC`,
      [req.params.id]
    );
    return res.json({
      ...colResult.rows[0],
      books: booksResult.rows
    });
  } catch (err) {
    console.error("Library collection details GET error:", err);
    return res.status(500).json({ error: "Failed to fetch collection details" });
  }
});
libraryRouter.post("/library/collections/:id/books", authenticate, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: "bookId is required" });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      `INSERT INTO library_collection_books (collection_id, book_id, added_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, book_id) DO NOTHING`,
      [req.params.id, bookId, timestamp]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Library collection book POST error:", err);
    return res.status(500).json({ error: "Failed to add book to collection" });
  }
});
libraryRouter.delete("/library/collections/:id/books/:bookId", authenticate, async (req, res) => {
  try {
    await db_default.execute(
      `DELETE FROM library_collection_books WHERE collection_id = $1 AND book_id = $2`,
      [req.params.id, req.params.bookId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Library collection book DELETE error:", err);
    return res.status(500).json({ error: "Failed to remove book from collection" });
  }
});
var library_default = libraryRouter;

// src/routes/doodle.ts
import { Router as Router29 } from "express";
var router28 = Router29();
router28.post("/sync", authenticate, (req, res) => {
  const { strokes, partnerId, color, brushSize, clear, canvasBg } = req.body;
  const authenticatedUserId = req.user.id;
  if (!partnerId) {
    res.status(400).json({ error: "partnerId required" });
    return;
  }
  const payload = {
    senderId: authenticatedUserId,
    strokes,
    color,
    brushSize,
    clear,
    canvasBg
  };
  broadcast("doodle_sync", payload, partnerId);
  const expiresAt = Date.now() + 1e4;
  db_default.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [partnerId, "doodle_sync", JSON.stringify(payload), Date.now(), expiresAt]
  ).catch((err) => console.error("Failed to save doodle signal:", err));
  res.json({ success: true });
});
router28.get("/signals", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const result = await db_default.execute(
      "SELECT id, data FROM call_signals WHERE receiver_id = $1 AND event = 'doodle_sync' AND expires_at > $2 ORDER BY id ASC",
      [authenticatedUserId, Date.now()]
    );
    if (result.rows.length > 0) {
      const ids = result.rows.map((r) => r.id);
      await db_default.execute(
        `DELETE FROM call_signals WHERE id IN (${ids.join(",")})`
      );
    }
    db_default.execute("DELETE FROM call_signals WHERE event = 'doodle_sync' AND expires_at <= $1", [Date.now()]).catch(() => {
    });
    const signals = result.rows.map((row) => JSON.parse(row.data));
    res.json({ signals });
  } catch (err) {
    console.error("Failed to fetch doodle signals:", err);
    res.status(500).json({ error: "Failed to fetch doodle signals" });
  }
});
var doodle_default = router28;

// src/routes/stories.ts
import { randomUUID as randomUUID20 } from "crypto";
import { Router as Router30 } from "express";
var router29 = Router30();
function extractCloudinaryInfo(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return null;
    const resourceType = parts[1] ?? "image";
    let startIdx = uploadIdx + 1;
    if (parts[startIdx]?.match(/^v\d+$/)) startIdx++;
    const publicId = parts.slice(startIdx).join("/");
    if (!publicId) return null;
    const finalPublicId = resourceType === "image" ? publicId.replace(/\.[^.]+$/, "") : publicId;
    return { publicId: finalPublicId, resourceType };
  } catch {
    const match = url.match(/\/grova\/([^/?]+)/);
    if (match) return { publicId: `grova/${match[1].replace(/\.[^.]+$/, "")}`, resourceType: "image" };
    return null;
  }
}
router29.post("/stories", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = req.user.id;
    const media_url = req.body.mediaUrl ?? req.body.media_url;
    const kind = req.body.kind ?? "story";
    const text_overlay = req.body.text_overlay ?? req.body.textOverlay ?? null;
    if (!media_url) {
      res.status(400).json({ error: "media_url is required" });
      return;
    }
    if (media_url.startsWith("data:")) {
      res.status(400).json({ error: "To protect database storage, stories must be uploaded to Cloudinary instead of storing raw base64 data." });
      return;
    }
    const id = randomUUID20();
    const created_at = Date.now().toString();
    const expires_at = (Date.now() + 24 * 60 * 60 * 1e3).toString();
    await db_default.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at, text_overlay) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, media_url, kind, created_at, expires_at, text_overlay]
    );
    const result = await db_default.query(
      `SELECT 
        id, 
        author_id as "authorId", 
        media_url as "mediaUrl", 
        kind, 
        created_at as "createdAt", 
        expires_at as "expiresAt", 
        text_overlay as "textOverlay" 
      FROM stories 
      WHERE id = $1`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ error: "Failed to create story" });
  }
});
router29.get("/stories", authenticate, rateLimiters.read, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
  try {
    const now = Date.now();
    try {
      const expiredResult = await db_default.query(
        `SELECT id, media_url FROM stories WHERE CAST(expires_at AS BIGINT) <= $1`,
        [now]
      );
      if (expiredResult.rows.length > 0) {
        const placeholders = expiredResult.rows.map((_, i) => `$${i + 1}`).join(",");
        const ids = expiredResult.rows.map((r) => r.id);
        await db_default.execute(`DELETE FROM stories WHERE id IN (${placeholders})`, ids);
        expiredResult.rows.forEach((r) => {
          if (r.media_url) {
            const info = extractCloudinaryInfo(r.media_url);
            if (info) {
              deleteCloudinaryAsset(info.publicId, info.resourceType).catch(
                (err) => console.error("Failed to delete expired story from Cloudinary:", err)
              );
            } else {
              deleteImage(r.media_url).catch(() => {
              });
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to clean up expired stories:", err);
    }
    const result = await db_default.query(
      `SELECT 
        id, 
        author_id as "authorId", 
        media_url as "mediaUrl", 
        kind, 
        created_at as "createdAt", 
        expires_at as "expiresAt", 
        text_overlay as "textOverlay" 
      FROM stories 
      WHERE CAST(expires_at AS BIGINT) > $1 
      ORDER BY CAST(created_at AS BIGINT) ASC`,
      [now]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});
router29.delete("/stories/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const storyRes = await db_default.query(
      "SELECT media_url FROM stories WHERE id = $1 AND author_id = $2",
      [id, userId]
    );
    if (!storyRes.rows[0]) {
      res.status(404).json({ error: "Story not found or unauthorized" });
      return;
    }
    await db_default.execute(
      "DELETE FROM stories WHERE id = $1 AND author_id = $2",
      [id, userId]
    );
    if (storyRes.rows[0]?.media_url) {
      const info = extractCloudinaryInfo(storyRes.rows[0].media_url);
      if (info) {
        deleteCloudinaryAsset(info.publicId, info.resourceType).catch(
          (err) => console.error("Failed to delete story from Cloudinary:", err)
        );
      } else {
        deleteImage(storyRes.rows[0].media_url).catch(() => {
        });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});
var stories_default = router29;

// src/routes/avatar-notes.ts
import { randomUUID as randomUUID21 } from "crypto";
import { Router as Router31 } from "express";
var router30 = Router31();
var NOTE_TTL_MS = 24 * 60 * 60 * 1e3;
async function purgeExpiredNotes() {
  const now = Date.now();
  await db_default.execute("DELETE FROM avatar_notes WHERE CAST(expires_at AS BIGINT) <= $1", [now]);
}
router30.get("/notes", authenticate, rateLimiters.read, async (_req, res) => {
  try {
    await purgeExpiredNotes();
    const now = Date.now();
    const result = await db_default.query(
      `SELECT
        id,
        user_id as "userId",
        text,
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM avatar_notes
      WHERE CAST(expires_at AS BIGINT) > $1`,
      [now]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get avatar notes error:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});
router30.post("/notes", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = req.user.id;
    const text = String(req.body.text ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "Note text is required" });
      return;
    }
    if (text.length > 60) {
      res.status(400).json({ error: "Note must be 60 characters or less" });
      return;
    }
    const now = Date.now();
    const id = randomUUID21();
    const createdAt = now.toString();
    const expiresAt = (now + NOTE_TTL_MS).toString();
    await db_default.execute("DELETE FROM avatar_notes WHERE user_id = $1", [userId]);
    await db_default.execute(
      "INSERT INTO avatar_notes (id, user_id, text, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [id, userId, text, createdAt, expiresAt]
    );
    const displayName = await profileDisplayName(userId);
    await postCoupleActivity("note", userId, displayName, `shared a note: "${text}"`, `/?noteUserId=${userId}`).catch(() => {
    });
    const result = await db_default.query(
      `SELECT
        id,
        user_id as "userId",
        text,
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM avatar_notes
      WHERE id = $1`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create avatar note error:", error);
    res.status(500).json({ error: "Failed to share note" });
  }
});
router30.delete("/notes/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await db_default.query(
      "SELECT id FROM avatar_notes WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Note not found or unauthorized" });
      return;
    }
    await db_default.execute("DELETE FROM avatar_notes WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete avatar note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});
var avatar_notes_default = router30;

// src/routes/ai.ts
import { Router as Router32 } from "express";
var fal = __toESM(require_src3(), 1);
var router31 = Router32();
router31.post("/ai/inpaint", async (req, res) => {
  try {
    const { image, mask, prompt } = req.body;
    if (!process.env.FAL_KEY) {
      return res.status(500).json({ error: "FAL_KEY is missing in .env. Please add it to use AI features." });
    }
    logger.info("Sending inpainting request to Fal.ai...");
    const result = await fal.subscribe("fal-ai/fast-sdxl/inpainting", {
      input: {
        prompt: prompt || "clean background, empty, seamless, high quality, pure",
        negative_prompt: "object, person, artifact, blurry, mess, shapes, drawing",
        image_url: image,
        mask_url: mask
      }
    });
    if (!result || !result.images || !result.images[0]) {
      return res.status(500).json({ error: "Fal.ai failed to generate an image." });
    }
    return res.json({ resultUrl: result.images[0].url });
  } catch (error) {
    logger.error({ err: error }, "AI Inpaint failed");
    return res.status(500).json({ error: "AI Inpainting failed internally" });
  }
});
var ai_default = router31;

// src/routes/push.ts
import { Router as Router33 } from "express";

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path3, errorMaps, issueData } = params;
  const fullPath = [...path3, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path3, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path3;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// src/routes/push.ts
var router32 = Router33();
router32.post("/push/fcm-token", authenticate, async (req, res) => {
  const schema = external_exports.object({
    token: external_exports.string().min(1)
  });
  try {
    const { token } = schema.parse(req.body);
    const userId = req.user.id;
    await db_default.execute(
      `INSERT INTO fcm_tokens (user_id, token) 
       VALUES ($1, $2)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = EXCLUDED.token, created_at = CURRENT_TIMESTAMP`,
      [userId, token]
    );
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to register FCM token");
    res.status(400).json({ error: "Invalid request payload" });
  }
});
var push_default = router32;

// src/routes/index.ts
var router33 = Router34();
router33.use(sanitizeInput);
router33.use(csrfProtection);
router33.use(validateRouteParams({}));
router33.use(health_default);
router33.use(events_default);
router33.use(calendar_events_default);
router33.use(checkins_default);
router33.use(tasks_default);
router33.use(milestones_default);
router33.use(secret_notes_default);
router33.use(presence_default);
router33.use(profile_default);
router33.use(auth_default);
router33.use(messages_default);
router33.use(duas_default);
router33.use(call_default);
router33.use(images_default);
router33.use(notifications_default);
router33.use(twoFactor_default);
router33.use(reactions_default);
router33.use(typing_default);
router33.use(readReceipts_default);
router33.use(forward_default);
router33.use(edit_default);
router33.use(pin_default);
router33.use(schedule_default);
router33.use(media_default);
router33.use(hidden_messages_default);
router33.use(export_default);
router33.use(couple_sync_default);
router33.use(library_default);
router33.use("/doodle", doodle_default);
router33.use(stories_default);
router33.use(avatar_notes_default);
router33.use(ai_default);
router33.use(push_default);
var routes_default = router33;

// src/lib/compression.ts
import compression from "compression";
function setupCompression(app2) {
  app2.use(compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024,
    // Only compress responses larger than 1KB
    level: 6
    // Compression level (1-9)
  }));
}

// src/app.ts
if (!process.env.VERCEL) {
  validateEnv();
}
var app = express();
app.disable("x-powered-by");
app.use((req, _res, next) => {
  const url = req.url ?? "";
  const pathOnly = url.split("?")[0];
  const qs = url.includes("?") ? url.slice(url.indexOf("?")) : "";
  if (!pathOnly.startsWith("/api/") && !pathOnly.startsWith("/api")) {
    if (pathOnly.startsWith("/auth/") || pathOnly === "/healthz" || pathOnly.startsWith("/messages") || pathOnly.startsWith("/profile")) {
      req.url = `/api${pathOnly}${qs}`;
    }
  }
  next();
});
app.set("trust proxy", process.env.TRUSTED_PROXIES || (process.env.NODE_ENV === "production" ? "loopback, linklocal, uniquelocal" : false));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0]
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
setupCompression(app);
setupSecurity(app);
var isDev = process.env.NODE_ENV !== "production";
function buildAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ].filter(Boolean).map((h) => h.startsWith("http") ? h : `https://${h}`);
  const devDefaults = ["http://localhost:5000", "http://127.0.0.1:5000"];
  const merged = [.../* @__PURE__ */ new Set([...fromEnv, ...vercelHosts, ...isDev ? devDefaults : []])];
  return merged.length > 0 ? merged : devDefaults;
}
var allowedOrigins = buildAllowedOrigins();
var corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Primary-Token",
    "X-Client-Id",
    "X-Client-Origin",
    "X-File-Name"
  ]
};
function isOriginAllowed(origin, requestHost) {
  if (!origin) return true;
  if (isDev) {
    if (origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("10.") || origin.includes("192.")) {
      return true;
    }
    logger.warn({ origin, allowedOrigins }, "CORS request from unexpected origin");
    return true;
  }
  if (allowedOrigins.includes(origin)) return true;
  try {
    const originHost = new URL(origin).host;
    if (originHost && requestHost && originHost === requestHost) return true;
  } catch {
  }
  return false;
}
app.use((req, res, next) => {
  const requestHost = String(req.headers.host || "").split(":")[0];
  cors({
    ...corsOptions,
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, requestHost)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  })(req, res, next);
});
app.use(cookieParser());
app.post(
  "/api/media/upload-binary",
  rateLimiters.upload,
  csrfProtection,
  authenticate,
  express.raw({ type: () => true, limit: 200 * 1024 * 1024 }),
  handleBinaryMediaUpload
);
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use("/api", blockSuspiciousBots);
app.use("/api", sanitizeInput);
app.use("/api", csrfProtection);
var limiter = rateLimit2({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "production" ? 600 : 4e3,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false
});
app.use("/api", limiter);
app.use("/api", routes_default);
var staticDir = path2.resolve(
  path2.dirname(fileURLToPath2(import.meta.url)),
  "../../instagram-clone/dist"
);
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path2.join(staticDir, "index.html"));
  });
  logger.info({ staticDir }, "Serving Grova frontend");
} else if (process.env.NODE_ENV === "production") {
  logger.warn(
    { staticDir },
    "Frontend dist not found \u2014 run pnpm build:grova before pnpm start:grova"
  );
}
var app_default = app;

// src/vercel-entry.ts
process.env.VERCEL ??= "1";
var ready = null;
var readyError = null;
function ensureReady() {
  if (readyError) return Promise.reject(new Error(readyError));
  if (!ready) {
    ready = (async () => {
      try {
        validateEnv();
        const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
        if (!encryptionPassword) {
          throw new Error("ENCRYPTION_PASSWORD is required");
        }
        if (!authenticateEncryption(encryptionPassword)) {
          throw new Error("Invalid ENCRYPTION_PASSWORD");
        }
        await initDb();
        logger.info("Vercel handler: database ready");
      } catch (err) {
        ready = null;
        readyError = err instanceof Error ? err.message : String(err);
        throw err;
      }
    })();
  }
  return ready;
}
function pathnameFromHeader(raw) {
  try {
    const pathname = raw.startsWith("http") ? new URL(raw).pathname : raw.split("?")[0];
    if (!pathname.startsWith("/api/") || pathname === "/api/") return null;
    return pathname;
  } catch {
    return null;
  }
}
function restoreRequestPath(req) {
  const rawUrl = req.url ?? "/";
  const qIndex = rawUrl.indexOf("?");
  const pathOnly = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
  if (pathOnly.length > "/api".length && pathOnly !== "/api/") return;
  const headers = req.headers;
  const headerCandidates = [
    headers["x-vercel-original-url"],
    headers["x-invoke-path"],
    headers["x-forwarded-uri"],
    headers["x-original-url"],
    headers["x-matched-path"],
    headers["x-vercel-sc-path"]
  ].filter((h) => typeof h === "string" && h.length > 0);
  for (const raw of headerCandidates) {
    const pathname = pathnameFromHeader(raw);
    if (!pathname) continue;
    const qsFromReq = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
    const qsFromRaw = raw.includes("?") ? `?${raw.split("?").slice(1).join("?")}` : "";
    req.url = pathname + (qsFromReq || qsFromRaw);
    return;
  }
  try {
    const parsed = new URL(rawUrl, "http://grova.internal");
    const sub = parsed.searchParams.get("__path");
    if (sub) {
      parsed.searchParams.delete("__path");
      const restQs = parsed.search;
      const decoded = decodeURIComponent(sub).replace(/^\//, "");
      req.url = `/api/${decoded}${restQs}`;
    }
  } catch {
  }
}
function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
async function handler(req, res) {
  restoreRequestPath(req);
  try {
    await ensureReady();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[vercel] startup failed:", message);
    sendJson(res, 503, {
      error: message,
      hint: "Fix Environment Variables on Vercel (Settings \u2192 Environment Variables) and redeploy."
    });
    return;
  }
  return app_default(req, res);
}
export {
  handler as default
};
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
//# sourceMappingURL=vercel-entry.mjs.map
