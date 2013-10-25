"use strict"

path = require 'path'

fs = require 'fs'

wrench = require "wrench"

minimatch = require "minimatch"

config = require './config'

requireModule = null

windowsDrive = /^[A-Za-z]:\\/

win32 = process.platform is 'win32'

pathSeparator = if win32 then '\\' else '/'

registration = (mimosaConfig, register) ->
  if mimosaConfig.isOptimize
    requireModule = mimosaConfig.installedModules["mimosa-require"]
    e = mimosaConfig.extensions
    register ['add','update','remove'], 'beforeOptimize', _buildAutoModules, [e.javascript..., e.template...]
    register ['postBuild'],             'beforeOptimize', _buildAutoModules
  #else
  #   Register watch stuff

_buildAutoModules = (mimosaConfig, options, next) ->
  hasRunConfigs = options.runConfigs?.length > 0
  return next() unless hasRunConfigs

  # Build up the config by analyzing the file system


_appendFilesToInclude = (mimosaConfig, options, next) ->
  hasRunConfigs = options.runConfigs?.length > 0
  return next() unless hasRunConfigs

  hasModulesDefined = mimosaConfig.requireBuildModuleVersioned.modules?.length > 0
  return next() unless hasModulesDefined

  for moduleConfig in mimosaConfig.requireBuildModuleVersioned.modules
    __buildAliases moduleConfig, options, mimosaConfig.watch.compiledJavascriptDir
  
  next()

__buildAliases = (moduleConfig, options, baseUrl) ->
  paths = {}
  moduleConfig.versions.forEach (version) ->
    includeFolder = __determinePath version.folder, baseUrl
    versionFiles = wrench.readdirSyncRecursive includeFolder
    versionFiles = versionFiles.map (file) ->
      path.join includeFolder, file
    .filter (file) ->
      __filePreMatchFilter(moduleConfig, file)
    .map __normalize

    # Filter files against include patterns
    base = __normalize(path.join(includeFolder, pathSeparator))
    moduleConfig.include.forEach (pattern) ->
      absPattern = __normalize(path.resolve(base, pattern))
      versionFiles = versionFiles.filter (file) ->
        minimatch file, absPattern

    for file in versionFiles
      amdFile = __getFileAMD file, baseUrl
      alias = amdFile.replace version.folder, moduleConfig.baseUrl
      unless paths[alias]?
        paths[alias] = amdFile
  
  options.runConfigs.forEach (runConfig) ->
    if runConfig.modules?.length > 0
      matchedModules = runConfig.modules.filter (m) -> m.name is moduleConfig.name
      if matchedModules.length > 0
        for moduleEntry in matchedModules
          __appendToModule moduleEntry, paths, moduleConfig.includeInBuild
        return

    runConfig.modules = [] unless Array.isArray(runConfig.modules)
    moduleEntry = {name: moduleConfig.name, create: true, include: []}
    __appendToModule moduleEntry, paths, moduleConfig.includeInBuild
    runConfig.modules.push moduleEntry

__determinePath = (thePath, relativeTo) ->
  return thePath if windowsDrive.test thePath
  return thePath if thePath.indexOf("/") is 0
  path.join relativeTo, thePath

__filePreMatchFilter = (moduleConfig, file) ->
  fs.statSync(file).isFile() and
  moduleConfig.exclude.indexOf(file) is -1 and
  not (moduleConfig.excludeRegex and file.match(moduleConfig.excludeRegex))

__getFileAMD = (file, baseUrl) ->
  # Use alias if path has been aliased
  fileAMD = requireModule.manipulatePathWithAlias file
  # Get relative url/amd path if not aliased
  fileAMD = path.relative(baseUrl, file) if fileAMD is file
  return fileAMD.split(path.sep).join("/").replace(path.extname(file), '')

__appendToModule = (moduleEntry, paths, doInclude) ->
  console.log "-----------------------------"
  console.log doInclude
  console.log "+++++++++++++++++++++++++++++"
  moduleEntry.override = {} unless moduleEntry.override?
  moduleEntry.override.paths = {} unless moduleEntry.override.paths?
  moduleEntry.include = [] unless Array.isArray(moduleEntry.include)
  for key of paths
    #if key.indexOf("app/main") is -1
    moduleEntry.override.paths[key] = paths[key]
    moduleEntry.include.push(key) if doInclude

__normalize = (filepath) -> 
  return filepath.replace(/\\/g, '/') if win32
  return filepath

module.exports =
  registration: registration
  defaults:     config.defaults
  placeholder:  config.placeholder
  validate:     config.validate