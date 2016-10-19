/*

test.js - test script

The MIT License (MIT)

Copyright (c) 2016 Dale Schumacher

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

var test = module.exports = {};

//var log = console.log;
var log = function () {};
var warn = console.log;

var tart = require('tart-tracing');
var PEG = require('../PEG.js');
var input = require('../input.js');

test['empty source returns empty array'] = function (test) {
    test.expect(4);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var humusTokens = require('../humus/humusTokens.js').build(sponsor);
    var source = input.fromString(sponsor, 
        ''
    );

    var start = sponsor(PEG.start(
        humusTokens.call('tokens'),
        sponsor(function okBeh(m) {
            log('Tokens OK:', JSON.stringify(m, null, '  '));
            var v = m.value;
            test.strictEqual('tokens', v.name);
            v = v.value;
            test.strictEqual(2, v.length);
            var tokens = v[0];
            test.strictEqual(0, tokens.length);
        }),
        sponsor(function failBeh(m) {
            warn('Tokens FAIL:', JSON.stringify(m, null, '  '));
            test.ok(false);
        })
    ));
    source(start);

    require('../fixture.js').testEventLoop(test, 3, tracing.eventLoop, log);
};

test['blank source returns empty array'] = function (test) {
    test.expect(4);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var humusTokens = require('../humus/humusTokens.js').build(sponsor/*, log*/);
//    require('../humus/reduceTokens.js').transform(humusTokens);  // add reduction transforms
    var source = input.fromString(sponsor, 
        '\r'
    );

    var start = sponsor(PEG.start(
        humusTokens.call('tokens'),
        sponsor(function okBeh(m) {
            log('Tokens OK:', JSON.stringify(m, null, '  '));
            var v = m.value;
            test.strictEqual('tokens', v.name);
            v = v.value;
            test.strictEqual(2, v.length);
            var tokens = v[0];
            test.strictEqual(0, tokens.length);
        }),
        sponsor(function failBeh(m) {
            warn('Tokens FAIL:', JSON.stringify(m, null, '  '));
            test.ok(false);
        })
    ));
    source(start);

    require('../fixture.js').testEventLoop(test, 3, tracing.eventLoop, log);
};

test['transformed simple source returns token array'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var humusTokens = require('../humus/humusTokens.js').build(sponsor/*, log*/);
    require('../humus/reduceTokens.js').transform(humusTokens);  // add reduction transforms
    var source = input.fromString(sponsor,
        'SEND (#Hello, "World", \'\\n\', ##, -16#2a) TO println\n'
    );

    var start = sponsor(PEG.start(
        humusTokens.call('tokens'),
        sponsor(function okBeh(m) {
            log('Tokens OK:', JSON.stringify(m, null, '  '));
            var tokens = m.value;
            test.strictEqual(14, tokens.length);
        }),
        sponsor(function failBeh(m) {
            warn('Tokens FAIL:', JSON.stringify(m, null, '  '));
            test.ok(false);
        })
    ));
    source(start);

    require('../fixture.js').asyncRepeat(3,
        function action() {
            return tracing.eventLoop({
//                count: 100,
//                log: function (effect) { console.log('DEBUG', effect); },
              fail: function (error) { console.log('FAIL!', error); }
            });
        },
        function callback(error, result) {
            log('asyncRepeat callback:', error, result);
            test.ok(!error && result);
            test.done();
        }
    );
};

/*
Tokens OK: {
  "start": {
    "pos": 0,
    "value": "S",
    "row": 0,
    "col": 0
  },
  "end": {},
  "value": [
    "SEND",
    "(",
    {
      "type": "symbol",
      "value": "Hello"
    },
    ",",
    {
      "type": "string",
      "value": "World"
    },
    ",",
    {
      "type": "char",
      "value": "\n"
    },
    ",",
    {
      "type": "symbol",
      "value": "#"
    },
    ",",
    {
      "type": "number",
      "sign": "-",
      "radix": 16,
      "digits": "2a",
      "value": -42
    },
    ")",
    "TO",
    {
      "type": "ident",
      "value": "println"
    }
  ]
}
*/

/*
<TOKENS>
"SEND"
"("
{"type":"symbol","value":"Hello"}
","
{"type":"string","value":"World"}
","
{"type":"char","value":"\n"}
","
{"type":"symbol","value":"#"}
","
{"type":"number","sign":"-","radix":16,"digits":"2a","value":-42}
")"
"TO"
{"type":"ident","value":"println"}
</TOKENS>
*/

var humusFixture = function humusFixture(test, sponsor, log) {
    log = log || function () {};
    var fixture = {
        humusTokens: require('../humus/humusTokens.js').build(sponsor/*, log*/),
        humusSyntax: require('../humus/humusSyntax.js').build(sponsor/*, log*/),
        humusCode: require('../humus/humusCode.js'),
        test: test,
        sponsor: sponsor,
        log: log
    };
    require('../humus/reduceTokens.js').transform(fixture.humusTokens);
    require('../humus/reduceSyntax.js').transform(fixture.humusSyntax);
    var tokenSource = fixture.tokenSource = function tokenSource(charSource, start) {
        start = start || 'token';
        var pattern = fixture.humusTokens.call(start);
        return input.fromPEG(sponsor, charSource, pattern);
    };
    var ok = fixture.ok = function ok(validate) {
        return sponsor(function okBeh(m) {
            log('Tokens OK:', JSON.stringify(m, null, '  '));
            validate(m);
        });
    };
    var fail = fixture.fail = sponsor(function failBeh(m) {
        warn('Tokens FAIL:', JSON.stringify(m, null, '  '));
        test.ok(false);
    });
//    log('humusFixture:', fixture);
    return fixture;
};

