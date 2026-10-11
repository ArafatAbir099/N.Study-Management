package com.example.semesterstudyos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.semesterstudyos.model.RevisionRecord
import com.example.semesterstudyos.model.StudyTask
import com.example.semesterstudyos.model.Subject
import com.example.semesterstudyos.ui.theme.EmeraldSuccess
import com.example.semesterstudyos.ui.theme.RoseDanger
import com.example.semesterstudyos.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyStudyScreen(
    tasks: List<StudyTask>,
    revisions: List<RevisionRecord>,
    subjects: List<Subject>,
    pomodoroSeconds: Int,
    isPomodoroRunning: Boolean,
    pomodoroMode: String,
    onStartPomodoro: () -> Unit,
    onPausePomodoro: () -> Unit,
    onResetPomodoro: () -> Unit,
    onSwitchPomodoroMode: (String) -> Unit,
    onToggleTask: (String) -> Unit,
    onAddTask: (title: String, subjectId: String, minutes: Int, taskType: String) -> Unit,
    onDeleteTask: (String) -> Unit,
    onCompleteRevision: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedSubTab by remember { mutableIntStateOf(0) } // 0: Tasks Checklist, 1: Focus Timer, 2: Spaced Review
    var filterStatus by remember { mutableStateOf("ALL") } // "ALL", "PENDING", "COMPLETED"
    var showAddTaskDialog by remember { mutableStateOf(false) }
    var taskToDelete by remember { mutableStateOf<StudyTask?>(null) }

    val filteredTasks = when (filterStatus) {
        "PENDING" -> tasks.filter { !it.isCompleted }
        "COMPLETED" -> tasks.filter { it.isCompleted }
        else -> tasks
    }

    val completedCount = tasks.count { it.isCompleted }
    val totalCount = tasks.size
    val totalMinutesPlanned = tasks.sumOf { it.estimatedMinutes }

    val minutes = pomodoroSeconds / 60
    val seconds = pomodoroSeconds % 60
    val timeFormatted = String.format("%02d:%02d", minutes, seconds)

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            if (selectedSubTab == 0) {
                FloatingActionButton(
                    onClick = { showAddTaskDialog = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.testTag("fab_add_daily_task")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Task")
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Daily Tasks",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Plan daily study goals, track checklist, and stay focused",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Button(
                        onClick = { showAddTaskDialog = true },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.testTag("add_task_header_button")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Task", fontSize = 13.sp)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Sub Navigation Tabs
                PrimaryTabRow(
                    selectedTabIndex = selectedSubTab,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Tab(
                        selected = selectedSubTab == 0,
                        onClick = { selectedSubTab = 0 },
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Assignment,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Checklist (${tasks.count { !it.isCompleted }})")
                            }
                        }
                    )
                    Tab(
                        selected = selectedSubTab == 1,
                        onClick = { selectedSubTab = 1 },
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Timer,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Focus Timer")
                            }
                        }
                    )
                    Tab(
                        selected = selectedSubTab == 2,
                        onClick = { selectedSubTab = 2 },
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Refresh,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Review (${revisions.count { !it.isCompleted }})")
                            }
                        }
                    )
                }
            }

            // Tab Content
            when (selectedSubTab) {
                0 -> {
                    // TAB 0: DAILY TASKS CHECKLIST
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Spacer(modifier = Modifier.height(4.dp))

                            // Summary Stats Banner
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("daily_tasks_summary_card"),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceAround,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "$completedCount/$totalCount",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Text(
                                            text = "Tasks Done",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .width(1.dp)
                                            .height(36.dp)
                                            .background(MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f))
                                    )

                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "${totalMinutesPlanned}m",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Text(
                                            text = "Study Planned",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .width(1.dp)
                                            .height(36.dp)
                                            .background(MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f))
                                    )

                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        val pct = if (totalCount > 0) ((completedCount.toFloat() / totalCount) * 100).toInt() else 0
                                        Text(
                                            text = "$pct%",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Text(
                                            text = "Progress",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                        )
                                    }
                                }
                            }
                        }

                        // Filter Chips
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                FilterChip(
                                    selected = filterStatus == "ALL",
                                    onClick = { filterStatus = "ALL" },
                                    label = { Text("All ($totalCount)") },
                                    modifier = Modifier.testTag("filter_all_tasks")
                                )
                                FilterChip(
                                    selected = filterStatus == "PENDING",
                                    onClick = { filterStatus = "PENDING" },
                                    label = { Text("Pending (${tasks.count { !it.isCompleted }})") },
                                    modifier = Modifier.testTag("filter_pending_tasks")
                                )
                                FilterChip(
                                    selected = filterStatus == "COMPLETED",
                                    onClick = { filterStatus = "COMPLETED" },
                                    label = { Text("Completed ($completedCount)") },
                                    modifier = Modifier.testTag("filter_completed_tasks")
                                )
                            }
                        }

                        // Empty State if no tasks match
                        if (filteredTasks.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 24.dp)
                                        .testTag("empty_daily_tasks_card"),
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(32.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(64.dp)
                                                .clip(CircleShape)
                                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.CheckCircle,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(36.dp)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(16.dp))

                                        Text(
                                            text = if (tasks.isEmpty()) "No Daily Tasks Yet" else "No $filterStatus Tasks",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )

                                        Spacer(modifier = Modifier.height(6.dp))

                                        Text(
                                            text = if (tasks.isEmpty()) {
                                                "Start your day by setting what you need to study. Add chapters to read, exercises, or exam prep."
                                            } else {
                                                "You have no tasks matching this filter right now."
                                            },
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            textAlign = TextAlign.Center
                                        )

                                        Spacer(modifier = Modifier.height(18.dp))

                                        Button(
                                            onClick = { showAddTaskDialog = true },
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.testTag("create_first_task_button")
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Add Daily Task")
                                        }
                                    }
                                }
                            }
                        } else {
                            // Tasks list
                            items(filteredTasks, key = { it.id }) { task ->
                                val sub = subjects.find { it.id == task.subjectId }
                                val subColor = if (sub != null) {
                                    try {
                                        Color(android.graphics.Color.parseColor(sub.colorHex))
                                    } catch (_: Exception) {
                                        MaterialTheme.colorScheme.primary
                                    }
                                } else {
                                    MaterialTheme.colorScheme.secondary
                                }

                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("task_item_${task.id}"),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (task.isCompleted) {
                                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                        } else {
                                            MaterialTheme.colorScheme.surface
                                        }
                                    ),
                                    elevation = CardDefaults.cardElevation(defaultElevation = if (task.isCompleted) 0.dp else 1.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = task.isCompleted,
                                            onCheckedChange = { onToggleTask(task.id) },
                                            modifier = Modifier.testTag("task_checkbox_${task.id}")
                                        )

                                        Spacer(modifier = Modifier.width(8.dp))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = task.title,
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.SemiBold,
                                                textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                                                color = if (task.isCompleted) {
                                                    MaterialTheme.colorScheme.onSurfaceVariant
                                                } else {
                                                    MaterialTheme.colorScheme.onSurface
                                                }
                                            )

                                            Spacer(modifier = Modifier.height(4.dp))

                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                // Subject badge
                                                Box(
                                                    modifier = Modifier
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(subColor.copy(alpha = 0.15f))
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(
                                                        text = sub?.code ?: "General",
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = subColor
                                                    )
                                                }

                                                // Type badge
                                                Box(
                                                    modifier = Modifier
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(MaterialTheme.colorScheme.surfaceVariant)
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(
                                                        text = task.taskType,
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }

                                                // Duration badge
                                                Text(
                                                    text = "• ${task.estimatedMinutes}m",
                                                    fontSize = 12.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        IconButton(
                                            onClick = { taskToDelete = task },
                                            modifier = Modifier.testTag("delete_task_${task.id}")
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Delete,
                                                contentDescription = "Delete Task",
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(80.dp))
                        }
                    }
                }

                1 -> {
                    // TAB 1: FOCUS POMODORO TIMER
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("pomodoro_card"),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "$pomodoroMode Session",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )

                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(if (pomodoroMode == "Focus") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface)
                                                    .clickable { onSwitchPomodoroMode("Focus") }
                                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                                            ) {
                                                Text(
                                                    text = "Focus (25m)",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = if (pomodoroMode == "Focus") Color.White else MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(if (pomodoroMode == "Break") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface)
                                                    .clickable { onSwitchPomodoroMode("Break") }
                                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                                            ) {
                                                Text(
                                                    text = "Break (5m)",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = if (pomodoroMode == "Break") Color.White else MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(28.dp))

                                    Text(
                                        text = timeFormatted,
                                        fontSize = 64.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )

                                    Spacer(modifier = Modifier.height(28.dp))

                                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                        Button(
                                            onClick = {
                                                if (isPomodoroRunning) onPausePomodoro() else onStartPomodoro()
                                            },
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.testTag("pomodoro_start_pause")
                                        ) {
                                            Icon(
                                                imageVector = if (isPomodoroRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                                                contentDescription = null,
                                                modifier = Modifier.size(20.dp)
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(if (isPomodoroRunning) "Pause" else "Start Focus")
                                        }

                                        IconButton(
                                            onClick = onResetPomodoro,
                                            modifier = Modifier
                                                .clip(CircleShape)
                                                .background(MaterialTheme.colorScheme.surface)
                                                .testTag("pomodoro_reset")
                                        ) {
                                            Icon(Icons.Default.Refresh, contentDescription = "Reset Timer")
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Text(
                                text = "Recommended Study Rhythm",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Use 25-minute uninterrupted focus sprints followed by a 5-minute restorative break. Complete tasks from your checklist while the timer runs.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        item {
                            Spacer(modifier = Modifier.height(40.dp))
                        }
                    }
                }

                2 -> {
                    // TAB 2: SPACED REVISION
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Active Recall & Spaced Revisions",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Topics scheduled for review using 1, 3, 7, and 14 day intervals",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        if (revisions.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 16.dp),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(
                                            Icons.Default.Refresh,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(40.dp)
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text("No Revisions Due", fontWeight = FontWeight.Bold)
                                        Text(
                                            "As you mark chapters and topics completed in your Syllabus, scheduled spaced repetition reviews will appear here automatically.",
                                            style = MaterialTheme.typography.bodySmall,
                                            textAlign = TextAlign.Center,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        } else {
                            items(revisions, key = { it.id }) { rev ->
                                val sub = subjects.find { it.id == rev.subjectId }
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "${sub?.code ?: "Course"} Revision",
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = "Due: ${DateUtils.formatDisplayDate(rev.scheduledDate)} (Day ${rev.intervalIndex} interval)",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        if (rev.isCompleted) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(EmeraldSuccess)
                                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                                            ) {
                                                Text("Reviewed ✓", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        } else {
                                            Button(
                                                onClick = { onCompleteRevision(rev.id) },
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text("Mark Done", fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(40.dp))
                        }
                    }
                }
            }
        }
    }

    // DIALOG: ADD DAILY TASK
    if (showAddTaskDialog) {
        var taskTitle by remember { mutableStateOf("") }
        var selectedSubjectId by remember { mutableStateOf(subjects.firstOrNull()?.id ?: "") }
        var taskMinutes by remember { mutableStateOf("30") }
        var selectedType by remember { mutableStateOf("Study") }
        var isDropdownExpanded by remember { mutableStateOf(false) }

        val taskTypes = listOf("Study", "Assignment", "Revision", "Exam Prep", "Reading")

        AlertDialog(
            onDismissRequest = { showAddTaskDialog = false },
            title = {
                Text(
                    text = "Add Daily Task",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = taskTitle,
                        onValueChange = { taskTitle = it },
                        label = { Text("Task Title (e.g. Read Chapter 2, Solve Worksheet)") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_task_title")
                    )

                    // Subject Dropdown
                    if (subjects.isNotEmpty()) {
                        ExposedDropdownMenuBox(
                            expanded = isDropdownExpanded,
                            onExpandedChange = { isDropdownExpanded = it }
                        ) {
                            val currentSelectedSubject = subjects.find { it.id == selectedSubjectId }
                            OutlinedTextField(
                                value = currentSelectedSubject?.let { "${it.code} - ${it.title}" } ?: "General / Self Study",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Course / Subject") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isDropdownExpanded) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            )
                            ExposedDropdownMenu(
                                expanded = isDropdownExpanded,
                                onDismissRequest = { isDropdownExpanded = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("General / Self Study") },
                                    onClick = {
                                        selectedSubjectId = ""
                                        isDropdownExpanded = false
                                    }
                                )
                                subjects.forEach { sub ->
                                    DropdownMenuItem(
                                        text = { Text("${sub.code} - ${sub.title}") },
                                        onClick = {
                                            selectedSubjectId = sub.id
                                            isDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Task Type Selection Chips
                    Column {
                        Text(
                            text = "Task Category",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            taskTypes.take(3).forEach { type ->
                                FilterChip(
                                    selected = selectedType == type,
                                    onClick = { selectedType = type },
                                    label = { Text(type, fontSize = 12.sp) }
                                )
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            taskTypes.drop(3).forEach { type ->
                                FilterChip(
                                    selected = selectedType == type,
                                    onClick = { selectedType = type },
                                    label = { Text(type, fontSize = 12.sp) }
                                )
                            }
                        }
                    }

                    // Duration Quick Pick
                    Column {
                        Text(
                            text = "Estimated Duration (minutes)",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("15", "30", "45", "60").forEach { minStr ->
                                OutlinedButton(
                                    onClick = { taskMinutes = minStr },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("${minStr}m", fontSize = 12.sp)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = taskMinutes,
                            onValueChange = { taskMinutes = it },
                            label = { Text("Custom minutes") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (taskTitle.isNotBlank()) {
                            val mins = taskMinutes.toIntOrNull()?.coerceIn(5, 480) ?: 30
                            onAddTask(taskTitle, selectedSubjectId, mins, selectedType)
                            showAddTaskDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_task_button")
                ) {
                    Text("Add Task")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTaskDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: CONFIRM DELETE TASK
    if (taskToDelete != null) {
        val task = taskToDelete!!
        AlertDialog(
            onDismissRequest = { taskToDelete = null },
            title = { Text("Delete Task") },
            text = { Text("Are you sure you want to delete \"${task.title}\"?") },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteTask(task.id)
                        taskToDelete = null
                    },
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = RoseDanger
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { taskToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
