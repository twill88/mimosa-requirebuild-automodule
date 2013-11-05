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

modules = null

detectedModuleCount = 0

injectedConfigStart = "//>>Start - Automodule injected config. GENERATED CODE, DONT CHANGE -\n"
injectedConfigEnd = "\n//>>End - Automodule injected config.\n"

registration = (mimosaConfig, register) ->
  compiledJavascriptDir = mimosaConfig.watch.compiledJavascriptDir
  e = mimosaConfig.extensions
  requireModule = mimosaConfig.installedModules["mimosa-require"]
  register ['postBuild'],             'beforeOptimize', _buildAutoModules
  if mimosaConfig.isOptimize
    register ['add','update','remove'], 'beforeOptimize', _buildAutoModules, [e.javascript..., e.template...]
  else
    register ['add','update','remove'], 'beforeOptimize', _buildPathsOverrideIfMatch

_buildPathsOverrideIfMatch = (mimosaConfig, options, next) ->
  jsSourceDir = "#{mimosaConfig.watch.sourceDir}#{pathSeparator}#{mimosaConfig.watch.javascriptDir}"
  dirList = __getDirs jsSourceDir
  # Unless there is a new module, we can continue using the original modules configs
  unless dirList.length is detectedModuleCount and modules?
    return _buildAutoModules mimosaConfig, options, next

  # Update the module matching this file, and any modules versioned off the matching module
  for moduleConfig in modules
    if moduleConfig.versionOf? and options.inputFile.indexOf(__determinePath(moduleConfig.baseUrl, jsSourceDir)) > -1
      __updateModuleVersionChain moduleConfig, mimosaConfig.requireBuildAutoModule.dontBuild
    
  next()

__updateModuleVersionChain = (moduleConfig, dontBuild) ->
  moduleConfig.includeFiles = __getIncludeFiles moduleConfig
  __addOtherModuleIncludes moduleConfig
  unless dontBuild.indexOf(moduleConfig.name) > -1 or dontBuild.indexOf(moduleConfig.baseUrl) > -1
    __updateDataMain moduleConfig
  for m in modules when m.versionOf? and (m.versionOf is moduleConfig.name or m.versionOf is moduleConfig.baseUrl)
    __updateModuleVersionChain(m, dontBuild)

_buildAutoModules = (mimosaConfig, options, next) ->
  if mimosaConfig.isOptimize?
    return next() unless options.runConfigs?.length > 0
  modules = __getModuleConfigs mimosaConfig
  for moduleConfig in modules
    moduleConfig.includeFiles = __getIncludeFiles moduleConfig
  
  # After building includeFiles for all modules, we can add
  # dependencies of included modules to the moduleConfig
  for moduleConfig in modules
    __addOtherModuleIncludes moduleConfig
    dontBuild = mimosaConfig.requireBuildAutoModule.dontBuild
    unless dontBuild.indexOf(moduleConfig.name) > -1 or dontBuild.indexOf(moduleConfig.baseUrl) > -1
      if mimosaConfig.isOptimize?
        __applyToConfig(runConfig, moduleConfig) for runConfig in options.runConfigs
      else
        __updateDataMain moduleConfig

  next()

__getModuleConfigs = (mimosaConfig, dirList) ->
  moduleNames = dirList
  unless dirList?
    moduleNames = __getDirs("#{mimosaConfig.watch.sourceDir}#{pathSeparator}#{mimosaConfig.watch.javascriptDir}")
  detectedModuleCount = moduleNames.length
  moduleConfigs = moduleNames.map (dirName) ->
    {
      name: "#{dirName}/#{dirName}-built"
      baseUrl: dirName
      include: []
      patterns: mimosaConfig.requireBuildAutoModule.patterns
      exclude: mimosaConfig.requireBuildAutoModule.exclude
      excludeRegex: mimosaConfig.requireBuildAutoModule.excludeRegex
      plugins: mimosaConfig.requireBuildAutoModule.plugins
      dataMain: "main.js"
    }
  for userConfig in mimosaConfig.requireBuildAutoModule.modules
    __applyUserConfigs(userConfig, moduleConfigs)
  return moduleConfigs

__getDirs = (rootDir) ->
  fs.readdirSync(rootDir).filter (file) ->
    file[0] isnt '.' and fs.statSync("#{rootDir}#{pathSeparator}#{file}").isDirectory()

__applyUserConfigs = (userConfig, modules) ->
  matchedModules = modules.filter (m) ->
    m.name is userConfig.name or m.baseUrl is userConfig.baseUrl
  if matchedModules.length > 1
    # should log this using mimosa logger
    console.log "Should have found at most one match"
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
    match.plugins = userConfig.plugins
    if userConfig.versionOf? and userConfig.versionOf isnt ""
      match.versionOf = userConfig.versionOf
    match.dataMain = userConfig.dataMain
    match.includeAliasedFiles = userConfig.includeAliasedFiles
  if matchedModules.length is 0
    modules.push userConfig

