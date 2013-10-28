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

compiledJavascriptDir = ""

registration = (mimosaConfig, register) ->
  compiledJavascriptDir = mimosaConfig.watch.compiledJavascriptDir
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

  jsSourceDir = "#{mimosaConfig.watch.sourceDir}#{pathSeparator}#{mimosaConfig.watch.javascriptDir}"
  moduleNames = __getDirs(jsSourceDir)
  modules = moduleNames.map (dirName) ->
    {
      name: "#{dirName}/#{dirName}-built"
      baseUrl: dirName
      include: []
      patterns: mimosaConfig.requireBuildAutoModule.patterns
      exclude: mimosaConfig.requireBuildAutoModule.exclude
      excludeRegex: mimosaConfig.requireBuildAutoModule.excludeRegex
    }

  for userConfig in mimosaConfig.requireBuildAutoModule.modules
    __applyUserConfigs(userConfig, modules)
  
  for moduleConfig in modules
    moduleConfig.includeFiles = __getIncludeFiles(moduleConfig)
    if moduleConfig.versionOf? and not moduleConfig.pathAlias?
      __setPathAlias(moduleConfig, modules)

  # After building includeFiles for all modules, we can add
  # dependencies of included modules to the moduleConfig
  for moduleConfig in modules
    __addOtherModuleIncludes moduleConfig, modules

    for runConfig in options.runConfigs
      __applyToConfig runConfig, moduleConfig

  next()

__getDirs = (rootDir) ->
  fs.readdirSync(rootDir).filter (file) ->
    file[0] isnt '.' and fs.statSync("#{rootDir}#{pathSeparator}#{file}").isDirectory()

__applyUserConfigs = (userConfig, modules) ->
  matchedModules = modules.filter (m) ->
    m.name is userConfig.name or m.baseUrl is userConfig.baseUrl
  if matchedModules.length > 1
    # should log this using mimosa logger
    console.log "Should have found at most one match"
    console.log matchedModules
    return
  if matchedModules.length is 1
    match = matchedModules[0]
    match.name = userConfig.name
    if userConfig.baseUrl? and userConfig.baseUrl isnt ""
      match.baseUrl = userConfig.baseUrl
    if userConfig.include?.length > 0
      match.include = userConfig.include
    match.patterns = userConfig.patterns
    match.exclude = userConfig.exclude
    match.excludeRegex = userConfig.excludeRegex
    if userConfig.versionOf? and userConfig.versionOf isnt ""
      match.versionOf = userConfig.versionOf
    match.includeAliasedFiles = userConfig.includeAliasedFiles
  if matchedModules.length is 0
    modules.push userConfig

__getIncludeFiles = (moduleConfig) ->
  includeFolder = __determinePath moduleConfig.baseUrl, compiledJavascriptDir
  includeFiles = wrench.readdirSyncRecursive includeFolder
  includeFiles = includeFiles.map (file) ->
    path.join includeFolder, file
  .filter (file) ->
    fs.statSync(file).isFile() and
    moduleConfig.exclude.indexOf(file) is -1 and
    not (moduleConfig.excludeRegex and file.match(moduleConfig.excludeRegex))
  .map __normalize
  # Filter includeFiles against include patterns
  base = __normalize(path.join(includeFolder, pathSeparator))
  moduleConfig.patterns.forEach (pattern) ->
    absPattern = __normalize(path.resolve(base, pattern))
    includeFiles = includeFiles.filter (file) ->
      minimatch file, absPattern
  return includeFiles

__setPathAlias = (moduleConfig, modules) ->
  matchedModules = modules.filter (m) ->
    moduleConfig.versionOf is m.name or moduleConfig.versionOf is m.baseUrl
  if matchedModules.length isnt 1
    console.log "Version of didn't match or matched more than one module"
    return
  match = matchedModules[0]
  if match.versionOf?
    unless match.pathAlias?
      __setPathAlias match, modules
    moduleConfig.pathAlias = match.pathAlias
  else
    moduleConfig.pathAlias = match.baseUrl
  moduleConfig.include.push match.name

__addOtherModuleIncludes = (moduleConfig, modules) ->
  return unless moduleConfig.include?.length > 0
  for include in moduleConfig.include when include isnt moduleConfig.name and include isnt moduleConfig.baseUrl
    for m in modules
      if include is m.name or include is m.baseUrl
        if m.include?.length > 0
          __addOtherModuleIncludes m, modules
        if m.includeFiles?
          moduleConfig.includeFiles = moduleConfig.includeFiles.concat m.includeFiles
  moduleConfig.include = null

__applyToConfig = (runConfig, moduleConfig) ->
  if runConfig.modules?.length > 0
    matchedModules = runConfig.modules.filter (m) -> m.name is moduleConfig.name
    if matchedModules.length > 0
      for moduleEntry in matchedModules
        __appendToModule moduleEntry, moduleConfig
      return
  runConfig.modules = [] unless Array.isArray(runConfig.modules)
  moduleEntry = {name: moduleConfig.name, create: true, include: []}
  __appendToModule moduleEntry, moduleConfig
  runConfig.modules.push moduleEntry

__appendToModule = (moduleEntry, moduleConfig) ->
  moduleEntry.include = [] unless Array.isArray(moduleEntry.include)
  if moduleConfig.pathAlias?
    moduleEntry.override = {} unless moduleEntry.override?
    moduleEntry.override.paths = {} unless moduleEntry.override.paths?
    moduleConfig.includeFiles.forEach (file) ->
      amdFile = __getFileAMD file
      alias = amdFile.replace moduleConfig.baseUrl, moduleConfig.pathAlias
      moduleEntry.include.push(alias) if moduleConfig.includeAliasedFiles
      moduleEntry.override.paths[alias] = amdFile
  else
    moduleConfig.includeFiles.forEach (file) ->
      moduleEntry.include.push __getFileAMD(file)

__determinePath = (thePath, relativeTo) ->
  return thePath if windowsDrive.test thePath
  return thePath if thePath.indexOf("/") is 0
  path.join relativeTo, thePath

__getFileAMD = (file) ->
  # Use alias if path has been aliased
  fileAMD = requireModule.manipulatePathWithAlias file
  # Get relative url/amd path if not aliased
  fileAMD = path.relative(compiledJavascriptDir, file) if fileAMD is file
  return fileAMD.split(path.sep).join("/").replace(path.extname(file), '')

__normalize = (filepath) -> 
  return filepath.replace(/\\/g, '/') if win32
  return filepath

module.exports =
  registration: registration
  defaults:     config.defaults
  placeholder:  config.placeholder
  validate:     config.validate