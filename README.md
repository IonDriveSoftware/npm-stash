# npm-stash

Cache compiled npm packages.

Instead of caching the package tars as npm does, npm-stash caches the folder that npm installs for each dependency. This means it can be used to cache compiled versions of dependencies and greatly speed up installs.

## Caveats

* 'Works on my machine'
* Untested
* Probably only works on unix-y setups, if those
* Ugly implementation
* You have been warned!

## Install

```js
npm install -g npm-stash
```

## Example

```js
stash install mongodb // fetch and compile as usual from npm (the result is stored in ~/.npm-stash)
stash install mongodb // grab and install compiled result from ~/.npm-stash
```
