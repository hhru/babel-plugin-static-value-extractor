"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _core = require("@babel/core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { keys.push.apply(keys, Object.getOwnPropertySymbols(object)); } if (enumerableOnly) keys = keys.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var JS_EXTENSIONS = ['', 'js', 'jsx', 'ts', 'tsx'];

var getFinalNodeValues = function getFinalNodeValues(node) {
  if (!_core.types.isObjectExpression(node)) {
    return [];
  }

  return node.properties.reduce(function (arr, _ref) {
    var value = _ref.value;

    if (_core.types.isObjectExpression(value)) {
      arr.push.apply(arr, _toConsumableArray(getFinalNodeValues(value)));
    }

    if (_core.types.isStringLiteral(value)) {
      arr.push(value.value);
    }

    return arr;
  }, []);
};

var isJsFile = function isJsFile(path) {
  return JS_EXTENSIONS.includes(_path["default"].parse(path).ext);
};

var replacePath = function replacePath(path) {
  var pathsToReplace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return Object.keys(pathsToReplace).filter(function (checkPath) {
    return path.startsWith(checkPath);
  }).reduce(function (result, checkPath) {
    return _path["default"].normalize(result.replace(checkPath, pathsToReplace[checkPath]));
  }, path);
};

var _default = function _default(cb) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var currentFileDir = _path["default"].parse(opts.filename).dir;

  var propsToExtract = opts.propsToExtract,
      pathsToReplace = opts.pathsToReplace,
      basePath = opts.basePath;
  var propNames = Object.keys(propsToExtract);
  var staticProps = propNames.reduce(function (agg, name) {
    return _objectSpread({}, agg, _defineProperty({}, name, []));
  }, {});
  var constants = propNames.reduce(function (agg, name) {
    if (propsToExtract[name].constantName) {
      return _objectSpread({}, agg, _defineProperty({}, propsToExtract[name].constantName, name));
    }

    return agg;
  }, {});
  var constantNames = Object.keys(constants);
  var importDeclarationPaths = [];

  var processImports = function processImports(filePath) {
    var hasExt = _path["default"].parse(filePath).ext;

    var defaultFileNameTs = hasExt ? '' : 'index.tsx';
    var defaultFileNameJs = hasExt ? '' : 'index.jsx';

    var importPath = _path["default"].resolve(currentFileDir, filePath);

    var paths = [_path["default"].resolve(importPath, defaultFileNameTs), _path["default"].resolve(importPath, defaultFileNameJs), "".concat(importPath, ".tsx"), "".concat(importPath, ".jsx"), "".concat(importPath, ".ts"), "".concat(importPath, ".js")];
    var declarationPath = paths.find(function (path) {
      return _fs["default"].existsSync(path);
    });

    if (declarationPath) {
      importDeclarationPaths.push(_path["default"].relative(basePath, declarationPath));
    }
  };

  return {
    Program: {
      exit: function exit() {
        cb(staticProps, importDeclarationPaths);
      }
    },
    VariableDeclarator: {
      enter: function enter(path) {
        if (constantNames.includes(path.node.id.name) && _core.types.isProgram(path.parentPath.parent)) {
          var _staticProps$constant;

          (_staticProps$constant = staticProps[constants[path.node.id.name]]).push.apply(_staticProps$constant, _toConsumableArray(getFinalNodeValues(path.node.init)));
        }
      }
    },
    ClassProperty: {
      enter: function enter(path) {
        var node = path.node;

        if (!node["static"]) {
          return;
        }

        if (_core.types.isIdentifier(node.key) && propNames.includes(node.key.name) && _core.types.isObjectExpression(node.value)) {
          var _staticProps$node$key;

          (_staticProps$node$key = staticProps[node.key.name]).push.apply(_staticProps$node$key, _toConsumableArray(getFinalNodeValues(node.value)));
        }
      }
    },
    ExpressionStatement: {
      enter: function enter(path) {
        path.traverse({
          AssignmentExpression: {
            enter: function enter(_ref2) {
              var node = _ref2.node;

              if (!_core.types.isMemberExpression(node.left)) {
                return;
              }

              var propIsMemberExpression = _core.types.isMemberExpression(node.left.object) && propNames.includes(node.left.object.property.name) && _core.types.isStringLiteral(node.right);

              var propsIsObjectExpression = _core.types.isIdentifier(node.left.object) && propNames.includes(node.left.property.name) && _core.types.isObjectExpression(node.right);

              if (propIsMemberExpression) {
                staticProps[node.left.object.property.name].push(node.right.value);
              } else if (propsIsObjectExpression) {
                var _staticProps$node$lef;

                (_staticProps$node$lef = staticProps[node.left.property.name]).push.apply(_staticProps$node$lef, _toConsumableArray(getFinalNodeValues(node.right)));
              }
            }
          }
        });
      }
    },
    ImportDeclaration: {
      enter: function enter(_ref3) {
        var node = _ref3.node;

        if (node && node.source && isJsFile(node.source.value)) {
          processImports(replacePath(node.source.value, pathsToReplace));
        }
      }
    },
    CallExpression: {
      enter: function enter(_ref4) {
        var node = _ref4.node;

        if (node && node.callee && _core.types.isImport(node.callee)) {
          processImports(node.arguments[0].value);
        }
      }
    }
  };
};

exports["default"] = _default;