test['TRUE is a simple constant'] = function (test) {
    test.expect(3);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var hf = humusFixture(test, sponsor, log);

    var source = hf.tokenSource(input.fromString(sponsor,
        'TRUE'
    ));

    var start = sponsor(PEG.start(
        hf.humusSyntax.call('expr'),
        hf.ok(function validate(m) {
            var v = m.value;
            test.strictEqual('const', v.type);
            test.strictEqual(true, v.value);
        }),
        hf.fail
    ));
    source(start);

    require('../fixture.js').testEventLoop(test, 3, tracing.eventLoop, log);
};

test['SEND a variety of data types'] = function (test) {
    test.expect(4);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var hf = humusFixture(test, sponsor, log);

    var source = hf.tokenSource(input.fromString(sponsor,
        'SEND (#Hello, "World", \'\\n\', ##, -16#2a) TO println\n'
    ));

    var start = sponsor(PEG.start(
        hf.humusSyntax.call('stmt'),
        hf.ok(function validate(m) {
            var v = m.value;
            test.strictEqual('send', v.type);
            test.strictEqual('object', typeof v.msg);
            test.strictEqual('object', typeof v.to);
        }),
        hf.fail
    ));
    source(start);

    require('../fixture.js').testEventLoop(test, 3, tracing.eventLoop, log);
};

/*
CREATE sink WITH \_.[]
==> @{
  beh: create_stmt,
  ident: sink,
  expr: @{
    beh: abs_expr,
    ptrn: @{
      beh: any_ptrn
    },
    body: @{
      beh: block_expr,
      vars: <NIL>,
      stmt: @{
        beh: empty_stmt
      }
    }
  }
}
*/
test['CREATE sink WITH \\_.[]'] = function (test) {
    test.expect(12);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var hf = humusFixture(test, sponsor, log);

    var source = hf.tokenSource(input.fromString(sponsor,
        'CREATE sink WITH \\_.[]\n'
    ));

    var start = sponsor(PEG.start(
        hf.humusSyntax.call('stmt'),
        hf.ok(function validate(m) {
            var code = hf.humusCode.stmt(m);
            test.strictEqual('create_stmt', code.beh);
            test.strictEqual('sink', code.ident);
            test.strictEqual('object', typeof code.expr);
            var expr = code.expr;
            test.strictEqual('abs_expr', expr.beh);
            test.strictEqual('object', typeof expr.ptrn);
            test.strictEqual('object', typeof expr.body);
            var ptrn = expr.ptrn;
            test.strictEqual('any_ptrn', ptrn.beh);
            var body = expr.body;
            test.strictEqual('block_expr', body.beh);
            test.strictEqual(0, body.vars.length);
            test.strictEqual('object', typeof body.stmt);
            var stmt = body.stmt;
            test.strictEqual('empty_stmt', stmt.beh);
        }),
        hf.fail
    ));
    source(start);

    require('../fixture.js').testEventLoop(test, 3, tracing.eventLoop, log);
};

/*
LET empty_env = \_.?
==> @{
  beh: let_stmt,
  eqtn: @{
    beh: eqtn,
    left: @{
      beh: ident_ptrn,
      ident: empty_env
    },
    right: @{
      beh: value_ptrn,
      expr: @{
        beh: abs_expr,
        ptrn: @{
          beh: any_ptrn
        },
        body: @{
          beh: const_expr,
          value: <UNDEF>
        }
      }
    }
  }
}
*/

/*
(\x.x)([])
==> @{
  beh: expr_stmt,
  expr: @{
    beh: app_expr,
    abs: @{
      beh: abs_expr,
      ptrn: @{
        beh: ident_ptrn,
        ident: x
      },
      body: @{
        beh: ident_expr,
        ident: x
      }
    },
    arg: @{
      beh: block_expr,
      vars: <NIL>,
      stmt: @{
        beh: empty_stmt
      }
    }
  }
}
*/

/*
IF x = $y x ELSE y
==> @{
  beh: expr_stmt,
  expr: @{
    beh: if_expr,
    eqtn: @{
      beh: eqtn,
      left: @{
        beh: ident_ptrn,
        ident: x
      },
      right: @{
        beh: value_ptrn,
        expr: @{
          beh: ident_expr,
          ident: y
        }
      }
    },
    expr: @{
      beh: ident_expr,
      ident: x
    },
    next: @{
      beh: ident_expr,
      ident: y
    }
  }
}
*/

/*
IF () = NIL [] ELSE [ LET out = $println SEND not(FALSE) TO out ]
==> @{
  beh: expr_stmt,
  expr: @{
    beh: if_expr,
    eqtn: @{
      beh: eqtn,
      left: @{
        beh: const_ptrn,
        value: <NIL>
      },
      right: @{
        beh: const_ptrn,
        value: <NIL>
      }
    },
    expr: @{
      beh: block_expr,
      vars: <NIL>,
      stmt: @{
        beh: empty_stmt
      }
    },
    next: @{
      beh: block_expr,
      vars: <out,<NIL>>,
      stmt: @{
        beh: stmt_pair,
        head: @{
          beh: let_stmt,
          eqtn: @{
            beh: eqtn,
            left: @{
              beh: ident_ptrn,
              ident: out
            },
            right: @{
              beh: value_ptrn,
              expr: @{
                beh: ident_expr,
                ident: println
              }
            }
          }
        },
        tail: @{
          beh: stmt_pair,
          head: @{
            beh: send_stmt,
            msg: @{
              beh: app_expr,
              abs: @{
                beh: ident_expr,
                ident: not
              },
              arg: @{
                beh: const_expr,
                value: false
              }
            },
            to: @{
              beh: ident_expr,
              ident: out
            }
          },
          tail: @{
            beh: empty_stmt
          }
        }
      }
    }
  }
}
*/
