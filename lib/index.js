"use strict";
var compiledJavascriptDir, config, fs, minimatch, path, pathSeparator, registration, requireModule, win32, windowsDrive, wrench, __addOtherModuleIncludes, __appendToModule, __applyToConfig, __applyUserConfigs, __determinePath, __filterIncludeFiles, __filterPluginFiles, __getDirs, __getFileAMD, __getModuleFiles, __getPluginFileAMD, __normalize, __setPathAlias, _buildAutoModules,
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

registration = function(mimosaConfig, register) {
  var e;
  compiledJavascriptDir = mimosaConfig.watch.compiledJavascriptDir;
  if (mimosaConfig.isOptimize) {
    requireModule = mimosaConfig.installedModules["mimosa-require"];
    e = mimosaConfig.extensions;
    register(['add', 'update', 'remove'], 'beforeOptimize', _buildAutoModules, __slice.call(e.javascript).concat(__slice.call(e.template)));
    return register(['postBuild'], 'beforeOptimize', _buildAutoModules);
  }
};

_buildAutoModules = function(mimosaConfig, options, next) {
  var base, files, hasRunConfigs, jsSourceDir, moduleConfig, moduleNames, modules, resultOfCall, runConfig, userConfig, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
  hasRunConfigs = ((_ref = options.runConfigs) != null ? _ref.length : void 0) > 0;
  if (!hasRunConfigs) {
    return next();
  }
  jsSourceDir = "" + mimosaConfig.watch.sourceDir + pathSeparator + mimosaConfig.watch.javascriptDir;
  moduleNames = __getDirs(jsSourceDir);
  modules = moduleNames.map(function(dirName) {
    return {
      name: "" + dirName + "/" + dirName + "-built",
      baseUrl: dirName,
      include: [],
      patterns: mimosaConfig.requireBuildAutoModule.patterns,
      exclude: mimosaConfig.requireBuildAutoModule.exclude,
      excludeRegex: mimosaConfig.requireBuildAutoModule.excludeRegex,
      plugins: mimosaConfig.requireBuildAutoModule.plugins
    };
  });
  _ref1 = mimosaConfig.requireBuildAutoModule.modules;
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    userConfig = _ref1[_i];
    __applyUserConfigs(userConfig, modules);
  }
  for (_j = 0, _len1 = modules.length; _j < _len1; _j++) {
    moduleConfig = modules[_j];
    moduleConfig.includeFiles = [];
    moduleConfig.includeFolder = __determinePath(moduleConfig.baseUrl, compiledJavascriptDir);
    base = __normalize(path.join(moduleConfig.includeFolder, pathSeparator));
    files = __getModuleFiles(moduleConfig);
    if (((_ref2 = moduleConfig.plugins) != null ? _ref2.length : void 0) > 0) {
      files = __filterPluginFiles(moduleConfig, files, base);
    }
    resultOfCall = __filterIncludeFiles(files, moduleConfig.patterns, base);
    moduleConfig.includeFiles = moduleConfig.includeFiles.concat(resultOfCall);
    if ((moduleConfig.versionOf != null) && (moduleConfig.pathAlias == null)) {
      __setPathAlias(moduleConfig, modules);
    }
  }
  for (_k = 0, _len2 = modules.length; _k < _len2; _k++) {
    moduleConfig = modules[_k];
    __addOtherModuleIncludes(moduleConfig, modules);
    _ref3 = options.runConfigs;
    for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
      runConfig = _ref3[_l];
      __applyToConfig(runConfig, moduleConfig);
    }
  }
  return next();
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
    match.includeAliasedFiles = userConfig.includeAliasedFiles;
  }
  if (matchedModules.length === 0) {
    return modules.push(userConfig);
  }
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

