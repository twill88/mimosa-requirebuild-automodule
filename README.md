mimosa-requirebuild-automodule
===========

This is a Mimosa module. The goal is to streamline the process of building a site with multiple minimized and optimized r.js modules. This is useful for larger sites where you may have some primary application code, and additional assets that can be loaded after the application has been started.

More detailed documentation is needed (coming soon), but here is a quick overview.

By default (without any configuration changes), this module augments your r.js config (in the mimosa config) to build an optimized module for each directory directly under your source javascript directory. It does this by searching for any javascript assets and adding them to individual module configs, as well as adding entries for any html assets it finds (aliased to be loaded using the require text plugin).

There are a number of things that you can do by customizing the config a bit. The documentation (and some examples) for these features are coming soon. For now, here is a quick overview:

- Specify different patters for matching files for inclusion (defaults to match .js files)
- Specify exclude strings or regexs to exclude files
- Specify modules to not be built into optimized files
- Specify plugin configuration for files to be loaded using require plugins (by default is configured to use the text plugin for html files)
- Specify that a given module should include all the assets of another module
- Specify that a given module is actually a version of another module (see description below), and should include the other modules assets, but all of its require statements should be alliased to match the original module

The version of feature, is the primary goal of this module. The other features were necessary to support this goal cleanly. This arose from the need to support multiple versions of the same site. Specifically, this means different versions for different brands, and also for different device types (mobile vs desktop). The feature allows you to specify that a given module builds on top of another module, overriding any matched resources. That is to say that if moduleB is a versionOf moduleA, it will include all of moduleA's resources as well as all of it's own resources, replacing those of moduleA where appropriate.

This is difficult to explain and comprehend from a text description, and an example of all these features is hopefully coming soon (as I get time).
