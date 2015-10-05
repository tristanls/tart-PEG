/*

sample.js - building on the PEG ASCII grammar

The MIT License (MIT)

Copyright (c) 2015 Dale Schumacher

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var tart = require('tart-tracing');
var tracing = tart.tracing();
var sponsor = tracing.sponsor;

//var log = console.log;
var log = function () {};

var ns = require('../grammar.js').build(sponsor, log);

require('../reducePEG.js').transform(ns);

var simpleSource = ''
+ '\r\n# comment\n';
var commentSource = ''
+ 'Comment <- [#] (!EOL .)* EOL\r'
+ "EOL <- '\\n'\n" 
+ '     / "\\r" "\\n"?\r\n';
var exprSource = ''
+ 'Assign <- Name "=" Assign\n'
+ '        / Expr\n'
+ 'Name   <- [a-zA-Z]\n'
+ 'Expr   <- Term ([-+] Term)*\n'
+ 'Term   <- Factor ([/*] Factor)*\n'
+ 'Factor <- "(" Assign ")"\n'
+ '        / Name\n'
+ '        / [0-9]+\n';
//var fileSource = require('fs').readFileSync('grammar.peg', 'utf8');
var fileSource = require('fs').readFileSync('examples/humusSyntax.peg', 'utf8');
var input = {
    source: fileSource,
    offset: 0
};

var ok = sponsor(function okBeh(m) {
    log('OK:', JSON.stringify(m, null, '  '));
    process.stdout.write(
        require('../generate.js').text(m.value)
    );
});
var fail = sponsor(function failBeh(m) {
    console.log('FAIL:', JSON.stringify(m, null, '  '));
});

//var start = ns.lookup('_');
var start = ns.lookup('Grammar');
start({
    in: input,
    ok: ok,
    fail: fail
});

tracing.eventLoop({
/*
    log: function (effect) {
        console.log('DEBUG', effect);
    },
*/
    fail: function (e) {
        console.log('ERROR!', e);
    }
});
