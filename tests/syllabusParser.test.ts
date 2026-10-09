import { parseSyllabus } from '../src/util/syllabusParser';

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

export function runSyllabusParserTests() {
  console.log('\n======================================================');
  console.log('RUNNING SYLLABUS PARSER TESTS');
  console.log('======================================================\n');

  // Test 1: Empty text
  console.log('Scenario 1: Empty text returns empty array');
  const emptyRes = parseSyllabus('');
  assert(emptyRes.length === 0, 'Empty string returns empty array');

  // Test 2: Standard Unit headers with bullet topics
  console.log('\nScenario 2: Standard Unit headers with bullet topics');
  const text1 = `
Unit 1: Introduction to Algorithms
- Asymptotic Analysis
- Divide and Conquer
* Recurrence Relations
• Master Theorem

Chapter 2: Sorting Algorithms
- Merge Sort
- Quick Sort
- Heap Sort
`;
  const res1 = parseSyllabus(text1);
  assert(res1.length === 2, 'Parsed 2 units');
  assert(res1[0].title === 'Unit 1: Introduction to Algorithms', 'Unit 1 title correct');
  assert(res1[0].topics.length === 4, 'Unit 1 has 4 topics');
  assert(res1[0].topics[0] === 'Asymptotic Analysis', 'Topic 1 correct');
  assert(res1[0].topics[3] === 'Master Theorem', 'Bullet • parsed correctly');
  assert(res1[1].title === 'Chapter 2: Sorting Algorithms', 'Chapter 2 title correct');
  assert(res1[1].topics.length === 3, 'Chapter 2 has 3 topics');

  // Test 3: Markdown # headers and Topics: line
  console.log('\nScenario 3: Markdown headers and inline Topics: line');
  const text2 = `
# Module 1: Graph Theory
Topics: Graph Representations, BFS and DFS; Topological Sort

## 2. Dynamic Programming
  Memoization vs Tabulation
  0/1 Knapsack Problem
  Longest Common Subsequence
`;
  const res2 = parseSyllabus(text2);
  assert(res2.length === 2, 'Parsed 2 units');
  assert(res2[0].title === 'Module 1: Graph Theory', 'Cleaned markdown # from Module 1');
  assert(res2[0].topics.length === 3, 'Split Topics: by comma and semicolon into 3 topics');
  assert(res2[0].topics[0] === 'Graph Representations', 'First inline topic correct');
  assert(res2[0].topics[2] === 'Topological Sort', 'Third inline topic correct');
  assert(res2[1].title === '2. Dynamic Programming', 'Numbered unit 2. detected');
  assert(res2[1].topics.length === 3, 'Indented topics detected under unit');

  // Test 4: Numbered with parentheses 1) and case-insensitive deduplication
  console.log('\nScenario 4: Numbered units with 1) and deduplication');
  const text3 = `
1) Linear Data Structures
- Arrays
- arrays
- Linked Lists

1) linear data structures
- Stacks
`;
  const res3 = parseSyllabus(text3);
  assert(res3.length === 1, 'Units with same title deduplicated case-insensitively');
  assert(res3[0].topics.length === 3, 'Topics deduplicated case-insensitively ("Arrays" and "arrays")');
  assert(res3[0].topics.includes('Stacks'), 'Additional topics merged into existing unit');

  // Test 5: Only numbered lines with no bullets, no indentation, no "Topics:"
  console.log('\nScenario 5: Only numbered lines parsed as topics of single unit "Unit 1"');
  const textNumberedOnly = `
1. Arrays
2. Stacks
3. Queues
4. Binary Trees
`;
  const res5 = parseSyllabus(textNumberedOnly);
  assert(res5.length === 1, 'Single unit "Unit 1" created for numbered-only lines');
  assert(res5[0].title === 'Unit 1', 'Unit title is strictly "Unit 1"');
  assert(res5[0].topics.length === 4, 'Unit 1 contains all 4 topics');
  assert(res5[0].topics[0] === 'Arrays', 'First topic is "Arrays"');
  assert(res5[0].topics[1] === 'Stacks', 'Second topic is "Stacks"');
  assert(res5[0].topics[2] === 'Queues', 'Third topic is "Queues"');
  assert(res5[0].topics[3] === 'Binary Trees', 'Fourth topic is "Binary Trees"');

  // Test 6: Numbered lines followed by topic lines (keep existing behavior)
  console.log('\nScenario 6: Numbered lines followed by bullet topic lines preserves unit structure');
  const textNumberedWithTopics = `
1. Linear Data Structures
- Arrays
- Stacks
2. Non-linear Data Structures
- Trees
- Graphs
`;
  const res6 = parseSyllabus(textNumberedWithTopics);
  assert(res6.length === 2, 'Parsed 2 units when numbered lines have topic lines');
  assert(res6[0].title === '1. Linear Data Structures', 'Unit 1 header kept as "1. Linear Data Structures"');
  assert(res6[0].topics.length === 2, 'Unit 1 has 2 bullet topics');
  assert(res6[0].topics[0] === 'Arrays', 'Unit 1 topic 1 is Arrays');
  assert(res6[1].title === '2. Non-linear Data Structures', 'Unit 2 header kept as "2. Non-linear Data Structures"');
  assert(res6[1].topics.length === 2, 'Unit 2 has 2 bullet topics');
  assert(res6[1].topics[1] === 'Graphs', 'Unit 2 topic 2 is Graphs');

  console.log('\nALL SYLLABUS PARSER TESTS PASSED SUCCESSFULLY!\n');
}
