/**
    * @x-viewer/builder v0.1.0 build Sat Aug 23 2025
    * undefined
    * Copyright 2025 
    * @license 
    */
import { THREE, THREEAddons, LoadingHelper, MarkerDrawable, log } from '@x-viewer/core';
const { BufferAttribute, Vector3, Vector2, Plane, Line3, Triangle, Sphere, Matrix4, Box3, REVISION, BackSide, DoubleSide, FrontSide, Ray, Vector4, Mesh, Matrix3  } = THREE;

/**
 * Model/asset property data type.
 */
var DataType;
(function (DataType) {
    DataType["Object"] = "Object";
    DataType["String"] = "String";
    DataType["Number"] = "Number";
    DataType["Boolean"] = "Boolean";
    DataType["Color"] = "Color";
    DataType["Image"] = "Image";
    DataType["Vector2"] = "Vector2";
    DataType["Vector3"] = "Vector3";
    DataType["Vector3Array"] = "Vector3Array";
})(DataType || (DataType = {}));
let defaultPath = "/assets/";
function setModelAssetPath(path) {
    defaultPath = path;
}
function getModelAssetPath() {
    return defaultPath;
}
/**
 * Assets cache map.
 * Key is the asset id.
 */
const assetMap = new Map();

/**
 * Merges defaultCfg to targetCfg.
 * If a property in targetCfg is null or undefined, it will be set to the default value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeConfig(targetCfg, defaultCfg) {
    for (const key in defaultCfg) {
        if (Object.prototype.hasOwnProperty.call(defaultCfg, key)) {
            if (targetCfg[key] == null) {
                targetCfg[key] = defaultCfg[key];
            }
            if (isObject(targetCfg[key]) && isObject(defaultCfg[key])) {
                // If both are objects, merge them
                targetCfg[key] = Object.assign(Object.assign({}, defaultCfg[key]), targetCfg[key]);
            }
        }
    }
}
//  // eslint-disable-next-line
function schemaToDefaultConfig(schema) {
    const cfg = {}; // eslint-disable-line
    for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
            cfg[key] = schema[key].value;
        }
    }
    return cfg;
}
/**
 * Get Thumbnail filename full path.
 * @param filename Thumbnail filename with extention
 */
function getThumbnailPath(dirName, filename) {
    return `${getModelAssetPath()}${dirName}/${filename}`;
}
function isAbsoluteUrl(url) {
    const r = new RegExp("^(?:[a-z]+:)?//", "i");
    return r.test(url);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(params) {
    return Object.prototype.toString.call(params) === "[object Object]";
}
function isTGAImage(filename) {
    return filename.toLowerCase().endsWith(`.tga`);
}
function isDDSImage(filename) {
    return filename.toLowerCase().endsWith(`.dds`);
}

/**
 * Registers a new asset creator.
 * @param assetId The unique identifier for the asset.
 * @param creator The asset creator function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function register(assetId, summary, creator, config, schema) {
    if (assetMap.has(assetId)) {
        throw new Error(`Asset with id ${assetId} already exists.`);
    }
    assetMap.set(assetId, { summary, creator, config, schema });
}
/**
 * Loads a registered asset by its unique identifier.
 * @param id The unique identifier for the asset to load.
 * @param cfg The config for the asset.
 * @returns The created object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadAsset(assetId, cfg = {}) {
    if (!assetMap.has(assetId)) {
        throw new Error(`No asset found for id ${assetId}, please register it first.`);
    }
    const asset = assetMap.get(assetId);
    const creator = asset.creator;
    if (!creator) {
        throw new Error(`No creator found for id ${assetId}.`);
    }
    return creator(cfg);
}
function copyAndRegister(srcAssetId, destAssetId, summary, config, schema) {
    if (!assetMap.has(srcAssetId)) {
        throw new Error(`No creator found for id ${srcAssetId}.`);
    }
    const asset = assetMap.get(srcAssetId);
    const creator = asset.creator;
    if (!creator) {
        throw new Error(`No creator found for id ${srcAssetId}.`);
    }
    return register(destAssetId, summary, async (cfg = {}) => {
        mergeConfig(cfg, config);
        return creator(cfg);
    }, config, schema);
}
/**
 * Gets a list of all registered assetInfos.
 * @returns An array of all registered assetInfos.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAssetInfoList() {
    const list = Array.from(assetMap.values());
    return list;
}
/**
 * Gets registered asset info by assetId.
 */
function getAssetInfo(assetId) {
    return assetMap.get(assetId);
}
/**
 * Gets registered asset creator by assetId.
 */
function getAssetCreator(assetId) {
    var _a;
    const asset = assetMap.get(assetId);
    return (_a = asset === null || asset === void 0 ? void 0 : asset.creator) !== null && _a !== void 0 ? _a : null;
}

THREE.Cache.enabled = true;
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const tgaLoader = new THREEAddons.TGALoader(loadingManager);
const ddsLoader = new THREEAddons.DDSLoader(loadingManager);
const gltfLoader = new THREEAddons.GLTFLoader(loadingManager);
const dracoLoader = new THREEAddons.DRACOLoader(loadingManager);
dracoLoader.setDecoderPath("./");
gltfLoader.setDRACOLoader(dracoLoader);
const loadingHelper = new LoadingHelper();
// const mtlLoader = new THREEAddons.MTLLoader(loadingManager);
// const objLoader = new THREEAddons.OBJLoader(loadingManager);
const textureCache = new Map();
async function loadImage(textureCfg, useCache = true) {
    const { map, repeat } = textureCfg; // maybe more config
    if (!map) {
        console.warn("[Loader] Invalid textureCfg! Expected to have 'map' field but get:", textureCfg);
        return Promise.resolve(undefined); // return an empty texture
    }
    const cacheKey = JSON.stringify(textureCfg);
    const fullUrl = isAbsoluteUrl(map) ? map : getModelAssetPath() + map;
    if (useCache && textureCache.has(cacheKey)) {
        return Promise.resolve(textureCache.get(cacheKey));
    }
    let texture;
    try {
        if (isTGAImage(fullUrl)) {
            texture = await tgaLoader.loadAsync(fullUrl);
        }
        else if (isDDSImage(fullUrl)) {
            texture = await ddsLoader.loadAsync(fullUrl);
        }
        else {
            // at this time, there maybe another request is calling for the same texture,
            // anyway, let's load again, and do a secondary check after laoded.
            texture = await textureLoader.loadAsync(fullUrl);
        }
        if (useCache && textureCache.has(cacheKey)) {
            return Promise.resolve(textureCache.get(cacheKey));
        }
        if (repeat) {
            // todo:
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(...repeat);
        }
        if (useCache) {
            textureCache.set(cacheKey, texture);
        }
    }
    catch (err) {
        console.error(`[Loader] Error loading image '${fullUrl}'`);
        return Promise.resolve(undefined);
    }
    return Promise.resolve(texture);
}
async function loadModel(url) {
    if (!url) {
        return Promise.resolve();
    }
    if (!isAbsoluteUrl(url)) {
        url = getModelAssetPath() + url;
    }
    return loadingHelper.loadModel(url);
}
// export function loadGltf(url: string) {
//     return gltfLoader.loadAsync(getModelAssetPath() + url);
// }
// export async function loadObj(url: string, mtlUrl?: string) {
//     if (mtlUrl) {
//         const materials = await mtlLoader.loadAsync(getModelAssetPath() + mtlUrl);
//         materials.preload();
//         return objLoader.setMaterials(materials).loadAsync(getModelAssetPath() + url);
//     }
//     return objLoader.loadAsync(getModelAssetPath() + url);
// }

function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}

function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}

function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}

function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}

function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}

function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}

function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
    return t.__proto__ = e, t;
  }, _setPrototypeOf(t, e);
}

function _inherits(t, e) {
  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
  t.prototype = Object.create(e && e.prototype, {
    constructor: {
      value: t,
      writable: !0,
      configurable: !0
    }
  }), Object.defineProperty(t, "prototype", {
    writable: !1
  }), e && _setPrototypeOf(t, e);
}

function _possibleConstructorReturn(t, e) {
  if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
  return _assertThisInitialized(t);
}

function _getPrototypeOf(t) {
  return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, _getPrototypeOf(t);
}

function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}

function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}

function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}

function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _toArray(r) {
  return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest();
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var consoleLogger = {
  type: 'logger',
  log: function log(args) {
    this.output('log', args);
  },
  warn: function warn(args) {
    this.output('warn', args);
  },
  error: function error(args) {
    this.output('error', args);
  },
  output: function output(type, args) {
    if (console && console[type]) console[type].apply(console, args);
  }
};

var Logger = function () {
  function Logger(concreteLogger) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Logger);

    this.init(concreteLogger, options);
  }

  _createClass(Logger, [{
    key: "init",
    value: function init(concreteLogger) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.prefix = options.prefix || 'i18next:';
      this.logger = concreteLogger || consoleLogger;
      this.options = options;
      this.debug = options.debug;
    }
  }, {
    key: "setDebug",
    value: function setDebug(bool) {
      this.debug = bool;
    }
  }, {
    key: "log",
    value: function log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this.forward(args, 'log', '', true);
    }
  }, {
    key: "warn",
    value: function warn() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return this.forward(args, 'warn', '', true);
    }
  }, {
    key: "error",
    value: function error() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return this.forward(args, 'error', '');
    }
  }, {
    key: "deprecate",
    value: function deprecate() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return this.forward(args, 'warn', 'WARNING DEPRECATED: ', true);
    }
  }, {
    key: "forward",
    value: function forward(args, lvl, prefix, debugOnly) {
      if (debugOnly && !this.debug) return null;
      if (typeof args[0] === 'string') args[0] = "".concat(prefix).concat(this.prefix, " ").concat(args[0]);
      return this.logger[lvl](args);
    }
  }, {
    key: "create",
    value: function create(moduleName) {
      return new Logger(this.logger, _objectSpread(_objectSpread({}, {
        prefix: "".concat(this.prefix, ":").concat(moduleName, ":")
      }), this.options));
    }
  }, {
    key: "clone",
    value: function clone(options) {
      options = options || this.options;
      options.prefix = options.prefix || this.prefix;
      return new Logger(this.logger, options);
    }
  }]);

  return Logger;
}();

var baseLogger = new Logger();

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this.observers = {};
  }

  _createClass(EventEmitter, [{
    key: "on",
    value: function on(events, listener) {
      var _this = this;

      events.split(' ').forEach(function (event) {
        _this.observers[event] = _this.observers[event] || [];

        _this.observers[event].push(listener);
      });
      return this;
    }
  }, {
    key: "off",
    value: function off(event, listener) {
      if (!this.observers[event]) return;

      if (!listener) {
        delete this.observers[event];
        return;
      }

      this.observers[event] = this.observers[event].filter(function (l) {
        return l !== listener;
      });
    }
  }, {
    key: "emit",
    value: function emit(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (this.observers[event]) {
        var cloned = [].concat(this.observers[event]);
        cloned.forEach(function (observer) {
          observer.apply(void 0, args);
        });
      }

      if (this.observers['*']) {
        var _cloned = [].concat(this.observers['*']);

        _cloned.forEach(function (observer) {
          observer.apply(observer, [event].concat(args));
        });
      }
    }
  }]);

  return EventEmitter;
}();

function defer() {
  var res;
  var rej;
  var promise = new Promise(function (resolve, reject) {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
}
function makeString(object) {
  if (object == null) return '';
  return '' + object;
}
function copy(a, s, t) {
  a.forEach(function (m) {
    if (s[m]) t[m] = s[m];
  });
}

function getLastOfPath(object, path, Empty) {
  function cleanKey(key) {
    return key && key.indexOf('###') > -1 ? key.replace(/###/g, '.') : key;
  }

  function canNotTraverseDeeper() {
    return !object || typeof object === 'string';
  }

  var stack = typeof path !== 'string' ? [].concat(path) : path.split('.');

  while (stack.length > 1) {
    if (canNotTraverseDeeper()) return {};
    var key = cleanKey(stack.shift());
    if (!object[key] && Empty) object[key] = new Empty();

    if (Object.prototype.hasOwnProperty.call(object, key)) {
      object = object[key];
    } else {
      object = {};
    }
  }

  if (canNotTraverseDeeper()) return {};
  return {
    obj: object,
    k: cleanKey(stack.shift())
  };
}

function setPath(object, path, newValue) {
  var _getLastOfPath = getLastOfPath(object, path, Object),
      obj = _getLastOfPath.obj,
      k = _getLastOfPath.k;

  obj[k] = newValue;
}
function pushPath(object, path, newValue, concat) {
  var _getLastOfPath2 = getLastOfPath(object, path, Object),
      obj = _getLastOfPath2.obj,
      k = _getLastOfPath2.k;

  obj[k] = obj[k] || [];
  obj[k].push(newValue);
}
function getPath(object, path) {
  var _getLastOfPath3 = getLastOfPath(object, path),
      obj = _getLastOfPath3.obj,
      k = _getLastOfPath3.k;

  if (!obj) return undefined;
  return obj[k];
}
function getPathWithDefaults(data, defaultData, key) {
  var value = getPath(data, key);

  if (value !== undefined) {
    return value;
  }

  return getPath(defaultData, key);
}
function deepExtend(target, source, overwrite) {
  for (var prop in source) {
    if (prop !== '__proto__' && prop !== 'constructor') {
      if (prop in target) {
        if (typeof target[prop] === 'string' || target[prop] instanceof String || typeof source[prop] === 'string' || source[prop] instanceof String) {
          if (overwrite) target[prop] = source[prop];
        } else {
          deepExtend(target[prop], source[prop], overwrite);
        }
      } else {
        target[prop] = source[prop];
      }
    }
  }

  return target;
}
function regexEscape(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
var _entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
};
function escape(data) {
  if (typeof data === 'string') {
    return data.replace(/[&<>"'\/]/g, function (s) {
      return _entityMap[s];
    });
  }

  return data;
}
var isIE10 = typeof window !== 'undefined' && window.navigator && typeof window.navigator.userAgentData === 'undefined' && window.navigator.userAgent && window.navigator.userAgent.indexOf('MSIE') > -1;
var chars = [' ', ',', '?', '!', ';'];
function looksLikeObjectPath(key, nsSeparator, keySeparator) {
  nsSeparator = nsSeparator || '';
  keySeparator = keySeparator || '';
  var possibleChars = chars.filter(function (c) {
    return nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0;
  });
  if (possibleChars.length === 0) return true;
  var r = new RegExp("(".concat(possibleChars.map(function (c) {
    return c === '?' ? '\\?' : c;
  }).join('|'), ")"));
  var matched = !r.test(key);

  if (!matched) {
    var ki = key.indexOf(keySeparator);

    if (ki > 0 && !r.test(key.substring(0, ki))) {
      matched = true;
    }
  }

  return matched;
}

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function deepFind(obj, path) {
  var keySeparator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '.';
  if (!obj) return undefined;
  if (obj[path]) return obj[path];
  var paths = path.split(keySeparator);
  var current = obj;

  for (var i = 0; i < paths.length; ++i) {
    if (!current) return undefined;

    if (typeof current[paths[i]] === 'string' && i + 1 < paths.length) {
      return undefined;
    }

    if (current[paths[i]] === undefined) {
      var j = 2;
      var p = paths.slice(i, i + j).join(keySeparator);
      var mix = current[p];

      while (mix === undefined && paths.length > i + j) {
        j++;
        p = paths.slice(i, i + j).join(keySeparator);
        mix = current[p];
      }

      if (mix === undefined) return undefined;
      if (mix === null) return null;

      if (path.endsWith(p)) {
        if (typeof mix === 'string') return mix;
        if (p && typeof mix[p] === 'string') return mix[p];
      }

      var joinedPath = paths.slice(i + j).join(keySeparator);
      if (joinedPath) return deepFind(mix, joinedPath, keySeparator);
      return undefined;
    }

    current = current[paths[i]];
  }

  return current;
}

var ResourceStore = function (_EventEmitter) {
  _inherits(ResourceStore, _EventEmitter);

  var _super = _createSuper(ResourceStore);

  function ResourceStore(data) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      ns: ['translation'],
      defaultNS: 'translation'
    };

    _classCallCheck(this, ResourceStore);

    _this = _super.call(this);

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    _this.data = data || {};
    _this.options = options;

    if (_this.options.keySeparator === undefined) {
      _this.options.keySeparator = '.';
    }

    if (_this.options.ignoreJSONStructure === undefined) {
      _this.options.ignoreJSONStructure = true;
    }

    return _this;
  }

  _createClass(ResourceStore, [{
    key: "addNamespaces",
    value: function addNamespaces(ns) {
      if (this.options.ns.indexOf(ns) < 0) {
        this.options.ns.push(ns);
      }
    }
  }, {
    key: "removeNamespaces",
    value: function removeNamespaces(ns) {
      var index = this.options.ns.indexOf(ns);

      if (index > -1) {
        this.options.ns.splice(index, 1);
      }
    }
  }, {
    key: "getResource",
    value: function getResource(lng, ns, key) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var ignoreJSONStructure = options.ignoreJSONStructure !== undefined ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
      var path = [lng, ns];
      if (key && typeof key !== 'string') path = path.concat(key);
      if (key && typeof key === 'string') path = path.concat(keySeparator ? key.split(keySeparator) : key);

      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
      }

      var result = getPath(this.data, path);
      if (result || !ignoreJSONStructure || typeof key !== 'string') return result;
      return deepFind(this.data && this.data[lng] && this.data[lng][ns], key, keySeparator);
    }
  }, {
    key: "addResource",
    value: function addResource(lng, ns, key, value) {
      var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
        silent: false
      };
      var keySeparator = this.options.keySeparator;
      if (keySeparator === undefined) keySeparator = '.';
      var path = [lng, ns];
      if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);

      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
        value = ns;
        ns = path[1];
      }

      this.addNamespaces(ns);
      setPath(this.data, path, value);
      if (!options.silent) this.emit('added', lng, ns, key, value);
    }
  }, {
    key: "addResources",
    value: function addResources(lng, ns, resources) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
        silent: false
      };

      for (var m in resources) {
        if (typeof resources[m] === 'string' || Object.prototype.toString.apply(resources[m]) === '[object Array]') this.addResource(lng, ns, m, resources[m], {
          silent: true
        });
      }

      if (!options.silent) this.emit('added', lng, ns, resources);
    }
  }, {
    key: "addResourceBundle",
    value: function addResourceBundle(lng, ns, resources, deep, overwrite) {
      var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
        silent: false
      };
      var path = [lng, ns];

      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
        deep = resources;
        resources = ns;
        ns = path[1];
      }

      this.addNamespaces(ns);
      var pack = getPath(this.data, path) || {};

      if (deep) {
        deepExtend(pack, resources, overwrite);
      } else {
        pack = _objectSpread$1(_objectSpread$1({}, pack), resources);
      }

      setPath(this.data, path, pack);
      if (!options.silent) this.emit('added', lng, ns, resources);
    }
  }, {
    key: "removeResourceBundle",
    value: function removeResourceBundle(lng, ns) {
      if (this.hasResourceBundle(lng, ns)) {
        delete this.data[lng][ns];
      }

      this.removeNamespaces(ns);
      this.emit('removed', lng, ns);
    }
  }, {
    key: "hasResourceBundle",
    value: function hasResourceBundle(lng, ns) {
      return this.getResource(lng, ns) !== undefined;
    }
  }, {
    key: "getResourceBundle",
    value: function getResourceBundle(lng, ns) {
      if (!ns) ns = this.options.defaultNS;
      if (this.options.compatibilityAPI === 'v1') return _objectSpread$1(_objectSpread$1({}, {}), this.getResource(lng, ns));
      return this.getResource(lng, ns);
    }
  }, {
    key: "getDataByLanguage",
    value: function getDataByLanguage(lng) {
      return this.data[lng];
    }
  }, {
    key: "hasLanguageSomeTranslations",
    value: function hasLanguageSomeTranslations(lng) {
      var data = this.getDataByLanguage(lng);
      var n = data && Object.keys(data) || [];
      return !!n.find(function (v) {
        return data[v] && Object.keys(data[v]).length > 0;
      });
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.data;
    }
  }]);

  return ResourceStore;
}(EventEmitter);

var postProcessor = {
  processors: {},
  addPostProcessor: function addPostProcessor(module) {
    this.processors[module.name] = module;
  },
  handle: function handle(processors, value, key, options, translator) {
    var _this = this;

    processors.forEach(function (processor) {
      if (_this.processors[processor]) value = _this.processors[processor].process(value, key, options, translator);
    });
    return value;
  }
};

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var checkedLoadedFor = {};

var Translator = function (_EventEmitter) {
  _inherits(Translator, _EventEmitter);

  var _super = _createSuper$1(Translator);

  function Translator(services) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Translator);

    _this = _super.call(this);

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    copy(['resourceStore', 'languageUtils', 'pluralResolver', 'interpolator', 'backendConnector', 'i18nFormat', 'utils'], services, _assertThisInitialized(_this));
    _this.options = options;

    if (_this.options.keySeparator === undefined) {
      _this.options.keySeparator = '.';
    }

    _this.logger = baseLogger.create('translator');
    return _this;
  }

  _createClass(Translator, [{
    key: "changeLanguage",
    value: function changeLanguage(lng) {
      if (lng) this.language = lng;
    }
  }, {
    key: "exists",
    value: function exists(key) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        interpolation: {}
      };

      if (key === undefined || key === null) {
        return false;
      }

      var resolved = this.resolve(key, options);
      return resolved && resolved.res !== undefined;
    }
  }, {
    key: "extractFromKey",
    value: function extractFromKey(key, options) {
      var nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : this.options.nsSeparator;
      if (nsSeparator === undefined) nsSeparator = ':';
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var namespaces = options.ns || this.options.defaultNS || [];
      var wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
      var seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !options.keySeparator && !this.options.userDefinedNsSeparator && !options.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);

      if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
        var m = key.match(this.interpolator.nestingRegexp);

        if (m && m.length > 0) {
          return {
            key: key,
            namespaces: namespaces
          };
        }

        var parts = key.split(nsSeparator);
        if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
        key = parts.join(keySeparator);
      }

      if (typeof namespaces === 'string') namespaces = [namespaces];
      return {
        key: key,
        namespaces: namespaces
      };
    }
  }, {
    key: "translate",
    value: function translate(keys, options, lastKey) {
      var _this2 = this;

      if (_typeof(options) !== 'object' && this.options.overloadTranslationOptionHandler) {
        options = this.options.overloadTranslationOptionHandler(arguments);
      }

      if (!options) options = {};
      if (keys === undefined || keys === null) return '';
      if (!Array.isArray(keys)) keys = [String(keys)];
      var returnDetails = options.returnDetails !== undefined ? options.returnDetails : this.options.returnDetails;
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;

      var _this$extractFromKey = this.extractFromKey(keys[keys.length - 1], options),
          key = _this$extractFromKey.key,
          namespaces = _this$extractFromKey.namespaces;

      var namespace = namespaces[namespaces.length - 1];
      var lng = options.lng || this.language;
      var appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;

      if (lng && lng.toLowerCase() === 'cimode') {
        if (appendNamespaceToCIMode) {
          var nsSeparator = options.nsSeparator || this.options.nsSeparator;

          if (returnDetails) {
            resolved.res = "".concat(namespace).concat(nsSeparator).concat(key);
            return resolved;
          }

          return "".concat(namespace).concat(nsSeparator).concat(key);
        }

        if (returnDetails) {
          resolved.res = key;
          return resolved;
        }

        return key;
      }

      var resolved = this.resolve(keys, options);
      var res = resolved && resolved.res;
      var resUsedKey = resolved && resolved.usedKey || key;
      var resExactUsedKey = resolved && resolved.exactUsedKey || key;
      var resType = Object.prototype.toString.apply(res);
      var noObject = ['[object Number]', '[object Function]', '[object RegExp]'];
      var joinArrays = options.joinArrays !== undefined ? options.joinArrays : this.options.joinArrays;
      var handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
      var handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number';

      if (handleAsObjectInI18nFormat && res && handleAsObject && noObject.indexOf(resType) < 0 && !(typeof joinArrays === 'string' && resType === '[object Array]')) {
        if (!options.returnObjects && !this.options.returnObjects) {
          if (!this.options.returnedObjectHandler) {
            this.logger.warn('accessing an object - but returnObjects options is not enabled!');
          }

          var r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, res, _objectSpread$2(_objectSpread$2({}, options), {}, {
            ns: namespaces
          })) : "key '".concat(key, " (").concat(this.language, ")' returned an object instead of string.");

          if (returnDetails) {
            resolved.res = r;
            return resolved;
          }

          return r;
        }

        if (keySeparator) {
          var resTypeIsArray = resType === '[object Array]';
          var copy = resTypeIsArray ? [] : {};
          var newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;

          for (var m in res) {
            if (Object.prototype.hasOwnProperty.call(res, m)) {
              var deepKey = "".concat(newKeyToUse).concat(keySeparator).concat(m);
              copy[m] = this.translate(deepKey, _objectSpread$2(_objectSpread$2({}, options), {
                joinArrays: false,
                ns: namespaces
              }));
              if (copy[m] === deepKey) copy[m] = res[m];
            }
          }

          res = copy;
        }
      } else if (handleAsObjectInI18nFormat && typeof joinArrays === 'string' && resType === '[object Array]') {
        res = res.join(joinArrays);
        if (res) res = this.extendTranslation(res, keys, options, lastKey);
      } else {
        var usedDefault = false;
        var usedKey = false;
        var needsPluralHandling = options.count !== undefined && typeof options.count !== 'string';
        var hasDefaultValue = Translator.hasDefaultValue(options);
        var defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, options) : '';
        var defaultValue = options["defaultValue".concat(defaultValueSuffix)] || options.defaultValue;

        if (!this.isValidLookup(res) && hasDefaultValue) {
          usedDefault = true;
          res = defaultValue;
        }

        if (!this.isValidLookup(res)) {
          usedKey = true;
          res = key;
        }

        var missingKeyNoValueFallbackToKey = options.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
        var resForMissing = missingKeyNoValueFallbackToKey && usedKey ? undefined : res;
        var updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;

        if (usedKey || usedDefault || updateMissing) {
          this.logger.log(updateMissing ? 'updateKey' : 'missingKey', lng, namespace, key, updateMissing ? defaultValue : res);

          if (keySeparator) {
            var fk = this.resolve(key, _objectSpread$2(_objectSpread$2({}, options), {}, {
              keySeparator: false
            }));
            if (fk && fk.res) this.logger.warn('Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.');
          }

          var lngs = [];
          var fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, options.lng || this.language);

          if (this.options.saveMissingTo === 'fallback' && fallbackLngs && fallbackLngs[0]) {
            for (var i = 0; i < fallbackLngs.length; i++) {
              lngs.push(fallbackLngs[i]);
            }
          } else if (this.options.saveMissingTo === 'all') {
            lngs = this.languageUtils.toResolveHierarchy(options.lng || this.language);
          } else {
            lngs.push(options.lng || this.language);
          }

          var send = function send(l, k, specificDefaultValue) {
            var defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;

            if (_this2.options.missingKeyHandler) {
              _this2.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, options);
            } else if (_this2.backendConnector && _this2.backendConnector.saveMissing) {
              _this2.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, options);
            }

            _this2.emit('missingKey', l, namespace, k, res);
          };

          if (this.options.saveMissing) {
            if (this.options.saveMissingPlurals && needsPluralHandling) {
              lngs.forEach(function (language) {
                _this2.pluralResolver.getSuffixes(language, options).forEach(function (suffix) {
                  send([language], key + suffix, options["defaultValue".concat(suffix)] || defaultValue);
                });
              });
            } else {
              send(lngs, key, defaultValue);
            }
          }
        }

        res = this.extendTranslation(res, keys, options, resolved, lastKey);
        if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = "".concat(namespace, ":").concat(key);

        if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
          if (this.options.compatibilityAPI !== 'v1') {
            res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? "".concat(namespace, ":").concat(key) : key, usedDefault ? res : undefined);
          } else {
            res = this.options.parseMissingKeyHandler(res);
          }
        }
      }

      if (returnDetails) {
        resolved.res = res;
        return resolved;
      }

      return res;
    }
  }, {
    key: "extendTranslation",
    value: function extendTranslation(res, key, options, resolved, lastKey) {
      var _this3 = this;

      if (this.i18nFormat && this.i18nFormat.parse) {
        res = this.i18nFormat.parse(res, _objectSpread$2(_objectSpread$2({}, this.options.interpolation.defaultVariables), options), resolved.usedLng, resolved.usedNS, resolved.usedKey, {
          resolved: resolved
        });
      } else if (!options.skipInterpolation) {
        if (options.interpolation) this.interpolator.init(_objectSpread$2(_objectSpread$2({}, options), {
          interpolation: _objectSpread$2(_objectSpread$2({}, this.options.interpolation), options.interpolation)
        }));
        var skipOnVariables = typeof res === 'string' && (options && options.interpolation && options.interpolation.skipOnVariables !== undefined ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
        var nestBef;

        if (skipOnVariables) {
          var nb = res.match(this.interpolator.nestingRegexp);
          nestBef = nb && nb.length;
        }

        var data = options.replace && typeof options.replace !== 'string' ? options.replace : options;
        if (this.options.interpolation.defaultVariables) data = _objectSpread$2(_objectSpread$2({}, this.options.interpolation.defaultVariables), data);
        res = this.interpolator.interpolate(res, data, options.lng || this.language, options);

        if (skipOnVariables) {
          var na = res.match(this.interpolator.nestingRegexp);
          var nestAft = na && na.length;
          if (nestBef < nestAft) options.nest = false;
        }

        if (options.nest !== false) res = this.interpolator.nest(res, function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (lastKey && lastKey[0] === args[0] && !options.context) {
            _this3.logger.warn("It seems you are nesting recursively key: ".concat(args[0], " in key: ").concat(key[0]));

            return null;
          }

          return _this3.translate.apply(_this3, args.concat([key]));
        }, options);
        if (options.interpolation) this.interpolator.reset();
      }

      var postProcess = options.postProcess || this.options.postProcess;
      var postProcessorNames = typeof postProcess === 'string' ? [postProcess] : postProcess;

      if (res !== undefined && res !== null && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
        res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? _objectSpread$2({
          i18nResolved: resolved
        }, options) : options, this);
      }

      return res;
    }
  }, {
    key: "resolve",
    value: function resolve(keys) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var found;
      var usedKey;
      var exactUsedKey;
      var usedLng;
      var usedNS;
      if (typeof keys === 'string') keys = [keys];
      keys.forEach(function (k) {
        if (_this4.isValidLookup(found)) return;

        var extracted = _this4.extractFromKey(k, options);

        var key = extracted.key;
        usedKey = key;
        var namespaces = extracted.namespaces;
        if (_this4.options.fallbackNS) namespaces = namespaces.concat(_this4.options.fallbackNS);
        var needsPluralHandling = options.count !== undefined && typeof options.count !== 'string';

        var needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && _this4.pluralResolver.shouldUseIntlApi();

        var needsContextHandling = options.context !== undefined && (typeof options.context === 'string' || typeof options.context === 'number') && options.context !== '';
        var codes = options.lngs ? options.lngs : _this4.languageUtils.toResolveHierarchy(options.lng || _this4.language, options.fallbackLng);
        namespaces.forEach(function (ns) {
          if (_this4.isValidLookup(found)) return;
          usedNS = ns;

          if (!checkedLoadedFor["".concat(codes[0], "-").concat(ns)] && _this4.utils && _this4.utils.hasLoadedNamespace && !_this4.utils.hasLoadedNamespace(usedNS)) {
            checkedLoadedFor["".concat(codes[0], "-").concat(ns)] = true;

            _this4.logger.warn("key \"".concat(usedKey, "\" for languages \"").concat(codes.join(', '), "\" won't get resolved as namespace \"").concat(usedNS, "\" was not yet loaded"), 'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!');
          }

          codes.forEach(function (code) {
            if (_this4.isValidLookup(found)) return;
            usedLng = code;
            var finalKeys = [key];

            if (_this4.i18nFormat && _this4.i18nFormat.addLookupKeys) {
              _this4.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
            } else {
              var pluralSuffix;
              if (needsPluralHandling) pluralSuffix = _this4.pluralResolver.getSuffix(code, options.count, options);
              var zeroSuffix = "".concat(_this4.options.pluralSeparator, "zero");

              if (needsPluralHandling) {
                finalKeys.push(key + pluralSuffix);

                if (needsZeroSuffixLookup) {
                  finalKeys.push(key + zeroSuffix);
                }
              }

              if (needsContextHandling) {
                var contextKey = "".concat(key).concat(_this4.options.contextSeparator).concat(options.context);
                finalKeys.push(contextKey);

                if (needsPluralHandling) {
                  finalKeys.push(contextKey + pluralSuffix);

                  if (needsZeroSuffixLookup) {
                    finalKeys.push(contextKey + zeroSuffix);
                  }
                }
              }
            }

            var possibleKey;

            while (possibleKey = finalKeys.pop()) {
              if (!_this4.isValidLookup(found)) {
                exactUsedKey = possibleKey;
                found = _this4.getResource(code, ns, possibleKey, options);
              }
            }
          });
        });
      });
      return {
        res: found,
        usedKey: usedKey,
        exactUsedKey: exactUsedKey,
        usedLng: usedLng,
        usedNS: usedNS
      };
    }
  }, {
    key: "isValidLookup",
    value: function isValidLookup(res) {
      return res !== undefined && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === '');
    }
  }, {
    key: "getResource",
    value: function getResource(code, ns, key) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      if (this.i18nFormat && this.i18nFormat.getResource) return this.i18nFormat.getResource(code, ns, key, options);
      return this.resourceStore.getResource(code, ns, key, options);
    }
  }], [{
    key: "hasDefaultValue",
    value: function hasDefaultValue(options) {
      var prefix = 'defaultValue';

      for (var option in options) {
        if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, prefix.length) && undefined !== options[option]) {
          return true;
        }
      }

      return false;
    }
  }]);

  return Translator;
}(EventEmitter);

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var LanguageUtil = function () {
  function LanguageUtil(options) {
    _classCallCheck(this, LanguageUtil);

    this.options = options;
    this.supportedLngs = this.options.supportedLngs || false;
    this.logger = baseLogger.create('languageUtils');
  }

  _createClass(LanguageUtil, [{
    key: "getScriptPartFromCode",
    value: function getScriptPartFromCode(code) {
      if (!code || code.indexOf('-') < 0) return null;
      var p = code.split('-');
      if (p.length === 2) return null;
      p.pop();
      if (p[p.length - 1].toLowerCase() === 'x') return null;
      return this.formatLanguageCode(p.join('-'));
    }
  }, {
    key: "getLanguagePartFromCode",
    value: function getLanguagePartFromCode(code) {
      if (!code || code.indexOf('-') < 0) return code;
      var p = code.split('-');
      return this.formatLanguageCode(p[0]);
    }
  }, {
    key: "formatLanguageCode",
    value: function formatLanguageCode(code) {
      if (typeof code === 'string' && code.indexOf('-') > -1) {
        var specialCases = ['hans', 'hant', 'latn', 'cyrl', 'cans', 'mong', 'arab'];
        var p = code.split('-');

        if (this.options.lowerCaseLng) {
          p = p.map(function (part) {
            return part.toLowerCase();
          });
        } else if (p.length === 2) {
          p[0] = p[0].toLowerCase();
          p[1] = p[1].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
        } else if (p.length === 3) {
          p[0] = p[0].toLowerCase();
          if (p[1].length === 2) p[1] = p[1].toUpperCase();
          if (p[0] !== 'sgn' && p[2].length === 2) p[2] = p[2].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
          if (specialCases.indexOf(p[2].toLowerCase()) > -1) p[2] = capitalize(p[2].toLowerCase());
        }

        return p.join('-');
      }

      return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
    }
  }, {
    key: "isSupportedCode",
    value: function isSupportedCode(code) {
      if (this.options.load === 'languageOnly' || this.options.nonExplicitSupportedLngs) {
        code = this.getLanguagePartFromCode(code);
      }

      return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
    }
  }, {
    key: "getBestMatchFromCodes",
    value: function getBestMatchFromCodes(codes) {
      var _this = this;

      if (!codes) return null;
      var found;
      codes.forEach(function (code) {
        if (found) return;

        var cleanedLng = _this.formatLanguageCode(code);

        if (!_this.options.supportedLngs || _this.isSupportedCode(cleanedLng)) found = cleanedLng;
      });

      if (!found && this.options.supportedLngs) {
        codes.forEach(function (code) {
          if (found) return;

          var lngOnly = _this.getLanguagePartFromCode(code);

          if (_this.isSupportedCode(lngOnly)) return found = lngOnly;
          found = _this.options.supportedLngs.find(function (supportedLng) {
            if (supportedLng.indexOf(lngOnly) === 0) return supportedLng;
          });
        });
      }

      if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
      return found;
    }
  }, {
    key: "getFallbackCodes",
    value: function getFallbackCodes(fallbacks, code) {
      if (!fallbacks) return [];
      if (typeof fallbacks === 'function') fallbacks = fallbacks(code);
      if (typeof fallbacks === 'string') fallbacks = [fallbacks];
      if (Object.prototype.toString.apply(fallbacks) === '[object Array]') return fallbacks;
      if (!code) return fallbacks["default"] || [];
      var found = fallbacks[code];
      if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
      if (!found) found = fallbacks[this.formatLanguageCode(code)];
      if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
      if (!found) found = fallbacks["default"];
      return found || [];
    }
  }, {
    key: "toResolveHierarchy",
    value: function toResolveHierarchy(code, fallbackCode) {
      var _this2 = this;

      var fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
      var codes = [];

      var addCode = function addCode(c) {
        if (!c) return;

        if (_this2.isSupportedCode(c)) {
          codes.push(c);
        } else {
          _this2.logger.warn("rejecting language code not found in supportedLngs: ".concat(c));
        }
      };

      if (typeof code === 'string' && code.indexOf('-') > -1) {
        if (this.options.load !== 'languageOnly') addCode(this.formatLanguageCode(code));
        if (this.options.load !== 'languageOnly' && this.options.load !== 'currentOnly') addCode(this.getScriptPartFromCode(code));
        if (this.options.load !== 'currentOnly') addCode(this.getLanguagePartFromCode(code));
      } else if (typeof code === 'string') {
        addCode(this.formatLanguageCode(code));
      }

      fallbackCodes.forEach(function (fc) {
        if (codes.indexOf(fc) < 0) addCode(_this2.formatLanguageCode(fc));
      });
      return codes;
    }
  }]);

  return LanguageUtil;
}();

var sets = [{
  lngs: ['ach', 'ak', 'am', 'arn', 'br', 'fil', 'gun', 'ln', 'mfe', 'mg', 'mi', 'oc', 'pt', 'pt-BR', 'tg', 'tl', 'ti', 'tr', 'uz', 'wa'],
  nr: [1, 2],
  fc: 1
}, {
  lngs: ['af', 'an', 'ast', 'az', 'bg', 'bn', 'ca', 'da', 'de', 'dev', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fi', 'fo', 'fur', 'fy', 'gl', 'gu', 'ha', 'hi', 'hu', 'hy', 'ia', 'it', 'kk', 'kn', 'ku', 'lb', 'mai', 'ml', 'mn', 'mr', 'nah', 'nap', 'nb', 'ne', 'nl', 'nn', 'no', 'nso', 'pa', 'pap', 'pms', 'ps', 'pt-PT', 'rm', 'sco', 'se', 'si', 'so', 'son', 'sq', 'sv', 'sw', 'ta', 'te', 'tk', 'ur', 'yo'],
  nr: [1, 2],
  fc: 2
}, {
  lngs: ['ay', 'bo', 'cgg', 'fa', 'ht', 'id', 'ja', 'jbo', 'ka', 'km', 'ko', 'ky', 'lo', 'ms', 'sah', 'su', 'th', 'tt', 'ug', 'vi', 'wo', 'zh'],
  nr: [1],
  fc: 3
}, {
  lngs: ['be', 'bs', 'cnr', 'dz', 'hr', 'ru', 'sr', 'uk'],
  nr: [1, 2, 5],
  fc: 4
}, {
  lngs: ['ar'],
  nr: [0, 1, 2, 3, 11, 100],
  fc: 5
}, {
  lngs: ['cs', 'sk'],
  nr: [1, 2, 5],
  fc: 6
}, {
  lngs: ['csb', 'pl'],
  nr: [1, 2, 5],
  fc: 7
}, {
  lngs: ['cy'],
  nr: [1, 2, 3, 8],
  fc: 8
}, {
  lngs: ['fr'],
  nr: [1, 2],
  fc: 9
}, {
  lngs: ['ga'],
  nr: [1, 2, 3, 7, 11],
  fc: 10
}, {
  lngs: ['gd'],
  nr: [1, 2, 3, 20],
  fc: 11
}, {
  lngs: ['is'],
  nr: [1, 2],
  fc: 12
}, {
  lngs: ['jv'],
  nr: [0, 1],
  fc: 13
}, {
  lngs: ['kw'],
  nr: [1, 2, 3, 4],
  fc: 14
}, {
  lngs: ['lt'],
  nr: [1, 2, 10],
  fc: 15
}, {
  lngs: ['lv'],
  nr: [1, 2, 0],
  fc: 16
}, {
  lngs: ['mk'],
  nr: [1, 2],
  fc: 17
}, {
  lngs: ['mnk'],
  nr: [0, 1, 2],
  fc: 18
}, {
  lngs: ['mt'],
  nr: [1, 2, 11, 20],
  fc: 19
}, {
  lngs: ['or'],
  nr: [2, 1],
  fc: 2
}, {
  lngs: ['ro'],
  nr: [1, 2, 20],
  fc: 20
}, {
  lngs: ['sl'],
  nr: [5, 1, 2, 3],
  fc: 21
}, {
  lngs: ['he', 'iw'],
  nr: [1, 2, 20, 21],
  fc: 22
}];
var _rulesPluralsTypes = {
  1: function _(n) {
    return Number(n > 1);
  },
  2: function _(n) {
    return Number(n != 1);
  },
  3: function _(n) {
    return 0;
  },
  4: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  5: function _(n) {
    return Number(n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5);
  },
  6: function _(n) {
    return Number(n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2);
  },
  7: function _(n) {
    return Number(n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  8: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3);
  },
  9: function _(n) {
    return Number(n >= 2);
  },
  10: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4);
  },
  11: function _(n) {
    return Number(n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3);
  },
  12: function _(n) {
    return Number(n % 10 != 1 || n % 100 == 11);
  },
  13: function _(n) {
    return Number(n !== 0);
  },
  14: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3);
  },
  15: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  16: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n !== 0 ? 1 : 2);
  },
  17: function _(n) {
    return Number(n == 1 || n % 10 == 1 && n % 100 != 11 ? 0 : 1);
  },
  18: function _(n) {
    return Number(n == 0 ? 0 : n == 1 ? 1 : 2);
  },
  19: function _(n) {
    return Number(n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3);
  },
  20: function _(n) {
    return Number(n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2);
  },
  21: function _(n) {
    return Number(n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0);
  },
  22: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : (n < 0 || n > 10) && n % 10 == 0 ? 2 : 3);
  }
};
var deprecatedJsonVersions = ['v1', 'v2', 'v3'];
var suffixesOrder = {
  zero: 0,
  one: 1,
  two: 2,
  few: 3,
  many: 4,
  other: 5
};

function createRules() {
  var rules = {};
  sets.forEach(function (set) {
    set.lngs.forEach(function (l) {
      rules[l] = {
        numbers: set.nr,
        plurals: _rulesPluralsTypes[set.fc]
      };
    });
  });
  return rules;
}

var PluralResolver = function () {
  function PluralResolver(languageUtils) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, PluralResolver);

    this.languageUtils = languageUtils;
    this.options = options;
    this.logger = baseLogger.create('pluralResolver');

    if ((!this.options.compatibilityJSON || this.options.compatibilityJSON === 'v4') && (typeof Intl === 'undefined' || !Intl.PluralRules)) {
      this.options.compatibilityJSON = 'v3';
      this.logger.error('Your environment seems not to be Intl API compatible, use an Intl.PluralRules polyfill. Will fallback to the compatibilityJSON v3 format handling.');
    }

    this.rules = createRules();
  }

  _createClass(PluralResolver, [{
    key: "addRule",
    value: function addRule(lng, obj) {
      this.rules[lng] = obj;
    }
  }, {
    key: "getRule",
    value: function getRule(code) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (this.shouldUseIntlApi()) {
        try {
          return new Intl.PluralRules(code, {
            type: options.ordinal ? 'ordinal' : 'cardinal'
          });
        } catch (_unused) {
          return;
        }
      }

      return this.rules[code] || this.rules[this.languageUtils.getLanguagePartFromCode(code)];
    }
  }, {
    key: "needsPlural",
    value: function needsPlural(code) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var rule = this.getRule(code, options);

      if (this.shouldUseIntlApi()) {
        return rule && rule.resolvedOptions().pluralCategories.length > 1;
      }

      return rule && rule.numbers.length > 1;
    }
  }, {
    key: "getPluralFormsOfKey",
    value: function getPluralFormsOfKey(code, key) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return this.getSuffixes(code, options).map(function (suffix) {
        return "".concat(key).concat(suffix);
      });
    }
  }, {
    key: "getSuffixes",
    value: function getSuffixes(code) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var rule = this.getRule(code, options);

      if (!rule) {
        return [];
      }

      if (this.shouldUseIntlApi()) {
        return rule.resolvedOptions().pluralCategories.sort(function (pluralCategory1, pluralCategory2) {
          return suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2];
        }).map(function (pluralCategory) {
          return "".concat(_this.options.prepend).concat(pluralCategory);
        });
      }

      return rule.numbers.map(function (number) {
        return _this.getSuffix(code, number, options);
      });
    }
  }, {
    key: "getSuffix",
    value: function getSuffix(code, count) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var rule = this.getRule(code, options);

      if (rule) {
        if (this.shouldUseIntlApi()) {
          return "".concat(this.options.prepend).concat(rule.select(count));
        }

        return this.getSuffixRetroCompatible(rule, count);
      }

      this.logger.warn("no plural rule found for: ".concat(code));
      return '';
    }
  }, {
    key: "getSuffixRetroCompatible",
    value: function getSuffixRetroCompatible(rule, count) {
      var _this2 = this;

      var idx = rule.noAbs ? rule.plurals(count) : rule.plurals(Math.abs(count));
      var suffix = rule.numbers[idx];

      if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
        if (suffix === 2) {
          suffix = 'plural';
        } else if (suffix === 1) {
          suffix = '';
        }
      }

      var returnSuffix = function returnSuffix() {
        return _this2.options.prepend && suffix.toString() ? _this2.options.prepend + suffix.toString() : suffix.toString();
      };

      if (this.options.compatibilityJSON === 'v1') {
        if (suffix === 1) return '';
        if (typeof suffix === 'number') return "_plural_".concat(suffix.toString());
        return returnSuffix();
      } else if (this.options.compatibilityJSON === 'v2') {
        return returnSuffix();
      } else if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
        return returnSuffix();
      }

      return this.options.prepend && idx.toString() ? this.options.prepend + idx.toString() : idx.toString();
    }
  }, {
    key: "shouldUseIntlApi",
    value: function shouldUseIntlApi() {
      return !deprecatedJsonVersions.includes(this.options.compatibilityJSON);
    }
  }]);

  return PluralResolver;
}();

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var Interpolator = function () {
  function Interpolator() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Interpolator);

    this.logger = baseLogger.create('interpolator');
    this.options = options;

    this.format = options.interpolation && options.interpolation.format || function (value) {
      return value;
    };

    this.init(options);
  }

  _createClass(Interpolator, [{
    key: "init",
    value: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (!options.interpolation) options.interpolation = {
        escapeValue: true
      };
      var iOpts = options.interpolation;
      this.escape = iOpts.escape !== undefined ? iOpts.escape : escape;
      this.escapeValue = iOpts.escapeValue !== undefined ? iOpts.escapeValue : true;
      this.useRawValueToEscape = iOpts.useRawValueToEscape !== undefined ? iOpts.useRawValueToEscape : false;
      this.prefix = iOpts.prefix ? regexEscape(iOpts.prefix) : iOpts.prefixEscaped || '{{';
      this.suffix = iOpts.suffix ? regexEscape(iOpts.suffix) : iOpts.suffixEscaped || '}}';
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ',';
      this.unescapePrefix = iOpts.unescapeSuffix ? '' : iOpts.unescapePrefix || '-';
      this.unescapeSuffix = this.unescapePrefix ? '' : iOpts.unescapeSuffix || '';
      this.nestingPrefix = iOpts.nestingPrefix ? regexEscape(iOpts.nestingPrefix) : iOpts.nestingPrefixEscaped || regexEscape('$t(');
      this.nestingSuffix = iOpts.nestingSuffix ? regexEscape(iOpts.nestingSuffix) : iOpts.nestingSuffixEscaped || regexEscape(')');
      this.nestingOptionsSeparator = iOpts.nestingOptionsSeparator ? iOpts.nestingOptionsSeparator : iOpts.nestingOptionsSeparator || ',';
      this.maxReplaces = iOpts.maxReplaces ? iOpts.maxReplaces : 1000;
      this.alwaysFormat = iOpts.alwaysFormat !== undefined ? iOpts.alwaysFormat : false;
      this.resetRegExp();
    }
  }, {
    key: "reset",
    value: function reset() {
      if (this.options) this.init(this.options);
    }
  }, {
    key: "resetRegExp",
    value: function resetRegExp() {
      var regexpStr = "".concat(this.prefix, "(.+?)").concat(this.suffix);
      this.regexp = new RegExp(regexpStr, 'g');
      var regexpUnescapeStr = "".concat(this.prefix).concat(this.unescapePrefix, "(.+?)").concat(this.unescapeSuffix).concat(this.suffix);
      this.regexpUnescape = new RegExp(regexpUnescapeStr, 'g');
      var nestingRegexpStr = "".concat(this.nestingPrefix, "(.+?)").concat(this.nestingSuffix);
      this.nestingRegexp = new RegExp(nestingRegexpStr, 'g');
    }
  }, {
    key: "interpolate",
    value: function interpolate(str, data, lng, options) {
      var _this = this;

      var match;
      var value;
      var replaces;
      var defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};

      function regexSafe(val) {
        return val.replace(/\$/g, '$$$$');
      }

      var handleFormat = function handleFormat(key) {
        if (key.indexOf(_this.formatSeparator) < 0) {
          var path = getPathWithDefaults(data, defaultData, key);
          return _this.alwaysFormat ? _this.format(path, undefined, lng, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, options), data), {}, {
            interpolationkey: key
          })) : path;
        }

        var p = key.split(_this.formatSeparator);
        var k = p.shift().trim();
        var f = p.join(_this.formatSeparator).trim();
        return _this.format(getPathWithDefaults(data, defaultData, k), f, lng, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, options), data), {}, {
          interpolationkey: k
        }));
      };

      this.resetRegExp();
      var missingInterpolationHandler = options && options.missingInterpolationHandler || this.options.missingInterpolationHandler;
      var skipOnVariables = options && options.interpolation && options.interpolation.skipOnVariables !== undefined ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
      var todos = [{
        regex: this.regexpUnescape,
        safeValue: function safeValue(val) {
          return regexSafe(val);
        }
      }, {
        regex: this.regexp,
        safeValue: function safeValue(val) {
          return _this.escapeValue ? regexSafe(_this.escape(val)) : regexSafe(val);
        }
      }];
      todos.forEach(function (todo) {
        replaces = 0;

        while (match = todo.regex.exec(str)) {
          var matchedVar = match[1].trim();
          value = handleFormat(matchedVar);

          if (value === undefined) {
            if (typeof missingInterpolationHandler === 'function') {
              var temp = missingInterpolationHandler(str, match, options);
              value = typeof temp === 'string' ? temp : '';
            } else if (options && options.hasOwnProperty(matchedVar)) {
              value = '';
            } else if (skipOnVariables) {
              value = match[0];
              continue;
            } else {
              _this.logger.warn("missed to pass in variable ".concat(matchedVar, " for interpolating ").concat(str));

              value = '';
            }
          } else if (typeof value !== 'string' && !_this.useRawValueToEscape) {
            value = makeString(value);
          }

          var safeValue = todo.safeValue(value);
          str = str.replace(match[0], safeValue);

          if (skipOnVariables) {
            todo.regex.lastIndex += value.length;
            todo.regex.lastIndex -= match[0].length;
          } else {
            todo.regex.lastIndex = 0;
          }

          replaces++;

          if (replaces >= _this.maxReplaces) {
            break;
          }
        }
      });
      return str;
    }
  }, {
    key: "nest",
    value: function nest(str, fc) {
      var _this2 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var match;
      var value;

      var clonedOptions = _objectSpread$3({}, options);

      clonedOptions.applyPostProcessor = false;
      delete clonedOptions.defaultValue;

      function handleHasOptions(key, inheritedOptions) {
        var sep = this.nestingOptionsSeparator;
        if (key.indexOf(sep) < 0) return key;
        var c = key.split(new RegExp("".concat(sep, "[ ]*{")));
        var optionsString = "{".concat(c[1]);
        key = c[0];
        optionsString = this.interpolate(optionsString, clonedOptions);
        var matchedSingleQuotes = optionsString.match(/'/g);
        var matchedDoubleQuotes = optionsString.match(/"/g);

        if (matchedSingleQuotes && matchedSingleQuotes.length % 2 === 0 && !matchedDoubleQuotes || matchedDoubleQuotes.length % 2 !== 0) {
          optionsString = optionsString.replace(/'/g, '"');
        }

        try {
          clonedOptions = JSON.parse(optionsString);
          if (inheritedOptions) clonedOptions = _objectSpread$3(_objectSpread$3({}, inheritedOptions), clonedOptions);
        } catch (e) {
          this.logger.warn("failed parsing options string in nesting for key ".concat(key), e);
          return "".concat(key).concat(sep).concat(optionsString);
        }

        delete clonedOptions.defaultValue;
        return key;
      }

      while (match = this.nestingRegexp.exec(str)) {
        var formatters = [];
        var doReduce = false;

        if (match[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(match[1])) {
          var r = match[1].split(this.formatSeparator).map(function (elem) {
            return elem.trim();
          });
          match[1] = r.shift();
          formatters = r;
          doReduce = true;
        }

        value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
        if (value && match[0] === str && typeof value !== 'string') return value;
        if (typeof value !== 'string') value = makeString(value);

        if (!value) {
          this.logger.warn("missed to resolve ".concat(match[1], " for nesting ").concat(str));
          value = '';
        }

        if (doReduce) {
          value = formatters.reduce(function (v, f) {
            return _this2.format(v, f, options.lng, _objectSpread$3(_objectSpread$3({}, options), {}, {
              interpolationkey: match[1].trim()
            }));
          }, value.trim());
        }

        str = str.replace(match[0], value);
        this.regexp.lastIndex = 0;
      }

      return str;
    }
  }]);

  return Interpolator;
}();

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$4(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function parseFormatStr(formatStr) {
  var formatName = formatStr.toLowerCase().trim();
  var formatOptions = {};

  if (formatStr.indexOf('(') > -1) {
    var p = formatStr.split('(');
    formatName = p[0].toLowerCase().trim();
    var optStr = p[1].substring(0, p[1].length - 1);

    if (formatName === 'currency' && optStr.indexOf(':') < 0) {
      if (!formatOptions.currency) formatOptions.currency = optStr.trim();
    } else if (formatName === 'relativetime' && optStr.indexOf(':') < 0) {
      if (!formatOptions.range) formatOptions.range = optStr.trim();
    } else {
      var opts = optStr.split(';');
      opts.forEach(function (opt) {
        if (!opt) return;

        var _opt$split = opt.split(':'),
            _opt$split2 = _toArray(_opt$split),
            key = _opt$split2[0],
            rest = _opt$split2.slice(1);

        var val = rest.join(':').trim().replace(/^'+|'+$/g, '');
        if (!formatOptions[key.trim()]) formatOptions[key.trim()] = val;
        if (val === 'false') formatOptions[key.trim()] = false;
        if (val === 'true') formatOptions[key.trim()] = true;
        if (!isNaN(val)) formatOptions[key.trim()] = parseInt(val, 10);
      });
    }
  }

  return {
    formatName: formatName,
    formatOptions: formatOptions
  };
}

function createCachedFormatter(fn) {
  var cache = {};
  return function invokeFormatter(val, lng, options) {
    var key = lng + JSON.stringify(options);
    var formatter = cache[key];

    if (!formatter) {
      formatter = fn(lng, options);
      cache[key] = formatter;
    }

    return formatter(val);
  };
}

var Formatter = function () {
  function Formatter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Formatter);

    this.logger = baseLogger.create('formatter');
    this.options = options;
    this.formats = {
      number: createCachedFormatter(function (lng, options) {
        var formatter = new Intl.NumberFormat(lng, options);
        return function (val) {
          return formatter.format(val);
        };
      }),
      currency: createCachedFormatter(function (lng, options) {
        var formatter = new Intl.NumberFormat(lng, _objectSpread$4(_objectSpread$4({}, options), {}, {
          style: 'currency'
        }));
        return function (val) {
          return formatter.format(val);
        };
      }),
      datetime: createCachedFormatter(function (lng, options) {
        var formatter = new Intl.DateTimeFormat(lng, _objectSpread$4({}, options));
        return function (val) {
          return formatter.format(val);
        };
      }),
      relativetime: createCachedFormatter(function (lng, options) {
        var formatter = new Intl.RelativeTimeFormat(lng, _objectSpread$4({}, options));
        return function (val) {
          return formatter.format(val, options.range || 'day');
        };
      }),
      list: createCachedFormatter(function (lng, options) {
        var formatter = new Intl.ListFormat(lng, _objectSpread$4({}, options));
        return function (val) {
          return formatter.format(val);
        };
      })
    };
    this.init(options);
  }

  _createClass(Formatter, [{
    key: "init",
    value: function init(services) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        interpolation: {}
      };
      var iOpts = options.interpolation;
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ',';
    }
  }, {
    key: "add",
    value: function add(name, fc) {
      this.formats[name.toLowerCase().trim()] = fc;
    }
  }, {
    key: "addCached",
    value: function addCached(name, fc) {
      this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
    }
  }, {
    key: "format",
    value: function format(value, _format, lng, options) {
      var _this = this;

      var formats = _format.split(this.formatSeparator);

      var result = formats.reduce(function (mem, f) {
        var _parseFormatStr = parseFormatStr(f),
            formatName = _parseFormatStr.formatName,
            formatOptions = _parseFormatStr.formatOptions;

        if (_this.formats[formatName]) {
          var formatted = mem;

          try {
            var valOptions = options && options.formatParams && options.formatParams[options.interpolationkey] || {};
            var l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
            formatted = _this.formats[formatName](mem, l, _objectSpread$4(_objectSpread$4(_objectSpread$4({}, formatOptions), options), valOptions));
          } catch (error) {
            _this.logger.warn(error);
          }

          return formatted;
        } else {
          _this.logger.warn("there was no format function for ".concat(formatName));
        }

        return mem;
      }, value);
      return result;
    }
  }]);

  return Formatter;
}();

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$5(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper$2(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$2(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$2() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function removePending(q, name) {
  if (q.pending[name] !== undefined) {
    delete q.pending[name];
    q.pendingCount--;
  }
}

var Connector = function (_EventEmitter) {
  _inherits(Connector, _EventEmitter);

  var _super = _createSuper$2(Connector);

  function Connector(backend, store, services) {
    var _this;

    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, Connector);

    _this = _super.call(this);

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    _this.backend = backend;
    _this.store = store;
    _this.services = services;
    _this.languageUtils = services.languageUtils;
    _this.options = options;
    _this.logger = baseLogger.create('backendConnector');
    _this.waitingReads = [];
    _this.maxParallelReads = options.maxParallelReads || 10;
    _this.readingCalls = 0;
    _this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
    _this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
    _this.state = {};
    _this.queue = [];

    if (_this.backend && _this.backend.init) {
      _this.backend.init(services, options.backend, options);
    }

    return _this;
  }

  _createClass(Connector, [{
    key: "queueLoad",
    value: function queueLoad(languages, namespaces, options, callback) {
      var _this2 = this;

      var toLoad = {};
      var pending = {};
      var toLoadLanguages = {};
      var toLoadNamespaces = {};
      languages.forEach(function (lng) {
        var hasAllNamespaces = true;
        namespaces.forEach(function (ns) {
          var name = "".concat(lng, "|").concat(ns);

          if (!options.reload && _this2.store.hasResourceBundle(lng, ns)) {
            _this2.state[name] = 2;
          } else if (_this2.state[name] < 0) ; else if (_this2.state[name] === 1) {
            if (pending[name] === undefined) pending[name] = true;
          } else {
            _this2.state[name] = 1;
            hasAllNamespaces = false;
            if (pending[name] === undefined) pending[name] = true;
            if (toLoad[name] === undefined) toLoad[name] = true;
            if (toLoadNamespaces[ns] === undefined) toLoadNamespaces[ns] = true;
          }
        });
        if (!hasAllNamespaces) toLoadLanguages[lng] = true;
      });

      if (Object.keys(toLoad).length || Object.keys(pending).length) {
        this.queue.push({
          pending: pending,
          pendingCount: Object.keys(pending).length,
          loaded: {},
          errors: [],
          callback: callback
        });
      }

      return {
        toLoad: Object.keys(toLoad),
        pending: Object.keys(pending),
        toLoadLanguages: Object.keys(toLoadLanguages),
        toLoadNamespaces: Object.keys(toLoadNamespaces)
      };
    }
  }, {
    key: "loaded",
    value: function loaded(name, err, data) {
      var s = name.split('|');
      var lng = s[0];
      var ns = s[1];
      if (err) this.emit('failedLoading', lng, ns, err);

      if (data) {
        this.store.addResourceBundle(lng, ns, data);
      }

      this.state[name] = err ? -1 : 2;
      var loaded = {};
      this.queue.forEach(function (q) {
        pushPath(q.loaded, [lng], ns);
        removePending(q, name);
        if (err) q.errors.push(err);

        if (q.pendingCount === 0 && !q.done) {
          Object.keys(q.loaded).forEach(function (l) {
            if (!loaded[l]) loaded[l] = {};
            var loadedKeys = q.loaded[l];

            if (loadedKeys.length) {
              loadedKeys.forEach(function (ns) {
                if (loaded[l][ns] === undefined) loaded[l][ns] = true;
              });
            }
          });
          q.done = true;

          if (q.errors.length) {
            q.callback(q.errors);
          } else {
            q.callback();
          }
        }
      });
      this.emit('loaded', loaded);
      this.queue = this.queue.filter(function (q) {
        return !q.done;
      });
    }
  }, {
    key: "read",
    value: function read(lng, ns, fcName) {
      var _this3 = this;

      var tried = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var wait = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : this.retryTimeout;
      var callback = arguments.length > 5 ? arguments[5] : undefined;
      if (!lng.length) return callback(null, {});

      if (this.readingCalls >= this.maxParallelReads) {
        this.waitingReads.push({
          lng: lng,
          ns: ns,
          fcName: fcName,
          tried: tried,
          wait: wait,
          callback: callback
        });
        return;
      }

      this.readingCalls++;
      return this.backend[fcName](lng, ns, function (err, data) {
        _this3.readingCalls--;

        if (_this3.waitingReads.length > 0) {
          var next = _this3.waitingReads.shift();

          _this3.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
        }

        if (err && data && tried < _this3.maxRetries) {
          setTimeout(function () {
            _this3.read.call(_this3, lng, ns, fcName, tried + 1, wait * 2, callback);
          }, wait);
          return;
        }

        callback(err, data);
      });
    }
  }, {
    key: "prepareLoading",
    value: function prepareLoading(languages, namespaces) {
      var _this4 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var callback = arguments.length > 3 ? arguments[3] : undefined;

      if (!this.backend) {
        this.logger.warn('No backend was added via i18next.use. Will not load resources.');
        return callback && callback();
      }

      if (typeof languages === 'string') languages = this.languageUtils.toResolveHierarchy(languages);
      if (typeof namespaces === 'string') namespaces = [namespaces];
      var toLoad = this.queueLoad(languages, namespaces, options, callback);

      if (!toLoad.toLoad.length) {
        if (!toLoad.pending.length) callback();
        return null;
      }

      toLoad.toLoad.forEach(function (name) {
        _this4.loadOne(name);
      });
    }
  }, {
    key: "load",
    value: function load(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {}, callback);
    }
  }, {
    key: "reload",
    value: function reload(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {
        reload: true
      }, callback);
    }
  }, {
    key: "loadOne",
    value: function loadOne(name) {
      var _this5 = this;

      var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var s = name.split('|');
      var lng = s[0];
      var ns = s[1];
      this.read(lng, ns, 'read', undefined, undefined, function (err, data) {
        if (err) _this5.logger.warn("".concat(prefix, "loading namespace ").concat(ns, " for language ").concat(lng, " failed"), err);
        if (!err && data) _this5.logger.log("".concat(prefix, "loaded namespace ").concat(ns, " for language ").concat(lng), data);

        _this5.loaded(name, err, data);
      });
    }
  }, {
    key: "saveMissing",
    value: function saveMissing(languages, namespace, key, fallbackValue, isUpdate) {
      var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

      if (this.services.utils && this.services.utils.hasLoadedNamespace && !this.services.utils.hasLoadedNamespace(namespace)) {
        this.logger.warn("did not save key \"".concat(key, "\" as the namespace \"").concat(namespace, "\" was not yet loaded"), 'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!');
        return;
      }

      if (key === undefined || key === null || key === '') return;

      if (this.backend && this.backend.create) {
        this.backend.create(languages, namespace, key, fallbackValue, null, _objectSpread$5(_objectSpread$5({}, options), {}, {
          isUpdate: isUpdate
        }));
      }

      if (!languages || !languages[0]) return;
      this.store.addResource(languages[0], namespace, key, fallbackValue);
    }
  }]);

  return Connector;
}(EventEmitter);

function get() {
  return {
    debug: false,
    initImmediate: true,
    ns: ['translation'],
    defaultNS: ['translation'],
    fallbackLng: ['dev'],
    fallbackNS: false,
    supportedLngs: false,
    nonExplicitSupportedLngs: false,
    load: 'all',
    preload: false,
    simplifyPluralSuffix: true,
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    partialBundledLanguages: false,
    saveMissing: false,
    updateMissing: false,
    saveMissingTo: 'fallback',
    saveMissingPlurals: true,
    missingKeyHandler: false,
    missingInterpolationHandler: false,
    postProcess: false,
    postProcessPassResolved: false,
    returnNull: true,
    returnEmptyString: true,
    returnObjects: false,
    joinArrays: false,
    returnedObjectHandler: false,
    parseMissingKeyHandler: false,
    appendNamespaceToMissingKey: false,
    appendNamespaceToCIMode: false,
    overloadTranslationOptionHandler: function handle(args) {
      var ret = {};
      if (_typeof(args[1]) === 'object') ret = args[1];
      if (typeof args[1] === 'string') ret.defaultValue = args[1];
      if (typeof args[2] === 'string') ret.tDescription = args[2];

      if (_typeof(args[2]) === 'object' || _typeof(args[3]) === 'object') {
        var options = args[3] || args[2];
        Object.keys(options).forEach(function (key) {
          ret[key] = options[key];
        });
      }

      return ret;
    },
    interpolation: {
      escapeValue: true,
      format: function format(value, _format, lng, options) {
        return value;
      },
      prefix: '{{',
      suffix: '}}',
      formatSeparator: ',',
      unescapePrefix: '-',
      nestingPrefix: '$t(',
      nestingSuffix: ')',
      nestingOptionsSeparator: ',',
      maxReplaces: 1000,
      skipOnVariables: true
    }
  };
}
function transformOptions(options) {
  if (typeof options.ns === 'string') options.ns = [options.ns];
  if (typeof options.fallbackLng === 'string') options.fallbackLng = [options.fallbackLng];
  if (typeof options.fallbackNS === 'string') options.fallbackNS = [options.fallbackNS];

  if (options.supportedLngs && options.supportedLngs.indexOf('cimode') < 0) {
    options.supportedLngs = options.supportedLngs.concat(['cimode']);
  }

  return options;
}

function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$6(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper$3(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$3(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$3() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function noop() {}

function bindMemberFunctions(inst) {
  var mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
  mems.forEach(function (mem) {
    if (typeof inst[mem] === 'function') {
      inst[mem] = inst[mem].bind(inst);
    }
  });
}

var I18n = function (_EventEmitter) {
  _inherits(I18n, _EventEmitter);

  var _super = _createSuper$3(I18n);

  function I18n() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var callback = arguments.length > 1 ? arguments[1] : undefined;

    _classCallCheck(this, I18n);

    _this = _super.call(this);

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    _this.options = transformOptions(options);
    _this.services = {};
    _this.logger = baseLogger;
    _this.modules = {
      external: []
    };
    bindMemberFunctions(_assertThisInitialized(_this));

    if (callback && !_this.isInitialized && !options.isClone) {
      if (!_this.options.initImmediate) {
        _this.init(options, callback);

        return _possibleConstructorReturn(_this, _assertThisInitialized(_this));
      }

      setTimeout(function () {
        _this.init(options, callback);
      }, 0);
    }

    return _this;
  }

  _createClass(I18n, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 ? arguments[1] : undefined;

      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      if (!options.defaultNS && options.defaultNS !== false && options.ns) {
        if (typeof options.ns === 'string') {
          options.defaultNS = options.ns;
        } else if (options.ns.indexOf('translation') < 0) {
          options.defaultNS = options.ns[0];
        }
      }

      var defOpts = get();
      this.options = _objectSpread$6(_objectSpread$6(_objectSpread$6({}, defOpts), this.options), transformOptions(options));

      if (this.options.compatibilityAPI !== 'v1') {
        this.options.interpolation = _objectSpread$6(_objectSpread$6({}, defOpts.interpolation), this.options.interpolation);
      }

      if (options.keySeparator !== undefined) {
        this.options.userDefinedKeySeparator = options.keySeparator;
      }

      if (options.nsSeparator !== undefined) {
        this.options.userDefinedNsSeparator = options.nsSeparator;
      }

      function createClassOnDemand(ClassOrObject) {
        if (!ClassOrObject) return null;
        if (typeof ClassOrObject === 'function') return new ClassOrObject();
        return ClassOrObject;
      }

      if (!this.options.isClone) {
        if (this.modules.logger) {
          baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
        } else {
          baseLogger.init(null, this.options);
        }

        var formatter;

        if (this.modules.formatter) {
          formatter = this.modules.formatter;
        } else if (typeof Intl !== 'undefined') {
          formatter = Formatter;
        }

        var lu = new LanguageUtil(this.options);
        this.store = new ResourceStore(this.options.resources, this.options);
        var s = this.services;
        s.logger = baseLogger;
        s.resourceStore = this.store;
        s.languageUtils = lu;
        s.pluralResolver = new PluralResolver(lu, {
          prepend: this.options.pluralSeparator,
          compatibilityJSON: this.options.compatibilityJSON,
          simplifyPluralSuffix: this.options.simplifyPluralSuffix
        });

        if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
          s.formatter = createClassOnDemand(formatter);
          s.formatter.init(s, this.options);
          this.options.interpolation.format = s.formatter.format.bind(s.formatter);
        }

        s.interpolator = new Interpolator(this.options);
        s.utils = {
          hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
        };
        s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
        s.backendConnector.on('*', function (event) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          _this2.emit.apply(_this2, [event].concat(args));
        });

        if (this.modules.languageDetector) {
          s.languageDetector = createClassOnDemand(this.modules.languageDetector);
          s.languageDetector.init(s, this.options.detection, this.options);
        }

        if (this.modules.i18nFormat) {
          s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
          if (s.i18nFormat.init) s.i18nFormat.init(this);
        }

        this.translator = new Translator(this.services, this.options);
        this.translator.on('*', function (event) {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          _this2.emit.apply(_this2, [event].concat(args));
        });
        this.modules.external.forEach(function (m) {
          if (m.init) m.init(_this2);
        });
      }

      this.format = this.options.interpolation.format;
      if (!callback) callback = noop;

      if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
        var codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        if (codes.length > 0 && codes[0] !== 'dev') this.options.lng = codes[0];
      }

      if (!this.services.languageDetector && !this.options.lng) {
        this.logger.warn('init: no languageDetector is used and no lng is defined');
      }

      var storeApi = ['getResource', 'hasResourceBundle', 'getResourceBundle', 'getDataByLanguage'];
      storeApi.forEach(function (fcName) {
        _this2[fcName] = function () {
          var _this2$store;

          return (_this2$store = _this2.store)[fcName].apply(_this2$store, arguments);
        };
      });
      var storeApiChained = ['addResource', 'addResources', 'addResourceBundle', 'removeResourceBundle'];
      storeApiChained.forEach(function (fcName) {
        _this2[fcName] = function () {
          var _this2$store2;

          (_this2$store2 = _this2.store)[fcName].apply(_this2$store2, arguments);

          return _this2;
        };
      });
      var deferred = defer();

      var load = function load() {
        var finish = function finish(err, t) {
          if (_this2.isInitialized && !_this2.initializedStoreOnce) _this2.logger.warn('init: i18next is already initialized. You should call init just once!');
          _this2.isInitialized = true;
          if (!_this2.options.isClone) _this2.logger.log('initialized', _this2.options);

          _this2.emit('initialized', _this2.options);

          deferred.resolve(t);
          callback(err, t);
        };

        if (_this2.languages && _this2.options.compatibilityAPI !== 'v1' && !_this2.isInitialized) return finish(null, _this2.t.bind(_this2));

        _this2.changeLanguage(_this2.options.lng, finish);
      };

      if (this.options.resources || !this.options.initImmediate) {
        load();
      } else {
        setTimeout(load, 0);
      }

      return deferred;
    }
  }, {
    key: "loadResources",
    value: function loadResources(language) {
      var _this3 = this;

      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
      var usedCallback = callback;
      var usedLng = typeof language === 'string' ? language : this.language;
      if (typeof language === 'function') usedCallback = language;

      if (!this.options.resources || this.options.partialBundledLanguages) {
        if (usedLng && usedLng.toLowerCase() === 'cimode') return usedCallback();
        var toLoad = [];

        var append = function append(lng) {
          if (!lng) return;

          var lngs = _this3.services.languageUtils.toResolveHierarchy(lng);

          lngs.forEach(function (l) {
            if (toLoad.indexOf(l) < 0) toLoad.push(l);
          });
        };

        if (!usedLng) {
          var fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
          fallbacks.forEach(function (l) {
            return append(l);
          });
        } else {
          append(usedLng);
        }

        if (this.options.preload) {
          this.options.preload.forEach(function (l) {
            return append(l);
          });
        }

        this.services.backendConnector.load(toLoad, this.options.ns, function (e) {
          if (!e && !_this3.resolvedLanguage && _this3.language) _this3.setResolvedLanguage(_this3.language);
          usedCallback(e);
        });
      } else {
        usedCallback(null);
      }
    }
  }, {
    key: "reloadResources",
    value: function reloadResources(lngs, ns, callback) {
      var deferred = defer();
      if (!lngs) lngs = this.languages;
      if (!ns) ns = this.options.ns;
      if (!callback) callback = noop;
      this.services.backendConnector.reload(lngs, ns, function (err) {
        deferred.resolve();
        callback(err);
      });
      return deferred;
    }
  }, {
    key: "use",
    value: function use(module) {
      if (!module) throw new Error('You are passing an undefined module! Please check the object you are passing to i18next.use()');
      if (!module.type) throw new Error('You are passing a wrong module! Please check the object you are passing to i18next.use()');

      if (module.type === 'backend') {
        this.modules.backend = module;
      }

      if (module.type === 'logger' || module.log && module.warn && module.error) {
        this.modules.logger = module;
      }

      if (module.type === 'languageDetector') {
        this.modules.languageDetector = module;
      }

      if (module.type === 'i18nFormat') {
        this.modules.i18nFormat = module;
      }

      if (module.type === 'postProcessor') {
        postProcessor.addPostProcessor(module);
      }

      if (module.type === 'formatter') {
        this.modules.formatter = module;
      }

      if (module.type === '3rdParty') {
        this.modules.external.push(module);
      }

      return this;
    }
  }, {
    key: "setResolvedLanguage",
    value: function setResolvedLanguage(l) {
      if (!l || !this.languages) return;
      if (['cimode', 'dev'].indexOf(l) > -1) return;

      for (var li = 0; li < this.languages.length; li++) {
        var lngInLngs = this.languages[li];
        if (['cimode', 'dev'].indexOf(lngInLngs) > -1) continue;

        if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
          this.resolvedLanguage = lngInLngs;
          break;
        }
      }
    }
  }, {
    key: "changeLanguage",
    value: function changeLanguage(lng, callback) {
      var _this4 = this;

      this.isLanguageChangingTo = lng;
      var deferred = defer();
      this.emit('languageChanging', lng);

      var setLngProps = function setLngProps(l) {
        _this4.language = l;
        _this4.languages = _this4.services.languageUtils.toResolveHierarchy(l);
        _this4.resolvedLanguage = undefined;

        _this4.setResolvedLanguage(l);
      };

      var done = function done(err, l) {
        if (l) {
          setLngProps(l);

          _this4.translator.changeLanguage(l);

          _this4.isLanguageChangingTo = undefined;

          _this4.emit('languageChanged', l);

          _this4.logger.log('languageChanged', l);
        } else {
          _this4.isLanguageChangingTo = undefined;
        }

        deferred.resolve(function () {
          return _this4.t.apply(_this4, arguments);
        });
        if (callback) callback(err, function () {
          return _this4.t.apply(_this4, arguments);
        });
      };

      var setLng = function setLng(lngs) {
        if (!lng && !lngs && _this4.services.languageDetector) lngs = [];
        var l = typeof lngs === 'string' ? lngs : _this4.services.languageUtils.getBestMatchFromCodes(lngs);

        if (l) {
          if (!_this4.language) {
            setLngProps(l);
          }

          if (!_this4.translator.language) _this4.translator.changeLanguage(l);
          if (_this4.services.languageDetector) _this4.services.languageDetector.cacheUserLanguage(l);
        }

        _this4.loadResources(l, function (err) {
          done(err, l);
        });
      };

      if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
        setLng(this.services.languageDetector.detect());
      } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
        this.services.languageDetector.detect(setLng);
      } else {
        setLng(lng);
      }

      return deferred;
    }
  }, {
    key: "getFixedT",
    value: function getFixedT(lng, ns, keyPrefix) {
      var _this5 = this;

      var fixedT = function fixedT(key, opts) {
        var options;

        if (_typeof(opts) !== 'object') {
          for (var _len3 = arguments.length, rest = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
            rest[_key3 - 2] = arguments[_key3];
          }

          options = _this5.options.overloadTranslationOptionHandler([key, opts].concat(rest));
        } else {
          options = _objectSpread$6({}, opts);
        }

        options.lng = options.lng || fixedT.lng;
        options.lngs = options.lngs || fixedT.lngs;
        options.ns = options.ns || fixedT.ns;
        options.keyPrefix = options.keyPrefix || keyPrefix || fixedT.keyPrefix;
        var keySeparator = _this5.options.keySeparator || '.';
        var resultKey = options.keyPrefix ? "".concat(options.keyPrefix).concat(keySeparator).concat(key) : key;
        return _this5.t(resultKey, options);
      };

      if (typeof lng === 'string') {
        fixedT.lng = lng;
      } else {
        fixedT.lngs = lng;
      }

      fixedT.ns = ns;
      fixedT.keyPrefix = keyPrefix;
      return fixedT;
    }
  }, {
    key: "t",
    value: function t() {
      var _this$translator;

      return this.translator && (_this$translator = this.translator).translate.apply(_this$translator, arguments);
    }
  }, {
    key: "exists",
    value: function exists() {
      var _this$translator2;

      return this.translator && (_this$translator2 = this.translator).exists.apply(_this$translator2, arguments);
    }
  }, {
    key: "setDefaultNamespace",
    value: function setDefaultNamespace(ns) {
      this.options.defaultNS = ns;
    }
  }, {
    key: "hasLoadedNamespace",
    value: function hasLoadedNamespace(ns) {
      var _this6 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!this.isInitialized) {
        this.logger.warn('hasLoadedNamespace: i18next was not initialized', this.languages);
        return false;
      }

      if (!this.languages || !this.languages.length) {
        this.logger.warn('hasLoadedNamespace: i18n.languages were undefined or empty', this.languages);
        return false;
      }

      var lng = this.resolvedLanguage || this.languages[0];
      var fallbackLng = this.options ? this.options.fallbackLng : false;
      var lastLng = this.languages[this.languages.length - 1];
      if (lng.toLowerCase() === 'cimode') return true;

      var loadNotPending = function loadNotPending(l, n) {
        var loadState = _this6.services.backendConnector.state["".concat(l, "|").concat(n)];

        return loadState === -1 || loadState === 2;
      };

      if (options.precheck) {
        var preResult = options.precheck(this, loadNotPending);
        if (preResult !== undefined) return preResult;
      }

      if (this.hasResourceBundle(lng, ns)) return true;
      if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
      if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
      return false;
    }
  }, {
    key: "loadNamespaces",
    value: function loadNamespaces(ns, callback) {
      var _this7 = this;

      var deferred = defer();

      if (!this.options.ns) {
        callback && callback();
        return Promise.resolve();
      }

      if (typeof ns === 'string') ns = [ns];
      ns.forEach(function (n) {
        if (_this7.options.ns.indexOf(n) < 0) _this7.options.ns.push(n);
      });
      this.loadResources(function (err) {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
  }, {
    key: "loadLanguages",
    value: function loadLanguages(lngs, callback) {
      var deferred = defer();
      if (typeof lngs === 'string') lngs = [lngs];
      var preloaded = this.options.preload || [];
      var newLngs = lngs.filter(function (lng) {
        return preloaded.indexOf(lng) < 0;
      });

      if (!newLngs.length) {
        if (callback) callback();
        return Promise.resolve();
      }

      this.options.preload = preloaded.concat(newLngs);
      this.loadResources(function (err) {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
  }, {
    key: "dir",
    value: function dir(lng) {
      if (!lng) lng = this.resolvedLanguage || (this.languages && this.languages.length > 0 ? this.languages[0] : this.language);
      if (!lng) return 'rtl';
      var rtlLngs = ['ar', 'shu', 'sqr', 'ssh', 'xaa', 'yhd', 'yud', 'aao', 'abh', 'abv', 'acm', 'acq', 'acw', 'acx', 'acy', 'adf', 'ads', 'aeb', 'aec', 'afb', 'ajp', 'apc', 'apd', 'arb', 'arq', 'ars', 'ary', 'arz', 'auz', 'avl', 'ayh', 'ayl', 'ayn', 'ayp', 'bbz', 'pga', 'he', 'iw', 'ps', 'pbt', 'pbu', 'pst', 'prp', 'prd', 'ug', 'ur', 'ydd', 'yds', 'yih', 'ji', 'yi', 'hbo', 'men', 'xmn', 'fa', 'jpr', 'peo', 'pes', 'prs', 'dv', 'sam', 'ckb'];
      return rtlLngs.indexOf(this.services.languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf('-arab') > 1 ? 'rtl' : 'ltr';
    }
  }, {
    key: "cloneInstance",
    value: function cloneInstance() {
      var _this8 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

      var mergedOptions = _objectSpread$6(_objectSpread$6(_objectSpread$6({}, this.options), options), {
        isClone: true
      });

      var clone = new I18n(mergedOptions);

      if (options.debug !== undefined || options.prefix !== undefined) {
        clone.logger = clone.logger.clone(options);
      }

      var membersToCopy = ['store', 'services', 'language'];
      membersToCopy.forEach(function (m) {
        clone[m] = _this8[m];
      });
      clone.services = _objectSpread$6({}, this.services);
      clone.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      clone.translator = new Translator(clone.services, clone.options);
      clone.translator.on('*', function (event) {
        for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          args[_key4 - 1] = arguments[_key4];
        }

        clone.emit.apply(clone, [event].concat(args));
      });
      clone.init(mergedOptions, callback);
      clone.translator.options = clone.options;
      clone.translator.backendConnector.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      return clone;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        options: this.options,
        store: this.store,
        language: this.language,
        languages: this.languages,
        resolvedLanguage: this.resolvedLanguage
      };
    }
  }]);

  return I18n;
}(EventEmitter);

_defineProperty(I18n, "createInstance", function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var callback = arguments.length > 1 ? arguments[1] : undefined;
  return new I18n(options, callback);
});

var instance = I18n.createInstance();
instance.createInstance = I18n.createInstance;

instance.createInstance;
instance.init;
instance.loadResources;
instance.reloadResources;
instance.use;
instance.changeLanguage;
instance.getFixedT;
instance.t;
instance.exists;
instance.setDefaultNamespace;
instance.hasLoadedNamespace;
instance.loadNamespaces;
instance.loadLanguages;

const en = {
    width: "Width",
    height: "Height",
    depth: "Depth",
    scale: "Scale",
    color: "Color",
    texture: "Texture",
    position: "Position",
    rotation: "Rotation",
    // basicModel: "Basic Model",
    style: "Style",
    interiorWidth: "Interior Width",
    rackDoorOpenAngle: "Rack Door Open Angle",
    rackEnvMap: "Rack Environment Map",
    frontDoorOpenDirection: "Front Door Open Direction",
    backDoorOpenDirection: "Back Door Open Direction",
    reflectRatio: "Reflect Ratio",
    exteriorTexture: "Rack Exterior Texture",
    topExteriorTexture: "Top Exterior Texture",
    interiorTexture: "Interior Texture",
    topInteriorTexture: "Top Interior Texture",
    frontDoorTexture: "Front Door Texture",
    frontDoorBackTexture: "Front Door Back Texture",
    backDoorTexture: "Back Door Texture",
    backDoorFrontTexture: "Back Door Front Texture",
    frameTexture: "Frame Texture",
    frameColor: "Frame Color",
    doorTexture: "Door Texture",
    doorOpenAngle: "Door Open Angle",
    doorRotationSpeed: "Door Rotation Speed",
    doorRotationDirection: "Door Rotation Direction",
    leftDoorTexture: "Left Door Texture",
    leftDoorRotationDirection: "Left Door Rotation Direction",
    leftDoorAngle: "Left Door Open Angle",
    leftDoorRotationSpeed: "Left Door Rotation Speed",
    rightDoorTexture: "Right Door Texture",
    rightDoorRotationDirection: "Right Door Rotation Direction",
    rightDoorAngle: "Right Door Open Angle",
    rightDoorRotationSpeed: "Right Door Rotation Speed",
    imageUrl: "Image URL",
    skyboxTexture: "Skybox Texture",
    skyboxRadius: "Skybox Radius",
    colorSpace: "Color Space",
    wallData: "Wall Data",
    wallHeight: "Wall Height",
    wallDepth: "Wall Depth",
    wallTopColor: "Wall Top Color",
    wallBottomColor: "Wall Bottom Color",
    wallInteriorColor: "Wall Interior Color",
    wallExteriorColor: "Wall Exterior Color",
    wallExteriorTexture: "Wall Exterior Texture",
    wallInteriorTexture: "Wall Interior Texture",
    wallFloorTexture: "Wall Floor Texture",
    wallRoofTexture: "Wall Roof Texture",
    floorTexture: "Floor Texture",
    roofTexture: "Roof Texture",
    transparent: "Transparent",
    opacity: "Opacity",
    closed: "Closed",
    cube: "Cube",
    cubeDesc: "Cube Model",
    column: "Column",
    columnDesc: "Column Model",
    // columnCategory: "Decorative Models",
    plant: "Plant",
    plantDesc: "Plant Model",
    // plantCategory: "Plant",
    rack: "Rack",
    rack2: "Rack 2",
    rackDesc: "Rack Model",
    // rackCategory: "Rack",
    door: "Door",
    doorDesc: "Door Model",
    // doorCategory: "Door",
    doubleDoor: "Double Door",
    doubleDoorDesc: "Double Door Model",
    marker: "Marker",
    markerDesc: "Marker Model",
    skybox: "Skybox",
    skyboxDesc: "Create a spherical skybox model with customizable lighting and atmospheric effects.",
    wall: "Wall",
    wall2: "Wall 2",
    wallDesc: "Wall Model",
    bed: "Bed",
    bedDesc: "Bed Model",
    // bedCategory: "Furniture",
    window: "Window",
    windowDesc: "Window Model",
    // windowCategory: "Furniture",
};
const cn = {
    width: "宽",
    height: "高",
    depth: "深",
    scale: "缩放比例",
    color: "颜色",
    texture: "纹理",
    position: "位置",
    rotation: "旋转角度",
    // basicModel: "基础模型",
    style: "样式",
    interiorWidth: "内宽",
    rackDoorOpenAngle: "机柜开门角度",
    rackEnvMap: "机柜环境贴图",
    frontDoorOpenDirection: "前门开门的方向",
    backDoorOpenDirection: "后门开门的方向",
    reflectRatio: "环境反射率",
    exteriorTexture: "机柜外侧面贴图",
    topExteriorTexture: "机柜外侧顶部贴图",
    interiorTexture: "机柜内侧面贴图",
    topInteriorTexture: "机柜内侧顶部贴图",
    frontDoorTexture: "机柜前门贴图",
    frontDoorBackTexture: "机柜前门背面贴图",
    backDoorTexture: "机柜后门贴图",
    backDoorFrontTexture: "机柜后门前面贴图",
    frameTexture: "机柜机框贴图",
    frameColor: "框架颜色",
    doorTexture: "门贴图",
    doorOpenAngle: "门开角度",
    doorRotationSpeed: "门旋转速度",
    doorRotationDirection: "门旋转方向",
    leftDoorTexture: "左门贴图",
    leftDoorRotationDirection: "左门旋转方向",
    leftDoorAngle: "左门开角度",
    leftDoorRotationSpeed: "左门旋转速度",
    rightDoorTexture: "右门贴图",
    rightDoorRotationDirection: "右门旋转方向",
    rightDoorAngle: "右门开角度",
    rightDoorRotationSpeed: "右门旋转速度",
    imageUrl: "图片地址",
    skyboxTexture: "天空盒贴图",
    skyboxRadius: "天空盒半径",
    colorSpace: "颜色空间",
    wallData: "墙体数据",
    wallHeight: "墙体高度",
    wallDepth: "墙体厚度",
    wallTopColor: "墙体顶部颜色",
    wallBottomColor: "墙体底部颜色",
    wallInteriorColor: "墙体内侧颜色",
    wallExteriorColor: "墙体外侧颜色",
    wallExteriorTexture: "外侧纹理",
    wallInteriorTexture: "内侧纹理",
    wallFloorTexture: "地板纹理",
    wallRoofTexture: "屋顶纹理",
    floorTexture: "地板纹理",
    roofTexture: "屋顶纹理",
    transparent: "是否透明",
    opacity: "不透明度",
    closed: "是否封闭",
    cube: "立方体",
    cubeDesc: "立方体模型",
    column: "柱子",
    columnDesc: "柱子模型",
    // columnCategory: "装饰模型",
    plant: "盆栽",
    plantDesc: "盆栽模型",
    // plantCategory: "盆栽",
    rack: "机柜",
    rack2: "机柜2",
    rackDesc: "机柜模型",
    // rackCategory: "机柜",
    door: "单开门",
    doorDesc: "门模型",
    // doorCategory: "门",
    doubleDoor: "双开门",
    doubleDoorDesc: "双开门模型",
    marker: "二维标注",
    markerDesc: "二维标注模型",
    skybox: "天空盒",
    skyboxDesc: "创建一个球形天空盒模型，提供自定义的光照和大气效果。",
    wall: "墙体",
    wall2: "墙体 2",
    wallDesc: "墙体模型",
    bed: "床",
    bedDesc: "床模型",
    // bedCategory: "家具",
    window: "窗户",
    windowDesc: "窗户模型",
    // windowCategory: "家具",
};
const i18n = instance.createInstance();
const t = i18n.t;
const lng = "en";
i18n.init({
    lng,
    debug: false,
    resources: {
        en: {
            translation: en,
        },
        cn: {
            translation: cn,
        },
    },
});
/**
 * Change language of current package.
 * @param language - "en" | "cn"
 */
const changeLanguage = (language) => {
    const lng = language;
    i18n.changeLanguage(lng);
};

const Schema$d = {
    width: {
        name: t("width"),
        value: 1,
        type: DataType.Number,
        description: "Width of the cube in meters",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    height: {
        name: t("height"),
        value: 1,
        type: DataType.Number,
        description: "Height of the cube in meters",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    depth: {
        name: t("depth"),
        value: 1,
        type: DataType.Number,
        description: "Depth of the cube in meters",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    color: {
        name: t("color"),
        value: "#ffffff",
        type: DataType.Color,
        description: "Color of the cube",
        group: "appearance",
    },
    image: {
        name: t("texture"),
        value: "",
        type: DataType.String,
        description: "Texture image path for the cube",
        group: "textures",
    },
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the cube in 3D space",
        group: "transform",
    },
    rotation: {
        value: { x: 0, y: 0, z: 0 },
        name: t("rotation"),
        type: DataType.Vector3,
        description: "Rotation of the cube in radians",
        group: "transform",
    },
};
const assetId$d = "builder.cube";
const Config$d = schemaToDefaultConfig(Schema$d);
const creator$a = async (cfg) => {
    mergeConfig(cfg, Config$d);
    const position = cfg.position || new THREE.Vector3();
    const rotation = cfg.rotation || new THREE.Euler();
    const geometry = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
    const material = new THREE.MeshStandardMaterial({ color: cfg.color });
    if (cfg.image) {
        const texture = await loadImage({ map: cfg.image });
        if (texture) {
            material.map = texture;
        }
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.userData = cfg.userData || {};
    return mesh;
};
const init$g = () => {
    const summary = {
        assetId: assetId$d,
        name: t("cube"),
        category: "basic_model",
        description: t("cubeDesc"),
        thumbnail: getThumbnailPath("basic", "thumbnail.png"),
    };
    register(assetId$d, summary, creator$a, Config$d, Schema$d);
};

const init$f = () => {
    init$g();
};

const Schema$c = {
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the marker in 3D space",
        group: "transform",
    },
    rotation2D: {
        value: 0,
        name: t("rotation"),
        type: DataType.Number,
        description: "2D rotation of the marker in degrees",
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
        group: "transform",
    },
    width: {
        value: 29,
        name: t("width"),
        type: DataType.Number,
        description: "Width of the marker in pixels",
        min: 1,
        max: 1000,
        step: 1,
        unit: "px",
        group: "geometry",
    },
    height: {
        value: 41,
        name: t("height"),
        type: DataType.Number,
        description: "Height of the marker in pixels",
        min: 1,
        max: 1000,
        step: 1,
        unit: "px",
        group: "geometry",
    },
    imageUrl: {
        value: "/marker/marker.png",
        name: t("imageUrl"),
        type: DataType.String,
        description: "URL path to the marker image",
        group: "appearance",
    },
};
const assetId$c = "builder.marker";
const Config$c = schemaToDefaultConfig(Schema$c);
const creator$9 = async (cfg) => {
    mergeConfig(cfg, Config$c);
    // Marker creation logic
    const { position, rotation2D, width, height, imageUrl } = cfg;
    const marker = new MarkerDrawable("marker", {
        imageUrl: getModelAssetPath() + imageUrl,
        width: width,
        height: height,
    });
    marker.setPosition(position.x, position.y, position.z); // Set position of the marker
    marker.setRotation(rotation2D);
    return marker;
};
const init$e = () => {
    const summary = {
        assetId: assetId$c,
        name: t("marker"),
        category: "drawable",
        description: t("markerDesc"),
        thumbnail: getThumbnailPath("marker", "thumbnail.png"),
    };
    register(assetId$c, summary, creator$9, Config$c, Schema$c);
};

const init$d = () => {
    init$e();
};

const Schema$b = {
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the column in 3D space",
        group: "transform",
    },
    rotation: {
        value: { x: 0, y: 0, z: 0 },
        name: t("rotation"),
        type: DataType.Vector3,
        description: "Rotation of the column in radians",
        group: "transform",
    },
    texture: {
        value: {
            map: "column/column10.jpg",
        },
        name: t("texture"),
        type: DataType.Object,
        description: "Texture for the column surface",
        group: "textures",
    },
};
const assetId$b = "builder.column";
const Config$b = schemaToDefaultConfig(Schema$b);
const creator$8 = async (cfg) => {
    mergeConfig(cfg, Config$b);
    const position = cfg.position || new THREE.Vector3();
    const rotation = cfg.rotation || new THREE.Euler();
    const width = cfg.width || 0.3;
    const height = cfg.height || 2.4;
    const depth = cfg.depth || 0.3;
    const color = cfg.color || 0xe8e8e8;
    const map = await loadImage(cfg.texture);
    const lightMap = await loadImage({ map: "column/column_lightmap4.jpg" });
    const sideParam = { color };
    const topBottomParam = { color };
    if (map) {
        sideParam.map = map;
    }
    if (lightMap) {
        sideParam.lightMap = lightMap;
    }
    const boxGeo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(boxGeo, [
        new THREE.MeshPhongMaterial(sideParam),
        new THREE.MeshPhongMaterial(sideParam),
        new THREE.MeshBasicMaterial(topBottomParam),
        new THREE.MeshBasicMaterial(topBottomParam),
        new THREE.MeshPhongMaterial(sideParam),
        new THREE.MeshPhongMaterial(sideParam), //后
    ]);
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    return mesh;
};
const init$c = () => {
    const summary = {
        assetId: assetId$b,
        name: t("column"),
        category: "building",
        description: t("columnDesc"),
        thumbnail: getThumbnailPath("column", "thumbnail.png"),
    };
    register(assetId$b, summary, creator$8, Config$b, Schema$b);
};

// Split strategy constants
const CENTER = 0;
const AVERAGE = 1;
const SAH = 2;
const CONTAINED = 2;

// SAH cost constants
// TODO: hone these costs more. The relative difference between them should be the
// difference in measured time to perform a triangle intersection vs traversing
// bounds.
const TRIANGLE_INTERSECT_COST = 1.25;
const TRAVERSAL_COST = 1;


// Build constants
const BYTES_PER_NODE = 6 * 4 + 4 + 4;
const IS_LEAFNODE_FLAG = 0xFFFF;

// EPSILON for computing floating point error during build
// https://en.wikipedia.org/wiki/Machine_epsilon#Values_for_standard_hardware_floating_point_arithmetics
const FLOAT32_EPSILON = Math.pow( 2, - 24 );

const SKIP_GENERATION = Symbol( 'SKIP_GENERATION' );

function getVertexCount$1( geo ) {

	return geo.index ? geo.index.count : geo.attributes.position.count;

}

function getTriCount$1( geo ) {

	return getVertexCount$1( geo ) / 3;

}

function getIndexArray$1( vertexCount, BufferConstructor = ArrayBuffer ) {

	if ( vertexCount > 65535 ) {

		return new Uint32Array( new BufferConstructor( 4 * vertexCount ) );

	} else {

		return new Uint16Array( new BufferConstructor( 2 * vertexCount ) );

	}

}

// ensures that an index is present on the geometry
function ensureIndex$1( geo, options ) {

	if ( ! geo.index ) {

		const vertexCount = geo.attributes.position.count;
		const BufferConstructor = options.useSharedArrayBuffer ? SharedArrayBuffer : ArrayBuffer;
		const index = getIndexArray$1( vertexCount, BufferConstructor );
		geo.setIndex( new BufferAttribute( index, 1 ) );

		for ( let i = 0; i < vertexCount; i ++ ) {

			index[ i ] = i;

		}

	}

}

// Computes the set of { offset, count } ranges which need independent BVH roots. Each
// region in the geometry index that belongs to a different set of material groups requires
// a separate BVH root, so that triangles indices belonging to one group never get swapped
// with triangle indices belongs to another group. For example, if the groups were like this:
//
// [-------------------------------------------------------------]
// |__________________|
//   g0 = [0, 20]  |______________________||_____________________|
//                      g1 = [16, 40]           g2 = [41, 60]
//
// we would need four BVH roots: [0, 15], [16, 20], [21, 40], [41, 60].
function getFullGeometryRange( geo, range ) {

	const triCount = getTriCount$1( geo );
	const drawRange = range ? range : geo.drawRange;
	const start = drawRange.start / 3;
	const end = ( drawRange.start + drawRange.count ) / 3;

	const offset = Math.max( 0, start );
	const count = Math.min( triCount, end ) - offset;
	return [ {
		offset: Math.floor( offset ),
		count: Math.floor( count ),
	} ];

}

function getRootIndexRanges( geo, range ) {

	if ( ! geo.groups || ! geo.groups.length ) {

		return getFullGeometryRange( geo, range );

	}

	const ranges = [];
	const rangeBoundaries = new Set();

	const drawRange = range ? range : geo.drawRange;
	const drawRangeStart = drawRange.start / 3;
	const drawRangeEnd = ( drawRange.start + drawRange.count ) / 3;
	for ( const group of geo.groups ) {

		const groupStart = group.start / 3;
		const groupEnd = ( group.start + group.count ) / 3;
		rangeBoundaries.add( Math.max( drawRangeStart, groupStart ) );
		rangeBoundaries.add( Math.min( drawRangeEnd, groupEnd ) );

	}


	// note that if you don't pass in a comparator, it sorts them lexicographically as strings :-(
	const sortedBoundaries = Array.from( rangeBoundaries.values() ).sort( ( a, b ) => a - b );
	for ( let i = 0; i < sortedBoundaries.length - 1; i ++ ) {

		const start = sortedBoundaries[ i ];
		const end = sortedBoundaries[ i + 1 ];

		ranges.push( {
			offset: Math.floor( start ),
			count: Math.floor( end - start ),
		} );

	}

	return ranges;

}

function hasGroupGaps( geometry, range ) {

	const vertexCount = getTriCount$1( geometry );
	const groups = getRootIndexRanges( geometry, range )
		.sort( ( a, b ) => a.offset - b.offset );

	const finalGroup = groups[ groups.length - 1 ];
	finalGroup.count = Math.min( vertexCount - finalGroup.offset, finalGroup.count );

	let total = 0;
	groups.forEach( ( { count } ) => total += count );
	return vertexCount !== total;

}

// computes the union of the bounds of all of the given triangles and puts the resulting box in "target".
// A bounding box is computed for the centroids of the triangles, as well, and placed in "centroidTarget".
// These are computed together to avoid redundant accesses to bounds array.
function getBounds( triangleBounds, offset, count, target, centroidTarget ) {

	let minx = Infinity;
	let miny = Infinity;
	let minz = Infinity;
	let maxx = - Infinity;
	let maxy = - Infinity;
	let maxz = - Infinity;

	let cminx = Infinity;
	let cminy = Infinity;
	let cminz = Infinity;
	let cmaxx = - Infinity;
	let cmaxy = - Infinity;
	let cmaxz = - Infinity;

	for ( let i = offset * 6, end = ( offset + count ) * 6; i < end; i += 6 ) {

		const cx = triangleBounds[ i + 0 ];
		const hx = triangleBounds[ i + 1 ];
		const lx = cx - hx;
		const rx = cx + hx;
		if ( lx < minx ) minx = lx;
		if ( rx > maxx ) maxx = rx;
		if ( cx < cminx ) cminx = cx;
		if ( cx > cmaxx ) cmaxx = cx;

		const cy = triangleBounds[ i + 2 ];
		const hy = triangleBounds[ i + 3 ];
		const ly = cy - hy;
		const ry = cy + hy;
		if ( ly < miny ) miny = ly;
		if ( ry > maxy ) maxy = ry;
		if ( cy < cminy ) cminy = cy;
		if ( cy > cmaxy ) cmaxy = cy;

		const cz = triangleBounds[ i + 4 ];
		const hz = triangleBounds[ i + 5 ];
		const lz = cz - hz;
		const rz = cz + hz;
		if ( lz < minz ) minz = lz;
		if ( rz > maxz ) maxz = rz;
		if ( cz < cminz ) cminz = cz;
		if ( cz > cmaxz ) cmaxz = cz;

	}

	target[ 0 ] = minx;
	target[ 1 ] = miny;
	target[ 2 ] = minz;

	target[ 3 ] = maxx;
	target[ 4 ] = maxy;
	target[ 5 ] = maxz;

	centroidTarget[ 0 ] = cminx;
	centroidTarget[ 1 ] = cminy;
	centroidTarget[ 2 ] = cminz;

	centroidTarget[ 3 ] = cmaxx;
	centroidTarget[ 4 ] = cmaxy;
	centroidTarget[ 5 ] = cmaxz;

}

// precomputes the bounding box for each triangle; required for quickly calculating tree splits.
// result is an array of size tris.length * 6 where triangle i maps to a
// [x_center, x_delta, y_center, y_delta, z_center, z_delta] tuple starting at index i * 6,
// representing the center and half-extent in each dimension of triangle i
function computeTriangleBounds( geo, target = null, offset = null, count = null ) {

	const posAttr = geo.attributes.position;
	const index = geo.index ? geo.index.array : null;
	const triCount = getTriCount$1( geo );
	const normalized = posAttr.normalized;
	let triangleBounds;
	if ( target === null ) {

		triangleBounds = new Float32Array( triCount * 6 );
		offset = 0;
		count = triCount;

	} else {

		triangleBounds = target;
		offset = offset || 0;
		count = count || triCount;

	}

	// used for non-normalized positions
	const posArr = posAttr.array;

	// support for an interleaved position buffer
	const bufferOffset = posAttr.offset || 0;
	let stride = 3;
	if ( posAttr.isInterleavedBufferAttribute ) {

		stride = posAttr.data.stride;

	}

	// used for normalized positions
	const getters = [ 'getX', 'getY', 'getZ' ];

	for ( let tri = offset; tri < offset + count; tri ++ ) {

		const tri3 = tri * 3;
		const tri6 = tri * 6;

		let ai = tri3 + 0;
		let bi = tri3 + 1;
		let ci = tri3 + 2;

		if ( index ) {

			ai = index[ ai ];
			bi = index[ bi ];
			ci = index[ ci ];

		}

		// we add the stride and offset here since we access the array directly
		// below for the sake of performance
		if ( ! normalized ) {

			ai = ai * stride + bufferOffset;
			bi = bi * stride + bufferOffset;
			ci = ci * stride + bufferOffset;

		}

		for ( let el = 0; el < 3; el ++ ) {

			let a, b, c;

			if ( normalized ) {

				a = posAttr[ getters[ el ] ]( ai );
				b = posAttr[ getters[ el ] ]( bi );
				c = posAttr[ getters[ el ] ]( ci );

			} else {

				a = posArr[ ai + el ];
				b = posArr[ bi + el ];
				c = posArr[ ci + el ];

			}

			let min = a;
			if ( b < min ) min = b;
			if ( c < min ) min = c;

			let max = a;
			if ( b > max ) max = b;
			if ( c > max ) max = c;

			// Increase the bounds size by float32 epsilon to avoid precision errors when
			// converting to 32 bit float. Scale the epsilon by the size of the numbers being
			// worked with.
			const halfExtents = ( max - min ) / 2;
			const el2 = el * 2;
			triangleBounds[ tri6 + el2 + 0 ] = min + halfExtents;
			triangleBounds[ tri6 + el2 + 1 ] = halfExtents + ( Math.abs( min ) + halfExtents ) * FLOAT32_EPSILON;

		}

	}

	return triangleBounds;

}

function arrayToBox( nodeIndex32, array, target ) {

	target.min.x = array[ nodeIndex32 ];
	target.min.y = array[ nodeIndex32 + 1 ];
	target.min.z = array[ nodeIndex32 + 2 ];

	target.max.x = array[ nodeIndex32 + 3 ];
	target.max.y = array[ nodeIndex32 + 4 ];
	target.max.z = array[ nodeIndex32 + 5 ];

	return target;

}

function getLongestEdgeIndex( bounds ) {

	let splitDimIdx = - 1;
	let splitDist = - Infinity;

	for ( let i = 0; i < 3; i ++ ) {

		const dist = bounds[ i + 3 ] - bounds[ i ];
		if ( dist > splitDist ) {

			splitDist = dist;
			splitDimIdx = i;

		}

	}

	return splitDimIdx;

}

// copies bounds a into bounds b
function copyBounds( source, target ) {

	target.set( source );

}

// sets bounds target to the union of bounds a and b
function unionBounds( a, b, target ) {

	let aVal, bVal;
	for ( let d = 0; d < 3; d ++ ) {

		const d3 = d + 3;

		// set the minimum values
		aVal = a[ d ];
		bVal = b[ d ];
		target[ d ] = aVal < bVal ? aVal : bVal;

		// set the max values
		aVal = a[ d3 ];
		bVal = b[ d3 ];
		target[ d3 ] = aVal > bVal ? aVal : bVal;

	}

}

// expands the given bounds by the provided triangle bounds
function expandByTriangleBounds( startIndex, triangleBounds, bounds ) {

	for ( let d = 0; d < 3; d ++ ) {

		const tCenter = triangleBounds[ startIndex + 2 * d ];
		const tHalf = triangleBounds[ startIndex + 2 * d + 1 ];

		const tMin = tCenter - tHalf;
		const tMax = tCenter + tHalf;

		if ( tMin < bounds[ d ] ) {

			bounds[ d ] = tMin;

		}

		if ( tMax > bounds[ d + 3 ] ) {

			bounds[ d + 3 ] = tMax;

		}

	}

}

// compute bounds surface area
function computeSurfaceArea( bounds ) {

	const d0 = bounds[ 3 ] - bounds[ 0 ];
	const d1 = bounds[ 4 ] - bounds[ 1 ];
	const d2 = bounds[ 5 ] - bounds[ 2 ];

	return 2 * ( d0 * d1 + d1 * d2 + d2 * d0 );

}

const BIN_COUNT = 32;
const binsSort = ( a, b ) => a.candidate - b.candidate;
const sahBins = new Array( BIN_COUNT ).fill().map( () => {

	return {

		count: 0,
		bounds: new Float32Array( 6 ),
		rightCacheBounds: new Float32Array( 6 ),
		leftCacheBounds: new Float32Array( 6 ),
		candidate: 0,

	};

} );
const leftBounds = new Float32Array( 6 );

function getOptimalSplit( nodeBoundingData, centroidBoundingData, triangleBounds, offset, count, strategy ) {

	let axis = - 1;
	let pos = 0;

	// Center
	if ( strategy === CENTER ) {

		axis = getLongestEdgeIndex( centroidBoundingData );
		if ( axis !== - 1 ) {

			pos = ( centroidBoundingData[ axis ] + centroidBoundingData[ axis + 3 ] ) / 2;

		}

	} else if ( strategy === AVERAGE ) {

		axis = getLongestEdgeIndex( nodeBoundingData );
		if ( axis !== - 1 ) {

			pos = getAverage( triangleBounds, offset, count, axis );

		}

	} else if ( strategy === SAH ) {

		const rootSurfaceArea = computeSurfaceArea( nodeBoundingData );
		let bestCost = TRIANGLE_INTERSECT_COST * count;

		// iterate over all axes
		const cStart = offset * 6;
		const cEnd = ( offset + count ) * 6;
		for ( let a = 0; a < 3; a ++ ) {

			const axisLeft = centroidBoundingData[ a ];
			const axisRight = centroidBoundingData[ a + 3 ];
			const axisLength = axisRight - axisLeft;
			const binWidth = axisLength / BIN_COUNT;

			// If we have fewer triangles than we're planning to split then just check all
			// the triangle positions because it will be faster.
			if ( count < BIN_COUNT / 4 ) {

				// initialize the bin candidates
				const truncatedBins = [ ...sahBins ];
				truncatedBins.length = count;

				// set the candidates
				let b = 0;
				for ( let c = cStart; c < cEnd; c += 6, b ++ ) {

					const bin = truncatedBins[ b ];
					bin.candidate = triangleBounds[ c + 2 * a ];
					bin.count = 0;

					const {
						bounds,
						leftCacheBounds,
						rightCacheBounds,
					} = bin;
					for ( let d = 0; d < 3; d ++ ) {

						rightCacheBounds[ d ] = Infinity;
						rightCacheBounds[ d + 3 ] = - Infinity;

						leftCacheBounds[ d ] = Infinity;
						leftCacheBounds[ d + 3 ] = - Infinity;

						bounds[ d ] = Infinity;
						bounds[ d + 3 ] = - Infinity;

					}

					expandByTriangleBounds( c, triangleBounds, bounds );

				}

				truncatedBins.sort( binsSort );

				// remove redundant splits
				let splitCount = count;
				for ( let bi = 0; bi < splitCount; bi ++ ) {

					const bin = truncatedBins[ bi ];
					while ( bi + 1 < splitCount && truncatedBins[ bi + 1 ].candidate === bin.candidate ) {

						truncatedBins.splice( bi + 1, 1 );
						splitCount --;

					}

				}

				// find the appropriate bin for each triangle and expand the bounds.
				for ( let c = cStart; c < cEnd; c += 6 ) {

					const center = triangleBounds[ c + 2 * a ];
					for ( let bi = 0; bi < splitCount; bi ++ ) {

						const bin = truncatedBins[ bi ];
						if ( center >= bin.candidate ) {

							expandByTriangleBounds( c, triangleBounds, bin.rightCacheBounds );

						} else {

							expandByTriangleBounds( c, triangleBounds, bin.leftCacheBounds );
							bin.count ++;

						}

					}

				}

				// expand all the bounds
				for ( let bi = 0; bi < splitCount; bi ++ ) {

					const bin = truncatedBins[ bi ];
					const leftCount = bin.count;
					const rightCount = count - bin.count;

					// check the cost of this split
					const leftBounds = bin.leftCacheBounds;
					const rightBounds = bin.rightCacheBounds;

					let leftProb = 0;
					if ( leftCount !== 0 ) {

						leftProb = computeSurfaceArea( leftBounds ) / rootSurfaceArea;

					}

					let rightProb = 0;
					if ( rightCount !== 0 ) {

						rightProb = computeSurfaceArea( rightBounds ) / rootSurfaceArea;

					}

					const cost = TRAVERSAL_COST + TRIANGLE_INTERSECT_COST * (
						leftProb * leftCount + rightProb * rightCount
					);

					if ( cost < bestCost ) {

						axis = a;
						bestCost = cost;
						pos = bin.candidate;

					}

				}

			} else {

				// reset the bins
				for ( let i = 0; i < BIN_COUNT; i ++ ) {

					const bin = sahBins[ i ];
					bin.count = 0;
					bin.candidate = axisLeft + binWidth + i * binWidth;

					const bounds = bin.bounds;
					for ( let d = 0; d < 3; d ++ ) {

						bounds[ d ] = Infinity;
						bounds[ d + 3 ] = - Infinity;

					}

				}

				// iterate over all center positions
				for ( let c = cStart; c < cEnd; c += 6 ) {

					const triCenter = triangleBounds[ c + 2 * a ];
					const relativeCenter = triCenter - axisLeft;

					// in the partition function if the centroid lies on the split plane then it is
					// considered to be on the right side of the split
					let binIndex = ~ ~ ( relativeCenter / binWidth );
					if ( binIndex >= BIN_COUNT ) binIndex = BIN_COUNT - 1;

					const bin = sahBins[ binIndex ];
					bin.count ++;

					expandByTriangleBounds( c, triangleBounds, bin.bounds );

				}

				// cache the unioned bounds from right to left so we don't have to regenerate them each time
				const lastBin = sahBins[ BIN_COUNT - 1 ];
				copyBounds( lastBin.bounds, lastBin.rightCacheBounds );
				for ( let i = BIN_COUNT - 2; i >= 0; i -- ) {

					const bin = sahBins[ i ];
					const nextBin = sahBins[ i + 1 ];
					unionBounds( bin.bounds, nextBin.rightCacheBounds, bin.rightCacheBounds );

				}

				let leftCount = 0;
				for ( let i = 0; i < BIN_COUNT - 1; i ++ ) {

					const bin = sahBins[ i ];
					const binCount = bin.count;
					const bounds = bin.bounds;

					const nextBin = sahBins[ i + 1 ];
					const rightBounds = nextBin.rightCacheBounds;

					// don't do anything with the bounds if the new bounds have no triangles
					if ( binCount !== 0 ) {

						if ( leftCount === 0 ) {

							copyBounds( bounds, leftBounds );

						} else {

							unionBounds( bounds, leftBounds, leftBounds );

						}

					}

					leftCount += binCount;

					// check the cost of this split
					let leftProb = 0;
					let rightProb = 0;

					if ( leftCount !== 0 ) {

						leftProb = computeSurfaceArea( leftBounds ) / rootSurfaceArea;

					}

					const rightCount = count - leftCount;
					if ( rightCount !== 0 ) {

						rightProb = computeSurfaceArea( rightBounds ) / rootSurfaceArea;

					}

					const cost = TRAVERSAL_COST + TRIANGLE_INTERSECT_COST * (
						leftProb * leftCount + rightProb * rightCount
					);

					if ( cost < bestCost ) {

						axis = a;
						bestCost = cost;
						pos = bin.candidate;

					}

				}

			}

		}

	} else {

		console.warn( `MeshBVH: Invalid build strategy value ${ strategy } used.` );

	}

	return { axis, pos };

}

// returns the average coordinate on the specified axis of the all the provided triangles
function getAverage( triangleBounds, offset, count, axis ) {

	let avg = 0;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		avg += triangleBounds[ i * 6 + axis * 2 ];

	}

	return avg / count;

}

class MeshBVHNode {

	constructor() {

		// internal nodes have boundingData, left, right, and splitAxis
		// leaf nodes have offset and count (referring to primitives in the mesh geometry)

		this.boundingData = new Float32Array( 6 );

	}

}

/********************************************************/
/* This file is generated from "sortUtils.template.js". */
/********************************************************/
// reorders `tris` such that for `count` elements after `offset`, elements on the left side of the split
// will be on the left and elements on the right side of the split will be on the right. returns the index
// of the first element on the right side, or offset + count if there are no elements on the right side.
function partition( indirectBuffer, index, triangleBounds, offset, count, split ) {

	let left = offset;
	let right = offset + count - 1;
	const pos = split.pos;
	const axisOffset = split.axis * 2;

	// hoare partitioning, see e.g. https://en.wikipedia.org/wiki/Quicksort#Hoare_partition_scheme
	while ( true ) {

		while ( left <= right && triangleBounds[ left * 6 + axisOffset ] < pos ) {

			left ++;

		}

		// if a triangle center lies on the partition plane it is considered to be on the right side
		while ( left <= right && triangleBounds[ right * 6 + axisOffset ] >= pos ) {

			right --;

		}

		if ( left < right ) {

			// we need to swap all of the information associated with the triangles at index
			// left and right; that's the verts in the geometry index, the bounds,
			// and perhaps the SAH planes

			for ( let i = 0; i < 3; i ++ ) {

				let t0 = index[ left * 3 + i ];
				index[ left * 3 + i ] = index[ right * 3 + i ];
				index[ right * 3 + i ] = t0;

			}


			// swap bounds
			for ( let i = 0; i < 6; i ++ ) {

				let tb = triangleBounds[ left * 6 + i ];
				triangleBounds[ left * 6 + i ] = triangleBounds[ right * 6 + i ];
				triangleBounds[ right * 6 + i ] = tb;

			}

			left ++;
			right --;

		} else {

			return left;

		}

	}

}

/********************************************************/
/* This file is generated from "sortUtils.template.js". */
/********************************************************/
// reorders `tris` such that for `count` elements after `offset`, elements on the left side of the split
// will be on the left and elements on the right side of the split will be on the right. returns the index
// of the first element on the right side, or offset + count if there are no elements on the right side.
function partition_indirect( indirectBuffer, index, triangleBounds, offset, count, split ) {

	let left = offset;
	let right = offset + count - 1;
	const pos = split.pos;
	const axisOffset = split.axis * 2;

	// hoare partitioning, see e.g. https://en.wikipedia.org/wiki/Quicksort#Hoare_partition_scheme
	while ( true ) {

		while ( left <= right && triangleBounds[ left * 6 + axisOffset ] < pos ) {

			left ++;

		}

		// if a triangle center lies on the partition plane it is considered to be on the right side
		while ( left <= right && triangleBounds[ right * 6 + axisOffset ] >= pos ) {

			right --;

		}

		if ( left < right ) {

			// we need to swap all of the information associated with the triangles at index
			// left and right; that's the verts in the geometry index, the bounds,
			// and perhaps the SAH planes
			let t = indirectBuffer[ left ];
			indirectBuffer[ left ] = indirectBuffer[ right ];
			indirectBuffer[ right ] = t;


			// swap bounds
			for ( let i = 0; i < 6; i ++ ) {

				let tb = triangleBounds[ left * 6 + i ];
				triangleBounds[ left * 6 + i ] = triangleBounds[ right * 6 + i ];
				triangleBounds[ right * 6 + i ] = tb;

			}

			left ++;
			right --;

		} else {

			return left;

		}

	}

}

function IS_LEAF( n16, uint16Array ) {

	return uint16Array[ n16 + 15 ] === 0xFFFF;

}

function OFFSET( n32, uint32Array ) {

	return uint32Array[ n32 + 6 ];

}

function COUNT( n16, uint16Array ) {

	return uint16Array[ n16 + 14 ];

}

function LEFT_NODE( n32 ) {

	return n32 + 8;

}

function RIGHT_NODE( n32, uint32Array ) {

	return uint32Array[ n32 + 6 ];

}

function SPLIT_AXIS( n32, uint32Array ) {

	return uint32Array[ n32 + 7 ];

}

function BOUNDING_DATA_INDEX( n32 ) {

	return n32;

}

let float32Array, uint32Array, uint16Array, uint8Array;
const MAX_POINTER = Math.pow( 2, 32 );

function countNodes( node ) {

	if ( 'count' in node ) {

		return 1;

	} else {

		return 1 + countNodes( node.left ) + countNodes( node.right );

	}

}

function populateBuffer( byteOffset, node, buffer ) {

	float32Array = new Float32Array( buffer );
	uint32Array = new Uint32Array( buffer );
	uint16Array = new Uint16Array( buffer );
	uint8Array = new Uint8Array( buffer );

	return _populateBuffer( byteOffset, node );

}

// pack structure
// boundingData  				: 6 float32
// right / offset 				: 1 uint32
// splitAxis / isLeaf + count 	: 1 uint32 / 2 uint16
function _populateBuffer( byteOffset, node ) {

	const stride4Offset = byteOffset / 4;
	const stride2Offset = byteOffset / 2;
	const isLeaf = 'count' in node;
	const boundingData = node.boundingData;
	for ( let i = 0; i < 6; i ++ ) {

		float32Array[ stride4Offset + i ] = boundingData[ i ];

	}

	if ( isLeaf ) {

		if ( node.buffer ) {

			const buffer = node.buffer;
			uint8Array.set( new Uint8Array( buffer ), byteOffset );

			for ( let offset = byteOffset, l = byteOffset + buffer.byteLength; offset < l; offset += BYTES_PER_NODE ) {

				const offset2 = offset / 2;
				if ( ! IS_LEAF( offset2, uint16Array ) ) {

					uint32Array[ ( offset / 4 ) + 6 ] += stride4Offset;


				}

			}

			return byteOffset + buffer.byteLength;

		} else {

			const offset = node.offset;
			const count = node.count;
			uint32Array[ stride4Offset + 6 ] = offset;
			uint16Array[ stride2Offset + 14 ] = count;
			uint16Array[ stride2Offset + 15 ] = IS_LEAFNODE_FLAG;
			return byteOffset + BYTES_PER_NODE;

		}

	} else {

		const left = node.left;
		const right = node.right;
		const splitAxis = node.splitAxis;

		let nextUnusedPointer;
		nextUnusedPointer = _populateBuffer( byteOffset + BYTES_PER_NODE, left );

		if ( ( nextUnusedPointer / 4 ) > MAX_POINTER ) {

			throw new Error( 'MeshBVH: Cannot store child pointer greater than 32 bits.' );

		}

		uint32Array[ stride4Offset + 6 ] = nextUnusedPointer / 4;
		nextUnusedPointer = _populateBuffer( nextUnusedPointer, right );

		uint32Array[ stride4Offset + 7 ] = splitAxis;
		return nextUnusedPointer;

	}

}

function generateIndirectBuffer( geometry, useSharedArrayBuffer ) {

	const triCount = ( geometry.index ? geometry.index.count : geometry.attributes.position.count ) / 3;
	const useUint32 = triCount > 2 ** 16;
	const byteCount = useUint32 ? 4 : 2;

	const buffer = useSharedArrayBuffer ? new SharedArrayBuffer( triCount * byteCount ) : new ArrayBuffer( triCount * byteCount );
	const indirectBuffer = useUint32 ? new Uint32Array( buffer ) : new Uint16Array( buffer );
	for ( let i = 0, l = indirectBuffer.length; i < l; i ++ ) {

		indirectBuffer[ i ] = i;

	}

	return indirectBuffer;

}

function buildTree( bvh, triangleBounds, offset, count, options ) {

	// epxand variables
	const {
		maxDepth,
		verbose,
		maxLeafTris,
		strategy,
		onProgress,
		indirect,
	} = options;
	const indirectBuffer = bvh._indirectBuffer;
	const geometry = bvh.geometry;
	const indexArray = geometry.index ? geometry.index.array : null;
	const partionFunc = indirect ? partition_indirect : partition;

	// generate intermediate variables
	const totalTriangles = getTriCount$1( geometry );
	const cacheCentroidBoundingData = new Float32Array( 6 );
	let reachedMaxDepth = false;

	const root = new MeshBVHNode();
	getBounds( triangleBounds, offset, count, root.boundingData, cacheCentroidBoundingData );
	splitNode( root, offset, count, cacheCentroidBoundingData );
	return root;

	function triggerProgress( trianglesProcessed ) {

		if ( onProgress ) {

			onProgress( trianglesProcessed / totalTriangles );

		}

	}

	// either recursively splits the given node, creating left and right subtrees for it, or makes it a leaf node,
	// recording the offset and count of its triangles and writing them into the reordered geometry index.
	function splitNode( node, offset, count, centroidBoundingData = null, depth = 0 ) {

		if ( ! reachedMaxDepth && depth >= maxDepth ) {

			reachedMaxDepth = true;
			if ( verbose ) {

				console.warn( `MeshBVH: Max depth of ${ maxDepth } reached when generating BVH. Consider increasing maxDepth.` );
				console.warn( geometry );

			}

		}

		// early out if we've met our capacity
		if ( count <= maxLeafTris || depth >= maxDepth ) {

			triggerProgress( offset + count );
			node.offset = offset;
			node.count = count;
			return node;

		}

		// Find where to split the volume
		const split = getOptimalSplit( node.boundingData, centroidBoundingData, triangleBounds, offset, count, strategy );
		if ( split.axis === - 1 ) {

			triggerProgress( offset + count );
			node.offset = offset;
			node.count = count;
			return node;

		}

		const splitOffset = partionFunc( indirectBuffer, indexArray, triangleBounds, offset, count, split );

		// create the two new child nodes
		if ( splitOffset === offset || splitOffset === offset + count ) {

			triggerProgress( offset + count );
			node.offset = offset;
			node.count = count;

		} else {

			node.splitAxis = split.axis;

			// create the left child and compute its bounding box
			const left = new MeshBVHNode();
			const lstart = offset;
			const lcount = splitOffset - offset;
			node.left = left;

			getBounds( triangleBounds, lstart, lcount, left.boundingData, cacheCentroidBoundingData );
			splitNode( left, lstart, lcount, cacheCentroidBoundingData, depth + 1 );

			// repeat for right
			const right = new MeshBVHNode();
			const rstart = splitOffset;
			const rcount = count - lcount;
			node.right = right;

			getBounds( triangleBounds, rstart, rcount, right.boundingData, cacheCentroidBoundingData );
			splitNode( right, rstart, rcount, cacheCentroidBoundingData, depth + 1 );

		}

		return node;

	}

}

function buildPackedTree( bvh, options ) {

	const geometry = bvh.geometry;
	if ( options.indirect ) {

		bvh._indirectBuffer = generateIndirectBuffer( geometry, options.useSharedArrayBuffer );

		if ( hasGroupGaps( geometry, options.range ) && ! options.verbose ) {

			console.warn(
				'MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. ' +
				'BVH may incorrectly report intersections on unrendered portions of the geometry.'
			);

		}

	}

	if ( ! bvh._indirectBuffer ) {

		ensureIndex$1( geometry, options );

	}

	const BufferConstructor = options.useSharedArrayBuffer ? SharedArrayBuffer : ArrayBuffer;

	const triangleBounds = computeTriangleBounds( geometry );
	const geometryRanges = options.indirect ? getFullGeometryRange( geometry, options.range ) : getRootIndexRanges( geometry, options.range );
	bvh._roots = geometryRanges.map( range => {

		const root = buildTree( bvh, triangleBounds, range.offset, range.count, options );
		const nodeCount = countNodes( root );
		const buffer = new BufferConstructor( BYTES_PER_NODE * nodeCount );
		populateBuffer( 0, root, buffer );
		return buffer;

	} );

}

class SeparatingAxisBounds {

	constructor() {

		this.min = Infinity;
		this.max = - Infinity;

	}

	setFromPointsField( points, field ) {

		let min = Infinity;
		let max = - Infinity;
		for ( let i = 0, l = points.length; i < l; i ++ ) {

			const p = points[ i ];
			const val = p[ field ];
			min = val < min ? val : min;
			max = val > max ? val : max;

		}

		this.min = min;
		this.max = max;

	}

	setFromPoints( axis, points ) {

		let min = Infinity;
		let max = - Infinity;
		for ( let i = 0, l = points.length; i < l; i ++ ) {

			const p = points[ i ];
			const val = axis.dot( p );
			min = val < min ? val : min;
			max = val > max ? val : max;

		}

		this.min = min;
		this.max = max;

	}

	isSeparated( other ) {

		return this.min > other.max || other.min > this.max;

	}

}

SeparatingAxisBounds.prototype.setFromBox = ( function () {

	const p = new Vector3();
	return function setFromBox( axis, box ) {

		const boxMin = box.min;
		const boxMax = box.max;
		let min = Infinity;
		let max = - Infinity;
		for ( let x = 0; x <= 1; x ++ ) {

			for ( let y = 0; y <= 1; y ++ ) {

				for ( let z = 0; z <= 1; z ++ ) {

					p.x = boxMin.x * x + boxMax.x * ( 1 - x );
					p.y = boxMin.y * y + boxMax.y * ( 1 - y );
					p.z = boxMin.z * z + boxMax.z * ( 1 - z );

					const val = axis.dot( p );
					min = Math.min( val, min );
					max = Math.max( val, max );

				}

			}

		}

		this.min = min;
		this.max = max;

	};

} )();

const closestPointLineToLine = ( function () {

	// https://github.com/juj/MathGeoLib/blob/master/src/Geometry/Line.cpp#L56
	const dir1 = new Vector3();
	const dir2 = new Vector3();
	const v02 = new Vector3();
	return function closestPointLineToLine( l1, l2, result ) {

		const v0 = l1.start;
		const v10 = dir1;
		const v2 = l2.start;
		const v32 = dir2;

		v02.subVectors( v0, v2 );
		dir1.subVectors( l1.end, l1.start );
		dir2.subVectors( l2.end, l2.start );

		// float d0232 = v02.Dot(v32);
		const d0232 = v02.dot( v32 );

		// float d3210 = v32.Dot(v10);
		const d3210 = v32.dot( v10 );

		// float d3232 = v32.Dot(v32);
		const d3232 = v32.dot( v32 );

		// float d0210 = v02.Dot(v10);
		const d0210 = v02.dot( v10 );

		// float d1010 = v10.Dot(v10);
		const d1010 = v10.dot( v10 );

		// float denom = d1010*d3232 - d3210*d3210;
		const denom = d1010 * d3232 - d3210 * d3210;

		let d, d2;
		if ( denom !== 0 ) {

			d = ( d0232 * d3210 - d0210 * d3232 ) / denom;

		} else {

			d = 0;

		}

		d2 = ( d0232 + d * d3210 ) / d3232;

		result.x = d;
		result.y = d2;

	};

} )();

const closestPointsSegmentToSegment = ( function () {

	// https://github.com/juj/MathGeoLib/blob/master/src/Geometry/LineSegment.cpp#L187
	const paramResult = new Vector2();
	const temp1 = new Vector3();
	const temp2 = new Vector3();
	return function closestPointsSegmentToSegment( l1, l2, target1, target2 ) {

		closestPointLineToLine( l1, l2, paramResult );

		let d = paramResult.x;
		let d2 = paramResult.y;
		if ( d >= 0 && d <= 1 && d2 >= 0 && d2 <= 1 ) {

			l1.at( d, target1 );
			l2.at( d2, target2 );

			return;

		} else if ( d >= 0 && d <= 1 ) {

			// Only d2 is out of bounds.
			if ( d2 < 0 ) {

				l2.at( 0, target2 );

			} else {

				l2.at( 1, target2 );

			}

			l1.closestPointToPoint( target2, true, target1 );
			return;

		} else if ( d2 >= 0 && d2 <= 1 ) {

			// Only d is out of bounds.
			if ( d < 0 ) {

				l1.at( 0, target1 );

			} else {

				l1.at( 1, target1 );

			}

			l2.closestPointToPoint( target1, true, target2 );
			return;

		} else {

			// Both u and u2 are out of bounds.
			let p;
			if ( d < 0 ) {

				p = l1.start;

			} else {

				p = l1.end;

			}

			let p2;
			if ( d2 < 0 ) {

				p2 = l2.start;

			} else {

				p2 = l2.end;

			}

			const closestPoint = temp1;
			const closestPoint2 = temp2;
			l1.closestPointToPoint( p2, true, temp1 );
			l2.closestPointToPoint( p, true, temp2 );

			if ( closestPoint.distanceToSquared( p2 ) <= closestPoint2.distanceToSquared( p ) ) {

				target1.copy( closestPoint );
				target2.copy( p2 );
				return;

			} else {

				target1.copy( p );
				target2.copy( closestPoint2 );
				return;

			}

		}

	};

} )();


const sphereIntersectTriangle = ( function () {

	// https://stackoverflow.com/questions/34043955/detect-collision-between-sphere-and-triangle-in-three-js
	const closestPointTemp = new Vector3();
	const projectedPointTemp = new Vector3();
	const planeTemp = new Plane();
	const lineTemp = new Line3();
	return function sphereIntersectTriangle( sphere, triangle ) {

		const { radius, center } = sphere;
		const { a, b, c } = triangle;

		// phase 1
		lineTemp.start = a;
		lineTemp.end = b;
		const closestPoint1 = lineTemp.closestPointToPoint( center, true, closestPointTemp );
		if ( closestPoint1.distanceTo( center ) <= radius ) return true;

		lineTemp.start = a;
		lineTemp.end = c;
		const closestPoint2 = lineTemp.closestPointToPoint( center, true, closestPointTemp );
		if ( closestPoint2.distanceTo( center ) <= radius ) return true;

		lineTemp.start = b;
		lineTemp.end = c;
		const closestPoint3 = lineTemp.closestPointToPoint( center, true, closestPointTemp );
		if ( closestPoint3.distanceTo( center ) <= radius ) return true;

		// phase 2
		const plane = triangle.getPlane( planeTemp );
		const dp = Math.abs( plane.distanceToPoint( center ) );
		if ( dp <= radius ) {

			const pp = plane.projectPoint( center, projectedPointTemp );
			const cp = triangle.containsPoint( pp );
			if ( cp ) return true;

		}

		return false;

	};

} )();

const ZERO_EPSILON = 1e-15;
function isNearZero( value ) {

	return Math.abs( value ) < ZERO_EPSILON;

}

class ExtendedTriangle extends Triangle {

	constructor( ...args ) {

		super( ...args );

		this.isExtendedTriangle = true;
		this.satAxes = new Array( 4 ).fill().map( () => new Vector3() );
		this.satBounds = new Array( 4 ).fill().map( () => new SeparatingAxisBounds() );
		this.points = [ this.a, this.b, this.c ];
		this.sphere = new Sphere();
		this.plane = new Plane();
		this.needsUpdate = true;

	}

	intersectsSphere( sphere ) {

		return sphereIntersectTriangle( sphere, this );

	}

	update() {

		const a = this.a;
		const b = this.b;
		const c = this.c;
		const points = this.points;

		const satAxes = this.satAxes;
		const satBounds = this.satBounds;

		const axis0 = satAxes[ 0 ];
		const sab0 = satBounds[ 0 ];
		this.getNormal( axis0 );
		sab0.setFromPoints( axis0, points );

		const axis1 = satAxes[ 1 ];
		const sab1 = satBounds[ 1 ];
		axis1.subVectors( a, b );
		sab1.setFromPoints( axis1, points );

		const axis2 = satAxes[ 2 ];
		const sab2 = satBounds[ 2 ];
		axis2.subVectors( b, c );
		sab2.setFromPoints( axis2, points );

		const axis3 = satAxes[ 3 ];
		const sab3 = satBounds[ 3 ];
		axis3.subVectors( c, a );
		sab3.setFromPoints( axis3, points );

		this.sphere.setFromPoints( this.points );
		this.plane.setFromNormalAndCoplanarPoint( axis0, a );
		this.needsUpdate = false;

	}

}

ExtendedTriangle.prototype.closestPointToSegment = ( function () {

	const point1 = new Vector3();
	const point2 = new Vector3();
	const edge = new Line3();

	return function distanceToSegment( segment, target1 = null, target2 = null ) {

		const { start, end } = segment;
		const points = this.points;
		let distSq;
		let closestDistanceSq = Infinity;

		// check the triangle edges
		for ( let i = 0; i < 3; i ++ ) {

			const nexti = ( i + 1 ) % 3;
			edge.start.copy( points[ i ] );
			edge.end.copy( points[ nexti ] );

			closestPointsSegmentToSegment( edge, segment, point1, point2 );

			distSq = point1.distanceToSquared( point2 );
			if ( distSq < closestDistanceSq ) {

				closestDistanceSq = distSq;
				if ( target1 ) target1.copy( point1 );
				if ( target2 ) target2.copy( point2 );

			}

		}

		// check end points
		this.closestPointToPoint( start, point1 );
		distSq = start.distanceToSquared( point1 );
		if ( distSq < closestDistanceSq ) {

			closestDistanceSq = distSq;
			if ( target1 ) target1.copy( point1 );
			if ( target2 ) target2.copy( start );

		}

		this.closestPointToPoint( end, point1 );
		distSq = end.distanceToSquared( point1 );
		if ( distSq < closestDistanceSq ) {

			closestDistanceSq = distSq;
			if ( target1 ) target1.copy( point1 );
			if ( target2 ) target2.copy( end );

		}

		return Math.sqrt( closestDistanceSq );

	};

} )();

ExtendedTriangle.prototype.intersectsTriangle = ( function () {

	const saTri2 = new ExtendedTriangle();
	const arr1 = new Array( 3 );
	const arr2 = new Array( 3 );
	const cachedSatBounds = new SeparatingAxisBounds();
	const cachedSatBounds2 = new SeparatingAxisBounds();
	const cachedAxis = new Vector3();
	const dir = new Vector3();
	const dir1 = new Vector3();
	const dir2 = new Vector3();
	const tempDir = new Vector3();
	const edge = new Line3();
	const edge1 = new Line3();
	const edge2 = new Line3();
	const tempPoint = new Vector3();

	function triIntersectPlane( tri, plane, targetEdge ) {

		// find the edge that intersects the other triangle plane
		const points = tri.points;
		let count = 0;
		let startPointIntersection = - 1;
		for ( let i = 0; i < 3; i ++ ) {

			const { start, end } = edge;
			start.copy( points[ i ] );
			end.copy( points[ ( i + 1 ) % 3 ] );
			edge.delta( dir );

			const startIntersects = isNearZero( plane.distanceToPoint( start ) );
			if ( isNearZero( plane.normal.dot( dir ) ) && startIntersects ) {

				// if the edge lies on the plane then take the line
				targetEdge.copy( edge );
				count = 2;
				break;

			}

			// check if the start point is near the plane because "intersectLine" is not robust to that case
			const doesIntersect = plane.intersectLine( edge, tempPoint );
			if ( ! doesIntersect && startIntersects ) {

				tempPoint.copy( start );

			}

			// ignore the end point
			if ( ( doesIntersect || startIntersects ) && ! isNearZero( tempPoint.distanceTo( end ) ) ) {

				if ( count <= 1 ) {

					// assign to the start or end point and save which index was snapped to
					// the start point if necessary
					const point = count === 1 ? targetEdge.start : targetEdge.end;
					point.copy( tempPoint );
					if ( startIntersects ) {

						startPointIntersection = count;

					}

				} else if ( count >= 2 ) {

					// if we're here that means that there must have been one point that had
					// snapped to the start point so replace it here
					const point = startPointIntersection === 1 ? targetEdge.start : targetEdge.end;
					point.copy( tempPoint );
					count = 2;
					break;

				}

				count ++;
				if ( count === 2 && startPointIntersection === - 1 ) {

					break;

				}

			}

		}

		return count;

	}

	// TODO: If the triangles are coplanar and intersecting the target is nonsensical. It should at least
	// be a line contained by both triangles if not a different special case somehow represented in the return result.
	return function intersectsTriangle( other, target = null, suppressLog = false ) {

		if ( this.needsUpdate ) {

			this.update();

		}

		if ( ! other.isExtendedTriangle ) {

			saTri2.copy( other );
			saTri2.update();
			other = saTri2;

		} else if ( other.needsUpdate ) {

			other.update();

		}

		const plane1 = this.plane;
		const plane2 = other.plane;

		if ( Math.abs( plane1.normal.dot( plane2.normal ) ) > 1.0 - 1e-10 ) {

			// perform separating axis intersection test only for coplanar triangles
			const satBounds1 = this.satBounds;
			const satAxes1 = this.satAxes;
			arr2[ 0 ] = other.a;
			arr2[ 1 ] = other.b;
			arr2[ 2 ] = other.c;
			for ( let i = 0; i < 4; i ++ ) {

				const sb = satBounds1[ i ];
				const sa = satAxes1[ i ];
				cachedSatBounds.setFromPoints( sa, arr2 );
				if ( sb.isSeparated( cachedSatBounds ) ) return false;

			}

			const satBounds2 = other.satBounds;
			const satAxes2 = other.satAxes;
			arr1[ 0 ] = this.a;
			arr1[ 1 ] = this.b;
			arr1[ 2 ] = this.c;
			for ( let i = 0; i < 4; i ++ ) {

				const sb = satBounds2[ i ];
				const sa = satAxes2[ i ];
				cachedSatBounds.setFromPoints( sa, arr1 );
				if ( sb.isSeparated( cachedSatBounds ) ) return false;

			}

			// check crossed axes
			for ( let i = 0; i < 4; i ++ ) {

				const sa1 = satAxes1[ i ];
				for ( let i2 = 0; i2 < 4; i2 ++ ) {

					const sa2 = satAxes2[ i2 ];
					cachedAxis.crossVectors( sa1, sa2 );
					cachedSatBounds.setFromPoints( cachedAxis, arr1 );
					cachedSatBounds2.setFromPoints( cachedAxis, arr2 );
					if ( cachedSatBounds.isSeparated( cachedSatBounds2 ) ) return false;

				}

			}

			if ( target ) {

				// TODO find two points that intersect on the edges and make that the result
				if ( ! suppressLog ) {

					console.warn( 'ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0.' );

				}

				target.start.set( 0, 0, 0 );
				target.end.set( 0, 0, 0 );

			}

			return true;

		} else {

			// find the edge that intersects the other triangle plane
			const count1 = triIntersectPlane( this, plane2, edge1 );
			if ( count1 === 1 && other.containsPoint( edge1.end ) ) {

				if ( target ) {

					target.start.copy( edge1.end );
					target.end.copy( edge1.end );

				}

				return true;

			} else if ( count1 !== 2 ) {

				return false;

			}

			// find the other triangles edge that intersects this plane
			const count2 = triIntersectPlane( other, plane1, edge2 );
			if ( count2 === 1 && this.containsPoint( edge2.end ) ) {

				if ( target ) {

					target.start.copy( edge2.end );
					target.end.copy( edge2.end );

				}

				return true;

			} else if ( count2 !== 2 ) {

				return false;

			}

			// find swap the second edge so both lines are running the same direction
			edge1.delta( dir1 );
			edge2.delta( dir2 );

			if ( dir1.dot( dir2 ) < 0 ) {

				let tmp = edge2.start;
				edge2.start = edge2.end;
				edge2.end = tmp;

			}

			// check if the edges are overlapping
			const s1 = edge1.start.dot( dir1 );
			const e1 = edge1.end.dot( dir1 );
			const s2 = edge2.start.dot( dir1 );
			const e2 = edge2.end.dot( dir1 );
			const separated1 = e1 < s2;
			const separated2 = s1 < e2;

			if ( s1 !== e2 && s2 !== e1 && separated1 === separated2 ) {

				return false;

			}

			// assign the target output
			if ( target ) {

				tempDir.subVectors( edge1.start, edge2.start );
				if ( tempDir.dot( dir1 ) > 0 ) {

					target.start.copy( edge1.start );

				} else {

					target.start.copy( edge2.start );

				}

				tempDir.subVectors( edge1.end, edge2.end );
				if ( tempDir.dot( dir1 ) < 0 ) {

					target.end.copy( edge1.end );

				} else {

					target.end.copy( edge2.end );

				}

			}

			return true;

		}

	};

} )();


ExtendedTriangle.prototype.distanceToPoint = ( function () {

	const target = new Vector3();
	return function distanceToPoint( point ) {

		this.closestPointToPoint( point, target );
		return point.distanceTo( target );

	};

} )();


ExtendedTriangle.prototype.distanceToTriangle = ( function () {

	const point = new Vector3();
	const point2 = new Vector3();
	const cornerFields = [ 'a', 'b', 'c' ];
	const line1 = new Line3();
	const line2 = new Line3();

	return function distanceToTriangle( other, target1 = null, target2 = null ) {

		const lineTarget = target1 || target2 ? line1 : null;
		if ( this.intersectsTriangle( other, lineTarget ) ) {

			if ( target1 || target2 ) {

				if ( target1 ) lineTarget.getCenter( target1 );
				if ( target2 ) lineTarget.getCenter( target2 );

			}

			return 0;

		}

		let closestDistanceSq = Infinity;

		// check all point distances
		for ( let i = 0; i < 3; i ++ ) {

			let dist;
			const field = cornerFields[ i ];
			const otherVec = other[ field ];
			this.closestPointToPoint( otherVec, point );

			dist = otherVec.distanceToSquared( point );

			if ( dist < closestDistanceSq ) {

				closestDistanceSq = dist;
				if ( target1 ) target1.copy( point );
				if ( target2 ) target2.copy( otherVec );

			}


			const thisVec = this[ field ];
			other.closestPointToPoint( thisVec, point );

			dist = thisVec.distanceToSquared( point );

			if ( dist < closestDistanceSq ) {

				closestDistanceSq = dist;
				if ( target1 ) target1.copy( thisVec );
				if ( target2 ) target2.copy( point );

			}

		}

		for ( let i = 0; i < 3; i ++ ) {

			const f11 = cornerFields[ i ];
			const f12 = cornerFields[ ( i + 1 ) % 3 ];
			line1.set( this[ f11 ], this[ f12 ] );
			for ( let i2 = 0; i2 < 3; i2 ++ ) {

				const f21 = cornerFields[ i2 ];
				const f22 = cornerFields[ ( i2 + 1 ) % 3 ];
				line2.set( other[ f21 ], other[ f22 ] );

				closestPointsSegmentToSegment( line1, line2, point, point2 );

				const dist = point.distanceToSquared( point2 );
				if ( dist < closestDistanceSq ) {

					closestDistanceSq = dist;
					if ( target1 ) target1.copy( point );
					if ( target2 ) target2.copy( point2 );

				}

			}

		}

		return Math.sqrt( closestDistanceSq );

	};

} )();

class OrientedBox {

	constructor( min, max, matrix ) {

		this.isOrientedBox = true;
		this.min = new Vector3();
		this.max = new Vector3();
		this.matrix = new Matrix4();
		this.invMatrix = new Matrix4();
		this.points = new Array( 8 ).fill().map( () => new Vector3() );
		this.satAxes = new Array( 3 ).fill().map( () => new Vector3() );
		this.satBounds = new Array( 3 ).fill().map( () => new SeparatingAxisBounds() );
		this.alignedSatBounds = new Array( 3 ).fill().map( () => new SeparatingAxisBounds() );
		this.needsUpdate = false;

		if ( min ) this.min.copy( min );
		if ( max ) this.max.copy( max );
		if ( matrix ) this.matrix.copy( matrix );

	}

	set( min, max, matrix ) {

		this.min.copy( min );
		this.max.copy( max );
		this.matrix.copy( matrix );
		this.needsUpdate = true;

	}

	copy( other ) {

		this.min.copy( other.min );
		this.max.copy( other.max );
		this.matrix.copy( other.matrix );
		this.needsUpdate = true;

	}

}

OrientedBox.prototype.update = ( function () {

	return function update() {

		const matrix = this.matrix;
		const min = this.min;
		const max = this.max;

		const points = this.points;
		for ( let x = 0; x <= 1; x ++ ) {

			for ( let y = 0; y <= 1; y ++ ) {

				for ( let z = 0; z <= 1; z ++ ) {

					const i = ( ( 1 << 0 ) * x ) | ( ( 1 << 1 ) * y ) | ( ( 1 << 2 ) * z );
					const v = points[ i ];
					v.x = x ? max.x : min.x;
					v.y = y ? max.y : min.y;
					v.z = z ? max.z : min.z;

					v.applyMatrix4( matrix );

				}

			}

		}

		const satBounds = this.satBounds;
		const satAxes = this.satAxes;
		const minVec = points[ 0 ];
		for ( let i = 0; i < 3; i ++ ) {

			const axis = satAxes[ i ];
			const sb = satBounds[ i ];
			const index = 1 << i;
			const pi = points[ index ];

			axis.subVectors( minVec, pi );
			sb.setFromPoints( axis, points );

		}

		const alignedSatBounds = this.alignedSatBounds;
		alignedSatBounds[ 0 ].setFromPointsField( points, 'x' );
		alignedSatBounds[ 1 ].setFromPointsField( points, 'y' );
		alignedSatBounds[ 2 ].setFromPointsField( points, 'z' );

		this.invMatrix.copy( this.matrix ).invert();
		this.needsUpdate = false;

	};

} )();

OrientedBox.prototype.intersectsBox = ( function () {

	const aabbBounds = new SeparatingAxisBounds();
	return function intersectsBox( box ) {

		// TODO: should this be doing SAT against the AABB?
		if ( this.needsUpdate ) {

			this.update();

		}

		const min = box.min;
		const max = box.max;
		const satBounds = this.satBounds;
		const satAxes = this.satAxes;
		const alignedSatBounds = this.alignedSatBounds;

		aabbBounds.min = min.x;
		aabbBounds.max = max.x;
		if ( alignedSatBounds[ 0 ].isSeparated( aabbBounds ) ) return false;

		aabbBounds.min = min.y;
		aabbBounds.max = max.y;
		if ( alignedSatBounds[ 1 ].isSeparated( aabbBounds ) ) return false;

		aabbBounds.min = min.z;
		aabbBounds.max = max.z;
		if ( alignedSatBounds[ 2 ].isSeparated( aabbBounds ) ) return false;

		for ( let i = 0; i < 3; i ++ ) {

			const axis = satAxes[ i ];
			const sb = satBounds[ i ];
			aabbBounds.setFromBox( axis, box );
			if ( sb.isSeparated( aabbBounds ) ) return false;

		}

		return true;

	};

} )();

OrientedBox.prototype.intersectsTriangle = ( function () {

	const saTri = new ExtendedTriangle();
	const pointsArr = new Array( 3 );
	const cachedSatBounds = new SeparatingAxisBounds();
	const cachedSatBounds2 = new SeparatingAxisBounds();
	const cachedAxis = new Vector3();
	return function intersectsTriangle( triangle ) {

		if ( this.needsUpdate ) {

			this.update();

		}

		if ( ! triangle.isExtendedTriangle ) {

			saTri.copy( triangle );
			saTri.update();
			triangle = saTri;

		} else if ( triangle.needsUpdate ) {

			triangle.update();

		}

		const satBounds = this.satBounds;
		const satAxes = this.satAxes;

		pointsArr[ 0 ] = triangle.a;
		pointsArr[ 1 ] = triangle.b;
		pointsArr[ 2 ] = triangle.c;

		for ( let i = 0; i < 3; i ++ ) {

			const sb = satBounds[ i ];
			const sa = satAxes[ i ];
			cachedSatBounds.setFromPoints( sa, pointsArr );
			if ( sb.isSeparated( cachedSatBounds ) ) return false;

		}

		const triSatBounds = triangle.satBounds;
		const triSatAxes = triangle.satAxes;
		const points = this.points;
		for ( let i = 0; i < 3; i ++ ) {

			const sb = triSatBounds[ i ];
			const sa = triSatAxes[ i ];
			cachedSatBounds.setFromPoints( sa, points );
			if ( sb.isSeparated( cachedSatBounds ) ) return false;

		}

		// check crossed axes
		for ( let i = 0; i < 3; i ++ ) {

			const sa1 = satAxes[ i ];
			for ( let i2 = 0; i2 < 4; i2 ++ ) {

				const sa2 = triSatAxes[ i2 ];
				cachedAxis.crossVectors( sa1, sa2 );
				cachedSatBounds.setFromPoints( cachedAxis, pointsArr );
				cachedSatBounds2.setFromPoints( cachedAxis, points );
				if ( cachedSatBounds.isSeparated( cachedSatBounds2 ) ) return false;

			}

		}

		return true;

	};

} )();

OrientedBox.prototype.closestPointToPoint = ( function () {

	return function closestPointToPoint( point, target1 ) {

		if ( this.needsUpdate ) {

			this.update();

		}

		target1
			.copy( point )
			.applyMatrix4( this.invMatrix )
			.clamp( this.min, this.max )
			.applyMatrix4( this.matrix );

		return target1;

	};

} )();

OrientedBox.prototype.distanceToPoint = ( function () {

	const target = new Vector3();
	return function distanceToPoint( point ) {

		this.closestPointToPoint( point, target );
		return point.distanceTo( target );

	};

} )();

OrientedBox.prototype.distanceToBox = ( function () {

	const xyzFields = [ 'x', 'y', 'z' ];
	const segments1 = new Array( 12 ).fill().map( () => new Line3() );
	const segments2 = new Array( 12 ).fill().map( () => new Line3() );

	const point1 = new Vector3();
	const point2 = new Vector3();

	// early out if we find a value below threshold
	return function distanceToBox( box, threshold = 0, target1 = null, target2 = null ) {

		if ( this.needsUpdate ) {

			this.update();

		}

		if ( this.intersectsBox( box ) ) {

			if ( target1 || target2 ) {

				box.getCenter( point2 );
				this.closestPointToPoint( point2, point1 );
				box.closestPointToPoint( point1, point2 );

				if ( target1 ) target1.copy( point1 );
				if ( target2 ) target2.copy( point2 );

			}

			return 0;

		}

		const threshold2 = threshold * threshold;
		const min = box.min;
		const max = box.max;
		const points = this.points;


		// iterate over every edge and compare distances
		let closestDistanceSq = Infinity;

		// check over all these points
		for ( let i = 0; i < 8; i ++ ) {

			const p = points[ i ];
			point2.copy( p ).clamp( min, max );

			const dist = p.distanceToSquared( point2 );
			if ( dist < closestDistanceSq ) {

				closestDistanceSq = dist;
				if ( target1 ) target1.copy( p );
				if ( target2 ) target2.copy( point2 );

				if ( dist < threshold2 ) return Math.sqrt( dist );

			}

		}

		// generate and check all line segment distances
		let count = 0;
		for ( let i = 0; i < 3; i ++ ) {

			for ( let i1 = 0; i1 <= 1; i1 ++ ) {

				for ( let i2 = 0; i2 <= 1; i2 ++ ) {

					const nextIndex = ( i + 1 ) % 3;
					const nextIndex2 = ( i + 2 ) % 3;

					// get obb line segments
					const index = i1 << nextIndex | i2 << nextIndex2;
					const index2 = 1 << i | i1 << nextIndex | i2 << nextIndex2;
					const p1 = points[ index ];
					const p2 = points[ index2 ];
					const line1 = segments1[ count ];
					line1.set( p1, p2 );


					// get aabb line segments
					const f1 = xyzFields[ i ];
					const f2 = xyzFields[ nextIndex ];
					const f3 = xyzFields[ nextIndex2 ];
					const line2 = segments2[ count ];
					const start = line2.start;
					const end = line2.end;

					start[ f1 ] = min[ f1 ];
					start[ f2 ] = i1 ? min[ f2 ] : max[ f2 ];
					start[ f3 ] = i2 ? min[ f3 ] : max[ f2 ];

					end[ f1 ] = max[ f1 ];
					end[ f2 ] = i1 ? min[ f2 ] : max[ f2 ];
					end[ f3 ] = i2 ? min[ f3 ] : max[ f2 ];

					count ++;

				}

			}

		}

		// check all the other boxes point
		for ( let x = 0; x <= 1; x ++ ) {

			for ( let y = 0; y <= 1; y ++ ) {

				for ( let z = 0; z <= 1; z ++ ) {

					point2.x = x ? max.x : min.x;
					point2.y = y ? max.y : min.y;
					point2.z = z ? max.z : min.z;

					this.closestPointToPoint( point2, point1 );
					const dist = point2.distanceToSquared( point1 );
					if ( dist < closestDistanceSq ) {

						closestDistanceSq = dist;
						if ( target1 ) target1.copy( point1 );
						if ( target2 ) target2.copy( point2 );

						if ( dist < threshold2 ) return Math.sqrt( dist );

					}

				}

			}

		}

		for ( let i = 0; i < 12; i ++ ) {

			const l1 = segments1[ i ];
			for ( let i2 = 0; i2 < 12; i2 ++ ) {

				const l2 = segments2[ i2 ];
				closestPointsSegmentToSegment( l1, l2, point1, point2 );
				const dist = point1.distanceToSquared( point2 );
				if ( dist < closestDistanceSq ) {

					closestDistanceSq = dist;
					if ( target1 ) target1.copy( point1 );
					if ( target2 ) target2.copy( point2 );

					if ( dist < threshold2 ) return Math.sqrt( dist );

				}

			}

		}

		return Math.sqrt( closestDistanceSq );

	};

} )();

class PrimitivePool {

	constructor( getNewPrimitive ) {

		this._getNewPrimitive = getNewPrimitive;
		this._primitives = [];

	}

	getPrimitive() {

		const primitives = this._primitives;
		if ( primitives.length === 0 ) {

			return this._getNewPrimitive();

		} else {

			return primitives.pop();

		}

	}

	releasePrimitive( primitive ) {

		this._primitives.push( primitive );

	}

}

class ExtendedTrianglePoolBase extends PrimitivePool {

	constructor() {

		super( () => new ExtendedTriangle() );

	}

}

const ExtendedTrianglePool = /* @__PURE__ */ new ExtendedTrianglePoolBase();

class _BufferStack {

	constructor() {

		this.float32Array = null;
		this.uint16Array = null;
		this.uint32Array = null;

		const stack = [];
		let prevBuffer = null;
		this.setBuffer = buffer => {

			if ( prevBuffer ) {

				stack.push( prevBuffer );

			}

			prevBuffer = buffer;
			this.float32Array = new Float32Array( buffer );
			this.uint16Array = new Uint16Array( buffer );
			this.uint32Array = new Uint32Array( buffer );

		};

		this.clearBuffer = () => {

			prevBuffer = null;
			this.float32Array = null;
			this.uint16Array = null;
			this.uint32Array = null;

			if ( stack.length !== 0 ) {

				this.setBuffer( stack.pop() );

			}

		};

	}

}

const BufferStack = new _BufferStack();

let _box1, _box2;
const boxStack = [];
const boxPool = /* @__PURE__ */ new PrimitivePool( () => new Box3() );

function shapecast( bvh, root, intersectsBounds, intersectsRange, boundsTraverseOrder, byteOffset ) {

	// setup
	_box1 = boxPool.getPrimitive();
	_box2 = boxPool.getPrimitive();
	boxStack.push( _box1, _box2 );
	BufferStack.setBuffer( bvh._roots[ root ] );

	const result = shapecastTraverse( 0, bvh.geometry, intersectsBounds, intersectsRange, boundsTraverseOrder, byteOffset );

	// cleanup
	BufferStack.clearBuffer();
	boxPool.releasePrimitive( _box1 );
	boxPool.releasePrimitive( _box2 );
	boxStack.pop();
	boxStack.pop();

	const length = boxStack.length;
	if ( length > 0 ) {

		_box2 = boxStack[ length - 1 ];
		_box1 = boxStack[ length - 2 ];

	}

	return result;

}

function shapecastTraverse(
	nodeIndex32,
	geometry,
	intersectsBoundsFunc,
	intersectsRangeFunc,
	nodeScoreFunc = null,
	nodeIndexByteOffset = 0, // offset for unique node identifier
	depth = 0
) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	let nodeIndex16 = nodeIndex32 * 2;

	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );
		arrayToBox( BOUNDING_DATA_INDEX( nodeIndex32 ), float32Array, _box1 );
		return intersectsRangeFunc( offset, count, false, depth, nodeIndexByteOffset + nodeIndex32, _box1 );

	} else {

		const left = LEFT_NODE( nodeIndex32 );
		const right = RIGHT_NODE( nodeIndex32, uint32Array );
		let c1 = left;
		let c2 = right;

		let score1, score2;
		let box1, box2;
		if ( nodeScoreFunc ) {

			box1 = _box1;
			box2 = _box2;

			// bounding data is not offset
			arrayToBox( BOUNDING_DATA_INDEX( c1 ), float32Array, box1 );
			arrayToBox( BOUNDING_DATA_INDEX( c2 ), float32Array, box2 );

			score1 = nodeScoreFunc( box1 );
			score2 = nodeScoreFunc( box2 );

			if ( score2 < score1 ) {

				c1 = right;
				c2 = left;

				const temp = score1;
				score1 = score2;
				score2 = temp;

				box1 = box2;
				// box2 is always set before use below

			}

		}

		// Check box 1 intersection
		if ( ! box1 ) {

			box1 = _box1;
			arrayToBox( BOUNDING_DATA_INDEX( c1 ), float32Array, box1 );

		}

		const isC1Leaf = IS_LEAF( c1 * 2, uint16Array );
		const c1Intersection = intersectsBoundsFunc( box1, isC1Leaf, score1, depth + 1, nodeIndexByteOffset + c1 );

		let c1StopTraversal;
		if ( c1Intersection === CONTAINED ) {

			const offset = getLeftOffset( c1 );
			const end = getRightEndOffset( c1 );
			const count = end - offset;

			c1StopTraversal = intersectsRangeFunc( offset, count, true, depth + 1, nodeIndexByteOffset + c1, box1 );

		} else {

			c1StopTraversal =
				c1Intersection &&
				shapecastTraverse(
					c1,
					geometry,
					intersectsBoundsFunc,
					intersectsRangeFunc,
					nodeScoreFunc,
					nodeIndexByteOffset,
					depth + 1
				);

		}

		if ( c1StopTraversal ) return true;

		// Check box 2 intersection
		// cached box2 will have been overwritten by previous traversal
		box2 = _box2;
		arrayToBox( BOUNDING_DATA_INDEX( c2 ), float32Array, box2 );

		const isC2Leaf = IS_LEAF( c2 * 2, uint16Array );
		const c2Intersection = intersectsBoundsFunc( box2, isC2Leaf, score2, depth + 1, nodeIndexByteOffset + c2 );

		let c2StopTraversal;
		if ( c2Intersection === CONTAINED ) {

			const offset = getLeftOffset( c2 );
			const end = getRightEndOffset( c2 );
			const count = end - offset;

			c2StopTraversal = intersectsRangeFunc( offset, count, true, depth + 1, nodeIndexByteOffset + c2, box2 );

		} else {

			c2StopTraversal =
				c2Intersection &&
				shapecastTraverse(
					c2,
					geometry,
					intersectsBoundsFunc,
					intersectsRangeFunc,
					nodeScoreFunc,
					nodeIndexByteOffset,
					depth + 1
				);

		}

		if ( c2StopTraversal ) return true;

		return false;

		// Define these inside the function so it has access to the local variables needed
		// when converting to the buffer equivalents
		function getLeftOffset( nodeIndex32 ) {

			const { uint16Array, uint32Array } = BufferStack;
			let nodeIndex16 = nodeIndex32 * 2;

			// traverse until we find a leaf
			while ( ! IS_LEAF( nodeIndex16, uint16Array ) ) {

				nodeIndex32 = LEFT_NODE( nodeIndex32 );
				nodeIndex16 = nodeIndex32 * 2;

			}

			return OFFSET( nodeIndex32, uint32Array );

		}

		function getRightEndOffset( nodeIndex32 ) {

			const { uint16Array, uint32Array } = BufferStack;
			let nodeIndex16 = nodeIndex32 * 2;

			// traverse until we find a leaf
			while ( ! IS_LEAF( nodeIndex16, uint16Array ) ) {

				// adjust offset to point to the right node
				nodeIndex32 = RIGHT_NODE( nodeIndex32, uint32Array );
				nodeIndex16 = nodeIndex32 * 2;

			}

			// return the end offset of the triangle range
			return OFFSET( nodeIndex32, uint32Array ) + COUNT( nodeIndex16, uint16Array );

		}

	}

}

const temp = /* @__PURE__ */ new Vector3();
const temp1$2 = /* @__PURE__ */ new Vector3();

function closestPointToPoint(
	bvh,
	point,
	target = { },
	minThreshold = 0,
	maxThreshold = Infinity,
) {

	// early out if under minThreshold
	// skip checking if over maxThreshold
	// set minThreshold = maxThreshold to quickly check if a point is within a threshold
	// returns Infinity if no value found
	const minThresholdSq = minThreshold * minThreshold;
	const maxThresholdSq = maxThreshold * maxThreshold;
	let closestDistanceSq = Infinity;
	let closestDistanceTriIndex = null;
	bvh.shapecast(

		{

			boundsTraverseOrder: box => {

				temp.copy( point ).clamp( box.min, box.max );
				return temp.distanceToSquared( point );

			},

			intersectsBounds: ( box, isLeaf, score ) => {

				return score < closestDistanceSq && score < maxThresholdSq;

			},

			intersectsTriangle: ( tri, triIndex ) => {

				tri.closestPointToPoint( point, temp );
				const distSq = point.distanceToSquared( temp );
				if ( distSq < closestDistanceSq ) {

					temp1$2.copy( temp );
					closestDistanceSq = distSq;
					closestDistanceTriIndex = triIndex;

				}

				if ( distSq < minThresholdSq ) {

					return true;

				} else {

					return false;

				}

			},

		}

	);

	if ( closestDistanceSq === Infinity ) return null;

	const closestDistance = Math.sqrt( closestDistanceSq );

	if ( ! target.point ) target.point = temp1$2.clone();
	else target.point.copy( temp1$2 );
	target.distance = closestDistance,
	target.faceIndex = closestDistanceTriIndex;

	return target;

}

const IS_GT_REVISION_169 = parseInt( REVISION ) >= 169;

// Ripped and modified From THREE.js Mesh raycast
// https://github.com/mrdoob/three.js/blob/0aa87c999fe61e216c1133fba7a95772b503eddf/src/objects/Mesh.js#L115
const _vA = /* @__PURE__ */ new Vector3();
const _vB = /* @__PURE__ */ new Vector3();
const _vC = /* @__PURE__ */ new Vector3();

const _uvA = /* @__PURE__ */ new Vector2();
const _uvB = /* @__PURE__ */ new Vector2();
const _uvC = /* @__PURE__ */ new Vector2();

const _normalA = /* @__PURE__ */ new Vector3();
const _normalB = /* @__PURE__ */ new Vector3();
const _normalC = /* @__PURE__ */ new Vector3();

const _intersectionPoint = /* @__PURE__ */ new Vector3();
function checkIntersection( ray, pA, pB, pC, point, side, near, far ) {

	let intersect;
	if ( side === BackSide ) {

		intersect = ray.intersectTriangle( pC, pB, pA, true, point );

	} else {

		intersect = ray.intersectTriangle( pA, pB, pC, side !== DoubleSide, point );

	}

	if ( intersect === null ) return null;

	const distance = ray.origin.distanceTo( point );

	if ( distance < near || distance > far ) return null;

	return {

		distance: distance,
		point: point.clone(),

	};

}

function checkBufferGeometryIntersection( ray, position, normal, uv, uv1, a, b, c, side, near, far ) {

	_vA.fromBufferAttribute( position, a );
	_vB.fromBufferAttribute( position, b );
	_vC.fromBufferAttribute( position, c );

	const intersection = checkIntersection( ray, _vA, _vB, _vC, _intersectionPoint, side, near, far );

	if ( intersection ) {

		const barycoord = new Vector3();
		Triangle.getBarycoord( _intersectionPoint, _vA, _vB, _vC, barycoord );

		if ( uv ) {

			_uvA.fromBufferAttribute( uv, a );
			_uvB.fromBufferAttribute( uv, b );
			_uvC.fromBufferAttribute( uv, c );

			intersection.uv = Triangle.getInterpolation( _intersectionPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vector2() );

		}

		if ( uv1 ) {

			_uvA.fromBufferAttribute( uv1, a );
			_uvB.fromBufferAttribute( uv1, b );
			_uvC.fromBufferAttribute( uv1, c );

			intersection.uv1 = Triangle.getInterpolation( _intersectionPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vector2() );

		}

		if ( normal ) {

			_normalA.fromBufferAttribute( normal, a );
			_normalB.fromBufferAttribute( normal, b );
			_normalC.fromBufferAttribute( normal, c );

			intersection.normal = Triangle.getInterpolation( _intersectionPoint, _vA, _vB, _vC, _normalA, _normalB, _normalC, new Vector3() );
			if ( intersection.normal.dot( ray.direction ) > 0 ) {

				intersection.normal.multiplyScalar( - 1 );

			}

		}

		const face = {
			a: a,
			b: b,
			c: c,
			normal: new Vector3(),
			materialIndex: 0
		};

		Triangle.getNormal( _vA, _vB, _vC, face.normal );

		intersection.face = face;
		intersection.faceIndex = a;

		if ( IS_GT_REVISION_169 ) {

			intersection.barycoord = barycoord;

		}

	}

	return intersection;

}

// https://github.com/mrdoob/three.js/blob/0aa87c999fe61e216c1133fba7a95772b503eddf/src/objects/Mesh.js#L258
function intersectTri( geo, side, ray, tri, intersections, near, far ) {

	const triOffset = tri * 3;
	let a = triOffset + 0;
	let b = triOffset + 1;
	let c = triOffset + 2;

	const index = geo.index;
	if ( geo.index ) {

		a = index.getX( a );
		b = index.getX( b );
		c = index.getX( c );

	}

	const { position, normal, uv, uv1 } = geo.attributes;
	const intersection = checkBufferGeometryIntersection( ray, position, normal, uv, uv1, a, b, c, side, near, far );

	if ( intersection ) {

		intersection.faceIndex = tri;
		if ( intersections ) intersections.push( intersection );
		return intersection;

	}

	return null;

}

// sets the vertices of triangle `tri` with the 3 vertices after i
function setTriangle( tri, i, index, pos ) {

	const ta = tri.a;
	const tb = tri.b;
	const tc = tri.c;

	let i0 = i;
	let i1 = i + 1;
	let i2 = i + 2;
	if ( index ) {

		i0 = index.getX( i0 );
		i1 = index.getX( i1 );
		i2 = index.getX( i2 );

	}

	ta.x = pos.getX( i0 );
	ta.y = pos.getY( i0 );
	ta.z = pos.getZ( i0 );

	tb.x = pos.getX( i1 );
	tb.y = pos.getY( i1 );
	tb.z = pos.getZ( i1 );

	tc.x = pos.getX( i2 );
	tc.y = pos.getY( i2 );
	tc.z = pos.getZ( i2 );

}

/*************************************************************/
/* This file is generated from "iterationUtils.template.js". */
/*************************************************************/
/* eslint-disable indent */

function intersectTris( bvh, side, ray, offset, count, intersections, near, far ) {

	const { geometry, _indirectBuffer } = bvh;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {


		intersectTri( geometry, side, ray, i, intersections, near, far );


	}

}

function intersectClosestTri( bvh, side, ray, offset, count, near, far ) {

	const { geometry, _indirectBuffer } = bvh;
	let dist = Infinity;
	let res = null;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		let intersection;

		intersection = intersectTri( geometry, side, ray, i, null, near, far );


		if ( intersection && intersection.distance < dist ) {

			res = intersection;
			dist = intersection.distance;

		}

	}

	return res;

}

function iterateOverTriangles(
	offset,
	count,
	bvh,
	intersectsTriangleFunc,
	contained,
	depth,
	triangle
) {

	const { geometry } = bvh;
	const { index } = geometry;
	const pos = geometry.attributes.position;
	for ( let i = offset, l = count + offset; i < l; i ++ ) {

		let tri;

		tri = i;

		setTriangle( triangle, tri * 3, index, pos );
		triangle.needsUpdate = true;

		if ( intersectsTriangleFunc( triangle, tri, contained, depth ) ) {

			return true;

		}

	}

	return false;

}

/****************************************************/
/* This file is generated from "refit.template.js". */
/****************************************************/

function refit( bvh, nodeIndices = null ) {

	if ( nodeIndices && Array.isArray( nodeIndices ) ) {

		nodeIndices = new Set( nodeIndices );

	}

	const geometry = bvh.geometry;
	const indexArr = geometry.index ? geometry.index.array : null;
	const posAttr = geometry.attributes.position;

	let buffer, uint32Array, uint16Array, float32Array;
	let byteOffset = 0;
	const roots = bvh._roots;
	for ( let i = 0, l = roots.length; i < l; i ++ ) {

		buffer = roots[ i ];
		uint32Array = new Uint32Array( buffer );
		uint16Array = new Uint16Array( buffer );
		float32Array = new Float32Array( buffer );

		_traverse( 0, byteOffset );
		byteOffset += buffer.byteLength;

	}

	function _traverse( node32Index, byteOffset, force = false ) {

		const node16Index = node32Index * 2;
		const isLeaf = uint16Array[ node16Index + 15 ] === IS_LEAFNODE_FLAG;
		if ( isLeaf ) {

			const offset = uint32Array[ node32Index + 6 ];
			const count = uint16Array[ node16Index + 14 ];

			let minx = Infinity;
			let miny = Infinity;
			let minz = Infinity;
			let maxx = - Infinity;
			let maxy = - Infinity;
			let maxz = - Infinity;


			for ( let i = 3 * offset, l = 3 * ( offset + count ); i < l; i ++ ) {

				let index = indexArr[ i ];
				const x = posAttr.getX( index );
				const y = posAttr.getY( index );
				const z = posAttr.getZ( index );

				if ( x < minx ) minx = x;
				if ( x > maxx ) maxx = x;

				if ( y < miny ) miny = y;
				if ( y > maxy ) maxy = y;

				if ( z < minz ) minz = z;
				if ( z > maxz ) maxz = z;

			}


			if (
				float32Array[ node32Index + 0 ] !== minx ||
				float32Array[ node32Index + 1 ] !== miny ||
				float32Array[ node32Index + 2 ] !== minz ||

				float32Array[ node32Index + 3 ] !== maxx ||
				float32Array[ node32Index + 4 ] !== maxy ||
				float32Array[ node32Index + 5 ] !== maxz
			) {

				float32Array[ node32Index + 0 ] = minx;
				float32Array[ node32Index + 1 ] = miny;
				float32Array[ node32Index + 2 ] = minz;

				float32Array[ node32Index + 3 ] = maxx;
				float32Array[ node32Index + 4 ] = maxy;
				float32Array[ node32Index + 5 ] = maxz;

				return true;

			} else {

				return false;

			}

		} else {

			const left = node32Index + 8;
			const right = uint32Array[ node32Index + 6 ];

			// the identifying node indices provided by the shapecast function include offsets of all
			// root buffers to guarantee they're unique between roots so offset left and right indices here.
			const offsetLeft = left + byteOffset;
			const offsetRight = right + byteOffset;
			let forceChildren = force;
			let includesLeft = false;
			let includesRight = false;

			if ( nodeIndices ) {

				// if we see that neither the left or right child are included in the set that need to be updated
				// then we assume that all children need to be updated.
				if ( ! forceChildren ) {

					includesLeft = nodeIndices.has( offsetLeft );
					includesRight = nodeIndices.has( offsetRight );
					forceChildren = ! includesLeft && ! includesRight;

				}

			} else {

				includesLeft = true;
				includesRight = true;

			}

			const traverseLeft = forceChildren || includesLeft;
			const traverseRight = forceChildren || includesRight;

			let leftChange = false;
			if ( traverseLeft ) {

				leftChange = _traverse( left, byteOffset, forceChildren );

			}

			let rightChange = false;
			if ( traverseRight ) {

				rightChange = _traverse( right, byteOffset, forceChildren );

			}

			const didChange = leftChange || rightChange;
			if ( didChange ) {

				for ( let i = 0; i < 3; i ++ ) {

					const lefti = left + i;
					const righti = right + i;
					const minLeftValue = float32Array[ lefti ];
					const maxLeftValue = float32Array[ lefti + 3 ];
					const minRightValue = float32Array[ righti ];
					const maxRightValue = float32Array[ righti + 3 ];

					float32Array[ node32Index + i ] = minLeftValue < minRightValue ? minLeftValue : minRightValue;
					float32Array[ node32Index + i + 3 ] = maxLeftValue > maxRightValue ? maxLeftValue : maxRightValue;

				}

			}

			return didChange;

		}

	}

}

/**
 * This function performs intersection tests similar to Ray.intersectBox in three.js,
 * with the difference that the box values are read from an array to improve performance.
 */
function intersectRay( nodeIndex32, array, ray, near, far ) {

	let tmin, tmax, tymin, tymax, tzmin, tzmax;

	const invdirx = 1 / ray.direction.x,
		invdiry = 1 / ray.direction.y,
		invdirz = 1 / ray.direction.z;

	const ox = ray.origin.x;
	const oy = ray.origin.y;
	const oz = ray.origin.z;

	let minx = array[ nodeIndex32 ];
	let maxx = array[ nodeIndex32 + 3 ];

	let miny = array[ nodeIndex32 + 1 ];
	let maxy = array[ nodeIndex32 + 3 + 1 ];

	let minz = array[ nodeIndex32 + 2 ];
	let maxz = array[ nodeIndex32 + 3 + 2 ];

	if ( invdirx >= 0 ) {

		tmin = ( minx - ox ) * invdirx;
		tmax = ( maxx - ox ) * invdirx;

	} else {

		tmin = ( maxx - ox ) * invdirx;
		tmax = ( minx - ox ) * invdirx;

	}

	if ( invdiry >= 0 ) {

		tymin = ( miny - oy ) * invdiry;
		tymax = ( maxy - oy ) * invdiry;

	} else {

		tymin = ( maxy - oy ) * invdiry;
		tymax = ( miny - oy ) * invdiry;

	}

	if ( ( tmin > tymax ) || ( tymin > tmax ) ) return false;

	if ( tymin > tmin || isNaN( tmin ) ) tmin = tymin;

	if ( tymax < tmax || isNaN( tmax ) ) tmax = tymax;

	if ( invdirz >= 0 ) {

		tzmin = ( minz - oz ) * invdirz;
		tzmax = ( maxz - oz ) * invdirz;

	} else {

		tzmin = ( maxz - oz ) * invdirz;
		tzmax = ( minz - oz ) * invdirz;

	}

	if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return false;

	if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

	if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

	//return point closest to the ray (positive side)

	return tmin <= far && tmax >= near;

}

/*************************************************************/
/* This file is generated from "iterationUtils.template.js". */
/*************************************************************/
/* eslint-disable indent */

function intersectTris_indirect( bvh, side, ray, offset, count, intersections, near, far ) {

	const { geometry, _indirectBuffer } = bvh;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		let vi = _indirectBuffer ? _indirectBuffer[ i ] : i;
		intersectTri( geometry, side, ray, vi, intersections, near, far );


	}

}

function intersectClosestTri_indirect( bvh, side, ray, offset, count, near, far ) {

	const { geometry, _indirectBuffer } = bvh;
	let dist = Infinity;
	let res = null;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		let intersection;
		intersection = intersectTri( geometry, side, ray, _indirectBuffer ? _indirectBuffer[ i ] : i, null, near, far );


		if ( intersection && intersection.distance < dist ) {

			res = intersection;
			dist = intersection.distance;

		}

	}

	return res;

}

function iterateOverTriangles_indirect(
	offset,
	count,
	bvh,
	intersectsTriangleFunc,
	contained,
	depth,
	triangle
) {

	const { geometry } = bvh;
	const { index } = geometry;
	const pos = geometry.attributes.position;
	for ( let i = offset, l = count + offset; i < l; i ++ ) {

		let tri;
		tri = bvh.resolveTriangleIndex( i );

		setTriangle( triangle, tri * 3, index, pos );
		triangle.needsUpdate = true;

		if ( intersectsTriangleFunc( triangle, tri, contained, depth ) ) {

			return true;

		}

	}

	return false;

}

/******************************************************/
/* This file is generated from "raycast.template.js". */
/******************************************************/

function raycast( bvh, root, side, ray, intersects, near, far ) {

	BufferStack.setBuffer( bvh._roots[ root ] );
	_raycast$1( 0, bvh, side, ray, intersects, near, far );
	BufferStack.clearBuffer();

}

function _raycast$1( nodeIndex32, bvh, side, ray, intersects, near, far ) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	const nodeIndex16 = nodeIndex32 * 2;
	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );


		intersectTris( bvh, side, ray, offset, count, intersects, near, far );


	} else {

		const leftIndex = LEFT_NODE( nodeIndex32 );
		if ( intersectRay( leftIndex, float32Array, ray, near, far ) ) {

			_raycast$1( leftIndex, bvh, side, ray, intersects, near, far );

		}

		const rightIndex = RIGHT_NODE( nodeIndex32, uint32Array );
		if ( intersectRay( rightIndex, float32Array, ray, near, far ) ) {

			_raycast$1( rightIndex, bvh, side, ray, intersects, near, far );

		}

	}

}

/***********************************************************/
/* This file is generated from "raycastFirst.template.js". */
/***********************************************************/

const _xyzFields$1 = [ 'x', 'y', 'z' ];

function raycastFirst( bvh, root, side, ray, near, far ) {

	BufferStack.setBuffer( bvh._roots[ root ] );
	const result = _raycastFirst$1( 0, bvh, side, ray, near, far );
	BufferStack.clearBuffer();

	return result;

}

function _raycastFirst$1( nodeIndex32, bvh, side, ray, near, far ) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	let nodeIndex16 = nodeIndex32 * 2;

	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );


		// eslint-disable-next-line no-unreachable
		return intersectClosestTri( bvh, side, ray, offset, count, near, far );


	} else {

		// consider the position of the split plane with respect to the oncoming ray; whichever direction
		// the ray is coming from, look for an intersection among that side of the tree first
		const splitAxis = SPLIT_AXIS( nodeIndex32, uint32Array );
		const xyzAxis = _xyzFields$1[ splitAxis ];
		const rayDir = ray.direction[ xyzAxis ];
		const leftToRight = rayDir >= 0;

		// c1 is the child to check first
		let c1, c2;
		if ( leftToRight ) {

			c1 = LEFT_NODE( nodeIndex32 );
			c2 = RIGHT_NODE( nodeIndex32, uint32Array );

		} else {

			c1 = RIGHT_NODE( nodeIndex32, uint32Array );
			c2 = LEFT_NODE( nodeIndex32 );

		}

		const c1Intersection = intersectRay( c1, float32Array, ray, near, far );
		const c1Result = c1Intersection ? _raycastFirst$1( c1, bvh, side, ray, near, far ) : null;

		// if we got an intersection in the first node and it's closer than the second node's bounding
		// box, we don't need to consider the second node because it couldn't possibly be a better result
		if ( c1Result ) {

			// check if the point is within the second bounds
			// "point" is in the local frame of the bvh
			const point = c1Result.point[ xyzAxis ];
			const isOutside = leftToRight ?
				point <= float32Array[ c2 + splitAxis ] : // min bounding data
				point >= float32Array[ c2 + splitAxis + 3 ]; // max bounding data

			if ( isOutside ) {

				return c1Result;

			}

		}

		// either there was no intersection in the first node, or there could still be a closer
		// intersection in the second, so check the second node and then take the better of the two
		const c2Intersection = intersectRay( c2, float32Array, ray, near, far );
		const c2Result = c2Intersection ? _raycastFirst$1( c2, bvh, side, ray, near, far ) : null;

		if ( c1Result && c2Result ) {

			return c1Result.distance <= c2Result.distance ? c1Result : c2Result;

		} else {

			return c1Result || c2Result || null;

		}

	}

}

/*****************************************************************/
/* This file is generated from "intersectsGeometry.template.js". */
/*****************************************************************/
/* eslint-disable indent */

const boundingBox$1 = /* @__PURE__ */ new Box3();
const triangle$1 = /* @__PURE__ */ new ExtendedTriangle();
const triangle2$1 = /* @__PURE__ */ new ExtendedTriangle();
const invertedMat$1 = /* @__PURE__ */ new Matrix4();

const obb$4 = /* @__PURE__ */ new OrientedBox();
const obb2$3 = /* @__PURE__ */ new OrientedBox();

function intersectsGeometry( bvh, root, otherGeometry, geometryToBvh ) {

	BufferStack.setBuffer( bvh._roots[ root ] );
	const result = _intersectsGeometry$1( 0, bvh, otherGeometry, geometryToBvh );
	BufferStack.clearBuffer();

	return result;

}

function _intersectsGeometry$1( nodeIndex32, bvh, otherGeometry, geometryToBvh, cachedObb = null ) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	let nodeIndex16 = nodeIndex32 * 2;

	if ( cachedObb === null ) {

		if ( ! otherGeometry.boundingBox ) {

			otherGeometry.computeBoundingBox();

		}

		obb$4.set( otherGeometry.boundingBox.min, otherGeometry.boundingBox.max, geometryToBvh );
		cachedObb = obb$4;

	}

	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const thisGeometry = bvh.geometry;
		const thisIndex = thisGeometry.index;
		const thisPos = thisGeometry.attributes.position;

		const index = otherGeometry.index;
		const pos = otherGeometry.attributes.position;

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );

		// get the inverse of the geometry matrix so we can transform our triangles into the
		// geometry space we're trying to test. We assume there are fewer triangles being checked
		// here.
		invertedMat$1.copy( geometryToBvh ).invert();

		if ( otherGeometry.boundsTree ) {

			// if there's a bounds tree
			arrayToBox( BOUNDING_DATA_INDEX( nodeIndex32 ), float32Array, obb2$3 );
			obb2$3.matrix.copy( invertedMat$1 );
			obb2$3.needsUpdate = true;

			// TODO: use a triangle iteration function here
			const res = otherGeometry.boundsTree.shapecast( {

				intersectsBounds: box => obb2$3.intersectsBox( box ),

				intersectsTriangle: tri => {

					tri.a.applyMatrix4( geometryToBvh );
					tri.b.applyMatrix4( geometryToBvh );
					tri.c.applyMatrix4( geometryToBvh );
					tri.needsUpdate = true;


					for ( let i = offset * 3, l = ( count + offset ) * 3; i < l; i += 3 ) {

						// this triangle needs to be transformed into the current BVH coordinate frame
						setTriangle( triangle2$1, i, thisIndex, thisPos );
						triangle2$1.needsUpdate = true;
						if ( tri.intersectsTriangle( triangle2$1 ) ) {

							return true;

						}

					}


					return false;

				}

			} );

			return res;

		} else {

			// if we're just dealing with raw geometry

			for ( let i = offset * 3, l = ( count + offset ) * 3; i < l; i += 3 ) {

				// this triangle needs to be transformed into the current BVH coordinate frame
				setTriangle( triangle$1, i, thisIndex, thisPos );


				triangle$1.a.applyMatrix4( invertedMat$1 );
				triangle$1.b.applyMatrix4( invertedMat$1 );
				triangle$1.c.applyMatrix4( invertedMat$1 );
				triangle$1.needsUpdate = true;

				for ( let i2 = 0, l2 = index.count; i2 < l2; i2 += 3 ) {

					setTriangle( triangle2$1, i2, index, pos );
					triangle2$1.needsUpdate = true;

					if ( triangle$1.intersectsTriangle( triangle2$1 ) ) {

						return true;

					}

				}


			}


		}

	} else {

		const left = nodeIndex32 + 8;
		const right = uint32Array[ nodeIndex32 + 6 ];

		arrayToBox( BOUNDING_DATA_INDEX( left ), float32Array, boundingBox$1 );
		const leftIntersection =
			cachedObb.intersectsBox( boundingBox$1 ) &&
			_intersectsGeometry$1( left, bvh, otherGeometry, geometryToBvh, cachedObb );

		if ( leftIntersection ) return true;

		arrayToBox( BOUNDING_DATA_INDEX( right ), float32Array, boundingBox$1 );
		const rightIntersection =
			cachedObb.intersectsBox( boundingBox$1 ) &&
			_intersectsGeometry$1( right, bvh, otherGeometry, geometryToBvh, cachedObb );

		if ( rightIntersection ) return true;

		return false;

	}

}

/*********************************************************************/
/* This file is generated from "closestPointToGeometry.template.js". */
/*********************************************************************/

const tempMatrix$1 = /* @__PURE__ */ new Matrix4();
const obb$3 = /* @__PURE__ */ new OrientedBox();
const obb2$2 = /* @__PURE__ */ new OrientedBox();
const temp1$1 = /* @__PURE__ */ new Vector3();
const temp2$1 = /* @__PURE__ */ new Vector3();
const temp3$1 = /* @__PURE__ */ new Vector3();
const temp4$1 = /* @__PURE__ */ new Vector3();

function closestPointToGeometry(
	bvh,
	otherGeometry,
	geometryToBvh,
	target1 = { },
	target2 = { },
	minThreshold = 0,
	maxThreshold = Infinity,
) {

	if ( ! otherGeometry.boundingBox ) {

		otherGeometry.computeBoundingBox();

	}

	obb$3.set( otherGeometry.boundingBox.min, otherGeometry.boundingBox.max, geometryToBvh );
	obb$3.needsUpdate = true;

	const geometry = bvh.geometry;
	const pos = geometry.attributes.position;
	const index = geometry.index;
	const otherPos = otherGeometry.attributes.position;
	const otherIndex = otherGeometry.index;
	const triangle = ExtendedTrianglePool.getPrimitive();
	const triangle2 = ExtendedTrianglePool.getPrimitive();

	let tempTarget1 = temp1$1;
	let tempTargetDest1 = temp2$1;
	let tempTarget2 = null;
	let tempTargetDest2 = null;

	if ( target2 ) {

		tempTarget2 = temp3$1;
		tempTargetDest2 = temp4$1;

	}

	let closestDistance = Infinity;
	let closestDistanceTriIndex = null;
	let closestDistanceOtherTriIndex = null;
	tempMatrix$1.copy( geometryToBvh ).invert();
	obb2$2.matrix.copy( tempMatrix$1 );
	bvh.shapecast(
		{

			boundsTraverseOrder: box => {

				return obb$3.distanceToBox( box );

			},

			intersectsBounds: ( box, isLeaf, score ) => {

				if ( score < closestDistance && score < maxThreshold ) {

					// if we know the triangles of this bounds will be intersected next then
					// save the bounds to use during triangle checks.
					if ( isLeaf ) {

						obb2$2.min.copy( box.min );
						obb2$2.max.copy( box.max );
						obb2$2.needsUpdate = true;

					}

					return true;

				}

				return false;

			},

			intersectsRange: ( offset, count ) => {

				if ( otherGeometry.boundsTree ) {

					// if the other geometry has a bvh then use the accelerated path where we use shapecast to find
					// the closest bounds in the other geometry to check.
					const otherBvh = otherGeometry.boundsTree;
					return otherBvh.shapecast( {
						boundsTraverseOrder: box => {

							return obb2$2.distanceToBox( box );

						},

						intersectsBounds: ( box, isLeaf, score ) => {

							return score < closestDistance && score < maxThreshold;

						},

						intersectsRange: ( otherOffset, otherCount ) => {

							for ( let i2 = otherOffset, l2 = otherOffset + otherCount; i2 < l2; i2 ++ ) {


								setTriangle( triangle2, 3 * i2, otherIndex, otherPos );

								triangle2.a.applyMatrix4( geometryToBvh );
								triangle2.b.applyMatrix4( geometryToBvh );
								triangle2.c.applyMatrix4( geometryToBvh );
								triangle2.needsUpdate = true;

								for ( let i = offset, l = offset + count; i < l; i ++ ) {


									setTriangle( triangle, 3 * i, index, pos );

									triangle.needsUpdate = true;

									const dist = triangle.distanceToTriangle( triangle2, tempTarget1, tempTarget2 );
									if ( dist < closestDistance ) {

										tempTargetDest1.copy( tempTarget1 );

										if ( tempTargetDest2 ) {

											tempTargetDest2.copy( tempTarget2 );

										}

										closestDistance = dist;
										closestDistanceTriIndex = i;
										closestDistanceOtherTriIndex = i2;

									}

									// stop traversal if we find a point that's under the given threshold
									if ( dist < minThreshold ) {

										return true;

									}

								}

							}

						},
					} );

				} else {

					// If no bounds tree then we'll just check every triangle.
					const triCount = getTriCount$1( otherGeometry );
					for ( let i2 = 0, l2 = triCount; i2 < l2; i2 ++ ) {

						setTriangle( triangle2, 3 * i2, otherIndex, otherPos );
						triangle2.a.applyMatrix4( geometryToBvh );
						triangle2.b.applyMatrix4( geometryToBvh );
						triangle2.c.applyMatrix4( geometryToBvh );
						triangle2.needsUpdate = true;

						for ( let i = offset, l = offset + count; i < l; i ++ ) {


							setTriangle( triangle, 3 * i, index, pos );

							triangle.needsUpdate = true;

							const dist = triangle.distanceToTriangle( triangle2, tempTarget1, tempTarget2 );
							if ( dist < closestDistance ) {

								tempTargetDest1.copy( tempTarget1 );

								if ( tempTargetDest2 ) {

									tempTargetDest2.copy( tempTarget2 );

								}

								closestDistance = dist;
								closestDistanceTriIndex = i;
								closestDistanceOtherTriIndex = i2;

							}

							// stop traversal if we find a point that's under the given threshold
							if ( dist < minThreshold ) {

								return true;

							}

						}

					}

				}

			},

		}

	);

	ExtendedTrianglePool.releasePrimitive( triangle );
	ExtendedTrianglePool.releasePrimitive( triangle2 );

	if ( closestDistance === Infinity ) {

		return null;

	}

	if ( ! target1.point ) {

		target1.point = tempTargetDest1.clone();

	} else {

		target1.point.copy( tempTargetDest1 );

	}

	target1.distance = closestDistance,
	target1.faceIndex = closestDistanceTriIndex;

	if ( target2 ) {

		if ( ! target2.point ) target2.point = tempTargetDest2.clone();
		else target2.point.copy( tempTargetDest2 );
		target2.point.applyMatrix4( tempMatrix$1 );
		tempTargetDest1.applyMatrix4( tempMatrix$1 );
		target2.distance = tempTargetDest1.sub( target2.point ).length();
		target2.faceIndex = closestDistanceOtherTriIndex;

	}

	return target1;

}

/****************************************************/
/* This file is generated from "refit.template.js". */
/****************************************************/

function refit_indirect( bvh, nodeIndices = null ) {

	if ( nodeIndices && Array.isArray( nodeIndices ) ) {

		nodeIndices = new Set( nodeIndices );

	}

	const geometry = bvh.geometry;
	const indexArr = geometry.index ? geometry.index.array : null;
	const posAttr = geometry.attributes.position;

	let buffer, uint32Array, uint16Array, float32Array;
	let byteOffset = 0;
	const roots = bvh._roots;
	for ( let i = 0, l = roots.length; i < l; i ++ ) {

		buffer = roots[ i ];
		uint32Array = new Uint32Array( buffer );
		uint16Array = new Uint16Array( buffer );
		float32Array = new Float32Array( buffer );

		_traverse( 0, byteOffset );
		byteOffset += buffer.byteLength;

	}

	function _traverse( node32Index, byteOffset, force = false ) {

		const node16Index = node32Index * 2;
		const isLeaf = uint16Array[ node16Index + 15 ] === IS_LEAFNODE_FLAG;
		if ( isLeaf ) {

			const offset = uint32Array[ node32Index + 6 ];
			const count = uint16Array[ node16Index + 14 ];

			let minx = Infinity;
			let miny = Infinity;
			let minz = Infinity;
			let maxx = - Infinity;
			let maxy = - Infinity;
			let maxz = - Infinity;

			for ( let i = offset, l = offset + count; i < l; i ++ ) {

				const t = 3 * bvh.resolveTriangleIndex( i );
				for ( let j = 0; j < 3; j ++ ) {

					let index = t + j;
					index = indexArr ? indexArr[ index ] : index;

					const x = posAttr.getX( index );
					const y = posAttr.getY( index );
					const z = posAttr.getZ( index );

					if ( x < minx ) minx = x;
					if ( x > maxx ) maxx = x;

					if ( y < miny ) miny = y;
					if ( y > maxy ) maxy = y;

					if ( z < minz ) minz = z;
					if ( z > maxz ) maxz = z;


				}

			}


			if (
				float32Array[ node32Index + 0 ] !== minx ||
				float32Array[ node32Index + 1 ] !== miny ||
				float32Array[ node32Index + 2 ] !== minz ||

				float32Array[ node32Index + 3 ] !== maxx ||
				float32Array[ node32Index + 4 ] !== maxy ||
				float32Array[ node32Index + 5 ] !== maxz
			) {

				float32Array[ node32Index + 0 ] = minx;
				float32Array[ node32Index + 1 ] = miny;
				float32Array[ node32Index + 2 ] = minz;

				float32Array[ node32Index + 3 ] = maxx;
				float32Array[ node32Index + 4 ] = maxy;
				float32Array[ node32Index + 5 ] = maxz;

				return true;

			} else {

				return false;

			}

		} else {

			const left = node32Index + 8;
			const right = uint32Array[ node32Index + 6 ];

			// the identifying node indices provided by the shapecast function include offsets of all
			// root buffers to guarantee they're unique between roots so offset left and right indices here.
			const offsetLeft = left + byteOffset;
			const offsetRight = right + byteOffset;
			let forceChildren = force;
			let includesLeft = false;
			let includesRight = false;

			if ( nodeIndices ) {

				// if we see that neither the left or right child are included in the set that need to be updated
				// then we assume that all children need to be updated.
				if ( ! forceChildren ) {

					includesLeft = nodeIndices.has( offsetLeft );
					includesRight = nodeIndices.has( offsetRight );
					forceChildren = ! includesLeft && ! includesRight;

				}

			} else {

				includesLeft = true;
				includesRight = true;

			}

			const traverseLeft = forceChildren || includesLeft;
			const traverseRight = forceChildren || includesRight;

			let leftChange = false;
			if ( traverseLeft ) {

				leftChange = _traverse( left, byteOffset, forceChildren );

			}

			let rightChange = false;
			if ( traverseRight ) {

				rightChange = _traverse( right, byteOffset, forceChildren );

			}

			const didChange = leftChange || rightChange;
			if ( didChange ) {

				for ( let i = 0; i < 3; i ++ ) {

					const lefti = left + i;
					const righti = right + i;
					const minLeftValue = float32Array[ lefti ];
					const maxLeftValue = float32Array[ lefti + 3 ];
					const minRightValue = float32Array[ righti ];
					const maxRightValue = float32Array[ righti + 3 ];

					float32Array[ node32Index + i ] = minLeftValue < minRightValue ? minLeftValue : minRightValue;
					float32Array[ node32Index + i + 3 ] = maxLeftValue > maxRightValue ? maxLeftValue : maxRightValue;

				}

			}

			return didChange;

		}

	}

}

/******************************************************/
/* This file is generated from "raycast.template.js". */
/******************************************************/

function raycast_indirect( bvh, root, side, ray, intersects, near, far ) {

	BufferStack.setBuffer( bvh._roots[ root ] );
	_raycast( 0, bvh, side, ray, intersects, near, far );
	BufferStack.clearBuffer();

}

function _raycast( nodeIndex32, bvh, side, ray, intersects, near, far ) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	const nodeIndex16 = nodeIndex32 * 2;
	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );

		intersectTris_indirect( bvh, side, ray, offset, count, intersects, near, far );


	} else {

		const leftIndex = LEFT_NODE( nodeIndex32 );
		if ( intersectRay( leftIndex, float32Array, ray, near, far ) ) {

			_raycast( leftIndex, bvh, side, ray, intersects, near, far );

		}

		const rightIndex = RIGHT_NODE( nodeIndex32, uint32Array );
		if ( intersectRay( rightIndex, float32Array, ray, near, far ) ) {

			_raycast( rightIndex, bvh, side, ray, intersects, near, far );

		}

	}

}

/***********************************************************/
/* This file is generated from "raycastFirst.template.js". */
/***********************************************************/

const _xyzFields = [ 'x', 'y', 'z' ];

function raycastFirst_indirect( bvh, root, side, ray, near, far ) {

	BufferStack.setBuffer( bvh._roots[ root ] );
	const result = _raycastFirst( 0, bvh, side, ray, near, far );
	BufferStack.clearBuffer();

	return result;

}

function _raycastFirst( nodeIndex32, bvh, side, ray, near, far ) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	let nodeIndex16 = nodeIndex32 * 2;

	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );

		return intersectClosestTri_indirect( bvh, side, ray, offset, count, near, far );


	} else {

		// consider the position of the split plane with respect to the oncoming ray; whichever direction
		// the ray is coming from, look for an intersection among that side of the tree first
		const splitAxis = SPLIT_AXIS( nodeIndex32, uint32Array );
		const xyzAxis = _xyzFields[ splitAxis ];
		const rayDir = ray.direction[ xyzAxis ];
		const leftToRight = rayDir >= 0;

		// c1 is the child to check first
		let c1, c2;
		if ( leftToRight ) {

			c1 = LEFT_NODE( nodeIndex32 );
			c2 = RIGHT_NODE( nodeIndex32, uint32Array );

		} else {

			c1 = RIGHT_NODE( nodeIndex32, uint32Array );
			c2 = LEFT_NODE( nodeIndex32 );

		}

		const c1Intersection = intersectRay( c1, float32Array, ray, near, far );
		const c1Result = c1Intersection ? _raycastFirst( c1, bvh, side, ray, near, far ) : null;

		// if we got an intersection in the first node and it's closer than the second node's bounding
		// box, we don't need to consider the second node because it couldn't possibly be a better result
		if ( c1Result ) {

			// check if the point is within the second bounds
			// "point" is in the local frame of the bvh
			const point = c1Result.point[ xyzAxis ];
			const isOutside = leftToRight ?
				point <= float32Array[ c2 + splitAxis ] : // min bounding data
				point >= float32Array[ c2 + splitAxis + 3 ]; // max bounding data

			if ( isOutside ) {

				return c1Result;

			}

		}

		// either there was no intersection in the first node, or there could still be a closer
		// intersection in the second, so check the second node and then take the better of the two
		const c2Intersection = intersectRay( c2, float32Array, ray, near, far );
		const c2Result = c2Intersection ? _raycastFirst( c2, bvh, side, ray, near, far ) : null;

		if ( c1Result && c2Result ) {

			return c1Result.distance <= c2Result.distance ? c1Result : c2Result;

		} else {

			return c1Result || c2Result || null;

		}

	}

}

/*****************************************************************/
/* This file is generated from "intersectsGeometry.template.js". */
/*****************************************************************/
/* eslint-disable indent */

const boundingBox = /* @__PURE__ */ new Box3();
const triangle = /* @__PURE__ */ new ExtendedTriangle();
const triangle2 = /* @__PURE__ */ new ExtendedTriangle();
const invertedMat = /* @__PURE__ */ new Matrix4();

const obb$2 = /* @__PURE__ */ new OrientedBox();
const obb2$1 = /* @__PURE__ */ new OrientedBox();

function intersectsGeometry_indirect( bvh, root, otherGeometry, geometryToBvh ) {

	BufferStack.setBuffer( bvh._roots[ root ] );
	const result = _intersectsGeometry( 0, bvh, otherGeometry, geometryToBvh );
	BufferStack.clearBuffer();

	return result;

}

function _intersectsGeometry( nodeIndex32, bvh, otherGeometry, geometryToBvh, cachedObb = null ) {

	const { float32Array, uint16Array, uint32Array } = BufferStack;
	let nodeIndex16 = nodeIndex32 * 2;

	if ( cachedObb === null ) {

		if ( ! otherGeometry.boundingBox ) {

			otherGeometry.computeBoundingBox();

		}

		obb$2.set( otherGeometry.boundingBox.min, otherGeometry.boundingBox.max, geometryToBvh );
		cachedObb = obb$2;

	}

	const isLeaf = IS_LEAF( nodeIndex16, uint16Array );
	if ( isLeaf ) {

		const thisGeometry = bvh.geometry;
		const thisIndex = thisGeometry.index;
		const thisPos = thisGeometry.attributes.position;

		const index = otherGeometry.index;
		const pos = otherGeometry.attributes.position;

		const offset = OFFSET( nodeIndex32, uint32Array );
		const count = COUNT( nodeIndex16, uint16Array );

		// get the inverse of the geometry matrix so we can transform our triangles into the
		// geometry space we're trying to test. We assume there are fewer triangles being checked
		// here.
		invertedMat.copy( geometryToBvh ).invert();

		if ( otherGeometry.boundsTree ) {

			// if there's a bounds tree
			arrayToBox( BOUNDING_DATA_INDEX( nodeIndex32 ), float32Array, obb2$1 );
			obb2$1.matrix.copy( invertedMat );
			obb2$1.needsUpdate = true;

			// TODO: use a triangle iteration function here
			const res = otherGeometry.boundsTree.shapecast( {

				intersectsBounds: box => obb2$1.intersectsBox( box ),

				intersectsTriangle: tri => {

					tri.a.applyMatrix4( geometryToBvh );
					tri.b.applyMatrix4( geometryToBvh );
					tri.c.applyMatrix4( geometryToBvh );
					tri.needsUpdate = true;

					for ( let i = offset, l = count + offset; i < l; i ++ ) {

						// this triangle needs to be transformed into the current BVH coordinate frame
						setTriangle( triangle2, 3 * bvh.resolveTriangleIndex( i ), thisIndex, thisPos );
						triangle2.needsUpdate = true;
						if ( tri.intersectsTriangle( triangle2 ) ) {

							return true;

						}

					}


					return false;

				}

			} );

			return res;

		} else {

			// if we're just dealing with raw geometry
			for ( let i = offset, l = count + offset; i < l; i ++ ) {

				// this triangle needs to be transformed into the current BVH coordinate frame
				const ti = bvh.resolveTriangleIndex( i );
				setTriangle( triangle, 3 * ti, thisIndex, thisPos );


				triangle.a.applyMatrix4( invertedMat );
				triangle.b.applyMatrix4( invertedMat );
				triangle.c.applyMatrix4( invertedMat );
				triangle.needsUpdate = true;

				for ( let i2 = 0, l2 = index.count; i2 < l2; i2 += 3 ) {

					setTriangle( triangle2, i2, index, pos );
					triangle2.needsUpdate = true;

					if ( triangle.intersectsTriangle( triangle2 ) ) {

						return true;

					}

				}

			}


		}

	} else {

		const left = nodeIndex32 + 8;
		const right = uint32Array[ nodeIndex32 + 6 ];

		arrayToBox( BOUNDING_DATA_INDEX( left ), float32Array, boundingBox );
		const leftIntersection =
			cachedObb.intersectsBox( boundingBox ) &&
			_intersectsGeometry( left, bvh, otherGeometry, geometryToBvh, cachedObb );

		if ( leftIntersection ) return true;

		arrayToBox( BOUNDING_DATA_INDEX( right ), float32Array, boundingBox );
		const rightIntersection =
			cachedObb.intersectsBox( boundingBox ) &&
			_intersectsGeometry( right, bvh, otherGeometry, geometryToBvh, cachedObb );

		if ( rightIntersection ) return true;

		return false;

	}

}

/*********************************************************************/
/* This file is generated from "closestPointToGeometry.template.js". */
/*********************************************************************/

const tempMatrix = /* @__PURE__ */ new Matrix4();
const obb$1 = /* @__PURE__ */ new OrientedBox();
const obb2 = /* @__PURE__ */ new OrientedBox();
const temp1 = /* @__PURE__ */ new Vector3();
const temp2 = /* @__PURE__ */ new Vector3();
const temp3 = /* @__PURE__ */ new Vector3();
const temp4 = /* @__PURE__ */ new Vector3();

function closestPointToGeometry_indirect(
	bvh,
	otherGeometry,
	geometryToBvh,
	target1 = { },
	target2 = { },
	minThreshold = 0,
	maxThreshold = Infinity,
) {

	if ( ! otherGeometry.boundingBox ) {

		otherGeometry.computeBoundingBox();

	}

	obb$1.set( otherGeometry.boundingBox.min, otherGeometry.boundingBox.max, geometryToBvh );
	obb$1.needsUpdate = true;

	const geometry = bvh.geometry;
	const pos = geometry.attributes.position;
	const index = geometry.index;
	const otherPos = otherGeometry.attributes.position;
	const otherIndex = otherGeometry.index;
	const triangle = ExtendedTrianglePool.getPrimitive();
	const triangle2 = ExtendedTrianglePool.getPrimitive();

	let tempTarget1 = temp1;
	let tempTargetDest1 = temp2;
	let tempTarget2 = null;
	let tempTargetDest2 = null;

	if ( target2 ) {

		tempTarget2 = temp3;
		tempTargetDest2 = temp4;

	}

	let closestDistance = Infinity;
	let closestDistanceTriIndex = null;
	let closestDistanceOtherTriIndex = null;
	tempMatrix.copy( geometryToBvh ).invert();
	obb2.matrix.copy( tempMatrix );
	bvh.shapecast(
		{

			boundsTraverseOrder: box => {

				return obb$1.distanceToBox( box );

			},

			intersectsBounds: ( box, isLeaf, score ) => {

				if ( score < closestDistance && score < maxThreshold ) {

					// if we know the triangles of this bounds will be intersected next then
					// save the bounds to use during triangle checks.
					if ( isLeaf ) {

						obb2.min.copy( box.min );
						obb2.max.copy( box.max );
						obb2.needsUpdate = true;

					}

					return true;

				}

				return false;

			},

			intersectsRange: ( offset, count ) => {

				if ( otherGeometry.boundsTree ) {

					// if the other geometry has a bvh then use the accelerated path where we use shapecast to find
					// the closest bounds in the other geometry to check.
					const otherBvh = otherGeometry.boundsTree;
					return otherBvh.shapecast( {
						boundsTraverseOrder: box => {

							return obb2.distanceToBox( box );

						},

						intersectsBounds: ( box, isLeaf, score ) => {

							return score < closestDistance && score < maxThreshold;

						},

						intersectsRange: ( otherOffset, otherCount ) => {

							for ( let i2 = otherOffset, l2 = otherOffset + otherCount; i2 < l2; i2 ++ ) {

								const ti2 = otherBvh.resolveTriangleIndex( i2 );
								setTriangle( triangle2, 3 * ti2, otherIndex, otherPos );

								triangle2.a.applyMatrix4( geometryToBvh );
								triangle2.b.applyMatrix4( geometryToBvh );
								triangle2.c.applyMatrix4( geometryToBvh );
								triangle2.needsUpdate = true;

								for ( let i = offset, l = offset + count; i < l; i ++ ) {

									const ti = bvh.resolveTriangleIndex( i );
									setTriangle( triangle, 3 * ti, index, pos );

									triangle.needsUpdate = true;

									const dist = triangle.distanceToTriangle( triangle2, tempTarget1, tempTarget2 );
									if ( dist < closestDistance ) {

										tempTargetDest1.copy( tempTarget1 );

										if ( tempTargetDest2 ) {

											tempTargetDest2.copy( tempTarget2 );

										}

										closestDistance = dist;
										closestDistanceTriIndex = i;
										closestDistanceOtherTriIndex = i2;

									}

									// stop traversal if we find a point that's under the given threshold
									if ( dist < minThreshold ) {

										return true;

									}

								}

							}

						},
					} );

				} else {

					// If no bounds tree then we'll just check every triangle.
					const triCount = getTriCount$1( otherGeometry );
					for ( let i2 = 0, l2 = triCount; i2 < l2; i2 ++ ) {

						setTriangle( triangle2, 3 * i2, otherIndex, otherPos );
						triangle2.a.applyMatrix4( geometryToBvh );
						triangle2.b.applyMatrix4( geometryToBvh );
						triangle2.c.applyMatrix4( geometryToBvh );
						triangle2.needsUpdate = true;

						for ( let i = offset, l = offset + count; i < l; i ++ ) {

							const ti = bvh.resolveTriangleIndex( i );
							setTriangle( triangle, 3 * ti, index, pos );

							triangle.needsUpdate = true;

							const dist = triangle.distanceToTriangle( triangle2, tempTarget1, tempTarget2 );
							if ( dist < closestDistance ) {

								tempTargetDest1.copy( tempTarget1 );

								if ( tempTargetDest2 ) {

									tempTargetDest2.copy( tempTarget2 );

								}

								closestDistance = dist;
								closestDistanceTriIndex = i;
								closestDistanceOtherTriIndex = i2;

							}

							// stop traversal if we find a point that's under the given threshold
							if ( dist < minThreshold ) {

								return true;

							}

						}

					}

				}

			},

		}

	);

	ExtendedTrianglePool.releasePrimitive( triangle );
	ExtendedTrianglePool.releasePrimitive( triangle2 );

	if ( closestDistance === Infinity ) {

		return null;

	}

	if ( ! target1.point ) {

		target1.point = tempTargetDest1.clone();

	} else {

		target1.point.copy( tempTargetDest1 );

	}

	target1.distance = closestDistance,
	target1.faceIndex = closestDistanceTriIndex;

	if ( target2 ) {

		if ( ! target2.point ) target2.point = tempTargetDest2.clone();
		else target2.point.copy( tempTargetDest2 );
		target2.point.applyMatrix4( tempMatrix );
		tempTargetDest1.applyMatrix4( tempMatrix );
		target2.distance = tempTargetDest1.sub( target2.point ).length();
		target2.faceIndex = closestDistanceOtherTriIndex;

	}

	return target1;

}

function isSharedArrayBufferSupported() {

	return typeof SharedArrayBuffer !== 'undefined';

}

const _bufferStack1 = new BufferStack.constructor();
const _bufferStack2 = new BufferStack.constructor();
const _boxPool = new PrimitivePool( () => new Box3() );
const _leftBox1 = new Box3();
const _rightBox1 = new Box3();

const _leftBox2 = new Box3();
const _rightBox2 = new Box3();

let _active = false;

function bvhcast( bvh, otherBvh, matrixToLocal, intersectsRanges ) {

	if ( _active ) {

		throw new Error( 'MeshBVH: Recursive calls to bvhcast not supported.' );

	}

	_active = true;

	const roots = bvh._roots;
	const otherRoots = otherBvh._roots;
	let result;
	let offset1 = 0;
	let offset2 = 0;
	const invMat = new Matrix4().copy( matrixToLocal ).invert();

	// iterate over the first set of roots
	for ( let i = 0, il = roots.length; i < il; i ++ ) {

		_bufferStack1.setBuffer( roots[ i ] );
		offset2 = 0;

		// prep the initial root box
		const localBox = _boxPool.getPrimitive();
		arrayToBox( BOUNDING_DATA_INDEX( 0 ), _bufferStack1.float32Array, localBox );
		localBox.applyMatrix4( invMat );

		// iterate over the second set of roots
		for ( let j = 0, jl = otherRoots.length; j < jl; j ++ ) {

			_bufferStack2.setBuffer( otherRoots[ j ] );

			result = _traverse(
				0, 0, matrixToLocal, invMat, intersectsRanges,
				offset1, offset2, 0, 0,
				localBox,
			);

			_bufferStack2.clearBuffer();
			offset2 += otherRoots[ j ].length;

			if ( result ) {

				break;

			}

		}

		// release stack info
		_boxPool.releasePrimitive( localBox );
		_bufferStack1.clearBuffer();
		offset1 += roots[ i ].length;

		if ( result ) {

			break;

		}

	}

	_active = false;
	return result;

}

function _traverse(
	node1Index32,
	node2Index32,
	matrix2to1,
	matrix1to2,
	intersectsRangesFunc,

	// offsets for ids
	node1IndexByteOffset = 0,
	node2IndexByteOffset = 0,

	// tree depth
	depth1 = 0,
	depth2 = 0,

	currBox = null,
	reversed = false,

) {

	// get the buffer stacks associated with the current indices
	let bufferStack1, bufferStack2;
	if ( reversed ) {

		bufferStack1 = _bufferStack2;
		bufferStack2 = _bufferStack1;

	} else {

		bufferStack1 = _bufferStack1;
		bufferStack2 = _bufferStack2;

	}

	// get the local instances of the typed buffers
	const
		float32Array1 = bufferStack1.float32Array,
		uint32Array1 = bufferStack1.uint32Array,
		uint16Array1 = bufferStack1.uint16Array,
		float32Array2 = bufferStack2.float32Array,
		uint32Array2 = bufferStack2.uint32Array,
		uint16Array2 = bufferStack2.uint16Array;

	const node1Index16 = node1Index32 * 2;
	const node2Index16 = node2Index32 * 2;
	const isLeaf1 = IS_LEAF( node1Index16, uint16Array1 );
	const isLeaf2 = IS_LEAF( node2Index16, uint16Array2 );
	let result = false;
	if ( isLeaf2 && isLeaf1 ) {

		// if both bounds are leaf nodes then fire the callback if the boxes intersect
		if ( reversed ) {

			result = intersectsRangesFunc(
				OFFSET( node2Index32, uint32Array2 ), COUNT( node2Index32 * 2, uint16Array2 ),
				OFFSET( node1Index32, uint32Array1 ), COUNT( node1Index32 * 2, uint16Array1 ),
				depth2, node2IndexByteOffset + node2Index32,
				depth1, node1IndexByteOffset + node1Index32,
			);

		} else {

			result = intersectsRangesFunc(
				OFFSET( node1Index32, uint32Array1 ), COUNT( node1Index32 * 2, uint16Array1 ),
				OFFSET( node2Index32, uint32Array2 ), COUNT( node2Index32 * 2, uint16Array2 ),
				depth1, node1IndexByteOffset + node1Index32,
				depth2, node2IndexByteOffset + node2Index32,
			);

		}

	} else if ( isLeaf2 ) {

		// SWAP
		// If we've traversed to the leaf node on the other bvh then we need to swap over
		// to traverse down the first one

		// get the new box to use
		const newBox = _boxPool.getPrimitive();
		arrayToBox( BOUNDING_DATA_INDEX( node2Index32 ), float32Array2, newBox );
		newBox.applyMatrix4( matrix2to1 );

		// get the child bounds to check before traversal
		const cl1 = LEFT_NODE( node1Index32 );
		const cr1 = RIGHT_NODE( node1Index32, uint32Array1 );
		arrayToBox( BOUNDING_DATA_INDEX( cl1 ), float32Array1, _leftBox1 );
		arrayToBox( BOUNDING_DATA_INDEX( cr1 ), float32Array1, _rightBox1 );

		// precompute the intersections otherwise the global boxes will be modified during traversal
		const intersectCl1 = newBox.intersectsBox( _leftBox1 );
		const intersectCr1 = newBox.intersectsBox( _rightBox1 );
		result = (
			intersectCl1 && _traverse(
				node2Index32, cl1, matrix1to2, matrix2to1, intersectsRangesFunc,
				node2IndexByteOffset, node1IndexByteOffset, depth2, depth1 + 1,
				newBox, ! reversed,
			)
		) || (
			intersectCr1 && _traverse(
				node2Index32, cr1, matrix1to2, matrix2to1, intersectsRangesFunc,
				node2IndexByteOffset, node1IndexByteOffset, depth2, depth1 + 1,
				newBox, ! reversed,
			)
		);

		_boxPool.releasePrimitive( newBox );

	} else {

		// if neither are leaves then we should swap if one of the children does not
		// intersect with the current bounds

		// get the child bounds to check
		const cl2 = LEFT_NODE( node2Index32 );
		const cr2 = RIGHT_NODE( node2Index32, uint32Array2 );
		arrayToBox( BOUNDING_DATA_INDEX( cl2 ), float32Array2, _leftBox2 );
		arrayToBox( BOUNDING_DATA_INDEX( cr2 ), float32Array2, _rightBox2 );

		const leftIntersects = currBox.intersectsBox( _leftBox2 );
		const rightIntersects = currBox.intersectsBox( _rightBox2 );
		if ( leftIntersects && rightIntersects ) {

			// continue to traverse both children if they both intersect
			result = _traverse(
				node1Index32, cl2, matrix2to1, matrix1to2, intersectsRangesFunc,
				node1IndexByteOffset, node2IndexByteOffset, depth1, depth2 + 1,
				currBox, reversed,
			) || _traverse(
				node1Index32, cr2, matrix2to1, matrix1to2, intersectsRangesFunc,
				node1IndexByteOffset, node2IndexByteOffset, depth1, depth2 + 1,
				currBox, reversed,
			);

		} else if ( leftIntersects ) {

			if ( isLeaf1 ) {

				// if the current box is a leaf then just continue
				result = _traverse(
					node1Index32, cl2, matrix2to1, matrix1to2, intersectsRangesFunc,
					node1IndexByteOffset, node2IndexByteOffset, depth1, depth2 + 1,
					currBox, reversed,
				);

			} else {

				// SWAP
				// if only one box intersects then we have to swap to the other bvh to continue
				const newBox = _boxPool.getPrimitive();
				newBox.copy( _leftBox2 ).applyMatrix4( matrix2to1 );

				const cl1 = LEFT_NODE( node1Index32 );
				const cr1 = RIGHT_NODE( node1Index32, uint32Array1 );
				arrayToBox( BOUNDING_DATA_INDEX( cl1 ), float32Array1, _leftBox1 );
				arrayToBox( BOUNDING_DATA_INDEX( cr1 ), float32Array1, _rightBox1 );

				// precompute the intersections otherwise the global boxes will be modified during traversal
				const intersectCl1 = newBox.intersectsBox( _leftBox1 );
				const intersectCr1 = newBox.intersectsBox( _rightBox1 );
				result = (
					intersectCl1 && _traverse(
						cl2, cl1, matrix1to2, matrix2to1, intersectsRangesFunc,
						node2IndexByteOffset, node1IndexByteOffset, depth2, depth1 + 1,
						newBox, ! reversed,
					)
				) || (
					intersectCr1 && _traverse(
						cl2, cr1, matrix1to2, matrix2to1, intersectsRangesFunc,
						node2IndexByteOffset, node1IndexByteOffset, depth2, depth1 + 1,
						newBox, ! reversed,
					)
				);

				_boxPool.releasePrimitive( newBox );

			}

		} else if ( rightIntersects ) {

			if ( isLeaf1 ) {

				// if the current box is a leaf then just continue
				result = _traverse(
					node1Index32, cr2, matrix2to1, matrix1to2, intersectsRangesFunc,
					node1IndexByteOffset, node2IndexByteOffset, depth1, depth2 + 1,
					currBox, reversed,
				);

			} else {

				// SWAP
				// if only one box intersects then we have to swap to the other bvh to continue
				const newBox = _boxPool.getPrimitive();
				newBox.copy( _rightBox2 ).applyMatrix4( matrix2to1 );

				const cl1 = LEFT_NODE( node1Index32 );
				const cr1 = RIGHT_NODE( node1Index32, uint32Array1 );
				arrayToBox( BOUNDING_DATA_INDEX( cl1 ), float32Array1, _leftBox1 );
				arrayToBox( BOUNDING_DATA_INDEX( cr1 ), float32Array1, _rightBox1 );

				// precompute the intersections otherwise the global boxes will be modified during traversal
				const intersectCl1 = newBox.intersectsBox( _leftBox1 );
				const intersectCr1 = newBox.intersectsBox( _rightBox1 );
				result = (
					intersectCl1 && _traverse(
						cr2, cl1, matrix1to2, matrix2to1, intersectsRangesFunc,
						node2IndexByteOffset, node1IndexByteOffset, depth2, depth1 + 1,
						newBox, ! reversed,
					)
				) || (
					intersectCr1 && _traverse(
						cr2, cr1, matrix1to2, matrix2to1, intersectsRangesFunc,
						node2IndexByteOffset, node1IndexByteOffset, depth2, depth1 + 1,
						newBox, ! reversed,
					)
				);

				_boxPool.releasePrimitive( newBox );

			}

		}

	}

	return result;

}

const obb = /* @__PURE__ */ new OrientedBox();
const tempBox$1 = /* @__PURE__ */ new Box3();
const DEFAULT_OPTIONS = {
	strategy: CENTER,
	maxDepth: 40,
	maxLeafTris: 10,
	useSharedArrayBuffer: false,
	setBoundingBox: true,
	onProgress: null,
	indirect: false,
	verbose: true,
	range: null
};

class MeshBVH {

	static serialize( bvh, options = {} ) {

		options = {
			cloneBuffers: true,
			...options,
		};

		const geometry = bvh.geometry;
		const rootData = bvh._roots;
		const indirectBuffer = bvh._indirectBuffer;
		const indexAttribute = geometry.getIndex();
		let result;
		if ( options.cloneBuffers ) {

			result = {
				roots: rootData.map( root => root.slice() ),
				index: indexAttribute ? indexAttribute.array.slice() : null,
				indirectBuffer: indirectBuffer ? indirectBuffer.slice() : null,
			};

		} else {

			result = {
				roots: rootData,
				index: indexAttribute ? indexAttribute.array : null,
				indirectBuffer: indirectBuffer,
			};

		}

		return result;

	}

	static deserialize( data, geometry, options = {} ) {

		options = {
			setIndex: true,
			indirect: Boolean( data.indirectBuffer ),
			...options,
		};

		const { index, roots, indirectBuffer } = data;
		const bvh = new MeshBVH( geometry, { ...options, [ SKIP_GENERATION ]: true } );
		bvh._roots = roots;
		bvh._indirectBuffer = indirectBuffer || null;

		if ( options.setIndex ) {

			const indexAttribute = geometry.getIndex();
			if ( indexAttribute === null ) {

				const newIndex = new BufferAttribute( data.index, 1, false );
				geometry.setIndex( newIndex );

			} else if ( indexAttribute.array !== index ) {

				indexAttribute.array.set( index );
				indexAttribute.needsUpdate = true;

			}

		}

		return bvh;

	}

	get indirect() {

		return ! ! this._indirectBuffer;

	}

	constructor( geometry, options = {} ) {

		if ( ! geometry.isBufferGeometry ) {

			throw new Error( 'MeshBVH: Only BufferGeometries are supported.' );

		} else if ( geometry.index && geometry.index.isInterleavedBufferAttribute ) {

			throw new Error( 'MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.' );

		}

		// default options
		options = Object.assign( {

			...DEFAULT_OPTIONS,

			// undocumented options

			// Whether to skip generating the tree. Used for deserialization.
			[ SKIP_GENERATION ]: false,

		}, options );

		if ( options.useSharedArrayBuffer && ! isSharedArrayBufferSupported() ) {

			throw new Error( 'MeshBVH: SharedArrayBuffer is not available.' );

		}

		// retain references to the geometry so we can use them it without having to
		// take a geometry reference in every function.
		this.geometry = geometry;
		this._roots = null;
		this._indirectBuffer = null;
		if ( ! options[ SKIP_GENERATION ] ) {

			buildPackedTree( this, options );

			if ( ! geometry.boundingBox && options.setBoundingBox ) {

				geometry.boundingBox = this.getBoundingBox( new Box3() );

			}

		}

		this.resolveTriangleIndex = options.indirect ? i => this._indirectBuffer[ i ] : i => i;

	}

	refit( nodeIndices = null ) {

		const refitFunc = this.indirect ? refit_indirect : refit;
		return refitFunc( this, nodeIndices );

	}

	traverse( callback, rootIndex = 0 ) {

		const buffer = this._roots[ rootIndex ];
		const uint32Array = new Uint32Array( buffer );
		const uint16Array = new Uint16Array( buffer );
		_traverse( 0 );

		function _traverse( node32Index, depth = 0 ) {

			const node16Index = node32Index * 2;
			const isLeaf = uint16Array[ node16Index + 15 ] === IS_LEAFNODE_FLAG;
			if ( isLeaf ) {

				const offset = uint32Array[ node32Index + 6 ];
				const count = uint16Array[ node16Index + 14 ];
				callback( depth, isLeaf, new Float32Array( buffer, node32Index * 4, 6 ), offset, count );

			} else {

				// TODO: use node functions here
				const left = node32Index + BYTES_PER_NODE / 4;
				const right = uint32Array[ node32Index + 6 ];
				const splitAxis = uint32Array[ node32Index + 7 ];
				const stopTraversal = callback( depth, isLeaf, new Float32Array( buffer, node32Index * 4, 6 ), splitAxis );

				if ( ! stopTraversal ) {

					_traverse( left, depth + 1 );
					_traverse( right, depth + 1 );

				}

			}

		}

	}

	/* Core Cast Functions */
	raycast( ray, materialOrSide = FrontSide, near = 0, far = Infinity ) {

		const roots = this._roots;
		const geometry = this.geometry;
		const intersects = [];
		const isMaterial = materialOrSide.isMaterial;
		const isArrayMaterial = Array.isArray( materialOrSide );

		const groups = geometry.groups;
		const side = isMaterial ? materialOrSide.side : materialOrSide;
		const raycastFunc = this.indirect ? raycast_indirect : raycast;
		for ( let i = 0, l = roots.length; i < l; i ++ ) {

			const materialSide = isArrayMaterial ? materialOrSide[ groups[ i ].materialIndex ].side : side;
			const startCount = intersects.length;

			raycastFunc( this, i, materialSide, ray, intersects, near, far );

			if ( isArrayMaterial ) {

				const materialIndex = groups[ i ].materialIndex;
				for ( let j = startCount, jl = intersects.length; j < jl; j ++ ) {

					intersects[ j ].face.materialIndex = materialIndex;

				}

			}

		}

		return intersects;

	}

	raycastFirst( ray, materialOrSide = FrontSide, near = 0, far = Infinity ) {

		const roots = this._roots;
		const geometry = this.geometry;
		const isMaterial = materialOrSide.isMaterial;
		const isArrayMaterial = Array.isArray( materialOrSide );

		let closestResult = null;

		const groups = geometry.groups;
		const side = isMaterial ? materialOrSide.side : materialOrSide;
		const raycastFirstFunc = this.indirect ? raycastFirst_indirect : raycastFirst;
		for ( let i = 0, l = roots.length; i < l; i ++ ) {

			const materialSide = isArrayMaterial ? materialOrSide[ groups[ i ].materialIndex ].side : side;
			const result = raycastFirstFunc( this, i, materialSide, ray, near, far );
			if ( result != null && ( closestResult == null || result.distance < closestResult.distance ) ) {

				closestResult = result;
				if ( isArrayMaterial ) {

					result.face.materialIndex = groups[ i ].materialIndex;

				}

			}

		}

		return closestResult;

	}

	intersectsGeometry( otherGeometry, geomToMesh ) {

		let result = false;
		const roots = this._roots;
		const intersectsGeometryFunc = this.indirect ? intersectsGeometry_indirect : intersectsGeometry;
		for ( let i = 0, l = roots.length; i < l; i ++ ) {

			result = intersectsGeometryFunc( this, i, otherGeometry, geomToMesh );

			if ( result ) {

				break;

			}

		}

		return result;

	}

	shapecast( callbacks ) {

		const triangle = ExtendedTrianglePool.getPrimitive();
		const iterateFunc = this.indirect ? iterateOverTriangles_indirect : iterateOverTriangles;
		let {
			boundsTraverseOrder,
			intersectsBounds,
			intersectsRange,
			intersectsTriangle,
		} = callbacks;

		// wrap the intersectsRange function
		if ( intersectsRange && intersectsTriangle ) {

			const originalIntersectsRange = intersectsRange;
			intersectsRange = ( offset, count, contained, depth, nodeIndex ) => {

				if ( ! originalIntersectsRange( offset, count, contained, depth, nodeIndex ) ) {

					return iterateFunc( offset, count, this, intersectsTriangle, contained, depth, triangle );

				}

				return true;

			};

		} else if ( ! intersectsRange ) {

			if ( intersectsTriangle ) {

				intersectsRange = ( offset, count, contained, depth ) => {

					return iterateFunc( offset, count, this, intersectsTriangle, contained, depth, triangle );

				};

			} else {

				intersectsRange = ( offset, count, contained ) => {

					return contained;

				};

			}

		}

		// run shapecast
		let result = false;
		let byteOffset = 0;
		const roots = this._roots;
		for ( let i = 0, l = roots.length; i < l; i ++ ) {

			const root = roots[ i ];
			result = shapecast( this, i, intersectsBounds, intersectsRange, boundsTraverseOrder, byteOffset );

			if ( result ) {

				break;

			}

			byteOffset += root.byteLength;

		}

		ExtendedTrianglePool.releasePrimitive( triangle );

		return result;

	}

	bvhcast( otherBvh, matrixToLocal, callbacks ) {

		let {
			intersectsRanges,
			intersectsTriangles,
		} = callbacks;

		const triangle1 = ExtendedTrianglePool.getPrimitive();
		const indexAttr1 = this.geometry.index;
		const positionAttr1 = this.geometry.attributes.position;
		const assignTriangle1 = this.indirect ?
			i1 => {


				const ti = this.resolveTriangleIndex( i1 );
				setTriangle( triangle1, ti * 3, indexAttr1, positionAttr1 );

			} :
			i1 => {

				setTriangle( triangle1, i1 * 3, indexAttr1, positionAttr1 );

			};

		const triangle2 = ExtendedTrianglePool.getPrimitive();
		const indexAttr2 = otherBvh.geometry.index;
		const positionAttr2 = otherBvh.geometry.attributes.position;
		const assignTriangle2 = otherBvh.indirect ?
			i2 => {

				const ti2 = otherBvh.resolveTriangleIndex( i2 );
				setTriangle( triangle2, ti2 * 3, indexAttr2, positionAttr2 );

			} :
			i2 => {

				setTriangle( triangle2, i2 * 3, indexAttr2, positionAttr2 );

			};

		// generate triangle callback if needed
		if ( intersectsTriangles ) {

			const iterateOverDoubleTriangles = ( offset1, count1, offset2, count2, depth1, index1, depth2, index2 ) => {

				for ( let i2 = offset2, l2 = offset2 + count2; i2 < l2; i2 ++ ) {

					assignTriangle2( i2 );

					triangle2.a.applyMatrix4( matrixToLocal );
					triangle2.b.applyMatrix4( matrixToLocal );
					triangle2.c.applyMatrix4( matrixToLocal );
					triangle2.needsUpdate = true;

					for ( let i1 = offset1, l1 = offset1 + count1; i1 < l1; i1 ++ ) {

						assignTriangle1( i1 );

						triangle1.needsUpdate = true;

						if ( intersectsTriangles( triangle1, triangle2, i1, i2, depth1, index1, depth2, index2 ) ) {

							return true;

						}

					}

				}

				return false;

			};

			if ( intersectsRanges ) {

				const originalIntersectsRanges = intersectsRanges;
				intersectsRanges = function ( offset1, count1, offset2, count2, depth1, index1, depth2, index2 ) {

					if ( ! originalIntersectsRanges( offset1, count1, offset2, count2, depth1, index1, depth2, index2 ) ) {

						return iterateOverDoubleTriangles( offset1, count1, offset2, count2, depth1, index1, depth2, index2 );

					}

					return true;

				};

			} else {

				intersectsRanges = iterateOverDoubleTriangles;

			}

		}

		return bvhcast( this, otherBvh, matrixToLocal, intersectsRanges );

	}


	/* Derived Cast Functions */
	intersectsBox( box, boxToMesh ) {

		obb.set( box.min, box.max, boxToMesh );
		obb.needsUpdate = true;

		return this.shapecast(
			{
				intersectsBounds: box => obb.intersectsBox( box ),
				intersectsTriangle: tri => obb.intersectsTriangle( tri )
			}
		);

	}

	intersectsSphere( sphere ) {

		return this.shapecast(
			{
				intersectsBounds: box => sphere.intersectsBox( box ),
				intersectsTriangle: tri => tri.intersectsSphere( sphere )
			}
		);

	}

	closestPointToGeometry( otherGeometry, geometryToBvh, target1 = { }, target2 = { }, minThreshold = 0, maxThreshold = Infinity ) {

		const closestPointToGeometryFunc = this.indirect ? closestPointToGeometry_indirect : closestPointToGeometry;
		return closestPointToGeometryFunc(
			this,
			otherGeometry,
			geometryToBvh,
			target1,
			target2,
			minThreshold,
			maxThreshold,
		);

	}

	closestPointToPoint( point, target = { }, minThreshold = 0, maxThreshold = Infinity ) {

		return closestPointToPoint(
			this,
			point,
			target,
			minThreshold,
			maxThreshold,
		);

	}

	getBoundingBox( target ) {

		target.makeEmpty();

		const roots = this._roots;
		roots.forEach( buffer => {

			arrayToBox( 0, new Float32Array( buffer ), tempBox$1 );
			target.union( tempBox$1 );

		} );

		return target;

	}

}

const HASH_WIDTH = 1e-6;
const HASH_HALF_WIDTH = HASH_WIDTH * 0.5;
const HASH_MULTIPLIER = Math.pow( 10, - Math.log10( HASH_WIDTH ) );
const HASH_ADDITION = HASH_HALF_WIDTH * HASH_MULTIPLIER;
function hashNumber( v ) {

	return ~ ~ ( v * HASH_MULTIPLIER + HASH_ADDITION );

}

function hashVertex2( v ) {

	return `${ hashNumber( v.x ) },${ hashNumber( v.y ) }`;

}

function hashVertex3( v ) {

	return `${ hashNumber( v.x ) },${ hashNumber( v.y ) },${ hashNumber( v.z ) }`;

}

function hashVertex4( v ) {

	return `${ hashNumber( v.x ) },${ hashNumber( v.y ) },${ hashNumber( v.z ) },${ hashNumber( v.w ) }`;

}

function toNormalizedRay( v0, v1, target ) {

	// get a normalized direction
	target
		.direction
		.subVectors( v1, v0 )
		.normalize();

	// project the origin onto the perpendicular plane that
	// passes through 0, 0, 0
	const scalar = v0.dot( target.direction );
	target.
		origin
		.copy( v0 )
		.addScaledVector( target.direction, - scalar );

	return target;

}

function areSharedArrayBuffersSupported() {

	return typeof SharedArrayBuffer !== 'undefined';

}

function convertToSharedArrayBuffer( array ) {

	if ( array.buffer instanceof SharedArrayBuffer ) {

		return array;

	}

	const cons = array.constructor;
	const buffer = array.buffer;
	const sharedBuffer = new SharedArrayBuffer( buffer.byteLength );

	const uintArray = new Uint8Array( buffer );
	const sharedUintArray = new Uint8Array( sharedBuffer );
	sharedUintArray.set( uintArray, 0 );

	return new cons( sharedBuffer );

}

function getIndexArray( vertexCount, BufferConstructor = ArrayBuffer ) {

	if ( vertexCount > 65535 ) {

		return new Uint32Array( new BufferConstructor( 4 * vertexCount ) );

	} else {

		return new Uint16Array( new BufferConstructor( 2 * vertexCount ) );

	}

}

function ensureIndex( geo, options ) {

	if ( ! geo.index ) {

		const vertexCount = geo.attributes.position.count;
		const BufferConstructor = options.useSharedArrayBuffer ? SharedArrayBuffer : ArrayBuffer;
		const index = getIndexArray( vertexCount, BufferConstructor );
		geo.setIndex( new BufferAttribute( index, 1 ) );

		for ( let i = 0; i < vertexCount; i ++ ) {

			index[ i ] = i;

		}

	}

}

function getVertexCount( geo ) {

	return geo.index ? geo.index.count : geo.attributes.position.count;

}

function getTriCount( geo ) {

	return getVertexCount( geo ) / 3;

}

const DEGENERATE_EPSILON = 1e-8;
const _tempVec = new Vector3();

function toTriIndex( v ) {

	return ~ ~ ( v / 3 );

}

function toEdgeIndex( v ) {

	return v % 3;

}

function sortEdgeFunc( a, b ) {

	return a.start - b.start;

}

function getProjectedDistance( ray, vec ) {

	return _tempVec.subVectors( vec, ray.origin ).dot( ray.direction );

}

function matchEdges( forward, reverse, disjointConnectivityMap, eps = DEGENERATE_EPSILON ) {

	forward.sort( sortEdgeFunc );
	reverse.sort( sortEdgeFunc );

	for ( let i = 0; i < forward.length; i ++ ) {

		const e0 = forward[ i ];
		for ( let o = 0; o < reverse.length; o ++ ) {

			const e1 = reverse[ o ];
			if ( e1.start > e0.end ) ; else if ( e0.end < e1.start || e1.end < e0.start ) {

				// e1 is completely before e2
				continue;

			} else if ( e0.start <= e1.start && e0.end >= e1.end ) {

				// e1 is larger than and e2 is completely within e1
				if ( ! areDistancesDegenerate( e1.end, e0.end ) ) {

					forward.splice( i + 1, 0, {
						start: e1.end,
						end: e0.end,
						index: e0.index,
					} );

				}

				e0.end = e1.start;

				e1.start = 0;
				e1.end = 0;

			} else if ( e0.start >= e1.start && e0.end <= e1.end ) {

				// e2 is larger than and e1 is completely within e2
				if ( ! areDistancesDegenerate( e0.end, e1.end ) ) {

					reverse.splice( o + 1, 0, {
						start: e0.end,
						end: e1.end,
						index: e1.index,
					} );

				}

				e1.end = e0.start;

				e0.start = 0;
				e0.end = 0;

			} else if ( e0.start <= e1.start && e0.end <= e1.end ) {

				// e1 overlaps e2 at the beginning
				const tmp = e0.end;
				e0.end = e1.start;
				e1.start = tmp;

			} else if ( e0.start >= e1.start && e0.end >= e1.end ) {

				// e1 overlaps e2 at the end
				const tmp = e1.end;
				e1.end = e0.start;
				e0.start = tmp;

			} else {

				throw new Error();

			}

			// Add the connectivity information
			if ( ! disjointConnectivityMap.has( e0.index ) ) {

				disjointConnectivityMap.set( e0.index, [] );

			}

			if ( ! disjointConnectivityMap.has( e1.index ) ) {

				disjointConnectivityMap.set( e1.index, [] );

			}

			disjointConnectivityMap
				.get( e0.index )
				.push( e1.index );

			disjointConnectivityMap
				.get( e1.index )
				.push( e0.index );

			if ( isEdgeDegenerate( e1 ) ) {

				reverse.splice( o, 1 );
				o --;

			}

			if ( isEdgeDegenerate( e0 ) ) {

				// and if we have to remove the current original edge then exit this loop
				// so we can work on the next one
				forward.splice( i, 1 );
				i --;
				break;

			}

		}

	}

	cleanUpEdgeSet( forward );
	cleanUpEdgeSet( reverse );

	function cleanUpEdgeSet( arr ) {

		for ( let i = 0; i < arr.length; i ++ ) {

			if ( isEdgeDegenerate( arr[ i ] ) ) {

				arr.splice( i, 1 );
				i --;

			}

		}

	}

	function areDistancesDegenerate( start, end ) {

		return Math.abs( end - start ) < eps;

	}

	function isEdgeDegenerate( e ) {

		return Math.abs( e.end - e.start ) < eps;

	}

}

const DIST_EPSILON = 1e-5;
const ANGLE_EPSILON = 1e-4;

class RaySet {

	constructor() {

		this._rays = [];

	}

	addRay( ray ) {

		this._rays.push( ray );

	}

	findClosestRay( ray ) {

		const rays = this._rays;
		const inv = ray.clone();
		inv.direction.multiplyScalar( - 1 );

		let bestScore = Infinity;
		let bestRay = null;
		for ( let i = 0, l = rays.length; i < l; i ++ ) {

			const r = rays[ i ];
			if ( skipRay( r, ray ) && skipRay( r, inv ) ) {

				continue;

			}

			const rayScore = scoreRays( r, ray );
			const invScore = scoreRays( r, inv );
			const score = Math.min( rayScore, invScore );
			if ( score < bestScore ) {

				bestScore = score;
				bestRay = r;

			}

		}

		return bestRay;

		function skipRay( r0, r1 ) {

			const distOutOfThreshold = r0.origin.distanceTo( r1.origin ) > DIST_EPSILON;
			const angleOutOfThreshold = r0.direction.angleTo( r1.direction ) > ANGLE_EPSILON;
			return angleOutOfThreshold || distOutOfThreshold;

		}

		function scoreRays( r0, r1 ) {

			const originDistance = r0.origin.distanceTo( r1.origin );
			const angleDistance = r0.direction.angleTo( r1.direction );
			return originDistance / DIST_EPSILON + angleDistance / ANGLE_EPSILON;

		}

	}

}

const _v0 = new Vector3();
const _v1 = new Vector3();
const _ray$1 = new Ray();

function computeDisjointEdges(
	geometry,
	unmatchedSet,
	eps,
) {

	const attributes = geometry.attributes;
	const indexAttr = geometry.index;
	const posAttr = attributes.position;

	const disjointConnectivityMap = new Map();
	const fragmentMap = new Map();
	const edges = Array.from( unmatchedSet );
	const rays = new RaySet();

	for ( let i = 0, l = edges.length; i < l; i ++ ) {

		// get the triangle edge
		const index = edges[ i ];
		const triIndex = toTriIndex( index );
		const edgeIndex = toEdgeIndex( index );

		let i0 = 3 * triIndex + edgeIndex;
		let i1 = 3 * triIndex + ( edgeIndex + 1 ) % 3;
		if ( indexAttr ) {

			i0 = indexAttr.getX( i0 );
			i1 = indexAttr.getX( i1 );

		}

		_v0.fromBufferAttribute( posAttr, i0 );
		_v1.fromBufferAttribute( posAttr, i1 );

		// get the ray corresponding to the edge
		toNormalizedRay( _v0, _v1, _ray$1 );

		// find the shared ray with other edges
		let info;
		let commonRay = rays.findClosestRay( _ray$1 );
		if ( commonRay === null ) {

			commonRay = _ray$1.clone();
			rays.addRay( commonRay );

		}

		if ( ! fragmentMap.has( commonRay ) ) {

			fragmentMap.set( commonRay, {

				forward: [],
				reverse: [],
				ray: commonRay,

			} );

		}

		info = fragmentMap.get( commonRay );

		// store the stride of edge endpoints along the ray
		let start = getProjectedDistance( commonRay, _v0 );
		let end = getProjectedDistance( commonRay, _v1 );
		if ( start > end ) {

			[ start, end ] = [ end, start ];

		}

		if ( _ray$1.direction.dot( commonRay.direction ) < 0 ) {

			info.reverse.push( { start, end, index } );

		} else {

			info.forward.push( { start, end, index } );

		}

	}

	// match the found sibling edges
	fragmentMap.forEach( ( { forward, reverse }, ray ) => {

		matchEdges( forward, reverse, disjointConnectivityMap, eps );

		if ( forward.length === 0 && reverse.length === 0 ) {

			fragmentMap.delete( ray );

		}

	} );

	return {
		disjointConnectivityMap,
		fragmentMap,
	};

}

const _vec2 = new Vector2();
const _vec3$1 = new Vector3();
const _vec4 = new Vector4();
const _hashes = [ '', '', '' ];

class HalfEdgeMap {

	constructor( geometry = null ) {

		// result data
		this.data = null;
		this.disjointConnections = null;
		this.unmatchedDisjointEdges = null;
		this.unmatchedEdges = - 1;
		this.matchedEdges = - 1;

		// options
		this.useDrawRange = true;
		this.useAllAttributes = false;
		this.matchDisjointEdges = false;
		this.degenerateEpsilon = 1e-8;

		if ( geometry ) {

			this.updateFrom( geometry );

		}

	}

	getSiblingTriangleIndex( triIndex, edgeIndex ) {

		const otherIndex = this.data[ triIndex * 3 + edgeIndex ];
		return otherIndex === - 1 ? - 1 : ~ ~ ( otherIndex / 3 );

	}

	getSiblingEdgeIndex( triIndex, edgeIndex ) {

		const otherIndex = this.data[ triIndex * 3 + edgeIndex ];
		return otherIndex === - 1 ? - 1 : ( otherIndex % 3 );

	}

	getDisjointSiblingTriangleIndices( triIndex, edgeIndex ) {

		const index = triIndex * 3 + edgeIndex;
		const arr = this.disjointConnections.get( index );
		return arr ? arr.map( i => ~ ~ ( i / 3 ) ) : [];

	}

	getDisjointSiblingEdgeIndices( triIndex, edgeIndex ) {

		const index = triIndex * 3 + edgeIndex;
		const arr = this.disjointConnections.get( index );
		return arr ? arr.map( i => i % 3 ) : [];

	}

	isFullyConnected() {

		return this.unmatchedEdges === 0;

	}

	updateFrom( geometry ) {

		const { useAllAttributes, useDrawRange, matchDisjointEdges, degenerateEpsilon } = this;
		const hashFunction = useAllAttributes ? hashAllAttributes : hashPositionAttribute;

		// runs on the assumption that there is a 1 : 1 match of edges
		const map = new Map();

		// attributes
		const { attributes } = geometry;
		const attrKeys = useAllAttributes ? Object.keys( attributes ) : null;
		const indexAttr = geometry.index;
		const posAttr = attributes.position;

		// get the potential number of triangles
		let triCount = getTriCount( geometry );
		const maxTriCount = triCount;

		// get the real number of triangles from the based on the draw range
		let offset = 0;
		if ( useDrawRange ) {

			offset = geometry.drawRange.start;
			if ( geometry.drawRange.count !== Infinity ) {

				triCount = ~ ~ ( geometry.drawRange.count / 3 );

			}

		}

		// initialize the connectivity buffer - 1 means no connectivity
		let data = this.data;
		if ( ! data || data.length < 3 * maxTriCount ) {

			data = new Int32Array( 3 * maxTriCount );

		}

		data.fill( - 1 );

		// iterate over all triangles
		let matchedEdges = 0;
		let unmatchedSet = new Set();
		for ( let i = offset, l = triCount * 3 + offset; i < l; i += 3 ) {

			const i3 = i;
			for ( let e = 0; e < 3; e ++ ) {

				let i0 = i3 + e;
				if ( indexAttr ) {

					i0 = indexAttr.getX( i0 );

				}

				_hashes[ e ] = hashFunction( i0 );

			}

			for ( let e = 0; e < 3; e ++ ) {

				const nextE = ( e + 1 ) % 3;
				const vh0 = _hashes[ e ];
				const vh1 = _hashes[ nextE ];

				const reverseHash = `${ vh1 }_${ vh0 }`;
				if ( map.has( reverseHash ) ) {

					// create a reference between the two triangles and clear the hash
					const index = i3 + e;
					const otherIndex = map.get( reverseHash );
					data[ index ] = otherIndex;
					data[ otherIndex ] = index;
					map.delete( reverseHash );
					matchedEdges += 2;
					unmatchedSet.delete( otherIndex );

				} else {

					// save the triangle and triangle edge index captured in one value
					// triIndex = ~ ~ ( i0 / 3 );
					// edgeIndex = i0 % 3;
					const hash = `${ vh0 }_${ vh1 }`;
					const index = i3 + e;
					map.set( hash, index );
					unmatchedSet.add( index );

				}

			}

		}

		if ( matchDisjointEdges ) {

			const {
				fragmentMap,
				disjointConnectivityMap,
			} = computeDisjointEdges( geometry, unmatchedSet, degenerateEpsilon );

			unmatchedSet.clear();
			fragmentMap.forEach( ( { forward, reverse } ) => {

				forward.forEach( ( { index } ) => unmatchedSet.add( index ) );
				reverse.forEach( ( { index } ) => unmatchedSet.add( index ) );

			} );

			this.unmatchedDisjointEdges = fragmentMap;
			this.disjointConnections = disjointConnectivityMap;
			matchedEdges = triCount * 3 - unmatchedSet.size;

		}

		this.matchedEdges = matchedEdges;
		this.unmatchedEdges = unmatchedSet.size;
		this.data = data;

		function hashPositionAttribute( i ) {

			_vec3$1.fromBufferAttribute( posAttr, i );
			return hashVertex3( _vec3$1 );

		}

		function hashAllAttributes( i ) {

			let result = '';
			for ( let k = 0, l = attrKeys.length; k < l; k ++ ) {

				const attr = attributes[ attrKeys[ k ] ];
				let str;
				switch ( attr.itemSize ) {

					case 1:
						str = hashNumber( attr.getX( i ) );
						break;
					case 2:
						str = hashVertex2( _vec2.fromBufferAttribute( attr, i ) );
						break;
					case 3:
						str = hashVertex3( _vec3$1.fromBufferAttribute( attr, i ) );
						break;
					case 4:
						str = hashVertex4( _vec4.fromBufferAttribute( attr, i ) );
						break;

				}

				if ( result !== '' ) {

					result += '|';

				}

				result += str;

			}

			return result;

		}

	}

}

class Brush extends Mesh {

	constructor( ...args ) {

		super( ...args );

		this.isBrush = true;
		this._previousMatrix = new Matrix4();
		this._previousMatrix.elements.fill( 0 );

	}

	markUpdated() {

		this._previousMatrix.copy( this.matrix );

	}

	isDirty() {

		const { matrix, _previousMatrix } = this;
		const el1 = matrix.elements;
		const el2 = _previousMatrix.elements;
		for ( let i = 0; i < 16; i ++ ) {

			if ( el1[ i ] !== el2[ i ] ) {

				return true;

			}

		}

		return false;

	}

	prepareGeometry() {

		// generate shared array buffers
		const geometry = this.geometry;
		const attributes = geometry.attributes;
		const useSharedArrayBuffer = areSharedArrayBuffersSupported();
		if ( useSharedArrayBuffer ) {

			for ( const key in attributes ) {

				const attribute = attributes[ key ];
				if ( attribute.isInterleavedBufferAttribute ) {

					throw new Error( 'Brush: InterleavedBufferAttributes are not supported.' );

				}

				attribute.array = convertToSharedArrayBuffer( attribute.array );

			}

		}

		// generate bounds tree
		if ( ! geometry.boundsTree ) {

			ensureIndex( geometry, { useSharedArrayBuffer } );
			geometry.boundsTree = new MeshBVH( geometry, { maxLeafTris: 3, indirect: true, useSharedArrayBuffer } );

		}

		// generate half edges
		if ( ! geometry.halfEdges ) {

			geometry.halfEdges = new HalfEdgeMap( geometry );

		}

		// save group indices for materials
		if ( ! geometry.groupIndices ) {

			const triCount = getTriCount( geometry );
			const array = new Uint16Array( triCount );
			const groups = geometry.groups;
			for ( let i = 0, l = groups.length; i < l; i ++ ) {

				const { start, count } = groups[ i ];
				for ( let g = start / 3, lg = ( start + count ) / 3; g < lg; g ++ ) {

					array[ g ] = i;

				}

			}

			geometry.groupIndices = array;

		}

	}

	disposeCacheData() {

		const { geometry } = this;
		geometry.halfEdges = null;
		geometry.boundsTree = null;
		geometry.groupIndices = null;

	}

}

const EPSILON$1 = 1e-14;
const _AB = new Vector3();
const _AC = new Vector3();
const _CB = new Vector3();

function isTriDegenerate( tri, eps = EPSILON$1 ) {

	// compute angles to determine whether they're degenerate
	_AB.subVectors( tri.b, tri.a );
	_AC.subVectors( tri.c, tri.a );
	_CB.subVectors( tri.b, tri.c );

	const angle1 = _AB.angleTo( _AC );				// AB v AC
	const angle2 = _AB.angleTo( _CB );				// AB v BC
	const angle3 = Math.PI - angle1 - angle2;		// 180deg - angle1 - angle2

	return Math.abs( angle1 ) < eps ||
		Math.abs( angle2 ) < eps ||
		Math.abs( angle3 ) < eps ||
		tri.a.distanceToSquared( tri.b ) < eps ||
		tri.a.distanceToSquared( tri.c ) < eps ||
		tri.b.distanceToSquared( tri.c ) < eps;

}

// NOTE: these epsilons likely should all be the same since they're used to measure the
// distance from a point to a plane which needs to be done consistently
const EPSILON = 1e-10;
const COPLANAR_EPSILON = 1e-10;
const PARALLEL_EPSILON = 1e-10;
const _edge$1 = new Line3();
const _foundEdge = new Line3();
const _vec = new Vector3();
const _triangleNormal = new Vector3();
const _planeNormal = new Vector3();
const _plane = new Plane();
const _splittingTriangle = new ExtendedTriangle();

// A pool of triangles to avoid unnecessary triangle creation
class TrianglePool {

	constructor() {

		this._pool = [];
		this._index = 0;

	}

	getTriangle() {

		if ( this._index >= this._pool.length ) {

			this._pool.push( new Triangle() );

		}

		return this._pool[ this._index ++ ];

	}

	clear() {

		this._index = 0;

	}

	reset() {

		this._pool.length = 0;
		this._index = 0;

	}

}

// Utility class for splitting triangles
class TriangleSplitter {

	constructor() {

		this.trianglePool = new TrianglePool();
		this.triangles = [];
		this.normal = new Vector3();
		this.coplanarTriangleUsed = false;

	}

	// initialize the class with a triangle
	initialize( tri ) {

		this.reset();

		const { triangles, trianglePool, normal } = this;
		if ( Array.isArray( tri ) ) {

			for ( let i = 0, l = tri.length; i < l; i ++ ) {

				const t = tri[ i ];
				if ( i === 0 ) {

					t.getNormal( normal );

				} else if ( Math.abs( 1.0 - t.getNormal( _vec ).dot( normal ) ) > EPSILON ) {

					throw new Error( 'Triangle Splitter: Cannot initialize with triangles that have different normals.' );

				}

				const poolTri = trianglePool.getTriangle();
				poolTri.copy( t );
				triangles.push( poolTri );

			}

		} else {

			tri.getNormal( normal );

			const poolTri = trianglePool.getTriangle();
			poolTri.copy( tri );
			triangles.push( poolTri );

		}

	}

	// Split the current set of triangles by passing a single triangle in. If the triangle is
	// coplanar it will attempt to split by the triangle edge planes
	splitByTriangle( triangle ) {

		const { normal, triangles } = this;
		triangle.getNormal( _triangleNormal ).normalize();

		if ( Math.abs( 1.0 - Math.abs( _triangleNormal.dot( normal ) ) ) < PARALLEL_EPSILON ) {

			this.coplanarTriangleUsed = true;

			for ( let i = 0, l = triangles.length; i < l; i ++ ) {

				const t = triangles[ i ];
				t.coplanarCount = 0;

			}

			// if the triangle is coplanar then split by the edge planes
			const arr = [ triangle.a, triangle.b, triangle.c ];
			for ( let i = 0; i < 3; i ++ ) {

				const nexti = ( i + 1 ) % 3;

				const v0 = arr[ i ];
				const v1 = arr[ nexti ];

				// plane positive direction is toward triangle center
				_vec.subVectors( v1, v0 ).normalize();
				_planeNormal.crossVectors( _triangleNormal, _vec );
				_plane.setFromNormalAndCoplanarPoint( _planeNormal, v0 );

				this.splitByPlane( _plane, triangle );

			}

		} else {

			// otherwise split by the triangle plane
			triangle.getPlane( _plane );
			this.splitByPlane( _plane, triangle );

		}

	}

	// Split the triangles by the given plan. If a triangle is provided then we ensure we
	// intersect the triangle before splitting the plane
	splitByPlane( plane, clippingTriangle ) {

		const { triangles, trianglePool } = this;

		// init our triangle to check for intersection
		_splittingTriangle.copy( clippingTriangle );
		_splittingTriangle.needsUpdate = true;

		// try to split every triangle in the class
		for ( let i = 0, l = triangles.length; i < l; i ++ ) {

			const tri = triangles[ i ];

			// skip the triangle if we don't intersect with it
			if ( ! _splittingTriangle.intersectsTriangle( tri, _edge$1, true ) ) {

				continue;

			}

			const { a, b, c } = tri;
			let intersects = 0;
			let vertexSplitEnd = - 1;
			let coplanarEdge = false;
			let posSideVerts = [];
			let negSideVerts = [];
			const arr = [ a, b, c ];
			for ( let t = 0; t < 3; t ++ ) {

				// get the triangle edge
				const tNext = ( t + 1 ) % 3;
				_edge$1.start.copy( arr[ t ] );
				_edge$1.end.copy( arr[ tNext ] );

				// track if the start point sits on the plane or if it's on the positive side of it
				// so we can use that information to determine whether to split later.
				const startDist = plane.distanceToPoint( _edge$1.start );
				const endDist = plane.distanceToPoint( _edge$1.end );
				if ( Math.abs( startDist ) < COPLANAR_EPSILON && Math.abs( endDist ) < COPLANAR_EPSILON ) {

					coplanarEdge = true;
					break;

				}

				if ( startDist > 0 ) {

					posSideVerts.push( t );

				} else {

					negSideVerts.push( t );

				}

				// we only don't consider this an intersection if the start points hits the plane
				if ( Math.abs( startDist ) < COPLANAR_EPSILON ) {

					continue;

				}

				// double check the end point since the "intersectLine" function sometimes does not
				// return it as an intersection (see issue #28)
				// Because we ignore the start point intersection above we have to make sure we check the end
				// point intersection here.
				let didIntersect = ! ! plane.intersectLine( _edge$1, _vec );
				if ( ! didIntersect && Math.abs( endDist ) < COPLANAR_EPSILON ) {

					_vec.copy( _edge$1.end );
					didIntersect = true;

				}

				// check if we intersect the plane (ignoring the start point so we don't double count)
				if ( didIntersect && ! ( _vec.distanceTo( _edge$1.start ) < EPSILON ) ) {

					// if we intersect at the end point then we track that point as one that we
					// have to split down the middle
					if ( _vec.distanceTo( _edge$1.end ) < EPSILON ) {

						vertexSplitEnd = t;

					}

					// track the split edge
					if ( intersects === 0 ) {

						_foundEdge.start.copy( _vec );

					} else {

						_foundEdge.end.copy( _vec );

					}

					intersects ++;

				}

			}

			// skip splitting if:
			// - we have two points on the plane then the plane intersects the triangle exactly on an edge
			// - the plane does not intersect on 2 points
			// - the intersection edge is too small
			// - we're not along a coplanar edge
			if ( ! coplanarEdge && intersects === 2 && _foundEdge.distance() > COPLANAR_EPSILON ) {

				if ( vertexSplitEnd !== - 1 ) {

					vertexSplitEnd = ( vertexSplitEnd + 1 ) % 3;

					// we're splitting along a vertex
					let otherVert1 = 0;
					if ( otherVert1 === vertexSplitEnd ) {

						otherVert1 = ( otherVert1 + 1 ) % 3;

					}

					let otherVert2 = otherVert1 + 1;
					if ( otherVert2 === vertexSplitEnd ) {

						otherVert2 = ( otherVert2 + 1 ) % 3;

					}

					const nextTri = trianglePool.getTriangle();
					nextTri.a.copy( arr[ otherVert2 ] );
					nextTri.b.copy( _foundEdge.end );
					nextTri.c.copy( _foundEdge.start );

					if ( ! isTriDegenerate( nextTri ) ) {

						triangles.push( nextTri );

					}

					tri.a.copy( arr[ otherVert1 ] );
					tri.b.copy( _foundEdge.start );
					tri.c.copy( _foundEdge.end );

					// finish off the adjusted triangle
					if ( isTriDegenerate( tri ) ) {

						triangles.splice( i, 1 );
						i --;
						l --;

					}

				} else {

					// we're splitting with a quad and a triangle
					// TODO: what happens when we find that about the pos and negative
					// sides have only a single vertex?
					const singleVert =
						posSideVerts.length >= 2 ?
							negSideVerts[ 0 ] :
							posSideVerts[ 0 ];

					// swap the direction of the intersection edge depending on which
					// side of the plane the single vertex is on to align with the
					// correct winding order.
					if ( singleVert === 0 ) {

						let tmp = _foundEdge.start;
						_foundEdge.start = _foundEdge.end;
						_foundEdge.end = tmp;

					}

					const nextVert1 = ( singleVert + 1 ) % 3;
					const nextVert2 = ( singleVert + 2 ) % 3;

					const nextTri1 = trianglePool.getTriangle();
					const nextTri2 = trianglePool.getTriangle();

					// choose the triangle that has the larger areas (shortest split distance)
					if ( arr[ nextVert1 ].distanceToSquared( _foundEdge.start ) < arr[ nextVert2 ].distanceToSquared( _foundEdge.end ) ) {

						nextTri1.a.copy( arr[ nextVert1 ] );
						nextTri1.b.copy( _foundEdge.start );
						nextTri1.c.copy( _foundEdge.end );

						nextTri2.a.copy( arr[ nextVert1 ] );
						nextTri2.b.copy( arr[ nextVert2 ] );
						nextTri2.c.copy( _foundEdge.start );

					} else {

						nextTri1.a.copy( arr[ nextVert2 ] );
						nextTri1.b.copy( _foundEdge.start );
						nextTri1.c.copy( _foundEdge.end );

						nextTri2.a.copy( arr[ nextVert1 ] );
						nextTri2.b.copy( arr[ nextVert2 ] );
						nextTri2.c.copy( _foundEdge.end );

					}

					tri.a.copy( arr[ singleVert ] );
					tri.b.copy( _foundEdge.end );
					tri.c.copy( _foundEdge.start );

					// don't add degenerate triangles to the list
					if ( ! isTriDegenerate( nextTri1 ) ) {

						triangles.push( nextTri1 );

					}

					if ( ! isTriDegenerate( nextTri2 ) ) {

						triangles.push( nextTri2 );

					}

					// finish off the adjusted triangle
					if ( isTriDegenerate( tri ) ) {

						triangles.splice( i, 1 );
						i --;
						l --;

					}

				}

			} else if ( intersects === 3 ) {

				console.warn( 'TriangleClipper: Coplanar clip not handled' );

			}

		}

	}

	reset() {

		this.triangles.length = 0;
		this.trianglePool.clear();
		this.coplanarTriangleUsed = false;

	}

}

function ceilToFourByteStride( byteLength ) {

	byteLength = ~ ~ byteLength;
	return byteLength + 4 - byteLength % 4;

}

// Make a new array wrapper class that more easily affords expansion when reaching it's max capacity
class TypeBackedArray {

	constructor( type, initialSize = 500 ) {


		this.expansionFactor = 1.5;
		this.type = type;
		this.length = 0;
		this.array = null;

		this.setSize( initialSize );

	}

	setType( type ) {

		if ( this.length !== 0 ) {

			throw new Error( 'TypeBackedArray: Cannot change the type while there is used data in the buffer.' );

		}

		const buffer = this.array.buffer;
		this.array = new type( buffer );
		this.type = type;

	}

	setSize( size ) {

		if ( this.array && size === this.array.length ) {

			return;

		}

		// ceil to the nearest 4 bytes so we can replace the array with any type using the same buffer
		const type = this.type;
		const bufferType = areSharedArrayBuffersSupported() ? SharedArrayBuffer : ArrayBuffer;
		const newArray = new type( new bufferType( ceilToFourByteStride( size * type.BYTES_PER_ELEMENT ) ) );
		if ( this.array ) {

			newArray.set( this.array, 0 );

		}

		this.array = newArray;

	}

	expand() {

		const { array, expansionFactor } = this;
		this.setSize( array.length * expansionFactor );

	}

	push( ...args ) {

		let { array, length } = this;
		if ( length + args.length > array.length ) {

			this.expand();
			array = this.array;

		}

		for ( let i = 0, l = args.length; i < l; i ++ ) {

			array[ length + i ] = args[ i ];

		}

		this.length += args.length;

	}

	clear() {

		this.length = 0;

	}

}

// Utility class for for tracking attribute data in type-backed arrays for a set
// of groups. The set of attributes is kept for each group and are expected to be the
// same buffer type.
class TypedAttributeData {

	constructor() {

		this.groupAttributes = [ {} ];
		this.groupCount = 0;

	}

	// returns the buffer type for the given attribute
	getType( name ) {

		return this.groupAttributes[ 0 ][ name ].type;

	}

	getItemSize( name ) {

		return this.groupAttributes[ 0 ][ name ].itemSize;

	}

	getNormalized( name ) {

		return this.groupAttributes[ 0 ][ name ].normalized;

	}

	getCount( index ) {

		if ( this.groupCount <= index ) {

			return 0;

		}

		const pos = this.getGroupAttrArray( 'position', index );
		return pos.length / pos.itemSize;

	}

	// returns the total length required for all groups for the given attribute
	getTotalLength( name ) {

		const { groupCount, groupAttributes } = this;

		let length = 0;
		for ( let i = 0; i < groupCount; i ++ ) {

			const attrSet = groupAttributes[ i ];
			length += attrSet[ name ].length;

		}

		return length;

	}

	getGroupAttrSet( index = 0 ) {

		// TODO: can this be abstracted?
		// Return the exiting group set if necessary
		const { groupAttributes } = this;
		if ( groupAttributes[ index ] ) {

			this.groupCount = Math.max( this.groupCount, index + 1 );
			return groupAttributes[ index ];

		}

		// add any new group sets required
		const refAttrSet = groupAttributes[ 0 ];
		this.groupCount = Math.max( this.groupCount, index + 1 );
		while ( index >= groupAttributes.length ) {

			const newAttrSet = {};
			groupAttributes.push( newAttrSet );
			for ( const key in refAttrSet ) {

				const refAttr = refAttrSet[ key ];
				const newAttr = new TypeBackedArray( refAttr.type );
				newAttr.itemSize = refAttr.itemSize;
				newAttr.normalized = refAttr.normalized;
				newAttrSet[ key ] = newAttr;

			}

		}

		return groupAttributes[ index ];

	}

	// Get the raw array for the group set of data
	getGroupAttrArray( name, index = 0 ) {

		// throw an error if we've never
		const { groupAttributes } = this;
		const referenceAttrSet = groupAttributes[ 0 ];
		const referenceAttr = referenceAttrSet[ name ];
		if ( ! referenceAttr ) {

			throw new Error( `TypedAttributeData: Attribute with "${ name }" has not been initialized` );

		}

		return this.getGroupAttrSet( index )[ name ];

	}

	// initializes an attribute array with the given name, type, and size
	initializeArray( name, type, itemSize, normalized ) {

		const { groupAttributes } = this;
		const referenceAttrSet = groupAttributes[ 0 ];
		const referenceAttr = referenceAttrSet[ name ];
		if ( referenceAttr ) {

			if ( referenceAttr.type !== type ) {

				for ( let i = 0, l = groupAttributes.length; i < l; i ++ ) {

					const arr = groupAttributes[ i ][ name ];
					arr.setType( type );
					arr.itemSize = itemSize;
					arr.normalized = normalized;

				}

			}

		} else {

			for ( let i = 0, l = groupAttributes.length; i < l; i ++ ) {

				const arr = new TypeBackedArray( type );
				arr.itemSize = itemSize;
				arr.normalized = normalized;
				groupAttributes[ i ][ name ] = arr;

			}

		}

	}

	// Clear all the data
	clear() {

		this.groupCount = 0;

		const { groupAttributes } = this;
		groupAttributes.forEach( attrSet => {

			for ( const key in attrSet ) {

				attrSet[ key ].clear();

			}


		} );

	}

	// Remove the given key
	delete( key ) {

		this.groupAttributes.forEach( attrSet => {

			delete attrSet[ key ];

		} );

	}

	// Reset the datasets completely
	reset() {

		this.groupAttributes = [];
		this.groupCount = 0;

	}

}

class IntersectionMap {

	constructor() {

		this.intersectionSet = {};
		this.ids = [];

	}

	add( id, intersectionId ) {

		const { intersectionSet, ids } = this;
		if ( ! intersectionSet[ id ] ) {

			intersectionSet[ id ] = [];
			ids.push( id );

		}

		intersectionSet[ id ].push( intersectionId );

	}

}

const ADDITION = 0;
const SUBTRACTION = 1;
const REVERSE_SUBTRACTION = 2;
const INTERSECTION = 3;
const DIFFERENCE = 4;

// guaranteed non manifold results
const HOLLOW_SUBTRACTION = 5;
const HOLLOW_INTERSECTION = 6;

const _ray = new Ray();
const _matrix$1 = new Matrix4();
const _tri$1 = new Triangle();
const _vec3 = new Vector3();
const _vec4a = new Vector4();
const _vec4b = new Vector4();
const _vec4c = new Vector4();
const _vec4_0 = new Vector4();
const _vec4_1 = new Vector4();
const _vec4_2 = new Vector4();
const _edge = new Line3();
const _normal = new Vector3();
const JITTER_EPSILON = 1e-8;
const OFFSET_EPSILON = 1e-15;

const BACK_SIDE = - 1;
const FRONT_SIDE = 1;
const COPLANAR_OPPOSITE = - 2;
const COPLANAR_ALIGNED = 2;

const INVERT_TRI = 0;
const ADD_TRI = 1;
const SKIP_TRI = 2;

const FLOATING_COPLANAR_EPSILON = 1e-14;

let _debugContext = null;
function setDebugContext( debugData ) {

	_debugContext = debugData;

}

function getHitSide( tri, bvh ) {

	tri.getMidpoint( _ray.origin );
	tri.getNormal( _ray.direction );

	const hit = bvh.raycastFirst( _ray, DoubleSide );
	const hitBackSide = Boolean( hit && _ray.direction.dot( hit.face.normal ) > 0 );
	return hitBackSide ? BACK_SIDE : FRONT_SIDE;

}

function getHitSideWithCoplanarCheck( tri, bvh ) {

	// random function that returns [ - 0.5, 0.5 ];
	function rand() {

		return Math.random() - 0.5;

	}

	// get the ray the check the triangle for
	tri.getNormal( _normal );
	_ray.direction.copy( _normal );
	tri.getMidpoint( _ray.origin );

	const total = 3;
	let count = 0;
	let minDistance = Infinity;
	for ( let i = 0; i < total; i ++ ) {

		// jitter the ray slightly
		_ray.direction.x += rand() * JITTER_EPSILON;
		_ray.direction.y += rand() * JITTER_EPSILON;
		_ray.direction.z += rand() * JITTER_EPSILON;

		// and invert it so we can account for floating point error by checking both directions
		// to catch coplanar distances
		_ray.direction.multiplyScalar( - 1 );

		// check if the ray hit the backside
		const hit = bvh.raycastFirst( _ray, DoubleSide );
		let hitBackSide = Boolean( hit && _ray.direction.dot( hit.face.normal ) > 0 );
		if ( hitBackSide ) {

			count ++;

		}

		if ( hit !== null ) {

			minDistance = Math.min( minDistance, hit.distance );

		}

		// if we're right up against another face then we're coplanar
		if ( minDistance <= OFFSET_EPSILON ) {

			return hit.face.normal.dot( _normal ) > 0 ? COPLANAR_ALIGNED : COPLANAR_OPPOSITE;

		}

		// if our current casts meet our requirements then early out
		if ( count / total > 0.5 || ( i - count + 1 ) / total > 0.5 ) {

			break;

		}

	}

	return count / total > 0.5 ? BACK_SIDE : FRONT_SIDE;

}

// returns the intersected triangles and returns objects mapping triangle indices to
// the other triangles intersected
function collectIntersectingTriangles( a, b ) {

	const aIntersections = new IntersectionMap();
	const bIntersections = new IntersectionMap();

	_matrix$1
		.copy( a.matrixWorld )
		.invert()
		.multiply( b.matrixWorld );

	a.geometry.boundsTree.bvhcast( b.geometry.boundsTree, _matrix$1, {

		intersectsTriangles( triangleA, triangleB, ia, ib ) {

			if ( ! isTriDegenerate( triangleA ) && ! isTriDegenerate( triangleB ) ) {

				// due to floating point error it's possible that we can have two overlapping, coplanar triangles
				// that are a _tiny_ fraction of a value away from each other. If we find that case then check the
				// distance between triangles and if it's small enough consider them intersecting.
				let intersected = triangleA.intersectsTriangle( triangleB, _edge, true );
				if ( ! intersected ) {

					const pa = triangleA.plane;
					const pb = triangleB.plane;
					const na = pa.normal;
					const nb = pb.normal;

					if ( na.dot( nb ) === 1 && Math.abs( pa.constant - pb.constant ) < FLOATING_COPLANAR_EPSILON ) {

						intersected = true;

					}

				}

				if ( intersected ) {

					let va = a.geometry.boundsTree.resolveTriangleIndex( ia );
					let vb = b.geometry.boundsTree.resolveTriangleIndex( ib );
					aIntersections.add( va, vb );
					bIntersections.add( vb, va );

					if ( _debugContext ) {

						_debugContext.addEdge( _edge );
						_debugContext.addIntersectingTriangles( ia, triangleA, ib, triangleB );

					}

				}

			}

			return false;

		}

	} );

	return { aIntersections, bIntersections };

}

// Add the barycentric interpolated values fro the triangle into the new attribute data
function appendAttributeFromTriangle(
	triIndex,
	baryCoordTri,
	geometry,
	matrixWorld,
	normalMatrix,
	attributeData,
	invert = false,
) {

	const attributes = geometry.attributes;
	const indexAttr = geometry.index;
	const i3 = triIndex * 3;
	const i0 = indexAttr.getX( i3 + 0 );
	const i1 = indexAttr.getX( i3 + 1 );
	const i2 = indexAttr.getX( i3 + 2 );

	for ( const key in attributeData ) {

		// check if the key we're asking for is in the geometry at all
		const attr = attributes[ key ];
		const arr = attributeData[ key ];
		if ( ! ( key in attributes ) ) {

			throw new Error( `CSG Operations: Attribute ${ key } not available on geometry.` );

		}

		// handle normals and positions specially because they require transforming
		// TODO: handle tangents
		const itemSize = attr.itemSize;
		if ( key === 'position' ) {

			_tri$1.a.fromBufferAttribute( attr, i0 ).applyMatrix4( matrixWorld );
			_tri$1.b.fromBufferAttribute( attr, i1 ).applyMatrix4( matrixWorld );
			_tri$1.c.fromBufferAttribute( attr, i2 ).applyMatrix4( matrixWorld );

			pushBarycoordInterpolatedValues( _tri$1.a, _tri$1.b, _tri$1.c, baryCoordTri, 3, arr, invert );

		} else if ( key === 'normal' ) {

			_tri$1.a.fromBufferAttribute( attr, i0 ).applyNormalMatrix( normalMatrix );
			_tri$1.b.fromBufferAttribute( attr, i1 ).applyNormalMatrix( normalMatrix );
			_tri$1.c.fromBufferAttribute( attr, i2 ).applyNormalMatrix( normalMatrix );

			if ( invert ) {

				_tri$1.a.multiplyScalar( - 1 );
				_tri$1.b.multiplyScalar( - 1 );
				_tri$1.c.multiplyScalar( - 1 );

			}

			pushBarycoordInterpolatedValues( _tri$1.a, _tri$1.b, _tri$1.c, baryCoordTri, 3, arr, invert, true );

		} else {

			_vec4a.fromBufferAttribute( attr, i0 );
			_vec4b.fromBufferAttribute( attr, i1 );
			_vec4c.fromBufferAttribute( attr, i2 );

			pushBarycoordInterpolatedValues( _vec4a, _vec4b, _vec4c, baryCoordTri, itemSize, arr, invert );

		}

	}

}

// Append all the values of the attributes for the triangle onto the new attribute arrays
function appendAttributesFromIndices(
	i0,
	i1,
	i2,
	attributes,
	matrixWorld,
	normalMatrix,
	attributeData,
	invert = false,
) {

	appendAttributeFromIndex( i0, attributes, matrixWorld, normalMatrix, attributeData, invert );
	appendAttributeFromIndex( invert ? i2 : i1, attributes, matrixWorld, normalMatrix, attributeData, invert );
	appendAttributeFromIndex( invert ? i1 : i2, attributes, matrixWorld, normalMatrix, attributeData, invert );

}

// Returns the triangle to add when performing an operation
function getOperationAction( operation, hitSide, invert = false ) {

	switch ( operation ) {

		case ADDITION:

			if ( hitSide === FRONT_SIDE || ( hitSide === COPLANAR_ALIGNED && ! invert ) ) {

				return ADD_TRI;

			}

			break;
		case SUBTRACTION:

			if ( invert ) {

				if ( hitSide === BACK_SIDE ) {

					return INVERT_TRI;

				}

			} else {

				if ( hitSide === FRONT_SIDE || hitSide === COPLANAR_OPPOSITE ) {

					return ADD_TRI;

				}

			}

			break;
		case REVERSE_SUBTRACTION:

			if ( invert ) {

				if ( hitSide === FRONT_SIDE || hitSide === COPLANAR_OPPOSITE ) {

					return ADD_TRI;

				}

			} else {

				if ( hitSide === BACK_SIDE ) {

					return INVERT_TRI;

				}

			}

			break;
		case DIFFERENCE:

			if ( hitSide === BACK_SIDE ) {

				return INVERT_TRI;

			} else if ( hitSide === FRONT_SIDE ) {

				return ADD_TRI;

			}

			break;
		case INTERSECTION:
			if ( hitSide === BACK_SIDE || ( hitSide === COPLANAR_ALIGNED && ! invert ) ) {

				return ADD_TRI;

			}

			break;

		case HOLLOW_SUBTRACTION:
			if ( ! invert && ( hitSide === FRONT_SIDE || hitSide === COPLANAR_OPPOSITE ) ) {

				return ADD_TRI;

			}

			break;
		case HOLLOW_INTERSECTION:
			if ( ! invert && ( hitSide === BACK_SIDE || hitSide === COPLANAR_ALIGNED ) ) {

				return ADD_TRI;

			}

			break;
		default:
			throw new Error( `Unrecognized CSG operation enum "${ operation }".` );

	}

	return SKIP_TRI;

}

// takes a set of barycentric values in the form of a triangle, a set of vectors, number of components,
// and whether to invert the result and pushes the new values onto the provided attribute array
function pushBarycoordInterpolatedValues( v0, v1, v2, baryCoordTri, itemSize, attrArr, invert = false, normalize = false ) {

	// adds the appropriate number of values for the vector onto the array
	const addValues = v => {

		attrArr.push( v.x );
		if ( itemSize > 1 ) attrArr.push( v.y );
		if ( itemSize > 2 ) attrArr.push( v.z );
		if ( itemSize > 3 ) attrArr.push( v.w );

	};

	// barycentric interpolate the first component
	_vec4_0.set( 0, 0, 0, 0 )
		.addScaledVector( v0, baryCoordTri.a.x )
		.addScaledVector( v1, baryCoordTri.a.y )
		.addScaledVector( v2, baryCoordTri.a.z );

	_vec4_1.set( 0, 0, 0, 0 )
		.addScaledVector( v0, baryCoordTri.b.x )
		.addScaledVector( v1, baryCoordTri.b.y )
		.addScaledVector( v2, baryCoordTri.b.z );

	_vec4_2.set( 0, 0, 0, 0 )
		.addScaledVector( v0, baryCoordTri.c.x )
		.addScaledVector( v1, baryCoordTri.c.y )
		.addScaledVector( v2, baryCoordTri.c.z );

	if ( normalize ) {

		_vec4_0.normalize();
		_vec4_1.normalize();
		_vec4_2.normalize();

	}

	// if the face is inverted then add the values in an inverted order
	addValues( _vec4_0 );

	if ( invert ) {

		addValues( _vec4_2 );
		addValues( _vec4_1 );

	} else {

		addValues( _vec4_1 );
		addValues( _vec4_2 );

	}

}

// Adds the values for the given vertex index onto the new attribute arrays
function appendAttributeFromIndex(
	index,
	attributes,
	matrixWorld,
	normalMatrix,
	attributeData,
	invert = false,
) {

	for ( const key in attributeData ) {

		// check if the key we're asking for is in the geometry at all
		const attr = attributes[ key ];
		const arr = attributeData[ key ];
		if ( ! ( key in attributes ) ) {

			throw new Error( `CSG Operations: Attribute ${ key } no available on geometry.` );

		}

		// specially handle the position and normal attributes because they require transforms
		// TODO: handle tangents
		const itemSize = attr.itemSize;
		if ( key === 'position' ) {

			_vec3.fromBufferAttribute( attr, index ).applyMatrix4( matrixWorld );
			arr.push( _vec3.x, _vec3.y, _vec3.z );

		} else if ( key === 'normal' ) {

			_vec3.fromBufferAttribute( attr, index ).applyNormalMatrix( normalMatrix );
			if ( invert ) {

				_vec3.multiplyScalar( - 1 );

			}

			arr.push( _vec3.x, _vec3.y, _vec3.z );

		} else {

			arr.push( attr.getX( index ) );
			if ( itemSize > 1 ) arr.push( attr.getY( index ) );
			if ( itemSize > 2 ) arr.push( attr.getZ( index ) );
			if ( itemSize > 3 ) arr.push( attr.getW( index ) );

		}

	}

}

class TriangleIntersectData {

	constructor( tri ) {

		this.triangle = new Triangle().copy( tri );
		this.intersects = {};

	}

	addTriangle( index, tri ) {

		this.intersects[ index ] = new Triangle().copy( tri );

	}

	getIntersectArray() {

		const array = [];
		const { intersects } = this;
		for ( const key in intersects ) {

			array.push( intersects[ key ] );

		}

		return array;

	}

}

class TriangleIntersectionSets {

	constructor() {

		this.data = {};

	}

	addTriangleIntersection( ia, triA, ib, triB ) {

		const { data } = this;
		if ( ! data[ ia ] ) {

			data[ ia ] = new TriangleIntersectData( triA );

		}

		data[ ia ].addTriangle( ib, triB );

	}

	getTrianglesAsArray( id = null ) {

		const { data } = this;
		const arr = [];

		if ( id !== null ) {

			if ( id in data ) {

				arr.push( data[ id ].triangle );

			}

		} else {

			for ( const key in data ) {

				arr.push( data[ key ].triangle );

			}

		}

		return arr;

	}

	getTriangleIndices() {

		return Object.keys( this.data ).map( i => parseInt( i ) );

	}

	getIntersectionIndices( id ) {

		const { data } = this;
		if ( ! data[ id ] ) {

			return [];

		} else {

			return Object.keys( data[ id ].intersects ).map( i => parseInt( i ) );


		}

	}

	getIntersectionsAsArray( id = null, id2 = null ) {

		const { data } = this;
		const triSet = new Set();
		const arr = [];

		const addTriangles = key => {

			if ( ! data[ key ] ) return;

			if ( id2 !== null ) {

				if ( data[ key ].intersects[ id2 ] ) {

					arr.push( data[ key ].intersects[ id2 ] );

				}

			} else {

				const intersects = data[ key ].intersects;
				for ( const key2 in intersects ) {

					if ( ! triSet.has( key2 ) ) {

						triSet.add( key2 );
						arr.push( intersects[ key2 ] );

					}

				}

			}

		};

		if ( id !== null ) {

			addTriangles( id );

		} else {

			for ( const key in data ) {

				addTriangles( key );

			}

		}

		return arr;

	}

	reset() {

		this.data = {};

	}

}

class OperationDebugData {

	constructor() {

		this.enabled = false;
		this.triangleIntersectsA = new TriangleIntersectionSets();
		this.triangleIntersectsB = new TriangleIntersectionSets();
		this.intersectionEdges = [];

	}

	addIntersectingTriangles( ia, triA, ib, triB ) {

		const { triangleIntersectsA, triangleIntersectsB } = this;
		triangleIntersectsA.addTriangleIntersection( ia, triA, ib, triB );
		triangleIntersectsB.addTriangleIntersection( ib, triB, ia, triA );

	}

	addEdge( edge ) {

		this.intersectionEdges.push( edge.clone() );

	}

	reset() {

		this.triangleIntersectsA.reset();
		this.triangleIntersectsB.reset();
		this.intersectionEdges = [];

	}

	init() {

		if ( this.enabled ) {

			this.reset();
			setDebugContext( this );

		}

	}

	complete() {

		if ( this.enabled ) {

			setDebugContext( null );

		}

	}

}

const _matrix = new Matrix4();
const _normalMatrix = new Matrix3();
const _triA = new Triangle();
const _triB = new Triangle();
const _tri = new Triangle();
const _barycoordTri = new Triangle();
const _attr = [];
const _actions = [];

function getFirstIdFromSet( set ) {

	for ( const id of set ) return id;

}

// runs the given operation against a and b using the splitter and appending data to the
// attributeData object.
function performOperation(
	a,
	b,
	operations,
	splitter,
	attributeData,
	options = {},
) {

	const { useGroups = true } = options;
	const { aIntersections, bIntersections } = collectIntersectingTriangles( a, b );

	const resultGroups = [];
	let resultMaterials = null;

	let groupOffset;
	groupOffset = useGroups ? 0 : - 1;
	performSplitTriangleOperations( a, b, aIntersections, operations, false, splitter, attributeData, groupOffset );
	performWholeTriangleOperations( a, b, aIntersections, operations, false, attributeData, groupOffset );

	// find whether the set of operations contains a non-hollow operations. If it does then we need
	// to perform the second set of triangle additions
	const nonHollow = operations
		.findIndex( op => op !== HOLLOW_INTERSECTION && op !== HOLLOW_SUBTRACTION ) !== - 1;

	if ( nonHollow ) {

		groupOffset = useGroups ? a.geometry.groups.length || 1 : - 1;
		performSplitTriangleOperations( b, a, bIntersections, operations, true, splitter, attributeData, groupOffset );
		performWholeTriangleOperations( b, a, bIntersections, operations, true, attributeData, groupOffset );

	}

	_attr.length = 0;
	_actions.length = 0;

	return {
		groups: resultGroups,
		materials: resultMaterials
	};

}

// perform triangle splitting and CSG operations on the set of split triangles
function performSplitTriangleOperations(
	a,
	b,
	intersectionMap,
	operations,
	invert,
	splitter,
	attributeData,
	groupOffset = 0,
) {

	const invertedGeometry = a.matrixWorld.determinant() < 0;

	// transforms into the local frame of matrix b
	_matrix
		.copy( b.matrixWorld )
		.invert()
		.multiply( a.matrixWorld );

	_normalMatrix
		.getNormalMatrix( a.matrixWorld )
		.multiplyScalar( invertedGeometry ? - 1 : 1 );

	const groupIndices = a.geometry.groupIndices;
	const aIndex = a.geometry.index;
	const aPosition = a.geometry.attributes.position;

	const bBVH = b.geometry.boundsTree;
	const bIndex = b.geometry.index;
	const bPosition = b.geometry.attributes.position;
	const splitIds = intersectionMap.ids;
	const intersectionSet = intersectionMap.intersectionSet;

	// iterate over all split triangle indices
	for ( let i = 0, l = splitIds.length; i < l; i ++ ) {

		const ia = splitIds[ i ];
		const groupIndex = groupOffset === - 1 ? 0 : groupIndices[ ia ] + groupOffset;

		// get the triangle in the geometry B local frame
		const ia3 = 3 * ia;
		const ia0 = aIndex.getX( ia3 + 0 );
		const ia1 = aIndex.getX( ia3 + 1 );
		const ia2 = aIndex.getX( ia3 + 2 );
		_triA.a.fromBufferAttribute( aPosition, ia0 ).applyMatrix4( _matrix );
		_triA.b.fromBufferAttribute( aPosition, ia1 ).applyMatrix4( _matrix );
		_triA.c.fromBufferAttribute( aPosition, ia2 ).applyMatrix4( _matrix );

		// initialize the splitter with the triangle from geometry A
		splitter.reset();
		splitter.initialize( _triA );

		// split the triangle with the intersecting triangles from B
		const intersectingIndices = intersectionSet[ ia ];
		for ( let ib = 0, l = intersectingIndices.length; ib < l; ib ++ ) {

			const ib3 = 3 * intersectingIndices[ ib ];
			const ib0 = bIndex.getX( ib3 + 0 );
			const ib1 = bIndex.getX( ib3 + 1 );
			const ib2 = bIndex.getX( ib3 + 2 );
			_triB.a.fromBufferAttribute( bPosition, ib0 );
			_triB.b.fromBufferAttribute( bPosition, ib1 );
			_triB.c.fromBufferAttribute( bPosition, ib2 );
			splitter.splitByTriangle( _triB );

		}

		// for all triangles in the split result
		const triangles = splitter.triangles;
		for ( let ib = 0, l = triangles.length; ib < l; ib ++ ) {

			// get the barycentric coordinates of the clipped triangle to add
			const clippedTri = triangles[ ib ];

			// try to use the side derived from the clipping but if it turns out to be
			// uncertain then fall back to the raycasting approach
			const hitSide = splitter.coplanarTriangleUsed ?
				getHitSideWithCoplanarCheck( clippedTri, bBVH ) :
				getHitSide( clippedTri, bBVH );

			_attr.length = 0;
			_actions.length = 0;
			for ( let o = 0, lo = operations.length; o < lo; o ++ ) {

				const op = getOperationAction( operations[ o ], hitSide, invert );
				if ( op !== SKIP_TRI ) {

					_actions.push( op );
					_attr.push( attributeData[ o ].getGroupAttrSet( groupIndex ) );

				}

			}

			if ( _attr.length !== 0 ) {

				_triA.getBarycoord( clippedTri.a, _barycoordTri.a );
				_triA.getBarycoord( clippedTri.b, _barycoordTri.b );
				_triA.getBarycoord( clippedTri.c, _barycoordTri.c );

				for ( let k = 0, lk = _attr.length; k < lk; k ++ ) {

					const attrSet = _attr[ k ];
					const action = _actions[ k ];
					const invertTri = action === INVERT_TRI;
					appendAttributeFromTriangle( ia, _barycoordTri, a.geometry, a.matrixWorld, _normalMatrix, attrSet, invertedGeometry !== invertTri );

				}

			}

		}

	}

	return splitIds.length;

}

// perform CSG operations on the set of whole triangles using a half edge structure
// at the moment this isn't always faster due to overhead of building the half edge structure
// and degraded connectivity due to split triangles.

function performWholeTriangleOperations(
	a,
	b,
	splitTriSet,
	operations,
	invert,
	attributeData,
	groupOffset = 0,
) {

	const invertedGeometry = a.matrixWorld.determinant() < 0;

	// matrix for transforming into the local frame of geometry b
	_matrix
		.copy( b.matrixWorld )
		.invert()
		.multiply( a.matrixWorld );

	_normalMatrix
		.getNormalMatrix( a.matrixWorld )
		.multiplyScalar( invertedGeometry ? - 1 : 1 );

	const bBVH = b.geometry.boundsTree;
	const groupIndices = a.geometry.groupIndices;
	const aIndex = a.geometry.index;
	const aAttributes = a.geometry.attributes;
	const aPosition = aAttributes.position;

	const stack = [];
	const halfEdges = a.geometry.halfEdges;
	const traverseSet = new Set();
	const triCount = getTriCount( a.geometry );
	for ( let i = 0, l = triCount; i < l; i ++ ) {

		if ( ! ( i in splitTriSet.intersectionSet ) ) {

			traverseSet.add( i );

		}

	}

	while ( traverseSet.size > 0 ) {

		const id = getFirstIdFromSet( traverseSet );
		traverseSet.delete( id );

		stack.push( id );

		// get the vertex indices
		const i3 = 3 * id;
		const i0 = aIndex.getX( i3 + 0 );
		const i1 = aIndex.getX( i3 + 1 );
		const i2 = aIndex.getX( i3 + 2 );

		// get the vertex position in the frame of geometry b so we can
		// perform hit testing
		_tri.a.fromBufferAttribute( aPosition, i0 ).applyMatrix4( _matrix );
		_tri.b.fromBufferAttribute( aPosition, i1 ).applyMatrix4( _matrix );
		_tri.c.fromBufferAttribute( aPosition, i2 ).applyMatrix4( _matrix );

		// get the side and decide if we need to cull the triangle based on the operation
		const hitSide = getHitSide( _tri, bBVH );

		_actions.length = 0;
		_attr.length = 0;
		for ( let o = 0, lo = operations.length; o < lo; o ++ ) {

			const op = getOperationAction( operations[ o ], hitSide, invert );
			if ( op !== SKIP_TRI ) {

				_actions.push( op );
				_attr.push( attributeData[ o ] );

			}

		}

		while ( stack.length > 0 ) {

			const currId = stack.pop();
			for ( let i = 0; i < 3; i ++ ) {

				const sid = halfEdges.getSiblingTriangleIndex( currId, i );
				if ( sid !== - 1 && traverseSet.has( sid ) ) {

					stack.push( sid );
					traverseSet.delete( sid );

				}

			}

			if ( _attr.length !== 0 ) {

				const i3 = 3 * currId;
				const i0 = aIndex.getX( i3 + 0 );
				const i1 = aIndex.getX( i3 + 1 );
				const i2 = aIndex.getX( i3 + 2 );
				const groupIndex = groupOffset === - 1 ? 0 : groupIndices[ currId ] + groupOffset;

				_tri.a.fromBufferAttribute( aPosition, i0 );
				_tri.b.fromBufferAttribute( aPosition, i1 );
				_tri.c.fromBufferAttribute( aPosition, i2 );
				if ( ! isTriDegenerate( _tri ) ) {

					for ( let k = 0, lk = _attr.length; k < lk; k ++ ) {

						const action = _actions[ k ];
						const attrSet = _attr[ k ].getGroupAttrSet( groupIndex );
						const invertTri = action === INVERT_TRI;
						appendAttributesFromIndices( i0, i1, i2, aAttributes, a.matrixWorld, _normalMatrix, attrSet, invertTri !== invertedGeometry );

					}

				}

			}

		}

	}

}

// merges groups with common material indices in place
function joinGroups( groups ) {

	for ( let i = 0; i < groups.length - 1; i ++ ) {

		const group = groups[ i ];
		const nextGroup = groups[ i + 1 ];
		if ( group.materialIndex === nextGroup.materialIndex ) {

			const start = group.start;
			const end = nextGroup.start + nextGroup.count;
			nextGroup.start = start;
			nextGroup.count = end - start;

			groups.splice( i, 1 );
			i --;

		}

	}

}

// initialize the target geometry and attribute data to be based on
// the given reference geometry
function prepareAttributesData( referenceGeometry, targetGeometry, attributeData, relevantAttributes ) {

	attributeData.clear();

	// initialize and clear unused data from the attribute buffers and vice versa
	const aAttributes = referenceGeometry.attributes;
	for ( let i = 0, l = relevantAttributes.length; i < l; i ++ ) {

		const key = relevantAttributes[ i ];
		const aAttr = aAttributes[ key ];
		attributeData.initializeArray( key, aAttr.array.constructor, aAttr.itemSize, aAttr.normalized );

	}

	for ( const key in attributeData.attributes ) {

		if ( ! relevantAttributes.includes( key ) ) {

			attributeData.delete( key );

		}

	}

	for ( const key in targetGeometry.attributes ) {

		if ( ! relevantAttributes.includes( key ) ) {

			targetGeometry.deleteAttribute( key );
			targetGeometry.dispose();

		}

	}

}

// Assigns the given tracked attribute data to the geometry and returns whether the
// geometry needs to be disposed of.
function assignBufferData( geometry, attributeData, groupOrder ) {

	let needsDisposal = false;
	let drawRange = - 1;

	// set the data
	const attributes = geometry.attributes;
	const referenceAttrSet = attributeData.groupAttributes[ 0 ];
	for ( const key in referenceAttrSet ) {

		const requiredLength = attributeData.getTotalLength( key );
		const type = attributeData.getType( key );
		const itemSize = attributeData.getItemSize( key );
		const normalized = attributeData.getNormalized( key );
		let geoAttr = attributes[ key ];
		if ( ! geoAttr || geoAttr.array.length < requiredLength ) {

			// create the attribute if it doesn't exist yet
			geoAttr = new BufferAttribute( new type( requiredLength ), itemSize, normalized );
			geometry.setAttribute( key, geoAttr );
			needsDisposal = true;

		}

		// assign the data to the geometry attribute buffers in the provided order
		// of the groups list
		let offset = 0;
		for ( let i = 0, l = Math.min( groupOrder.length, attributeData.groupCount ); i < l; i ++ ) {

			const index = groupOrder[ i ].index;
			const { array, type, length } = attributeData.groupAttributes[ index ][ key ];
			const trimmedArray = new type( array.buffer, 0, length );
			geoAttr.array.set( trimmedArray, offset );
			offset += trimmedArray.length;

		}

		geoAttr.needsUpdate = true;
		drawRange = requiredLength / geoAttr.itemSize;

	}

	// remove or update the index appropriately
	if ( geometry.index ) {

		const indexArray = geometry.index.array;
		if ( indexArray.length < drawRange ) {

			geometry.index = null;
			needsDisposal = true;

		} else {

			for ( let i = 0, l = indexArray.length; i < l; i ++ ) {

				indexArray[ i ] = i;

			}

		}

	}

	// initialize the groups
	let groupOffset = 0;
	geometry.clearGroups();
	for ( let i = 0, l = Math.min( groupOrder.length, attributeData.groupCount ); i < l; i ++ ) {

		const { index, materialIndex } = groupOrder[ i ];
		const vertCount = attributeData.getCount( index );
		if ( vertCount !== 0 ) {

			geometry.addGroup( groupOffset, vertCount, materialIndex );
			groupOffset += vertCount;

		}

	}

	// update the draw range
	geometry.setDrawRange( 0, drawRange );

	// remove the bounds tree if it exists because its now out of date
	// TODO: can we have this dispose in the same way that a brush does?
	// TODO: why are half edges and group indices not removed here?
	geometry.boundsTree = null;

	if ( needsDisposal ) {

		geometry.dispose();

	}

}

// Returns the list of materials used for the given set of groups
function getMaterialList( groups, materials ) {

	let result = materials;
	if ( ! Array.isArray( materials ) ) {

		result = [];
		groups.forEach( g => {

			result[ g.materialIndex ] = materials;

		} );

	}

	return result;

}

// Utility class for performing CSG operations
class Evaluator {

	constructor() {

		this.triangleSplitter = new TriangleSplitter();
		this.attributeData = [];
		this.attributes = [ 'position', 'uv', 'normal' ];
		this.useGroups = true;
		this.consolidateGroups = true;
		this.debug = new OperationDebugData();

	}

	getGroupRanges( geometry ) {

		return ! this.useGroups || geometry.groups.length === 0 ?
			[ { start: 0, count: Infinity, materialIndex: 0 } ] :
			geometry.groups.map( group => ( { ...group } ) );

	}

	evaluate( a, b, operations, targetBrushes = new Brush() ) {

		let wasArray = true;
		if ( ! Array.isArray( operations ) ) {

			operations = [ operations ];

		}

		if ( ! Array.isArray( targetBrushes ) ) {

			targetBrushes = [ targetBrushes ];
			wasArray = false;

		}

		if ( targetBrushes.length !== operations.length ) {

			throw new Error( 'Evaluator: operations and target array passed as different sizes.' );

		}

		a.prepareGeometry();
		b.prepareGeometry();

		const {
			triangleSplitter,
			attributeData,
			attributes,
			useGroups,
			consolidateGroups,
			debug,
		} = this;

		// expand the attribute data array to the necessary size
		while ( attributeData.length < targetBrushes.length ) {

			attributeData.push( new TypedAttributeData() );

		}

		// prepare the attribute data buffer information
		targetBrushes.forEach( ( brush, i ) => {

			prepareAttributesData( a.geometry, brush.geometry, attributeData[ i ], attributes );

		} );

		// run the operation to fill the list of attribute data
		debug.init();
		performOperation( a, b, operations, triangleSplitter, attributeData, { useGroups } );
		debug.complete();

		// get the materials and group ranges
		const aGroups = this.getGroupRanges( a.geometry );
		const aMaterials = getMaterialList( aGroups, a.material );

		const bGroups = this.getGroupRanges( b.geometry );
		const bMaterials = getMaterialList( bGroups, b.material );
		bGroups.forEach( g => g.materialIndex += aMaterials.length );

		let groups = [ ...aGroups, ...bGroups ]
			.map( ( group, index ) => ( { ...group, index } ) );

		// generate the minimum set of materials needed for the list of groups and adjust the groups
		// if they're needed
		if ( useGroups ) {

			const allMaterials = [ ...aMaterials, ...bMaterials ];
			if ( consolidateGroups ) {

				groups = groups
					.map( group => {

						const mat = allMaterials[ group.materialIndex ];
						group.materialIndex = allMaterials.indexOf( mat );
						return group;

					} )
					.sort( ( a, b ) => {

						return a.materialIndex - b.materialIndex;

					} );

			}

			// create a map from old to new index and remove materials that aren't used
			const finalMaterials = [];
			for ( let i = 0, l = allMaterials.length; i < l; i ++ ) {

				let foundGroup = false;
				for ( let g = 0, lg = groups.length; g < lg; g ++ ) {

					const group = groups[ g ];
					if ( group.materialIndex === i ) {

						foundGroup = true;
						group.materialIndex = finalMaterials.length;

					}

				}

				if ( foundGroup ) {

					finalMaterials.push( allMaterials[ i ] );

				}

			}

			targetBrushes.forEach( tb => {

				tb.material = finalMaterials;

			} );

		} else {

			groups = [ { start: 0, count: Infinity, index: 0, materialIndex: 0 } ];
			targetBrushes.forEach( tb => {

				tb.material = aMaterials[ 0 ];

			} );

		}

		// apply groups and attribute data to the geometry
		targetBrushes.forEach( ( brush, i ) => {

			const targetGeometry = brush.geometry;
			assignBufferData( targetGeometry, attributeData[ i ], groups );
			if ( consolidateGroups ) {

				joinGroups( targetGeometry.groups );

			}

		} );

		return wasArray ? targetBrushes : targetBrushes[ 0 ];

	}

	// TODO: fix
	evaluateHierarchy( root, target = new Brush() ) {

		root.updateMatrixWorld( true );

		const flatTraverse = ( obj, cb ) => {

			const children = obj.children;
			for ( let i = 0, l = children.length; i < l; i ++ ) {

				const child = children[ i ];
				if ( child.isOperationGroup ) {

					flatTraverse( child, cb );

				} else {

					cb( child );

				}

			}

		};


		const traverse = brush => {

			const children = brush.children;
			let didChange = false;
			for ( let i = 0, l = children.length; i < l; i ++ ) {

				const child = children[ i ];
				didChange = traverse( child ) || didChange;

			}

			const isDirty = brush.isDirty();
			if ( isDirty ) {

				brush.markUpdated();

			}

			if ( didChange && ! brush.isOperationGroup ) {

				let result;
				flatTraverse( brush, child => {

					if ( ! result ) {

						result = this.evaluate( brush, child, child.operation );

					} else {

						result = this.evaluate( result, child, child.operation );

					}

				} );

				brush._cachedGeometry = result.geometry;
				brush._cachedMaterials = result.material;
				return true;

			} else {

				return didChange || isDirty;

			}

		};

		traverse( root );

		target.geometry = root._cachedGeometry;
		target.material = root._cachedMaterials;

		return target;

	}

	reset() {

		this.triangleSplitter.reset();

	}

}

const Schema$a = {
    width: {
        value: 2.05,
        name: t("width"),
        type: DataType.Number,
        description: "Width of the door in meters",
        min: 0.5,
        max: 5.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    height: {
        value: 1.8,
        name: t("height"),
        type: DataType.Number,
        description: "Height of the door in meters",
        min: 0.5,
        max: 3.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    depth: {
        value: 0.3,
        name: t("depth"),
        type: DataType.Number,
        description: "Thickness of the door in meters",
        min: 0.05,
        max: 1.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the door in 3D space",
        group: "transform",
    },
    frameColor: {
        value: "#FEFEFE",
        name: t("frameColor"),
        type: DataType.Color,
        description: "Color of the door frame",
        group: "appearance",
    },
    doorTexture: {
        value: {
            map: "door/door.png",
        },
        name: t("doorTexture"),
        type: DataType.Object,
        description: "Texture for the door surface",
        group: "textures",
    },
    doorOpenAngle: {
        value: -80,
        name: t("doorOpenAngle"),
        type: DataType.Number,
        description: "Maximum open angle of the door (degrees)",
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        group: "animation",
    },
    doorRotationSpeed: {
        value: 1000,
        name: t("doorRotationSpeed"),
        type: DataType.Number,
        description: "Speed of door rotation (ms)",
        min: 100,
        max: 10000,
        step: 10,
        unit: "ms",
        group: "animation",
    },
    doorRotationDirection: {
        value: "left",
        name: t("doorRotationDirection"),
        type: DataType.String,
        description: "Direction the door opens (left or right)",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
};
const assetId$a = "builder.door";
const Config$a = schemaToDefaultConfig(Schema$a);
const creator$7 = async (cfg) => {
    // Door model creation logic
    mergeConfig(cfg, Config$a);
    const specularMap = await loadImage({ map: "env/white.png" });
    const width = cfg.width || 2.05;
    const height = cfg.height || 1.8;
    const depth = cfg.depth || 0.3;
    const position = cfg.position || new THREE.Vector3();
    const frameColor = cfg.frameColor || 0xfefefe;
    const frameEdge = 0.1;
    const frameBottomEdge = 0.02;
    const image = await loadImage(cfg.doorTexture);
    const group = new THREE.Group();
    group.position.set(position.x, position.y, position.z);
    // 门套
    const cutGeo = new THREE.BoxGeometry(width - frameEdge, height - frameEdge / 2 - frameBottomEdge, depth + 0.02);
    const cutMat = new THREE.MeshPhongMaterial({ color: frameColor });
    const cutMesh = new Brush(cutGeo, cutMat);
    // scene.add(cutMesh);
    let result;
    const evaluator = new Evaluator();
    // eslint-disable-next-line prefer-const
    result = evaluator.evaluate(cutMesh, new Brush(new THREE.BoxGeometry(width - frameEdge - 0.04, height - frameEdge / 2 - frameBottomEdge - 0.04, depth + 0.02), cutMat), SUBTRACTION, result);
    group.add(result);
    // 门
    const doorGeo = new THREE.BoxGeometry(width - frameEdge - 0.02, height - frameEdge / 2 - frameBottomEdge - 0.02, 0.02);
    const uvs = [
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0.333,
        0.5,
        0.666,
        0.5,
        0.333,
        0,
        0.666,
        0,
        0.666,
        1,
        1,
        1,
        0.666,
        0.5,
        1,
        0.5, // 后
    ];
    doorGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const doorMesh = new Brush(doorGeo, new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xffffff),
        map: image,
        transparent: true,
        opacity: 0.9,
        specularMap,
    }));
    doorMesh.userData.animation = `rotation:${cfg.doorRotationDirection}:${cfg.doorOpenAngle}:${cfg.doorRotationSpeed}:0:bounceOut`;
    group.add(doorMesh);
    return group;
};
const init$b = () => {
    const summary = {
        assetId: assetId$a,
        name: t("door"),
        category: "building",
        description: t("doorDesc"),
        thumbnail: getThumbnailPath("door", "thumbnail.png"),
    };
    register(assetId$a, summary, creator$7, Config$a, Schema$a);
};

const Schema$9 = {
    width: {
        value: 2.05,
        name: t("width"),
        type: DataType.Number,
        description: "Width of the double door in meters",
        min: 0.5,
        max: 5.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    height: {
        value: 1.05,
        name: t("height"),
        type: DataType.Number,
        description: "Height of the double door in meters",
        min: 0.5,
        max: 3.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    depth: {
        value: 0.3,
        name: t("depth"),
        type: DataType.Number,
        description: "Thickness of the double door in meters",
        min: 0.05,
        max: 1.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the double door in 3D space",
        group: "transform",
    },
    frameColor: {
        value: "#FEFEFE",
        name: t("frameColor"),
        type: DataType.Color,
        description: "Color of the door frame",
        group: "appearance",
    },
    leftDoorTexture: {
        value: {
            map: "double_door/door-l.png",
        },
        name: t("leftDoorTexture"),
        type: DataType.Object,
        description: "Texture for the left door",
        group: "textures",
    },
    leftDoorRotationDirection: {
        value: "left",
        name: t("leftDoorRotationDirection"),
        type: DataType.String,
        description: "Direction the left door opens",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
    leftDoorAngle: {
        value: -80,
        name: t("leftDoorAngle"),
        type: DataType.Number,
        description: "Maximum open angle of the left door (degrees)",
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        group: "animation",
    },
    leftDoorRotationSpeed: {
        value: 1000,
        name: t("leftDoorRotationSpeed"),
        type: DataType.Number,
        description: "Speed of left door rotation (ms)",
        min: 100,
        max: 10000,
        step: 10,
        unit: "ms",
        group: "animation",
    },
    rightDoorTexture: {
        value: {
            map: "double_door/door-r.png",
        },
        name: t("rightDoorTexture"),
        type: DataType.Object,
        description: "Texture for the right door",
        group: "textures",
    },
    rightDoorRotationDirection: {
        value: "right",
        name: t("rightDoorRotationDirection"),
        type: DataType.String,
        description: "Direction the right door opens",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
    rightDoorAngle: {
        value: 80,
        name: t("rightDoorAngle"),
        type: DataType.Number,
        description: "Maximum open angle of the right door (degrees)",
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        group: "animation",
    },
    rightDoorRotationSpeed: {
        value: 1000,
        name: t("rightDoorRotationSpeed"),
        type: DataType.Number,
        description: "Speed of right door rotation (ms)",
        min: 100,
        max: 10000,
        step: 10,
        unit: "ms",
        group: "animation",
    },
};
const assetId$9 = "builder.doubledoor";
const Config$9 = schemaToDefaultConfig(Schema$9);
const creator$6 = async (cfg) => {
    // Door model creation logic
    mergeConfig(cfg, Config$9);
    const specularMap = await loadImage({ map: "env/white.png" });
    const width = cfg.width || 2.05;
    const height = cfg.height || 1.13;
    const depth = cfg.depth || 0.26;
    const position = cfg.position || new THREE.Vector3();
    const frameEdge = 0.1;
    const frameBottomEdge = 0.05;
    const frameColor = cfg.frameColor || 0xfefefe;
    const leftImage = await loadImage(cfg.leftDoorTexture);
    const rightImage = await loadImage(cfg.rightDoorTexture);
    // @ts-ignore
    rightImage.flipY = true;
    const group = new THREE.Group();
    group.position.set(position.x, position.y, position.z);
    // 门套
    const cutGeo = new THREE.BoxGeometry(width - frameEdge, height - frameEdge / 2 - frameBottomEdge, depth + 0.02);
    const cutMat = new THREE.MeshPhongMaterial({ color: frameColor });
    const cutMesh = new Brush(cutGeo, cutMat);
    // scene.add(cutMesh);
    const evaluator = new Evaluator();
    let result;
    // eslint-disable-next-line prefer-const
    result = evaluator.evaluate(cutMesh, new Brush(new THREE.BoxGeometry(width - frameEdge - 0.04, height - frameEdge / 2 - frameBottomEdge - 0.04, depth + 0.02), cutMat), SUBTRACTION, result);
    group.add(result);
    const uvs = [
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0,
        1,
        0.333,
        1,
        0,
        0.5,
        0.333,
        0.5,
        0.333,
        0.5,
        0.666,
        0.5,
        0.333,
        0,
        0.666,
        0,
        0.666,
        1,
        1,
        1,
        0.666,
        0.5,
        1,
        0.5, // 后
    ];
    // 左门
    const doorLeftGeo = new THREE.BoxGeometry((width - frameEdge) / 2 - 0.02, height - frameEdge / 2 - frameBottomEdge - 0.02, 0.02);
    doorLeftGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const doorLeftMesh = new Brush(doorLeftGeo, new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xffffff),
        map: leftImage,
        transparent: true,
        opacity: 0.9,
        specularMap,
    }));
    doorLeftMesh.userData.animation = `rotation:${cfg.leftDoorRotationDirection}:${cfg.leftDoorAngle}:${cfg.leftDoorRotationSpeed}:0:bounceOut`;
    doorLeftMesh.position.set(-(width - frameEdge) / 4 + 0.01, 0, 0);
    group.add(doorLeftMesh);
    // 右门
    const doorRightGeo = new THREE.BoxGeometry((width - frameEdge) / 2 - 0.02, height - frameEdge / 2 - frameBottomEdge - 0.02, 0.02);
    doorRightGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const doorRightMesh = new Brush(doorRightGeo, new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xffffff),
        map: rightImage,
        transparent: true,
        opacity: 0.9,
        specularMap,
    }));
    doorRightMesh.position.set((width - frameEdge) / 4 - 0.01, 0, 0);
    doorRightMesh.userData.animation = `rotation:${cfg.rightDoorRotationDirection}:${cfg.rightDoorAngle}:${cfg.rightDoorRotationSpeed}:0:bounceOut`;
    group.add(doorRightMesh);
    return group;
};
const init$a = () => {
    const summary = {
        assetId: assetId$9,
        name: t("doubleDoor"),
        category: "building",
        description: t("doubleDoorDesc"),
        thumbnail: getThumbnailPath("double_door", "thumbnail.png"),
    };
    register(assetId$9, summary, creator$6, Config$9, Schema$9);
};

const Schema$8 = {
    data: {
        value: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 10, z: 0 },
            { x: 10, y: 10, z: 0 },
            { x: 10, y: 0, z: 0 },
        ],
        name: t("wallData"),
        type: DataType.Vector3Array,
        description: "Wall outline points in 3D space",
        required: true,
        group: "geometry",
    },
    height: {
        value: 2.6,
        name: t("wallHeight"),
        type: DataType.Number,
        description: "Height of the glass wall in meters",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "m",
        required: true,
        group: "geometry",
    },
    depth: {
        value: 0.3,
        name: t("wallDepth"),
        type: DataType.Number,
        description: "Thickness of the glass wall in meters",
        min: 0.05,
        max: 2.0,
        step: 0.05,
        unit: "m",
        required: true,
        group: "geometry",
    },
    topColor: {
        value: "#dbdee5",
        name: t("wallTopColor"),
        type: DataType.Color,
        description: "Color of the wall top surface",
        group: "appearance",
    },
    bottomColor: {
        value: "#ffffff",
        name: t("wallBottomColor"),
        type: DataType.Color,
        description: "Color of the wall bottom surface",
        group: "appearance",
    },
    interiorColor: {
        value: "#efefef",
        name: t("wallInteriorColor"),
        type: DataType.Color,
        description: "Color of the interior wall surface",
        group: "appearance",
    },
    exteriorColor: {
        value: "#dce8e9",
        name: t("wallExteriorColor"),
        type: DataType.Color,
        description: "Color of the exterior wall surface",
        group: "appearance",
    },
    exteriorTexture: {
        value: {
            map: "glasswall/glass-wall.png",
            repeat: [1, 1],
        },
        name: t("wallExteriorTexture"),
        type: DataType.Object,
        description: "Texture for the exterior wall surface",
        group: "textures",
    },
    interiorTexture: {
        value: {
            map: "glasswall/glass-wall.png",
            repeat: [1, 1],
        },
        name: t("wallInteriorTexture"),
        type: DataType.Object,
        description: "Texture for the interior wall surface",
        group: "textures",
    },
    floorTexture: {
        value: {
            map: "glasswall/floor.jpg",
            repeat: [15, 15],
        },
        name: t("floorTexture"),
        type: DataType.Object,
        description: "Texture for the floor surface",
        group: "textures",
    },
    roofTexture: {
        value: {
            map: "glasswall/roof.jpg",
            repeat: [5, 5],
        },
        name: t("roofTexture"),
        type: DataType.Object,
        description: "Texture for the roof surface",
        group: "textures",
    },
    transparent: {
        value: true,
        name: t("transparent"),
        type: DataType.Boolean,
        description: "Whether the wall is transparent",
        group: "appearance",
    },
    opacity: {
        value: 0.9,
        name: t("opacity"),
        type: DataType.Number,
        description: "Opacity of the wall (0.0 to 1.0)",
        min: 0.0,
        max: 1.0,
        step: 0.1,
        group: "appearance",
    },
    closed: {
        value: true,
        name: t("closed"),
        type: DataType.Boolean,
        description: "Whether the wall forms a closed shape",
        group: "geometry",
    },
};
const assetId$8 = "builder.glasswall";
const Config$8 = schemaToDefaultConfig(Schema$8);
const init$9 = () => {
    const summary = {
        assetId: assetId$8,
        name: t("glassWall"),
        category: "parametric_model",
        description: t("wallModel"),
        thumbnail: getThumbnailPath("glasswall", "thumbnail.png"),
    };
    copyAndRegister("builder.wall", assetId$8, summary, Config$8, Schema$8);
};

const Schema$7 = {
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the plant in 3D space",
        group: "transform",
    },
    rotation: {
        value: { x: 0, y: 0, z: 0 },
        name: t("rotation"),
        type: DataType.Vector3,
        description: "Rotation of the plant in radians",
        group: "transform",
    },
    style: {
        value: "1",
        name: t("style"),
        type: DataType.String,
        description: "Plant style (1: short, 2: tall)",
        options: [
            {
                text: "1",
                value: "1",
            },
            {
                text: "2",
                value: "2",
            },
        ],
        group: "appearance",
    },
};
const assetId$7 = "builder.plant";
const Config$7 = schemaToDefaultConfig(Schema$7);
const creator$5 = async (cfg) => {
    // Plant model creation logic
    mergeConfig(cfg, Config$7);
    const position = cfg.position || new THREE.Vector3();
    const rotation = cfg.rotation || new THREE.Euler();
    const style = cfg.style || "1";
    const nomalMap = await loadImage({ map: "env/metal_normalmap.jpg" });
    if (nomalMap) {
        nomalMap.wrapS = THREE.RepeatWrapping;
        nomalMap.wrapT = THREE.RepeatWrapping;
        nomalMap.repeat.set(10, 5);
    }
    const group = new THREE.Group();
    if (style === "1") {
        const width = 0.3;
        const height = 0.3;
        const flowerpot = createFlowerpot(width * 0.5, width * 0.4, height * 2, nomalMap);
        group.add(flowerpot);
        const image = await loadImage({ map: "plant/plant.png" });
        if (image) {
            image.colorSpace = THREE.SRGBColorSpace;
        }
        createBasePlant(width * 1.5, height + 0.2, 0.35, group, image);
    }
    else if (style === "2") {
        const width = 0.3;
        const height = 1.2;
        const flowerpot = createFlowerpot(width * 0.6, width * 0.4, height / 5, nomalMap);
        group.add(flowerpot);
        const image = await loadImage({ map: "plant/plant2.png" });
        if (image) {
            image.colorSpace = THREE.SRGBColorSpace;
        }
        createBasePlant(width * 2, height, 0.6, group, image);
    }
    else {
        log.warn(`Unknown plant style: ${style}`);
        return null;
    }
    group.position.set(position.x, position.y, position.z);
    group.rotation.set(rotation.x, rotation.y, rotation.z);
    return group;
};
const init$8 = () => {
    const summary = {
        assetId: assetId$7,
        name: t("plant"),
        category: "plant",
        description: t("plantDesc"),
        thumbnail: getThumbnailPath("plant", "thumbnail.png"),
    };
    register(assetId$7, summary, creator$5, Config$7, Schema$7);
};
function createFlowerpot(w, h, d, normalMap) {
    // 花盆
    const cylinderGeo = new THREE.CylinderGeometry(w, h, d, 20, 1);
    const cylinderVase = new Brush(cylinderGeo, new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xbbbbbb),
        specular: new THREE.Color(0xbbbbbb),
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
    }));
    cylinderVase.updateMatrixWorld();
    const cylinderHollow = cylinderVase.clone(true);
    cylinderHollow.scale.set(0.9, 1, 0.9);
    cylinderHollow.updateMatrixWorld();
    const cylinderMud = cylinderHollow.clone(true);
    cylinderMud.scale.set(0.9, 0.7, 0.9);
    cylinderMud.updateMatrixWorld();
    cylinderMud.material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x163511),
        specular: new THREE.Color(0x163511),
    });
    let result;
    const evaluator = new Evaluator();
    result = evaluator.evaluate(cylinderVase, cylinderHollow, SUBTRACTION, result);
    result = evaluator.evaluate(result, cylinderMud, ADDITION, result);
    return result;
}
function createBasePlant(w, h, y, parent, map) {
    // 植物
    const count = 5;
    for (let i = 0; i < count; i++) {
        const plantGeo = new THREE.PlaneGeometry(w, h);
        const plant = new THREE.Mesh(plantGeo, new THREE.MeshPhongMaterial({ alphaTest: 0.5, transparent: false, map: map, side: THREE.DoubleSide }));
        parent.add(plant);
        plant.position.y = y;
        plant.rotateY((Math.PI * i) / count);
    }
}

const Schema$6 = {
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the rack in 3D space",
        group: "transform",
    },
    rotation: {
        value: { x: 0, y: 0, z: 0 },
        name: t("rotation"),
        type: DataType.Vector3,
        description: "Rotation of the rack in radians",
        group: "transform",
    },
    width: {
        value: 0.6,
        name: t("width"),
        type: DataType.Number,
        description: "Width of the rack in meters",
        min: 0.1,
        max: 5.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    height: {
        value: 2,
        name: t("height"),
        type: DataType.Number,
        description: "Height of the rack in meters",
        min: 0.5,
        max: 10.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    depth: {
        value: 0.8,
        name: t("depth"),
        type: DataType.Number,
        description: "Depth of the rack in meters",
        min: 0.1,
        max: 5.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    interiorWidth: {
        name: t("interiorWidth"),
        value: 0.455,
        type: DataType.Number,
        description: "Interior width of the rack in meters",
        min: 0.05,
        max: 4.0,
        step: 0.001,
        unit: "m",
        group: "geometry",
    },
    rackDoorOpenAngle: {
        name: t("rackDoorOpenAngle"),
        value: -135,
        type: DataType.Number,
        description: "Maximum open angle of rack doors (degrees)",
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        group: "animation",
    },
    rackEnvMap: {
        name: t("rackEnvMap"),
        value: "envmap1",
        type: DataType.String,
        description: "Environment map for the rack",
        options: [
            {
                text: "envmap1",
                value: "envmap1",
            },
            {
                text: "envmap2",
                value: "envmap2",
            },
        ],
        group: "environment",
    },
    frontDoorOpenDirection: {
        name: t("frontDoorOpenDirection"),
        value: "right",
        type: DataType.String,
        description: "Direction the front door opens",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
    backDoorOpenDirection: {
        name: t("backDoorOpenDirection"),
        value: "left",
        type: DataType.String,
        description: "Direction the back door opens",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
    reflectRatio: {
        name: t("reflectRatio"),
        value: 1,
        type: DataType.Number,
        description: "Reflection ratio of the rack surface",
        min: 0.0,
        max: 2.0,
        step: 0.1,
        group: "appearance",
    },
    exteriorTexture: {
        name: t("exteriorTexture"),
        value: {
            map: "rack/rack_side.jpg",
        },
        type: DataType.Object,
        description: "Texture for the exterior side of the rack",
        group: "textures",
    },
    topExteriorTexture: {
        name: t("topExteriorTexture"),
        value: {
            map: "rack/rack_top.jpg",
        },
        type: DataType.Object,
        description: "Texture for the exterior top of the rack",
        group: "textures",
    },
    interiorTexture: {
        name: t("interiorTexture"),
        value: {
            map: "rack/interior_side.jpg",
        },
        type: DataType.Object,
        description: "Texture for the interior side of the rack",
        group: "textures",
    },
    topInteriorTexture: {
        name: t("topInteriorTexture"),
        value: {
            map: "rack/interior_top.jpg",
        },
        type: DataType.Object,
        description: "Texture for the interior top of the rack",
        group: "textures",
    },
    frontDoorTexture: {
        name: t("frontDoorTexture"),
        value: {
            map: "rack/rack_door_front.jpg",
        },
        type: DataType.Object,
        description: "Texture for the front door of the rack",
        group: "textures",
    },
    frontDoorBackTexture: {
        name: t("frontDoorBackTexture"),
        value: {
            map: "rack/rack_door_back.jpg",
        },
        type: DataType.Object,
        description: "Texture for the back door of the rack",
        group: "textures",
    },
    backDoorTexture: {
        name: t("backDoorTexture"),
        value: {
            map: "rack/rack_back.jpg",
        },
        type: DataType.Object,
        description: "Texture for the back door of the rack",
        group: "textures",
    },
    backDoorFrontTexture: {
        name: t("backDoorFrontTexture"),
        value: {
            map: "rack/rack_back.jpg",
        },
        type: DataType.Object,
        description: "Texture for the front door of the rack",
        group: "textures",
    },
    frameTexture: {
        name: t("frameTexture"),
        value: {
            map: "rack/rack42u.png",
        },
        type: DataType.Object,
        description: "Texture for the frame of the rack",
        group: "textures",
    },
};
const RACK_WIDTH = 0.6;
const RACK_INNER_WIDTH = 0.455;
function createPhongMaterials({ maps, envMap, reflectivity = 0.5, specular = 0xe5e5e5, color = 0xffffff, shininess = 30, lightMap = null, }) {
    return maps.map((map) => new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        specular: new THREE.Color(specular),
        map,
        envMap,
        reflectivity,
        shininess,
        lightMap,
    }));
}
const assetId$6 = "builder.rack";
const Config$6 = schemaToDefaultConfig(Schema$6);
const creator$4 = async (cfg) => {
    mergeConfig(cfg, Config$6);
    const [envMap, lightMap, rackSideImage, rackTopImage, rackFrameImage, interiorSideImage, topInteriorImage, rackFrontDoorImage, rackBackDoorImage, rackBackImage, rackBackFrontImage,] = await Promise.all([
        loadImage({ map: "env/envmap1.jpg" }),
        loadImage({ map: "env/exterior_lightmap.jpg" }),
        loadImage(cfg.exteriorTexture),
        loadImage(cfg.topExteriorTexture),
        loadImage(cfg.frameTexture),
        loadImage(cfg.interiorTexture),
        loadImage(cfg.topInteriorTexture),
        loadImage(cfg.frontDoorTexture),
        loadImage(cfg.frontDoorBackTexture),
        loadImage(cfg.backDoorTexture),
        loadImage(cfg.backDoorFrontTexture),
    ]);
    const position = cfg.position || new THREE.Vector3();
    const rotation = cfg.rotation || new THREE.Euler();
    const rackWidth = cfg.width || RACK_WIDTH;
    const rackHeight = cfg.height || 2;
    const rackDepth = cfg.depth || 0.8;
    const doorDepth = 0.02;
    const rack = new THREE.Group();
    rack.name = "rack";
    rack.position.set(position.x, position.y, position.z);
    rack.rotation.set(rotation.x, rotation.y, rotation.z);
    // 柜体
    const cube1 = new Brush(new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth), createPhongMaterials({
        maps: [
            rackSideImage,
            rackSideImage,
            rackTopImage,
            rackTopImage,
            rackFrameImage,
            rackFrameImage, // 后面
        ],
        envMap,
        reflectivity: 0.5,
    }));
    cube1.updateMatrixWorld();
    // 机柜洞
    const cube2 = new Brush(new THREE.BoxGeometry(RACK_INNER_WIDTH, rackHeight - doorDepth * 2, rackDepth), [
        ...createPhongMaterials({
            maps: [interiorSideImage, interiorSideImage, topInteriorImage, topInteriorImage],
            envMap,
            reflectivity: 0.5,
            lightMap,
        }),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff), lightMap }),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff), lightMap }), // 后面
    ]);
    cube2.updateMatrixWorld();
    // CSG 运算
    const evaluator = new Evaluator();
    const result = evaluator.evaluate(cube1, cube2, SUBTRACTION);
    rack.add(result);
    // 前门
    const doorMaterials = createPhongMaterials({
        maps: [
            topInteriorImage,
            topInteriorImage,
            topInteriorImage,
            topInteriorImage,
            rackFrontDoorImage,
            rackBackDoorImage, // 后面
        ],
        envMap,
        reflectivity: 0.7,
        shininess: 100,
    });
    const geometry = new THREE.BoxGeometry(rackWidth, rackHeight, doorDepth);
    const rackDoor = new THREE.Mesh(geometry, doorMaterials);
    rackDoor.name = "rack_front_door";
    rackDoor.position.z = rackDepth / 2 + 0.01;
    rackDoor.userData.animation = `rotation:${cfg.frontDoorOpenDirection}:${cfg.rackDoorOpenAngle}:1000:0:bounceOut`;
    rack.add(rackDoor);
    // 后门
    const backDoorMaterials = createPhongMaterials({
        maps: [
            topInteriorImage,
            topInteriorImage,
            topInteriorImage,
            topInteriorImage,
            rackBackFrontImage,
            rackBackImage, // 后面
        ],
        envMap,
        reflectivity: 0.7,
        shininess: 100,
    });
    const rackDoorBack = new THREE.Mesh(geometry, backDoorMaterials);
    rackDoorBack.name = "rack_back_door";
    rackDoorBack.position.z = -rackDepth / 2 - 0.01;
    rackDoorBack.userData.animation = `rotation:${cfg.backDoorOpenDirection}:${cfg.rackDoorOpenAngle}:1000:0:bounceOut`;
    rack.add(rackDoorBack);
    return rack;
};
const init$7 = () => {
    const summary = {
        assetId: assetId$6,
        name: t("rack"),
        category: "rack",
        description: t("rackDesc"),
        thumbnail: getThumbnailPath("rack", "thumbnail.png"),
    };
    register(assetId$6, summary, creator$4, Config$6, Schema$6);
};

const Schema$5 = {
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the rack in 3D space",
        group: "transform",
    },
    rotation: {
        value: { x: 0, y: 0, z: 0 },
        name: t("rotation"),
        type: DataType.Vector3,
        description: "Rotation of the rack in radians",
        group: "transform",
    },
    width: {
        value: 0.6,
        name: t("width"),
        type: DataType.Number,
        description: "Width of the rack in meters",
        min: 0.1,
        max: 5.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    height: {
        value: 2,
        name: t("height"),
        type: DataType.Number,
        description: "Height of the rack in meters",
        min: 0.5,
        max: 10.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    depth: {
        value: 0.8,
        name: t("depth"),
        type: DataType.Number,
        description: "Depth of the rack in meters",
        min: 0.1,
        max: 5.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    interiorWidth: {
        name: t("interiorWidth"),
        value: 0.455,
        type: DataType.Number,
        description: "Interior width of the rack in meters",
        min: 0.05,
        max: 4.0,
        step: 0.001,
        unit: "m",
        group: "geometry",
    },
    rackDoorOpenAngle: {
        name: t("rackDoorOpenAngle"),
        value: -135,
        type: DataType.Number,
        description: "Maximum open angle of rack doors (degrees)",
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        group: "animation",
    },
    rackEnvMap: {
        name: t("rackEnvMap"),
        value: "envmap1",
        type: DataType.String,
        description: "Environment map for the rack",
        options: [
            {
                text: "envmap1",
                value: "envmap1",
            },
            {
                text: "envmap2",
                value: "envmap2",
            },
        ],
        group: "environment",
    },
    frontDoorOpenDirection: {
        name: t("frontDoorOpenDirection"),
        value: "right",
        type: DataType.String,
        description: "Direction the front door opens",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
    backDoorOpenDirection: {
        name: t("backDoorOpenDirection"),
        value: "left",
        type: DataType.String,
        description: "Direction the back door opens",
        options: [
            {
                text: "left",
                value: "left",
            },
            {
                text: "right",
                value: "right",
            },
        ],
        group: "animation",
    },
    reflectRatio: {
        name: t("reflectRatio"),
        value: 1,
        type: DataType.Number,
        description: "Reflection ratio of the rack surface",
        min: 0.0,
        max: 2.0,
        step: 0.1,
        group: "appearance",
    },
    exteriorTexture: {
        name: t("exteriorTexture"),
        value: {
            map: "rack2/r1srack.jpg",
        },
        type: DataType.Object,
        description: "Texture for the exterior side of the rack",
        group: "textures",
    },
    topExteriorTexture: {
        name: t("topExteriorTexture"),
        value: {
            map: "rack2/r1track.jpg",
        },
        type: DataType.Object,
        description: "Texture for the exterior top of the rack",
        group: "textures",
    },
    interiorTexture: {
        name: t("interiorTexture"),
        value: {
            map: "rack2/interior_side.jpg",
        },
        type: DataType.Object,
        description: "Texture for the interior side of the rack",
        group: "textures",
    },
    topInteriorTexture: {
        name: t("topInteriorTexture"),
        value: {
            map: "rack2/interior_top.jpg",
        },
        type: DataType.Object,
        description: "Texture for the interior top of the rack",
        group: "textures",
    },
    frontDoorTexture: {
        name: t("frontDoorTexture"),
        value: {
            map: "rack2/r1frack.jpg",
        },
        type: DataType.Object,
        description: "Texture for the front door of the rack",
        group: "textures",
    },
    frontDoorBackTexture: {
        name: t("frontDoorBackTexture"),
        value: {
            map: "rack2/r1frack.jpg",
        },
        type: DataType.Object,
        description: "Texture for the back door of the rack",
        group: "textures",
    },
    backDoorTexture: {
        name: t("backDoorTexture"),
        value: {
            map: "rack2/r1brack.jpg",
        },
        type: DataType.Object,
        description: "Texture for the back door of the rack",
        group: "textures",
    },
    backDoorFrontTexture: {
        name: t("backDoorFrontTexture"),
        value: {
            map: "rack2/r1brack.jpg",
        },
        type: DataType.Object,
        description: "Texture for the front door of the rack",
        group: "textures",
    },
    frameTexture: {
        name: t("frameTexture"),
        value: {
            map: "rack2/r1frack.jpg",
        },
        type: DataType.Object,
        description: "Texture for the frame of the rack",
        group: "textures",
    },
};
const assetId$5 = "builder.rack2";
const Config$5 = schemaToDefaultConfig(Schema$5);
const init$6 = () => {
    const summary = {
        assetId: assetId$5,
        name: t("rack2"),
        category: "rack2",
        description: t("rack2Desc"),
        thumbnail: getThumbnailPath("rack2", "thumbnail.png"),
    };
    copyAndRegister("builder.rack", assetId$5, summary, Config$5, Schema$5);
};

const Schema$4 = {
    skyboxTexture: {
        value: {
            map: "skybox/skybox.jpg",
        },
        name: t("skyboxTexture"),
        type: DataType.Object,
        description: "Texture for the skybox",
        group: "textures",
    },
    skyboxRadius: {
        value: 10000,
        name: t("skyboxRadius"),
        type: DataType.Number,
        description: "Radius of the skybox sphere",
        min: 100,
        max: 100000,
        step: 100,
        unit: "m",
        group: "geometry",
    },
    colorSpace: {
        value: THREE.SRGBColorSpace,
        name: t("colorSpace"),
        type: DataType.String,
        description: "Color space for the skybox texture",
        options: [
            {
                text: THREE.SRGBColorSpace,
                value: THREE.SRGBColorSpace,
            },
            {
                text: THREE.LinearSRGBColorSpace,
                value: THREE.LinearSRGBColorSpace,
            },
        ],
        group: "appearance",
    },
};
const assetId$4 = "builder.skybox";
const Config$4 = schemaToDefaultConfig(Schema$4);
const creator$3 = async (cfg) => {
    mergeConfig(cfg, Config$4);
    const skyboxTexture = await loadImage(cfg.skyboxTexture);
    if (skyboxTexture) {
        skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;
        skyboxTexture.colorSpace = cfg.colorSpace || THREE.SRGBColorSpace;
    }
    const radius = cfg.skyboxRadius;
    const geometry = new THREE.SphereGeometry(radius, radius * 2, 128);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: skyboxTexture });
    const skybox = new THREE.Mesh(geometry, material);
    return skybox;
};
const init$5 = () => {
    const summary = {
        assetId: assetId$4,
        name: t("skybox"),
        category: "skybox",
        description: t("skyboxDescription"),
        thumbnail: getThumbnailPath("skybox", "thumbnail.png"),
    };
    register(assetId$4, summary, creator$3, Config$4, Schema$4);
};

function earcut(data, holeIndices, dim = 2) {

    const hasHoles = holeIndices && holeIndices.length;
    const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
    let outerNode = linkedList(data, 0, outerLen, dim, true);
    const triangles = [];

    if (!outerNode || outerNode.next === outerNode.prev) return triangles;

    let minX, minY, invSize;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
    if (data.length > 80 * dim) {
        minX = data[0];
        minY = data[1];
        let maxX = minX;
        let maxY = minY;

        for (let i = dim; i < outerLen; i += dim) {
            const x = data[i];
            const y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        // minX, minY and invSize are later used to transform coords into integers for z-order calculation
        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 32767 / invSize : 0;
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, invSize, 0);

    return triangles;
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    let last;

    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (let i = start; i < end; i += dim) last = insertNode(i / dim | 0, data[i], data[i + 1], last);
    } else {
        for (let i = end - dim; i >= start; i -= dim) last = insertNode(i / dim | 0, data[i], data[i + 1], last);
    }

    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }

    return last;
}

// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    let p = start,
        again;
    do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) break;
            again = true;

        } else {
            p = p.next;
        }
    } while (again || p !== end);

    return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) return;

    // interlink polygon nodes in z-order
    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    let stop = ear;

    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        const prev = ear.prev;
        const next = ear.next;

        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            triangles.push(prev.i, ear.i, next.i); // cut off the triangle

            removeNode(ear);

            // skipping the next vertex leads to less sliver triangles
            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

            // if this didn't work, try curing all small self-intersections locally
            } else if (pass === 1) {
                ear = cureLocalIntersections(filterPoints(ear), triangles);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

            // as a last resort, try splitting the remaining polygon into two
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }

            break;
        }
    }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    const a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // now make sure we don't have other points inside the potential ear
    const ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

    // triangle bbox
    const x0 = Math.min(ax, bx, cx),
        y0 = Math.min(ay, by, cy),
        x1 = Math.max(ax, bx, cx),
        y1 = Math.max(ay, by, cy);

    let p = c.next;
    while (p !== a) {
        if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 &&
            pointInTriangleExceptFirst(ax, ay, bx, by, cx, cy, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, invSize) {
    const a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    const ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

    // triangle bbox
    const x0 = Math.min(ax, bx, cx),
        y0 = Math.min(ay, by, cy),
        x1 = Math.max(ax, bx, cx),
        y1 = Math.max(ay, by, cy);

    // z-order range for the current triangle bbox;
    const minZ = zOrder(x0, y0, minX, minY, invSize),
        maxZ = zOrder(x1, y1, minX, minY, invSize);

    let p = ear.prevZ,
        n = ear.nextZ;

    // look for points inside the triangle in both directions
    while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
            pointInTriangleExceptFirst(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;

        if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
            pointInTriangleExceptFirst(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    // look for remaining points in decreasing z-order
    while (p && p.z >= minZ) {
        if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
            pointInTriangleExceptFirst(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    // look for remaining points in increasing z-order
    while (n && n.z <= maxZ) {
        if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
            pointInTriangleExceptFirst(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles) {
    let p = start;
    do {
        const a = p.prev,
            b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

            triangles.push(a.i, p.i, b.i);

            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);

            p = start = b;
        }
        p = p.next;
    } while (p !== start);

    return filterPoints(p);
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    // look for a valid diagonal that divides the polygon into two
    let a = start;
    do {
        let b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                let c = splitPolygon(a, b);

                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, invSize, 0);
                earcutLinked(c, triangles, dim, minX, minY, invSize, 0);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    const queue = [];

    for (let i = 0, len = holeIndices.length; i < len; i++) {
        const start = holeIndices[i] * dim;
        const end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        const list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareXYSlope);

    // process holes from left to right
    for (let i = 0; i < queue.length; i++) {
        outerNode = eliminateHole(queue[i], outerNode);
    }

    return outerNode;
}

function compareXYSlope(a, b) {
    let result = a.x - b.x;
    // when the left-most point of 2 holes meet at a vertex, sort the holes counterclockwise so that when we find
    // the bridge to the outer shell is always the point that they meet at.
    if (result === 0) {
        result = a.y - b.y;
        if (result === 0) {
            const aSlope = (a.next.y - a.y) / (a.next.x - a.x);
            const bSlope = (b.next.y - b.y) / (b.next.x - b.x);
            result = aSlope - bSlope;
        }
    }
    return result;
}

// find a bridge between vertices that connects hole with an outer ring and link it
function eliminateHole(hole, outerNode) {
    const bridge = findHoleBridge(hole, outerNode);
    if (!bridge) {
        return outerNode;
    }

    const bridgeReverse = splitPolygon(bridge, hole);

    // filter collinear points around the cuts
    filterPoints(bridgeReverse, bridgeReverse.next);
    return filterPoints(bridge, bridge.next);
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    let p = outerNode;
    const hx = hole.x;
    const hy = hole.y;
    let qx = -Infinity;
    let m;

    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    // unless they intersect at a vertex, then choose the vertex
    if (equals(hole, p)) return p;
    do {
        if (equals(hole, p.next)) return p.next;
        else if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                m = p.x < p.next.x ? p : p.next;
                if (x === hx) return m; // hole touches outer segment; pick leftmost endpoint
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point

    const stop = m;
    const mx = m.x;
    const my = m.y;
    let tanMin = Infinity;

    p = m;

    do {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

            const tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

            if (locallyInside(p, hole) &&
                (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    } while (p !== stop);

    return m;
}

// whether sector in vertex m contains sector in vertex p in the same coordinates
function sectorContainsSector(m, p) {
    return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
    let p = start;
    do {
        if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    let numMerges;
    let inSize = 1;

    do {
        let p = list;
        let e;
        list = null;
        let tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            let q = p;
            let pSize = 0;
            for (let i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }
            let qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {

                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
    // coords are transformed into non-negative 15-bit integer range
    x = (x - minX) * invSize | 0;
    y = (y - minY) * invSize | 0;

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
    let p = start,
        leftmost = start;
    do {
        if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
           (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
           (bx - px) * (cy - py) >= (cx - px) * (by - py);
}

// check if a point lies within a convex triangle but false if its equal to the first point of the triangle
function pointInTriangleExceptFirst(ax, ay, bx, by, cx, cy, px, py) {
    return !(ax === px && ay === py) && pointInTriangle(ax, ay, bx, by, cx, cy, px, py);
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // doesn't intersect other edges
           (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
            (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
            equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
}

// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    const o1 = sign(area(p1, q1, p2));
    const o2 = sign(area(p1, q1, q2));
    const o3 = sign(area(p2, q2, p1));
    const o4 = sign(area(p2, q2, q1));

    if (o1 !== o2 && o3 !== o4) return true; // general case

    if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
    if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
    if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
    if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

    return false;
}

// for collinear points p, q, r, check if point q lies on segment pr
function onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function sign(num) {
    return num > 0 ? 1 : num < 0 ? -1 : 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    let p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    let p = a;
    let inside = false;
    const px = (a.x + b.x) / 2;
    const py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    const a2 = createNode(a.i, a.x, a.y),
        b2 = createNode(b.i, b.x, b.y),
        an = a.next,
        bp = b.prev;

    a.next = b;
    b.prev = a;

    a2.next = an;
    an.prev = a2;

    b2.next = a2;
    a2.prev = b2;

    bp.next = b2;
    b2.prev = bp;

    return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    const p = createNode(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;

    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function createNode(i, x, y) {
    return {
        i, // vertex index in coordinates array
        x, y, // vertex coordinates
        prev: null, // previous and next vertex nodes in a polygon ring
        next: null,
        z: 0, // z-order curve value
        prevZ: null, // previous and next nodes in z-order
        nextZ: null,
        steiner: false // indicates whether this is a steiner point
    };
}

function signedArea(data, start, end, dim) {
    let sum = 0;
    for (let i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}

const Schema$3 = {
    data: {
        value: [
            { x: 0, y: 0 },
            { x: 0, y: 10 },
            { x: 10, y: 10 },
            { x: 10, y: 0 },
        ],
        name: t("wallData"),
        type: DataType.Vector3Array,
        description: "Wall outline points in 3D space",
        required: true,
        group: "geometry",
    },
    height: {
        value: 2.6,
        name: t("wallHeight"),
        type: DataType.Number,
        description: "Height of the wall in meters",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "m",
        required: true,
        group: "geometry",
    },
    depth: {
        value: 0.3,
        name: t("wallDepth"),
        type: DataType.Number,
        description: "Thickness of the wall in meters",
        min: 0.05,
        max: 2.0,
        step: 0.05,
        unit: "m",
        required: true,
        group: "geometry",
    },
    topColor: {
        value: "#dbdee5",
        name: t("wallTopColor"),
        type: DataType.Color,
        description: "Color of the wall top surface",
        group: "appearance",
    },
    bottomColor: {
        value: "#ffffff",
        name: t("wallBottomColor"),
        type: DataType.Color,
        description: "Color of the wall bottom surface",
        group: "appearance",
    },
    interiorColor: {
        value: "#efefef",
        name: t("wallInteriorColor"),
        type: DataType.Color,
        description: "Color of the interior wall surface",
        group: "appearance",
    },
    exteriorColor: {
        value: "#dce8e9",
        name: t("wallExteriorColor"),
        type: DataType.Color,
        description: "Color of the exterior wall surface",
        group: "appearance",
    },
    exteriorTexture: {
        value: {
            map: "wall/exterior-wall.png",
            repeat: [15, 2],
        },
        name: t("wallExteriorTexture"),
        type: DataType.Object,
        description: "Texture for the exterior wall surface",
        group: "textures",
    },
    interiorTexture: {
        value: {
            map: "wall/interior-wall.jpg",
            repeat: [5, 1],
        },
        name: t("wallInteriorTexture"),
        type: DataType.Object,
        description: "Texture for the interior wall surface",
        group: "textures",
    },
    floorTexture: {
        value: {
            map: "wall/floor.jpg",
            repeat: [15, 15],
        },
        name: t("wallInteriorTexture"),
        type: DataType.Object,
        description: "Texture for the floor surface",
        group: "textures",
    },
    roofTexture: {
        value: {
            map: "wall/roof.jpg",
            repeat: [5, 5],
        },
        name: t("roofTexture"),
        type: DataType.Object,
        description: "Texture for the roof surface",
        group: "textures",
    },
    transparent: {
        value: false,
        name: t("transparent"),
        type: DataType.Boolean,
        description: "Whether the wall is transparent",
        group: "appearance",
    },
    opacity: {
        value: 1.0,
        name: t("opacity"),
        type: DataType.Number,
        description: "Opacity of the wall (0.0 to 1.0)",
        min: 0.0,
        max: 1.0,
        step: 0.1,
        group: "appearance",
    },
    closed: {
        value: true,
        name: t("closed"),
        type: DataType.Boolean,
        description: "Whether the wall forms a closed shape",
        group: "geometry",
    },
};
const assetId$3 = "builder.wall";
const Config$3 = schemaToDefaultConfig(Schema$3);
const creator$2 = async (cfg) => {
    var _a, _b, _c, _d;
    mergeConfig(cfg, Config$3);
    const wallHeight = cfg.height || 2.6;
    const wallDepth = cfg.depth || 0.3;
    let wallData = cfg.data || [];
    const isCW = isClockWise(wallData);
    if (!isCW) {
        wallData = wallData.reverse();
    }
    const isClosed = cfg.closed;
    const topColor = cfg.topColor || 0xdbdee5;
    const bottomColor = cfg.bottomColor || 0xffffff;
    const interiorColor = cfg.interiorColor || 0xefefef;
    const exteriorColor = cfg.exteriorColor || 0xdce8e9;
    const exteriorTexture = cfg.exteriorTexture || {};
    const interiorTexture = cfg.interiorTexture || {};
    const floorTexture = cfg.floorTexture || {};
    const roofTexture = cfg.roofTexture || {};
    const envMap = await loadImage({ map: "env/envmap2.jpg" });
    if (envMap) {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        envMap.colorSpace = THREE.SRGBColorSpace;
    }
    const exteriorWallImage = await loadImage(exteriorTexture);
    if (exteriorWallImage) {
        exteriorWallImage.wrapS = THREE.RepeatWrapping;
        exteriorWallImage.wrapT = THREE.RepeatWrapping;
        exteriorWallImage.repeat.set(...((_a = exteriorTexture.repeat) !== null && _a !== void 0 ? _a : [5, 1]));
    }
    const interiorWallImage = await loadImage(interiorTexture);
    if (interiorWallImage) {
        interiorWallImage.wrapS = THREE.RepeatWrapping;
        interiorWallImage.wrapT = THREE.RepeatWrapping;
        interiorWallImage.repeat.set(...((_b = interiorTexture.repeat) !== null && _b !== void 0 ? _b : [5, 1]));
    }
    const interiorLightmap = await loadImage({ map: "env/interior_lightmap9.jpg" });
    if (interiorLightmap) {
        interiorLightmap.flipY = false;
        interiorLightmap.colorSpace = THREE.SRGBColorSpace;
    }
    const exteriorLightmap = await loadImage({ map: "env/exterior_lightmap9.jpg" });
    if (exteriorLightmap) {
        exteriorLightmap.colorSpace = THREE.SRGBColorSpace;
    }
    const transparent = cfg.transparent || false;
    const opacity = cfg.opacity || "1.0";
    const floorMap = await loadImage(floorTexture);
    if (floorMap) {
        floorMap.wrapS = THREE.RepeatWrapping;
        floorMap.wrapT = THREE.RepeatWrapping;
        floorMap.repeat.set(...((_c = floorTexture.repeat) !== null && _c !== void 0 ? _c : [5, 5]));
    }
    const roofMap = await loadImage(roofTexture);
    if (roofMap) {
        roofMap.wrapS = THREE.RepeatWrapping;
        roofMap.wrapT = THREE.RepeatWrapping;
        roofMap.repeat.set(...((_d = roofTexture.repeat) !== null && _d !== void 0 ? _d : [5, 5]));
    }
    const children = cfg.children || [];
    const wall = new THREE.Group();
    const materialSide = THREE.FrontSide;
    const offset = wallDepth / 2;
    const edges = [];
    let firstEdge = undefined;
    let prevEdge = undefined;
    for (let i = 0; i < wallData.length; i++) {
        const start = wallData[i];
        const isLast = i + 1 === wallData.length;
        if (!isClosed && isLast) {
            break;
        }
        const end = wallData[(i + 1) % wallData.length];
        const edge = {
            current: [start, end],
            children: [],
        };
        for (let c = 0; c < children.length; c++) {
            const child = children[c];
            const pos = child.position;
            if (pointOnLine(new THREE.Vector2(pos.x, pos.z), start, end)) {
                // Handle child elements like doors and windows here
                const obj = await loadAsset(child.id, child);
                // let obj;
                // if (child.type === "SingleDoor") {
                //     obj = createDoor(child);
                // } else if (child.type === "DoubleDoor") {
                //     obj = createDoubleDoor(child);
                // } else if (child.type === "Window") {
                //     obj = createWindow(child);
                // }
                if (obj) {
                    const box = new THREE.Box3().setFromObject(obj);
                    const size = box.getSize(new THREE.Vector3());
                    edge.children.push({
                        size,
                        position: obj.position,
                    });
                    const angle = getAngle(1, 0, end.x - start.x, end.y - start.y);
                    obj.rotateY(angle);
                    wall.add(obj);
                }
            }
        }
        if (i === 0) {
            firstEdge = edge;
        }
        else {
            edge.prev = prevEdge;
            prevEdge.next = edge;
            if (i + 1 == wallData.length) {
                firstEdge.prev = edge;
                edge.next = firstEdge;
            }
        }
        prevEdge = edge;
        edges.push(edge);
    }
    const floorPoints = [];
    for (let i = 0; i < edges.length; i++) {
        const current = edges[i];
        const interiorStartVec = getHalfAngleVector(current.prev, current, offset);
        const interiorEndVec = getHalfAngleVector(current, current.next, offset);
        const exteriorStartVec = getHalfAngleVector(current.prev, current, offset);
        const exteriorEndVec = getHalfAngleVector(current, current.next, offset);
        const v1Start = current.current[0];
        const v1End = current.current[1];
        const interiorStart = new THREE.Vector2(v1Start.x - interiorStartVec.x, v1Start.y - interiorStartVec.y);
        const interiorEnd = new THREE.Vector2(v1End.x - interiorEndVec.x, v1End.y - interiorEndVec.y);
        const exteriorStart = new THREE.Vector2(v1Start.x + exteriorStartVec.x, v1Start.y + exteriorStartVec.y);
        const exteriorEnd = new THREE.Vector2(v1End.x + exteriorEndVec.x, v1End.y + exteriorEndVec.y);
        const interiorMatParam = {
            color: interiorColor,
            specular: new THREE.Color(0.06, 0.06, 0.06),
            side: materialSide,
            transparent,
            opacity,
        };
        if (interiorWallImage) {
            interiorMatParam.map = interiorWallImage;
        }
        if (interiorLightmap) {
            interiorMatParam.lightMap = interiorLightmap;
        }
        const exteriorMatParma = {
            color: exteriorColor,
            specular: new THREE.Color(0.06, 0.06, 0.06),
            side: materialSide,
            transparent,
            opacity,
        };
        if (exteriorWallImage) {
            exteriorMatParma.map = exteriorWallImage;
        }
        if (exteriorLightmap) {
            exteriorMatParma.lightMap = exteriorLightmap;
        }
        const interiorMat = new THREE.MeshPhongMaterial(interiorMatParam);
        const exteriorMat = new THREE.MeshPhongMaterial(exteriorMatParma);
        if (transparent) {
            if (envMap) {
                interiorMat.envMap = envMap;
                exteriorMat.envMap = envMap;
            }
        }
        // interior wall mesh
        wall.add(createMesh([interiorEnd, interiorStart], wallHeight, current.children, interiorMat));
        // exterior wall mesh
        wall.add(createMesh([exteriorStart, exteriorEnd], wallHeight, current.children, exteriorMat));
        const wallBottomPoints = [
            [interiorStart.x, interiorStart.y],
            [interiorEnd.x, interiorEnd.y],
            [exteriorEnd.x, exteriorEnd.y],
            [exteriorStart.x, exteriorStart.y],
        ];
        // wall bottom mesh
        wall.add(createPlaneMesh(wallBottomPoints, 0, new THREE.MeshBasicMaterial({ color: bottomColor, side: materialSide })));
        // wall top mesh
        wall.add(createPlaneMesh(wallBottomPoints.reverse(), // reverse points
        wallHeight, new THREE.MeshBasicMaterial({ color: topColor, side: materialSide })));
        floorPoints.push([exteriorStart.x, exteriorStart.y]);
    }
    const floorMatParams = {
        color: bottomColor,
        side: THREE.DoubleSide,
    };
    if (floorMap) {
        floorMatParams.map = floorMap;
    }
    const roofMatParams = {
        color: bottomColor,
        side: materialSide,
    };
    if (roofMap) {
        roofMatParams.map = roofMap;
    }
    const floorMat = new THREE.MeshBasicMaterial(floorMatParams);
    const roofMat = new THREE.MeshBasicMaterial(roofMatParams);
    const floor = createPlaneMesh(floorPoints, 0, floorMat);
    const roof = createPlaneMesh(floorPoints.reverse(), wallHeight, roofMat);
    wall.add(floor);
    wall.add(roof);
    return wall;
};
const init$4 = () => {
    const summary = {
        assetId: assetId$3,
        name: t("wall"),
        category: "building",
        description: t("wallDesc"),
        thumbnail: getThumbnailPath("wall", "thumbnail.png"),
    };
    register(assetId$3, summary, creator$2, Config$3, Schema$3);
};
function createMesh(edge, height, holes, material) {
    const start = edge[0];
    const end = edge[1];
    const transform = new THREE.Matrix4();
    const invTransform = new THREE.Matrix4();
    computeTransform(start, end, transform, invTransform);
    const points = [
        new THREE.Vector3(start.x, 0, start.y),
        new THREE.Vector3(end.x, 0, end.y),
        new THREE.Vector3(end.x, height, end.y),
        new THREE.Vector3(start.x, height, start.y),
    ].map((v) => v.applyMatrix4(transform));
    const shape = new THREE.Shape([
        new THREE.Vector2(points[0].x, points[0].y),
        new THREE.Vector2(points[1].x, points[1].y),
        new THREE.Vector2(points[2].x, points[2].y),
        new THREE.Vector2(points[3].x, points[3].y),
    ]);
    for (let i = 0; i < holes.length; i++) {
        const hole = holes[i];
        const size = hole.size;
        const halfSize = new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2);
        const pos = hole.position.clone().applyMatrix4(transform);
        const max = pos.clone().sub(halfSize);
        const min = pos.clone().add(halfSize);
        shape.holes.push(new THREE.Path([
            new THREE.Vector2(min.x, min.y),
            new THREE.Vector2(max.x, min.y),
            new THREE.Vector2(max.x, max.y),
            new THREE.Vector2(min.x, max.y),
        ]));
    }
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.getAttribute("position").applyMatrix4(invTransform);
    const posAttribute = geometry.getAttribute("position");
    const uvs = [];
    const totalDistance = distance(start.x, start.y, end.x, end.y);
    function vertexToUv(vertex) {
        const x = distance(start.x, start.y, vertex.x, vertex.z) / totalDistance;
        const y = vertex.y / height;
        return [x, y];
    }
    for (let i = 0, l = posAttribute.count; i < l; i++) {
        const v = new THREE.Vector3();
        v.fromBufferAttribute(posAttribute, i);
        uvs.push(...vertexToUv(v));
    }
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("uv1", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    geometry.normalizeNormals();
    return new THREE.Mesh(geometry, material);
}
function createPlaneMesh(points, height, material) {
    const vectors = points.map((p) => new THREE.Vector3(p[0], height, p[1]));
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vectors);
    // const index = Earcut.triangulate(points.flat(), []);
    const index = earcut(points.flat(), [], 2);
    if (isClockWise(points.map((p) => new THREE.Vector2(p[0], p[1])))) {
        index.reverse();
    }
    geometry.setIndex(index);
    const uvs = generateUvByVectors(vectors);
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
}
function computeTransform(start, end, outTransform, outInvTransform) {
    const angle = getAngle(1, 0, end.x - start.x, end.y - start.y);
    const tt = new THREE.Matrix4();
    tt.makeTranslation(-start.x, 0, -start.y);
    const tr = new THREE.Matrix4();
    tr.makeRotationY(-angle);
    outTransform.multiplyMatrices(tr, tt);
    outInvTransform.copy(outTransform).invert();
}
function getAngle(x1, y1, x2, y2) {
    const tDot = x1 * x2 + y1 * y2;
    const tDet = x1 * y2 - y1 * x2;
    let tAngle = -Math.atan2(tDet, tDot);
    if (tAngle < 0) {
        tAngle += 2 * Math.PI;
    }
    return tAngle;
}
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function getHalfAngleVector(edge1, edge2, offset) {
    let v1Start, v1End, v2Start, v2End;
    if (edge1) {
        v1Start = edge1.current[0];
        v1End = edge1.current[1];
    }
    else {
        const s = edge2.current[0];
        const e = edge2.current[1];
        v1Start = new THREE.Vector2(s.x - (e.x - s.x), s.y - (e.y - s.y));
        v1End = edge2.current[0];
    }
    if (edge2) {
        v2Start = edge2.current[0];
        v2End = edge2.current[1];
    }
    else {
        const s = edge1.current[0];
        const e = edge1.current[1];
        v2Start = edge1.current[1];
        v2End = new THREE.Vector2(e.x + (e.x - s.x), e.y + (e.y - s.y));
    }
    const theta = getAngle(v1Start.x - v1End.x, v1Start.y - v1End.y, v2End.x - v1End.x, v2End.y - v1End.y);
    // cosine and sine of half angle
    const cs = Math.cos(theta / 2.0);
    const sn = Math.sin(theta / 2.0);
    // rotate v2
    const v2dx = v2End.x - v2Start.x;
    const v2dy = v2End.y - v2Start.y;
    const vx = v2dx * cs - v2dy * sn;
    const vy = v2dx * sn + v2dy * cs;
    // normalize
    const mag = distance(0, 0, vx, vy);
    const desiredMag = offset / sn;
    const scalar = desiredMag / mag;
    return new THREE.Vector2(vx * scalar, vy * scalar);
}
function isClockWise(points) {
    const n = points.length;
    let a = 0.0;
    for (let p = n - 1, q = 0; q < n; p = q++) {
        a += points[p].x * points[q].y - points[q].x * points[p].y;
    }
    return a * 0.5 < 0;
}
function pointOnLine(point, start, end) {
    const v1 = (point.x - start.x) * (end.y - start.y);
    const v2 = (end.x - start.x) * (point.y - start.y);
    return (v1 === v2 &&
        Math.min(start.x, end.x) <= point.x &&
        point.x <= Math.max(start.x, end.x) &&
        Math.min(start.y, end.y) <= point.y &&
        point.y <= Math.max(start.y, end.y));
}
function generateUvByVectors(vectors) {
    const box = new THREE.Box3().setFromPoints(vectors);
    const lenX = box.max.x - box.min.x;
    const lenZ = box.max.z - box.min.z;
    const uvs = [];
    for (let i = 0; i < vectors.length; i++) {
        const vertex = vectors[i];
        uvs.push(vertex.x / lenX, vertex.z / lenZ);
    }
    return uvs;
}

const Schema$2 = {
    data: {
        value: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 10, z: 0 },
            { x: 10, y: 10, z: 0 },
            { x: 10, y: 0, z: 0 },
        ],
        name: t("wallData"),
        type: DataType.Vector3Array,
        description: "Wall outline points in 3D space",
        required: true,
        group: "geometry",
    },
    height: {
        value: 2.6,
        name: t("wallHeight"),
        type: DataType.Number,
        description: "Height of the wall in meters",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "m",
        required: true,
        group: "geometry",
    },
    depth: {
        value: 0.3,
        name: t("wallDepth"),
        type: DataType.Number,
        description: "Thickness of the wall in meters",
        min: 0.05,
        max: 2.0,
        step: 0.05,
        unit: "m",
        required: true,
        group: "geometry",
    },
    topColor: {
        value: "#dbdee5",
        name: t("wallTopColor"),
        type: DataType.Color,
        description: "Color of the wall top surface",
        group: "appearance",
    },
    bottomColor: {
        value: "#ffffff",
        name: t("wallBottomColor"),
        type: DataType.Color,
        description: "Color of the wall bottom surface",
        group: "appearance",
    },
    interiorColor: {
        value: "#efefef",
        name: t("wallInteriorColor"),
        type: DataType.Color,
        description: "Color of the interior wall surface",
        group: "appearance",
    },
    exteriorColor: {
        value: "#dce8e9",
        name: t("wallExteriorColor"),
        type: DataType.Color,
        description: "Color of the exterior wall surface",
        group: "appearance",
    },
    exteriorTexture: {
        value: {
            map: "wall2/exterior-wall.jpg",
            repeat: [15, 1],
        },
        name: t("wallExteriorTexture"),
        type: DataType.Object,
        description: "Texture for the exterior wall surface",
        group: "textures",
    },
    interiorTexture: {
        value: {
            map: "wall2/interior-wall.jpg",
            repeat: [1, 1],
        },
        name: t("wallInteriorTexture"),
        type: DataType.Object,
        description: "Texture for the interior wall surface",
        group: "textures",
    },
    floorTexture: {
        value: {
            map: "wall2/floor.jpg",
            repeat: [15, 15],
        },
        name: t("wallFloorTexture"),
        type: DataType.Object,
        description: "Texture for the floor surface",
        group: "textures",
    },
    roofTexture: {
        value: {
            map: "wall2/roof.jpg",
            repeat: [5, 5],
        },
        name: t("wallRoofTexture"),
        type: DataType.Object,
        description: "Texture for the roof surface",
        group: "textures",
    },
    transparent: {
        value: false,
        name: t("transparent"),
        type: DataType.Boolean,
        description: "Whether the wall is transparent",
        group: "appearance",
    },
    opacity: {
        value: 1.0,
        name: t("opacity"),
        type: DataType.Number,
        description: "Opacity of the wall (0.0 to 1.0)",
        min: 0.0,
        max: 1.0,
        step: 0.1,
        group: "appearance",
    },
    closed: {
        value: true,
        name: t("closed"),
        type: DataType.Boolean,
        description: "Whether the wall forms a closed shape",
        group: "geometry",
    },
};
const assetId$2 = "builder.wall2";
const Config$2 = schemaToDefaultConfig(Schema$2);
const init$3 = () => {
    const summary = {
        assetId: assetId$2,
        name: t("wall2"),
        category: "building",
        description: t("wall2Desc"),
        thumbnail: getThumbnailPath("wall2", "thumbnail.png"),
    };
    copyAndRegister("builder.wall", assetId$2, summary, Config$2, Schema$2);
};

const Schema$1 = {
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
        description: "Position of the window in 3D space",
        group: "transform",
    },
    width: {
        value: 1.2,
        name: t("width"),
        type: DataType.Number,
        description: "Width of the window in meters",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    height: {
        value: 1.5,
        name: t("height"),
        type: DataType.Number,
        description: "Height of the window in meters",
        min: 0.5,
        max: 3.0,
        step: 0.1,
        unit: "m",
        group: "geometry",
    },
    depth: {
        value: 0.36,
        name: t("depth"),
        type: DataType.Number,
        description: "Depth of the window frame in meters",
        min: 0.05,
        max: 1.0,
        step: 0.01,
        unit: "m",
        group: "geometry",
    },
    frameColor: {
        value: "#FEFEFE",
        name: t("frameColor"),
        type: DataType.String,
        description: "Color of the window frame",
        group: "appearance",
    },
    texture: {
        value: {
            map: "window/window.png",
        },
        name: t("texture"),
        type: DataType.Object,
        description: "Texture for the window surface",
        group: "textures",
    },
};
const assetId$1 = "builder.window";
const Config$1 = schemaToDefaultConfig(Schema$1);
const creator$1 = async (cfg) => {
    mergeConfig(cfg, Config$1);
    const envMap = await loadImage({ map: "env/envmap.jpg" });
    if (envMap) {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        envMap.colorSpace = THREE.SRGBColorSpace;
    }
    const width = cfg.width || 1.2;
    const height = cfg.height || 1.5;
    const depth = cfg.depth || 0.36;
    const position = cfg.position || new THREE.Vector3();
    const image = await loadImage(cfg.texture);
    const group = new THREE.Group();
    group.position.set(position.x, position.y, position.z);
    const frameEdge = 0.01;
    const frameColor = cfg.frameColor || 0xfefefe;
    // 窗套
    const cutGeo = new THREE.BoxGeometry(width - frameEdge + 0.02, height - frameEdge / 2 + 0.02, depth + 0.02);
    const cutMat = new THREE.MeshPhongMaterial({ color: frameColor });
    const cutMesh = new Brush(cutGeo, cutMat);
    // scene.add(cutMesh);
    let result;
    const evaluator = new Evaluator();
    // eslint-disable-next-line prefer-const
    result = evaluator.evaluate(cutMesh, new Brush(new THREE.BoxGeometry(width - frameEdge - 0.01, height - frameEdge / 2 - 0.01, depth + 0.02), cutMat), SUBTRACTION, result);
    group.add(result);
    // 窗
    const windowGeo = new THREE.BoxGeometry(width, height, 0.02);
    const uvs = [
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0, //后
    ];
    windowGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const windowMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xffffff),
        map: image,
        transparent: true,
        opacity: 0.3,
    });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    group.add(windowMesh);
    return group;
};
const init$2 = () => {
    const summary = {
        assetId: assetId$1,
        name: t("window"),
        category: "building",
        description: t("windowDesc"),
        thumbnail: getThumbnailPath("window", "thumbnail.png"),
    };
    register(assetId$1, summary, creator$1, Config$1, Schema$1);
};

const init$1 = () => {
    init$c();
    init$7();
    init$6();
    init$4();
    init$3();
    init$2();
    init$9();
    init$b();
    init$a();
    init$8();
    init$5();
};

// import { get } from "http";
const Schema = {
    url: {
        value: "bed/bed.glb",
        name: t("url"),
        type: DataType.String,
    },
    position: {
        value: { x: 0, y: 0, z: 0 },
        name: t("position"),
        type: DataType.Vector3,
    },
    rotation: {
        value: { x: 0, y: 0, z: 0 },
        name: t("rotation"),
        type: DataType.Vector3,
    },
    scale: {
        value: { x: 1, y: 1, z: 1 },
        name: t("scale"),
        type: DataType.Vector3,
    },
};
const assetId = "builder.bed";
const Config = schemaToDefaultConfig(Schema);
const tempBox = new THREE.Box3();
const tempVec3 = new THREE.Vector3();
const creator = async (cfg) => {
    mergeConfig(cfg, Config);
    // just a pivot group
    const group = new THREE.Group();
    const object = (await loadModel(cfg.url));
    const bbox = tempBox.setFromObject(object);
    const center = bbox.getCenter(tempVec3);
    group.applyMatrix4(new THREE.Matrix4().makeTranslation(center.negate()));
    group.add(object);
    const position = cfg.position || new THREE.Vector3();
    const rotation = cfg.rotation || new THREE.Euler();
    const scale = cfg.scale || new THREE.Vector3(1, 1, 1);
    group.position.set(position.x, position.y, position.z);
    group.rotation.set(rotation.x, rotation.y, rotation.z);
    group.scale.set(scale.x, scale.y, scale.z);
    return group;
};
const init = () => {
    const summary = {
        assetId,
        name: t("bed"),
        category: "furniture",
        description: t("bedDesc"),
        thumbnail: getThumbnailPath("bed", "thumbnail.png"),
    };
    register(assetId, summary, creator, Config, Schema);
};

/**
 * The Ease class provides a collection of easing functions for use with tween.js.
 */
var Easing = Object.freeze({
    Linear: Object.freeze({
        None: function (amount) {
            return amount;
        },
        In: function (amount) {
            return amount;
        },
        Out: function (amount) {
            return amount;
        },
        InOut: function (amount) {
            return amount;
        },
    }),
    Quadratic: Object.freeze({
        In: function (amount) {
            return amount * amount;
        },
        Out: function (amount) {
            return amount * (2 - amount);
        },
        InOut: function (amount) {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount;
            }
            return -0.5 * (--amount * (amount - 2) - 1);
        },
    }),
    Cubic: Object.freeze({
        In: function (amount) {
            return amount * amount * amount;
        },
        Out: function (amount) {
            return --amount * amount * amount + 1;
        },
        InOut: function (amount) {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount * amount;
            }
            return 0.5 * ((amount -= 2) * amount * amount + 2);
        },
    }),
    Quartic: Object.freeze({
        In: function (amount) {
            return amount * amount * amount * amount;
        },
        Out: function (amount) {
            return 1 - --amount * amount * amount * amount;
        },
        InOut: function (amount) {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount * amount * amount;
            }
            return -0.5 * ((amount -= 2) * amount * amount * amount - 2);
        },
    }),
    Quintic: Object.freeze({
        In: function (amount) {
            return amount * amount * amount * amount * amount;
        },
        Out: function (amount) {
            return --amount * amount * amount * amount * amount + 1;
        },
        InOut: function (amount) {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount * amount * amount * amount;
            }
            return 0.5 * ((amount -= 2) * amount * amount * amount * amount + 2);
        },
    }),
    Sinusoidal: Object.freeze({
        In: function (amount) {
            return 1 - Math.sin(((1.0 - amount) * Math.PI) / 2);
        },
        Out: function (amount) {
            return Math.sin((amount * Math.PI) / 2);
        },
        InOut: function (amount) {
            return 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)));
        },
    }),
    Exponential: Object.freeze({
        In: function (amount) {
            return amount === 0 ? 0 : Math.pow(1024, amount - 1);
        },
        Out: function (amount) {
            return amount === 1 ? 1 : 1 - Math.pow(2, -10 * amount);
        },
        InOut: function (amount) {
            if (amount === 0) {
                return 0;
            }
            if (amount === 1) {
                return 1;
            }
            if ((amount *= 2) < 1) {
                return 0.5 * Math.pow(1024, amount - 1);
            }
            return 0.5 * (-Math.pow(2, -10 * (amount - 1)) + 2);
        },
    }),
    Circular: Object.freeze({
        In: function (amount) {
            return 1 - Math.sqrt(1 - amount * amount);
        },
        Out: function (amount) {
            return Math.sqrt(1 - --amount * amount);
        },
        InOut: function (amount) {
            if ((amount *= 2) < 1) {
                return -0.5 * (Math.sqrt(1 - amount * amount) - 1);
            }
            return 0.5 * (Math.sqrt(1 - (amount -= 2) * amount) + 1);
        },
    }),
    Elastic: Object.freeze({
        In: function (amount) {
            if (amount === 0) {
                return 0;
            }
            if (amount === 1) {
                return 1;
            }
            return -Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI);
        },
        Out: function (amount) {
            if (amount === 0) {
                return 0;
            }
            if (amount === 1) {
                return 1;
            }
            return Math.pow(2, -10 * amount) * Math.sin((amount - 0.1) * 5 * Math.PI) + 1;
        },
        InOut: function (amount) {
            if (amount === 0) {
                return 0;
            }
            if (amount === 1) {
                return 1;
            }
            amount *= 2;
            if (amount < 1) {
                return -0.5 * Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI);
            }
            return 0.5 * Math.pow(2, -10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI) + 1;
        },
    }),
    Back: Object.freeze({
        In: function (amount) {
            var s = 1.70158;
            return amount === 1 ? 1 : amount * amount * ((s + 1) * amount - s);
        },
        Out: function (amount) {
            var s = 1.70158;
            return amount === 0 ? 0 : --amount * amount * ((s + 1) * amount + s) + 1;
        },
        InOut: function (amount) {
            var s = 1.70158 * 1.525;
            if ((amount *= 2) < 1) {
                return 0.5 * (amount * amount * ((s + 1) * amount - s));
            }
            return 0.5 * ((amount -= 2) * amount * ((s + 1) * amount + s) + 2);
        },
    }),
    Bounce: Object.freeze({
        In: function (amount) {
            return 1 - Easing.Bounce.Out(1 - amount);
        },
        Out: function (amount) {
            if (amount < 1 / 2.75) {
                return 7.5625 * amount * amount;
            }
            else if (amount < 2 / 2.75) {
                return 7.5625 * (amount -= 1.5 / 2.75) * amount + 0.75;
            }
            else if (amount < 2.5 / 2.75) {
                return 7.5625 * (amount -= 2.25 / 2.75) * amount + 0.9375;
            }
            else {
                return 7.5625 * (amount -= 2.625 / 2.75) * amount + 0.984375;
            }
        },
        InOut: function (amount) {
            if (amount < 0.5) {
                return Easing.Bounce.In(amount * 2) * 0.5;
            }
            return Easing.Bounce.Out(amount * 2 - 1) * 0.5 + 0.5;
        },
    }),
    generatePow: function (power) {
        if (power === void 0) { power = 4; }
        power = power < Number.EPSILON ? Number.EPSILON : power;
        power = power > 10000 ? 10000 : power;
        return {
            In: function (amount) {
                return Math.pow(amount, power);
            },
            Out: function (amount) {
                return 1 - Math.pow((1 - amount), power);
            },
            InOut: function (amount) {
                if (amount < 0.5) {
                    return Math.pow((amount * 2), power) / 2;
                }
                return (1 - Math.pow((2 - amount * 2), power)) / 2 + 0.5;
            },
        };
    },
});

var now = function () { return performance.now(); };

/**
 * Controlling groups of tweens
 *
 * Using the TWEEN singleton to manage your tweens can cause issues in large apps with many components.
 * In these cases, you may want to create your own smaller groups of tween
 */
var Group = /** @class */ (function () {
    function Group() {
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tweens[_i] = arguments[_i];
        }
        this._tweens = {};
        this._tweensAddedDuringUpdate = {};
        this.add.apply(this, tweens);
    }
    Group.prototype.getAll = function () {
        var _this = this;
        return Object.keys(this._tweens).map(function (tweenId) { return _this._tweens[tweenId]; });
    };
    Group.prototype.removeAll = function () {
        this._tweens = {};
    };
    Group.prototype.add = function () {
        var _a;
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tweens[_i] = arguments[_i];
        }
        for (var _b = 0, tweens_1 = tweens; _b < tweens_1.length; _b++) {
            var tween = tweens_1[_b];
            // Remove from any other group first, a tween can only be in one group at a time.
            // @ts-expect-error library internal access
            (_a = tween._group) === null || _a === void 0 ? void 0 : _a.remove(tween);
            // @ts-expect-error library internal access
            tween._group = this;
            this._tweens[tween.getId()] = tween;
            this._tweensAddedDuringUpdate[tween.getId()] = tween;
        }
    };
    Group.prototype.remove = function () {
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tweens[_i] = arguments[_i];
        }
        for (var _a = 0, tweens_2 = tweens; _a < tweens_2.length; _a++) {
            var tween = tweens_2[_a];
            // @ts-expect-error library internal access
            tween._group = undefined;
            delete this._tweens[tween.getId()];
            delete this._tweensAddedDuringUpdate[tween.getId()];
        }
    };
    /** Return true if all tweens in the group are not paused or playing. */
    Group.prototype.allStopped = function () {
        return this.getAll().every(function (tween) { return !tween.isPlaying(); });
    };
    Group.prototype.update = function (time, preserve) {
        if (time === void 0) { time = now(); }
        if (preserve === void 0) { preserve = true; }
        var tweenIds = Object.keys(this._tweens);
        if (tweenIds.length === 0)
            return;
        // Tweens are updated in "batches". If you add a new tween during an
        // update, then the new tween will be updated in the next batch.
        // If you remove a tween during an update, it may or may not be updated.
        // However, if the removed tween was added during the current batch,
        // then it will not be updated.
        while (tweenIds.length > 0) {
            this._tweensAddedDuringUpdate = {};
            for (var i = 0; i < tweenIds.length; i++) {
                var tween = this._tweens[tweenIds[i]];
                var autoStart = !preserve;
                if (tween && tween.update(time, autoStart) === false && !preserve)
                    this.remove(tween);
            }
            tweenIds = Object.keys(this._tweensAddedDuringUpdate);
        }
    };
    return Group;
}());

/**
 *
 */
var Interpolation = {
    Linear: function (v, k) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = Interpolation.Utils.Linear;
        if (k < 0) {
            return fn(v[0], v[1], f);
        }
        if (k > 1) {
            return fn(v[m], v[m - 1], m - f);
        }
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },
    Bezier: function (v, k) {
        var b = 0;
        var n = v.length - 1;
        var pw = Math.pow;
        var bn = Interpolation.Utils.Bernstein;
        for (var i = 0; i <= n; i++) {
            b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
        }
        return b;
    },
    CatmullRom: function (v, k) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = Interpolation.Utils.CatmullRom;
        if (v[0] === v[m]) {
            if (k < 0) {
                i = Math.floor((f = m * (1 + k)));
            }
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        }
        else {
            if (k < 0) {
                return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
            }
            if (k > 1) {
                return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
            }
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    },
    Utils: {
        Linear: function (p0, p1, t) {
            return (p1 - p0) * t + p0;
        },
        Bernstein: function (n, i) {
            var fc = Interpolation.Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },
        Factorial: (function () {
            var a = [1];
            return function (n) {
                var s = 1;
                if (a[n]) {
                    return a[n];
                }
                for (var i = n; i > 1; i--) {
                    s *= i;
                }
                a[n] = s;
                return s;
            };
        })(),
        CatmullRom: function (p0, p1, p2, p3, t) {
            var v0 = (p2 - p0) * 0.5;
            var v1 = (p3 - p1) * 0.5;
            var t2 = t * t;
            var t3 = t * t2;
            return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
        },
    },
};

/**
 * Utils
 */
var Sequence = /** @class */ (function () {
    function Sequence() {
    }
    Sequence.nextId = function () {
        return Sequence._nextId++;
    };
    Sequence._nextId = 0;
    return Sequence;
}());

var mainGroup = new Group();

/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */
var Tween = /** @class */ (function () {
    function Tween(object, group) {
        this._isPaused = false;
        this._pauseStart = 0;
        this._valuesStart = {};
        this._valuesEnd = {};
        this._valuesStartRepeat = {};
        this._duration = 1000;
        this._isDynamic = false;
        this._initialRepeat = 0;
        this._repeat = 0;
        this._yoyo = false;
        this._isPlaying = false;
        this._reversed = false;
        this._delayTime = 0;
        this._startTime = 0;
        this._easingFunction = Easing.Linear.None;
        this._interpolationFunction = Interpolation.Linear;
        // eslint-disable-next-line
        this._chainedTweens = [];
        this._onStartCallbackFired = false;
        this._onEveryStartCallbackFired = false;
        this._id = Sequence.nextId();
        this._isChainStopped = false;
        this._propertiesAreSetUp = false;
        this._goToEnd = false;
        this._object = object;
        if (typeof group === 'object') {
            this._group = group;
            group.add(this);
        }
        // Use "true" to restore old behavior (will be removed in future release).
        else if (group === true) {
            this._group = mainGroup;
            mainGroup.add(this);
        }
    }
    Tween.prototype.getId = function () {
        return this._id;
    };
    Tween.prototype.isPlaying = function () {
        return this._isPlaying;
    };
    Tween.prototype.isPaused = function () {
        return this._isPaused;
    };
    Tween.prototype.getDuration = function () {
        return this._duration;
    };
    Tween.prototype.to = function (target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (this._isPlaying)
            throw new Error('Can not call Tween.to() while Tween is already started or paused. Stop the Tween first.');
        this._valuesEnd = target;
        this._propertiesAreSetUp = false;
        this._duration = duration < 0 ? 0 : duration;
        return this;
    };
    Tween.prototype.duration = function (duration) {
        if (duration === void 0) { duration = 1000; }
        this._duration = duration < 0 ? 0 : duration;
        return this;
    };
    Tween.prototype.dynamic = function (dynamic) {
        if (dynamic === void 0) { dynamic = false; }
        this._isDynamic = dynamic;
        return this;
    };
    Tween.prototype.start = function (time, overrideStartingValues) {
        if (time === void 0) { time = now(); }
        if (overrideStartingValues === void 0) { overrideStartingValues = false; }
        if (this._isPlaying) {
            return this;
        }
        this._repeat = this._initialRepeat;
        if (this._reversed) {
            // If we were reversed (f.e. using the yoyo feature) then we need to
            // flip the tween direction back to forward.
            this._reversed = false;
            for (var property in this._valuesStartRepeat) {
                this._swapEndStartRepeatValues(property);
                this._valuesStart[property] = this._valuesStartRepeat[property];
            }
        }
        this._isPlaying = true;
        this._isPaused = false;
        this._onStartCallbackFired = false;
        this._onEveryStartCallbackFired = false;
        this._isChainStopped = false;
        this._startTime = time;
        this._startTime += this._delayTime;
        if (!this._propertiesAreSetUp || overrideStartingValues) {
            this._propertiesAreSetUp = true;
            // If dynamic is not enabled, clone the end values instead of using the passed-in end values.
            if (!this._isDynamic) {
                var tmp = {};
                for (var prop in this._valuesEnd)
                    tmp[prop] = this._valuesEnd[prop];
                this._valuesEnd = tmp;
            }
            this._setupProperties(this._object, this._valuesStart, this._valuesEnd, this._valuesStartRepeat, overrideStartingValues);
        }
        return this;
    };
    Tween.prototype.startFromCurrentValues = function (time) {
        return this.start(time, true);
    };
    Tween.prototype._setupProperties = function (_object, _valuesStart, _valuesEnd, _valuesStartRepeat, overrideStartingValues) {
        for (var property in _valuesEnd) {
            var startValue = _object[property];
            var startValueIsArray = Array.isArray(startValue);
            var propType = startValueIsArray ? 'array' : typeof startValue;
            var isInterpolationList = !startValueIsArray && Array.isArray(_valuesEnd[property]);
            // If `to()` specifies a property that doesn't exist in the source object,
            // we should not set that property in the object
            if (propType === 'undefined' || propType === 'function') {
                continue;
            }
            // Check if an Array was provided as property value
            if (isInterpolationList) {
                var endValues = _valuesEnd[property];
                if (endValues.length === 0) {
                    continue;
                }
                // Handle an array of relative values.
                // Creates a local copy of the Array with the start value at the front
                var temp = [startValue];
                for (var i = 0, l = endValues.length; i < l; i += 1) {
                    var value = this._handleRelativeValue(startValue, endValues[i]);
                    if (isNaN(value)) {
                        isInterpolationList = false;
                        console.warn('Found invalid interpolation list. Skipping.');
                        break;
                    }
                    temp.push(value);
                }
                if (isInterpolationList) {
                    // if (_valuesStart[property] === undefined) { // handle end values only the first time. NOT NEEDED? setupProperties is now guarded by _propertiesAreSetUp.
                    _valuesEnd[property] = temp;
                    // }
                }
            }
            // handle the deepness of the values
            if ((propType === 'object' || startValueIsArray) && startValue && !isInterpolationList) {
                _valuesStart[property] = startValueIsArray ? [] : {};
                var nestedObject = startValue;
                for (var prop in nestedObject) {
                    _valuesStart[property][prop] = nestedObject[prop];
                }
                // TODO? repeat nested values? And yoyo? And array values?
                _valuesStartRepeat[property] = startValueIsArray ? [] : {};
                var endValues = _valuesEnd[property];
                // If dynamic is not enabled, clone the end values instead of using the passed-in end values.
                if (!this._isDynamic) {
                    var tmp = {};
                    for (var prop in endValues)
                        tmp[prop] = endValues[prop];
                    _valuesEnd[property] = endValues = tmp;
                }
                this._setupProperties(nestedObject, _valuesStart[property], endValues, _valuesStartRepeat[property], overrideStartingValues);
            }
            else {
                // Save the starting value, but only once unless override is requested.
                if (typeof _valuesStart[property] === 'undefined' || overrideStartingValues) {
                    _valuesStart[property] = startValue;
                }
                if (!startValueIsArray) {
                    // eslint-disable-next-line
                    // @ts-ignore FIXME?
                    _valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
                }
                if (isInterpolationList) {
                    // eslint-disable-next-line
                    // @ts-ignore FIXME?
                    _valuesStartRepeat[property] = _valuesEnd[property].slice().reverse();
                }
                else {
                    _valuesStartRepeat[property] = _valuesStart[property] || 0;
                }
            }
        }
    };
    Tween.prototype.stop = function () {
        if (!this._isChainStopped) {
            this._isChainStopped = true;
            this.stopChainedTweens();
        }
        if (!this._isPlaying) {
            return this;
        }
        this._isPlaying = false;
        this._isPaused = false;
        if (this._onStopCallback) {
            this._onStopCallback(this._object);
        }
        return this;
    };
    Tween.prototype.end = function () {
        this._goToEnd = true;
        this.update(this._startTime + this._duration);
        return this;
    };
    Tween.prototype.pause = function (time) {
        if (time === void 0) { time = now(); }
        if (this._isPaused || !this._isPlaying) {
            return this;
        }
        this._isPaused = true;
        this._pauseStart = time;
        return this;
    };
    Tween.prototype.resume = function (time) {
        if (time === void 0) { time = now(); }
        if (!this._isPaused || !this._isPlaying) {
            return this;
        }
        this._isPaused = false;
        this._startTime += time - this._pauseStart;
        this._pauseStart = 0;
        return this;
    };
    Tween.prototype.stopChainedTweens = function () {
        for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
            this._chainedTweens[i].stop();
        }
        return this;
    };
    Tween.prototype.group = function (group) {
        if (!group) {
            console.warn('tween.group() without args has been removed, use group.add(tween) instead.');
            return this;
        }
        group.add(this);
        return this;
    };
    /**
     * Removes the tween from whichever group it is in.
     */
    Tween.prototype.remove = function () {
        var _a;
        (_a = this._group) === null || _a === void 0 ? void 0 : _a.remove(this);
        return this;
    };
    Tween.prototype.delay = function (amount) {
        if (amount === void 0) { amount = 0; }
        this._delayTime = amount;
        return this;
    };
    Tween.prototype.repeat = function (times) {
        if (times === void 0) { times = 0; }
        this._initialRepeat = times;
        this._repeat = times;
        return this;
    };
    Tween.prototype.repeatDelay = function (amount) {
        this._repeatDelayTime = amount;
        return this;
    };
    Tween.prototype.yoyo = function (yoyo) {
        if (yoyo === void 0) { yoyo = false; }
        this._yoyo = yoyo;
        return this;
    };
    Tween.prototype.easing = function (easingFunction) {
        if (easingFunction === void 0) { easingFunction = Easing.Linear.None; }
        this._easingFunction = easingFunction;
        return this;
    };
    Tween.prototype.interpolation = function (interpolationFunction) {
        if (interpolationFunction === void 0) { interpolationFunction = Interpolation.Linear; }
        this._interpolationFunction = interpolationFunction;
        return this;
    };
    // eslint-disable-next-line
    Tween.prototype.chain = function () {
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tweens[_i] = arguments[_i];
        }
        this._chainedTweens = tweens;
        return this;
    };
    Tween.prototype.onStart = function (callback) {
        this._onStartCallback = callback;
        return this;
    };
    Tween.prototype.onEveryStart = function (callback) {
        this._onEveryStartCallback = callback;
        return this;
    };
    Tween.prototype.onUpdate = function (callback) {
        this._onUpdateCallback = callback;
        return this;
    };
    Tween.prototype.onRepeat = function (callback) {
        this._onRepeatCallback = callback;
        return this;
    };
    Tween.prototype.onComplete = function (callback) {
        this._onCompleteCallback = callback;
        return this;
    };
    Tween.prototype.onStop = function (callback) {
        this._onStopCallback = callback;
        return this;
    };
    /**
     * @returns true if the tween is still playing after the update, false
     * otherwise (calling update on a paused tween still returns true because
     * it is still playing, just paused).
     *
     * @param autoStart - When true, calling update will implicitly call start()
     * as well. Note, if you stop() or end() the tween, but are still calling
     * update(), it will start again!
     */
    Tween.prototype.update = function (time, autoStart) {
        var _this = this;
        var _a;
        if (time === void 0) { time = now(); }
        if (autoStart === void 0) { autoStart = Tween.autoStartOnUpdate; }
        if (this._isPaused)
            return true;
        var property;
        if (!this._goToEnd && !this._isPlaying) {
            if (autoStart)
                this.start(time, true);
            else
                return false;
        }
        this._goToEnd = false;
        if (time < this._startTime) {
            return true;
        }
        if (this._onStartCallbackFired === false) {
            if (this._onStartCallback) {
                this._onStartCallback(this._object);
            }
            this._onStartCallbackFired = true;
        }
        if (this._onEveryStartCallbackFired === false) {
            if (this._onEveryStartCallback) {
                this._onEveryStartCallback(this._object);
            }
            this._onEveryStartCallbackFired = true;
        }
        var elapsedTime = time - this._startTime;
        var durationAndDelay = this._duration + ((_a = this._repeatDelayTime) !== null && _a !== void 0 ? _a : this._delayTime);
        var totalTime = this._duration + this._repeat * durationAndDelay;
        var calculateElapsedPortion = function () {
            if (_this._duration === 0)
                return 1;
            if (elapsedTime > totalTime) {
                return 1;
            }
            var timesRepeated = Math.trunc(elapsedTime / durationAndDelay);
            var timeIntoCurrentRepeat = elapsedTime - timesRepeated * durationAndDelay;
            // TODO use %?
            // const timeIntoCurrentRepeat = elapsedTime % durationAndDelay
            var portion = Math.min(timeIntoCurrentRepeat / _this._duration, 1);
            if (portion === 0 && elapsedTime === _this._duration) {
                return 1;
            }
            return portion;
        };
        var elapsed = calculateElapsedPortion();
        var value = this._easingFunction(elapsed);
        // properties transformations
        this._updateProperties(this._object, this._valuesStart, this._valuesEnd, value);
        if (this._onUpdateCallback) {
            this._onUpdateCallback(this._object, elapsed);
        }
        if (this._duration === 0 || elapsedTime >= this._duration) {
            if (this._repeat > 0) {
                var completeCount = Math.min(Math.trunc((elapsedTime - this._duration) / durationAndDelay) + 1, this._repeat);
                if (isFinite(this._repeat)) {
                    this._repeat -= completeCount;
                }
                // Reassign starting values, restart by making startTime = now
                for (property in this._valuesStartRepeat) {
                    if (!this._yoyo && typeof this._valuesEnd[property] === 'string') {
                        this._valuesStartRepeat[property] =
                            // eslint-disable-next-line
                            // @ts-ignore FIXME?
                            this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property]);
                    }
                    if (this._yoyo) {
                        this._swapEndStartRepeatValues(property);
                    }
                    this._valuesStart[property] = this._valuesStartRepeat[property];
                }
                if (this._yoyo) {
                    this._reversed = !this._reversed;
                }
                this._startTime += durationAndDelay * completeCount;
                if (this._onRepeatCallback) {
                    this._onRepeatCallback(this._object);
                }
                this._onEveryStartCallbackFired = false;
                return true;
            }
            else {
                if (this._onCompleteCallback) {
                    this._onCompleteCallback(this._object);
                }
                for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
                    // Make the chained tweens start exactly at the time they should,
                    // even if the `update()` method was called way past the duration of the tween
                    this._chainedTweens[i].start(this._startTime + this._duration, false);
                }
                this._isPlaying = false;
                return false;
            }
        }
        return true;
    };
    Tween.prototype._updateProperties = function (_object, _valuesStart, _valuesEnd, value) {
        for (var property in _valuesEnd) {
            // Don't update properties that do not exist in the source object
            if (_valuesStart[property] === undefined) {
                continue;
            }
            var start = _valuesStart[property] || 0;
            var end = _valuesEnd[property];
            var startIsArray = Array.isArray(_object[property]);
            var endIsArray = Array.isArray(end);
            var isInterpolationList = !startIsArray && endIsArray;
            if (isInterpolationList) {
                _object[property] = this._interpolationFunction(end, value);
            }
            else if (typeof end === 'object' && end) {
                // eslint-disable-next-line
                // @ts-ignore FIXME?
                this._updateProperties(_object[property], start, end, value);
            }
            else {
                // Parses relative end values with start as base (e.g.: +10, -3)
                end = this._handleRelativeValue(start, end);
                // Protect against non numeric properties.
                if (typeof end === 'number') {
                    // eslint-disable-next-line
                    // @ts-ignore FIXME?
                    _object[property] = start + (end - start) * value;
                }
            }
        }
    };
    Tween.prototype._handleRelativeValue = function (start, end) {
        if (typeof end !== 'string') {
            return end;
        }
        if (end.charAt(0) === '+' || end.charAt(0) === '-') {
            return start + parseFloat(end);
        }
        return parseFloat(end);
    };
    Tween.prototype._swapEndStartRepeatValues = function (property) {
        var tmp = this._valuesStartRepeat[property];
        var endValue = this._valuesEnd[property];
        if (typeof endValue === 'string') {
            this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(endValue);
        }
        else {
            this._valuesStartRepeat[property] = this._valuesEnd[property];
        }
        this._valuesEnd[property] = tmp;
    };
    Tween.autoStartOnUpdate = false;
    return Tween;
}());
/**
 * Controlling groups of tweens
 *
 * Using the TWEEN singleton to manage your tweens can cause issues in large apps with many components.
 * In these cases, you may want to create your own smaller groups of tweens.
 */
var TWEEN = mainGroup;
// This is the best way to export things in a way that's compatible with both ES
// Modules and CommonJS, without build hacks, and so as not to break the
// existing API.
// https://github.com/rollup/rollup/issues/1961#issuecomment-423037881
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */
TWEEN.getAll.bind(TWEEN);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */
TWEEN.removeAll.bind(TWEEN);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */
TWEEN.add.bind(TWEEN);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */
TWEEN.remove.bind(TWEEN);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */
TWEEN.update.bind(TWEEN);

const group = new Group();
function playAnimate(object) {
    const animation = object.userData.animation;
    if (!animation) {
        return;
    }
    const animatInfo = object.userData.animation.split(":");
    const anchor = animatInfo[1];
    const rotationAngle = parseInt(animatInfo[2]);
    const during = parseInt(animatInfo[3]);
    animateRotate(object, anchor, rotationAngle, during);
}
function animateRotate(object, anchor, angle, during) {
    const size = new THREE.Vector3();
    // @ts-ignore
    object.geometry.computeBoundingBox();
    // @ts-ignore
    object.geometry.boundingBox.getSize(size);
    const pivotPoint = new THREE.Vector3();
    const rotationAxis = new THREE.Vector3();
    if (anchor === "left") {
        pivotPoint.set(-size.x / 2, 0, 0);
        rotationAxis.set(0, 1, 0);
    }
    else if (anchor === "right") {
        pivotPoint.set(size.x / 2, 0, 0);
        rotationAxis.set(0, 1, 0);
    }
    pivotPoint.applyMatrix4(object.matrix);
    rotationAxis.applyMatrix4(new THREE.Matrix4().extractRotation(object.matrix));
    const from = 0;
    let to = 1;
    if (object.userData.animated) {
        to = -1;
    }
    object.userData.animated = !object.userData.animated;
    let lastValue = 0;
    const tween = new Tween({ x: from })
        .to({ x: to }, during)
        .easing(Easing.Bounce.Out)
        .onUpdate(function (v) {
        const tm = new THREE.Matrix4().setPosition(pivotPoint);
        const rm = new THREE.Matrix4();
        rm.makeRotationAxis(rotationAxis, THREE.MathUtils.degToRad(-angle) * (v.x - lastValue));
        tm.multiply(rm);
        const tmm = new THREE.Matrix4().setPosition(pivotPoint.clone().negate());
        tm.multiply(tmm);
        object.applyMatrix4(tm);
        lastValue = v.x;
    })
        .onComplete(() => {
        tween.remove();
    })
        .start();
    group.add(tween);
}
function updateAnimate(time) {
    group.update(time);
}

const initSystemAssets = () => {
    init$f();
    init();
    init$1();
    init$d();
};

export { DataType, assetMap, changeLanguage, copyAndRegister, getAssetCreator, getAssetInfo, getAssetInfoList, getModelAssetPath, getThumbnailPath, group, initSystemAssets, isAbsoluteUrl, isDDSImage, isTGAImage, loadAsset, loadImage, loadModel, loadingManager, mergeConfig, playAnimate, register, schemaToDefaultConfig, setModelAssetPath, t, updateAnimate };
