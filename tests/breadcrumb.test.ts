import { formatBreadcrumb } from '../src/util/breadcrumb';
import { Unit, Topic } from '../src/types';

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

export function runBreadcrumbTests() {
  console.log('\n======================================================');
  console.log('RUNNING BREADCRUMB UTILITY TESTS');
  console.log('======================================================\n');

  const units: Unit[] = [
    {
      id: 'unit_1',
      userId: 'u1',
      semesterId: 's1',
      subjectId: 'sub1',
      unitNumber: 1,
      title: 'Unit 1: Data Structures',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'unit_2',
      userId: 'u1',
      semesterId: 's1',
      subjectId: 'sub1',
      unitNumber: 2,
      title: 'Algorithms',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const topics: Topic[] = [
    {
      id: 'top_1',
      userId: 'u1',
      semesterId: 's1',
      subjectId: 'sub1',
      unitId: 'unit_1',
      title: 'Linked Lists',
      isCompleted: false,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'top_2',
      userId: 'u1',
      semesterId: 's1',
      subjectId: 'sub1',
      unitId: 'unit_2',
      title: 'Binary Search',
      isCompleted: true,
      createdAt: '',
      updatedAt: '',
    },
  ];

  console.log('Scenario 1: Both unitId and topicId exist');
  const b1 = formatBreadcrumb('unit_1', 'top_1', units, topics);
  assert(b1 === 'Unit 1: Data Structures › Linked Lists', 'Breadcrumb formats as "Unit › Topic"');

  console.log('\nScenario 2: Only unitId exists');
  const b2 = formatBreadcrumb('unit_1', undefined, units, topics);
  assert(b2 === 'Unit 1: Data Structures', 'Breadcrumb shows unit title when only unitId is provided');

  console.log('\nScenario 3: Only topicId exists (resolves unit from topic.unitId)');
  const b3 = formatBreadcrumb(undefined, 'top_2', units, topics);
  assert(b3 === 'Algorithms › Binary Search', 'Breadcrumb resolves unit via topic.unitId');

  console.log('\nScenario 4: Neither unitId nor topicId exists');
  const b4 = formatBreadcrumb(undefined, undefined, units, topics);
  assert(b4 === null, 'Breadcrumb returns null when neither exists');

  console.log('\nALL BREADCRUMB UTILITY TESTS PASSED SUCCESSFULLY!\n');
}