__getIncludeFiles = (moduleConfig) ->
  # Setup includeFiles array, and setup path alias for later use
  includeFiles = []
  moduleConfig.includeFolder = __determinePath moduleConfig.baseUrl, compiledJavascriptDir
  base = __normalize(path.join(moduleConfig.includeFolder, pathSeparator))
  files = __getModuleFiles(moduleConfig)

  # Filter out any files that should be loaded with a plugin, and add
  # them to the includeFiles array, prefixed with the plugin path
  files = __filterPluginFiles(moduleConfig, files, includeFiles, base) if moduleConfig.plugins?.length > 0
  
  # Filter remaining files against include patterns
  filteredIncludes = __filterIncludeFiles(files, moduleConfig.patterns, base)
  includeFiles = includeFiles.concat filteredIncludes

  if moduleConfig.versionOf? and not moduleConfig.pathAlias?
    __setPathAlias moduleConfig

  return includeFiles

__determinePath = (thePath, relativeTo) ->
  return thePath if windowsDrive.test thePath
  return thePath if thePath.indexOf("/") is 0
  path.join relativeTo, thePath

__getModuleFiles = (moduleConfig) ->
  files = wrench.readdirSyncRecursive moduleConfig.includeFolder
  files = files.map (file) ->
    path.join moduleConfig.includeFolder, file
  .filter (file) ->
    fs.statSync(file).isFile() and
    moduleConfig.exclude.indexOf(file) is -1 and
    not (moduleConfig.excludeRegex and file.match(moduleConfig.excludeRegex))
  .map __normalize
  return files

__filterPluginFiles = (moduleConfig, files, includeFiles, base) ->
  for pluginConfig in moduleConfig.plugins
    pluginConfig.patterns.forEach (pattern) ->
      absPattern = __normalize(path.resolve(base, pattern))
      # The filtered result will actually be the files that
      # don't match the plugin patterns
      files = files.filter (file) ->
        if minimatch file, absPattern
          includeFiles.push "#{pluginConfig.path}!#{file}"
          return false
        return true
  return files

__filterIncludeFiles = (files, patterns, base) ->
  result = []
  patterns.forEach (pattern) ->
    absPattern = __normalize(path.resolve(base, pattern))
    result.push(file) for file in files when minimatch(file, absPattern)
  return result

__setPathAlias = (moduleConfig) ->
  matchedModules = modules.filter (m) ->
    moduleConfig.versionOf is m.name or moduleConfig.versionOf is m.baseUrl
  if matchedModules.length isnt 1
    console.log "Version of didn't match or matched more than one module"
    return
  match = matchedModules[0]
  if match.versionOf?
    unless match.pathAlias?
      __setPathAlias match
    moduleConfig.pathAlias = match.pathAlias
    # This means that we have at least a three tier version of.
    # We need to keep a list of all baseUrls so we can correctly alias those files
    moduleConfig.versionBaseUrl = [] unless moduleConfig.versionBaseUrl?
    moduleConfig.versionBaseUrl.push match.baseUrl
  else
    moduleConfig.pathAlias = match.baseUrl
  moduleConfig.include.push match.name

__addOtherModuleIncludes = (moduleConfig) ->
  return unless moduleConfig.include?.length > 0
  for include in moduleConfig.include when include isnt moduleConfig.name and include isnt moduleConfig.baseUrl
    for m in modules
      if include is m.name or include is m.baseUrl
        if m.include?.length > 0
          __addOtherModuleIncludes(m)
        if m.includeFiles?
          moduleConfig.includeFiles = moduleConfig.includeFiles.concat m.includeFiles
  # Prevent adding duplicates
  moduleConfig.include = null

__updateDataMain = (moduleConfig) ->
  return unless moduleConfig.pathAlias? and moduleConfig.pathAlias isnt moduleConfig.baseUrl
  dataMain = __determinePath moduleConfig.dataMain, moduleConfig.includeFolder
  if fs.existsSync(dataMain) and fs.statSync(dataMain).isFile()
    data = fs.readFileSync dataMain, {encoding: 'utf8'}
    data = __removeInjectedConfig data
    injectedConfig = "require.config({paths:#{JSON.stringify(__getPathOverrides(moduleConfig))}})"
    fs.writeFileSync dataMain, "#{injectedConfigStart}#{injectedConfig}#{injectedConfigEnd}#{data}"
    return
  else
    rootDataMain = null
    for m in modules when m.baseUrl is moduleConfig.pathAlias
      rootDataMain = __determinePath m.dataMain, m.includeFolder
    if fs.existsSync(rootDataMain) and fs.statSync(rootDataMain).isFile()
      data = fs.readFileSync rootDataMain, {encoding:'utf8'}
      data = __removeInjectedConfig data
      injectedConfig = "require.config({paths:#{JSON.stringify(__getPathOverrides(moduleConfig))}})"
      fs.writeFileSync dataMain, "#{injectedConfigStart}#{injectedConfig}#{injectedConfigEnd}#{data}"
    else
      console.log "Couldn't find a main.js file to augment for module named: #{moduleConfig.name}"

