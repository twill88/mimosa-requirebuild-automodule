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
    var alias, amdFile, pluginIndex;
    pluginIndex = file.indexOf("!");
    if (pluginIndex > -1) {
      amdFile = __getFileAMD(file.substring(pluginIndex + 1)).replace(path.extname(file), '');
    } else {
      amdFile = __getFileAMD(file).replace(path.extname(file), '');
    }
    alias = amdFile.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
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
      var alias, aliasedFile, amdFile, filePart, pluginIndex;
      pluginIndex = file.indexOf("!");
      if (pluginIndex > -1) {
        amdFile = __getPluginFileAMD(file, pluginIndex);
        pluginIndex = amdFile.indexOf("!");
        filePart = amdFile.substring(pluginIndex + 1);
        aliasedFile = filePart.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
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
        alias = amdFile.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
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

//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxsaWJcXGluZGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxzcmNcXGluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFdBQUE7Q0FBQSxHQUFBLHNsQkFBQTtHQUFBLGVBQUE7O0FBRUEsQ0FGQSxFQUVPLENBQVAsRUFBTyxDQUFBOztBQUVQLENBSkEsQ0FJQSxDQUFLLENBQUEsR0FBQTs7QUFFTCxDQU5BLEVBTVMsR0FBVCxDQUFTLENBQUE7O0FBRVQsQ0FSQSxFQVFZLElBQUEsRUFBWixFQUFZOztBQUVaLENBVkEsRUFVUyxHQUFULENBQVMsR0FBQTs7QUFFVCxDQVpBLEVBWWdCLENBWmhCLFNBWUE7O0FBRUEsQ0FkQSxFQWNlLFNBQWYsRUFkQTs7QUFnQkEsQ0FoQkEsRUFnQlEsRUFBUixFQUFlLENBQVA7O0FBRVIsQ0FsQkEsRUFrQm1CLENBQUgsQ0FBQSxRQUFoQjs7QUFFQSxDQXBCQSxDQUFBLENBb0J3QixrQkFBeEI7O0FBRUEsQ0F0QkEsRUFzQlUsQ0F0QlYsR0FzQkE7O0FBRUEsQ0F4QkEsRUF3QnNCLGdCQUF0Qjs7QUFFQSxDQTFCQSxFQTBCc0IsZ0JBQXRCLHNEQTFCQTs7QUEyQkEsQ0EzQkEsRUEyQm9CLGNBQXBCLDBCQTNCQTs7QUE2QkEsQ0E3QkEsQ0E2QjhCLENBQWYsS0FBQSxDQUFDLEdBQWhCO0NBQ0UsS0FBQTtDQUFBLENBQUEsQ0FBd0IsRUFBa0IsT0FBTixTQUFwQztDQUFBLENBQ0EsQ0FBSSxPQURKLEVBQ2dCO0NBRGhCLENBRUEsQ0FBZ0IsU0FBWSxDQUE1QixHQUE4QztDQUY5QyxDQUdBLE1BQUEsR0FBUyxLQUFULENBQUE7Q0FDQSxDQUFBLEVBQUcsTUFBSCxF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aWN0XCJcclxuXHJcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xyXG5cclxuZnMgPSByZXF1aXJlICdmcydcclxuXHJcbndyZW5jaCA9IHJlcXVpcmUgXCJ3cmVuY2hcIlxyXG5cclxubWluaW1hdGNoID0gcmVxdWlyZSBcIm1pbmltYXRjaFwiXHJcblxyXG5jb25maWcgPSByZXF1aXJlICcuL2NvbmZpZydcclxuXHJcbnJlcXVpcmVNb2R1bGUgPSBudWxsXHJcblxyXG53aW5kb3dzRHJpdmUgPSAvXltBLVphLXpdOlxcXFwvXHJcblxyXG53aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xyXG5cclxucGF0aFNlcGFyYXRvciA9IGlmIHdpbjMyIHRoZW4gJ1xcXFwnIGVsc2UgJy8nXHJcblxyXG5jb21waWxlZEphdmFzY3JpcHREaXIgPSBcIlwiXHJcblxyXG5tb2R1bGVzID0gbnVsbFxyXG5cclxuZGV0ZWN0ZWRNb2R1bGVDb3VudCA9IDBcclxuXHJcbmluamVjdGVkQ29uZmlnU3RhcnQgPSBcIi8vPj5TdGFydCAtIEF1dG9tb2R1bGUgaW5qZWN0ZWQgY29uZmlnLiBHRU5FUkFURUQgQ09ERSwgRE9OVCBDSEFOR0UgLVxcblwiXHJcbmluamVjdGVkQ29uZmlnRW5kID0gXCJcXG4vLz4+RW5kIC0gQXV0b21vZHVsZSBpbmplY3RlZCBjb25maWcuXFxuXCJcclxuXHJcbnJlZ2lzdHJhdGlvbiA9IChtaW1vc2FDb25maWcsIHJlZ2lzdGVyKSAtPlxyXG4gIGNvbXBpbGVkSmF2YXNjcmlwdERpciA9IG1pbW9zYUNvbmZpZy53YXRjaC5jb21waWxlZEphdmFzY3JpcHREaXJcclxuICBlID0gbWltb3NhQ29uZmlnLmV4dGVuc2lvbnNcclxuICByZXF1aXJlTW9kdWxlID0gbWltb3NhQ29uZmlnLmluc3RhbGxlZE1vZHVsZXNbXCJtaW1vc2EtcmVxdWlyZVwiXVxyXG4gIHJlZ2lzdGVyIFsncG9zdEJ1aWxkJ10sICAgICAgICAgICAgICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZEF1dG9Nb2R1bGVzXHJcbiAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemVcclxuICAgIHJlZ2lzdGVyIFsnYWRkJywndXBkYXRlJywncmVtb3ZlJ10sICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZEF1dG9Nb2R1bGVzLCBbZS5qYXZhc2NyaXB0Li4uLCBlLnRlbXBsYXRlLi4uXVxyXG4gIGVsc2VcclxuICAgIHJlZ2lzdGVyIFsnYWRkJywndXBkYXRlJywncmVtb3ZlJ10sICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZFBhdGhzT3ZlcnJpZGVJZk1hdGNoXHJcblxyXG5fYnVpbGRQYXRoc092ZXJyaWRlSWZNYXRjaCA9IChtaW1vc2FDb25maWcsIG9wdGlvbnMsIG5leHQpIC0+XHJcbiAganNTb3VyY2VEaXIgPSBcIiN7bWltb3NhQ29uZmlnLndhdGNoLnNvdXJjZURpcn0je3BhdGhTZXBhcmF0b3J9I3ttaW1vc2FDb25maWcud2F0Y2guamF2YXNjcmlwdERpcn1cIlxyXG4gIGRpckxpc3QgPSBfX2dldERpcnMganNTb3VyY2VEaXJcclxuICAjIFVubGVzcyB0aGVyZSBpcyBhIG5ldyBtb2R1bGUsIHdlIGNhbiBjb250aW51ZSB1c2luZyB0aGUgb3JpZ2luYWwgbW9kdWxlcyBjb25maWdzXHJcbiAgdW5sZXNzIGRpckxpc3QubGVuZ3RoIGlzIGRldGVjdGVkTW9kdWxlQ291bnQgYW5kIG1vZHVsZXM/XHJcbiAgICByZXR1cm4gX2J1aWxkQXV0b01vZHVsZXMgbWltb3NhQ29uZmlnLCBvcHRpb25zLCBuZXh0XHJcblxyXG4gICMgVXBkYXRlIHRoZSBtb2R1bGUgbWF0Y2hpbmcgdGhpcyBmaWxlLCBhbmQgYW55IG1vZHVsZXMgdmVyc2lvbmVkIG9mZiB0aGUgbWF0Y2hpbmcgbW9kdWxlXHJcbiAgZm9yIG1vZHVsZUNvbmZpZyBpbiBtb2R1bGVzXHJcbiAgICBpZiBtb2R1bGVDb25maWcudmVyc2lvbk9mPyBhbmQgb3B0aW9ucy5pbnB1dEZpbGUuaW5kZXhPZihfX2RldGVybWluZVBhdGgobW9kdWxlQ29uZmlnLmJhc2VVcmwsIGpzU291cmNlRGlyKSkgPiAtMVxyXG4gICAgICBfX3VwZGF0ZU1vZHVsZVZlcnNpb25DaGFpbiBtb2R1bGVDb25maWdcclxuICAgIFxyXG4gIG5leHQoKVxyXG5cclxuX191cGRhdGVNb2R1bGVWZXJzaW9uQ2hhaW4gPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMgPSBfX2dldEluY2x1ZGVGaWxlcyBtb2R1bGVDb25maWdcclxuICBfX2FkZE90aGVyTW9kdWxlSW5jbHVkZXMgbW9kdWxlQ29uZmlnXHJcbiAgZG9udEJ1aWxkID0gbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZG9udEJ1aWxkXHJcbiAgdW5sZXNzIGRvbnRCdWlsZC5pbmRleE9mKG1vZHVsZUNvbmZpZy5uYW1lKSA+IC0xIG9yIGRvbnRCdWlsZC5pbmRleE9mKG1vZHVsZUNvbmZpZy5iYXNlVXJsKSA+IC0xXHJcbiAgICBfX3VwZGF0ZURhdGFNYWluIG1vZHVsZUNvbmZpZ1xyXG4gIGZvciBtIGluIG1vZHVsZXMgd2hlbiBtLnZlcnNpb25PZj8gYW5kIChtLnZlcnNpb25PZiBpcyBtb2R1bGVDb25maWcubmFtZSBvciBtLnZlcnNpb25PZiBpcyBtb2R1bGVDb25maWcuYmFzZVVybClcclxuICAgIF9fdXBkYXRlTW9kdWxlVmVyc2lvbkNoYWluKG0pXHJcblxyXG5fYnVpbGRBdXRvTW9kdWxlcyA9IChtaW1vc2FDb25maWcsIG9wdGlvbnMsIG5leHQpIC0+XHJcbiAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemU/XHJcbiAgICByZXR1cm4gbmV4dCgpIHVubGVzcyBvcHRpb25zLnJ1bkNvbmZpZ3M/Lmxlbmd0aCA+IDBcclxuICBtb2R1bGVzID0gX19nZXRNb2R1bGVDb25maWdzIG1pbW9zYUNvbmZpZ1xyXG4gIGZvciBtb2R1bGVDb25maWcgaW4gbW9kdWxlc1xyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcyA9IF9fZ2V0SW5jbHVkZUZpbGVzIG1vZHVsZUNvbmZpZ1xyXG4gIFxyXG4gICMgQWZ0ZXIgYnVpbGRpbmcgaW5jbHVkZUZpbGVzIGZvciBhbGwgbW9kdWxlcywgd2UgY2FuIGFkZFxyXG4gICMgZGVwZW5kZW5jaWVzIG9mIGluY2x1ZGVkIG1vZHVsZXMgdG8gdGhlIG1vZHVsZUNvbmZpZ1xyXG4gIGZvciBtb2R1bGVDb25maWcgaW4gbW9kdWxlc1xyXG4gICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzIG1vZHVsZUNvbmZpZ1xyXG4gICAgZG9udEJ1aWxkID0gbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZG9udEJ1aWxkXHJcbiAgICB1bmxlc3MgZG9udEJ1aWxkLmluZGV4T2YobW9kdWxlQ29uZmlnLm5hbWUpID4gLTEgb3IgZG9udEJ1aWxkLmluZGV4T2YobW9kdWxlQ29uZmlnLmJhc2VVcmwpID4gLTFcclxuICAgICAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemU/XHJcbiAgICAgICAgX19hcHBseVRvQ29uZmlnKHJ1bkNvbmZpZywgbW9kdWxlQ29uZmlnKSBmb3IgcnVuQ29uZmlnIGluIG9wdGlvbnMucnVuQ29uZmlnc1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgX191cGRhdGVEYXRhTWFpbiBtb2R1bGVDb25maWdcclxuXHJcbiAgbmV4dCgpXHJcblxyXG5fX2dldE1vZHVsZUNvbmZpZ3MgPSAobWltb3NhQ29uZmlnLCBkaXJMaXN0KSAtPlxyXG4gIG1vZHVsZU5hbWVzID0gZGlyTGlzdFxyXG4gIHVubGVzcyBkaXJMaXN0P1xyXG4gICAgbW9kdWxlTmFtZXMgPSBfX2dldERpcnMoXCIje21pbW9zYUNvbmZpZy53YXRjaC5zb3VyY2VEaXJ9I3twYXRoU2VwYXJhdG9yfSN7bWltb3NhQ29uZmlnLndhdGNoLmphdmFzY3JpcHREaXJ9XCIpXHJcbiAgZGV0ZWN0ZWRNb2R1bGVDb3VudCA9IG1vZHVsZU5hbWVzLmxlbmd0aFxyXG4gIG1vZHVsZUNvbmZpZ3MgPSBtb2R1bGVOYW1lcy5tYXAgKGRpck5hbWUpIC0+XHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwiI3tkaXJOYW1lfS8je2Rpck5hbWV9LWJ1aWx0XCJcclxuICAgICAgYmFzZVVybDogZGlyTmFtZVxyXG4gICAgICBpbmNsdWRlOiBbXVxyXG4gICAgICBwYXR0ZXJuczogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUucGF0dGVybnNcclxuICAgICAgZXhjbHVkZTogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZXhjbHVkZVxyXG4gICAgICBleGNsdWRlUmVnZXg6IG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLmV4Y2x1ZGVSZWdleFxyXG4gICAgICBwbHVnaW5zOiBtaW1vc2FDb25maWcucmVxdWlyZUJ1aWxkQXV0b01vZHVsZS5wbHVnaW5zXHJcbiAgICAgIGRhdGFNYWluOiBcIm1haW4uanNcIlxyXG4gICAgfVxyXG4gIGZvciB1c2VyQ29uZmlnIGluIG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLm1vZHVsZXNcclxuICAgIF9fYXBwbHlVc2VyQ29uZmlncyh1c2VyQ29uZmlnLCBtb2R1bGVDb25maWdzKVxyXG4gIHJldHVybiBtb2R1bGVDb25maWdzXHJcblxyXG5fX2dldERpcnMgPSAocm9vdERpcikgLT5cclxuICBmcy5yZWFkZGlyU3luYyhyb290RGlyKS5maWx0ZXIgKGZpbGUpIC0+XHJcbiAgICBmaWxlWzBdIGlzbnQgJy4nIGFuZCBmcy5zdGF0U3luYyhcIiN7cm9vdERpcn0je3BhdGhTZXBhcmF0b3J9I3tmaWxlfVwiKS5pc0RpcmVjdG9yeSgpXHJcblxyXG5fX2FwcGx5VXNlckNvbmZpZ3MgPSAodXNlckNvbmZpZywgbW9kdWxlcykgLT5cclxuICBtYXRjaGVkTW9kdWxlcyA9IG1vZHVsZXMuZmlsdGVyIChtKSAtPlxyXG4gICAgbS5uYW1lIGlzIHVzZXJDb25maWcubmFtZSBvciBtLmJhc2VVcmwgaXMgdXNlckNvbmZpZy5iYXNlVXJsXHJcbiAgaWYgbWF0Y2hlZE1vZHVsZXMubGVuZ3RoID4gMVxyXG4gICAgIyBzaG91bGQgbG9nIHRoaXMgdXNpbmcgbWltb3NhIGxvZ2dlclxyXG4gICAgY29uc29sZS5sb2cgXCJTaG91bGQgaGF2ZSBmb3VuZCBhdCBtb3N0IG9uZSBtYXRjaFwiXHJcbiAgICByZXR1cm5cclxuICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggaXMgMVxyXG4gICAgbWF0Y2ggPSBtYXRjaGVkTW9kdWxlc1swXVxyXG4gICAgbWF0Y2gubmFtZSA9IHVzZXJDb25maWcubmFtZVxyXG4gICAgaWYgdXNlckNvbmZpZy5iYXNlVXJsPyBhbmQgdXNlckNvbmZpZy5iYXNlVXJsIGlzbnQgXCJcIlxyXG4gICAgICBtYXRjaC5iYXNlVXJsID0gdXNlckNvbmZpZy5iYXNlVXJsXHJcbiAgICBpZiB1c2VyQ29uZmlnLmluY2x1ZGU/Lmxlbmd0aCA+IDBcclxuICAgICAgbWF0Y2guaW5jbHVkZSA9IHVzZXJDb25maWcuaW5jbHVkZVxyXG4gICAgbWF0Y2gucGF0dGVybnMgPSB1c2VyQ29uZmlnLnBhdHRlcm5zXHJcbiAgICBtYXRjaC5leGNsdWRlID0gdXNlckNvbmZpZy5leGNsdWRlXHJcbiAgICBtYXRjaC5leGNsdWRlUmVnZXggPSB1c2VyQ29uZmlnLmV4Y2x1ZGVSZWdleFxyXG4gICAgbWF0Y2gucGx1Z2lucyA9IHVzZXJDb25maWcucGx1Z2luc1xyXG4gICAgaWYgdXNlckNvbmZpZy52ZXJzaW9uT2Y/IGFuZCB1c2VyQ29uZmlnLnZlcnNpb25PZiBpc250IFwiXCJcclxuICAgICAgbWF0Y2gudmVyc2lvbk9mID0gdXNlckNvbmZpZy52ZXJzaW9uT2ZcclxuICAgIG1hdGNoLmRhdGFNYWluID0gdXNlckNvbmZpZy5kYXRhTWFpblxyXG4gICAgbWF0Y2guaW5jbHVkZUFsaWFzZWRGaWxlcyA9IHVzZXJDb25maWcuaW5jbHVkZUFsaWFzZWRGaWxlc1xyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpcyAwXHJcbiAgICBtb2R1bGVzLnB1c2ggdXNlckNvbmZpZ1xyXG5cclxuX19nZXRJbmNsdWRlRmlsZXMgPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gICMgU2V0dXAgaW5jbHVkZUZpbGVzIGFycmF5LCBhbmQgc2V0dXAgcGF0aCBhbGlhcyBmb3IgbGF0ZXIgdXNlXHJcbiAgICBpbmNsdWRlRmlsZXMgPSBbXVxyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGb2xkZXIgPSBfX2RldGVybWluZVBhdGggbW9kdWxlQ29uZmlnLmJhc2VVcmwsIGNvbXBpbGVkSmF2YXNjcmlwdERpclxyXG4gICAgYmFzZSA9IF9fbm9ybWFsaXplKHBhdGguam9pbihtb2R1bGVDb25maWcuaW5jbHVkZUZvbGRlciwgcGF0aFNlcGFyYXRvcikpXHJcbiAgICBmaWxlcyA9IF9fZ2V0TW9kdWxlRmlsZXMobW9kdWxlQ29uZmlnKVxyXG5cclxuICAgICMgRmlsdGVyIG91dCBhbnkgZmlsZXMgdGhhdCBzaG91bGQgYmUgbG9hZGVkIHdpdGggYSBwbHVnaW4sIGFuZCBhZGRcclxuICAgICMgdGhlbSB0byB0aGUgaW5jbHVkZUZpbGVzIGFycmF5LCBwcmVmaXhlZCB3aXRoIHRoZSBwbHVnaW4gcGF0aFxyXG4gICAgZmlsZXMgPSBfX2ZpbHRlclBsdWdpbkZpbGVzKG1vZHVsZUNvbmZpZywgZmlsZXMsIGluY2x1ZGVGaWxlcywgYmFzZSkgaWYgbW9kdWxlQ29uZmlnLnBsdWdpbnM/Lmxlbmd0aCA+IDBcclxuICAgIFxyXG4gICAgIyBGaWx0ZXIgcmVtYWluaW5nIGZpbGVzIGFnYWluc3QgaW5jbHVkZSBwYXR0ZXJuc1xyXG4gICAgZmlsdGVyZWRJbmNsdWRlcyA9IF9fZmlsdGVySW5jbHVkZUZpbGVzKGZpbGVzLCBtb2R1bGVDb25maWcucGF0dGVybnMsIGJhc2UpXHJcbiAgICBpbmNsdWRlRmlsZXMgPSBpbmNsdWRlRmlsZXMuY29uY2F0IGZpbHRlcmVkSW5jbHVkZXNcclxuXHJcbiAgICBpZiBtb2R1bGVDb25maWcudmVyc2lvbk9mPyBhbmQgbm90IG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICAgIF9fc2V0UGF0aEFsaWFzIG1vZHVsZUNvbmZpZ1xyXG5cclxuICAgIHJldHVybiBpbmNsdWRlRmlsZXNcclxuXHJcbl9fZGV0ZXJtaW5lUGF0aCA9ICh0aGVQYXRoLCByZWxhdGl2ZVRvKSAtPlxyXG4gIHJldHVybiB0aGVQYXRoIGlmIHdpbmRvd3NEcml2ZS50ZXN0IHRoZVBhdGhcclxuICByZXR1cm4gdGhlUGF0aCBpZiB0aGVQYXRoLmluZGV4T2YoXCIvXCIpIGlzIDBcclxuICBwYXRoLmpvaW4gcmVsYXRpdmVUbywgdGhlUGF0aFxyXG5cclxuX19nZXRNb2R1bGVGaWxlcyA9IChtb2R1bGVDb25maWcpIC0+XHJcbiAgZmlsZXMgPSB3cmVuY2gucmVhZGRpclN5bmNSZWN1cnNpdmUgbW9kdWxlQ29uZmlnLmluY2x1ZGVGb2xkZXJcclxuICBmaWxlcyA9IGZpbGVzLm1hcCAoZmlsZSkgLT5cclxuICAgIHBhdGguam9pbiBtb2R1bGVDb25maWcuaW5jbHVkZUZvbGRlciwgZmlsZVxyXG4gIC5maWx0ZXIgKGZpbGUpIC0+XHJcbiAgICBmcy5zdGF0U3luYyhmaWxlKS5pc0ZpbGUoKSBhbmRcclxuICAgIG1vZHVsZUNvbmZpZy5leGNsdWRlLmluZGV4T2YoZmlsZSkgaXMgLTEgYW5kXHJcbiAgICBub3QgKG1vZHVsZUNvbmZpZy5leGNsdWRlUmVnZXggYW5kIGZpbGUubWF0Y2gobW9kdWxlQ29uZmlnLmV4Y2x1ZGVSZWdleCkpXHJcbiAgLm1hcCBfX25vcm1hbGl6ZVxyXG4gIHJldHVybiBmaWxlc1xyXG5cclxuX19maWx0ZXJQbHVnaW5GaWxlcyA9IChtb2R1bGVDb25maWcsIGZpbGVzLCBpbmNsdWRlRmlsZXMsIGJhc2UpIC0+XHJcbiAgZm9yIHBsdWdpbkNvbmZpZyBpbiBtb2R1bGVDb25maWcucGx1Z2luc1xyXG4gICAgcGx1Z2luQ29uZmlnLnBhdHRlcm5zLmZvckVhY2ggKHBhdHRlcm4pIC0+XHJcbiAgICAgIGFic1BhdHRlcm4gPSBfX25vcm1hbGl6ZShwYXRoLnJlc29sdmUoYmFzZSwgcGF0dGVybikpXHJcbiAgICAgICMgVGhlIGZpbHRlcmVkIHJlc3VsdCB3aWxsIGFjdHVhbGx5IGJlIHRoZSBmaWxlcyB0aGF0XHJcbiAgICAgICMgZG9uJ3QgbWF0Y2ggdGhlIHBsdWdpbiBwYXR0ZXJuc1xyXG4gICAgICBmaWxlcyA9IGZpbGVzLmZpbHRlciAoZmlsZSkgLT5cclxuICAgICAgICBpZiBtaW5pbWF0Y2ggZmlsZSwgYWJzUGF0dGVyblxyXG4gICAgICAgICAgaW5jbHVkZUZpbGVzLnB1c2ggXCIje3BsdWdpbkNvbmZpZy5wYXRofSEje2ZpbGV9XCJcclxuICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgcmV0dXJuIGZpbGVzXHJcblxyXG5fX2ZpbHRlckluY2x1ZGVGaWxlcyA9IChmaWxlcywgcGF0dGVybnMsIGJhc2UpIC0+XHJcbiAgcmVzdWx0ID0gW11cclxuICBwYXR0ZXJucy5mb3JFYWNoIChwYXR0ZXJuKSAtPlxyXG4gICAgYWJzUGF0dGVybiA9IF9fbm9ybWFsaXplKHBhdGgucmVzb2x2ZShiYXNlLCBwYXR0ZXJuKSlcclxuICAgIHJlc3VsdC5wdXNoKGZpbGUpIGZvciBmaWxlIGluIGZpbGVzIHdoZW4gbWluaW1hdGNoKGZpbGUsIGFic1BhdHRlcm4pXHJcbiAgcmV0dXJuIHJlc3VsdFxyXG5cclxuX19zZXRQYXRoQWxpYXMgPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIG1hdGNoZWRNb2R1bGVzID0gbW9kdWxlcy5maWx0ZXIgKG0pIC0+XHJcbiAgICBtb2R1bGVDb25maWcudmVyc2lvbk9mIGlzIG0ubmFtZSBvciBtb2R1bGVDb25maWcudmVyc2lvbk9mIGlzIG0uYmFzZVVybFxyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpc250IDFcclxuICAgIGNvbnNvbGUubG9nIFwiVmVyc2lvbiBvZiBkaWRuJ3QgbWF0Y2ggb3IgbWF0Y2hlZCBtb3JlIHRoYW4gb25lIG1vZHVsZVwiXHJcbiAgICByZXR1cm5cclxuICBtYXRjaCA9IG1hdGNoZWRNb2R1bGVzWzBdXHJcbiAgaWYgbWF0Y2gudmVyc2lvbk9mP1xyXG4gICAgdW5sZXNzIG1hdGNoLnBhdGhBbGlhcz9cclxuICAgICAgX19zZXRQYXRoQWxpYXMgbWF0Y2hcclxuICAgIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXMgPSBtYXRjaC5wYXRoQWxpYXNcclxuICBlbHNlXHJcbiAgICBtb2R1bGVDb25maWcucGF0aEFsaWFzID0gbWF0Y2guYmFzZVVybFxyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlLnB1c2ggbWF0Y2gubmFtZVxyXG5cclxuX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzID0gKG1vZHVsZUNvbmZpZykgLT5cclxuICByZXR1cm4gdW5sZXNzIG1vZHVsZUNvbmZpZy5pbmNsdWRlPy5sZW5ndGggPiAwXHJcbiAgZm9yIGluY2x1ZGUgaW4gbW9kdWxlQ29uZmlnLmluY2x1ZGUgd2hlbiBpbmNsdWRlIGlzbnQgbW9kdWxlQ29uZmlnLm5hbWUgYW5kIGluY2x1ZGUgaXNudCBtb2R1bGVDb25maWcuYmFzZVVybFxyXG4gICAgZm9yIG0gaW4gbW9kdWxlc1xyXG4gICAgICBpZiBpbmNsdWRlIGlzIG0ubmFtZSBvciBpbmNsdWRlIGlzIG0uYmFzZVVybFxyXG4gICAgICAgIGlmIG0uaW5jbHVkZT8ubGVuZ3RoID4gMFxyXG4gICAgICAgICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzKG0pXHJcbiAgICAgICAgaWYgbS5pbmNsdWRlRmlsZXM/XHJcbiAgICAgICAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzID0gbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5jb25jYXQgbS5pbmNsdWRlRmlsZXNcclxuICAjIFByZXZlbnQgYWRkaW5nIGR1cGxpY2F0ZXNcclxuICBtb2R1bGVDb25maWcuaW5jbHVkZSA9IG51bGxcclxuXHJcbl9fdXBkYXRlRGF0YU1haW4gPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIHJldHVybiB1bmxlc3MgbW9kdWxlQ29uZmlnLnBhdGhBbGlhcz8gYW5kIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXMgaXNudCBtb2R1bGVDb25maWcuYmFzZVVybFxyXG4gIGRhdGFNYWluID0gX19kZXRlcm1pbmVQYXRoIG1vZHVsZUNvbmZpZy5kYXRhTWFpbiwgbW9kdWxlQ29uZmlnLmluY2x1ZGVGb2xkZXJcclxuICBpZiBmcy5leGlzdHNTeW5jKGRhdGFNYWluKSBhbmQgZnMuc3RhdFN5bmMoZGF0YU1haW4pLmlzRmlsZSgpXHJcbiAgICBkYXRhID0gZnMucmVhZEZpbGVTeW5jIGRhdGFNYWluLCB7ZW5jb2Rpbmc6ICd1dGY4J31cclxuICAgIGRhdGEgPSBfX3JlbW92ZUluamVjdGVkQ29uZmlnIGRhdGFcclxuICAgIGluamVjdGVkQ29uZmlnID0gXCJyZXF1aXJlLmNvbmZpZyh7cGF0aHM6I3tKU09OLnN0cmluZ2lmeShfX2dldFBhdGhPdmVycmlkZXMobW9kdWxlQ29uZmlnKSl9fSlcIlxyXG4gICAgZnMud3JpdGVGaWxlU3luYyBkYXRhTWFpbiwgXCIje2luamVjdGVkQ29uZmlnU3RhcnR9I3tpbmplY3RlZENvbmZpZ30je2luamVjdGVkQ29uZmlnRW5kfSN7ZGF0YX1cIlxyXG4gICAgcmV0dXJuXHJcbiAgZWxzZVxyXG4gICAgcm9vdERhdGFNYWluID0gbnVsbFxyXG4gICAgZm9yIG0gaW4gbW9kdWxlcyB3aGVuIG0uYmFzZVVybCBpcyBtb2R1bGVDb25maWcucGF0aEFsaWFzXHJcbiAgICAgIHJvb3REYXRhTWFpbiA9IF9fZGV0ZXJtaW5lUGF0aCBtLmRhdGFNYWluLCBtLmluY2x1ZGVGb2xkZXJcclxuICAgIGlmIGZzLmV4aXN0c1N5bmMocm9vdERhdGFNYWluKSBhbmQgZnMuc3RhdFN5bmMocm9vdERhdGFNYWluKS5pc0ZpbGUoKVxyXG4gICAgICBkYXRhID0gZnMucmVhZEZpbGVTeW5jIHJvb3REYXRhTWFpbiwge2VuY29kaW5nOid1dGY4J31cclxuICAgICAgZGF0YSA9IF9fcmVtb3ZlSW5qZWN0ZWRDb25maWcgZGF0YVxyXG4gICAgICBpbmplY3RlZENvbmZpZyA9IFwicmVxdWlyZS5jb25maWcoe3BhdGhzOiN7SlNPTi5zdHJpbmdpZnkoX19nZXRQYXRoT3ZlcnJpZGVzKG1vZHVsZUNvbmZpZykpfX0pXCJcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyBkYXRhTWFpbiwgXCIje2luamVjdGVkQ29uZmlnU3RhcnR9I3tpbmplY3RlZENvbmZpZ30je2luamVjdGVkQ29uZmlnRW5kfSN7ZGF0YX1cIlxyXG4gICAgZWxzZVxyXG4gICAgICBjb25zb2xlLmxvZyBcIkNvdWxkbid0IGZpbmQgYSBtYWluLmpzIGZpbGUgdG8gYXVnbWVudCBmb3IgbW9kdWxlIG5hbWVkOiAje21vZHVsZUNvbmZpZy5uYW1lfVwiXHJcblxyXG5fX3JlbW92ZUluamVjdGVkQ29uZmlnID0gKGRhdGEpIC0+XHJcbiAgaiA9IGRhdGEuaW5kZXhPZihpbmplY3RlZENvbmZpZ1N0YXJ0KVxyXG4gIGsgPSBkYXRhLmluZGV4T2YoaW5qZWN0ZWRDb25maWdFbmQpXHJcbiAgdW5sZXNzIGogaXMgLTEgb3IgayBpcyAtMVxyXG4gICAgZGF0YSA9IGRhdGEuc3Vic3RyaW5nKDAsaikgKyBkYXRhLnN1YnN0cmluZyhrK2luamVjdGVkQ29uZmlnRW5kLmxlbmd0aClcclxuICByZXR1cm4gZGF0YVxyXG5cclxuX19nZXRQYXRoT3ZlcnJpZGVzID0gKG1vZHVsZUNvbmZpZykgLT5cclxuICBwYXRoT3ZlcnJpZGVzID0ge31cclxuICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmZvckVhY2ggKGZpbGUpIC0+XHJcbiAgICBwbHVnaW5JbmRleCA9IGZpbGUuaW5kZXhPZihcIiFcIilcclxuICAgIGlmIHBsdWdpbkluZGV4ID4gLTFcclxuICAgICAgYW1kRmlsZSA9IF9fZ2V0RmlsZUFNRChmaWxlLnN1YnN0cmluZyhwbHVnaW5JbmRleCsxKSkucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG4gICAgZWxzZVxyXG4gICAgICBhbWRGaWxlID0gX19nZXRGaWxlQU1EKGZpbGUpLnJlcGxhY2UocGF0aC5leHRuYW1lKGZpbGUpLCAnJylcclxuICAgIGFsaWFzID0gYW1kRmlsZS5yZXBsYWNlIG1vZHVsZUNvbmZpZy5iYXNlVXJsLCBtb2R1bGVDb25maWcucGF0aEFsaWFzXHJcbiAgICB1bmxlc3MgcGF0aE92ZXJyaWRlc1thbGlhc10/XHJcbiAgICAgIHBhdGhPdmVycmlkZXNbYWxpYXNdID0gYW1kRmlsZVxyXG4gIHJldHVybiBwYXRoT3ZlcnJpZGVzXHJcblxyXG5fX2FwcGx5VG9Db25maWcgPSAocnVuQ29uZmlnLCBtb2R1bGVDb25maWcpIC0+XHJcbiAgaWYgcnVuQ29uZmlnLm1vZHVsZXM/Lmxlbmd0aCA+IDBcclxuICAgIG1hdGNoZWRNb2R1bGVzID0gcnVuQ29uZmlnLm1vZHVsZXMuZmlsdGVyIChtKSAtPiBtLm5hbWUgaXMgbW9kdWxlQ29uZmlnLm5hbWVcclxuICAgIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCA+IDBcclxuICAgICAgZm9yIG1vZHVsZUVudHJ5IGluIG1hdGNoZWRNb2R1bGVzXHJcbiAgICAgICAgX19hcHBlbmRUb01vZHVsZSBtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnXHJcbiAgICAgIHJldHVyblxyXG4gIHJ1bkNvbmZpZy5tb2R1bGVzID0gW10gdW5sZXNzIEFycmF5LmlzQXJyYXkocnVuQ29uZmlnLm1vZHVsZXMpXHJcbiAgbW9kdWxlRW50cnkgPSB7bmFtZTogbW9kdWxlQ29uZmlnLm5hbWUsIGNyZWF0ZTogdHJ1ZSwgaW5jbHVkZTogW119XHJcbiAgX19hcHBlbmRUb01vZHVsZSBtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnXHJcbiAgcnVuQ29uZmlnLm1vZHVsZXMucHVzaCBtb2R1bGVFbnRyeVxyXG5cclxuX19hcHBlbmRUb01vZHVsZSA9IChtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnKSAtPlxyXG4gIG1vZHVsZUVudHJ5LmluY2x1ZGUgPSBbXSB1bmxlc3MgQXJyYXkuaXNBcnJheShtb2R1bGVFbnRyeS5pbmNsdWRlKVxyXG4gIGlmIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICBtb2R1bGVFbnRyeS5vdmVycmlkZSA9IHt9IHVubGVzcyBtb2R1bGVFbnRyeS5vdmVycmlkZT9cclxuICAgIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzID0ge30gdW5sZXNzIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzP1xyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5mb3JFYWNoIChmaWxlKSAtPlxyXG4gICAgICBwbHVnaW5JbmRleCA9IGZpbGUuaW5kZXhPZihcIiFcIilcclxuICAgICAgaWYgcGx1Z2luSW5kZXggPiAtMVxyXG4gICAgICAgIGFtZEZpbGUgPSBfX2dldFBsdWdpbkZpbGVBTUQgZmlsZSwgcGx1Z2luSW5kZXhcclxuICAgICAgICBwbHVnaW5JbmRleCA9IGFtZEZpbGUuaW5kZXhPZihcIiFcIilcclxuICAgICAgICAjIE9ubHkgYWxpYXMgdGhlIGZpbGUsIG5vdCB0aGUgcGx1Z2luXHJcbiAgICAgICAgZmlsZVBhcnQgPSBhbWRGaWxlLnN1YnN0cmluZyhwbHVnaW5JbmRleCsxKVxyXG4gICAgICAgIGFsaWFzZWRGaWxlID0gZmlsZVBhcnQucmVwbGFjZSBtb2R1bGVDb25maWcuYmFzZVVybCwgbW9kdWxlQ29uZmlnLnBhdGhBbGlhc1xyXG4gICAgICAgIGFsaWFzID0gXCIje2FtZEZpbGUuc3Vic3RyaW5nKDAscGx1Z2luSW5kZXgpfSEje2FsaWFzZWRGaWxlfVwiXHJcbiAgICAgICAgbW9kdWxlRW50cnkuaW5jbHVkZS5wdXNoKGFsaWFzKSBpZiBtb2R1bGVDb25maWcuaW5jbHVkZUFsaWFzZWRGaWxlc1xyXG4gICAgICAgIGFsaWFzZWRGaWxlID0gYWxpYXNlZEZpbGUucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG4gICAgICAgIHVubGVzcyBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRoc1thbGlhc2VkRmlsZV0/XHJcbiAgICAgICAgICBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRoc1thbGlhc2VkRmlsZV0gPSBmaWxlUGFydC5yZXBsYWNlKHBhdGguZXh0bmFtZShmaWxlKSwgJycpXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBhbWRGaWxlID0gX19nZXRGaWxlQU1EKGZpbGUpLnJlcGxhY2UocGF0aC5leHRuYW1lKGZpbGUpLCAnJylcclxuICAgICAgICBhbGlhcyA9IGFtZEZpbGUucmVwbGFjZSBtb2R1bGVDb25maWcuYmFzZVVybCwgbW9kdWxlQ29uZmlnLnBhdGhBbGlhc1xyXG4gICAgICAgIG1vZHVsZUVudHJ5LmluY2x1ZGUucHVzaChhbGlhcykgaWYgbW9kdWxlQ29uZmlnLmluY2x1ZGVBbGlhc2VkRmlsZXNcclxuICAgICAgICB1bmxlc3MgbW9kdWxlRW50cnkub3ZlcnJpZGUucGF0aHNbYWxpYXNdP1xyXG4gICAgICAgICAgbW9kdWxlRW50cnkub3ZlcnJpZGUucGF0aHNbYWxpYXNdID0gYW1kRmlsZVxyXG4gIGVsc2VcclxuICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMuZm9yRWFjaCAoZmlsZSkgLT5cclxuICAgICAgcGx1Z2luSW5kZXggPSBmaWxlLmluZGV4T2YoXCIhXCIpXHJcbiAgICAgIGlmIHBsdWdpbkluZGV4ID4gLTFcclxuICAgICAgICBtb2R1bGVFbnRyeS5pbmNsdWRlLnB1c2ggX19nZXRQbHVnaW5GaWxlQU1EKGZpbGUsIHBsdWdpbkluZGV4KVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgbW9kdWxlRW50cnkuaW5jbHVkZS5wdXNoIF9fZ2V0RmlsZUFNRChmaWxlKS5yZXBsYWNlKHBhdGguZXh0bmFtZShmaWxlKSwgJycpXHJcblxyXG5fX2dldFBsdWdpbkZpbGVBTUQgPSAoZmlsZSwgcGx1Z2luSW5kZXgpIC0+XHJcbiAgcGx1Z2luUGF0aCA9IF9fZGV0ZXJtaW5lUGF0aChmaWxlLnN1YnN0cmluZygwLCBwbHVnaW5JbmRleCkgKyBcIi5qc1wiLCBjb21waWxlZEphdmFzY3JpcHREaXIpXHJcbiAgIyBVc2UgYWxpYXMgaWYgdGhlIHBsdWdpbiBoYXMgYmVlbiBhbGlhc2VkXHJcbiAgcGx1Z2luQWxpYXMgPSByZXF1aXJlTW9kdWxlLm1hbmlwdWxhdGVQYXRoV2l0aEFsaWFzIHBsdWdpblBhdGhcclxuICAjIElmIG5vdCBhbGlhc2VkLCBnZXQgdXJsL2FtZCBwYXRoXHJcbiAgaWYgcGx1Z2luQWxpYXMgaXMgcGx1Z2luUGF0aFxyXG4gICAgcGx1Z2luQWxpYXMgPSBwYXRoLnJlbGF0aXZlKGNvbXBpbGVkSmF2YXNjcmlwdERpciwgcGx1Z2luQWxpYXMpLnNwbGl0KHBhdGguc2VwKS5qb2luKFwiL1wiKS5yZXBsYWNlKFwiLmpzXCIsICcnKVxyXG4gIGZpbGVBTUQgPSBfX2dldEZpbGVBTUQoZmlsZS5zdWJzdHJpbmcocGx1Z2luSW5kZXgrMSkpXHJcbiAgcmV0dXJuIFwiI3twbHVnaW5BbGlhc30hI3tmaWxlQU1EfVwiXHJcblxyXG5fX2dldEZpbGVBTUQgPSAoZmlsZSkgLT5cclxuICAjIFVzZSBhbGlhcyBpZiBwYXRoIGhhcyBiZWVuIGFsaWFzZWRcclxuICBmaWxlQU1EID0gcmVxdWlyZU1vZHVsZS5tYW5pcHVsYXRlUGF0aFdpdGhBbGlhcyBmaWxlXHJcbiAgIyBHZXQgcmVsYXRpdmUgdXJsL2FtZCBwYXRoIGlmIG5vdCBhbGlhc2VkXHJcbiAgZmlsZUFNRCA9IHBhdGgucmVsYXRpdmUoY29tcGlsZWRKYXZhc2NyaXB0RGlyLCBmaWxlKSBpZiBmaWxlQU1EIGlzIGZpbGVcclxuICByZXR1cm4gZmlsZUFNRC5zcGxpdChwYXRoLnNlcCkuam9pbihcIi9cIilcclxuXHJcbl9fbm9ybWFsaXplID0gKGZpbGVwYXRoKSAtPiBcclxuICByZXR1cm4gZmlsZXBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpIGlmIHdpbjMyXHJcbiAgcmV0dXJuIGZpbGVwYXRoXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbiAgcmVnaXN0cmF0aW9uOiByZWdpc3RyYXRpb25cclxuICBkZWZhdWx0czogICAgIGNvbmZpZy5kZWZhdWx0c1xyXG4gIHBsYWNlaG9sZGVyOiAgY29uZmlnLnBsYWNlaG9sZGVyXHJcbiAgdmFsaWRhdGU6ICAgICBjb25maWcudmFsaWRhdGUiXX0=
