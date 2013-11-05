"use strict";
var compiledJavascriptDir, config, detectedModuleCount, fs, injectedConfigEnd, injectedConfigStart, minimatch, modules, path, pathSeparator, registration, requireModule, win32, windowsDrive, wrench, __addOtherModuleIncludes, __appendToModule, __applyToConfig, __applyUserConfigs, __determinePath, __filterIncludeFiles, __filterPluginFiles, __getDirs, __getFileAMD, __getIncludeFiles, __getModuleConfigs, __getModuleFiles, __getPathOverrides, __getPluginFileAMD, __normalize, __removeInjectedConfig, __setPathAlias, __updateDataMain, __updateModuleVersionChain, _buildAutoModules, _buildPathsOverrideIfMatch,
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

compiledJavascriptDir = "";

modules = null;

detectedModuleCount = 0;

injectedConfigStart = "//>>Start - Automodule injected config. GENERATED CODE, DONT CHANGE -\n";

injectedConfigEnd = "\n//>>End - Automodule injected config.\n";

registration = function(mimosaConfig, register) {
  var e;
  compiledJavascriptDir = mimosaConfig.watch.compiledJavascriptDir;
  e = mimosaConfig.extensions;
  requireModule = mimosaConfig.installedModules["mimosa-require"];
  register(['postBuild'], 'beforeOptimize', _buildAutoModules);
  if (mimosaConfig.isOptimize) {
    return register(['add', 'update', 'remove'], 'beforeOptimize', _buildAutoModules, __slice.call(e.javascript).concat(__slice.call(e.template)));
  } else {
    register(['add'], 'beforeOptimize', _buildPathsOverrideIfMatch);
    return register(['remove'], 'beforeOptimize', _buildAutoModules);
  }
};

_buildPathsOverrideIfMatch = function(mimosaConfig, options, next) {
  var dirList, jsSourceDir, moduleConfig, _i, _len;
  jsSourceDir = "" + mimosaConfig.watch.sourceDir + pathSeparator + mimosaConfig.watch.javascriptDir;
  dirList = __getDirs(jsSourceDir);
  if (!(dirList.length === detectedModuleCount && (modules != null))) {
    return _buildAutoModules(mimosaConfig, options, next);
  }
  for (_i = 0, _len = modules.length; _i < _len; _i++) {
    moduleConfig = modules[_i];
    if ((moduleConfig.versionOf != null) && options.inputFile.indexOf(__determinePath(moduleConfig.baseUrl, jsSourceDir)) > -1) {
      __updateModuleVersionChain(moduleConfig, options, mimosaConfig.requireBuildAutoModule.dontBuild);
    }
  }
  return next();
};

__updateModuleVersionChain = function(moduleConfig, options, dontBuild) {
  var currentIndex, file, fileObject, m, _i, _j, _len, _len1, _ref, _results;
  _ref = options.files;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    fileObject = _ref[_i];
    file = __normalize(fileObject.outputFileName);
    currentIndex = moduleConfig.includeFiles.indexOf(file);
    if (currentIndex === -1) {
      moduleConfig.includeFiles.push(file);
    }
  }
  if (!(dontBuild.indexOf(moduleConfig.name) > -1 || dontBuild.indexOf(moduleConfig.baseUrl) > -1)) {
    __updateDataMain(moduleConfig);
  }
  _results = [];
  for (_j = 0, _len1 = modules.length; _j < _len1; _j++) {
    m = modules[_j];
    if ((m.versionOf != null) && (m.versionOf === moduleConfig.name || m.versionOf === moduleConfig.baseUrl)) {
      _results.push(__updateModuleVersionChain(m, options, dontBuild));
    }
  }
  return _results;
};

