//! `human-language` command-line entry point (Rust).
//!
//! Mirrors the JavaScript CLI in `js/src/cli.js` for the subset of commands
//! that don't need a live Wikidata client. Network-backed commands
//! (`transform`, `entity`, `property`, `search`) are gated behind the
//! `wikidata-client` feature and currently stub-out with a not-implemented
//! message; the case-study tracks the full port as a follow-up.

use std::process::ExitCode;

use human_language::{lino, parse_hash, serialize_hash, tokenize, VERSION};

const USAGE: &str = "\
Usage: human-language <command> [options] [args]

Commands:
  tokenize <text>        Print tokens for the input text (one per line).
  parse-hash <hash>      Parse a `#mode=…&…` SPA hash and print key/values.
  lino-sequence <ids…>   Render IDs as Links Notation (use [A,B] for an
                         ambiguous slot — comma-separated, no spaces).
  version                Print the version.
  help                   Print this message.

Network-backed commands (`transform`, `entity`, `property`, `search`) are
provided by the JavaScript CLI and the Docker microservice. Build with
`--features wikidata-client` for the planned Rust port.
";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() || matches!(args[0].as_str(), "help" | "--help" | "-h") {
        println!("{USAGE}");
        return ExitCode::SUCCESS;
    }
    match args[0].as_str() {
        "version" | "--version" | "-V" => {
            println!("human-language {VERSION}");
            ExitCode::SUCCESS
        }
        "tokenize" => {
            let text = args[1..].join(" ");
            if text.is_empty() {
                eprintln!("error: `tokenize` requires a text argument");
                return ExitCode::from(2);
            }
            for tok in tokenize(&text) {
                println!("{tok}");
            }
            ExitCode::SUCCESS
        }
        "parse-hash" => {
            let Some(hash) = args.get(1) else {
                eprintln!("error: `parse-hash` requires a hash string");
                return ExitCode::from(2);
            };
            let parsed = parse_hash(hash);
            println!("mode={}", parsed.mode);
            for (k, v) in &parsed.params {
                println!("{k}={v}");
            }
            println!("# canonical: {}", serialize_hash(&parsed));
            ExitCode::SUCCESS
        }
        "lino-sequence" => {
            if args.len() <= 1 {
                eprintln!("error: `lino-sequence` requires at least one id");
                return ExitCode::from(2);
            }
            let items: Vec<lino::SeqItem> = args[1..]
                .iter()
                .map(|raw| {
                    if let Some(inner) = raw.strip_prefix('[').and_then(|s| s.strip_suffix(']')) {
                        lino::SeqItem::Ambiguous(
                            inner.split(',').map(|s| s.trim().to_string()).collect(),
                        )
                    } else {
                        lino::SeqItem::Id(raw.clone())
                    }
                })
                .collect();
            print!("{}", lino::format_sequence_as_lino(&items));
            ExitCode::SUCCESS
        }
        cmd => {
            eprintln!("error: unknown command '{cmd}'\n\n{USAGE}");
            ExitCode::from(2)
        }
    }
}
