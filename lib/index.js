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
      return moduleEntry.override.paths[alias] = amdFile;
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

//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxsaWJcXGluZGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQzpcXHByb2plY3RzXFxtaW1vc2EtbW9kdWxlc1xcbWltb3NhLXJlcXVpcmVidWlsZC1hdXRvbW9kdWxlXFxzcmNcXGluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFdBQUE7Q0FBQSxHQUFBLHFUQUFBO0dBQUEsZUFBQTs7QUFFQSxDQUZBLEVBRU8sQ0FBUCxFQUFPLENBQUE7O0FBRVAsQ0FKQSxDQUlBLENBQUssQ0FBQSxHQUFBOztBQUVMLENBTkEsRUFNUyxHQUFULENBQVMsQ0FBQTs7QUFFVCxDQVJBLEVBUVksSUFBQSxFQUFaLEVBQVk7O0FBRVosQ0FWQSxFQVVTLEdBQVQsQ0FBUyxHQUFBOztBQUVULENBWkEsRUFZZ0IsQ0FaaEIsU0FZQTs7QUFFQSxDQWRBLEVBY2UsU0FBZixFQWRBOztBQWdCQSxDQWhCQSxFQWdCUSxFQUFSLEVBQWUsQ0FBUDs7QUFFUixDQWxCQSxFQWtCbUIsQ0FBSCxDQUFBLFFBQWhCOztBQUVBLENBcEJBLENBQUEsQ0FvQndCLGtCQUF4Qjs7QUFFQSxDQXRCQSxDQXNCOEIsQ0FBZixLQUFBLENBQUMsR0FBaEI7Q0FDRSxLQUFBO0NBQUEsQ0FBQSxDQUF3QixFQUFrQixPQUFOLFNBQXBDO0NBQ0EsQ0FBQSxFQUFHLE1BQUgsRUFBZTtDQUNiLEVBQWdCLENBQWhCLFFBQTRCLENBQTVCLEdBQThDO0NBQTlDLEVBQ0ksQ0FBSixNQURBLEVBQ2dCO0NBRGhCLENBRWdCLEVBQWhCLENBQVMsR0FBVCxFQUEwRSxHQUFBLEdBQTFFLENBQUE7Q0FDUyxDQUEyQixNQUFwQyxHQUFBLEtBQUEsQ0FBQTtJQU5XO0NBQUE7O0FBVWYsQ0FoQ0EsQ0FnQ21DLENBQWYsQ0FBQSxHQUFBLEVBQUMsR0FBRCxLQUFwQjtDQUNFLEtB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Q0FBK0IsQ0FBeEIsRUFBQSxFQUFBLENBQVEsR0FBUjtJQUFQO0NBQ0EsT0FBQSxDQUFPO0NBRks7O0FBSWQsQ0FwTEEsRUFxTEUsR0FESSxDQUFOO0NBQ0UsQ0FBQSxVQUFBO0NBQUEsQ0FDQSxJQUFvQixFQUFwQjtDQURBLENBRUEsSUFBb0IsS0FBcEI7Q0FGQSxDQUdBLElBQW9CLEVBQXBCO0NBeExGLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIlxyXG5cclxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXHJcblxyXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xyXG5cclxud3JlbmNoID0gcmVxdWlyZSBcIndyZW5jaFwiXHJcblxyXG5taW5pbWF0Y2ggPSByZXF1aXJlIFwibWluaW1hdGNoXCJcclxuXHJcbmNvbmZpZyA9IHJlcXVpcmUgJy4vY29uZmlnJ1xyXG5cclxucmVxdWlyZU1vZHVsZSA9IG51bGxcclxuXHJcbndpbmRvd3NEcml2ZSA9IC9eW0EtWmEtel06XFxcXC9cclxuXHJcbndpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXHJcblxyXG5wYXRoU2VwYXJhdG9yID0gaWYgd2luMzIgdGhlbiAnXFxcXCcgZWxzZSAnLydcclxuXHJcbmNvbXBpbGVkSmF2YXNjcmlwdERpciA9IFwiXCJcclxuXHJcbnJlZ2lzdHJhdGlvbiA9IChtaW1vc2FDb25maWcsIHJlZ2lzdGVyKSAtPlxyXG4gIGNvbXBpbGVkSmF2YXNjcmlwdERpciA9IG1pbW9zYUNvbmZpZy53YXRjaC5jb21waWxlZEphdmFzY3JpcHREaXJcclxuICBpZiBtaW1vc2FDb25maWcuaXNPcHRpbWl6ZVxyXG4gICAgcmVxdWlyZU1vZHVsZSA9IG1pbW9zYUNvbmZpZy5pbnN0YWxsZWRNb2R1bGVzW1wibWltb3NhLXJlcXVpcmVcIl1cclxuICAgIGUgPSBtaW1vc2FDb25maWcuZXh0ZW5zaW9uc1xyXG4gICAgcmVnaXN0ZXIgWydhZGQnLCd1cGRhdGUnLCdyZW1vdmUnXSwgJ2JlZm9yZU9wdGltaXplJywgX2J1aWxkQXV0b01vZHVsZXMsIFtlLmphdmFzY3JpcHQuLi4sIGUudGVtcGxhdGUuLi5dXHJcbiAgICByZWdpc3RlciBbJ3Bvc3RCdWlsZCddLCAgICAgICAgICAgICAnYmVmb3JlT3B0aW1pemUnLCBfYnVpbGRBdXRvTW9kdWxlc1xyXG4gICNlbHNlXHJcbiAgIyAgIFJlZ2lzdGVyIHdhdGNoIHN0dWZmXHJcblxyXG5fYnVpbGRBdXRvTW9kdWxlcyA9IChtaW1vc2FDb25maWcsIG9wdGlvbnMsIG5leHQpIC0+XHJcbiAgaGFzUnVuQ29uZmlncyA9IG9wdGlvbnMucnVuQ29uZmlncz8ubGVuZ3RoID4gMFxyXG4gIHJldHVybiBuZXh0KCkgdW5sZXNzIGhhc1J1bkNvbmZpZ3NcclxuXHJcbiAganNTb3VyY2VEaXIgPSBcIiN7bWltb3NhQ29uZmlnLndhdGNoLnNvdXJjZURpcn0je3BhdGhTZXBhcmF0b3J9I3ttaW1vc2FDb25maWcud2F0Y2guamF2YXNjcmlwdERpcn1cIlxyXG4gIG1vZHVsZU5hbWVzID0gX19nZXREaXJzKGpzU291cmNlRGlyKVxyXG4gIG1vZHVsZXMgPSBtb2R1bGVOYW1lcy5tYXAgKGRpck5hbWUpIC0+XHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwiI3tkaXJOYW1lfS8je2Rpck5hbWV9LWJ1aWx0XCJcclxuICAgICAgYmFzZVVybDogZGlyTmFtZVxyXG4gICAgICBpbmNsdWRlOiBbXVxyXG4gICAgICBwYXR0ZXJuczogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUucGF0dGVybnNcclxuICAgICAgZXhjbHVkZTogbWltb3NhQ29uZmlnLnJlcXVpcmVCdWlsZEF1dG9Nb2R1bGUuZXhjbHVkZVxyXG4gICAgICBleGNsdWRlUmVnZXg6IG1pbW9zYUNvbmZpZy5yZXF1aXJlQnVpbGRBdXRvTW9kdWxlLmV4Y2x1ZGVSZWdleFxyXG4gICAgfVxyXG5cclxuICBmb3IgdXNlckNvbmZpZyBpbiBtaW1vc2FDb25maWcucmVxdWlyZUJ1aWxkQXV0b01vZHVsZS5tb2R1bGVzXHJcbiAgICBfX2FwcGx5VXNlckNvbmZpZ3ModXNlckNvbmZpZywgbW9kdWxlcylcclxuICBcclxuICBmb3IgbW9kdWxlQ29uZmlnIGluIG1vZHVsZXNcclxuICAgIG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMgPSBfX2dldEluY2x1ZGVGaWxlcyhtb2R1bGVDb25maWcpXHJcbiAgICBpZiBtb2R1bGVDb25maWcudmVyc2lvbk9mPyBhbmQgbm90IG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICAgIF9fc2V0UGF0aEFsaWFzKG1vZHVsZUNvbmZpZywgbW9kdWxlcylcclxuXHJcbiAgIyBBZnRlciBidWlsZGluZyBpbmNsdWRlRmlsZXMgZm9yIGFsbCBtb2R1bGVzLCB3ZSBjYW4gYWRkXHJcbiAgIyBkZXBlbmRlbmNpZXMgb2YgaW5jbHVkZWQgbW9kdWxlcyB0byB0aGUgbW9kdWxlQ29uZmlnXHJcbiAgZm9yIG1vZHVsZUNvbmZpZyBpbiBtb2R1bGVzXHJcbiAgICBfX2FkZE90aGVyTW9kdWxlSW5jbHVkZXMgbW9kdWxlQ29uZmlnLCBtb2R1bGVzXHJcblxyXG4gICAgZm9yIHJ1bkNvbmZpZyBpbiBvcHRpb25zLnJ1bkNvbmZpZ3NcclxuICAgICAgX19hcHBseVRvQ29uZmlnIHJ1bkNvbmZpZywgbW9kdWxlQ29uZmlnXHJcblxyXG4gIG5leHQoKVxyXG5cclxuX19nZXREaXJzID0gKHJvb3REaXIpIC0+XHJcbiAgZnMucmVhZGRpclN5bmMocm9vdERpcikuZmlsdGVyIChmaWxlKSAtPlxyXG4gICAgZmlsZVswXSBpc250ICcuJyBhbmQgZnMuc3RhdFN5bmMoXCIje3Jvb3REaXJ9I3twYXRoU2VwYXJhdG9yfSN7ZmlsZX1cIikuaXNEaXJlY3RvcnkoKVxyXG5cclxuX19hcHBseVVzZXJDb25maWdzID0gKHVzZXJDb25maWcsIG1vZHVsZXMpIC0+XHJcbiAgbWF0Y2hlZE1vZHVsZXMgPSBtb2R1bGVzLmZpbHRlciAobSkgLT5cclxuICAgIG0ubmFtZSBpcyB1c2VyQ29uZmlnLm5hbWUgb3IgbS5iYXNlVXJsIGlzIHVzZXJDb25maWcuYmFzZVVybFxyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCA+IDFcclxuICAgICMgc2hvdWxkIGxvZyB0aGlzIHVzaW5nIG1pbW9zYSBsb2dnZXJcclxuICAgIGNvbnNvbGUubG9nIFwiU2hvdWxkIGhhdmUgZm91bmQgYXQgbW9zdCBvbmUgbWF0Y2hcIlxyXG4gICAgY29uc29sZS5sb2cgbWF0Y2hlZE1vZHVsZXNcclxuICAgIHJldHVyblxyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpcyAxXHJcbiAgICBtYXRjaCA9IG1hdGNoZWRNb2R1bGVzWzBdXHJcbiAgICBtYXRjaC5uYW1lID0gdXNlckNvbmZpZy5uYW1lXHJcbiAgICBpZiB1c2VyQ29uZmlnLmJhc2VVcmw/IGFuZCB1c2VyQ29uZmlnLmJhc2VVcmwgaXNudCBcIlwiXHJcbiAgICAgIG1hdGNoLmJhc2VVcmwgPSB1c2VyQ29uZmlnLmJhc2VVcmxcclxuICAgIGlmIHVzZXJDb25maWcuaW5jbHVkZT8ubGVuZ3RoID4gMFxyXG4gICAgICBtYXRjaC5pbmNsdWRlID0gdXNlckNvbmZpZy5pbmNsdWRlXHJcbiAgICBtYXRjaC5wYXR0ZXJucyA9IHVzZXJDb25maWcucGF0dGVybnNcclxuICAgIG1hdGNoLmV4Y2x1ZGUgPSB1c2VyQ29uZmlnLmV4Y2x1ZGVcclxuICAgIG1hdGNoLmV4Y2x1ZGVSZWdleCA9IHVzZXJDb25maWcuZXhjbHVkZVJlZ2V4XHJcbiAgICBpZiB1c2VyQ29uZmlnLnZlcnNpb25PZj8gYW5kIHVzZXJDb25maWcudmVyc2lvbk9mIGlzbnQgXCJcIlxyXG4gICAgICBtYXRjaC52ZXJzaW9uT2YgPSB1c2VyQ29uZmlnLnZlcnNpb25PZlxyXG4gICAgbWF0Y2guaW5jbHVkZUFsaWFzZWRGaWxlcyA9IHVzZXJDb25maWcuaW5jbHVkZUFsaWFzZWRGaWxlc1xyXG4gIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCBpcyAwXHJcbiAgICBtb2R1bGVzLnB1c2ggdXNlckNvbmZpZ1xyXG5cclxuX19nZXRJbmNsdWRlRmlsZXMgPSAobW9kdWxlQ29uZmlnKSAtPlxyXG4gIGluY2x1ZGVGb2xkZXIgPSBfX2RldGVybWluZVBhdGggbW9kdWxlQ29uZmlnLmJhc2VVcmwsIGNvbXBpbGVkSmF2YXNjcmlwdERpclxyXG4gIGluY2x1ZGVGaWxlcyA9IHdyZW5jaC5yZWFkZGlyU3luY1JlY3Vyc2l2ZSBpbmNsdWRlRm9sZGVyXHJcbiAgaW5jbHVkZUZpbGVzID0gaW5jbHVkZUZpbGVzLm1hcCAoZmlsZSkgLT5cclxuICAgIHBhdGguam9pbiBpbmNsdWRlRm9sZGVyLCBmaWxlXHJcbiAgLmZpbHRlciAoZmlsZSkgLT5cclxuICAgIGZzLnN0YXRTeW5jKGZpbGUpLmlzRmlsZSgpIGFuZFxyXG4gICAgbW9kdWxlQ29uZmlnLmV4Y2x1ZGUuaW5kZXhPZihmaWxlKSBpcyAtMSBhbmRcclxuICAgIG5vdCAobW9kdWxlQ29uZmlnLmV4Y2x1ZGVSZWdleCBhbmQgZmlsZS5tYXRjaChtb2R1bGVDb25maWcuZXhjbHVkZVJlZ2V4KSlcclxuICAubWFwIF9fbm9ybWFsaXplXHJcbiAgIyBGaWx0ZXIgaW5jbHVkZUZpbGVzIGFnYWluc3QgaW5jbHVkZSBwYXR0ZXJuc1xyXG4gIGJhc2UgPSBfX25vcm1hbGl6ZShwYXRoLmpvaW4oaW5jbHVkZUZvbGRlciwgcGF0aFNlcGFyYXRvcikpXHJcbiAgbW9kdWxlQ29uZmlnLnBhdHRlcm5zLmZvckVhY2ggKHBhdHRlcm4pIC0+XHJcbiAgICBhYnNQYXR0ZXJuID0gX19ub3JtYWxpemUocGF0aC5yZXNvbHZlKGJhc2UsIHBhdHRlcm4pKVxyXG4gICAgaW5jbHVkZUZpbGVzID0gaW5jbHVkZUZpbGVzLmZpbHRlciAoZmlsZSkgLT5cclxuICAgICAgbWluaW1hdGNoIGZpbGUsIGFic1BhdHRlcm5cclxuICByZXR1cm4gaW5jbHVkZUZpbGVzXHJcblxyXG5fX3NldFBhdGhBbGlhcyA9IChtb2R1bGVDb25maWcsIG1vZHVsZXMpIC0+XHJcbiAgbWF0Y2hlZE1vZHVsZXMgPSBtb2R1bGVzLmZpbHRlciAobSkgLT5cclxuICAgIG1vZHVsZUNvbmZpZy52ZXJzaW9uT2YgaXMgbS5uYW1lIG9yIG1vZHVsZUNvbmZpZy52ZXJzaW9uT2YgaXMgbS5iYXNlVXJsXHJcbiAgaWYgbWF0Y2hlZE1vZHVsZXMubGVuZ3RoIGlzbnQgMVxyXG4gICAgY29uc29sZS5sb2cgXCJWZXJzaW9uIG9mIGRpZG4ndCBtYXRjaCBvciBtYXRjaGVkIG1vcmUgdGhhbiBvbmUgbW9kdWxlXCJcclxuICAgIHJldHVyblxyXG4gIG1hdGNoID0gbWF0Y2hlZE1vZHVsZXNbMF1cclxuICBpZiBtYXRjaC52ZXJzaW9uT2Y/XHJcbiAgICB1bmxlc3MgbWF0Y2gucGF0aEFsaWFzP1xyXG4gICAgICBfX3NldFBhdGhBbGlhcyBtYXRjaCwgbW9kdWxlc1xyXG4gICAgbW9kdWxlQ29uZmlnLnBhdGhBbGlhcyA9IG1hdGNoLnBhdGhBbGlhc1xyXG4gIGVsc2VcclxuICAgIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXMgPSBtYXRjaC5iYXNlVXJsXHJcbiAgbW9kdWxlQ29uZmlnLmluY2x1ZGUucHVzaCBtYXRjaC5uYW1lXHJcblxyXG5fX2FkZE90aGVyTW9kdWxlSW5jbHVkZXMgPSAobW9kdWxlQ29uZmlnLCBtb2R1bGVzKSAtPlxyXG4gIHJldHVybiB1bmxlc3MgbW9kdWxlQ29uZmlnLmluY2x1ZGU/Lmxlbmd0aCA+IDBcclxuICBmb3IgaW5jbHVkZSBpbiBtb2R1bGVDb25maWcuaW5jbHVkZSB3aGVuIGluY2x1ZGUgaXNudCBtb2R1bGVDb25maWcubmFtZSBhbmQgaW5jbHVkZSBpc250IG1vZHVsZUNvbmZpZy5iYXNlVXJsXHJcbiAgICBmb3IgbSBpbiBtb2R1bGVzXHJcbiAgICAgIGlmIGluY2x1ZGUgaXMgbS5uYW1lIG9yIGluY2x1ZGUgaXMgbS5iYXNlVXJsXHJcbiAgICAgICAgaWYgbS5pbmNsdWRlPy5sZW5ndGggPiAwXHJcbiAgICAgICAgICBfX2FkZE90aGVyTW9kdWxlSW5jbHVkZXMgbSwgbW9kdWxlc1xyXG4gICAgICAgIGlmIG0uaW5jbHVkZUZpbGVzP1xyXG4gICAgICAgICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcyA9IG1vZHVsZUNvbmZpZy5pbmNsdWRlRmlsZXMuY29uY2F0IG0uaW5jbHVkZUZpbGVzXHJcbiAgbW9kdWxlQ29uZmlnLmluY2x1ZGUgPSBudWxsXHJcblxyXG5fX2FwcGx5VG9Db25maWcgPSAocnVuQ29uZmlnLCBtb2R1bGVDb25maWcpIC0+XHJcbiAgaWYgcnVuQ29uZmlnLm1vZHVsZXM/Lmxlbmd0aCA+IDBcclxuICAgIG1hdGNoZWRNb2R1bGVzID0gcnVuQ29uZmlnLm1vZHVsZXMuZmlsdGVyIChtKSAtPiBtLm5hbWUgaXMgbW9kdWxlQ29uZmlnLm5hbWVcclxuICAgIGlmIG1hdGNoZWRNb2R1bGVzLmxlbmd0aCA+IDBcclxuICAgICAgZm9yIG1vZHVsZUVudHJ5IGluIG1hdGNoZWRNb2R1bGVzXHJcbiAgICAgICAgX19hcHBlbmRUb01vZHVsZSBtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnXHJcbiAgICAgIHJldHVyblxyXG4gIHJ1bkNvbmZpZy5tb2R1bGVzID0gW10gdW5sZXNzIEFycmF5LmlzQXJyYXkocnVuQ29uZmlnLm1vZHVsZXMpXHJcbiAgbW9kdWxlRW50cnkgPSB7bmFtZTogbW9kdWxlQ29uZmlnLm5hbWUsIGNyZWF0ZTogdHJ1ZSwgaW5jbHVkZTogW119XHJcbiAgX19hcHBlbmRUb01vZHVsZSBtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnXHJcbiAgcnVuQ29uZmlnLm1vZHVsZXMucHVzaCBtb2R1bGVFbnRyeVxyXG5cclxuX19hcHBlbmRUb01vZHVsZSA9IChtb2R1bGVFbnRyeSwgbW9kdWxlQ29uZmlnKSAtPlxyXG4gIG1vZHVsZUVudHJ5LmluY2x1ZGUgPSBbXSB1bmxlc3MgQXJyYXkuaXNBcnJheShtb2R1bGVFbnRyeS5pbmNsdWRlKVxyXG4gIGlmIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXM/XHJcbiAgICBtb2R1bGVFbnRyeS5vdmVycmlkZSA9IHt9IHVubGVzcyBtb2R1bGVFbnRyeS5vdmVycmlkZT9cclxuICAgIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzID0ge30gdW5sZXNzIG1vZHVsZUVudHJ5Lm92ZXJyaWRlLnBhdGhzP1xyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5mb3JFYWNoIChmaWxlKSAtPlxyXG4gICAgICBhbWRGaWxlID0gX19nZXRGaWxlQU1EIGZpbGVcclxuICAgICAgYWxpYXMgPSBhbWRGaWxlLnJlcGxhY2UgbW9kdWxlQ29uZmlnLmJhc2VVcmwsIG1vZHVsZUNvbmZpZy5wYXRoQWxpYXNcclxuICAgICAgbW9kdWxlRW50cnkuaW5jbHVkZS5wdXNoKGFsaWFzKSBpZiBtb2R1bGVDb25maWcuaW5jbHVkZUFsaWFzZWRGaWxlc1xyXG4gICAgICBtb2R1bGVFbnRyeS5vdmVycmlkZS5wYXRoc1thbGlhc10gPSBhbWRGaWxlXHJcbiAgZWxzZVxyXG4gICAgbW9kdWxlQ29uZmlnLmluY2x1ZGVGaWxlcy5mb3JFYWNoIChmaWxlKSAtPlxyXG4gICAgICBtb2R1bGVFbnRyeS5pbmNsdWRlLnB1c2ggX19nZXRGaWxlQU1EKGZpbGUpXHJcblxyXG5fX2RldGVybWluZVBhdGggPSAodGhlUGF0aCwgcmVsYXRpdmVUbykgLT5cclxuICByZXR1cm4gdGhlUGF0aCBpZiB3aW5kb3dzRHJpdmUudGVzdCB0aGVQYXRoXHJcbiAgcmV0dXJuIHRoZVBhdGggaWYgdGhlUGF0aC5pbmRleE9mKFwiL1wiKSBpcyAwXHJcbiAgcGF0aC5qb2luIHJlbGF0aXZlVG8sIHRoZVBhdGhcclxuXHJcbl9fZ2V0RmlsZUFNRCA9IChmaWxlKSAtPlxyXG4gICMgVXNlIGFsaWFzIGlmIHBhdGggaGFzIGJlZW4gYWxpYXNlZFxyXG4gIGZpbGVBTUQgPSByZXF1aXJlTW9kdWxlLm1hbmlwdWxhdGVQYXRoV2l0aEFsaWFzIGZpbGVcclxuICAjIEdldCByZWxhdGl2ZSB1cmwvYW1kIHBhdGggaWYgbm90IGFsaWFzZWRcclxuICBmaWxlQU1EID0gcGF0aC5yZWxhdGl2ZShjb21waWxlZEphdmFzY3JpcHREaXIsIGZpbGUpIGlmIGZpbGVBTUQgaXMgZmlsZVxyXG4gIHJldHVybiBmaWxlQU1ELnNwbGl0KHBhdGguc2VwKS5qb2luKFwiL1wiKS5yZXBsYWNlKHBhdGguZXh0bmFtZShmaWxlKSwgJycpXHJcblxyXG5fX25vcm1hbGl6ZSA9IChmaWxlcGF0aCkgLT4gXHJcbiAgcmV0dXJuIGZpbGVwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKSBpZiB3aW4zMlxyXG4gIHJldHVybiBmaWxlcGF0aFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG4gIHJlZ2lzdHJhdGlvbjogcmVnaXN0cmF0aW9uXHJcbiAgZGVmYXVsdHM6ICAgICBjb25maWcuZGVmYXVsdHNcclxuICBwbGFjZWhvbGRlcjogIGNvbmZpZy5wbGFjZWhvbGRlclxyXG4gIHZhbGlkYXRlOiAgICAgY29uZmlnLnZhbGlkYXRlIl19