_buildAutoModules = function(mimosaConfig, options, next) {
  var dontBuild, moduleConfig, runConfig, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
  if (mimosaConfig.isOptimize != null) {
    if (!(((_ref = options.runConfigs) != null ? _ref.length : void 0) > 0)) {
      return next();
    }
  }
  modules = __getModuleConfigs(mimosaConfig);
  for (_i = 0, _len = modules.length; _i < _len; _i++) {
    moduleConfig = modules[_i];
    moduleConfig.includeFiles = __getIncludeFiles(moduleConfig);
  }
  for (_j = 0, _len1 = modules.length; _j < _len1; _j++) {
    moduleConfig = modules[_j];
    __addOtherModuleIncludes(moduleConfig);
    dontBuild = mimosaConfig.requireBuildAutoModule.dontBuild;
    if (!(dontBuild.indexOf(moduleConfig.name) > -1 || dontBuild.indexOf(moduleConfig.baseUrl) > -1)) {
      if (mimosaConfig.isOptimize != null) {
        _ref1 = options.runConfigs;
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          runConfig = _ref1[_k];
          __applyToConfig(runConfig, moduleConfig);
        }
      } else {
        __updateDataMain(moduleConfig);
      }
    }
  }
  return next();
};

__getModuleConfigs = function(mimosaConfig, dirList) {
  var moduleConfigs, moduleNames, userConfig, _i, _len, _ref;
  moduleNames = dirList;
  if (dirList == null) {
    moduleNames = __getDirs("" + mimosaConfig.watch.sourceDir + pathSeparator + mimosaConfig.watch.javascriptDir);
  }
  detectedModuleCount = moduleNames.length;
  moduleConfigs = moduleNames.map(function(dirName) {
    return {
      name: "" + dirName + "/" + dirName + "-built",
      baseUrl: dirName,
      include: [],
      patterns: mimosaConfig.requireBuildAutoModule.patterns,
      exclude: mimosaConfig.requireBuildAutoModule.exclude,
      excludeRegex: mimosaConfig.requireBuildAutoModule.excludeRegex,
      plugins: mimosaConfig.requireBuildAutoModule.plugins,
      dataMain: "main.js"
    };
  });
  _ref = mimosaConfig.requireBuildAutoModule.modules;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    userConfig = _ref[_i];
    __applyUserConfigs(userConfig, moduleConfigs);
  }
  return moduleConfigs;
};

__getDirs = function(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return file[0] !== '.' && fs.statSync("" + rootDir + pathSeparator + file).isDirectory();
  });
};

__applyUserConfigs = function(userConfig, modules) {
  var match, matchedModules, _ref;
  matchedModules = modules.filter(function(m) {
    return m.name === userConfig.name || m.baseUrl === userConfig.baseUrl;
  });
  if (matchedModules.length > 1) {
    console.log("Should have found at most one match");
    return;
  }
  if (matchedModules.length === 1) {
    match = matchedModules[0];
    match.name = userConfig.name;
    if ((userConfig.baseUrl != null) && userConfig.baseUrl !== "") {
      match.baseUrl = userConfig.baseUrl;
    }
    if (((_ref = userConfig.include) != null ? _ref.length : void 0) > 0) {
      match.include = userConfig.include;
    }
    match.patterns = userConfig.patterns;
    match.exclude = userConfig.exclude;
    match.excludeRegex = userConfig.excludeRegex;
    match.plugins = userConfig.plugins;
    if ((userConfig.versionOf != null) && userConfig.versionOf !== "") {
      match.versionOf = userConfig.versionOf;
    }
    match.dataMain = userConfig.dataMain;
    match.includeAliasedFiles = userConfig.includeAliasedFiles;
  }
  if (matchedModules.length === 0) {
    return modules.push(userConfig);
  }
};

