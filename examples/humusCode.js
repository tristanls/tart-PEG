/*

humusCode.js - generate code from Humus tokens

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

var gen = module.exports;

var log = console.log;
//var log = function () {};

gen.humus = function genHumus(ast) {
    log('genHumus:', ast);
    var result = gen.block(ast);  // { value: [stmt, ...], ... }
    log('Humus:', result);
    return result;
};

gen.block = function genBlock(ast) {
    log('genBlock:', ast);
    var final = { beh: 'empty_stmt' };
    var result = {
        beh: 'block_beh',
        vars: [],
        stmt: final
    };
    var scope = result.vars;
    var current = result;
    ast.value.forEach(function (stmt) {  // { value: [stmt, ...], ... }
        current.stmt = {
            beh: 'stmt_pair',
            head: gen.stmt(stmt, scope),
            tail: final
        };
        current = current.tail;
    });
    log('Block:', result);
    return result;
};

gen.stmt = function genStmt(ast, scope) {
    log('genStmt:', ast, scope);
    var result = ast;
    if (ast.type === 'expr') {  // { type: 'expr', expr: value }
        result = {
            beh: 'expr_stmt',
            expr: gen.expr(ast.expr)
        };
    } else if (ast.type === 'let') {  // { type: 'let', eqtn: equation }
        result = {
            beh: 'let_stmt',
            eqtn: gen.eqtn(ast.eqtn, scope)
        };
    } else if (ast.type === 'send') {  // { type: 'send', msg: message, to: target }
        result = {
            beh: 'send_stmt',
            msg: gen.expr(ast.msg),
            to: gen.expr(ast.to)
        };
    } else if (ast.type === 'after_send') {  // { type: 'after_send', dt: delay, msg: message, to: target }
        result = {
            beh: 'after_send_stmt',
            msg: gen.expr(ast.msg),
            to: gen.expr(ast.to),
            dt: gen.expr(ast.dt)
        };
    } else if (ast.type === 'create') {  // { type: 'create', ident: identifier, expr: behavior }
        var name = ast.ident.value,  // extract actual identifier name
        if (scope) {
            scope[scope.length] = name;  // FIXME: check for duplicates?
        }
        result = {
            beh: 'create_stmt',
            ident: name,
            expr: gen.expr(ast.expr)
        };
    } else if (ast.type === 'become') {  // { type: 'become', expr: behavior }
        result = {
            beh: 'become_stmt',
            expr: gen.expr(ast.expr)
        };
    } else if (ast.type === 'throw') {  // { type: 'throw', expr: exception }
        result = {
            beh: 'throw_stmt',
            expr: gen.expr(ast.expr)
        };
    }
    log('Stmt:', result);
    return result;
};

/*
expr    <- 'LET' eqtn 'IN' expr
         / 'IF' eqtn expr ('ELIF' eqtn expr)* ('ELSE' expr)?
         / 'CASE' expr 'OF' (ptrn ':' expr)+ 'END'
         / term ',' expr
         / term
{ type: 'let_in', eqtn: equation, expr: expression }
{ type: 'if', ... }
{ type: 'case', ... }
{ type: 'pair', head: term, tail: more }
{ type: 'new', expr: term }
{ type: 'app', abs: fn, arg: expr }
{ type: 'ident', value: name }
{ type: 'block', value: [stmt, ...] }
{ type: 'self' }
{ type: 'abs', ptrn: ptrn, body: expr }
{ type: 'const', value: ... }
{ type: 'literal', value: ... }
*/
gen.expr = function genExpr(ast) {
    log('genExpr:', ast);
    var result = ast;
    if (ast.type === 'pair') {
        result = {
            beh: 'pair_expr',
            head: gen.expr(ast.head),
            tail: gen.expr(ast.tail)
        };
    } else if (ast.type === 'let_in') {
        var scope = [];
        result = {
            beh: 'let_expr',
            vars: scope,  // FIXME: declare variables for LET/IN ??
            eqtn: gen.eqtn(ast.eqtn, scope),
            expr: gen.expr(ast.expr)
        };
    } else if (ast.type === 'new') {
        result = {
            beh: 'new_expr',
            expr: gen.expr(ast.expr)
        };
    } else if (ast.type === 'app') {
        result = {
            beh: 'app_expr',
            abs: gen.expr(ast.abs),
            arg: gen.expr(ast.arg)
        };
    } else if (ast.type === 'ident') {
        result = {
            beh: 'ident_expr',
            ident: ast.value
        };
    } else if (ast.type === 'block') {
        result = gen.block(ast);
    } else if (ast.type === 'self') {
        result = {
            beh: 'self_expr'
        };
    } else if (ast.type === 'abs') {
        result = {
            beh: 'abs_expr',
            ptrn: gen.ptrn(ast.ptrn),  // FIXME: track declared variables ??
            body: gen.expr(ast.body)
        };
    } else if (ast.type === 'const') {
        result = {
            beh: 'const_expr',
            ident: ast.value
        };
    } else if (ast.type === 'literal') {
        result = {
            beh: 'literal_expr',
            ident: ast.value
        };
    }
    log('Expr:', result);
    return result;
};

