"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.extractStaticValueImportedFilesFromFile = exports.extractStaticValueFromFile = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var babylon = _interopRequireWildcard(require("@babel/parser"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _globAll = _interopRequireDefault(require("glob-all"));

var _traverser = _interopRequireDefault(require("./traverser"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { keys.push.apply(keys, Object.getOwnPropertySymbols(object)); } if (enumerableOnly) keys = keys.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

var extractStaticValueFromFile = function extractStaticValueFromFile(file) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  extractStaticValueFromCode(_fs["default"].readFileSync(file), _objectSpread({}, opts, {
    filename: file
  }), cb);
};

exports.extractStaticValueFromFile = extractStaticValueFromFile;
var cachedFiles = {};

var extractStaticValueImportedFilesFromFile = function extractStaticValueImportedFilesFromFile(file) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  var staticPropsList = [];

  function _extractStaticValueImportedFilesFromFile(file, opts) {
    var importsDeclarations = [];

    if (opts.include && !opts.include.find(function (includePath) {
      return file.search(includePath) !== -1;
    })) {
      return;
    }

    if (cachedFiles[file]) {
      staticPropsList = staticPropsList.concat(cachedFiles[file].propsList);
      importsDeclarations = cachedFiles[file].importsDeclarations;
    } else {
      extractStaticValueFromFile(file, opts, function (_staticPropsList, _importsDeclarations) {
        staticPropsList = staticPropsList.concat(_staticPropsList);
        importsDeclarations = _importsDeclarations;
        cachedFiles[file] = {
          propsList: _staticPropsList,
          importsDeclarations: importsDeclarations
        };
      });
    }

    importsDeclarations.forEach(function (file) {
      _extractStaticValueImportedFilesFromFile(file, opts, staticPropsList);
    });
  }

  if (cachedFiles[file]) {
    staticPropsList = cachedFiles[file].propsList;
  } else {
    _extractStaticValueImportedFilesFromFile(file, opts);

    cachedFiles[file] = {
      propsList: staticPropsList,
      importsDeclarations: []
    };
  }

  var values = _toConsumableArray(new Set(cachedFiles[file].propsList));

  cb(values);
  return values;
};

exports.extractStaticValueImportedFilesFromFile = extractStaticValueImportedFilesFromFile;

var _default = function _default(globArr) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var saveFilePath = _path["default"].resolve(opts.saveFilePath);

  var PATH_DELIMITER_LENGTH = 1;
  var previousContent;

  var staticValues = _globAll["default"].sync(globArr).reduce(function (globObject, file) {
    var staticValues = extractStaticValueImportedFilesFromFile(file, opts);

    var dir = _path["default"].parse(file).dir;

    globObject[dir.slice(dir.lastIndexOf('/') + PATH_DELIMITER_LENGTH)] = staticValues;
    return globObject;
  }, {});

  if (_fs["default"].existsSync("".concat(saveFilePath, "/").concat(opts.saveFileName, ".").concat(opts.saveFileExt))) {
    previousContent = _fs["default"].readFileSync("".concat(saveFilePath, "/").concat(opts.saveFileName, ".").concat(opts.saveFileExt), ENCODING).toString();
  }

  var content = opts.template ? opts.template(staticValues) : JSON.stringify(staticValues);
  cachedFiles = {};

  if (content !== previousContent) {
    _fs["default"].mkdirSync(saveFilePath, {
      recursive: true
    });

    _fs["default"].writeFileSync("".concat(saveFilePath, "/").concat(opts.saveFileName, ".").concat(opts.saveFileExt), content);
  }
};

exports["default"] = _default;