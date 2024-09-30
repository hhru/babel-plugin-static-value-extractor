"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.savePersistentCache = exports.getPersistentCache = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _os = _interopRequireDefault(require("os"));
var _path = _interopRequireDefault(require("path"));
var _findCacheDir = _interopRequireDefault(require("find-cache-dir"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var CACHE_SAVE_DELAY_MS = 300;
var cacheSaveTimeout;
var getCacheFilePath = function getCacheFilePath() {
  var cacheDir = (0, _findCacheDir["default"])({
    name: 'babel-plugin-static-value-extractor'
  }) || _os["default"].tmpdir();
  return _path["default"].join(cacheDir, 'files_v2.json');
};
var getPersistentCache = function getPersistentCache() {
  var cacheFile = getCacheFilePath();
  if (!_fs["default"].existsSync(cacheFile)) {
    return {};
  }
  var cacheObject = {};
  try {
    var cache = _fs["default"].readFileSync(cacheFile).toString();
    cacheObject = JSON.parse(cache);
  } catch (e) {
    try {
      _fs["default"].unlinkSync(cacheFile);
    } catch (e) {
      console.log(e);
    }
  }
  return cacheObject;
};
exports.getPersistentCache = getPersistentCache;
var actualCacheSave = function actualCacheSave(cache) {
  var cacheFile = getCacheFilePath();
  _fs["default"].mkdirSync(_path["default"].dirname(cacheFile), {
    recursive: true
  });
  _fs["default"].writeFileSync(cacheFile, JSON.stringify(cache));
};
var savePersistentCache = function savePersistentCache(cache) {
  clearTimeout(cacheSaveTimeout);
  setTimeout(function () {
    return actualCacheSave(cache);
  }, CACHE_SAVE_DELAY_MS);
};
exports.savePersistentCache = savePersistentCache;