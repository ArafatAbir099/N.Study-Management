package com.example.semesterstudyos.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.semesterstudyos.data.StudyRepository
import com.example.semesterstudyos.model.Exam
import com.example.semesterstudyos.model.RevisionRecord
import com.example.semesterstudyos.model.Semester
import com.example.semesterstudyos.model.StudyTask
import com.example.semesterstudyos.model.StudyUnit
import com.example.semesterstudyos.model.Subject
import com.example.semesterstudyos.model.Topic
import com.example.semesterstudyos.model.User
import com.example.semesterstudyos.util.DateUtils
import com.example.semesterstudyos.util.ProgressMath
import com.example.semesterstudyos.util.SyllabusCoverageResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class UiState(
    val currentUser: User = User(),
    val isLoggedIn: Boolean = false,
    val darkTheme: Boolean = true,
    val currentTab: Int = 0, // 0: Dashboard, 1: Subjects, 2: Progress, 3: Tasks/Study, 4: Settings/Exams
    val semesters: List<Semester> = emptyList(),
    val subjects: List<Subject> = emptyList(),
    val units: List<StudyUnit> = emptyList(),
    val topics: List<Topic> = emptyList(),
    val tasks: List<StudyTask> = emptyList(),
    val revisions: List<RevisionRecord> = emptyList(),
    val exams: List<Exam> = emptyList(),
    val syllabusCoverage: SyllabusCoverageResult = SyllabusCoverageResult(0, 0, 0, 0, 0, emptyList(), emptyList()),
    val pomodoroSeconds: Int = 25 * 60,
    val isPomodoroRunning: Boolean = false,
    val pomodoroMode: String = "Focus", // "Focus", "Break"
    val topicFilter: String = "ALL" // "ALL", "COMPLETED", "PENDING"
)

class StudyViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = StudyRepository(application)
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null

    init {
        loadData()
    }

    private fun loadData() {
        val user = repository.getCurrentUser()
        val loggedIn = repository.isLoggedIn()
        val semesters = repository.getSemesters()
        val subjects = repository.getSubjects()
        val units = repository.getUnits()
        val topics = repository.getTopics()
        val tasks = repository.getTasks()
        val revisions = repository.getRevisions()
        val exams = repository.getExams()

        val coverage = ProgressMath.calculateSyllabusCoverage(subjects, units, topics)

        _uiState.update {
            it.copy(
                currentUser = user,
                isLoggedIn = loggedIn,
                semesters = semesters,
                subjects = subjects,
                units = units,
                topics = topics,
                tasks = tasks,
                revisions = revisions,
                exams = exams,
                syllabusCoverage = coverage
            )
        }
    }

    fun selectTab(tab: Int) {
        _uiState.update { it.copy(currentTab = tab) }
    }

    fun toggleDarkMode() {
        _uiState.update { it.copy(darkTheme = !it.darkTheme) }
    }

    fun setTopicFilter(filter: String) {
        _uiState.update { it.copy(topicFilter = filter) }
    }

    // AUTH
    fun login(email: String, name: String, major: String = "Computer Science") {
        val user = _uiState.value.currentUser.copy(
            email = email,
            name = name,
            major = major
        )
        repository.saveCurrentUser(user)
        repository.setLoggedIn(true)
        _uiState.update {
            it.copy(
                currentUser = user,
                isLoggedIn = true
            )
        }
    }

    fun logout() {
        repository.setLoggedIn(false)
        _uiState.update {
            it.copy(isLoggedIn = false)
        }
    }

    // CHAPTER & TOPIC MANAGEMENT
    fun toggleChapterCompletion(unitId: String, isCompleted: Boolean) {
        val today = DateUtils.getTodayString()
        val currentUnits = _uiState.value.units.map { unit ->
            if (unit.id == unitId) {
                unit.copy(
                    isCompleted = isCompleted,
                    completedAt = if (isCompleted) today else null
                )
            } else unit
        }

        // Also update all topics belonging to this chapter to match
        val currentTopics = _uiState.value.topics.map { topic ->
            if (topic.unitId == unitId) {
                topic.copy(
                    isCompleted = isCompleted,
                    completedAt = if (isCompleted) today else null
                )
            } else topic
        }

        repository.saveUnits(currentUnits)
        repository.saveTopics(currentTopics)

        val newCoverage = ProgressMath.calculateSyllabusCoverage(
            _uiState.value.subjects,
            currentUnits,
            currentTopics
        )

        _uiState.update {
            it.copy(
                units = currentUnits,
                topics = currentTopics,
                syllabusCoverage = newCoverage
            )
        }
    }

    fun toggleTopicCompletion(topicId: String, isCompleted: Boolean) {
        val today = DateUtils.getTodayString()
        var targetUnitId: String? = null

        val currentTopics = _uiState.value.topics.map { topic ->
            if (topic.id == topicId) {
                targetUnitId = topic.unitId
                topic.copy(
                    isCompleted = isCompleted,
                    completedAt = if (isCompleted) today else null
                )
            } else topic
        }

        // Check if all topics in this unit are now complete
        val currentUnits = if (targetUnitId != null) {
            val unitTopics = currentTopics.filter { it.unitId == targetUnitId }
            val allComplete = unitTopics.isNotEmpty() && unitTopics.all { it.isCompleted }
            _uiState.value.units.map { unit ->
                if (unit.id == targetUnitId) {
                    unit.copy(
                        isCompleted = allComplete,
                        completedAt = if (allComplete) today else null
                    )
                } else unit
            }
        } else {
            _uiState.value.units
        }

        repository.saveTopics(currentTopics)
        repository.saveUnits(currentUnits)

        val newCoverage = ProgressMath.calculateSyllabusCoverage(
            _uiState.value.subjects,
            currentUnits,
            currentTopics
        )

        _uiState.update {
            it.copy(
                topics = currentTopics,
                units = currentUnits,
                syllabusCoverage = newCoverage
            )
        }
    }

    fun addChapter(subjectId: String, title: String) {
        val subjectUnits = _uiState.value.units.filter { it.subjectId == subjectId }
        val nextUnitNumber = (subjectUnits.maxOfOrNull { it.unitNumber } ?: 0) + 1
        val newUnit = StudyUnit(
            id = "unit_${UUID.randomUUID()}",
            userId = _uiState.value.currentUser.id,
            semesterId = _uiState.value.subjects.find { it.id == subjectId }?.semesterId ?: "sem_1",
            subjectId = subjectId,
            unitNumber = nextUnitNumber,
            title = title.trim(),
            isCompleted = false
        )
        val updatedUnits = _uiState.value.units + newUnit
        repository.saveUnits(updatedUnits)

        val newCoverage = ProgressMath.calculateSyllabusCoverage(
            _uiState.value.subjects,
            updatedUnits,
            _uiState.value.topics
        )

        _uiState.update {
            it.copy(
                units = updatedUnits,
                syllabusCoverage = newCoverage
            )
        }
    }

    fun addTopic(unitId: String, title: String, estimatedMinutes: Int = 45) {
        val newTopic = Topic(
            id = "topic_${UUID.randomUUID()}",
            userId = _uiState.value.currentUser.id,
            unitId = unitId,
            title = title.trim(),
            isCompleted = false,
            estimatedMinutes = estimatedMinutes
        )
        val updatedTopics = _uiState.value.topics + newTopic
        repository.saveTopics(updatedTopics)

        val newCoverage = ProgressMath.calculateSyllabusCoverage(
            _uiState.value.subjects,
            _uiState.value.units,
            updatedTopics
        )

        _uiState.update {
            it.copy(
                topics = updatedTopics,
                syllabusCoverage = newCoverage
            )
        }
    }

    fun addSubject(code: String, title: String, instructor: String, credits: Int, colorHex: String) {
        val semesterId = _uiState.value.semesters.firstOrNull()?.id ?: "sem_fall_2026"
        val newSubject = Subject(
            id = "sub_${UUID.randomUUID()}",
            userId = _uiState.value.currentUser.id,
            semesterId = semesterId,
            code = code.trim().uppercase(),
            title = title.trim(),
            instructor = instructor.trim(),
            credits = credits,
            colorHex = colorHex
        )
        val updatedSubjects = _uiState.value.subjects + newSubject
        repository.saveSubjects(updatedSubjects)

        val newCoverage = ProgressMath.calculateSyllabusCoverage(
            updatedSubjects,
            _uiState.value.units,
            _uiState.value.topics
        )

        _uiState.update {
            it.copy(
                subjects = updatedSubjects,
                syllabusCoverage = newCoverage
            )
        }
    }

    // TASK MANAGEMENT
    fun toggleTask(taskId: String) {
        val today = DateUtils.getTodayString()
        val updatedTasks = _uiState.value.tasks.map { task ->
            if (task.id == taskId) {
                val newComplete = !task.isCompleted
                task.copy(
                    isCompleted = newComplete,
                    completedAt = if (newComplete) today else null
                )
            } else task
        }
        repository.saveTasks(updatedTasks)
        _uiState.update { it.copy(tasks = updatedTasks) }
    }

    fun addTask(title: String, subjectId: String, minutes: Int, taskType: String) {
        val newTask = StudyTask(
            id = "task_${UUID.randomUUID()}",
            userId = _uiState.value.currentUser.id,
            subjectId = subjectId,
            title = title.trim(),
            date = DateUtils.getTodayString(),
            estimatedMinutes = minutes,
            taskType = taskType
        )
        val updatedTasks = _uiState.value.tasks + newTask
        repository.saveTasks(updatedTasks)
        _uiState.update { it.copy(tasks = updatedTasks) }
    }

    fun deleteTask(taskId: String) {
        repository.deleteTask(taskId)
        val updatedTasks = _uiState.value.tasks.filter { it.id != taskId }
        _uiState.update { it.copy(tasks = updatedTasks) }
    }

    fun deleteSubject(subjectId: String) {
        repository.deleteSubject(subjectId)
        loadData()
    }

    fun deleteChapter(unitId: String) {
        repository.deleteUnit(unitId)
        loadData()
    }

    fun deleteTopic(topicId: String) {
        repository.deleteTopic(topicId)
        loadData()
    }

    fun updateProfile(name: String, major: String, semester: String) {
        val updatedUser = _uiState.value.currentUser.copy(
            name = name.trim(),
            major = major.trim(),
            semester = semester.trim()
        )
        repository.saveCurrentUser(updatedUser)
        _uiState.update { it.copy(currentUser = updatedUser) }
    }

    fun clearAllData() {
        repository.clearAllData()
        loadData()
    }

    // REVISION
    fun completeRevision(revisionId: String) {
        val today = DateUtils.getTodayString()
        val updatedRevisions = _uiState.value.revisions.map { rev ->
            if (rev.id == revisionId) {
                rev.copy(
                    isCompleted = true,
                    completedAt = today
                )
            } else rev
        }
        repository.saveRevisions(updatedRevisions)
        _uiState.update { it.copy(revisions = updatedRevisions) }
    }

    // POMODORO TIMER
    fun startPomodoro() {
        if (_uiState.value.isPomodoroRunning) return
        _uiState.update { it.copy(isPomodoroRunning = true) }
        timerJob = viewModelScope.launch {
            while (_uiState.value.isPomodoroRunning && _uiState.value.pomodoroSeconds > 0) {
                delay(1000)
                _uiState.update { it.copy(pomodoroSeconds = it.pomodoroSeconds - 1) }
            }
            if (_uiState.value.pomodoroSeconds <= 0) {
                val nextMode = if (_uiState.value.pomodoroMode == "Focus") "Break" else "Focus"
                val nextSeconds = if (nextMode == "Focus") 25 * 60 else 5 * 60
                _uiState.update {
                    it.copy(
                        isPomodoroRunning = false,
                        pomodoroMode = nextMode,
                        pomodoroSeconds = nextSeconds
                    )
                }
            }
        }
    }

    fun pausePomodoro() {
        timerJob?.cancel()
        _uiState.update { it.copy(isPomodoroRunning = false) }
    }

    fun resetPomodoro() {
        timerJob?.cancel()
        val seconds = if (_uiState.value.pomodoroMode == "Focus") 25 * 60 else 5 * 60
        _uiState.update {
            it.copy(
                isPomodoroRunning = false,
                pomodoroSeconds = seconds
            )
        }
    }

    fun switchPomodoroMode(mode: String) {
        timerJob?.cancel()
        val seconds = if (mode == "Focus") 25 * 60 else 5 * 60
        _uiState.update {
            it.copy(
                isPomodoroRunning = false,
                pomodoroMode = mode,
                pomodoroSeconds = seconds
            )
        }
    }

    fun resetDemoData() {
        repository.resetToDemoData()
        loadData()
    }
}
