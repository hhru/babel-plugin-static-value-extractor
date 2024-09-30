"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.extractStaticValueImportedFilesFromFile = exports.extractStaticValueFromFile = exports.prepareCache = exports.traceToPageComponent = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var babylon = _interopRequireWildcard(require("@babel/parser"));
var _traverse = _interopRequireDefault(require("@babel/traverse"));
var _globAll = _interopRequireDefault(require("glob-all"));
var _traverser = _interopRequireDefault(require("./traverser"));
var _persistentCache = require("./persistentCache");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) { if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } } return n["default"] = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) { n[e] = r[e]; } return n; }
var ENCODING = 'utf8';
var BABEL_PARSING_OPTS = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript', 'doExpressions', 'objectRestSpread', 'decorators-legacy', 'classProperties', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport', 'optionalChaining']
};
var noop = function noop() {};
var extractStaticValueFromCode = function extractStaticValueFromCode(code) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  try {
    var ast = babylon.parse(code.toString(ENCODING), BABEL_PARSING_OPTS);
    var traverser = (0, _traverser["default"])(cb, opts);
    (0, _traverse["default"])(ast, traverser);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(error);
    } else {
      throw error;
    }
  }
};
var cachedFiles = (0, _persistentCache.getPersistentCache)();
var traceToPageComponent = function traceToPageComponent(file) {
  var parents = [file];
  var nextParents = [];
  var pageComponents = [];
  while (parents.length > 0) {
    parents.forEach(function (file) {
      var _nextParents;
      var reverseImports = cachedFiles[file].reverseImports;
      reverseImports === null ? pageComponents.push(file) : (_nextParents = nextParents).push.apply(_nextParents, _toConsumableArray(reverseImports));
    });
    parents = _toConsumableArray(new Set(nextParents));
    nextParents = [];
  }
  return pageComponents;
};
exports.traceToPageComponent = traceToPageComponent;
var invalidateFileCache = function invalidateFileCache(filePath, staleCacheEntriesSet) {
  var cacheEntry = cachedFiles[filePath];
  cacheEntry.importsDeclarations.forEach(function (file) {
    if (cachedFiles[file] && cachedFiles[file].reverseImports) {
      cachedFiles[file].reverseImports = cachedFiles[file].reverseImports.filter(function (file) {
        return file !== filePath;
      });
    }
  });
  cacheEntry.reverseImports && cacheEntry.reverseImports.forEach(function (file) {
    return staleCacheEntriesSet.add(file);
  });
  staleCacheEntriesSet.add(filePath);
};
var prepareCache = function prepareCache(opts) {
  var basePath = opts.basePath;
  var changedFiles = [];
  Object.keys(cachedFiles).forEach(function (filePath) {
    var cachedMtime = cachedFiles[filePath].cachedMtime;
    var fullPath = _path["default"].join(basePath, filePath);
    if (!_fs["default"].existsSync(fullPath) || cachedMtime !== _fs["default"].statSync(fullPath).mtimeMs) {
      changedFiles.push(filePath);
    }
  });
  var staleCacheEntries = new Set();
  var changedPageComponents = [];
  changedFiles.forEach(function (filePath) {
    invalidateFileCache(filePath, staleCacheEntries);
    changedPageComponents.push.apply(changedPageComponents, _toConsumableArray(traceToPageComponent(filePath)));
  });
  new Set(changedPageComponents).forEach(function (filePath) {
    return invalidateFileCache(filePath, staleCacheEntries);
  });
  staleCacheEntries.forEach(function (filePath) {
    return delete cachedFiles[filePath];
  });
  (0, _persistentCache.savePersistentCache)(cachedFiles);
};
exports.prepareCache = prepareCache;
var extractStaticValueFromFile = function extractStaticValueFromFile(file) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  extractStaticValueFromCode(_fs["default"].readFileSync(file), _objectSpread({}, opts, {
    filename: file
  }), cb);
};
exports.extractStaticValueFromFile = extractStaticValueFromFile;
var mergeProps = function mergeProps(propNames, currentList, added) {
  propNames.forEach(function (name) {
    if (added[name]) {
      var _currentList$name;
      (_currentList$name = currentList[name]).push.apply(_currentList$name, _toConsumableArray(added[name]));
    }
  });
};
var extractStaticValueImportedFilesFromFile = function extractStaticValueImportedFilesFromFile(topLevelFile) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  console.log('---');
  console.log('extractStaticValueImportedFilesFromFile', topLevelFile);
  var propNames = Object.keys(opts.propsToExtract);
  var staticPropsList = propNames.reduce(function (agg, name) {
    return _objectSpread({}, agg, _defineProperty({}, name, []));
  }, {});
  function _extractStaticValueImportedFilesFromFile(file, opts) {
    var parentFile = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    if (cachedFiles[file]) {
      console.log('_extractStaticValueImportedFilesFromFile', file, 'cached');
      mergeProps(propNames, staticPropsList, cachedFiles[file].propsList);
      cachedFiles[file].reverseImports && cachedFiles[file].reverseImports.push(parentFile);
    } else {
      if (opts.include && !opts.include.find(function (includePath) {
        return file.search(includePath) !== -1;
      })) {
        console.log('_extractStaticValueImportedFilesFromFile', file, 'filtered');
        return;
      }
      console.log('_extractStaticValueImportedFilesFromFile', file, 'passed');
      var _fs$statSync = _fs["default"].statSync(file),
        mtimeMs = _fs$statSync.mtimeMs;
      extractStaticValueFromFile(file, opts, function (_staticPropsList, importsDeclarations) {
        mergeProps(propNames, staticPropsList, _staticPropsList);
        cachedFiles[file] = {
          cachedMtime: mtimeMs,
          propsList: _staticPropsList,
          importsDeclarations: importsDeclarations,
          reverseImports: [parentFile]
        };
      });
    }
    cachedFiles[file].importsDeclarations.forEach(function (f) {
      return _extractStaticValueImportedFilesFromFile(f, opts, file);
    });
  }
  if (!cachedFiles[topLevelFile]) {
    _extractStaticValueImportedFilesFromFile(topLevelFile, opts);
    cachedFiles[topLevelFile] = _objectSpread({}, cachedFiles[topLevelFile], {
      propsList: staticPropsList,
      reverseImports: null
    });
  } else {
    console.log('file cached');
  }
  propNames.forEach(function (name) {
    cachedFiles[topLevelFile].propsList[name] = _toConsumableArray(new Set(cachedFiles[topLevelFile].propsList[name]));
  });
  cb(cachedFiles[topLevelFile].propsList);
  return cachedFiles[topLevelFile].propsList;
};
exports.extractStaticValueImportedFilesFromFile = extractStaticValueImportedFilesFromFile;
var _default = function _default(globArr) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var propNames = Object.keys(opts.propsToExtract);
  var saveFilePath = _path["default"].resolve(opts.saveFilePath);
  var PATH_DELIMITER_LENGTH = 1;
  var previousContent;
  console.log('hello!', opts);
  var staticValues = _globAll["default"].sync(globArr).reduce(function (globObject, file) {
    var staticValues = extractStaticValueImportedFilesFromFile(_path["default"].relative(opts.basePath, file), opts);
    var dir = _path["default"].parse(file).dir;
    var componentName = dir.slice(dir.lastIndexOf('/') + PATH_DELIMITER_LENGTH);
    propNames.forEach(function (name) {
      if (!globObject[name]) {
        globObject[name] = {};
      }
      globObject[name][componentName] = staticValues[name];
    });
    return globObject;
  }, {});
  propNames.forEach(function (name) {
    if (_fs["default"].existsSync("".concat(saveFilePath, "/").concat(name, ".").concat(opts.saveFileExt))) {
      previousContent = _fs["default"].readFileSync("".concat(saveFilePath, "/").concat(name, ".").concat(opts.saveFileExt), ENCODING).toString();
    }
    var content = opts.template ? opts.template(name, staticValues[name]) : JSON.stringify(staticValues[name]);
    if (content !== previousContent) {
      _fs["default"].mkdirSync(saveFilePath, {
        recursive: true
      });
      _fs["default"].writeFileSync("".concat(saveFilePath, "/").concat(name, ".").concat(opts.saveFileExt), content);
    }
  });
  Object.keys(cachedFiles).forEach(function (file) {
    return cachedFiles[file].reverseImports = cachedFiles[file].reverseImports === null ? null : _toConsumableArray(new Set(cachedFiles[file].reverseImports));
  });
  (0, _persistentCache.savePersistentCache)(cachedFiles);
};
exports["default"] = _default;