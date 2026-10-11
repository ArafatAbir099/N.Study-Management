package com.example.semesterstudyos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.semesterstudyos.ui.screens.AuthScreen
import com.example.semesterstudyos.ui.screens.DailyStudyScreen
import com.example.semesterstudyos.ui.screens.DashboardScreen
import com.example.semesterstudyos.ui.screens.ProgressScreen
import com.example.semesterstudyos.ui.screens.SettingsScreen
import com.example.semesterstudyos.ui.screens.SubjectsScreen
import com.example.semesterstudyos.ui.theme.SemesterStudyOSTheme
import com.example.semesterstudyos.ui.viewmodel.StudyViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: StudyViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val uiState by viewModel.uiState.collectAsState()

            SemesterStudyOSTheme(darkTheme = uiState.darkTheme) {
                if (!uiState.isLoggedIn) {
                    AuthScreen(
                        onLoginSuccess = { email, name, major ->
                            viewModel.login(email, name, major)
                        }
                    )
                } else {
                    Scaffold(
                        topBar = {
                            TopAppBar(
                                title = {
                                    Text(
                                        text = when (uiState.currentTab) {
                                            0 -> "Study OS Dashboard"
                                            1 -> "Subjects & Syllabus"
                                            2 -> "Academic Progress"
                                            3 -> "Daily Tasks"
                                            else -> "Profile & Settings"
                                        },
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp
                                    )
                                },
                                navigationIcon = {
                                    Box(
                                        modifier = Modifier
                                            .padding(horizontal = 12.dp)
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.primaryContainer),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.School,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                },
                                actions = {
                                    IconButton(
                                        onClick = { viewModel.selectTab(4) },
                                        modifier = Modifier.testTag("topbar_profile_button")
                                    ) {
                                        Icon(
                                            Icons.Default.Person,
                                            contentDescription = "Profile",
                                            tint = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                },
                                colors = TopAppBarDefaults.topAppBarColors(
                                    containerColor = MaterialTheme.colorScheme.background
                                )
                            )
                        },
                        bottomBar = {
                            NavigationBar(
                                modifier = Modifier.testTag("bottom_nav_bar")
                            ) {
                                NavigationBarItem(
                                    selected = uiState.currentTab == 0,
                                    onClick = { viewModel.selectTab(0) },
                                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                                    label = { Text("Overview") }
                                )
                                NavigationBarItem(
                                    selected = uiState.currentTab == 1,
                                    onClick = { viewModel.selectTab(1) },
                                    icon = { Icon(Icons.Default.Book, contentDescription = "Subjects") },
                                    label = { Text("Syllabus") }
                                )
                                NavigationBarItem(
                                    selected = uiState.currentTab == 2,
                                    onClick = { viewModel.selectTab(2) },
                                    icon = { Icon(Icons.Default.BarChart, contentDescription = "Progress") },
                                    label = { Text("Progress") }
                                )
                                NavigationBarItem(
                                    selected = uiState.currentTab == 3,
                                    onClick = { viewModel.selectTab(3) },
                                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Daily Tasks") },
                                    label = { Text("Daily Tasks") }
                                )
                                NavigationBarItem(
                                    selected = uiState.currentTab == 4,
                                    onClick = { viewModel.selectTab(4) },
                                    icon = { Icon(Icons.Default.Person, contentDescription = "Settings") },
                                    label = { Text("Profile") }
                                )
                            }
                        }
                    ) { paddingValues ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(paddingValues)
                        ) {
                            when (uiState.currentTab) {
                                0 -> DashboardScreen(
                                    user = uiState.currentUser,
                                    coverage = uiState.syllabusCoverage,
                                    tasks = uiState.tasks,
                                    exams = uiState.exams,
                                    onNavigateToSubjects = { viewModel.selectTab(1) },
                                    onNavigateToProgress = { viewModel.selectTab(2) },
                                    onNavigateToTasks = { viewModel.selectTab(3) },
                                    onToggleTask = { viewModel.toggleTask(it) }
                                )
                                1 -> SubjectsScreen(
                                    subjects = uiState.subjects,
                                    units = uiState.units,
                                    topics = uiState.topics,
                                    onToggleChapter = { unitId, completed ->
                                        viewModel.toggleChapterCompletion(unitId, completed)
                                    },
                                    onToggleTopic = { topicId, completed ->
                                        viewModel.toggleTopicCompletion(topicId, completed)
                                    },
                                    onAddChapter = { subjectId, title ->
                                        viewModel.addChapter(subjectId, title)
                                    },
                                    onAddTopic = { unitId, title ->
                                        viewModel.addTopic(unitId, title)
                                    },
                                    onAddSubject = { code, title, instructor, credits, colorHex ->
                                        viewModel.addSubject(code, title, instructor, credits, colorHex)
                                    },
                                    onDeleteSubject = { viewModel.deleteSubject(it) },
                                    onDeleteChapter = { viewModel.deleteChapter(it) },
                                    onDeleteTopic = { viewModel.deleteTopic(it) }
                                )
                                2 -> ProgressScreen(
                                    coverage = uiState.syllabusCoverage,
                                    onToggleTopic = { topicId, completed ->
                                        viewModel.toggleTopicCompletion(topicId, completed)
                                    }
                                )
                                3 -> DailyStudyScreen(
                                    tasks = uiState.tasks,
                                    revisions = uiState.revisions,
                                    subjects = uiState.subjects,
                                    pomodoroSeconds = uiState.pomodoroSeconds,
                                    isPomodoroRunning = uiState.isPomodoroRunning,
                                    pomodoroMode = uiState.pomodoroMode,
                                    onStartPomodoro = { viewModel.startPomodoro() },
                                    onPausePomodoro = { viewModel.pausePomodoro() },
                                    onResetPomodoro = { viewModel.resetPomodoro() },
                                    onSwitchPomodoroMode = { viewModel.switchPomodoroMode(it) },
                                    onToggleTask = { viewModel.toggleTask(it) },
                                    onAddTask = { title, subId, mins, type ->
                                        viewModel.addTask(title, subId, mins, type)
                                    },
                                    onDeleteTask = { viewModel.deleteTask(it) },
                                    onCompleteRevision = { viewModel.completeRevision(it) }
                                )
                                4 -> SettingsScreen(
                                    user = uiState.currentUser,
                                    darkTheme = uiState.darkTheme,
                                    onToggleDarkTheme = { viewModel.toggleDarkMode() },
                                    onLogout = { viewModel.logout() },
                                    onResetDemoData = { viewModel.resetDemoData() },
                                    onClearAllData = { viewModel.clearAllData() },
                                    onUpdateProfile = { name, major, sem -> viewModel.updateProfile(name, major, sem) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
