//! `human-language` command-line entry point (Rust).
//!
//! Mirrors the JavaScript CLI in `js/src/cli.js` for the subset of commands
//! that don't need a live Wikidata client. Network-backed commands
//! (`transform`, `entity`, `property`, `search`) are gated behind the
//! `wikidata-client` feature and currently stub-out with a not-implemented
//! message; the case-study tracks the full port as a follow-up.

use std::process::ExitCode;

use human_language::{lino, parse_hash, serialize_hash, tokenize, VERSION};
use lino_arguments::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "human-language", version, about = "Human Language CLI")]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Print tokens for the input text (one per line).
    Tokenize { text: Vec<String> },
    /// Parse a `#mode=...&...` SPA hash and print key/values.
    ParseHash { hash: String },
    /// Render IDs as Links Notation. Use [A,B] for an ambiguous slot.
    LinoSequence { ids: Vec<String> },
    /// Print the version.
    Version,
    /// Print usage.
    Help,
}

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
    let cli = Cli::parse();
    let Some(command) = cli.command else {
        println!("{USAGE}");
        return ExitCode::SUCCESS;
    };

    match command {
        Command::Help => {
            println!("{USAGE}");
            ExitCode::SUCCESS
        }
        Command::Version => {
            println!("human-language {VERSION}");
            ExitCode::SUCCESS
        }
        Command::Tokenize { text } => {
            let text = text.join(" ");
            if text.is_empty() {
                eprintln!("error: `tokenize` requires a text argument");
                return ExitCode::from(2);
            }
            for tok in tokenize(&text) {
                println!("{tok}");
            }
            ExitCode::SUCCESS
        }
        Command::ParseHash { hash } => {
            let parsed = parse_hash(&hash);
            println!("mode={}", parsed.mode);
            for (k, v) in &parsed.params {
                println!("{k}={v}");
            }
            println!("# canonical: {}", serialize_hash(&parsed));
            ExitCode::SUCCESS
        }
        Command::LinoSequence { ids } => {
            if ids.is_empty() {
                eprintln!("error: `lino-sequence` requires at least one id");
                return ExitCode::from(2);
            }
            let items: Vec<lino::SeqItem> = ids
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
    }
}
