#!/usr/bin/env bash
# Split HanumanChalisa.m4a into multiple MP3 files using timestamps in a TSV file.
# Each TSV time is treated as the *END* of a segment; the first segment starts at 0.
# Compatible with macOS default Bash 3.2 and zsh (run with: bash split_hanuman_chalisa_macos_v2.sh ...).
#
# Usage:
#   ./split_hanuman_chalisa_macos_v2.sh [INPUT_AUDIO] [TIMINGS_TSV] [OUTPUT_DIR]
# Defaults:
#   INPUT_AUDIO = HanumanChalisa.m4a
#   TIMINGS_TSV = Timings.tsv       (two columns: <HH:MM:SS.mmm>\t<OutputFileName.mp3>)
#   OUTPUT_DIR  = segments
#
# Env overrides:
#   BITRATE     = 192k (default) — MP3 bitrate
#
# Notes:
# - Re-encodes to MP3 with libmp3lame (so codecs are compatible even if input is M4A/AAC).
# - Produces exactly N segments for N lines in TSV:
#     seg1: [0, t1)        -> name1.mp3
#     seg2: [t1, t2)       -> name2.mp3
#     ...
#     segN: [tN-1, tN)     -> nameN.mp3
# - Lines starting with '#' or blank lines in the TSV are ignored.
# - If the last timestamp is less than the total duration, the leftover tail is ignored (warned).
#
# Example TSV (tab separated):
# 0:00:10.788    VerseIntro01.mp3
# 0:00:28.507    VerseIntro02.mp3
# 0:00:46.200    VerseIntro03.mp3
#
# This yields:
# [0.000,10.788) -> VerseIntro01.mp3
# [10.788,28.507)-> VerseIntro02.mp3
# [28.507,46.200)-> VerseIntro03.mp3
#
set -euo pipefail

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required but not found in PATH"; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "ffprobe is required but not found in PATH"; exit 1; }

INPUT_AUDIO="${1:-HanumanChalisa.m4a}"
TIMINGS_TSV="${2:-Timings.tsv}"
OUTPUT_DIR="${3:-segments}"
BITRATE="${BITRATE:-192k}"

if [[ ! -f "$INPUT_AUDIO" ]]; then
  echo "Input audio not found: $INPUT_AUDIO"
  exit 1
fi

if [[ ! -f "$TIMINGS_TSV" ]]; then
  echo "Timings TSV not found: $TIMINGS_TSV"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Get total duration (seconds with decimals) of the input, for sanity checks only
TOTAL_DURATION="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_AUDIO")"
if [[ -z "$TOTAL_DURATION" ]]; then
  echo "Could not determine total duration for $INPUT_AUDIO"
  exit 1
fi

awk -v total="$TOTAL_DURATION" -F'\t' '
  function trim(s) { gsub(/^[ \t\r\n]+|[ \t\r\n]+$/, "", s); return s }
  function h2s(t,    a,n) {
    n = split(t, a, ":");
    if (n == 3) return a[1]*3600 + a[2]*60 + a[3];
    if (n == 2) return a[1]*60 + a[2];
    return t + 0;
  }
  /^[ \t]*#/ { next }                 # skip comments
  NF < 2 { next }                     # need at least time and filename
  {
    t = trim($1); name = trim($2);
    if (t == "" || name == "") next;
    i = ++N;
    ends[i]  = h2s(t);   # each is an END time
    names[i] = name;
  }
  END {
    if (N < 1) exit;
    # Check monotonicity and compute segments
    prev = 0.0;
    for (i = 1; i <= N; i++) {
      if (ends[i] < prev) {
        printf("WARN\tOrder\t%d\t%d\t%.3f\t%.3f\t%s\n", i, N, prev, ends[i], names[i]);
        next;
      }
      start = prev;
      end   = ends[i];
      dur   = end - start;
      if (dur <= 0) {
        printf("WARN\tNonPos\t%d\t%d\t%.3f\t%.3f\t%s\n", i, N, start, dur, names[i]);
      } else {
        printf("CUT\t%d\t%d\t%.3f\t%.3f\t%s\n", i, N, start, dur, names[i]);
      }
      prev = end;
    }
    # If there is leftover tail beyond last end time, warn only (no extra file)
    if (ends[N] < total - 0.02) {
      tail = total - ends[N];
      printf("WARN\tTail\t%d\t%d\t%.3f\t%.3f\t%s\n", N, N, ends[N], tail, "UNUSED_TAIL") ;
    }
  }
' "$TIMINGS_TSV" | while IFS=$'\t' read -r TYPE IDX TOTAL START DURATION OUTNAME; do
  if [[ "$TYPE" = "WARN" ]]; then
    case "$OUTNAME" in
      UNUSED_TAIL) echo "WARN: final timestamp ends before file end; tail of ${DURATION}s ignored." 1>&2 ;;
      *) echo "WARN: issue at row ${IDX}/${TOTAL} (start=${START}, dur=${DURATION}) for ${OUTNAME}" 1>&2 ;;
    esac
    continue
  fi
  printf "[%02d/%02d] %s: start=%s, dur=%s -> %s\n" "$IDX" "$TOTAL" "$INPUT_AUDIO" "$START" "$DURATION" "$OUTNAME"
  ffmpeg -hide_banner -loglevel error \
    -ss "$START" -i "$INPUT_AUDIO" -t "$DURATION" \
    -vn -acodec libmp3lame -b:a "$BITRATE" \
    -y "$OUTPUT_DIR/$OUTNAME"
done

echo "Done. Files written to: $OUTPUT_DIR"