__getIncludeFiles = function(moduleConfig) {
  var base, files, filteredIncludes, includeFiles, _ref;
  includeFiles = [];
  moduleConfig.includeFolder = __determinePath(moduleConfig.baseUrl, compiledJavascriptDir);
  base = __normalize(path.join(moduleConfig.includeFolder, pathSeparator));
  files = __getModuleFiles(moduleConfig);
  if (((_ref = moduleConfig.plugins) != null ? _ref.length : void 0) > 0) {
    files = __filterPluginFiles(moduleConfig, files, includeFiles, base);
  }
  filteredIncludes = __filterIncludeFiles(files, moduleConfig.patterns, base);
  includeFiles = includeFiles.concat(filteredIncludes);
  if ((moduleConfig.versionOf != null) && (moduleConfig.pathAlias == null)) {
    __setPathAlias(moduleConfig);
  }
  return includeFiles;
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

__getModuleFiles = function(moduleConfig) {
  var files;
  files = wrench.readdirSyncRecursive(moduleConfig.includeFolder);
  files = files.map(function(file) {
    return path.join(moduleConfig.includeFolder, file);
  }).filter(function(file) {
    return fs.statSync(file).isFile() && moduleConfig.exclude.indexOf(file) === -1 && !(moduleConfig.excludeRegex && file.match(moduleConfig.excludeRegex));
  }).map(__normalize);
  return files;
};

__filterPluginFiles = function(moduleConfig, files, includeFiles, base) {
  var pluginConfig, _i, _len, _ref;
  _ref = moduleConfig.plugins;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    pluginConfig = _ref[_i];
    pluginConfig.patterns.forEach(function(pattern) {
      var absPattern;
      absPattern = __normalize(path.resolve(base, pattern));
      return files = files.filter(function(file) {
        if (minimatch(file, absPattern)) {
          includeFiles.push("" + pluginConfig.path + "!" + file);
          return false;
        }
        return true;
      });
    });
  }
  return files;
};

__filterIncludeFiles = function(files, patterns, base) {
  var result;
  result = [];
  patterns.forEach(function(pattern) {
    var absPattern, file, _i, _len, _results;
    absPattern = __normalize(path.resolve(base, pattern));
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      if (minimatch(file, absPattern)) {
        _results.push(result.push(file));
      }
    }
    return _results;
  });
  return result;
};

__setPathAlias = function(moduleConfig) {
  var match, matchedModules;
  matchedModules = modules.filter(function(m) {
    return moduleConfig.versionOf === m.name || moduleConfig.versionOf === m.baseUrl;
  });
  if (matchedModules.length !== 1) {
    console.log("Version of didn't match or matched more than one module");
    return;
  }
  match = matchedModules[0];
  if (match.versionOf != null) {
    if (match.pathAlias == null) {
      __setPathAlias(match);
    }
    moduleConfig.pathAlias = match.pathAlias;
    if (moduleConfig.versionBaseUrl == null) {
      moduleConfig.versionBaseUrl = [];
    }
    moduleConfig.versionBaseUrl.push(match.baseUrl);
  } else {
    moduleConfig.pathAlias = match.baseUrl;
  }
  return moduleConfig.include.push(match.name);
};

__addOtherModuleIncludes = function(moduleConfig) {
  var include, m, _i, _j, _len, _len1, _ref, _ref1, _ref2;
  if (!(((_ref = moduleConfig.include) != null ? _ref.length : void 0) > 0)) {
    return;
  }
  _ref1 = moduleConfig.include;
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    include = _ref1[_i];
    if (include !== moduleConfig.name && include !== moduleConfig.baseUrl) {
      for (_j = 0, _len1 = modules.length; _j < _len1; _j++) {
        m = modules[_j];
        if (include === m.name || include === m.baseUrl) {
          if (((_ref2 = m.include) != null ? _ref2.length : void 0) > 0) {
            __addOtherModuleIncludes(m);
          }
          if (m.includeFiles != null) {
            moduleConfig.includeFiles = moduleConfig.includeFiles.concat(m.includeFiles);
          }
        }
      }
    }
  }
  return moduleConfig.include = null;
};

