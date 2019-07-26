"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _core = require("@babel/core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var JS_EXTENSIONS = ['', 'js', 'jsx'];

var getConcatenatedStaticProps = function getConcatenatedStaticProps(staticProps, nodeStaticProps) {
  return staticProps.concat(nodeStaticProps.reduce(function (arr, _ref) {
    var value = _ref.value;

    if (_core.types.isStringLiteral(value)) {
      arr.push(value.value);
    }

    return arr;
  }, []));
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
    var defaultFileName = _path["default"].parse(filePath).ext ? '' : 'index.jsx';

    var importPath = _path["default"].resolve(currentFileDir, filePath);

    if (_fs["default"].existsSync(importPath)) {
      importDeclarationPaths.push(_path["default"].resolve(importPath, defaultFileName));
      return;
    }

    if (_fs["default"].existsSync("".concat(importPath, ".jsx"))) {
      importDeclarationPaths.push("".concat(importPath, ".jsx"));
      return;
    }

    if (_fs["default"].existsSync("".concat(importPath, ".js"))) {
      importDeclarationPaths.push("".concat(importPath, ".js"));
    }
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
          staticProps = getConcatenatedStaticProps(staticProps, node.value.properties);
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
                staticProps = getConcatenatedStaticProps(staticProps, node.right.properties);
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