"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { keys.push.apply(keys, Object.getOwnPropertySymbols(object)); } if (enumerableOnly) keys = keys.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var path = require('path');

var extractStaticValueFromGlob = require('./index')["default"];

var _require = require('./index'),
    extractStaticValueImportedFilesFromFile = _require.extractStaticValueImportedFilesFromFile,
    prepareCache = _require.prepareCache;

var extractStaticValues = function extractStaticValues(_ref) {
  var saveFilePath = _ref.saveFilePath,
      filesArr = _ref.filesArr,
      appContainerPath = _ref.appContainerPath,
      basePath = _ref.basePath,
      otherSettings = _objectWithoutProperties(_ref, ["saveFilePath", "filesArr", "appContainerPath", "basePath"]);

  var settings = _objectSpread({
    basePath: basePath
  }, otherSettings);

  prepareCache(settings);
  extractStaticValueImportedFilesFromFile(appContainerPath, settings, function (appContainerData) {
    extractStaticValueFromGlob(filesArr, _objectSpread({}, settings, {
      saveFilePath: saveFilePath,
      saveFileExt: 'py',
      template: function template(propName, propData) {
        Object.keys(propData).forEach(function (container) {
          propData[container] = propData[container].concat(appContainerData[propName]);
        });
        return propData ? "".concat(propName, " = ").concat(JSON.stringify(propData)) : "".concat(propName, " = {}");
      }
    }));
  });
};

var StaticValueExtractorPlugin =
/*#__PURE__*/
function () {
  function StaticValueExtractorPlugin(_ref2) {
    var _ref2$propsToExtract = _ref2.propsToExtract,
        propsToExtract = _ref2$propsToExtract === void 0 ? {
      trls: {
        constantName: 'TrlKeys'
      },
      features: {
        constantName: 'Features'
      }
    } : _ref2$propsToExtract,
        _ref2$include = _ref2.include,
        include = _ref2$include === void 0 ? ['/components', '/pages'] : _ref2$include,
        basePath = _ref2.basePath,
        filesArr = _ref2.filesArr,
        appContainerPath = _ref2.appContainerPath,
        otherParams = _objectWithoutProperties(_ref2, ["propsToExtract", "include", "basePath", "filesArr", "appContainerPath"]);

    _classCallCheck(this, StaticValueExtractorPlugin);

    this.options = {};

    if (!basePath) {
      this.options.basePath = process.cwd();
    } else {
      this.options.basePath = basePath;
    }

    if (!appContainerPath) {
      this.options.appContainerPath = path.join(this.options.basePath, '/static/js/App.tsx');
    } else {
      this.options.appContainerPath = appContainerPath;
    }

    if (!filesArr) {
      this.options.filesArr = [path.join(this.options.basePath, '/static/js/pages/*/index.{jsx,tsx}')];
    } else {
      this.options.filesArr = filesArr;
    }

    this.options = _objectSpread({}, this.options, {}, otherParams, {
      propsToExtract: propsToExtract,
      include: include
    });
  }

  _createClass(StaticValueExtractorPlugin, [{
    key: "apply",
    value: function apply(compiler) {
      var _this = this;

      compiler.hooks.done.tap('StaticValueExtractorPlugin', function () {
        extractStaticValues(_this.options);
      });
    }
  }]);

  return StaticValueExtractorPlugin;
}();

module.exports = StaticValueExtractorPlugin;