# tree-sitter-stardew-json

A [Tree-sitter](https://tree-sitter.github.io) grammar for the JSON that
[Stardew Valley](https://www.stardewvalley.net) mods are written in: SMAPI's
dialect of JSON, with [Content
Patcher](https://github.com/Pathoschild/StardewMods/tree/develop/ContentPatcher)
tokens parsed as syntax rather than matched as text.

Built for [zed-stardew-mdk](https://github.com/eth0net/zed-stardew-mdk), but
there is nothing Zed-specific in it.

## Why not tree-sitter-json

**SMAPI's dialect is not strict JSON.** It parses with Json.NET, so `//` and
`/* */` comments, trailing commas and single-quoted strings are all legal — and
Content Patcher's own documentation uses the single quotes. A strict JSON
grammar reports every one of these as a syntax error.

**Content Patcher tokens are structured.** `{{Random: sun, rain |key={{Day}}}}`
is a name, an input list and a filter, with another token nested inside it.
Injecting a separate token grammar into `(string_content)` gets you the outer
braces and not much else; parsing them here gets the whole shape:

```
(token
  name: (token_name)
  input: (token_input (token_text) (token_text))
  filter: (token_filter name: (token_filter_name) value: (token_input (token))))
```

Tokens are recognised in values and in keys, which Content Patcher allows, and
mod-provided names (`{{Some.Mod/Token}}`) parse as one name.

## Nodes

`document`, `object`, `pair`, `array`, `string`, `string_content`,
`escape_sequence`, `number`, `true`, `false`, `null`, `comment`, and for tokens:
`token`, `token_name`, `token_input`, `token_text`, `token_filter`,
`token_filter_name`.

The grammar's name is `stardew_json`, so the parser exports
`tree_sitter_stardew_json`. A Zed extension has to register it under exactly
that key.

## Development

```sh
scripts/check.sh          # regenerate src/, run the corpus tests
scripts/check.sh tokens   # one corpus file
```

`src/` is generated and committed, because consumers compile `src/parser.c`
directly — Zed never runs `tree-sitter generate`. CI regenerates and then fails
on any diff, so a `grammar.js` change that wasn't regenerated can't ship.

The corpus in `test/corpus` covers the cases worth pinning: nested tokens,
filters mixing literal text with a token, tokens in keys, `Query` expressions,
comments, trailing commas, single quotes and literal braces inside strings.

## Licence

`MIT OR Apache-2.0`, at your option.

Developed with [Claude Code](https://claude.com/claude-code).
