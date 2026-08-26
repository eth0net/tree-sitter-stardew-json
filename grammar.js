/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// SMAPI's JSON dialect: comments and trailing commas are legal, and Content
// Patcher tokens (`{{Season}}`) can appear inside any string — including keys.
// Tokens are parsed here rather than injected so that nesting
// (`{{Random: {{Season}}, x}}`) and filters (`|contains=`) come out structured.

/** @param {RuleOrLiteral} rule */
const commaSep = (rule) => seq(rule, repeat(seq(",", rule)), optional(","));

module.exports = grammar({
  name: "stardew_json",

  extras: ($) => [/[\s﻿]/, $.comment],

  supertypes: ($) => [$._value],

  rules: {
    document: ($) => repeat($._value),

    _value: ($) =>
      choice($.object, $.array, $.string, $.number, $.true, $.false, $.null),

    object: ($) => seq("{", optional(commaSep($.pair)), "}"),

    pair: ($) =>
      seq(
        field("key", choice($.string, $.number)),
        ":",
        field("value", $._value),
      ),

    array: ($) => seq("[", optional(commaSep($._value)), "]"),

    // --- strings -----------------------------------------------------------

    // Single quotes are legal: SMAPI parses with Json.NET's lenient reader, and
    // Content Patcher's own docs use them to avoid escaping inner double quotes.
    //
    // The closing quote is immediate so that `extras` can never be skipped
    // inside a string: every alternative in the content is adjacent to the
    // previous one, which keeps literal whitespace part of the content.
    string: ($) =>
      choice(
        seq('"', token.immediate('"')),
        seq('"', $.string_content, token.immediate('"')),
        seq("'", token.immediate("'")),
        seq("'", alias($._single_string_content, $.string_content), token.immediate("'")),
      ),

    string_content: ($) =>
      repeat1(
        choice(
          $.token,
          $.escape_sequence,
          $._string_text,
          token.immediate("{"),
        ),
      ),

    _single_string_content: ($) =>
      repeat1(
        choice(
          $.token,
          $.escape_sequence,
          $._single_string_text,
          token.immediate("{"),
        ),
      ),

    // Everything up to the next backslash, closing quote or brace. Higher
    // lexical precedence than `comment` so `"//not-a-comment"` stays text.
    _string_text: (_) => token.immediate(prec(1, /[^\\"{]+/)),
    _single_string_text: (_) => token.immediate(prec(1, /[^\\'{]+/)),

    // Deliberately lenient: an invalid escape shouldn't wreck highlighting for
    // the rest of the file. The language server reports it instead.
    escape_sequence: (_) => token.immediate(/\\(u[0-9A-Fa-f]{4}|.)/),

    // --- Content Patcher tokens -------------------------------------------

    token: ($) =>
      seq(
        // Not `immediate`: tokens nest, and `{{Random: {{Season}}}}` has
        // whitespace before the inner one.
        "{{",
        optional(
          seq(
            field("name", $.token_name),
            optional(seq(":", field("input", $.token_input))),
            repeat(field("filter", $.token_filter)),
          ),
        ),
        "}}",
      ),

    // `Season`, `Pathoschild.ExampleMod/SomeToken`, `Mod.Id/Token`.
    token_name: (_) => /[A-Za-z_][A-Za-z0-9_.\-]*(\/[A-Za-z0-9_.\-]+)?/,

    token_input: ($) => repeat1(choice($.token, $.token_text, ",")),

    token_filter: ($) =>
      seq(
        "|",
        field("name", $.token_filter_name),
        optional(seq("=", field("value", $.token_input))),
      ),

    token_filter_name: (_) => /[A-Za-z_][A-Za-z0-9_]*/,

    // Starts and ends on a non-space so that padding around `:`, `,` and `|`
    // is left to `extras` instead of showing up as whitespace-only nodes.
    token_text: (_) => token(prec(-1, /[^|{}",\s]([^|{}",]*[^|{}",\s])?/)),

    // --- scalars -----------------------------------------------------------

    number: (_) => token(/-?\d+(\.\d+)?([eE][+-]?\d+)?/),

    true: (_) => "true",
    false: (_) => "false",
    null: (_) => "null",

    comment: (_) =>
      token(
        choice(
          seq("//", /[^\r\n]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),
  },
});
