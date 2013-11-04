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
    return register(['add', 'update', 'remove'], 'beforeOptimize', _buildPathsOverrideIfMatch);
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
      __updateModuleVersionChain(moduleConfig);
    }
  }
  return next();
};

__updateModuleVersionChain = function(moduleConfig) {
  var dontBuild, m, _i, _len, _results;
  moduleConfig.includeFiles = __getIncludeFiles(moduleConfig);
  __addOtherModuleIncludes(moduleConfig);
  dontBuild = mimosaConfig.requireBuildAutoModule.dontBuild;
  if (!(dontBuild.indexOf(moduleConfig.name) > -1 || dontBuild.indexOf(moduleConfig.baseUrl) > -1)) {
    __updateDataMain(moduleConfig);
  }
  _results = [];
  for (_i = 0, _len = modules.length; _i < _len; _i++) {
    m = modules[_i];
    if ((m.versionOf != null) && (m.versionOf === moduleConfig.name || m.versionOf === moduleConfig.baseUrl)) {
      _results.push(__updateModuleVersionChain(m));
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

//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxsaWJcXGluZGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxzcmNcXGluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFdBQUE7Q0FBQSxHQUFBLHNsQkFBQTtHQUFBLGVBQUE7O0FBRUEsQ0FGQSxFQUVPLENBQVAsRUFBTyxDQUFBOztBQUVQLENBSkEsQ0FJQSxDQUFLLENBQUEsR0FBQTs7QUFFTCxDQU5BLEVBTVMsR0FBVCxDQUFTLENBQUE7O0FBRVQsQ0FSQSxFQVFZLElBQUEsRUFBWixFQUFZOztBQUVaLENBVkEsRUFVUyxHQUFULENBQVMsR0FBQTs7QUFFVCxDQVpBLEVBWWdCLENBWmhCLFNBWUE7O0FBRUEsQ0FkQSxFQWNlLFNBQWYsRUFkQTs7QUFnQkEsQ0FoQkEsRUFnQlEsRUFBUixFQUFlLENBQVA7O0FBRVIsQ0FsQkEsRUFrQm1CLENBQUgsQ0FBQSxRQUFoQjs7QUFFQSxDQXBCQSxDQUFBLENBb0J3QixrQkFBeEI7O0FBRUEsQ0F0QkEsRUFzQlUsQ0F0QlYsR0FzQkE7O0FBRUEsQ0F4QkEsRUF3QnNCLGdCQUF0Qjs7QUFFQSxDQTFCQSxFQTBCc0IsZ0JBQXRCLHNEQTFCQTs7QUEyQkEsQ0EzQkEsRUEyQm9CLGNBQXBCLDBCQTNCQTs7QUE2QkEsQ0E3QkEsQ0E2QjhCLENBQWYsS0FBQSxDQUFDLEdBQWhCO0NBQ0UsS0FBQTtDQUFBLENBQUEsQ0FBd0IsRUFBa0IsT0FBTixTQUFwQztDQUFBLENBQ0EsQ0FBSSxPQURKLEVBQ2dCO0NBRGhCLENBRUEsQ0FBZ0IsU0FBWSxDQUE1QixHQUE4QztDQUY5QyxDQUdBLE1BQUEsR0FBUyxLQUFULENBQUE7Q0FDQSxDQUFBLEVBQUcsTUFBSCxF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QUFBLDBCQUFBO0NBQUEsQ0FBQSxDQUFhLENBQW9CLENBQXBCLElBQWdCLENBQTdCLENBQTZCLElBQWhCLE1BQUE7Q0FBYixDQUVBLENBQWMsT0FBQSxDQUFkLEVBQTJCLFVBQWI7Q0FFZCxDQUFBLEVBQUcsQ0FBZSxLQUFsQixDQUFHO0NBQ0QsQ0FBbUQsQ0FBckMsQ0FBZCxDQUFjLEVBQUEsQ0FBQSxHQUFkLFVBQWM7SUFMaEI7Q0FBQSxDQU1BLENBQVUsQ0FBaUIsR0FBM0IsRUFBdUIsRUFBZSxDQUE1QjtDQUNWLENBQU8sQ0FBRSxJQUFULEVBQU8sRUFBQTtDQVJZOztBQVVyQixDQTNVQSxFQTJVZSxDQUFBLEtBQUMsR0FBaEI7Q0FFRSxLQUFBLENBQUE7Q0FBQSxDQUFBLENBQVUsQ0FBQSxHQUFWLE1BQXVCLFVBQWI7Q0FFVixDQUFBLEVBQXdELENBQVcsRUFBWDtDQUF4RCxDQUErQyxDQUFyQyxDQUFWLEdBQUEsQ0FBVSxhQUFBO0lBRlY7Q0FHQSxFQUFPLENBQWtCLENBQWxCLEVBQU8sRUFBUDtDQUxNOztBQU9mLENBbFZBLEVBa1ZjLEtBQUEsQ0FBQyxFQUFmO0NBQ0UsQ0FBQSxFQUF1QyxDQUF2QztDQUFBLENBQStCLENBQXhCLEVBQUEsRUFBQSxDQUFRLEdBQVI7SUFBUDtDQUNBLE9BQUEsQ0FBTztDQUZLOztBQUlkLENBdFZBLEVBdVZFLEdBREksQ0FBTjtDQUNFLENBQUEsVUFBQTtDQUFBLENBQ0EsSUFBb0IsRUFBcEI7Q0FEQSxDQUVBLElBQW9CLEtBQXBCO0NBRkEsQ0FHQSxJQUFvQixFQUFwQjtDQTFWRixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCJcclxuXHJcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xyXG5cclxuZnMgPSByZXF1aXJlICdmcydcclxuXHJcbndyZW5jaCA9IHJlcXVpcmUgXCJ3cmVuY2hcIlxyXG5cclxubWluaW1hdGNoID0gcmVxdWlyZSBcIm1pbmltYXRjaFwiXHJcblxyXG5jb25maWcgPSByZXF1aXJlICcuL2NvbmZpZydcclxuXHJcbnJlcXVpcmVNb2R1bGUgPSBudWxsXHJcblxyXG53aW5kb3dzRHJpdmUgPSAvXltBLVphLXpdOlxcXFwvXHJcblxyXG53aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xyXG5cclxucGF0aFNlcGFyYXRvciA9IGlmIHdpbjMyIHRoZW4gJ1xcXFwnIGVsc2UgJy8nXHJcblxyXG5jb21waWxlZEphdmFzY3JpcHREaXIgPSBcIlwiXHJcblxyXG5tb2R1bGVzID0gbnVsbFxyXG5cclxuZGV0ZWN0ZWRNb2R1bGVDb3VudCA9IDBcclxuXHJcbmluamVjdGVkQ29uZmlnU3RhcnQgPSBcIi8vPj5TdGFydCAtIEF1dG9tb2R1bGUgaW5qZWN0ZWQgY29uZmlnLiBHRU5FUkFURUQgQ09ERSwgRE9OVCBDSEFOR0UgLVxcblwiXHJcbmluamVjdGVkQ29uZmlnRW5kID0gXCJcXG4vLz4+RW5kIC0gQXV0b21vZHVsZSBpbmplY3RlZCBjb25maWcuXFxuXCJcclxuXHJcbnJlZ2lzdHJhdGlvbiA9IChtaW1vc2FDb25maWcsIHJlZ2lzdGVyKSAtPlxyXG4gIGNvbXBpbGVkSmF2YXNjcmlwdERpciA9IG1pbW9zYUNvbmZpZy53YXRjaC5jb21waWxlZEphdmFzY3JpcHREaXJcclxuICBlID0gbWltb3NhQ29uZmlnLmV4dGVuc2lvbnNcclxuICByZXF1aXJlTW9kdWxlID0gbWltb3NhQ29uZmlnLmluc3RhbGxlZE1vZHVsZXNbXCJtaW1vc2EtcmVxdWlyZVwiXVxyXG4gIHJlZ2lzdGVyIFsncG9zdEJ1aWxkJ10sICAgICAgICAgICAgICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZEF1dG9Nb2R1bGVzXHJcbiAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemVcclxuICAgIHJlZ2lzdGVyIFsnYWRkJywndXBkYXRlJywncmVtb3ZlJ10sICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZEF1dG9Nb2R1bGVzLCBbZS5qYXZhc2NyaXB0Li4uLCBlLnRlbXBsYXRlLi4uXVxyXG4gIGVsc2VcclxuICAgIHJlZ2lzdGVyIFsnYWRkJywndXBkYXRlJywncmVtb3ZlJ10sICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZFBhdGhzT3ZlcnJpZGVJZk1hdGNoXHJcblxyXG5fYnVpbGRQYXRoc092ZXJyaWRlSWZNYXRjaCA9IChtaW1vc2FDb25maWcsIG9wdGlvbnMsIG5leHQpIC0+XHJcbiAganNTb3VyY2VEaXIgPSBcIiN7bWltb3NhQ29uZmlnLndhdGNoLnNvdXJjZURpcn0je3BhdGhTZXBhcmF0b3J9I3ttaW1vc2FDb25maWcud2F0Y2guamF2YXNjcmlwdERpcn1cIlxyXG4gIGRpckxpc3QgPSBfX2dldERpcnMganNTb3VyY2VEaXJcclxuICAjIFVubGVzcyB0aGVyZSBpcyBhIG5ldyBtb2R1bGUsIHdlIGNhbiBjb250aW51ZSB1c2luZyB0aGUgb3JpZ2luYWwgbW9kdWxlcyBjb25maWdzXHJcbiAgdW5sZXNzIGRpckxpc3QubGVuZ3RoIGlzIGRldGVjdGVkTW9kdWxlQ291bnQgYW5kIG1vZHVsZXM/XHJcbiAgICByZXR1cm4gX2J1aWxkQXV0b01vZHVsZXMgbWltb3NhQ29uZmlnLCBvcHRpb25zLCBuZXh0XHJcblxyXG4gICMgVXBkYXRlIHRoZSBtb2R1bGUgbWF0Y2hpbmcgdGhpcyBmaWxlLCBhbmQgYW55IG1vZHVsZXMgdmVyc2lvbmVkIG9mZiB0aGUgbWF0Y2hpbmcgbW9kdWxlXHJcbiAgZm9yIG1vZHVsZUNvbmZpZyBpbiBtb2R1bGVzXHJcbiAgICBpZiBtb2R1bGVDb25maWcudmVyc2lvbk9mPyBhbmQgb3B0aW9ucy5pbnB1dEZpbGUuaW5kZXhPZihfX2RldGVybWluZVBhdGgobW9kdWxlQ29uZmlnLmJhc2VVcmwsIGpzU291cmNlRGlyKSkgPiAtMVxyXG4gICAgICBfX3VwZGF0ZU1vZHVsZVZlcnNpb25DaGFpbiBtb2R1bGVDb25maWdcclxuICAgIFxyXG4gIG5leHQoKVxyXG5cclxuX191cGRhdGVNb2R1bGVWZXJzaW9uQ2hhaW4gPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMgPSBfX2dldEluY2x1ZGVGaWxlcyBtb2R1bGVDb25maWdcclxuICBfX2FkZE90aGVyTW9kdWxlSW5jbHVkZXMgbW9kdWxlQ29uZmlnXHJcbiAgZG9udEJ1aWxkID0gbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZG9udEJ1aWxkXHJcbiAgdW5sZXNzIGRvbnRCdWlsZC5pbmRleE9mKG1vZHVsZUNvbmZpZy5uYW1lKSA+IC0xIG9yIGRvbnRCdWlsZC5pbmRleE9mKG1vZHVsZUNvbmZpZy5iYXNlVXJsKSA+IC0xXHJcbiAgICBfX3VwZGF0ZURhdGFNYWluIG1vZHVsZUNvbmZpZ1xyXG4gIGZvciBtIGluIG1vZHVsZXMgd2hlbiBtLnZlcnNpb25PZj8gYW5kIChtLnZlcnNpb25PZiBpcyBtb2R1bGVDb25maWcubmFtZSBvciBtLnZlcnNpb25PZiBpcyBtb2R1bGVDb25maWcuYmFzZVVybClcclxuICAgIF9fdXBkYXRlTW9kdWxlVmVyc2lvbkNoYWluKG0pXHJcblxyXG5fYnVpbGRBdXRvTW9kdWxlcyA9IChtaW1vc2FDb25maWcsIG9wdGlvbnMsIG5leHQpIC0+XHJcbiAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemU/XHJcbiAgICByZXR1cm4gbmV4dCgpIHVubGVzcyBvcHRpb25zLnJ1bkNvbmZpZ3M/Lmxlbmd0aCA+IDBcclxuICBtb2R1bGVzID0gX19nZXRNb2R1bGVDb25maWdzIG1pbW9zYUNvbmZpZ1xyXG4gIGZvciBtb2R1bGVDb25maWcgaW4gbW9kdWxlc1xyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcyA9IF9fZ2V0SW5jbHVkZUZpbGVzIG1vZHVsZUNvbmZpZ1xyXG4gIFxyXG4gICMgQWZ0ZXIgYnVpbGRpbmcgaW5jbHVkZUZpbGVzIGZvciBhbGwgbW9kdWxlcywgd2UgY2FuIGFkZFxyXG4gICMgZGVwZW5kZW5jaWVzIG9mIGluY2x1ZGVkIG1vZHVsZXMgdG8gdGhlIG1vZHVsZUNvbmZpZ1xyXG4gIGZvciBtb2R1bGVDb25maWcgaW4gbW9kdWxlc1xyXG4gICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzIG1vZHVsZUNvbmZpZ1xyXG4gICAgZG9udEJ1aWxkID0gbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZG9udEJ1aWxkXHJcbiAgICB1bmxlc3MgZG9udEJ1aWxkLmluZGV4T2YobW9kdWxlQ29uZmlnLm5hbWUpID4gLTEgb3IgZG9udEJ1aWxkLmluZGV4T2YobW9kdWxlQ29uZmlnLmJhc2VVcmwpID4gLTFcclxuICAgICAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemU/XHJcbiAgICAgICAgX19hcHBseVRvQ29uZmlnKHJ1bkNvbmZpZywgbW9kdWxlQ29uZmlnKSBmb3IgcnVuQ29uZmlnIGluIG9wdGlvbnMucnVuQ29uZmlnc1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgX191cGRhdGVEYXRhTWFpbiBtb2R1bGVDb25maWdcclxuXHJcbiAgbmV4dCgpXHJcblxyXG5fX2dldE1vZHVsZUNvbmZpZ3MgPSAobWltb3NhQ29uZmlnLCBkaXJMaXN0KSAtPlxyXG4gIG1vZHVsZU5hbWVzID0gZGlyTGlzdFxyXG4gIHVubGVzcyBkaXJMaXN0P1xyXG4gICAgbW9kdWxlTmFtZXMgPSBfX2dldERpcnMoXCIje21pbW9zYUNvbmZpZy53YXRjaC5zb3VyY2VEaXJ9I3twYXRoU2VwYXJhdG9yfSN7bWltb3NhQ29uZmlnLndhdGNoLmphdmFzY3JpcHREaXJ9XCIpXHJcbiAgZGV0ZWN0ZWRNb2R1bGVDb3VudCA9IG1vZHVsZU5hbWVzLmxlbmd0aFxyXG4gIG1vZHVsZUNvbmZpZ3MgPSBtb2R1bGVOYW1lcy5tYXAgKGRpck5hbWUpIC0+XHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwiI3tkaXJOYW1lfS8je2Rpck5hbWV9LWJ1aWx0XCJcclxuICAgICAgYmFzZVVybDogZGlyTmFtZVxyXG4gICAgICBpbmNsdWRlOiBbXVxyXG4gICAgICBwYXR0ZXJuczogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUucGF0dGVybnNcclxuICAgICAgZXhjbHVkZTogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZXhjbHVkZVxyXG4gICAgICBleGNsdWRlUmVnZXg6IG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLmV4Y2x1ZGVSZWdleFxyXG4gICAgICBwbHVnaW5zOiBtaW1vc2FDb25maWcucmVxdWlyZUJ1aWxkQXV0b01vZHVsZS5wbHVnaW5zXHJcbiAgICAgIGRhdGFNYWluOiBcIm1haW4uanNcIlxyXG4gICAgfVxyXG4gIGZvciB1c2VyQ29uZmlnIGluIG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLm1vZHVsZXNcclxuICAgIF9fYXBwbHlVc2VyQ29uZmlncyh1c2VyQ29uZmlnLCBtb2R1bGVDb25maWdzKVxyXG4gIHJldHVybiBtb2R1bGVDb25maWdzXHJcblxyXG5fX2dldERpcnMgPSAocm9vdERpcikgLT5cclxuICBmcy5yZWFkZGlyU3luYyhyb290RGlyKS5maWx0ZXIgKGZpbGUpIC0+XHJcbiAgICBmaWxlWzBdIGlzbnQgJy4nIGFuZCBmcy5zdGF0U3luYyhcIiN7cm9vdERpcn0je3BhdGhTZXBhcmF0b3J9I3tmaWxlfVwiKS5pc0RpcmVjdG9yeSgpXHJcblxyXG5fX2FwcGx5VXNlckNvbmZpZ3MgPSAodXNlckNvbmZpZywgbW9kdWxlcykgLT5cclxuICBtYXRjaGVkTW9kdWxlcyA9IG1vZHVsZXMuZmlsdGVyIChtKSAtPlxyXG4gICAgbS5uYW1lIGlzIHVzZXJDb25maWcubmFtZSBvciBtLmJhc2VVcmwgaXMgdXNlckNvbmZpZy5iYXNlVXJsXHJcbiAgaWYgbWF0Y2hlZE1vZHVsZXMubGVuZ3RoID4gMVxyXG4gICAgIyBzaG91bGQgbG9nIHRoaXMgdXNpbmcgbWltb3NhIGxvZ2dlclxyXG4gICAgY29uc29sZS5sb2cgXCJTaG91bGQgaGF2ZSBmb3VuZCBhdCBtb3N0IG9uZSBtYXRjaFwiXHJcbiAgICByZXR1cm5cclxuICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggaXMgMVxyXG4gICAgbWF0Y2ggPSBtYXRjaGVkTW9kdWxlc1swXVxyXG4gICAgbWF0Y2gubmFtZSA9IHVzZXJDb25maWcubmFtZVxyXG4gICAgaWYgdXNlckNvbmZpZy5iYXNlVXJsPyBhbmQgdXNlckNvbmZpZy5iYXNlVXJsIGlzbnQgXCJcIlxyXG4gICAgICBtYXRjaC5iYXNlVXJsID0gdXNlckNvbmZpZy5iYXNlVXJsXHJcbiAgICBpZiB1c2VyQ29uZmlnLmluY2x1ZGU/Lmxlbmd0aCA+IDBcclxuICAgICAgbWF0Y2guaW5jbHVkZSA9IHVzZXJDb25maWcuaW5jbHVkZVxyXG4gICAgbWF0Y2gucGF0dGVybnMgPSB1c2VyQ29uZmlnLnBhdHRlcm5zXHJcbiAgICBtYXRjaC5leGNsdWRlID0gdXNlckNvbmZpZy5leGNsdWRlXHJcbiAgICBtYXRjaC5leGNsdWRlUmVnZXggPSB1c2VyQ29uZmlnLmV4Y2x1ZGVSZWdleFxyXG4gICAgbWF0Y2gucGx1Z2lucyA9IHVzZXJDb25maWcucGx1Z2luc1xyXG4gICAgaWYgdXNlckNvbmZpZy52ZXJzaW9uT2Y/IGFuZCB1c2VyQ29uZmlnLnZlcnNpb25PZiBpc250IFwiXCJcclxuICAgICAgbWF0Y2gudmVyc2lvbk9mID0gdXNlckNvbmZpZy52ZXJzaW9uT2ZcclxuICAgIG1hdGNoLmRhdGFNYWluID0gdXNlckNvbmZpZy5kYXRhTWFpblxyXG4gICAgbWF0Y2guaW5jbHVkZUFsaWFzZWRGaWxlcyA9IHVzZXJDb25maWcuaW5jbHVkZUFsaWFzZWRGaWxlc1xyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpcyAwXHJcbiAgICBtb2R1bGVzLnB1c2ggdXNlckNvbmZpZ1xyXG5cclxuX19nZXRJbmNsdWRlRmlsZXMgPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gICMgU2V0dXAgaW5jbHVkZUZpbGVzIGFycmF5LCBhbmQgc2V0dXAgcGF0aCBhbGlhcyBmb3IgbGF0ZXIgdXNlXHJcbiAgaW5jbHVkZUZpbGVzID0gW11cclxuICBtb2R1bGVDb25maWcuaW5jbHVkZUZvbGRlciA9IF9fZGV0ZXJtaW5lUGF0aCBtb2R1bGVDb25maWcuYmFzZVVybCwgY29tcGlsZWRKYXZhc2NyaXB0RGlyXHJcbiAgYmFzZSA9IF9fbm9ybWFsaXplKHBhdGguam9pbihtb2R1bGVDb25maWcuaW5jbHVkZUZvbGRlciwgcGF0aFNlcGFyYXRvcikpXHJcbiAgZmlsZXMgPSBfX2dldE1vZHVsZUZpbGVzKG1vZHVsZUNvbmZpZylcclxuXHJcbiAgIyBGaWx0ZXIgb3V0IGFueSBmaWxlcyB0aGF0IHNob3VsZCBiZSBsb2FkZWQgd2l0aCBhIHBsdWdpbiwgYW5kIGFkZFxyXG4gICMgdGhlbSB0byB0aGUgaW5jbHVkZUZpbGVzIGFycmF5LCBwcmVmaXhlZCB3aXRoIHRoZSBwbHVnaW4gcGF0aFxyXG4gIGZpbGVzID0gX19maWx0ZXJQbHVnaW5GaWxlcyhtb2R1bGVDb25maWcsIGZpbGVzLCBpbmNsdWRlRmlsZXMsIGJhc2UpIGlmIG1vZHVsZUNvbmZpZy5wbHVnaW5zPy5sZW5ndGggPiAwXHJcbiAgXHJcbiAgIyBGaWx0ZXIgcmVtYWluaW5nIGZpbGVzIGFnYWluc3QgaW5jbHVkZSBwYXR0ZXJuc1xyXG4gIGZpbHRlcmVkSW5jbHVkZXMgPSBfX2ZpbHRlckluY2x1ZGVGaWxlcyhmaWxlcywgbW9kdWxlQ29uZmlnLnBhdHRlcm5zLCBiYXNlKVxyXG4gIGluY2x1ZGVGaWxlcyA9IGluY2x1ZGVGaWxlcy5jb25jYXQgZmlsdGVyZWRJbmNsdWRlc1xyXG5cclxuICBpZiBtb2R1bGVDb25maWcudmVyc2lvbk9mPyBhbmQgbm90IG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICBfX3NldFBhdGhBbGlhcyBtb2R1bGVDb25maWdcclxuXHJcbiAgcmV0dXJuIGluY2x1ZGVGaWxlc1xyXG5cclxuX19kZXRlcm1pbmVQYXRoID0gKHRoZVBhdGgsIHJlbGF0aXZlVG8pIC0+XHJcbiAgcmV0dXJuIHRoZVBhdGggaWYgd2luZG93c0RyaXZlLnRlc3QgdGhlUGF0aFxyXG4gIHJldHVybiB0aGVQYXRoIGlmIHRoZVBhdGguaW5kZXhPZihcIi9cIikgaXMgMFxyXG4gIHBhdGguam9pbiByZWxhdGl2ZVRvLCB0aGVQYXRoXHJcblxyXG5fX2dldE1vZHVsZUZpbGVzID0gKG1vZHVsZUNvbmZpZykgLT5cclxuICBmaWxlcyA9IHdyZW5jaC5yZWFkZGlyU3luY1JlY3Vyc2l2ZSBtb2R1bGVDb25maWcuaW5jbHVkZUZvbGRlclxyXG4gIGZpbGVzID0gZmlsZXMubWFwIChmaWxlKSAtPlxyXG4gICAgcGF0aC5qb2luIG1vZHVsZUNvbmZpZy5pbmNsdWRlRm9sZGVyLCBmaWxlXHJcbiAgLmZpbHRlciAoZmlsZSkgLT5cclxuICAgIGZzLnN0YXRTeW5jKGZpbGUpLmlzRmlsZSgpIGFuZFxyXG4gICAgbW9kdWxlQ29uZmlnLmV4Y2x1ZGUuaW5kZXhPZihmaWxlKSBpcyAtMSBhbmRcclxuICAgIG5vdCAobW9kdWxlQ29uZmlnLmV4Y2x1ZGVSZWdleCBhbmQgZmlsZS5tYXRjaChtb2R1bGVDb25maWcuZXhjbHVkZVJlZ2V4KSlcclxuICAubWFwIF9fbm9ybWFsaXplXHJcbiAgcmV0dXJuIGZpbGVzXHJcblxyXG5fX2ZpbHRlclBsdWdpbkZpbGVzID0gKG1vZHVsZUNvbmZpZywgZmlsZXMsIGluY2x1ZGVGaWxlcywgYmFzZSkgLT5cclxuICBmb3IgcGx1Z2luQ29uZmlnIGluIG1vZHVsZUNvbmZpZy5wbHVnaW5zXHJcbiAgICBwbHVnaW5Db25maWcucGF0dGVybnMuZm9yRWFjaCAocGF0dGVybikgLT5cclxuICAgICAgYWJzUGF0dGVybiA9IF9fbm9ybWFsaXplKHBhdGgucmVzb2x2ZShiYXNlLCBwYXR0ZXJuKSlcclxuICAgICAgIyBUaGUgZmlsdGVyZWQgcmVzdWx0IHdpbGwgYWN0dWFsbHkgYmUgdGhlIGZpbGVzIHRoYXRcclxuICAgICAgIyBkb24ndCBtYXRjaCB0aGUgcGx1Z2luIHBhdHRlcm5zXHJcbiAgICAgIGZpbGVzID0gZmlsZXMuZmlsdGVyIChmaWxlKSAtPlxyXG4gICAgICAgIGlmIG1pbmltYXRjaCBmaWxlLCBhYnNQYXR0ZXJuXHJcbiAgICAgICAgICBpbmNsdWRlRmlsZXMucHVzaCBcIiN7cGx1Z2luQ29uZmlnLnBhdGh9ISN7ZmlsZX1cIlxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICByZXR1cm4gZmlsZXNcclxuXHJcbl9fZmlsdGVySW5jbHVkZUZpbGVzID0gKGZpbGVzLCBwYXR0ZXJucywgYmFzZSkgLT5cclxuICByZXN1bHQgPSBbXVxyXG4gIHBhdHRlcm5zLmZvckVhY2ggKHBhdHRlcm4pIC0+XHJcbiAgICBhYnNQYXR0ZXJuID0gX19ub3JtYWxpemUocGF0aC5yZXNvbHZlKGJhc2UsIHBhdHRlcm4pKVxyXG4gICAgcmVzdWx0LnB1c2goZmlsZSkgZm9yIGZpbGUgaW4gZmlsZXMgd2hlbiBtaW5pbWF0Y2goZmlsZSwgYWJzUGF0dGVybilcclxuICByZXR1cm4gcmVzdWx0XHJcblxyXG5fX3NldFBhdGhBbGlhcyA9IChtb2R1bGVDb25maWcpIC0+XHJcbiAgbWF0Y2hlZE1vZHVsZXMgPSBtb2R1bGVzLmZpbHRlciAobSkgLT5cclxuICAgIG1vZHVsZUNvbmZpZy52ZXJzaW9uT2YgaXMgbS5uYW1lIG9yIG1vZHVsZUNvbmZpZy52ZXJzaW9uT2YgaXMgbS5iYXNlVXJsXHJcbiAgaWYgbWF0Y2hlZE1vZHVsZXMubGVuZ3RoIGlzbnQgMVxyXG4gICAgY29uc29sZS5sb2cgXCJWZXJzaW9uIG9mIGRpZG4ndCBtYXRjaCBvciBtYXRjaGVkIG1vcmUgdGhhbiBvbmUgbW9kdWxlXCJcclxuICAgIHJldHVyblxyXG4gIG1hdGNoID0gbWF0Y2hlZE1vZHVsZXNbMF1cclxuICBpZiBtYXRjaC52ZXJzaW9uT2Y/XHJcbiAgICB1bmxlc3MgbWF0Y2gucGF0aEFsaWFzP1xyXG4gICAgICBfX3NldFBhdGhBbGlhcyBtYXRjaFxyXG4gICAgbW9kdWxlQ29uZmlnLnBhdGhBbGlhcyA9IG1hdGNoLnBhdGhBbGlhc1xyXG4gICAgIyBUaGlzIG1lYW5zIHRoYXQgd2UgaGF2ZSBhdCBsZWFzdCBhIHRocmVlIHRpZXIgdmVyc2lvbiBvZi5cclxuICAgICMgV2UgbmVlZCB0byBrZWVwIGEgbGlzdCBvZiBhbGwgYmFzZVVybHMgc28gd2UgY2FuIGNvcnJlY3RseSBhbGlhcyB0aG9zZSBmaWxlc1xyXG4gICAgbW9kdWxlQ29uZmlnLnZlcnNpb25CYXNlVXJsID0gW10gdW5sZXNzIG1vZHVsZUNvbmZpZy52ZXJzaW9uQmFzZVVybD9cclxuICAgIG1vZHVsZUNvbmZpZy52ZXJzaW9uQmFzZVVybC5wdXNoIG1hdGNoLmJhc2VVcmxcclxuICBlbHNlXHJcbiAgICBtb2R1bGVDb25maWcucGF0aEFsaWFzID0gbWF0Y2guYmFzZVVybFxyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlLnB1c2ggbWF0Y2gubmFtZVxyXG5cclxuX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzID0gKG1vZHVsZUNvbmZpZykgLT5cclxuICByZXR1cm4gdW5sZXNzIG1vZHVsZUNvbmZpZy5pbmNsdWRlPy5sZW5ndGggPiAwXHJcbiAgZm9yIGluY2x1ZGUgaW4gbW9kdWxlQ29uZmlnLmluY2x1ZGUgd2hlbiBpbmNsdWRlIGlzbnQgbW9kdWxlQ29uZmlnLm5hbWUgYW5kIGluY2x1ZGUgaXNudCBtb2R1bGVDb25maWcuYmFzZVVybFxyXG4gICAgZm9yIG0gaW4gbW9kdWxlc1xyXG4gICAgICBpZiBpbmNsdWRlIGlzIG0ubmFtZSBvciBpbmNsdWRlIGlzIG0uYmFzZVVybFxyXG4gICAgICAgIGlmIG0uaW5jbHVkZT8ubGVuZ3RoID4gMFxyXG4gICAgICAgICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzKG0pXHJcbiAgICAgICAgaWYgbS5pbmNsdWRlRmlsZXM/XHJcbiAgICAgICAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzID0gbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5jb25jYXQgbS5pbmNsdWRlRmlsZXNcclxuICAjIFByZXZlbnQgYWRkaW5nIGR1cGxpY2F0ZXNcclxuICBtb2R1bGVDb25maWcuaW5jbHVkZSA9IG51bGxcclxuXHJcbl9fdXBkYXRlRGF0YU1haW4gPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIHJldHVybiB1bmxlc3MgbW9kdWxlQ29uZmlnLnBhdGhBbGlhcz8gYW5kIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXMgaXNudCBtb2R1bGVDb25maWcuYmFzZVVybFxyXG4gIGRhdGFNYWluID0gX19kZXRlcm1pbmVQYXRoIG1vZHVsZUNvbmZpZy5kYXRhTWFpbiwgbW9kdWxlQ29uZmlnLmluY2x1ZGVGb2xkZXJcclxuICBpZiBmcy5leGlzdHNTeW5jKGRhdGFNYWluKSBhbmQgZnMuc3RhdFN5bmMoZGF0YU1haW4pLmlzRmlsZSgpXHJcbiAgICBkYXRhID0gZnMucmVhZEZpbGVTeW5jIGRhdGFNYWluLCB7ZW5jb2Rpbmc6ICd1dGY4J31cclxuICAgIGRhdGEgPSBfX3JlbW92ZUluamVjdGVkQ29uZmlnIGRhdGFcclxuICAgIGluamVjdGVkQ29uZmlnID0gXCJyZXF1aXJlLmNvbmZpZyh7cGF0aHM6I3tKU09OLnN0cmluZ2lmeShfX2dldFBhdGhPdmVycmlkZXMobW9kdWxlQ29uZmlnKSl9fSlcIlxyXG4gICAgZnMud3JpdGVGaWxlU3luYyBkYXRhTWFpbiwgXCIje2luamVjdGVkQ29uZmlnU3RhcnR9I3tpbmplY3RlZENvbmZpZ30je2luamVjdGVkQ29uZmlnRW5kfSN7ZGF0YX1cIlxyXG4gICAgcmV0dXJuXHJcbiAgZWxzZVxyXG4gICAgcm9vdERhdGFNYWluID0gbnVsbFxyXG4gICAgZm9yIG0gaW4gbW9kdWxlcyB3aGVuIG0uYmFzZVVybCBpcyBtb2R1bGVDb25maWcucGF0aEFsaWFzXHJcbiAgICAgIHJvb3REYXRhTWFpbiA9IF9fZGV0ZXJtaW5lUGF0aCBtLmRhdGFNYWluLCBtLmluY2x1ZGVGb2xkZXJcclxuICAgIGlmIGZzLmV4aXN0c1N5bmMocm9vdERhdGFNYWluKSBhbmQgZnMuc3RhdFN5bmMocm9vdERhdGFNYWluKS5pc0ZpbGUoKVxyXG4gICAgICBkYXRhID0gZnMucmVhZEZpbGVTeW5jIHJvb3REYXRhTWFpbiwge2VuY29kaW5nOid1dGY4J31cclxuICAgICAgZGF0YSA9IF9fcmVtb3ZlSW5qZWN0ZWRDb25maWcgZGF0YVxyXG4gICAgICBpbmplY3RlZENvbmZpZyA9IFwicmVxdWlyZS5jb25maWcoe3BhdGhzOiN7SlNPTi5zdHJpbmdpZnkoX19nZXRQYXRoT3ZlcnJpZGVzKG1vZHVsZUNvbmZpZykpfX0pXCJcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyBkYXRhTWFpbiwgXCIje2luamVjdGVkQ29uZmlnU3RhcnR9I3tpbmplY3RlZENvbmZpZ30je2luamVjdGVkQ29uZmlnRW5kfSN7ZGF0YX1cIlxyXG4gICAgZWxzZVxyXG4gICAgICBjb25zb2xlLmxvZyBcIkNvdWxkbid0IGZpbmQgYSBtYWluLmpzIGZpbGUgdG8gYXVnbWVudCBmb3IgbW9kdWxlIG5hbWVkOiAje21vZHVsZUNvbmZpZy5uYW1lfVwiXHJcblxyXG5fX3JlbW92ZUluamVjdGVkQ29uZmlnID0gKGRhdGEpIC0+XHJcbiAgaiA9IGRhdGEuaW5kZXhPZihpbmplY3RlZENvbmZpZ1N0YXJ0KVxyXG4gIGsgPSBkYXRhLmluZGV4T2YoaW5qZWN0ZWRDb25maWdFbmQpXHJcbiAgdW5sZXNzIGogaXMgLTEgb3IgayBpcyAtMVxyXG4gICAgZGF0YSA9IGRhdGEuc3Vic3RyaW5nKDAsaikgKyBkYXRhLnN1YnN0cmluZyhrK2luamVjdGVkQ29uZmlnRW5kLmxlbmd0aClcclxuICByZXR1cm4gZGF0YVxyXG5cclxuX19nZXRQYXRoT3ZlcnJpZGVzID0gKG1vZHVsZUNvbmZpZykgLT5cclxuICBwYXRoT3ZlcnJpZGVzID0ge31cclxuICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmZvckVhY2ggKGZpbGUpIC0+XHJcbiAgICBwbHVnaW5JbmRleCA9IGZpbGUuaW5kZXhPZihcIiFcIilcclxuICAgIGlmIHBsdWdpbkluZGV4ID4gLTFcclxuICAgICAgYW1kRmlsZSA9IF9fZ2V0RmlsZUFNRChmaWxlLnN1YnN0cmluZyhwbHVnaW5JbmRleCsxKSkucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG4gICAgZWxzZVxyXG4gICAgICBhbWRGaWxlID0gX19nZXRGaWxlQU1EKGZpbGUpLnJlcGxhY2UocGF0aC5leHRuYW1lKGZpbGUpLCAnJylcclxuICAgIGFsaWFzID0gYW1kRmlsZVxyXG4gICAgaWYgYW1kRmlsZS5pbmRleE9mKG1vZHVsZUNvbmZpZy5iYXNlVXJsKSBpcyAwXHJcbiAgICAgIGFsaWFzID0gYW1kRmlsZS5yZXBsYWNlIG1vZHVsZUNvbmZpZy5iYXNlVXJsLCBtb2R1bGVDb25maWcucGF0aEFsaWFzXHJcbiAgICBlbHNlXHJcbiAgICAgIGlmIG1vZHVsZUNvbmZpZy52ZXJzaW9uQmFzZVVybD8ubGVuZ3RoID4gMFxyXG4gICAgICAgIGZvciBiYXNlVXJsIGluIG1vZHVsZUNvbmZpZy52ZXJzaW9uQmFzZVVybCB3aGVuIGFtZEZpbGUuaW5kZXhPZihiYXNlVXJsKSBpcyAwXHJcbiAgICAgICAgICBhbGlhcyA9IGFtZEZpbGUucmVwbGFjZSBiYXNlVXJsLCBtb2R1bGVDb25maWcucGF0aEFsaWFzXHJcbiAgICB1bmxlc3MgcGF0aE92ZXJyaWRlc1thbGlhc10/XHJcbiAgICAgIHBhdGhPdmVycmlkZXNbYWxpYXNdID0gYW1kRmlsZVxyXG4gIHJldHVybiBwYXRoT3ZlcnJpZGVzXHJcblxyXG5fX2FwcGx5VG9Db25maWcgPSAocnVuQ29uZmlnLCBtb2R1bGVDb25maWcpIC0+XHJcbiAgaWYgcnVuQ29uZmlnLm1vZHVsZXM/Lmxlbmd0aCA+IDBcclxuICAgIG1hdGNoZWRNb2R1bGVzID0gcnVuQ29uZmlnLm1vZHVsZXMuZmlsdGVyIChtKSAtPiBtLm5hbWUgaXMgbW9kdWxlQ29uZmlnLm5hbWVcclxuICAgIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCA+IDBcclxuICAgICAgZm9yIG1vZHVsZUVudHJ5IGluIG1hdGNoZWRNb2R1bGVzXHJcbiAgICAgICAgX19hcHBlbmRUb01vZHVsZSBtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnXHJcbiAgICAgIHJldHVyblxyXG4gIHJ1bkNvbmZpZy5tb2R1bGVzID0gW10gdW5sZXNzIEFycmF5LmlzQXJyYXkocnVuQ29uZmlnLm1vZHVsZXMpXHJcbiAgbW9kdWxlRW50cnkgPSB7bmFtZTogbW9kdWxlQ29uZmlnLm5hbWUsIGNyZWF0ZTogdHJ1ZSwgaW5jbHVkZTogW119XHJcbiAgX19hcHBlbmRUb01vZHVsZSBtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnXHJcbiAgcnVuQ29uZmlnLm1vZHVsZXMucHVzaCBtb2R1bGVFbnRyeVxyXG5cclxuX19hcHBlbmRUb01vZHVsZSA9IChtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnKSAtPlxyXG4gIG1vZHVsZUVudHJ5LmluY2x1ZGUgPSBbXSB1bmxlc3MgQXJyYXkuaXNBcnJheShtb2R1bGVFbnRyeS5pbmNsdWRlKVxyXG4gIGlmIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICBtb2R1bGVFbnRyeS5vdmVycmlkZSA9IHt9IHVubGVzcyBtb2R1bGVFbnRyeS5vdmVycmlkZT9cclxuICAgIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzID0ge30gdW5sZXNzIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzP1xyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5mb3JFYWNoIChmaWxlKSAtPlxyXG4gICAgICBwbHVnaW5JbmRleCA9IGZpbGUuaW5kZXhPZihcIiFcIilcclxuICAgICAgaWYgcGx1Z2luSW5kZXggPiAtMVxyXG4gICAgICAgIGFtZEZpbGUgPSBfX2dldFBsdWdpbkZpbGVBTUQgZmlsZSwgcGx1Z2luSW5kZXhcclxuICAgICAgICBwbHVnaW5JbmRleCA9IGFtZEZpbGUuaW5kZXhPZihcIiFcIilcclxuICAgICAgICAjIE9ubHkgYWxpYXMgdGhlIGZpbGUsIG5vdCB0aGUgcGx1Z2luXHJcbiAgICAgICAgZmlsZVBhcnQgPSBhbWRGaWxlLnN1YnN0cmluZyhwbHVnaW5JbmRleCsxKVxyXG4gICAgICAgIGFsaWFzZWRGaWxlID0gZmlsZVBhcnRcclxuICAgICAgICBpZiBmaWxlUGFydC5pbmRleE9mKG1vZHVsZUNvbmZpZy5iYXNlVXJsKSBpcyAwXHJcbiAgICAgICAgICBhbGlhc2VkRmlsZSA9IGZpbGVQYXJ0LnJlcGxhY2UgbW9kdWxlQ29uZmlnLmJhc2VVcmwsIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXNcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBpZiBtb2R1bGVDb25maWcudmVyc2lvbkJhc2VVcmw/Lmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgZm9yIGJhc2VVcmwgaW4gbW9kdWxlQ29uZmlnLnZlcnNpb25CYXNlVXJsIHdoZW4gZmlsZVBhcnQuaW5kZXhPZihiYXNlVXJsKSBpcyAwXHJcbiAgICAgICAgICAgICAgYWxpYXNlZEZpbGUgPSBmaWxlUGFydC5yZXBsYWNlIGJhc2VVcmwsIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXNcclxuICAgICAgICBhbGlhcyA9IFwiI3thbWRGaWxlLnN1YnN0cmluZygwLHBsdWdpbkluZGV4KX0hI3thbGlhc2VkRmlsZX1cIlxyXG4gICAgICAgIG1vZHVsZUVudHJ5LmluY2x1ZGUucHVzaChhbGlhcykgaWYgbW9kdWxlQ29uZmlnLmluY2x1ZGVBbGlhc2VkRmlsZXNcclxuICAgICAgICBhbGlhc2VkRmlsZSA9IGFsaWFzZWRGaWxlLnJlcGxhY2UocGF0aC5leHRuYW1lKGZpbGUpLCAnJylcclxuICAgICAgICB1bmxlc3MgbW9kdWxlRW50cnkub3ZlcnJpZGUucGF0aHNbYWxpYXNlZEZpbGVdP1xyXG4gICAgICAgICAgbW9kdWxlRW50cnkub3ZlcnJpZGUucGF0aHNbYWxpYXNlZEZpbGVdID0gZmlsZVBhcnQucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgYW1kRmlsZSA9IF9fZ2V0RmlsZUFNRChmaWxlKS5yZXBsYWNlKHBhdGguZXh0bmFtZShmaWxlKSwgJycpXHJcbiAgICAgICAgYWxpYXMgPSBhbWRGaWxlXHJcbiAgICAgICAgaWYgYW1kRmlsZS5pbmRleE9mKG1vZHVsZUNvbmZpZy5iYXNlVXJsKSBpcyAwXHJcbiAgICAgICAgICBhbGlhcyA9IGFtZEZpbGUucmVwbGFjZSBtb2R1bGVDb25maWcuYmFzZVVybCwgbW9kdWxlQ29uZmlnLnBhdGhBbGlhc1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGlmIG1vZHVsZUNvbmZpZy52ZXJzaW9uQmFzZVVybD8ubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICBmb3IgYmFzZVVybCBpbiBtb2R1bGVDb25maWcudmVyc2lvbkJhc2VVcmwgd2hlbiBhbWRGaWxlLmluZGV4T2YoYmFzZVVybCkgaXMgMFxyXG4gICAgICAgICAgICAgIGFsaWFzID0gYW1kRmlsZS5yZXBsYWNlIGJhc2VVcmwsIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXNcclxuICAgICAgICBtb2R1bGVFbnRyeS5pbmNsdWRlLnB1c2goYWxpYXMpIGlmIG1vZHVsZUNvbmZpZy5pbmNsdWRlQWxpYXNlZEZpbGVzXHJcbiAgICAgICAgdW5sZXNzIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzW2FsaWFzXT9cclxuICAgICAgICAgIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzW2FsaWFzXSA9IGFtZEZpbGVcclxuICBlbHNlXHJcbiAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmZvckVhY2ggKGZpbGUpIC0+XHJcbiAgICAgIHBsdWdpbkluZGV4ID0gZmlsZS5pbmRleE9mKFwiIVwiKVxyXG4gICAgICBpZiBwbHVnaW5JbmRleCA+IC0xXHJcbiAgICAgICAgbW9kdWxlRW50cnkuaW5jbHVkZS5wdXNoIF9fZ2V0UGx1Z2luRmlsZUFNRChmaWxlLCBwbHVnaW5JbmRleClcclxuICAgICAgZWxzZVxyXG4gICAgICAgIG1vZHVsZUVudHJ5LmluY2x1ZGUucHVzaCBfX2dldEZpbGVBTUQoZmlsZSkucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG5cclxuX19nZXRQbHVnaW5GaWxlQU1EID0gKGZpbGUsIHBsdWdpbkluZGV4KSAtPlxyXG4gIHBsdWdpblBhdGggPSBfX2RldGVybWluZVBhdGgoZmlsZS5zdWJzdHJpbmcoMCwgcGx1Z2luSW5kZXgpICsgXCIuanNcIiwgY29tcGlsZWRKYXZhc2NyaXB0RGlyKVxyXG4gICMgVXNlIGFsaWFzIGlmIHRoZSBwbHVnaW4gaGFzIGJlZW4gYWxpYXNlZFxyXG4gIHBsdWdpbkFsaWFzID0gcmVxdWlyZU1vZHVsZS5tYW5pcHVsYXRlUGF0aFdpdGhBbGlhcyBwbHVnaW5QYXRoXHJcbiAgIyBJZiBub3QgYWxpYXNlZCwgZ2V0IHVybC9hbWQgcGF0aFxyXG4gIGlmIHBsdWdpbkFsaWFzIGlzIHBsdWdpblBhdGhcclxuICAgIHBsdWdpbkFsaWFzID0gcGF0aC5yZWxhdGl2ZShjb21waWxlZEphdmFzY3JpcHREaXIsIHBsdWdpbkFsaWFzKS5zcGxpdChwYXRoLnNlcCkuam9pbihcIi9cIikucmVwbGFjZShcIi5qc1wiLCAnJylcclxuICBmaWxlQU1EID0gX19nZXRGaWxlQU1EKGZpbGUuc3Vic3RyaW5nKHBsdWdpbkluZGV4KzEpKVxyXG4gIHJldHVybiBcIiN7cGx1Z2luQWxpYXN9ISN7ZmlsZUFNRH1cIlxyXG5cclxuX19nZXRGaWxlQU1EID0gKGZpbGUpIC0+XHJcbiAgIyBVc2UgYWxpYXMgaWYgcGF0aCBoYXMgYmVlbiBhbGlhc2VkXHJcbiAgZmlsZUFNRCA9IHJlcXVpcmVNb2R1bGUubWFuaXB1bGF0ZVBhdGhXaXRoQWxpYXMgZmlsZVxyXG4gICMgR2V0IHJlbGF0aXZlIHVybC9hbWQgcGF0aCBpZiBub3QgYWxpYXNlZFxyXG4gIGZpbGVBTUQgPSBwYXRoLnJlbGF0aXZlKGNvbXBpbGVkSmF2YXNjcmlwdERpciwgZmlsZSkgaWYgZmlsZUFNRCBpcyBmaWxlXHJcbiAgcmV0dXJuIGZpbGVBTUQuc3BsaXQocGF0aC5zZXApLmpvaW4oXCIvXCIpXHJcblxyXG5fX25vcm1hbGl6ZSA9IChmaWxlcGF0aCkgLT4gXHJcbiAgcmV0dXJuIGZpbGVwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKSBpZiB3aW4zMlxyXG4gIHJldHVybiBmaWxlcGF0aFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG4gIHJlZ2lzdHJhdGlvbjogcmVnaXN0cmF0aW9uXHJcbiAgZGVmYXVsdHM6ICAgICBjb25maWcuZGVmYXVsdHNcclxuICBwbGFjZWhvbGRlcjogIGNvbmZpZy5wbGFjZWhvbGRlclxyXG4gIHZhbGlkYXRlOiAgICAgY29uZmlnLnZhbGlkYXRlIl19
