"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _core = require("@babel/core");
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