__filterPluginFiles = function(moduleConfig, files, base) {
  var pluginConfig, _i, _len, _ref;
  _ref = moduleConfig.plugins;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    pluginConfig = _ref[_i];
    pluginConfig.patterns.forEach(function(pattern) {
      var absPattern;
      absPattern = __normalize(path.resolve(base, pattern));
      return files = files.filter(function(file) {
        if (minimatch(file, absPattern)) {
          moduleConfig.includeFiles.push("" + pluginConfig.path + "!" + file);
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

__setPathAlias = function(moduleConfig, modules) {
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
      __setPathAlias(match, modules);
    }
    moduleConfig.pathAlias = match.pathAlias;
  } else {
    moduleConfig.pathAlias = match.baseUrl;
  }
  return moduleConfig.include.push(match.name);
};

__addOtherModuleIncludes = function(moduleConfig, modules) {
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
            __addOtherModuleIncludes(m, modules);
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

//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxsaWJcXGluZGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxzcmNcXGluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFdBQUE7Q0FBQSxHQUFBLG1YQUFBO0dBQUEsZUFBQTs7QUFFQSxDQUZBLEVBRU8sQ0FBUCxFQUFPLENBQUE7O0FBRVAsQ0FKQSxDQUlBLENBQUssQ0FBQSxHQUFBOztBQUVMLENBTkEsRUFNUyxHQUFULENBQVMsQ0FBQTs7QUFFVCxDQVJBLEVBUVksSUFBQSxFQUFaLEVBQVk7O0FBRVosQ0FWQSxFQVVTLEdBQVQsQ0FBUyxHQUFBOztBQUVULENBWkEsRUFZZ0IsQ0FaaEIsU0FZQTs7QUFFQSxDQWRBLEVBY2UsU0FBZixFQWRBOztBQWdCQSxDQWhCQSxFQWdCUSxFQUFSLEVBQWUsQ0FBUDs7QUFFUixDQWxCQSxFQWtCbUIsQ0FBSCxDQUFBLFFBQWhCOztBQUVBLENBcEJBLENBQUEsQ0FvQndCLGtCQUF4Qjs7QUFFQSxDQXRCQSxDQXNCOEIsQ0FBZixLQUFBLENBQUMsR0FBaEI7Q0FDRSxLQUFBO0NBQUEsQ0FBQSxDQUF3QixFQUFrQixPQUFOLFNBQXBDO0NBQ0EsQ0FBQSxFQUFHLE1BQUgsRUFBZTtDQUNiLEVBQWdCLENBQWhCLFFBQTRCLENBQTVCLEdBQThDO0NBQTlDLEVBQ0ksQ0FBSixNQURBLEVBQ2dCO0NBRGhCLENBRWdCLEVBQWhCLENBQVMsR0FBVCxFQUEwRSxHQUFBLEdBQTFFLENBQUE7Q0FDUyxDQUEyQixNQUFwQyxHQUFBLEtBQUEsQ0FBQTtJQU5XO0NBQUE7O0FBVWYsQ0FoQ0EsQ0FnQ21DLENBQWYsQ0FBQSxHQUFBLEVBQUMsR0FBRCxLQUFwQjtDQUNFLEtB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Q0FGQSxDQUdBLElBQW9CLEVBQXBCO0NBL09GLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIlxyXG5cclxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXHJcblxyXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xyXG5cclxud3JlbmNoID0gcmVxdWlyZSBcIndyZW5jaFwiXHJcblxyXG5taW5pbWF0Y2ggPSByZXF1aXJlIFwibWluaW1hdGNoXCJcclxuXHJcbmNvbmZpZyA9IHJlcXVpcmUgJy4vY29uZmlnJ1xyXG5cclxucmVxdWlyZU1vZHVsZSA9IG51bGxcclxuXHJcbndpbmRvd3NEcml2ZSA9IC9eW0EtWmEtel06XFxcXC9cclxuXHJcbndpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXHJcblxyXG5wYXRoU2VwYXJhdG9yID0gaWYgd2luMzIgdGhlbiAnXFxcXCcgZWxzZSAnLydcclxuXHJcbmNvbXBpbGVkSmF2YXNjcmlwdERpciA9IFwiXCJcclxuXHJcbnJlZ2lzdHJhdGlvbiA9IChtaW1vc2FDb25maWcsIHJlZ2lzdGVyKSAtPlxyXG4gIGNvbXBpbGVkSmF2YXNjcmlwdERpciA9IG1pbW9zYUNvbmZpZy53YXRjaC5jb21waWxlZEphdmFzY3JpcHREaXJcclxuICBpZiBtaW1vc2FDb25maWcuaXNPcHRpbWl6ZVxyXG4gICAgcmVxdWlyZU1vZHVsZSA9IG1pbW9zYUNvbmZpZy5pbnN0YWxsZWRNb2R1bGVzW1wibWltb3NhLXJlcXVpcmVcIl1cclxuICAgIGUgPSBtaW1vc2FDb25maWcuZXh0ZW5zaW9uc1xyXG4gICAgcmVnaXN0ZXIgWydhZGQnLCd1cGRhdGUnLCdyZW1vdmUnXSwgJ2JlZm9yZU9wdGltaXplJywgX2J1aWxkQXV0b01vZHVsZXMsIFtlLmphdmFzY3JpcHQuLi4sIGUudGVtcGxhdGUuLi5dXHJcbiAgICByZWdpc3RlciBbJ3Bvc3RCdWlsZCddLCAgICAgICAgICAgICAnYmVmb3JlT3B0aW1pemUnLCBfYnVpbGRBdXRvTW9kdWxlc1xyXG4gICNlbHNlXHJcbiAgIyAgIFJlZ2lzdGVyIHdhdGNoIHN0dWZmXHJcblxyXG5fYnVpbGRBdXRvTW9kdWxlcyA9IChtaW1vc2FDb25maWcsIG9wdGlvbnMsIG5leHQpIC0+XHJcbiAgaGFzUnVuQ29uZmlncyA9IG9wdGlvbnMucnVuQ29uZmlncz8ubGVuZ3RoID4gMFxyXG4gIHJldHVybiBuZXh0KCkgdW5sZXNzIGhhc1J1bkNvbmZpZ3NcclxuXHJcbiAganNTb3VyY2VEaXIgPSBcIiN7bWltb3NhQ29uZmlnLndhdGNoLnNvdXJjZURpcn0je3BhdGhTZXBhcmF0b3J9I3ttaW1vc2FDb25maWcud2F0Y2guamF2YXNjcmlwdERpcn1cIlxyXG4gIG1vZHVsZU5hbWVzID0gX19nZXREaXJzKGpzU291cmNlRGlyKVxyXG4gIG1vZHVsZXMgPSBtb2R1bGVOYW1lcy5tYXAgKGRpck5hbWUpIC0+XHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwiI3tkaXJOYW1lfS8je2Rpck5hbWV9LWJ1aWx0XCJcclxuICAgICAgYmFzZVVybDogZGlyTmFtZVxyXG4gICAgICBpbmNsdWRlOiBbXVxyXG4gICAgICBwYXR0ZXJuczogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUucGF0dGVybnNcclxuICAgICAgZXhjbHVkZTogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZXhjbHVkZVxyXG4gICAgICBleGNsdWRlUmVnZXg6IG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLmV4Y2x1ZGVSZWdleFxyXG4gICAgICBwbHVnaW5zOiBtaW1vc2FDb25maWcucmVxdWlyZUJ1aWxkQXV0b01vZHVsZS5wbHVnaW5zXHJcbiAgICB9XHJcblxyXG4gIGZvciB1c2VyQ29uZmlnIGluIG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLm1vZHVsZXNcclxuICAgIF9fYXBwbHlVc2VyQ29uZmlncyh1c2VyQ29uZmlnLCBtb2R1bGVzKVxyXG4gIFxyXG4gIGZvciBtb2R1bGVDb25maWcgaW4gbW9kdWxlc1xyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcyA9IFtdXHJcbiAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZvbGRlciA9IF9fZGV0ZXJtaW5lUGF0aCBtb2R1bGVDb25maWcuYmFzZVVybCwgY29tcGlsZWRKYXZhc2NyaXB0RGlyXHJcbiAgICBiYXNlID0gX19ub3JtYWxpemUocGF0aC5qb2luKG1vZHVsZUNvbmZpZy5pbmNsdWRlRm9sZGVyLCBwYXRoU2VwYXJhdG9yKSlcclxuXHJcbiAgICBmaWxlcyA9IF9fZ2V0TW9kdWxlRmlsZXMobW9kdWxlQ29uZmlnKVxyXG5cclxuICAgICMgRmlsdGVyIG91dCBhbnkgZmlsZXMgdGhhdCBzaG91bGQgYmUgbG9hZGVkIHdpdGggYSBwbHVnaW4sIGFuZCBhZGRcclxuICAgICMgdGhlbSB0byB0aGUgaW5jbHVkZUZpbGVzIGFycmF5LCBwcmVmaXhlZCB3aXRoIHRoZSBwbHVnaW4gcGF0aFxyXG4gICAgZmlsZXMgPSBfX2ZpbHRlclBsdWdpbkZpbGVzKG1vZHVsZUNvbmZpZywgZmlsZXMsIGJhc2UpIGlmIG1vZHVsZUNvbmZpZy5wbHVnaW5zPy5sZW5ndGggPiAwXHJcblxyXG4gICAgIyBGaWx0ZXIgcmVtYWluaW5nIGZpbGVzIGFnYWluc3QgaW5jbHVkZSBwYXR0ZXJuc1xyXG4gICAgcmVzdWx0T2ZDYWxsID0gX19maWx0ZXJJbmNsdWRlRmlsZXMoZmlsZXMsIG1vZHVsZUNvbmZpZy5wYXR0ZXJucywgYmFzZSlcclxuICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMgPSBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmNvbmNhdCByZXN1bHRPZkNhbGxcclxuXHJcbiAgICBpZiBtb2R1bGVDb25maWcudmVyc2lvbk9mPyBhbmQgbm90IG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICAgIF9fc2V0UGF0aEFsaWFzKG1vZHVsZUNvbmZpZywgbW9kdWxlcylcclxuXHJcbiAgIyBBZnRlciBidWlsZGluZyBpbmNsdWRlRmlsZXMgZm9yIGFsbCBtb2R1bGVzLCB3ZSBjYW4gYWRkXHJcbiAgIyBkZXBlbmRlbmNpZXMgb2YgaW5jbHVkZWQgbW9kdWxlcyB0byB0aGUgbW9kdWxlQ29uZmlnXHJcbiAgZm9yIG1vZHVsZUNvbmZpZyBpbiBtb2R1bGVzXHJcbiAgICBfX2FkZE90aGVyTW9kdWxlSW5jbHVkZXMgbW9kdWxlQ29uZmlnLCBtb2R1bGVzXHJcblxyXG4gICAgZm9yIHJ1bkNvbmZpZyBpbiBvcHRpb25zLnJ1bkNvbmZpZ3NcclxuICAgICAgX19hcHBseVRvQ29uZmlnIHJ1bkNvbmZpZywgbW9kdWxlQ29uZmlnXHJcblxyXG4gIG5leHQoKVxyXG5cclxuX19nZXREaXJzID0gKHJvb3REaXIpIC0+XHJcbiAgZnMucmVhZGRpclN5bmMocm9vdERpcikuZmlsdGVyIChmaWxlKSAtPlxyXG4gICAgZmlsZVswXSBpc250ICcuJyBhbmQgZnMuc3RhdFN5bmMoXCIje3Jvb3REaXJ9I3twYXRoU2VwYXJhdG9yfSN7ZmlsZX1cIikuaXNEaXJlY3RvcnkoKVxyXG5cclxuX19hcHBseVVzZXJDb25maWdzID0gKHVzZXJDb25maWcsIG1vZHVsZXMpIC0+XHJcbiAgbWF0Y2hlZE1vZHVsZXMgPSBtb2R1bGVzLmZpbHRlciAobSkgLT5cclxuICAgIG0ubmFtZSBpcyB1c2VyQ29uZmlnLm5hbWUgb3IgbS5iYXNlVXJsIGlzIHVzZXJDb25maWcuYmFzZVVybFxyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCA+IDFcclxuICAgICMgc2hvdWxkIGxvZyB0aGlzIHVzaW5nIG1pbW9zYSBsb2dnZXJcclxuICAgIGNvbnNvbGUubG9nIFwiU2hvdWxkIGhhdmUgZm91bmQgYXQgbW9zdCBvbmUgbWF0Y2hcIlxyXG4gICAgcmV0dXJuXHJcbiAgaWYgbWF0Y2hlZE1vZHVsZXMubGVuZ3RoIGlzIDFcclxuICAgIG1hdGNoID0gbWF0Y2hlZE1vZHVsZXNbMF1cclxuICAgIG1hdGNoLm5hbWUgPSB1c2VyQ29uZmlnLm5hbWVcclxuICAgIGlmIHVzZXJDb25maWcuYmFzZVVybD8gYW5kIHVzZXJDb25maWcuYmFzZVVybCBpc250IFwiXCJcclxuICAgICAgbWF0Y2guYmFzZVVybCA9IHVzZXJDb25maWcuYmFzZVVybFxyXG4gICAgaWYgdXNlckNvbmZpZy5pbmNsdWRlPy5sZW5ndGggPiAwXHJcbiAgICAgIG1hdGNoLmluY2x1ZGUgPSB1c2VyQ29uZmlnLmluY2x1ZGVcclxuICAgIG1hdGNoLnBhdHRlcm5zID0gdXNlckNvbmZpZy5wYXR0ZXJuc1xyXG4gICAgbWF0Y2guZXhjbHVkZSA9IHVzZXJDb25maWcuZXhjbHVkZVxyXG4gICAgbWF0Y2guZXhjbHVkZVJlZ2V4ID0gdXNlckNvbmZpZy5leGNsdWRlUmVnZXhcclxuICAgIG1hdGNoLnBsdWdpbnMgPSB1c2VyQ29uZmlnLnBsdWdpbnNcclxuICAgIGlmIHVzZXJDb25maWcudmVyc2lvbk9mPyBhbmQgdXNlckNvbmZpZy52ZXJzaW9uT2YgaXNudCBcIlwiXHJcbiAgICAgIG1hdGNoLnZlcnNpb25PZiA9IHVzZXJDb25maWcudmVyc2lvbk9mXHJcbiAgICBtYXRjaC5pbmNsdWRlQWxpYXNlZEZpbGVzID0gdXNlckNvbmZpZy5pbmNsdWRlQWxpYXNlZEZpbGVzXHJcbiAgaWYgbWF0Y2hlZE1vZHVsZXMubGVuZ3RoIGlzIDBcclxuICAgIG1vZHVsZXMucHVzaCB1c2VyQ29uZmlnXHJcblxyXG5fX2RldGVybWluZVBhdGggPSAodGhlUGF0aCwgcmVsYXRpdmVUbykgLT5cclxuICByZXR1cm4gdGhlUGF0aCBpZiB3aW5kb3dzRHJpdmUudGVzdCB0aGVQYXRoXHJcbiAgcmV0dXJuIHRoZVBhdGggaWYgdGhlUGF0aC5pbmRleE9mKFwiL1wiKSBpcyAwXHJcbiAgcGF0aC5qb2luIHJlbGF0aXZlVG8sIHRoZVBhdGhcclxuXHJcbl9fZ2V0TW9kdWxlRmlsZXMgPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIGZpbGVzID0gd3JlbmNoLnJlYWRkaXJTeW5jUmVjdXJzaXZlIG1vZHVsZUNvbmZpZy5pbmNsdWRlRm9sZGVyXHJcbiAgZmlsZXMgPSBmaWxlcy5tYXAgKGZpbGUpIC0+XHJcbiAgICBwYXRoLmpvaW4gbW9kdWxlQ29uZmlnLmluY2x1ZGVGb2xkZXIsIGZpbGVcclxuICAuZmlsdGVyIChmaWxlKSAtPlxyXG4gICAgZnMuc3RhdFN5bmMoZmlsZSkuaXNGaWxlKCkgYW5kXHJcbiAgICBtb2R1bGVDb25maWcuZXhjbHVkZS5pbmRleE9mKGZpbGUpIGlzIC0xIGFuZFxyXG4gICAgbm90IChtb2R1bGVDb25maWcuZXhjbHVkZVJlZ2V4IGFuZCBmaWxlLm1hdGNoKG1vZHVsZUNvbmZpZy5leGNsdWRlUmVnZXgpKVxyXG4gIC5tYXAgX19ub3JtYWxpemVcclxuICByZXR1cm4gZmlsZXNcclxuXHJcbl9fZmlsdGVyUGx1Z2luRmlsZXMgPSAobW9kdWxlQ29uZmlnLCBmaWxlcywgYmFzZSkgLT5cclxuICBmb3IgcGx1Z2luQ29uZmlnIGluIG1vZHVsZUNvbmZpZy5wbHVnaW5zXHJcbiAgICBwbHVnaW5Db25maWcucGF0dGVybnMuZm9yRWFjaCAocGF0dGVybikgLT5cclxuICAgICAgYWJzUGF0dGVybiA9IF9fbm9ybWFsaXplKHBhdGgucmVzb2x2ZShiYXNlLCBwYXR0ZXJuKSlcclxuICAgICAgIyBUaGUgZmlsdGVyZWQgcmVzdWx0IHdpbGwgYWN0dWFsbHkgYmUgdGhlIGZpbGVzIHRoYXRcclxuICAgICAgIyBkb24ndCBtYXRjaCB0aGUgcGx1Z2luIHBhdHRlcm5zXHJcbiAgICAgIGZpbGVzID0gZmlsZXMuZmlsdGVyIChmaWxlKSAtPlxyXG4gICAgICAgIGlmIG1pbmltYXRjaCBmaWxlLCBhYnNQYXR0ZXJuXHJcbiAgICAgICAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLnB1c2ggXCIje3BsdWdpbkNvbmZpZy5wYXRofSEje2ZpbGV9XCJcclxuICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgcmV0dXJuIGZpbGVzXHJcblxyXG5fX2ZpbHRlckluY2x1ZGVGaWxlcyA9IChmaWxlcywgcGF0dGVybnMsIGJhc2UpIC0+XHJcbiAgcmVzdWx0ID0gW11cclxuICBwYXR0ZXJucy5mb3JFYWNoIChwYXR0ZXJuKSAtPlxyXG4gICAgYWJzUGF0dGVybiA9IF9fbm9ybWFsaXplKHBhdGgucmVzb2x2ZShiYXNlLCBwYXR0ZXJuKSlcclxuICAgIHJlc3VsdC5wdXNoKGZpbGUpIGZvciBmaWxlIGluIGZpbGVzIHdoZW4gbWluaW1hdGNoKGZpbGUsIGFic1BhdHRlcm4pXHJcbiAgcmV0dXJuIHJlc3VsdFxyXG5cclxuX19zZXRQYXRoQWxpYXMgPSAobW9kdWxlQ29uZmlnLCBtb2R1bGVzKSAtPlxyXG4gIG1hdGNoZWRNb2R1bGVzID0gbW9kdWxlcy5maWx0ZXIgKG0pIC0+XHJcbiAgICBtb2R1bGVDb25maWcudmVyc2lvbk9mIGlzIG0ubmFtZSBvciBtb2R1bGVDb25maWcudmVyc2lvbk9mIGlzIG0uYmFzZVVybFxyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpc250IDFcclxuICAgIGNvbnNvbGUubG9nIFwiVmVyc2lvbiBvZiBkaWRuJ3QgbWF0Y2ggb3IgbWF0Y2hlZCBtb3JlIHRoYW4gb25lIG1vZHVsZVwiXHJcbiAgICByZXR1cm5cclxuICBtYXRjaCA9IG1hdGNoZWRNb2R1bGVzWzBdXHJcbiAgaWYgbWF0Y2gudmVyc2lvbk9mP1xyXG4gICAgdW5sZXNzIG1hdGNoLnBhdGhBbGlhcz9cclxuICAgICAgX19zZXRQYXRoQWxpYXMgbWF0Y2gsIG1vZHVsZXNcclxuICAgIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXMgPSBtYXRjaC5wYXRoQWxpYXNcclxuICBlbHNlXHJcbiAgICBtb2R1bGVDb25maWcucGF0aEFsaWFzID0gbWF0Y2guYmFzZVVybFxyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlLnB1c2ggbWF0Y2gubmFtZVxyXG5cclxuX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzID0gKG1vZHVsZUNvbmZpZywgbW9kdWxlcykgLT5cclxuICByZXR1cm4gdW5sZXNzIG1vZHVsZUNvbmZpZy5pbmNsdWRlPy5sZW5ndGggPiAwXHJcbiAgZm9yIGluY2x1ZGUgaW4gbW9kdWxlQ29uZmlnLmluY2x1ZGUgd2hlbiBpbmNsdWRlIGlzbnQgbW9kdWxlQ29uZmlnLm5hbWUgYW5kIGluY2x1ZGUgaXNudCBtb2R1bGVDb25maWcuYmFzZVVybFxyXG4gICAgZm9yIG0gaW4gbW9kdWxlc1xyXG4gICAgICBpZiBpbmNsdWRlIGlzIG0ubmFtZSBvciBpbmNsdWRlIGlzIG0uYmFzZVVybFxyXG4gICAgICAgIGlmIG0uaW5jbHVkZT8ubGVuZ3RoID4gMFxyXG4gICAgICAgICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzIG0sIG1vZHVsZXNcclxuICAgICAgICBpZiBtLmluY2x1ZGVGaWxlcz9cclxuICAgICAgICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMgPSBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmNvbmNhdCBtLmluY2x1ZGVGaWxlc1xyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlID0gbnVsbFxyXG5cclxuX19hcHBseVRvQ29uZmlnID0gKHJ1bkNvbmZpZywgbW9kdWxlQ29uZmlnKSAtPlxyXG4gIGlmIHJ1bkNvbmZpZy5tb2R1bGVzPy5sZW5ndGggPiAwXHJcbiAgICBtYXRjaGVkTW9kdWxlcyA9IHJ1bkNvbmZpZy5tb2R1bGVzLmZpbHRlciAobSkgLT4gbS5uYW1lIGlzIG1vZHVsZUNvbmZpZy5uYW1lXHJcbiAgICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggPiAwXHJcbiAgICAgIGZvciBtb2R1bGVFbnRyeSBpbiBtYXRjaGVkTW9kdWxlc1xyXG4gICAgICAgIF9fYXBwZW5kVG9Nb2R1bGUgbW9kdWxlRW50cnksIG1vZHVsZUNvbmZpZ1xyXG4gICAgICByZXR1cm5cclxuICBydW5Db25maWcubW9kdWxlcyA9IFtdIHVubGVzcyBBcnJheS5pc0FycmF5KHJ1bkNvbmZpZy5tb2R1bGVzKVxyXG4gIG1vZHVsZUVudHJ5ID0ge25hbWU6IG1vZHVsZUNvbmZpZy5uYW1lLCBjcmVhdGU6IHRydWUsIGluY2x1ZGU6IFtdfVxyXG4gIF9fYXBwZW5kVG9Nb2R1bGUgbW9kdWxlRW50cnksIG1vZHVsZUNvbmZpZ1xyXG4gIHJ1bkNvbmZpZy5tb2R1bGVzLnB1c2ggbW9kdWxlRW50cnlcclxuXHJcbl9fYXBwZW5kVG9Nb2R1bGUgPSAobW9kdWxlRW50cnksIG1vZHVsZUNvbmZpZykgLT5cclxuICBtb2R1bGVFbnRyeS5pbmNsdWRlID0gW10gdW5sZXNzIEFycmF5LmlzQXJyYXkobW9kdWxlRW50cnkuaW5jbHVkZSlcclxuICBpZiBtb2R1bGVDb25maWcucGF0aEFsaWFzP1xyXG4gICAgbW9kdWxlRW50cnkub3ZlcnJpZGUgPSB7fSB1bmxlc3MgbW9kdWxlRW50cnkub3ZlcnJpZGU/XHJcbiAgICBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRocyA9IHt9IHVubGVzcyBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRocz9cclxuICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMuZm9yRWFjaCAoZmlsZSkgLT5cclxuICAgICAgcGx1Z2luSW5kZXggPSBmaWxlLmluZGV4T2YoXCIhXCIpXHJcbiAgICAgIGlmIHBsdWdpbkluZGV4ID4gLTFcclxuICAgICAgICBhbWRGaWxlID0gX19nZXRQbHVnaW5GaWxlQU1EIGZpbGUsIHBsdWdpbkluZGV4XHJcbiAgICAgICAgcGx1Z2luSW5kZXggPSBhbWRGaWxlLmluZGV4T2YoXCIhXCIpXHJcbiAgICAgICAgIyBPbmx5IGFsaWFzIHRoZSBmaWxlLCBub3QgdGhlIHBsdWdpblxyXG4gICAgICAgIGZpbGVQYXJ0ID0gYW1kRmlsZS5zdWJzdHJpbmcocGx1Z2luSW5kZXgrMSlcclxuICAgICAgICBhbGlhc2VkRmlsZSA9IGZpbGVQYXJ0LnJlcGxhY2UgbW9kdWxlQ29uZmlnLmJhc2VVcmwsIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXNcclxuICAgICAgICBhbGlhcyA9IFwiI3thbWRGaWxlLnN1YnN0cmluZygwLHBsdWdpbkluZGV4KX0hI3thbGlhc2VkRmlsZX1cIlxyXG4gICAgICAgIG1vZHVsZUVudHJ5LmluY2x1ZGUucHVzaChhbGlhcykgaWYgbW9kdWxlQ29uZmlnLmluY2x1ZGVBbGlhc2VkRmlsZXNcclxuICAgICAgICBhbGlhc2VkRmlsZSA9IGFsaWFzZWRGaWxlLnJlcGxhY2UocGF0aC5leHRuYW1lKGZpbGUpLCAnJylcclxuICAgICAgICB1bmxlc3MgbW9kdWxlRW50cnkub3ZlcnJpZGUucGF0aHNbYWxpYXNlZEZpbGVdP1xyXG4gICAgICAgICAgbW9kdWxlRW50cnkub3ZlcnJpZGUucGF0aHNbYWxpYXNlZEZpbGVdID0gZmlsZVBhcnQucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgYW1kRmlsZSA9IF9fZ2V0RmlsZUFNRChmaWxlKS5yZXBsYWNlKHBhdGguZXh0bmFtZShmaWxlKSwgJycpXHJcbiAgICAgICAgYWxpYXMgPSBhbWRGaWxlLnJlcGxhY2UgbW9kdWxlQ29uZmlnLmJhc2VVcmwsIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXNcclxuICAgICAgICBtb2R1bGVFbnRyeS5pbmNsdWRlLnB1c2goYWxpYXMpIGlmIG1vZHVsZUNvbmZpZy5pbmNsdWRlQWxpYXNlZEZpbGVzXHJcbiAgICAgICAgdW5sZXNzIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzW2FsaWFzXT9cclxuICAgICAgICAgIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzW2FsaWFzXSA9IGFtZEZpbGVcclxuICBlbHNlXHJcbiAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmZvckVhY2ggKGZpbGUpIC0+XHJcbiAgICAgIHBsdWdpbkluZGV4ID0gZmlsZS5pbmRleE9mKFwiIVwiKVxyXG4gICAgICBpZiBwbHVnaW5JbmRleCA+IC0xXHJcbiAgICAgICAgbW9kdWxlRW50cnkuaW5jbHVkZS5wdXNoIF9fZ2V0UGx1Z2luRmlsZUFNRChmaWxlLCBwbHVnaW5JbmRleClcclxuICAgICAgZWxzZVxyXG4gICAgICAgIG1vZHVsZUVudHJ5LmluY2x1ZGUucHVzaCBfX2dldEZpbGVBTUQoZmlsZSkucmVwbGFjZShwYXRoLmV4dG5hbWUoZmlsZSksICcnKVxyXG5cclxuX19nZXRQbHVnaW5GaWxlQU1EID0gKGZpbGUsIHBsdWdpbkluZGV4KSAtPlxyXG4gIHBsdWdpblBhdGggPSBfX2RldGVybWluZVBhdGgoZmlsZS5zdWJzdHJpbmcoMCwgcGx1Z2luSW5kZXgpICsgXCIuanNcIiwgY29tcGlsZWRKYXZhc2NyaXB0RGlyKVxyXG4gICMgVXNlIGFsaWFzIGlmIHRoZSBwbHVnaW4gaGFzIGJlZW4gYWxpYXNlZFxyXG4gIHBsdWdpbkFsaWFzID0gcmVxdWlyZU1vZHVsZS5tYW5pcHVsYXRlUGF0aFdpdGhBbGlhcyBwbHVnaW5QYXRoXHJcbiAgIyBJZiBub3QgYWxpYXNlZCwgZ2V0IHVybC9hbWQgcGF0aFxyXG4gIGlmIHBsdWdpbkFsaWFzIGlzIHBsdWdpblBhdGhcclxuICAgIHBsdWdpbkFsaWFzID0gcGF0aC5yZWxhdGl2ZShjb21waWxlZEphdmFzY3JpcHREaXIsIHBsdWdpbkFsaWFzKS5zcGxpdChwYXRoLnNlcCkuam9pbihcIi9cIikucmVwbGFjZShcIi5qc1wiLCAnJylcclxuICBmaWxlQU1EID0gX19nZXRGaWxlQU1EKGZpbGUuc3Vic3RyaW5nKHBsdWdpbkluZGV4KzEpKVxyXG4gIHJldHVybiBcIiN7cGx1Z2luQWxpYXN9ISN7ZmlsZUFNRH1cIlxyXG5cclxuX19nZXRGaWxlQU1EID0gKGZpbGUpIC0+XHJcbiAgIyBVc2UgYWxpYXMgaWYgcGF0aCBoYXMgYmVlbiBhbGlhc2VkXHJcbiAgZmlsZUFNRCA9IHJlcXVpcmVNb2R1bGUubWFuaXB1bGF0ZVBhdGhXaXRoQWxpYXMgZmlsZVxyXG4gICMgR2V0IHJlbGF0aXZlIHVybC9hbWQgcGF0aCBpZiBub3QgYWxpYXNlZFxyXG4gIGZpbGVBTUQgPSBwYXRoLnJlbGF0aXZlKGNvbXBpbGVkSmF2YXNjcmlwdERpciwgZmlsZSkgaWYgZmlsZUFNRCBpcyBmaWxlXHJcbiAgcmV0dXJuIGZpbGVBTUQuc3BsaXQocGF0aC5zZXApLmpvaW4oXCIvXCIpXHJcblxyXG5fX25vcm1hbGl6ZSA9IChmaWxlcGF0aCkgLT4gXHJcbiAgcmV0dXJuIGZpbGVwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKSBpZiB3aW4zMlxyXG4gIHJldHVybiBmaWxlcGF0aFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG4gIHJlZ2lzdHJhdGlvbjogcmVnaXN0cmF0aW9uXHJcbiAgZGVmYXVsdHM6ICAgICBjb25maWcuZGVmYXVsdHNcclxuICBwbGFjZWhvbGRlcjogIGNvbmZpZy5wbGFjZWhvbGRlclxyXG4gIHZhbGlkYXRlOiAgICAgY29uZmlnLnZhbGlkYXRlIl19