__updateDataMain = function(moduleConfig) {
  var data, dataMain, injectedConfig, m, rootDataMain, _i, _len;
  if (!((moduleConfig.pathAlias != null) && moduleConfig.pathAlias !== moduleConfig.baseUrl)) {
    return;
  }
  dataMain = __determinePath(moduleConfig.dataMain, moduleConfig.includeFolder);
  if (fs.existsSync(dataMain) && fs.statSync(dataMain).isFile()) {
    data = fs.readFileSync(dataMain, {
      encoding: 'utf8'
    });
    data = __removeInjectedConfig(data);
    injectedConfig = "require.config({paths:" + (JSON.stringify(__getPathOverrides(moduleConfig))) + "})";
    fs.writeFileSync(dataMain, "" + injectedConfigStart + injectedConfig + injectedConfigEnd + data);
  } else {
    rootDataMain = null;
    for (_i = 0, _len = modules.length; _i < _len; _i++) {
      m = modules[_i];
      if (m.baseUrl === moduleConfig.pathAlias) {
        rootDataMain = __determinePath(m.dataMain, m.includeFolder);
      }
    }
    if (fs.existsSync(rootDataMain) && fs.statSync(rootDataMain).isFile()) {
      data = fs.readFileSync(rootDataMain, {
        encoding: 'utf8'
      });
      data = __removeInjectedConfig(data);
      injectedConfig = "require.config({paths:" + (JSON.stringify(__getPathOverrides(moduleConfig))) + "})";
      return fs.writeFileSync(dataMain, "" + injectedConfigStart + injectedConfig + injectedConfigEnd + data);
    } else {
      return console.log("Couldn't find a main.js file to augment for module named: " + moduleConfig.name);
    }
  }
};

__removeInjectedConfig = function(data) {
  var j, k;
  j = data.indexOf(injectedConfigStart);
  k = data.indexOf(injectedConfigEnd);
  if (!(j === -1 || k === -1)) {
    data = data.substring(0, j) + data.substring(k + injectedConfigEnd.length);
  }
  return data;
};

__getPathOverrides = function(moduleConfig) {
  var pathOverrides;
  pathOverrides = {};
  moduleConfig.includeFiles.forEach(function(file) {
    var alias, amdFile, baseUrl, pluginIndex, _i, _len, _ref, _ref1;
    pluginIndex = file.indexOf("!");
    if (pluginIndex > -1) {
      amdFile = __getFileAMD(file.substring(pluginIndex + 1)).replace(path.extname(file), '');
    } else {
      amdFile = __getFileAMD(file).replace(path.extname(file), '');
    }
    alias = amdFile;
    if (amdFile.indexOf(moduleConfig.baseUrl) === 0) {
      alias = amdFile.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
    } else {
      if (((_ref = moduleConfig.versionBaseUrl) != null ? _ref.length : void 0) > 0) {
        _ref1 = moduleConfig.versionBaseUrl;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          baseUrl = _ref1[_i];
          if (amdFile.indexOf(baseUrl) === 0) {
            alias = amdFile.replace(baseUrl, moduleConfig.pathAlias);
          }
        }
      }
    }
    if (pathOverrides[alias] == null) {
      return pathOverrides[alias] = amdFile;
    }
  });
  return pathOverrides;
};

