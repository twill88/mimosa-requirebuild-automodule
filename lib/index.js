"use strict";
var compiledJavascriptDir, config, fs, minimatch, path, pathSeparator, registration, requireModule, win32, windowsDrive, wrench, __addOtherModuleIncludes, __appendToModule, __applyToConfig, __applyUserConfigs, __determinePath, __getDirs, __getFileAMD, __getIncludeFiles, __normalize, __setPathAlias, _buildAutoModules,
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
  var hasRunConfigs, jsSourceDir, moduleConfig, moduleNames, modules, runConfig, userConfig, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2;
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
      excludeRegex: mimosaConfig.requireBuildAutoModule.excludeRegex
    };
  });
  _ref1 = mimosaConfig.requireBuildAutoModule.modules;
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    userConfig = _ref1[_i];
    __applyUserConfigs(userConfig, modules);
  }
  for (_j = 0, _len1 = modules.length; _j < _len1; _j++) {
    moduleConfig = modules[_j];
    moduleConfig.includeFiles = __getIncludeFiles(moduleConfig);
    if ((moduleConfig.versionOf != null) && (moduleConfig.pathAlias == null)) {
      __setPathAlias(moduleConfig, modules);
    }
  }
  for (_k = 0, _len2 = modules.length; _k < _len2; _k++) {
    moduleConfig = modules[_k];
    __addOtherModuleIncludes(moduleConfig, modules);
    _ref2 = options.runConfigs;
    for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
      runConfig = _ref2[_l];
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
    console.log(matchedModules);
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
    if ((userConfig.versionOf != null) && userConfig.versionOf !== "") {
      match.versionOf = userConfig.versionOf;
    }
    match.includeAliasedFiles = userConfig.includeAliasedFiles;
  }
  if (matchedModules.length === 0) {
    return modules.push(userConfig);
  }
};

