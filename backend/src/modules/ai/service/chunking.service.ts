/**
 * Structure-aware text chunking utility for the RAG ingestion pipeline.
 * Governed by RAG.md §3: ~500 tokens (~1800 chars), ~15% overlap (~270 chars),
 * contextual prefix per chunk.
 *
 * V1 (#99): English only. Character-based chunking (not token-based) is sufficient
 * for English where token ≈ 4-5 characters average.
 */

export interface ChunkResult {
  chunkIndex: number;
  chunkText: string;
}

const CHUNK_SIZE_CHARS = 1800;
const OVERLAP_CHARS = 270; // ~15% of 1800

/**
 * Splits text into overlapping chunks with a contextual prefix.
 *
 * The prefix format follows RAG.md §3:
 *   "From the {title}, section: {section}" — if section provided
 *   "From the {title}"                       — if no section
 *
 * Each chunk's text = prefix + ". " + raw_chunk_content
 *
 * @param text     Raw article body (English, V1 only)
 * @param title    Source article or document title for the contextual prefix
 * @param section  Optional section heading for the contextual prefix
 */
export function chunkText(
  text: string,
  title: string,
  section?: string
): ChunkResult[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  const prefix = section
    ? `From the ${title}, section: ${section}`
    : `From the ${title}`;

  const chunks: ChunkResult[] = [];

  if (clean.length <= CHUNK_SIZE_CHARS) {
    // Single chunk — no need to split
    chunks.push({
      chunkIndex: 0,
      chunkText: `${prefix}. ${clean}`,
    });
    return chunks;
  }

  let start = 0;
  let chunkIndex = 0;

  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, clean.length);
    let sliceEnd = end;

    // Try to break at sentence boundary (". ") or paragraph ("\n\n") to avoid
    // cutting words mid-sentence when there is room to do so.
    if (end < clean.length) {
      // Look back up to 200 chars for a sentence boundary
      const lookback = clean.lastIndexOf(". ", end);
      if (lookback > start + CHUNK_SIZE_CHARS * 0.5) {
        sliceEnd = lookback + 2; // include the ". "
      } else {
        // Fall back to word boundary
        const wordBound = clean.lastIndexOf(" ", end);
        if (wordBound > start + CHUNK_SIZE_CHARS * 0.5) {
          sliceEnd = wordBound + 1;
        }
      }
    }

    const raw = clean.slice(start, sliceEnd).trim();
    if (raw) {
      chunks.push({
        chunkIndex,
        chunkText: `${prefix}. ${raw}`,
      });
      chunkIndex++;
    }

    // Advance start, stepping back by OVERLAP_CHARS for continuity
    start = sliceEnd - OVERLAP_CHARS;
    if (start >= clean.length) break;
    // Avoid infinite loop if sliceEnd did not advance
    if (sliceEnd <= start + OVERLAP_CHARS) {
      start = sliceEnd;
    }
  }

  return chunks;
}