__applyToConfig = function(runConfig, moduleConfig) {
  var matchedModules, moduleEntry, _i, _len, _ref;
  if (((_ref = runConfig.modules) != null ? _ref.length : void 0) > 0) {
    matchedModules = runConfig.modules.filter(function(m) {
      return m.name === moduleConfig.name;
    });
    if (matchedModules.length > 0) {
      for (_i = 0, _len = matchedModules.length; _i < _len; _i++) {
        moduleEntry = matchedModules[_i];
        __appendToModule(moduleEntry, moduleConfig);
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
  __appendToModule(moduleEntry, moduleConfig);
  return runConfig.modules.push(moduleEntry);
};

__appendToModule = function(moduleEntry, moduleConfig) {
  if (!Array.isArray(moduleEntry.include)) {
    moduleEntry.include = [];
  }
  if (moduleConfig.pathAlias != null) {
    if (moduleEntry.override == null) {
      moduleEntry.override = {};
    }
    if (moduleEntry.override.paths == null) {
      moduleEntry.override.paths = {};
    }
    return moduleConfig.includeFiles.forEach(function(file) {
      var alias, aliasedFile, amdFile, baseUrl, filePart, pluginIndex, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
      pluginIndex = file.indexOf("!");
      if (pluginIndex > -1) {
        amdFile = __getPluginFileAMD(file, pluginIndex);
        pluginIndex = amdFile.indexOf("!");
        filePart = amdFile.substring(pluginIndex + 1);
        aliasedFile = filePart;
        if (filePart.indexOf(moduleConfig.baseUrl) === 0) {
          aliasedFile = filePart.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
        } else {
          if (((_ref = moduleConfig.versionBaseUrl) != null ? _ref.length : void 0) > 0) {
            _ref1 = moduleConfig.versionBaseUrl;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              baseUrl = _ref1[_i];
              if (filePart.indexOf(baseUrl) === 0) {
                aliasedFile = filePart.replace(baseUrl, moduleConfig.pathAlias);
              }
            }
          }
        }
        alias = "" + (amdFile.substring(0, pluginIndex)) + "!" + aliasedFile;
        if (moduleConfig.includeAliasedFiles) {
          moduleEntry.include.push(alias);
        }
        aliasedFile = aliasedFile.replace(path.extname(file), '');
        if (moduleEntry.override.paths[aliasedFile] == null) {
          return moduleEntry.override.paths[aliasedFile] = filePart.replace(path.extname(file), '');
        }
      } else {
        amdFile = __getFileAMD(file).replace(path.extname(file), '');
        alias = amdFile;
        if (amdFile.indexOf(moduleConfig.baseUrl) === 0) {
          alias = amdFile.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
        } else {
          if (((_ref2 = moduleConfig.versionBaseUrl) != null ? _ref2.length : void 0) > 0) {
            _ref3 = moduleConfig.versionBaseUrl;
            for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
              baseUrl = _ref3[_j];
              if (amdFile.indexOf(baseUrl) === 0) {
                alias = amdFile.replace(baseUrl, moduleConfig.pathAlias);
              }
            }
          }
        }
        if (moduleConfig.includeAliasedFiles) {
          moduleEntry.include.push(alias);
        }
        if (moduleEntry.override.paths[alias] == null) {
          return moduleEntry.override.paths[alias] = amdFile;
        }
      }
    });
  } else {
    return moduleConfig.includeFiles.forEach(function(file) {
      var pluginIndex;
      pluginIndex = file.indexOf("!");
      if (pluginIndex > -1) {
        return moduleEntry.include.push(__getPluginFileAMD(file, pluginIndex));
      } else {
        return moduleEntry.include.push(__getFileAMD(file).replace(path.extname(file), ''));
      }
    });
  }
};

__getPluginFileAMD = function(file, pluginIndex) {
  var fileAMD, pluginAlias, pluginPath;
  pluginPath = __determinePath(file.substring(0, pluginIndex) + ".js", compiledJavascriptDir);
  pluginAlias = requireModule.manipulatePathWithAlias(pluginPath);
  if (pluginAlias === pluginPath) {
    pluginAlias = path.relative(compiledJavascriptDir, pluginAlias).split(path.sep).join("/").replace(".js", '');
  }
  fileAMD = __getFileAMD(file.substring(pluginIndex + 1));
  return "" + pluginAlias + "!" + fileAMD;
};

__getFileAMD = function(file) {
  var fileAMD;
  fileAMD = requireModule.manipulatePathWithAlias(file);
  if (fileAMD === file) {
    fileAMD = path.relative(compiledJavascriptDir, file);
  }
  return fileAMD.split(path.sep).join("/");
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
