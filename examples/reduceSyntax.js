/*

reduceSyntax.js - semantic transformation to simplify Humus tokens

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

var semantic = module.exports;

/*
 * transform(ns) - augment grammar namespace with reduction semantics
 */
semantic.transform = function transform(ns) {
//    var log = console.log;
    var log = function () {};
/*
name, value ==> { name: name, value: value, ... }
*/
    var transformDefault = function transformDefault(name, value, r) {
        log('transformDefault:', name, value, r);
        var result = {
            name: name,
            start: r.start,
            end: r.end,
            value: value
        };
        log('Default:', result);
        return result;
    };
/*
name, value ==> value
*/
    var transformValue = function transformValue(name, value) {
        log('transformValue:', name, value);
        var result = value;
        log('Value:', result);
        return result;
    };
/*
name, value ==> { type: name }
*/
    var transformNamed = function transformNamed(name, value) {
        log('transformNamed:', name, value);
        var result = {
            type: name
        };
        log('Named:', result);
        return result;
    };

/*
tokens  <- token* EOF
[[token, ...], EOF] ==> [token, ...]
    ns.transform('tokens', function transformTokens(name, value) {
        log('transformTokens:', name, value);
        var result = value[0];
        log('Tokens:', result);
        return result;
    });
*/

/*
token   <- _ (symbol / number / char / string / ident / punct)
[_, token] ==> token
    ns.transform('token', function transformToken(name, value) {
        log('transformToken:', name, value);
        var result = value[1];
        log('Token:', result);
        return result;
    });
*/

/*
symbol  <- '#' (punct / name)
['#', token] ==> { type: 'symbol', value: token }
    ns.transform('symbol', function transformSymbol(name, value) {
        log('transformSymbol:', name, value);
        var result = {
            type: name,
            value: value[1]
        };
        log('Symbol:', result);
        return result;
    });
*/

/*
number  <- '-'? [0-9]+ ('#' [0-9a-zA-Z]+)?
[[sign], [digits, ...] []] ==> {
    type: 'number',
    sign: sign,
    radix: 10,
    digits: digits...,
    value: parseInt(digits..., 10)
}
[[sign], [radix, ...], ['#', [digits, ...]]] ==> {
    type: 'number',
    sign: sign,
    radix: parseInt(radix..., 10),
    digits: digits...,
    value: parseInt(digits..., .radix)
}
    ns.transform('number', function transformNumber(name, value) {
        log('transformNumber:', name, value);
        var result = {
            type: name
        };
        result.sign = value[0][0];
        result.radix = value[1].join('');
        if (value[2].length) {
            result.digits = value[2][0][1].join('');
            result.radix = parseInt(result.radix, 10);
        } else {
            result.digits = result.radix;
            result.radix = 10;
        }
        result.value = parseInt(result.digits, result.radix);
        if (result.sign == '-') {
            result.value = -(result.value);
        }
        log('Number:', result);
        return result;
    });
*/

/*
char    <- "'" (!"'" qchar) "'"
['\'', [undefined, qchar], '\''] ==> { type: 'char', value: qchar }
    ns.transform('char', function transformChar(name, value) {
        log('transformChar:', name, value);
        var result = {
            type: name,
            value: value[1][1]
        };
        log('Char:', result);
        return result;
    });
*/

/*
string  <- '"' (!'"' qchar)+ '"'
['"', [[undefined, qchar], ...], '"'] ==> { type: 'string', value: qchar... }
    ns.transform('string', function transformString(name, value) {
        log('transformString:', name, value);        
        var list = value[1];
        var s = '';
        for (var i = 0; i < list.length; ++i) {
            s += list[i][1];
        }
        var result = {
            type: name,
            value: s
        };
        log('String:', result);
        return result;
    });
*/

    var escChars = {
        'n': '\n',
        'r': '\r',
        't': '\t',
        "'": "'",
        '"': '"',
        '[': '[',
        ']': ']',
        '\\': '\\'
    };
/*
qchar   <- '\\' [nrt'"\[\]\\]
         / '\\u' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]
         / !'\\' .
['\\', esc] ==> esc
[undefined, char] ==> char
    ns.transform('qchar', function transformCharacter(name, value) {
        log('transformCharacter:', name, value);
        var result = value[1];
        if (value[0] === '\\') {
            result = escChars[result];  // FIXME: handle unicode escapes!
        }
        log('Character:', result);
        return result;
    });
*/

/*
ident   <- name
name ==> name IF isKeyword(name)
name ==> { type: 'ident', value: name } OTHERWISE
    ns.transform('ident', function transformIdent(name, value) {
        log('transformIdent:', name, value);
        var result = value;
        if (!isKeyword(result)) {
            result = {
                type: name,
                value: value
            };
        }
        log('Ident:', result);
        return result;
    });
*/

/*
name    <- [-0-9a-zA-Z!%&'*+/?@^_~]+
[char, ...] ==> char...
    ns.transform('name', function transformName(name, value) {
        log('transformName:', name, value);
        var result = value.join('');
        log('Name:', result);
        return result;
    });
*/

/*
punct   <- [#$(),.:;=\[\\\]]
char ==> char
    ns.transform('punct', transformValue);
*/

/*
_       <- (comment / space)*               # optional whitespace
[...] ==> { type: '_' }
    ns.transform('_', transformNamed);
*/

/*
block   <- '[' stmt* ']'
*/
    ns.transform('block', transformValue);

/*
stmt    <- 'LET' eqtn !'IN'
         / ('AFTER' expr)? 'SEND' expr 'TO' expr
         / 'CREATE' ident 'WITH' expr
         / 'BECOME' expr
         / 'THROW' expr
         / expr
['LET', equation, undefined] ==> ?
[['AFTER', delay], 'SEND', message, 'TO', target] ==> ?
[[], 'SEND', message, 'TO', target] ==> ?
['CREATE', identifier, 'WITH', behavior] ==> ?
['BECOME', behavior] ==> ?
['THROW', exception] ==> ?
expr ==> { beh: 'expr_stmt', expr: value }
*/
    ns.transform('stmt', function transformStatement(name, value) {
        log('transformStatement:', name, value);
        var result = value;
        if ((value.lengh === 3) && (value[0] === 'LET')) {
        } else if ((value.lengh === 5) && (value[1] === 'SEND') && (value[3] === 'TO')) {
        } else if ((value.lengh === 4) && (value[0] === 'CREATE') && (value[2] === 'WITH')) {
        } else if ((value.lengh === 2) && (value[0] === 'BECOME')) {
        } else if ((value.lengh === 2) && (value[0] === 'THROW')) {
        } else {
            result = {
                beh: 'expr_stmt',
                expr: value
            };
        }
        log('Statement:', result);
        return result;
    });

/*
expr    <- 'LET' eqtn 'IN' expr
         / 'IF' eqtn expr ('ELIF' eqtn expr)* ('ELSE' expr)?
         / 'CASE' expr 'OF' (ptrn ':' expr)+ 'END'
         / term ',' expr
         / term
['LET', equation, 'IN', expression] ==> ?
['IF', equation_0, consequent_0, [['ELIF', equation_n, consequent_n], ...], []] ==> ?
['IF', equation_0, consequent_0, [['ELIF', equation_n, consequent_n], ...], ['ELSE', alternative]] ==> ?
['CASE', expression, 'OF', [[ptrn, ':', result], ...], 'END'] ==> ?
[term, ',', more] ==> ?
term ==> ?
*/
    ns.transform('expr', function transformExpression(name, value) {
        log('transformExpression:', name, value);
        var result = value;
        if ((value.lengh === 4) && (value[0] === 'LET') && (value[2] === 'IN')) {
        } else if ((value.lengh === 5) && (value[0] === 'IF')) {
        } else if ((value.lengh === 5) && (value[0] === 'CASE') && (value[2] === 'OF') && (value[4] === 'END')) {
        } else if ((value.lengh === 3) && (value[1] === ',')) {
        } else {
            result = value;
        }
        log('Expression:', result);
        return result;
    });

/*
term    <- 'NEW' term
         / const
         / call
         / '(' expr? ')'
         / ident
['NEW', term] ==> ?
['(', [], ')'] ==> { beh: const_expr, value: null }
['(', [expr], ')'] ==> expr
{ type: 'ident', value: name } => { beh: 'ident_expr', ident: name }
term ==> value
*/
    ns.transform('term', function transformTerm(name, value) {
        log('transformTerm:', name, value);
        var result = value;
        if ((value.lengh === 2) && (value[0] === 'NEW')) {
        } else if ((value.lengh === 3) && (value[0] === '(') && (value[2] === ')')) {
            if (value[1].length < 1) {
                result = {
                    beh: 'const_expr',
                    value: null
                };
            } else {
                result = value[1][0];
            }
        } else if (value.type === 'ident') {
                result = {
                    beh: 'ident_expr',
                    ident: value.value
                };
        } else {
            result = value;
        }
        log('Term:', result);
        return result;
    });

/*
call    <- ident '(' expr? ')'
         / '(' expr ')' '(' expr? ')'
*/
    ns.transform('call', transformDefault);

/*
eqtn    <- ident '(' ptrn? ')' '=' expr
         / ptrn '=' ptrn
*/
    ns.transform('eqtn', transformDefault);

/*
ptrn    <- pterm ',' ptrn
         / pterm
*/
    ns.transform('ptrn', transformDefault);

/*
pterm   <- '_'
         / '$' term
         / '(' ptrn? ')'
         / const
         / ident
*/
    ns.transform('pterm', transformDefault);

/*
const   <- block
         / 'SELF'
         / '\\' ptrn '.' expr
         / symbol
         / number
         / char
         / string
         / 'NIL'
         / 'TRUE'
         / 'FALSE'
         / '?'
['[', [stmt, ...], ']'] ==> ?
'SELF' ==> { beh: 'self_expr' }
['\\', ptrn, '.', body] ==> ?
'NIL' ==> { beh: 'const_expr', value: null }
'TRUE' ==> { beh: 'const_expr', value: true }
'FALSE' ==> { beh: 'const_expr', value: false }
'?' ==> { beh: 'const_expr', value: undefined }
*/
    ns.transform('const', function transformConstant(name, value) {
        log('transformConstant:', name, value);
        var result = value;
        if ((value.lengh === 3) && (value[0] === '[') && (value[2] === ']')) {
        } else if (value === 'SELF') {
            result = {
                beh: 'self_expr'
            };
        } else if ((value.lengh === 4) && (value[0] === '\\') && (value[2] === '.')) {
            /*
            @{
              beh: abs_expr,
              ptrn: @{
                beh: ident_ptrn,
                ident: x
              },
              body: @{
                beh: ident_expr,
                ident: x
              }
            }
            */
        } else if (value === 'NIL') {
            result = {
                beh: 'const_expr',
                value: null
            };
        } else if (value === 'TRUE') {
            result = {
                beh: 'const_expr',
                value: true
            };
        } else if (value === 'FALSE') {
            result = {
                beh: 'const_expr',
                value: false
            };
        } else if (value === '?') {
            result = {
                beh: 'const_expr',
                value: undefined
            };
        }
        log('Constant:', result);
        return result;
    });

/*
ident   <- { type:'ident' }
*/
    ns.transform('ident', transformValue);

/*
number  <- { type:'number' }
*/
    ns.transform('number', transformValue);

/*
char    <- { type:'char' }
*/
    ns.transform('char', transformValue);

/*
string  <- { type:'string' }
*/
    ns.transform('string', transformValue);

/*
symbol  <- { type:'symbol' }
*/
    ns.transform('symbol', transformValue);

    return ns;
};