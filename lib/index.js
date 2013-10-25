"use strict";
var config, fs, minimatch, path, pathSeparator, registration, requireModule, win32, windowsDrive, wrench, __appendToModule, __buildAliases, __determinePath, __filePreMatchFilter, __getFileAMD, __normalize, _appendFilesToInclude,
  __slice = [].slice;

path = require('path');

fs = require('fs');

wrench = require("wrench");

minimatch = require("minimatch");

config = require('./config');

requireModule = null;

windowsDrive = /^[A-Za-z]:\\/;

win32 = process.platform === 'win32';

pathSeparator = win32 ? '\\' : '/';

registration = function(mimosaConfig, register) {
  var e;
  if (mimosaConfig.isOptimize) {
    requireModule = mimosaConfig.installedModules["mimosa-require"];
    e = mimosaConfig.extensions;
    register(['add', 'update', 'remove'], 'beforeOptimize', _appendFilesToInclude, __slice.call(e.javascript).concat(__slice.call(e.template)));
    return register(['postBuild'], 'beforeOptimize', _appendFilesToInclude);
  }
};

_appendFilesToInclude = function(mimosaConfig, options, next) {
  var hasModulesDefined, hasRunConfigs, moduleConfig, _i, _len, _ref, _ref1, _ref2;
  hasRunConfigs = ((_ref = options.runConfigs) != null ? _ref.length : void 0) > 0;
  if (!hasRunConfigs) {
    return next();
  }
  hasModulesDefined = ((_ref1 = mimosaConfig.requireBuildModuleVersioned.modules) != null ? _ref1.length : void 0) > 0;
  if (!hasModulesDefined) {
    return next();
  }
  _ref2 = mimosaConfig.requireBuildModuleVersioned.modules;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    moduleConfig = _ref2[_i];
    __buildAliases(moduleConfig, options, mimosaConfig.watch.compiledJavascriptDir);
  }
  return next();
};

__buildAliases = function(moduleConfig, options, baseUrl) {
  var paths;
  paths = {};
  moduleConfig.versions.forEach(function(version) {
    var alias, amdFile, base, file, includeFolder, versionFiles, _i, _len, _results;
    includeFolder = __determinePath(version.folder, baseUrl);
    versionFiles = wrench.readdirSyncRecursive(includeFolder);
    versionFiles = versionFiles.map(function(file) {
      return path.join(includeFolder, file);
    }).filter(function(file) {
      return __filePreMatchFilter(moduleConfig, file);
    }).map(__normalize);
    base = __normalize(path.join(includeFolder, pathSeparator));
    moduleConfig.include.forEach(function(pattern) {
      var absPattern;
      absPattern = __normalize(path.resolve(base, pattern));
      return versionFiles = versionFiles.filter(function(file) {
        return minimatch(file, absPattern);
      });
    });
    _results = [];
    for (_i = 0, _len = versionFiles.length; _i < _len; _i++) {
      file = versionFiles[_i];
      amdFile = __getFileAMD(file, baseUrl);
      alias = amdFile.replace(version.folder, moduleConfig.baseUrl);
      if (paths[alias] == null) {
        _results.push(paths[alias] = amdFile);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  });
  return options.runConfigs.forEach(function(runConfig) {
    var matchedModules, moduleEntry, _i, _len, _ref;
    if (((_ref = runConfig.modules) != null ? _ref.length : void 0) > 0) {
      matchedModules = runConfig.modules.filter(function(m) {
        return m.name === moduleConfig.name;
      });
      if (matchedModules.length > 0) {
        for (_i = 0, _len = matchedModules.length; _i < _len; _i++) {
          moduleEntry = matchedModules[_i];
          __appendToModule(moduleEntry, paths, moduleConfig.includeInBuild);
        }
        return;
      }
    }
    if (!Array.isArray(runConfig.modules)) {
      runConfig.modules = [];
    }
    moduleEntry = {
      name: moduleConfig.name,
      create: true,
      include: []
    };
    __appendToModule(moduleEntry, paths, moduleConfig.includeInBuild);
    return runConfig.modules.push(moduleEntry);
  });
};

__determinePath = function(thePath, relativeTo) {
  if (windowsDrive.test(thePath)) {
    return thePath;
  }
  if (thePath.indexOf("/") === 0) {
    return thePath;
  }
  return path.join(relativeTo, thePath);
};

__filePreMatchFilter = function(moduleConfig, file) {
  return fs.statSync(file).isFile() && moduleConfig.exclude.indexOf(file) === -1 && !(moduleConfig.excludeRegex && file.match(moduleConfig.excludeRegex));
};

__getFileAMD = function(file, baseUrl) {
  var fileAMD;
  fileAMD = requireModule.manipulatePathWithAlias(file);
  if (fileAMD === file) {
    fileAMD = path.relative(baseUrl, file);
  }
  return fileAMD.split(path.sep).join("/").replace(path.extname(file), '');
};

__appendToModule = function(moduleEntry, paths, doInclude) {
  var key, _results;
  console.log("-----------------------------");
  console.log(doInclude);
  console.log("+++++++++++++++++++++++++++++");
  if (moduleEntry.override == null) {
    moduleEntry.override = {};
  }
  if (moduleEntry.override.paths == null) {
    moduleEntry.override.paths = {};
  }
  if (!Array.isArray(moduleEntry.include)) {
    moduleEntry.include = [];
  }
  _results = [];
  for (key in paths) {
    moduleEntry.override.paths[key] = paths[key];
    if (doInclude) {
      _results.push(moduleEntry.include.push(key));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

__normalize = function(filepath) {
  if (win32) {
    return filepath.replace(/\\/g, '/');
  }
  return filepath;
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