/*
{ type: 'eqtn', left: lhs, right: rhs }
{ type: 'eqtn', left: { type: 'ident', value: name }, 
                right: { type: 'abs', ptrn: ptrn, body: expr } }
*/
gen.eqtn = function genEqtn(ast, scope) {
    log('genEqtn:', ast, scope);
    var result = ast;
    if (ast.type === 'eqtn') {
        result = {
            beh: 'eqtn',
            left: gen.ptrn(ast.left, scope),
            right: gen.ptrn(ast.right, scope)
        };
    }
    log('Eqtn:', result);
    return result;
};

/*
{ type: 'pair', head: pterm, tail: more }
{ type: 'any' }
{ type: 'value', expr: term }
{ type: 'block', value: [stmt, ...] }
{ type: 'self' }
{ type: 'abs', ptrn: ptrn, body: expr }
{ type: 'ident', value: name }
{ type: 'const', value: ... }
{ type: 'literal', value: ... }
*/
gen.ptrn = function genPtrn(ast, scope) {
    log('genPtrn:', ast, scope);
    var result = ast;
    if (ast.type === 'pair') {
        result = {
            beh: 'pair_ptrn',
            head: gen.ptrn(ast.head, scope),
            tail: gen.ptrn(ast.tail, scope)
        };
    } else if (ast.type === 'any') {
        result = {
            beh: 'any_ptrn'
        };
    } else if (ast.type === 'value') {
        result = {
            beh: 'value_ptrn',
            expr: gen.expr(ast.expr)
        };
    } else if (ast.type === 'ident') {
        var name = ast.value;
        if (scope) {
            scope[scope.length] = name;  // FIXME: check for duplicates?
        }
        result = {
            beh: 'ident_ptrn',
            ident: name
        };
    } else if ((ast.type === 'block') || (ast.type === 'abs')) {
        result = {
            beh: 'value_ptrn',
            expr: gen.expr(ast)
        };
    } else if (ast.type === 'self') {
        result = {
            beh: 'self_ptrn'
        };
    } else if (ast.type === 'const') {
        result = {
            beh: 'const_ptrn',
            value: ast.value
        };
    } else if (ast.type === 'literal') {
        result = {
            beh: 'literal_ptrn',
            value: ast.value
        };
    }
    log('Ptrn:', result);
    return result;
};

/*
pterm   <- '_'
         / '$' term
         / '(' ptrn? ')'
         / const
         / ident
{ type: 'any' }
{ type: 'value', expr: term }
{ type: 'const', ... }
{ type: 'ident', value: name }
*/

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
{ type: 'block', ... }
{ type: 'self' }
{ type: 'abs', ptrn: ptrn, body: expr }
{ type: 'literal', value: ... }
{ type: 'const', value: ... }
*/
