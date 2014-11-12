#ngrequire

A utility to analyse angular dependencies



#Usage

##update(moduleSourceBase);

- moduleSourceBase: Glob-like file path array. Should contains all your angular modules, providers etc..

```javascript
return {
  success: ['successed file list'],
  skipped: ['skipped file list (due to caching)']
}
```

##getMeta(path);

- path: Get file meta for given path

```javascript
return {
  moduleName: 'Name of the angular module',
  loadedFiles: ['List of required file (if using commonjs way)'],
  injectedProviders: ['Provider list being injected'],
  dependencies: ['Module dependencies'],
  namedProviders: ['All provider names defeind in this module (factory, service etc)'],
  providerTypes: ['All provider types defined in this module']
}
```


