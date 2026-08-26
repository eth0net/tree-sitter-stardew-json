# tree-sitter-stardew-json

A [Tree-sitter](https://tree-sitter.github.io) grammar for the JSON that
[Stardew Valley](https://www.stardewvalley.net) mods are written in: SMAPI's
dialect, with [Content
Patcher](https://github.com/Pathoschild/StardewMods/tree/develop/ContentPatcher)
tokens parsed as syntax rather than matched as text.

Built for [zed-stardew-mdk](https://github.com/eth0net/zed-stardew-mdk), but
there is nothing Zed-specific in it.

## Why not tree-sitter-json

SMAPI parses with Json.NET, so `//` and `/* */` comments, trailing commas and
single-quoted strings are all legal — Content Patcher's own documentation uses
the single quotes. A strict grammar reports every one as a syntax error.

Tokens are parsed rather than injected, which is what makes nesting and filters
come out structured. `{{Random: sun, rain |key={{Day}}}}` is:

```
(token
  name: (token_name)
  input: (token_input (token_text) (token_text))
  filter: (token_filter name: (token_filter_name) value: (token_input (token))))
```

Injecting a token grammar into `(string_content)` gets you the outer braces and
little else. Tokens are recognised in keys as well as values, which Content
Patcher allows, and `{{Some.Mod/Token}}` parses as one name.

## Nodes

`document`, `object`, `pair`, `array`, `string`, `string_content`,
`escape_sequence`, `number`, `true`, `false`, `null`, `comment`, `token`,
`token_name`, `token_input`, `token_text`, `token_filter`, `token_filter_name`.

The grammar is named `stardew_json`, so the parser exports
`tree_sitter_stardew_json` and a Zed extension must register it under exactly
that key.

## Development

```sh
scripts/check.sh          # regenerate src/, run the corpus tests
scripts/check.sh tokens   # one corpus file
```

`src/` is generated and committed, because consumers compile `src/parser.c`
directly — Zed never runs `tree-sitter generate`. CI regenerates and fails on
any diff, so an unregenerated `grammar.js` change can't ship.

Checked against every JSON snippet in Content Patcher's author guide and 162
files from a real content pack, with no parse errors. The committed corpus is
separate and synthetic — a public fixture shouldn't carry someone's mod text —
and pins the awkward cases: nested tokens, filters mixing text with a token,
tokens in keys, `Query` expressions, comments, trailing commas, single quotes
and literal braces in strings.

## Licence

`MIT OR Apache-2.0`, at your option.

Developed with [Claude Code](https://claude.com/claude-code).
