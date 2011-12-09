
# Consolidate.js

  Template engine consolidation library.

## Installation

    $ npm install consolidate

## Supported template engines

  - eco
  - ejs
  - haml
  - jade
  - jazz
  - jqtpl
  - liquor
  - swig
  - whiskers

__NOTE__: you must still install the engines you wish to use, add them to your package.json dependencies.

## API

  All templates supported by this library may be rendered using the signature `(path[, locals], callback)` as shown here:

```js
var cons = require('consolidate');
cons.swig('views/page.html', { user: 'tobi' }, function(err, html){
  if (err) throw err;
  console.log(html);
});
```

  Or without options / local variables:

```js
var cons = require('consolidate');
cons.swig('views/page.html', function(err, html){
  if (err) throw err;
  console.log(html);
});
```

  To dynamically pass the engine, simply use the subscript operator and a variable:

```js
var cons = require('consolidate')
  , name = 'swig';

cons[name]('views/page.html', { user: 'tobi' }, function(err, html){
  if (err) throw err;
  console.log(html);
});
```

## Caching

 To enable caching simply pass `{ cache: true }`. Engines _may_ use this option to cache things reading the file contents, compiled `Function`s etc. Engines which do _not_ support this may simply ignore it. All engines that consolidate.js implements I/O for will cache the file contents, ideal for production environments.

```js
var cons = require('consolidate');
cons.swig('views/page.html', { user: 'tobi' }, function(err, html){
  if (err) throw err;
  console.log(html);
});
```

## Running tests

  Install dev deps:
  
    $ npm install -d

  Run the tests:

    $ make test

## License 

(The MIT License)

Copyright (c) 2011 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