__removeInjectedConfig = (data) ->
  j = data.indexOf(injectedConfigStart)
  k = data.indexOf(injectedConfigEnd)
  unless j is -1 or k is -1
    data = data.substring(0,j) + data.substring(k+injectedConfigEnd.length)
  return data

__getPathOverrides = (moduleConfig) ->
  pathOverrides = {}
  moduleConfig.includeFiles.forEach (file) ->
    pluginIndex = file.indexOf("!")
    if pluginIndex > -1
      amdFile = __getFileAMD(file.substring(pluginIndex+1)).replace(path.extname(file), '')
    else
      amdFile = __getFileAMD(file).replace(path.extname(file), '')
    alias = amdFile
    if amdFile.indexOf(moduleConfig.baseUrl) is 0
      alias = amdFile.replace moduleConfig.baseUrl, moduleConfig.pathAlias
    else
      if moduleConfig.versionBaseUrl?.length > 0
        for baseUrl in moduleConfig.versionBaseUrl when amdFile.indexOf(baseUrl) is 0
          alias = amdFile.replace baseUrl, moduleConfig.pathAlias
    unless pathOverrides[alias]?
      pathOverrides[alias] = amdFile
  return pathOverrides

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
      pluginIndex = file.indexOf("!")
      if pluginIndex > -1
        amdFile = __getPluginFileAMD file, pluginIndex
        pluginIndex = amdFile.indexOf("!")
        # Only alias the file, not the plugin
        filePart = amdFile.substring(pluginIndex+1)
        aliasedFile = filePart
        if filePart.indexOf(moduleConfig.baseUrl) is 0
          aliasedFile = filePart.replace moduleConfig.baseUrl, moduleConfig.pathAlias
        else
          if moduleConfig.versionBaseUrl?.length > 0
            for baseUrl in moduleConfig.versionBaseUrl when filePart.indexOf(baseUrl) is 0
              aliasedFile = filePart.replace baseUrl, moduleConfig.pathAlias
        alias = "#{amdFile.substring(0,pluginIndex)}!#{aliasedFile}"
        moduleEntry.include.push(alias) if moduleConfig.includeAliasedFiles
        aliasedFile = aliasedFile.replace(path.extname(file), '')
        unless moduleEntry.override.paths[aliasedFile]?
          moduleEntry.override.paths[aliasedFile] = filePart.replace(path.extname(file), '')
      else
        amdFile = __getFileAMD(file).replace(path.extname(file), '')
        alias = amdFile
        if amdFile.indexOf(moduleConfig.baseUrl) is 0
          alias = amdFile.replace moduleConfig.baseUrl, moduleConfig.pathAlias
        else
          if moduleConfig.versionBaseUrl?.length > 0
            for baseUrl in moduleConfig.versionBaseUrl when amdFile.indexOf(baseUrl) is 0
              alias = amdFile.replace baseUrl, moduleConfig.pathAlias
        moduleEntry.include.push(alias) if moduleConfig.includeAliasedFiles
        unless moduleEntry.override.paths[alias]?
          moduleEntry.override.paths[alias] = amdFile
  else
    moduleConfig.includeFiles.forEach (file) ->
      pluginIndex = file.indexOf("!")
      if pluginIndex > -1
        moduleEntry.include.push __getPluginFileAMD(file, pluginIndex)
      else
        moduleEntry.include.push __getFileAMD(file).replace(path.extname(file), '')

__getPluginFileAMD = (file, pluginIndex) ->
  pluginPath = __determinePath(file.substring(0, pluginIndex) + ".js", compiledJavascriptDir)
  # Use alias if the plugin has been aliased
  pluginAlias = requireModule.manipulatePathWithAlias pluginPath
  # If not aliased, get url/amd path
  if pluginAlias is pluginPath
    pluginAlias = path.relative(compiledJavascriptDir, pluginAlias).split(path.sep).join("/").replace(".js", '')
  fileAMD = __getFileAMD(file.substring(pluginIndex+1))
  return "#{pluginAlias}!#{fileAMD}"

__getFileAMD = (file) ->
  # Use alias if path has been aliased
  fileAMD = requireModule.manipulatePathWithAlias file
  # Get relative url/amd path if not aliased
  fileAMD = path.relative(compiledJavascriptDir, file) if fileAMD is file
  return fileAMD.split(path.sep).join("/")

__normalize = (filepath) -> 
  return filepath.replace(/\\/g, '/') if win32
  return filepath

module.exports =
  registration: registration
  defaults:     config.defaults
  placeholder:  config.placeholder
  validate:     config.validate