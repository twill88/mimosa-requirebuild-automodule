mimosa-requirebuild-module-include
===========

This is a Mimosa module. It builds off the goals of the [requirebuild-include](https://github.com/CraigCav/mimosa-requirebuild-include) module. The function of this module is to find dependencies that the optimizer may miss and include them in the `include` array for r.js modules. This module can either include dependencies in already defined r.js modules by matching module name, or it can create new modules for you.

This behaviour can be useful if you want to combine your more commonly used assets into one file, and some of the lesser used assets into another file that can be loaded after the initial page-load/app-start.

For more information regarding Mimosa, see http://mimosa.io

## Usage

Add `'requirebuild-module-include'` to your list of modules.  That's all!  Mimosa will install the module for you when you start up.

## Functionality

The `'requirebuild-module-include'` module configuration is a pointer to a directory of files to include, a list of patterns to match files for inclusion, a list of regexes or strings to prevent including certain files, and a list of modules in which to include the files. Each setting can be customized or overridden for each module. 

## Caution

If you are using a module that dynamically creates files in your compiled directory, you may need to add a regex or string to the exclude array to prevent those files from being included in your modules. 

By default, if you name your dynamic modules ending with "-built.js" they will be excluded if you don't override the default exclude array.

## Default Config

```
requireBuildModuleInclude:
  folder: ""
  patterns: []
  exclude: [/-built.js$/,/reload-client.js$/]
  modules: [{
    name: ""
    folder: ""
    patterns: []
    exclude: []
  }]
```

* `folder`: a string, a directory within the `watch.javascriptDir` that narrows down the search for files to include.  If left alone, `watch.javascriptDir` is used.
* `patterns`: an array of glob patterns, (ex: `"some/dynamically/loaded/folder/**/*.js"`) used to match files to include in the r.js config's modules 'include' array.  Ex: foo/*.js. All files in the watch.javascriptDir/foo folder will be pushed into the array and already present array entries will be left alone.
* `exclude`: a list of regexes or strings used to match files to prevent from being added to the include arrays by this plugin. By default this is an array of a few common mimosa files/patterns that should not be bundled in an r.js run.
* `modules`: an array of objects, specifies the modules in which to include the files. This can be used to include files in seperately define r.js modules, or to create new r.js modules.  

    -- `name`: a string, the name of the module in which to include the files. If the name matches that of a module in the r.js config, it will include the files in that module. If no matching module is found, a new module will be created and added to the r.js modules list.  
    -- `folder`: a string, a subdirectory of the javascriptDir used for this specific module. If not specified, uses the folder specified above.  
    -- `patterns`: an array of glob patterns, allows the use of a different array of patterns for this module. If not specified, uses the patterns specified above.  
    -- `exclude`: a list of regexes or strings, allows the use of different excludes for this module. If not specified, uses the exclude list specified above.