__getIncludeFiles = function(moduleConfig) {
  var base, includeFiles, includeFolder;
  includeFolder = __determinePath(moduleConfig.baseUrl, compiledJavascriptDir);
  includeFiles = wrench.readdirSyncRecursive(includeFolder);
  includeFiles = includeFiles.map(function(file) {
    return path.join(includeFolder, file);
  }).filter(function(file) {
    return fs.statSync(file).isFile() && moduleConfig.exclude.indexOf(file) === -1 && !(moduleConfig.excludeRegex && file.match(moduleConfig.excludeRegex));
  }).map(__normalize);
  base = __normalize(path.join(includeFolder, pathSeparator));
  moduleConfig.patterns.forEach(function(pattern) {
    var absPattern;
    absPattern = __normalize(path.resolve(base, pattern));
    return includeFiles = includeFiles.filter(function(file) {
      return minimatch(file, absPattern);
    });
  });
  return includeFiles;
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
      var alias, amdFile;
      amdFile = __getFileAMD(file);
      alias = amdFile.replace(moduleConfig.baseUrl, moduleConfig.pathAlias);
      if (moduleConfig.includeAliasedFiles) {
        moduleEntry.include.push(alias);
      }
      if (moduleEntry.override.paths[alias] == null) {
        return moduleEntry.override.paths[alias] = amdFile;
      }
    });
  } else {
    return moduleConfig.includeFiles.forEach(function(file) {
      return moduleEntry.include.push(__getFileAMD(file));
    });
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

__getFileAMD = function(file) {
  var fileAMD;
  fileAMD = requireModule.manipulatePathWithAlias(file);
  if (fileAMD === file) {
    fileAMD = path.relative(compiledJavascriptDir, file);
  }
  return fileAMD.split(path.sep).join("/").replace(path.extname(file), '');
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

//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxsaWJcXGluZGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxzcmNcXGluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFdBQUE7Q0FBQSxHQUFBLHFUQUFBO0dBQUEsZUFBQTs7QUFFQSxDQUZBLEVBRU8sQ0FBUCxFQUFPLENBQUE7O0FBRVAsQ0FKQSxDQUlBLENBQUssQ0FBQSxHQUFBOztBQUVMLENBTkEsRUFNUyxHQUFULENBQVMsQ0FBQTs7QUFFVCxDQVJBLEVBUVksSUFBQSxFQUFaLEVBQVk7O0FBRVosQ0FWQSxFQVVTLEdBQVQsQ0FBUyxHQUFBOztBQUVULENBWkEsRUFZZ0IsQ0FaaEIsU0FZQTs7QUFFQSxDQWRBLEVBY2UsU0FBZixFQWRBOztBQWdCQSxDQWhCQSxFQWdCUSxFQUFSLEVBQWUsQ0FBUDs7QUFFUixDQWxCQSxFQWtCbUIsQ0FBSCxDQUFBLFFBQWhCOztBQUVBLENBcEJBLENBQUEsQ0FvQndCLGtCQUF4Qjs7QUFFQSxDQXRCQSxDQXNCOEIsQ0FBZixLQUFBLENBQUMsR0FBaEI7Q0FDRSxLQUFBO0NBQUEsQ0FBQSxDQUF3QixFQUFrQixPQUFOLFNBQXBDO0NBQ0EsQ0FBQSxFQUFHLE1BQUgsRUFBZTtDQUNiLEVBQWdCLENBQWhCLFFBQTRCLENBQTVCLEdBQThDO0NBQTlDLEVBQ0ksQ0FBSixNQURBLEVBQ2dCO0NBRGhCLENBRWdCLEVBQWhCLENBQVMsR0FBVCxFQUEwRSxHQUFBLEdBQTFFLENBQUE7Q0FDUyxDQUEyQixNQUFwQyxHQUFBLEtBQUEsQ0FBQTtJQU5XO0NBQUE7O0FBVWYsQ0FoQ0EsQ0FnQ21DLENBQWYsQ0FBQSxHQUFBLEVBQUMsR0FBRCxLQUFwQjtDQUNFLEtBQUEsOElBQUE7Q0FBQSxDQUFBLENBQTZDLENBQVgsU0FBbEM7QUFDcUIsQ0FBckIsQ0FBQSxFQUFBLFNBQUE7Q0FBQSxHQUFPLE9BQUE7SUFEUDtDQUFBLENBR0EsQ0FBYyxFQUFvQixJQUFwQixFQUFkLENBQTRCLENBQWQ7Q0FIZCxDQUlBLENBQWMsTUFBQSxFQUFkO0NBSkEsQ0FLQSxDQUFVLElBQVYsRUFBMkIsRUFBTjtXQUNuQjtDQUFBLENBQ1EsQ0FBRSxDQUFSLEVBQUEsQ0FBTSxDQURSO0NBQUEsQ0FFVyxJQUFULENBQUE7Q0FGRixDQUdXLElBQVQsQ0FBQTtDQUhGLENBSVksSUFBVixFQUFBLElBQXNCLFVBQXVCO0NBSi9DLENBS1csSUFBVCxDQUFBLEtBQXFCLFVBQXVCO0NBTDlDLENBTWdCLElBQWQsTUFBQSxVQUFpRDtDQVAzQjtDQUFoQixFQUFnQjtDQVUxQjtDQUFBLE1BQUEscUNBQUE7NEJBQUE7Q0FDRSxDQUErQixFQUEvQixHQUFBLEdBQUEsUUFBQTtDQURGLEVBZkE7QUFrQkEsQ0FBQSxNQUFBLHlDQUFBO2dDQUFBO0NBQ0UsRUFBNEIsQ0FBNUIsUUFBWSxLQUFnQjtDQUM1QixHQUFBLDRCQUFHO0NBQ0QsQ0FBNkIsSUFBN0IsQ0FBQSxLQUFBLEVBQUE7TUFISjtDQUFBLEVBbEJBO0FBeUJBLENBQUEsTUFBQSx5Q0FBQTtnQ0FBQTtDQUNFLENBQXVDLEVBQXZDLEdBQUEsS0FBQSxZQUFBO0NBRUE7Q0FBQSxRQUFBLHFDQUFBOzZCQUFBO0NBQ0UsQ0FBMkIsSUFBM0IsR0FBQSxHQUFBLEdBQUE7Q0FERixJQUhGO0NBQUEsRUF6QkE7Q0ErQkEsR0FBQSxLQUFBO0NBaENrQjs7QUFrQ3BCLENBbEVBLEVBa0VZLElBQUEsRUFBWjtDQUNLLENBQUQsQ0FBNkIsQ0FBQSxFQUEvQixDQUFBLEVBQUEsRUFBQTtDQUNPLENBQWtCLENBQXZCLENBQUssQ0FBUSxFQUFvQixDQUFaLEdBQXJCLEVBQWlDO0NBRG5DLEVBQStCO0NBRHJCOztBQUlaLENBdEVBLENBc0VrQyxDQUFiLElBQUEsRUFBQyxDQUFELFFBQXJCO0NBQ0UsS0FBQSxxQkFBQTtDQUFBLENBQUEsQ0FBaUIsR0FBQSxDQUFPLEVBQVMsS0FBakM7Q0FDRyxHQUFELENBQVUsRUFBbUIsR0FBVCxDQUFwQjtDQURlLEVBQWU7Q0FFaEMsQ0FBQSxDQUEyQixDQUF4QixFQUFBLFFBQWM7Q0FFZixFQUFBLENBQUEsR0FBTyw4QkFBUDtDQUFBLEVBQ0EsQ0FBQSxHQUFPLE9BQVA7Q0FDQSxTQUFBO0lBTkY7Q0FPQSxDQUFBLEVBQUcsQ0FBeUIsQ0FBekIsUUFBYztDQUNmLEVBQVEsQ0FBUixDQUFBLFNBQXVCO0NBQXZCLEVBQ2EsQ0FBYixDQUFLLEtBQWtCO0NBQ3ZCLENBQUEsRUFBQSxDQUFtRCxFQUF4QixHQUFVLGtCQUFsQztDQUNELEVBQWdCLEVBQVgsQ0FBTCxDQUFBLEdBQTBCO01BSDVCO0NBSUEsRUFBZ0MsQ0FBaEM7Q0FDRSxFQUFnQixFQUFYLENBQUwsQ0FBQSxHQUEwQjtNQUw1QjtDQUFBLEVBTWlCLENBQWpCLENBQUssR0FBTCxFQUEyQjtDQU4zQixFQU9nQixDQUFoQixDQUFLLEVBQUwsR0FBMEI7Q0FQMUIsRUFRcUIsQ0FBckIsQ0FBSyxLQUEwQixFQUEvQjtDQUNBLENBQUEsRUFBQSxDQUF1RCxJQUExQixDQUFVLG9CQUFwQztDQUNELEVBQWtCLEVBQWIsQ0FBTCxHQUFBLENBQTRCO01BVjlCO0NBQUEsRUFXNEIsQ0FBNUIsQ0FBSyxLQUFpQyxTQUF0QztJQW5CRjtDQW9CQSxDQUFBLEVBQUcsQ0FBeUIsQ0FBekIsUUFBYztDQUNQLEdBQVIsR0FBTyxHQUFQLENBQUE7SUF0QmlCO0NBQUE7O0FBd0JyQixDQTlGQSxFQThGb0IsTUFBQyxHQUFELEtBQXBCO0NBQ0UsS0FBQSwyQkFBQTtDQUFBLENBQUEsQ0FBZ0IsSUFBQSxLQUE0QixDQUE1QyxFQUFnQixNQUFBO0NBQWhCLENBQ0EsQ0FBZSxHQUFNLE1BQXJCLENBQWUsT0FBQTtDQURmLENBRUEsQ0FBZSxDQUFpQixLQUFDLEdBQWpDO0NBQ08sQ0FBb0IsRUFBckIsT0FBSixFQUFBO0NBRGEsRUFBaUIsQ0FFeEIsRUFGTyxHQUVOO0FBRWdDLENBRHBDLENBQUQsRUFBRixDQUNzQyxDQUR0QyxDQUNvQixDQURwQixHQUFBLENBQ1k7Q0FKQyxFQUVQLFFBRk87Q0FGZixDQVVBLENBQU8sQ0FBUCxPQUFPLEVBQVk7Q0FWbkIsQ0FXQSxDQUE4QixJQUE5QixDQUFxQixDQUFVLEdBQW5CO0NBQ1YsT0FBQSxFQUFBO0NBQUEsQ0FBNEMsQ0FBL0IsQ0FBYixHQUF5QixHQUF6QixDQUFhO0NBQ2UsRUFBYixDQUFvQixFQUFwQixHQUFxQixFQUFwQyxDQUFBO0NBQ1ksQ0FBTSxFQUFoQixLQUFBLENBQUEsR0FBQTtDQURhLElBQW9CO0NBRnJDLEVBQThCO0NBSTlCLFFBQU8sR0FBUDtDQWhCa0I7O0FBa0JwQixDQWhIQSxDQWdIZ0MsQ0FBZixJQUFBLEVBQUMsR0FBRCxFQUFqQjtDQUNFLEtBQUEsZUFBQTtDQUFBLENBQUEsQ0FBaUIsR0FBQSxDQUFPLEVBQVMsS0FBakM7Q0FDZSxHQUFiLENBQTBCLElBQTFCLEVBQUEsQ0FBWTtDQURHLEVBQWU7Q0FFaEMsQ0FBQSxFQUFHLENBQTJCLENBQTNCLFFBQWM7Q0FDZixFQUFBLENBQUEsR0FBTyxrREFBUDtDQUNBLFNBQUE7SUFKRjtDQUFBLENBS0EsQ0FBUSxFQUFSLFNBQXVCO0NBQ3ZCLENBQUEsRUFBRyxtQkFBSDtDQUNFLEdBQUEsbUJBQUE7Q0FDRSxDQUFzQixHQUF0QixDQUFBLENBQUEsT0FBQTtNQURGO0NBQUEsRUFFeUIsQ0FBekIsQ0FBOEIsSUFBOUIsR0FBWTtJQUhkLEVBQUE7Q0FLRSxFQUF5QixDQUF6QixDQUE4QixFQUE5QixFQUFBLEdBQVk7SUFYZDtDQVlhLEdBQWIsQ0FBK0IsRUFBWCxFQUFwQixHQUFZO0NBYkc7O0FBZWpCLENBL0hBLENBK0gwQyxDQUFmLElBQUEsRUFBQyxHQUFELFlBQTNCO0NBQ0UsS0FBQSw2Q0FBQTtBQUFBLENBQUEsQ0FBQSxDQUE2QyxDQUE3QztDQUFBLFNBQUE7SUFBQTtDQUNBO0NBQUEsTUFBQSxxQ0FBQTt5QkFBQTtDQUFtRSxHQUExQixDQUFhLEVBQWIsS0FBeUI7QUFDaEUsQ0FBQSxVQUFBLHFDQUFBO3lCQUFBO0NBQ0UsR0FBRyxDQUFXLEVBQVgsQ0FBSDtDQUNFLEVBQXVCLEVBQVgsS0FBWjtDQUNFLENBQTRCLEtBQTVCLEtBQUEsWUFBQTtZQURGO0NBRUEsR0FBRyxNQUFILFlBQUE7Q0FDRSxFQUE0QixHQUFBLE1BQTVCO1lBSko7VUFERjtDQUFBO01BREY7Q0FBQSxFQURBO0NBUWEsRUFBVSxJQUF2QixFQUFBLEdBQVk7Q0FUYTs7QUFXM0IsQ0ExSUEsQ0EwSThCLENBQVosTUFBQyxHQUFELEdBQWxCO0NBQ0UsS0FBQSxxQ0FBQTtDQUFBLENBQUEsQ0FBK0IsQ0FBWDtDQUNsQixFQUFpQixDQUFqQixFQUFpQixDQUFpQixFQUFSLEtBQTFCO0NBQWtELEdBQUQsQ0FBVSxPQUFZLENBQXRCO0NBQWhDLElBQXlCO0NBQzFDLEVBQTJCLENBQTNCLEVBQUcsUUFBYztBQUNmLENBQUEsVUFBQSwwQ0FBQTswQ0FBQTtDQUNFLENBQThCLE1BQTlCLEdBQUEsQ0FBQSxJQUFBO0NBREYsTUFBQTtDQUVBLFdBQUE7TUFMSjtJQUFBO0FBTThCLENBQTlCLENBQUEsRUFBQSxDQUFtQyxFQUFMLEVBQXVCO0NBQXJELENBQUEsQ0FBb0IsQ0FBcEIsR0FBQSxFQUFTO0lBTlQ7Q0FBQSxDQU9BLENBQWMsUUFBZDtDQUFjLENBQU8sRUFBTixRQUFrQjtDQUFuQixDQUFrQyxFQUFSLEVBQUE7Q0FBMUIsQ0FBaUQsRUFBVCxHQUFBO0NBUHRELEdBQUE7Q0FBQSxDQVFBLFNBQUEsQ0FBQSxJQUFBO0NBQ1UsR0FBVixHQUFpQixFQUFqQixFQUFBO0NBVmdCOztBQVlsQixDQXRKQSxDQXNKaUMsQ0FBZCxNQUFDLEVBQUQsQ0FBQSxJQUFuQjtBQUNrQyxDQUFoQyxDQUFBLEVBQUEsQ0FBcUMsRUFBTCxJQUF5QjtDQUF6RCxDQUFBLENBQXNCLENBQXRCLEdBQUEsSUFBVztJQUFYO0NBQ0EsQ0FBQSxFQUFHLDBCQUFIO0NBQ0UsR0FBQSx3QkFBQTtDQUFBLENBQUEsQ0FBdUIsR0FBdkIsRUFBQSxHQUFXO01BQVg7Q0FDQSxHQUFBLDhCQUFBO0NBQUEsQ0FBQSxDQUE2QixFQUE3QixDQUFBLEVBQW9CLEdBQVQ7TUFEWDtDQUVhLEVBQXFCLENBQUEsR0FBbEMsRUFBbUMsRUFBbkMsQ0FBWTtDQUNWLFNBQUEsSUFBQTtDQUFBLEVBQVUsQ0FBQSxFQUFWLENBQUEsS0FBVTtDQUFWLENBQzhDLENBQXRDLEVBQVIsQ0FBQSxDQUFlLEVBQVAsR0FBNEI7Q0FDcEMsR0FBbUMsRUFBbkMsTUFBK0MsT0FBL0M7Q0FBQSxHQUFBLENBQUEsRUFBbUIsQ0FBbkIsR0FBVztRQUZYO0NBR0EsR0FBTyxFQUFQLG1DQUFBO0NBQ2MsRUFBd0IsRUFBVCxHQUFQLEdBQVQsSUFBWDtRQUw4QjtDQUFsQyxJQUFrQztJQUhwQyxFQUFBO0NBVWUsRUFBcUIsQ0FBQSxHQUFsQyxFQUFtQyxFQUFuQyxDQUFZO0NBQ0UsR0FBWixHQUFtQixJQUFSLENBQWMsQ0FBekI7Q0FERixJQUFrQztJQVpuQjtDQUFBOztBQWVuQixDQXJLQSxDQXFLNEIsQ0FBVixJQUFBLEVBQUMsQ0FBRCxLQUFsQjtDQUNFLENBQUEsRUFBa0IsR0FBQSxLQUFZO0NBQTlCLE1BQUEsSUFBTztJQUFQO0NBQ0EsQ0FBQSxDQUFrQixDQUFBLENBQXdCLEVBQWpCO0NBQXpCLE1BQUEsSUFBTztJQURQO0NBRUssQ0FBaUIsRUFBbEIsR0FBSixFQUFBLENBQUE7Q0FIZ0I7O0FBS2xCLENBMUtBLEVBMEtlLENBQUEsS0FBQyxHQUFoQjtDQUVFLEtBQUEsQ0FBQTtDQUFBLENBQUEsQ0FBVSxDQUFBLEdBQVYsTUFBdUIsVUFBYjtDQUVWLENBQUEsRUFBd0QsQ0FBVyxFQUFYO0NBQXhELENBQStDLENBQXJDLENBQVYsR0FBQSxDQUFVLGFBQUE7SUFGVjtDQUdBLENBQXFFLENBQTlELENBQWtCLENBQWxCLEVBQU8sRUFBUDtDQUxNOztBQU9mLENBakxBLEVBaUxjLEtBQUEsQ0FBQyxFQUFmO0NBQ0UsQ0FBQSxFQUF1QyxDQUF2QztDQUFBLENBQStCLENBQXhCLEVBQUEsRUFBQSxDQUFRLEdBQVI7SUFBUDtDQUNBLE9BQUEsQ0FBTztDQUZLOztBQUlkLENBckxBLEVBc0xFLEdBREksQ0FBTjtDQUNFLENBQUEsVUFBQTtDQUFBLENBQ0EsSUFBb0IsRUFBcEI7Q0FEQSxDQUVBLElBQW9CLEtBQXBCO0NBRkEsQ0FHQSxJQUFvQixFQUFwQjtDQXpMRixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCJcclxuXHJcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xyXG5cclxuZnMgPSByZXF1aXJlICdmcydcclxuXHJcbndyZW5jaCA9IHJlcXVpcmUgXCJ3cmVuY2hcIlxyXG5cclxubWluaW1hdGNoID0gcmVxdWlyZSBcIm1pbmltYXRjaFwiXHJcblxyXG5jb25maWcgPSByZXF1aXJlICcuL2NvbmZpZydcclxuXHJcbnJlcXVpcmVNb2R1bGUgPSBudWxsXHJcblxyXG53aW5kb3dzRHJpdmUgPSAvXltBLVphLXpdOlxcXFwvXHJcblxyXG53aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xyXG5cclxucGF0aFNlcGFyYXRvciA9IGlmIHdpbjMyIHRoZW4gJ1xcXFwnIGVsc2UgJy8nXHJcblxyXG5jb21waWxlZEphdmFzY3JpcHREaXIgPSBcIlwiXHJcblxyXG5yZWdpc3RyYXRpb24gPSAobWltb3NhQ29uZmlnLCByZWdpc3RlcikgLT5cclxuICBjb21waWxlZEphdmFzY3JpcHREaXIgPSBtaW1vc2FDb25maWcud2F0Y2guY29tcGlsZWRKYXZhc2NyaXB0RGlyXHJcbiAgaWYgbWltb3NhQ29uZmlnLmlzT3B0aW1pemVcclxuICAgIHJlcXVpcmVNb2R1bGUgPSBtaW1vc2FDb25maWcuaW5zdGFsbGVkTW9kdWxlc1tcIm1pbW9zYS1yZXF1aXJlXCJdXHJcbiAgICBlID0gbWltb3NhQ29uZmlnLmV4dGVuc2lvbnNcclxuICAgIHJlZ2lzdGVyIFsnYWRkJywndXBkYXRlJywncmVtb3ZlJ10sICdiZWZvcmVPcHRpbWl6ZScsIF9idWlsZEF1dG9Nb2R1bGVzLCBbZS5qYXZhc2NyaXB0Li4uLCBlLnRlbXBsYXRlLi4uXVxyXG4gICAgcmVnaXN0ZXIgWydwb3N0QnVpbGQnXSwgICAgICAgICAgICAgJ2JlZm9yZU9wdGltaXplJywgX2J1aWxkQXV0b01vZHVsZXNcclxuICAjZWxzZVxyXG4gICMgICBSZWdpc3RlciB3YXRjaCBzdHVmZlxyXG5cclxuX2J1aWxkQXV0b01vZHVsZXMgPSAobWltb3NhQ29uZmlnLCBvcHRpb25zLCBuZXh0KSAtPlxyXG4gIGhhc1J1bkNvbmZpZ3MgPSBvcHRpb25zLnJ1bkNvbmZpZ3M/Lmxlbmd0aCA+IDBcclxuICByZXR1cm4gbmV4dCgpIHVubGVzcyBoYXNSdW5Db25maWdzXHJcblxyXG4gIGpzU291cmNlRGlyID0gXCIje21pbW9zYUNvbmZpZy53YXRjaC5zb3VyY2VEaXJ9I3twYXRoU2VwYXJhdG9yfSN7bWltb3NhQ29uZmlnLndhdGNoLmphdmFzY3JpcHREaXJ9XCJcclxuICBtb2R1bGVOYW1lcyA9IF9fZ2V0RGlycyhqc1NvdXJjZURpcilcclxuICBtb2R1bGVzID0gbW9kdWxlTmFtZXMubWFwIChkaXJOYW1lKSAtPlxyXG4gICAge1xyXG4gICAgICBuYW1lOiBcIiN7ZGlyTmFtZX0vI3tkaXJOYW1lfS1idWlsdFwiXHJcbiAgICAgIGJhc2VVcmw6IGRpck5hbWVcclxuICAgICAgaW5jbHVkZTogW11cclxuICAgICAgcGF0dGVybnM6IG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLnBhdHRlcm5zXHJcbiAgICAgIGV4Y2x1ZGU6IG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLmV4Y2x1ZGVcclxuICAgICAgZXhjbHVkZVJlZ2V4OiBtaW1vc2FDb25maWcucmVxdWlyZUJ1aWxkQXV0b01vZHVsZS5leGNsdWRlUmVnZXhcclxuICAgIH1cclxuXHJcbiAgZm9yIHVzZXJDb25maWcgaW4gbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUubW9kdWxlc1xyXG4gICAgX19hcHBseVVzZXJDb25maWdzKHVzZXJDb25maWcsIG1vZHVsZXMpXHJcbiAgXHJcbiAgZm9yIG1vZHVsZUNvbmZpZyBpbiBtb2R1bGVzXHJcbiAgICBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzID0gX19nZXRJbmNsdWRlRmlsZXMobW9kdWxlQ29uZmlnKVxyXG4gICAgaWYgbW9kdWxlQ29uZmlnLnZlcnNpb25PZj8gYW5kIG5vdCBtb2R1bGVDb25maWcucGF0aEFsaWFzP1xyXG4gICAgICBfX3NldFBhdGhBbGlhcyhtb2R1bGVDb25maWcsIG1vZHVsZXMpXHJcblxyXG4gICMgQWZ0ZXIgYnVpbGRpbmcgaW5jbHVkZUZpbGVzIGZvciBhbGwgbW9kdWxlcywgd2UgY2FuIGFkZFxyXG4gICMgZGVwZW5kZW5jaWVzIG9mIGluY2x1ZGVkIG1vZHVsZXMgdG8gdGhlIG1vZHVsZUNvbmZpZ1xyXG4gIGZvciBtb2R1bGVDb25maWcgaW4gbW9kdWxlc1xyXG4gICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzIG1vZHVsZUNvbmZpZywgbW9kdWxlc1xyXG5cclxuICAgIGZvciBydW5Db25maWcgaW4gb3B0aW9ucy5ydW5Db25maWdzXHJcbiAgICAgIF9fYXBwbHlUb0NvbmZpZyBydW5Db25maWcsIG1vZHVsZUNvbmZpZ1xyXG5cclxuICBuZXh0KClcclxuXHJcbl9fZ2V0RGlycyA9IChyb290RGlyKSAtPlxyXG4gIGZzLnJlYWRkaXJTeW5jKHJvb3REaXIpLmZpbHRlciAoZmlsZSkgLT5cclxuICAgIGZpbGVbMF0gaXNudCAnLicgYW5kIGZzLnN0YXRTeW5jKFwiI3tyb290RGlyfSN7cGF0aFNlcGFyYXRvcn0je2ZpbGV9XCIpLmlzRGlyZWN0b3J5KClcclxuXHJcbl9fYXBwbHlVc2VyQ29uZmlncyA9ICh1c2VyQ29uZmlnLCBtb2R1bGVzKSAtPlxyXG4gIG1hdGNoZWRNb2R1bGVzID0gbW9kdWxlcy5maWx0ZXIgKG0pIC0+XHJcbiAgICBtLm5hbWUgaXMgdXNlckNvbmZpZy5uYW1lIG9yIG0uYmFzZVVybCBpcyB1c2VyQ29uZmlnLmJhc2VVcmxcclxuICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggPiAxXHJcbiAgICAjIHNob3VsZCBsb2cgdGhpcyB1c2luZyBtaW1vc2EgbG9nZ2VyXHJcbiAgICBjb25zb2xlLmxvZyBcIlNob3VsZCBoYXZlIGZvdW5kIGF0IG1vc3Qgb25lIG1hdGNoXCJcclxuICAgIGNvbnNvbGUubG9nIG1hdGNoZWRNb2R1bGVzXHJcbiAgICByZXR1cm5cclxuICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggaXMgMVxyXG4gICAgbWF0Y2ggPSBtYXRjaGVkTW9kdWxlc1swXVxyXG4gICAgbWF0Y2gubmFtZSA9IHVzZXJDb25maWcubmFtZVxyXG4gICAgaWYgdXNlckNvbmZpZy5iYXNlVXJsPyBhbmQgdXNlckNvbmZpZy5iYXNlVXJsIGlzbnQgXCJcIlxyXG4gICAgICBtYXRjaC5iYXNlVXJsID0gdXNlckNvbmZpZy5iYXNlVXJsXHJcbiAgICBpZiB1c2VyQ29uZmlnLmluY2x1ZGU/Lmxlbmd0aCA+IDBcclxuICAgICAgbWF0Y2guaW5jbHVkZSA9IHVzZXJDb25maWcuaW5jbHVkZVxyXG4gICAgbWF0Y2gucGF0dGVybnMgPSB1c2VyQ29uZmlnLnBhdHRlcm5zXHJcbiAgICBtYXRjaC5leGNsdWRlID0gdXNlckNvbmZpZy5leGNsdWRlXHJcbiAgICBtYXRjaC5leGNsdWRlUmVnZXggPSB1c2VyQ29uZmlnLmV4Y2x1ZGVSZWdleFxyXG4gICAgaWYgdXNlckNvbmZpZy52ZXJzaW9uT2Y/IGFuZCB1c2VyQ29uZmlnLnZlcnNpb25PZiBpc250IFwiXCJcclxuICAgICAgbWF0Y2gudmVyc2lvbk9mID0gdXNlckNvbmZpZy52ZXJzaW9uT2ZcclxuICAgIG1hdGNoLmluY2x1ZGVBbGlhc2VkRmlsZXMgPSB1c2VyQ29uZmlnLmluY2x1ZGVBbGlhc2VkRmlsZXNcclxuICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggaXMgMFxyXG4gICAgbW9kdWxlcy5wdXNoIHVzZXJDb25maWdcclxuXHJcbl9fZ2V0SW5jbHVkZUZpbGVzID0gKG1vZHVsZUNvbmZpZykgLT5cclxuICBpbmNsdWRlRm9sZGVyID0gX19kZXRlcm1pbmVQYXRoIG1vZHVsZUNvbmZpZy5iYXNlVXJsLCBjb21waWxlZEphdmFzY3JpcHREaXJcclxuICBpbmNsdWRlRmlsZXMgPSB3cmVuY2gucmVhZGRpclN5bmNSZWN1cnNpdmUgaW5jbHVkZUZvbGRlclxyXG4gIGluY2x1ZGVGaWxlcyA9IGluY2x1ZGVGaWxlcy5tYXAgKGZpbGUpIC0+XHJcbiAgICBwYXRoLmpvaW4gaW5jbHVkZUZvbGRlciwgZmlsZVxyXG4gIC5maWx0ZXIgKGZpbGUpIC0+XHJcbiAgICBmcy5zdGF0U3luYyhmaWxlKS5pc0ZpbGUoKSBhbmRcclxuICAgIG1vZHVsZUNvbmZpZy5leGNsdWRlLmluZGV4T2YoZmlsZSkgaXMgLTEgYW5kXHJcbiAgICBub3QgKG1vZHVsZUNvbmZpZy5leGNsdWRlUmVnZXggYW5kIGZpbGUubWF0Y2gobW9kdWxlQ29uZmlnLmV4Y2x1ZGVSZWdleCkpXHJcbiAgLm1hcCBfX25vcm1hbGl6ZVxyXG4gICMgRmlsdGVyIGluY2x1ZGVGaWxlcyBhZ2FpbnN0IGluY2x1ZGUgcGF0dGVybnNcclxuICBiYXNlID0gX19ub3JtYWxpemUocGF0aC5qb2luKGluY2x1ZGVGb2xkZXIsIHBhdGhTZXBhcmF0b3IpKVxyXG4gIG1vZHVsZUNvbmZpZy5wYXR0ZXJucy5mb3JFYWNoIChwYXR0ZXJuKSAtPlxyXG4gICAgYWJzUGF0dGVybiA9IF9fbm9ybWFsaXplKHBhdGgucmVzb2x2ZShiYXNlLCBwYXR0ZXJuKSlcclxuICAgIGluY2x1ZGVGaWxlcyA9IGluY2x1ZGVGaWxlcy5maWx0ZXIgKGZpbGUpIC0+XHJcbiAgICAgIG1pbmltYXRjaCBmaWxlLCBhYnNQYXR0ZXJuXHJcbiAgcmV0dXJuIGluY2x1ZGVGaWxlc1xyXG5cclxuX19zZXRQYXRoQWxpYXMgPSAobW9kdWxlQ29uZmlnLCBtb2R1bGVzKSAtPlxyXG4gIG1hdGNoZWRNb2R1bGVzID0gbW9kdWxlcy5maWx0ZXIgKG0pIC0+XHJcbiAgICBtb2R1bGVDb25maWcudmVyc2lvbk9mIGlzIG0ubmFtZSBvciBtb2R1bGVDb25maWcudmVyc2lvbk9mIGlzIG0uYmFzZVVybFxyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpc250IDFcclxuICAgIGNvbnNvbGUubG9nIFwiVmVyc2lvbiBvZiBkaWRuJ3QgbWF0Y2ggb3IgbWF0Y2hlZCBtb3JlIHRoYW4gb25lIG1vZHVsZVwiXHJcbiAgICByZXR1cm5cclxuICBtYXRjaCA9IG1hdGNoZWRNb2R1bGVzWzBdXHJcbiAgaWYgbWF0Y2gudmVyc2lvbk9mP1xyXG4gICAgdW5sZXNzIG1hdGNoLnBhdGhBbGlhcz9cclxuICAgICAgX19zZXRQYXRoQWxpYXMgbWF0Y2gsIG1vZHVsZXNcclxuICAgIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXMgPSBtYXRjaC5wYXRoQWxpYXNcclxuICBlbHNlXHJcbiAgICBtb2R1bGVDb25maWcucGF0aEFsaWFzID0gbWF0Y2guYmFzZVVybFxyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlLnB1c2ggbWF0Y2gubmFtZVxyXG5cclxuX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzID0gKG1vZHVsZUNvbmZpZywgbW9kdWxlcykgLT5cclxuICByZXR1cm4gdW5sZXNzIG1vZHVsZUNvbmZpZy5pbmNsdWRlPy5sZW5ndGggPiAwXHJcbiAgZm9yIGluY2x1ZGUgaW4gbW9kdWxlQ29uZmlnLmluY2x1ZGUgd2hlbiBpbmNsdWRlIGlzbnQgbW9kdWxlQ29uZmlnLm5hbWUgYW5kIGluY2x1ZGUgaXNudCBtb2R1bGVDb25maWcuYmFzZVVybFxyXG4gICAgZm9yIG0gaW4gbW9kdWxlc1xyXG4gICAgICBpZiBpbmNsdWRlIGlzIG0ubmFtZSBvciBpbmNsdWRlIGlzIG0uYmFzZVVybFxyXG4gICAgICAgIGlmIG0uaW5jbHVkZT8ubGVuZ3RoID4gMFxyXG4gICAgICAgICAgX19hZGRPdGhlck1vZHVsZUluY2x1ZGVzIG0sIG1vZHVsZXNcclxuICAgICAgICBpZiBtLmluY2x1ZGVGaWxlcz9cclxuICAgICAgICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMgPSBtb2R1bGVDb25maWcuaW5jbHVkZUZpbGVzLmNvbmNhdCBtLmluY2x1ZGVGaWxlc1xyXG4gIG1vZHVsZUNvbmZpZy5pbmNsdWRlID0gbnVsbFxyXG5cclxuX19hcHBseVRvQ29uZmlnID0gKHJ1bkNvbmZpZywgbW9kdWxlQ29uZmlnKSAtPlxyXG4gIGlmIHJ1bkNvbmZpZy5tb2R1bGVzPy5sZW5ndGggPiAwXHJcbiAgICBtYXRjaGVkTW9kdWxlcyA9IHJ1bkNvbmZpZy5tb2R1bGVzLmZpbHRlciAobSkgLT4gbS5uYW1lIGlzIG1vZHVsZUNvbmZpZy5uYW1lXHJcbiAgICBpZiBtYXRjaGVkTW9kdWxlcy5sZW5ndGggPiAwXHJcbiAgICAgIGZvciBtb2R1bGVFbnRyeSBpbiBtYXRjaGVkTW9kdWxlc1xyXG4gICAgICAgIF9fYXBwZW5kVG9Nb2R1bGUgbW9kdWxlRW50cnksIG1vZHVsZUNvbmZpZ1xyXG4gICAgICByZXR1cm5cclxuICBydW5Db25maWcubW9kdWxlcyA9IFtdIHVubGVzcyBBcnJheS5pc0FycmF5KHJ1bkNvbmZpZy5tb2R1bGVzKVxyXG4gIG1vZHVsZUVudHJ5ID0ge25hbWU6IG1vZHVsZUNvbmZpZy5uYW1lLCBjcmVhdGU6IHRydWUsIGluY2x1ZGU6IFtdfVxyXG4gIF9fYXBwZW5kVG9Nb2R1bGUgbW9kdWxlRW50cnksIG1vZHVsZUNvbmZpZ1xyXG4gIHJ1bkNvbmZpZy5tb2R1bGVzLnB1c2ggbW9kdWxlRW50cnlcclxuXHJcbl9fYXBwZW5kVG9Nb2R1bGUgPSAobW9kdWxlRW50cnksIG1vZHVsZUNvbmZpZykgLT5cclxuICBtb2R1bGVFbnRyeS5pbmNsdWRlID0gW10gdW5sZXNzIEFycmF5LmlzQXJyYXkobW9kdWxlRW50cnkuaW5jbHVkZSlcclxuICBpZiBtb2R1bGVDb25maWcucGF0aEFsaWFzP1xyXG4gICAgbW9kdWxlRW50cnkub3ZlcnJpZGUgPSB7fSB1bmxlc3MgbW9kdWxlRW50cnkub3ZlcnJpZGU/XHJcbiAgICBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRocyA9IHt9IHVubGVzcyBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRocz9cclxuICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMuZm9yRWFjaCAoZmlsZSkgLT5cclxuICAgICAgYW1kRmlsZSA9IF9fZ2V0RmlsZUFNRCBmaWxlXHJcbiAgICAgIGFsaWFzID0gYW1kRmlsZS5yZXBsYWNlIG1vZHVsZUNvbmZpZy5iYXNlVXJsLCBtb2R1bGVDb25maWcucGF0aEFsaWFzXHJcbiAgICAgIG1vZHVsZUVudHJ5LmluY2x1ZGUucHVzaChhbGlhcykgaWYgbW9kdWxlQ29uZmlnLmluY2x1ZGVBbGlhc2VkRmlsZXNcclxuICAgICAgdW5sZXNzIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzW2FsaWFzXT9cclxuICAgICAgICBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRoc1thbGlhc10gPSBhbWRGaWxlXHJcbiAgZWxzZVxyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5mb3JFYWNoIChmaWxlKSAtPlxyXG4gICAgICBtb2R1bGVFbnRyeS5pbmNsdWRlLnB1c2ggX19nZXRGaWxlQU1EKGZpbGUpXHJcblxyXG5fX2RldGVybWluZVBhdGggPSAodGhlUGF0aCwgcmVsYXRpdmVUbykgLT5cclxuICByZXR1cm4gdGhlUGF0aCBpZiB3aW5kb3dzRHJpdmUudGVzdCB0aGVQYXRoXHJcbiAgcmV0dXJuIHRoZVBhdGggaWYgdGhlUGF0aC5pbmRleE9mKFwiL1wiKSBpcyAwXHJcbiAgcGF0aC5qb2luIHJlbGF0aXZlVG8sIHRoZVBhdGhcclxuXHJcbl9fZ2V0RmlsZUFNRCA9IChmaWxlKSAtPlxyXG4gICMgVXNlIGFsaWFzIGlmIHBhdGggaGFzIGJlZW4gYWxpYXNlZFxyXG4gIGZpbGVBTUQgPSByZXF1aXJlTW9kdWxlLm1hbmlwdWxhdGVQYXRoV2l0aEFsaWFzIGZpbGVcclxuICAjIEdldCByZWxhdGl2ZSB1cmwvYW1kIHBhdGggaWYgbm90IGFsaWFzZWRcclxuICBmaWxlQU1EID0gcGF0aC5yZWxhdGl2ZShjb21waWxlZEphdmFzY3JpcHREaXIsIGZpbGUpIGlmIGZpbGVBTUQgaXMgZmlsZVxyXG4gIHJldHVybiBmaWxlQU1ELnNwbGl0KHBhdGguc2VwKS5qb2luKFwiL1wiKS5yZXBsYWNlKHBhdGguZXh0bmFtZShmaWxlKSwgJycpXHJcblxyXG5fX25vcm1hbGl6ZSA9IChmaWxlcGF0aCkgLT4gXHJcbiAgcmV0dXJuIGZpbGVwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKSBpZiB3aW4zMlxyXG4gIHJldHVybiBmaWxlcGF0aFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG4gIHJlZ2lzdHJhdGlvbjogcmVnaXN0cmF0aW9uXHJcbiAgZGVmYXVsdHM6ICAgICBjb25maWcuZGVmYXVsdHNcclxuICBwbGFjZWhvbGRlcjogIGNvbmZpZy5wbGFjZWhvbGRlclxyXG4gIHZhbGlkYXRlOiAgICAgY29uZmlnLnZhbGlkYXRlIl19
