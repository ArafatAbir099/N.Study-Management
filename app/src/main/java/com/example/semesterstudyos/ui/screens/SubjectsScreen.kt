package com.example.semesterstudyos.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.semesterstudyos.model.StudyUnit
import com.example.semesterstudyos.model.Subject
import com.example.semesterstudyos.model.Topic
import com.example.semesterstudyos.ui.theme.EmeraldSuccess
import com.example.semesterstudyos.ui.theme.RoseDanger

@Composable
fun SubjectsScreen(
    subjects: List<Subject>,
    units: List<StudyUnit>,
    topics: List<Topic>,
    onToggleChapter: (unitId: String, isCompleted: Boolean) -> Unit,
    onToggleTopic: (topicId: String, isCompleted: Boolean) -> Unit,
    onAddChapter: (subjectId: String, title: String) -> Unit,
    onAddTopic: (unitId: String, title: String) -> Unit,
    onAddSubject: (code: String, title: String, instructor: String, credits: Int, colorHex: String) -> Unit,
    onDeleteSubject: (subjectId: String) -> Unit = {},
    onDeleteChapter: (unitId: String) -> Unit = {},
    onDeleteTopic: (topicId: String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    var selectedSubjectIndex by remember { mutableIntStateOf(0) }
    var showAddSubjectDialog by remember { mutableStateOf(false) }
    var showAddChapterDialog by remember { mutableStateOf(false) }
    var showAddTopicUnitId by remember { mutableStateOf<String?>(null) }
    var subjectToDelete by remember { mutableStateOf<Subject?>(null) }
    var chapterToDelete by remember { mutableStateOf<StudyUnit?>(null) }
    var topicToDelete by remember { mutableStateOf<Topic?>(null) }

    val expandedChapters = remember { mutableStateMapOf<String, Boolean>() }

    val safeIndex = if (subjects.isNotEmpty()) selectedSubjectIndex.coerceIn(0, subjects.lastIndex) else 0
    val currentSubject = subjects.getOrNull(safeIndex)

    val currentUnits = if (currentSubject != null) {
        units.filter { it.subjectId == currentSubject.id }.sortedBy { it.unitNumber }
    } else emptyList()

    val currentUnitIds = currentUnits.map { it.id }.toSet()
    val currentTopics = topics.filter { currentUnitIds.contains(it.unitId) }

    val totalChapters = currentUnits.size
    val completedChapters = currentUnits.count { unit ->
        if (unit.isCompleted) true
        else {
            val unitTops = currentTopics.filter { it.unitId == unit.id }
            unitTops.isNotEmpty() && unitTops.all { it.isCompleted }
        }
    }
    val chapterPercent = if (totalChapters > 0) ((completedChapters.toFloat() / totalChapters) * 100).toInt() else 0

    val totalTopicsCount = currentTopics.size
    val completedTopicsCount = currentTopics.count { it.isCompleted }
    val topicPercent = if (totalTopicsCount > 0) ((completedTopicsCount.toFloat() / totalTopicsCount) * 100).toInt() else chapterPercent

    Box(modifier = modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Subjects & Syllabus",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Structure your semester courses, chapters, and topics",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Button(
                        onClick = { showAddSubjectDialog = true },
                        modifier = Modifier.testTag("add_subject_button")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Subject", fontSize = 13.sp)
                    }
                }
            }

            // EMPTY STATE IF NO SUBJECTS EXIST
            if (subjects.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp)
                            .testTag("empty_subjects_card"),
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
                                    .size(68.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.School,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(38.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Text(
                                text = "No Subjects Added Yet",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            Text(
                                text = "Set up what you need for this semester! Add your courses (like CS 101, Calculus, Physics) and then add chapters to track your syllabus completion.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            Button(
                                onClick = { showAddSubjectDialog = true },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.testTag("add_first_subject_button")
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Add Your First Subject")
                            }
                        }
                    }
                }
            } else {
                // SUBJECT TABS
                item {
                    ScrollableTabRow(
                        selectedTabIndex = safeIndex,
                        edgePadding = 0.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        subjects.forEachIndexed { index, subject ->
                            Tab(
                                selected = safeIndex == index,
                                onClick = { selectedSubjectIndex = index },
                                text = {
                                    Text(
                                        text = subject.code,
                                        fontWeight = if (safeIndex == index) FontWeight.Bold else FontWeight.Normal
                                    )
                                }
                            )
                        }
                    }
                }

                // CURRENT SUBJECT DETAILS
                if (currentSubject != null) {
                    item {
                        val subjectColor = try {
                            Color(android.graphics.Color.parseColor(currentSubject.colorHex))
                        } catch (_: Exception) {
                            MaterialTheme.colorScheme.primary
                        }

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("subject_header_card"),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = currentSubject.title,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = if (currentSubject.instructor.isNotBlank()) {
                                                "Instructor: ${currentSubject.instructor} • ${currentSubject.credits} Credits"
                                            } else {
                                                "${currentSubject.credits} Credits"
                                            },
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(subjectColor.copy(alpha = 0.15f))
                                                .padding(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Text(
                                                text = "$topicPercent% Complete",
                                                fontWeight = FontWeight.Bold,
                                                color = subjectColor,
                                                style = MaterialTheme.typography.labelMedium
                                            )
                                        }

                                        IconButton(
                                            onClick = { subjectToDelete = currentSubject },
                                            modifier = Modifier.testTag("delete_subject_btn")
                                        ) {
                                            Icon(
                                                Icons.Default.Delete,
                                                contentDescription = "Delete Subject",
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "Chapters Done: $completedChapters of $totalChapters",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Topics Done: $completedTopicsCount of $totalTopicsCount",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                LinearProgressIndicator(
                                    progress = { topicPercent / 100f },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp)
                                        .clip(CircleShape),
                                    color = subjectColor,
                                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    OutlinedButton(
                                        onClick = { showAddChapterDialog = true },
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.testTag("add_chapter_btn")
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Add Chapter")
                                    }
                                }
                            }
                        }
                    }

                    // EMPTY STATE FOR CHAPTERS
                    if (currentUnits.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        Icons.Default.MenuBook,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "No Chapters in ${currentSubject.code}",
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Break down this subject into chapters or units to track completion.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Center
                                    )
                                    Spacer(modifier = Modifier.height(14.dp))
                                    Button(onClick = { showAddChapterDialog = true }) {
                                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Add First Chapter")
                                    }
                                }
                            }
                        }
                    } else {
                        // CHAPTER LIST
                        items(currentUnits, key = { it.id }) { unit ->
                            val unitTopics = currentTopics.filter { it.unitId == unit.id }
                            val isExpanded = expandedChapters[unit.id] ?: true
                            val isUnitAllTopicsDone = unitTopics.isNotEmpty() && unitTopics.all { it.isCompleted }
                            val isUnitChecked = unit.isCompleted || isUnitAllTopicsDone

                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("chapter_card_${unit.id}"),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isUnitChecked) {
                                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    }
                                ),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = isUnitChecked,
                                            onCheckedChange = { checked ->
                                                onToggleChapter(unit.id, checked)
                                            },
                                            modifier = Modifier.testTag("chapter_checkbox_${unit.id}")
                                        )

                                        Spacer(modifier = Modifier.width(8.dp))

                                        Column(
                                            modifier = Modifier
                                                .weight(1f)
                                                .clickable {
                                                    expandedChapters[unit.id] = !isExpanded
                                                }
                                        ) {
                                            Text(
                                                text = "Chapter ${unit.unitNumber}: ${unit.title}",
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isUnitChecked) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = "${unitTopics.count { it.isCompleted }}/${unitTopics.size} topics completed",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        IconButton(
                                            onClick = { chapterToDelete = unit },
                                            modifier = Modifier.testTag("delete_chapter_${unit.id}")
                                        ) {
                                            Icon(
                                                Icons.Default.Delete,
                                                contentDescription = "Delete Chapter",
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }

                                        IconButton(
                                            onClick = { expandedChapters[unit.id] = !isExpanded }
                                        ) {
                                            Icon(
                                                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                                contentDescription = if (isExpanded) "Collapse" else "Expand"
                                            )
                                        }
                                    }

                                    // TOPICS EXPANDED SECTION
                                    AnimatedVisibility(visible = isExpanded) {
                                        Column(modifier = Modifier.padding(start = 32.dp, top = 8.dp)) {
                                            unitTopics.forEach { topic ->
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(vertical = 4.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Checkbox(
                                                        checked = topic.isCompleted,
                                                        onCheckedChange = { checked ->
                                                            onToggleTopic(topic.id, checked)
                                                        },
                                                        modifier = Modifier.testTag("topic_checkbox_${topic.id}")
                                                    )
                                                    Spacer(modifier = Modifier.width(8.dp))
                                                    Text(
                                                        text = topic.title,
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        color = if (topic.isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
                                                        modifier = Modifier.weight(1f)
                                                    )
                                                    if (topic.isCompleted) {
                                                        Icon(
                                                            Icons.Default.Check,
                                                            contentDescription = null,
                                                            tint = EmeraldSuccess,
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                    }
                                                    IconButton(
                                                        onClick = { topicToDelete = topic },
                                                        modifier = Modifier.size(32.dp)
                                                    ) {
                                                        Icon(
                                                            Icons.Default.Delete,
                                                            contentDescription = "Delete Topic",
                                                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                    }
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(8.dp))

                                            OutlinedButton(
                                                onClick = { showAddTopicUnitId = unit.id },
                                                modifier = Modifier.testTag("add_topic_${unit.id}")
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Add Topic", fontSize = 12.sp)
                                            }
                                        }
                                    }
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

    // DIALOG: ADD SUBJECT
    if (showAddSubjectDialog) {
        var newCode by remember { mutableStateOf("") }
        var newTitle by remember { mutableStateOf("") }
        var newInstructor by remember { mutableStateOf("") }
        var newCredits by remember { mutableStateOf("3") }
        var selectedColor by remember { mutableStateOf("#6366F1") }

        val colorOptions = listOf(
            "#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"
        )

        AlertDialog(
            onDismissRequest = { showAddSubjectDialog = false },
            title = { Text("Add New Subject", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newCode,
                        onValueChange = { newCode = it },
                        label = { Text("Subject Code (e.g. CS 101, MATH 201)") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_subject_code")
                    )
                    OutlinedTextField(
                        value = newTitle,
                        onValueChange = { newTitle = it },
                        label = { Text("Course Title (e.g. Algorithms)") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_subject_title")
                    )
                    OutlinedTextField(
                        value = newInstructor,
                        onValueChange = { newInstructor = it },
                        label = { Text("Instructor (optional)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newCredits,
                        onValueChange = { newCredits = it },
                        label = { Text("Credits (e.g. 3 or 4)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Color Picker
                    Text("Subject Accent Color", style = MaterialTheme.typography.labelMedium)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        colorOptions.forEach { hex ->
                            val color = Color(android.graphics.Color.parseColor(hex))
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(color)
                                    .clickable { selectedColor = hex }
                                    .padding(4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                if (selectedColor == hex) {
                                    Icon(
                                        Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newCode.isNotBlank() && newTitle.isNotBlank()) {
                            onAddSubject(
                                newCode,
                                newTitle,
                                newInstructor,
                                newCredits.toIntOrNull() ?: 3,
                                selectedColor
                            )
                            showAddSubjectDialog = false
                            selectedSubjectIndex = subjects.size
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_subject")
                ) {
                    Text("Add Subject")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddSubjectDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: ADD CHAPTER
    if (showAddChapterDialog && currentSubject != null) {
        var chapterTitle by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAddChapterDialog = false },
            title = { Text("Add Chapter to ${currentSubject.code}", fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = chapterTitle,
                    onValueChange = { chapterTitle = it },
                    label = { Text("Chapter Title (e.g. Binary Search Trees)") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_chapter_title")
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (chapterTitle.isNotBlank()) {
                            onAddChapter(currentSubject.id, chapterTitle)
                            showAddChapterDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_chapter")
                ) {
                    Text("Add Chapter")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddChapterDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: ADD TOPIC
    if (showAddTopicUnitId != null) {
        var topicTitle by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAddTopicUnitId = null },
            title = { Text("Add Topic to Chapter", fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = topicTitle,
                    onValueChange = { topicTitle = it },
                    label = { Text("Topic Title (e.g. Master Theorem)") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_topic_title")
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (topicTitle.isNotBlank()) {
                            onAddTopic(showAddTopicUnitId!!, topicTitle)
                            showAddTopicUnitId = null
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_topic")
                ) {
                    Text("Add Topic")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTopicUnitId = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: CONFIRM DELETE SUBJECT
    if (subjectToDelete != null) {
        val sub = subjectToDelete!!
        AlertDialog(
            onDismissRequest = { subjectToDelete = null },
            title = { Text("Delete Subject", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to delete ${sub.code} (${sub.title}) and all its chapters and topics?") },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteSubject(sub.id)
                        subjectToDelete = null
                        selectedSubjectIndex = 0
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseDanger)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { subjectToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: CONFIRM DELETE CHAPTER
    if (chapterToDelete != null) {
        val ch = chapterToDelete!!
        AlertDialog(
            onDismissRequest = { chapterToDelete = null },
            title = { Text("Delete Chapter") },
            text = { Text("Are you sure you want to delete Chapter ${ch.unitNumber}: \"${ch.title}\"?") },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteChapter(ch.id)
                        chapterToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseDanger)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { chapterToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: CONFIRM DELETE TOPIC
    if (topicToDelete != null) {
        val top = topicToDelete!!
        AlertDialog(
            onDismissRequest = { topicToDelete = null },
            title = { Text("Delete Topic") },
            text = { Text("Are you sure you want to delete topic \"${top.title}\"?") },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteTopic(top.id)
                        topicToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseDanger)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { topicToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
