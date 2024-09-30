"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var s = Object.getOwnPropertySymbols(e); for (r = 0; r < s.length; r++) { o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) { if ({}.hasOwnProperty.call(r, n)) { if (e.includes(n)) continue; t[n] = r[n]; } } return t; }
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
  console.log('preparing with settings', settings);
  var newSettings = _objectSpread({}, settings);
  newSettings.include = ['src/app/App', 'src/components', 'src/pages', 'src/hooks', 'src/widgets', '/front-static-app'];
  extractStaticValueImportedFilesFromFile(appContainerPath, newSettings, function (appContainerData) {
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
var StaticValueExtractorPlugin = /*#__PURE__*/function () {
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
      this.options.appContainerPath = path.join(this.options.basePath, '/src/app/App.tsx');
    } else {
      this.options.appContainerPath = appContainerPath;
    }
    if (!filesArr) {
      this.options.filesArr = [path.join(this.options.basePath, '/src/pages/*/index.{jsx,tsx}')];
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
      compiler.hooks.done.tap('StaticValueExtractorPlugin', function (stats) {
        if (!stats.hasErrors()) {
          extractStaticValues(_this.options);
        }
      });
    }
  }]);
  return StaticValueExtractorPlugin;
}();
module.exports = StaticValueExtractorPlugin;