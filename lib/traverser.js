"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _core = require("@babel/core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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

var getConcatenatedStaticProps = function getConcatenatedStaticProps(staticProps, nodeStaticProps) {
  return staticProps.concat(getFinalNodeValues(nodeStaticProps));
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
  var staticProps = [];

  var currentFileDir = _path["default"].parse(opts.filename).dir;

  var staticPropName = opts.staticPropName,
      pathsToReplace = opts.pathsToReplace;
  var importDeclarationPaths = [];

  var processImports = function processImports(filePath) {
    var hasExt = _path["default"].parse(filePath).ext;

    var defaultFileNameTs = hasExt ? "" : "index.tsx";
    var defaultFileNameJs = hasExt ? "" : "index.jsx";

    var importPath = _path["default"].resolve(currentFileDir, filePath);

    var paths = [_path["default"].resolve(importPath, defaultFileNameTs), _path["default"].resolve(importPath, defaultFileNameJs), "".concat(importPath, ".tsx"), "".concat(importPath, ".jsx"), "".concat(importPath, ".ts"), "".concat(importPath, ".js")];
    paths.some(function (path) {
      if (_fs["default"].existsSync(path)) {
        importDeclarationPaths.push(path);
      }
    });
  };

  return {
    Program: {
      exit: function exit() {
        cb(staticProps, importDeclarationPaths);
      }
    },
    ClassProperty: {
      enter: function enter(path) {
        var node = path.node;

        if (!node["static"]) {
          return;
        }

        if (_core.types.isIdentifier(node.key) && node.key.name === staticPropName && _core.types.isObjectExpression(node.value)) {
          staticProps = getConcatenatedStaticProps(staticProps, node.value);
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

              var propIsMemberExpression = _core.types.isMemberExpression(node.left.object) && node.left.object.property.name === staticPropName && _core.types.isStringLiteral(node.right);

              var propsIsObjectExpression = _core.types.isIdentifier(node.left.object) && node.left.property.name === staticPropName && _core.types.isObjectExpression(node.right);

              if (propIsMemberExpression) {
                staticProps.push(node.right.value);
              } else if (propsIsObjectExpression) {
                staticProps = getConcatenatedStaticProps(staticProps, node.right);
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