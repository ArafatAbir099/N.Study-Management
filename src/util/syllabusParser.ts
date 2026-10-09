export interface ParsedUnit {
  title: string;
  topics: string[];
}

/**
 * Parses raw syllabus text into structured units and topics.
 *
 * Rules:
 * - A line starting with "Unit", "Chapter", "Module", "#", or "1." / "1)" is a unit.
 * - Lines under it starting with "-", "*", "•", or indented, or comma/semicolon separated items on a single line after "Topics:", are topics.
 * - Trim, dedupe (case-insensitive), ignore empty lines.
 */
export function parseSyllabus(text: string): ParsedUnit[] {
  if (!text || !text.trim()) {
    return [];
  }

  const rawLines = text.split(/\r?\n/);
  const nonEmptyLines = rawLines
    .map((line) => ({ raw: line, trimmed: line.trim() }))
    .filter((item) => item.trimmed.length > 0);

  if (nonEmptyLines.length === 0) {
    return [];
  }

  const bulletRegex = /^[-*•]\s*(.+)$/;
  const inlineTopicsRegex = /^topics:\s*(.+)$/i;
  const numberedLineRegex = /^\d+[\.\)]\s*(.+)$/;

  const hasBullets = nonEmptyLines.some((item) => bulletRegex.test(item.trimmed));
  const hasIndented = nonEmptyLines.some(
    (item) => item.raw.startsWith('  ') || item.raw.startsWith('\t')
  );
  const hasInlineTopics = nonEmptyLines.some((item) => inlineTopicsRegex.test(item.trimmed));
  const isOnlyNumberedLines =
    !hasBullets &&
    !hasIndented &&
    !hasInlineTopics &&
    nonEmptyLines.every((item) => numberedLineRegex.test(item.trimmed));

  if (isOnlyNumberedLines) {
    const singleUnit: ParsedUnit = {
      title: 'Unit 1',
      topics: [],
    };
    for (const item of nonEmptyLines) {
      const match = item.trimmed.match(numberedLineRegex);
      if (match && match[1]) {
        addTopicToUnit(singleUnit, match[1].trim());
      }
    }
    return singleUnit.topics.length > 0 ? [singleUnit] : [];
  }

  const units: ParsedUnit[] = [];
  let currentUnit: ParsedUnit | null = null;

  const unitRegex = /^(?:unit\b|chapter\b|module\b|#|\d+[\.\)])/i;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const isIndented = rawLine.startsWith('  ') || rawLine.startsWith('\t');
    const isUnitHeader = unitRegex.test(trimmed) && !isIndented;

    if (isUnitHeader) {
      // Clean title: remove leading markdown headers e.g. "### "
      const cleanTitle = trimmed.replace(/^#+\s*/, '').trim();

      // Check if unit already in list (case-insensitive dedupe)
      const existing = units.find((u) => u.title.toLowerCase() === cleanTitle.toLowerCase());
      if (existing) {
        currentUnit = existing;
      } else {
        currentUnit = {
          title: cleanTitle,
          topics: [],
        };
        units.push(currentUnit);
      }
      continue;
    }

    // Check for inline topics: "Topics: Arrays, Linked Lists; Stacks"
    const inlineMatch = trimmed.match(inlineTopicsRegex);
    if (inlineMatch && inlineMatch[1]) {
      if (!currentUnit) {
        currentUnit = { title: 'Unit 1: Overview', topics: [] };
        units.push(currentUnit);
      }
      const rawTopics = inlineMatch[1].split(/[,;]/);
      for (const t of rawTopics) {
        addTopicToUnit(currentUnit, t.trim());
      }
      continue;
    }

    // Check for bullet or indented topic
    const bulletMatch = trimmed.match(bulletRegex);
    if (bulletMatch && bulletMatch[1]) {
      if (!currentUnit) {
        currentUnit = { title: 'Unit 1: Overview', topics: [] };
        units.push(currentUnit);
      }
      addTopicToUnit(currentUnit, bulletMatch[1].trim());
      continue;
    }

    if (isIndented && currentUnit) {
      // Indented line under a unit
      addTopicToUnit(currentUnit, trimmed);
      continue;
    }

    // If we have an active unit and the line is not a unit header,
    // treat non-empty line as topic if currentUnit exists
    if (currentUnit) {
      addTopicToUnit(currentUnit, trimmed);
    }
  }

  // Final trim and dedupe for all units
  return units.filter((u) => u.title.length > 0);
}

function addTopicToUnit(unit: ParsedUnit, topicTitle: string) {
  if (!topicTitle) return;
  // Clean leading bullets or dashes if remaining
  const cleaned = topicTitle.replace(/^[-*•]\s*/, '').trim();
  if (!cleaned) return;

  const exists = unit.topics.some((t) => t.toLowerCase() === cleaned.toLowerCase());
  if (!exists) {
    unit.topics.push(cleaned);
  }
}
