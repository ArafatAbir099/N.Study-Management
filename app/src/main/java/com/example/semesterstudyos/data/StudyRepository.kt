package com.example.semesterstudyos.data

import android.content.Context
import android.content.SharedPreferences
import com.example.semesterstudyos.model.Exam
import com.example.semesterstudyos.model.RevisionRecord
import com.example.semesterstudyos.model.Semester
import com.example.semesterstudyos.model.StudyTask
import com.example.semesterstudyos.model.StudyUnit
import com.example.semesterstudyos.model.Subject
import com.example.semesterstudyos.model.Topic
import com.example.semesterstudyos.model.User
import com.example.semesterstudyos.util.DateUtils
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class StudyRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("semester_study_os_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
        private const val KEY_CURRENT_USER = "key_current_user"
        private const val KEY_SEMESTERS = "key_semesters"
        private const val KEY_SUBJECTS = "key_subjects"
        private const val KEY_UNITS = "key_units"
        private const val KEY_TOPICS = "key_topics"
        private const val KEY_TASKS = "key_tasks"
        private const val KEY_REVISIONS = "key_revisions"
        private const val KEY_EXAMS = "key_exams"
        private const val KEY_BLANK_INIT = "key_blank_data_initialized_v3"
    }

    init {
        // Migration & Fresh Install: Ensure all data is BLANK when user installs or updates app
        if (!prefs.getBoolean(KEY_BLANK_INIT, false)) {
            prefs.edit()
                .remove(KEY_SUBJECTS)
                .remove(KEY_UNITS)
                .remove(KEY_TOPICS)
                .remove(KEY_TASKS)
                .remove(KEY_REVISIONS)
                .remove(KEY_EXAMS)
                .remove(KEY_SEMESTERS)
                .putBoolean(KEY_BLANK_INIT, true)
                .apply()
        }
    }

    // AUTH
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    fun setLoggedIn(loggedIn: Boolean) {
        prefs.edit().putBoolean(KEY_IS_LOGGED_IN, loggedIn).apply()
    }

    fun getCurrentUser(): User {
        val json = prefs.getString(KEY_CURRENT_USER, null) ?: return User()
        return try {
            gson.fromJson(json, User::class.java)
        } catch (_: Exception) {
            User()
        }
    }

    fun saveCurrentUser(user: User) {
        prefs.edit().putString(KEY_CURRENT_USER, gson.toJson(user)).apply()
    }

    // SEMESTERS
    fun getSemesters(): List<Semester> {
        val json = prefs.getString(KEY_SEMESTERS, null) ?: return emptyList()
        val type = object : TypeToken<List<Semester>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveSemesters(semesters: List<Semester>) {
        prefs.edit().putString(KEY_SEMESTERS, gson.toJson(semesters)).apply()
    }

    // SUBJECTS
    fun getSubjects(): List<Subject> {
        val json = prefs.getString(KEY_SUBJECTS, null) ?: return emptyList()
        val type = object : TypeToken<List<Subject>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveSubjects(subjects: List<Subject>) {
        prefs.edit().putString(KEY_SUBJECTS, gson.toJson(subjects)).apply()
    }

    // UNITS / CHAPTERS
    fun getUnits(): List<StudyUnit> {
        val json = prefs.getString(KEY_UNITS, null) ?: return emptyList()
        val type = object : TypeToken<List<StudyUnit>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveUnits(units: List<StudyUnit>) {
        prefs.edit().putString(KEY_UNITS, gson.toJson(units)).apply()
    }

    // TOPICS
    fun getTopics(): List<Topic> {
        val json = prefs.getString(KEY_TOPICS, null) ?: return emptyList()
        val type = object : TypeToken<List<Topic>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveTopics(topics: List<Topic>) {
        prefs.edit().putString(KEY_TOPICS, gson.toJson(topics)).apply()
    }

    // TASKS
    fun getTasks(): List<StudyTask> {
        val json = prefs.getString(KEY_TASKS, null) ?: return emptyList()
        val type = object : TypeToken<List<StudyTask>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveTasks(tasks: List<StudyTask>) {
        prefs.edit().putString(KEY_TASKS, gson.toJson(tasks)).apply()
    }

    // REVISIONS
    fun getRevisions(): List<RevisionRecord> {
        val json = prefs.getString(KEY_REVISIONS, null) ?: return emptyList()
        val type = object : TypeToken<List<RevisionRecord>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveRevisions(revisions: List<RevisionRecord>) {
        prefs.edit().putString(KEY_REVISIONS, gson.toJson(revisions)).apply()
    }

    // EXAMS
    fun getExams(): List<Exam> {
        val json = prefs.getString(KEY_EXAMS, null) ?: return emptyList()
        val type = object : TypeToken<List<Exam>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun saveExams(exams: List<Exam>) {
        prefs.edit().putString(KEY_EXAMS, gson.toJson(exams)).apply()
    }

    fun clearAllData() {
        prefs.edit()
            .remove(KEY_SUBJECTS)
            .remove(KEY_UNITS)
            .remove(KEY_TOPICS)
            .remove(KEY_TASKS)
            .remove(KEY_REVISIONS)
            .remove(KEY_EXAMS)
            .remove(KEY_SEMESTERS)
            .apply()
    }

    fun deleteTask(taskId: String) {
        val updated = getTasks().filter { it.id != taskId }
        saveTasks(updated)
    }

    fun deleteSubject(subjectId: String) {
        saveSubjects(getSubjects().filter { it.id != subjectId })
        val unitsToDelete = getUnits().filter { it.subjectId == subjectId }.map { it.id }.toSet()
        saveUnits(getUnits().filter { it.subjectId != subjectId })
        saveTopics(getTopics().filter { it.unitId !in unitsToDelete })
        saveTasks(getTasks().filter { it.subjectId != subjectId })
        saveRevisions(getRevisions().filter { it.subjectId != subjectId })
        saveExams(getExams().filter { it.subjectId != subjectId })
    }

    fun deleteUnit(unitId: String) {
        saveUnits(getUnits().filter { it.id != unitId })
        saveTopics(getTopics().filter { it.unitId != unitId })
        saveTasks(getTasks().filter { it.unitId != unitId })
        saveRevisions(getRevisions().filter { it.unitId != unitId })
    }

    fun deleteTopic(topicId: String) {
        saveTopics(getTopics().filter { it.id != topicId })
        saveTasks(getTasks().filter { it.topicId != topicId })
        saveRevisions(getRevisions().filter { it.topicId != topicId })
    }

    fun resetToDemoData() {
        seedDefaultData()
    }

    private fun seedDefaultData() {
        val today = DateUtils.getTodayString()
        val defaultUser = User(
            id = "user_alex",
            email = "alex.taylor@university.edu",
            name = "Alex Taylor",
            major = "Computer Science",
            semester = "Fall 2026"
        )
        saveCurrentUser(defaultUser)

        val semester = Semester(
            id = "sem_fall_2026",
            userId = defaultUser.id,
            title = "Fall Semester 2026",
            startDate = "2026-09-01",
            endDate = "2026-12-20",
            isCurrent = true
        )
        saveSemesters(listOf(semester))

        val s1 = Subject(
            id = "sub_cs301",
            userId = defaultUser.id,
            semesterId = semester.id,
            code = "CS 301",
            title = "Data Structures & Algorithms",
            instructor = "Dr. Michael Chen",
            credits = 4,
            colorHex = "#6366F1",
            targetScore = "A"
        )
        val s2 = Subject(
            id = "sub_math220",
            userId = defaultUser.id,
            semesterId = semester.id,
            code = "MATH 220",
            title = "Discrete Mathematics & Linear Algebra",
            instructor = "Prof. Elena Rostova",
            credits = 4,
            colorHex = "#0EA5E9",
            targetScore = "A"
        )
        val s3 = Subject(
            id = "sub_cs330",
            userId = defaultUser.id,
            semesterId = semester.id,
            code = "CS 330",
            title = "Computer Systems & Architecture",
            instructor = "Dr. Robert Vance",
            credits = 3,
            colorHex = "#10B981",
            targetScore = "A-"
        )
        val s4 = Subject(
            id = "sub_phys102",
            userId = defaultUser.id,
            semesterId = semester.id,
            code = "PHYS 102",
            title = "Electromagnetism & Waves",
            instructor = "Dr. Sarah Adams",
            credits = 3,
            colorHex = "#F59E0B",
            targetScore = "B+"
        )
        saveSubjects(listOf(s1, s2, s3, s4))

        // Units / Chapters for CS 301
        val u1_1 = StudyUnit("u1_1", defaultUser.id, semester.id, s1.id, 1, "Asymptotic Analysis & Big-O", isCompleted = true, completedAt = today)
        val u1_2 = StudyUnit("u1_2", defaultUser.id, semester.id, s1.id, 2, "Binary Search Trees & AVL Trees", isCompleted = true, completedAt = today)
        val u1_3 = StudyUnit("u1_3", defaultUser.id, semester.id, s1.id, 3, "Graph Algorithms & BFS/DFS", isCompleted = false)
        val u1_4 = StudyUnit("u1_4", defaultUser.id, semester.id, s1.id, 4, "Dynamic Programming & Memoization", isCompleted = false)

        // Units for MATH 220
        val u2_1 = StudyUnit("u2_1", defaultUser.id, semester.id, s2.id, 1, "Propositional Logic & Proof Methods", isCompleted = true, completedAt = today)
        val u2_2 = StudyUnit("u2_2", defaultUser.id, semester.id, s2.id, 2, "Matrix Vector Spaces & Eigenvalues", isCompleted = false)
        val u2_3 = StudyUnit("u2_3", defaultUser.id, semester.id, s2.id, 3, "Graph Theory & Combinatorics", isCompleted = false)

        // Units for CS 330
        val u3_1 = StudyUnit("u3_1", defaultUser.id, semester.id, s3.id, 1, "MIPS Instruction Set Architecture", isCompleted = true, completedAt = today)
        val u3_2 = StudyUnit("u3_2", defaultUser.id, semester.id, s3.id, 2, "Pipelining & Branch Hazards", isCompleted = false)
        val u3_3 = StudyUnit("u3_3", defaultUser.id, semester.id, s3.id, 3, "Cache Hierarchy & Virtual Memory", isCompleted = false)

        // Units for PHYS 102
        val u4_1 = StudyUnit("u4_1", defaultUser.id, semester.id, s4.id, 1, "Coulomb's Law & Gauss Law", isCompleted = false)
        val u4_2 = StudyUnit("u4_2", defaultUser.id, semester.id, s4.id, 2, "Magnetic Fields & Ampere's Law", isCompleted = false)

        saveUnits(listOf(u1_1, u1_2, u1_3, u1_4, u2_1, u2_2, u2_3, u3_1, u3_2, u3_3, u4_1, u4_2))

        // Topics
        val topics = listOf(
            // CS 301
            Topic("t1", defaultUser.id, u1_1.id, "Worst, Best & Average Case Definitions", isCompleted = true, completedAt = today),
            Topic("t2", defaultUser.id, u1_1.id, "Master Theorem for Divide & Conquer", isCompleted = true, completedAt = today),
            Topic("t3", defaultUser.id, u1_2.id, "BST Insertion, Search & Deletion", isCompleted = true, completedAt = today),
            Topic("t4", defaultUser.id, u1_2.id, "AVL Rotations (LL, RR, LR, RL)", isCompleted = true, completedAt = today),
            Topic("t5", defaultUser.id, u1_3.id, "Breadth-First Search (Queue)", isCompleted = true, completedAt = today),
            Topic("t6", defaultUser.id, u1_3.id, "Dijkstra's Shortest Path Algorithm", isCompleted = false),
            Topic("t7", defaultUser.id, u1_3.id, "Kruskal & Prim MST", isCompleted = false),
            Topic("t8", defaultUser.id, u1_4.id, "0/1 Knapsack Problem", isCompleted = false),
            Topic("t9", defaultUser.id, u1_4.id, "Longest Common Subsequence (LCS)", isCompleted = false),

            // MATH 220
            Topic("t10", defaultUser.id, u2_1.id, "Truth Tables & Logical Equivalences", isCompleted = true, completedAt = today),
            Topic("t11", defaultUser.id, u2_1.id, "Mathematical Induction & Strong Induction", isCompleted = true, completedAt = today),
            Topic("t12", defaultUser.id, u2_2.id, "Gaussian Elimination & Row Echelon", isCompleted = false),
            Topic("t13", defaultUser.id, u2_2.id, "Determinants & Inverses", isCompleted = false),
            Topic("t14", defaultUser.id, u2_3.id, "Permutations & Combinations (Pigeonhole)", isCompleted = false),

            // CS 330
            Topic("t15", defaultUser.id, u3_1.id, "R-type, I-type & J-type Instruction Formats", isCompleted = true, completedAt = today),
            Topic("t16", defaultUser.id, u3_1.id, "Register File & ALU Data Path", isCompleted = true, completedAt = today),
            Topic("t17", defaultUser.id, u3_2.id, "5-Stage Pipeline Hazard Detection", isCompleted = false),
            Topic("t18", defaultUser.id, u3_3.id, "Direct Mapped vs Set Associative Caches", isCompleted = false),

            // PHYS 102
            Topic("t19", defaultUser.id, u4_1.id, "Electric Flux & Spherical Gauss Surfaces", isCompleted = false),
            Topic("t20", defaultUser.id, u4_1.id, "Electric Potential of Point Charges", isCompleted = false),
            Topic("t21", defaultUser.id, u4_2.id, "Biot-Savart Law for Wire Loops", isCompleted = false)
        )
        saveTopics(topics)

        // Today's Study Tasks
        val tasks = listOf(
            StudyTask("tsk_1", defaultUser.id, s1.id, u1_3.id, "t6", "Review Dijkstra's Shortest Path proof", today, 45, isCompleted = false, taskType = "Study"),
            StudyTask("tsk_2", defaultUser.id, s2.id, u2_2.id, "t12", "Practice 5 Gaussian Elimination problems", today, 40, isCompleted = false, taskType = "Assignment"),
            StudyTask("tsk_3", defaultUser.id, s3.id, u3_2.id, "t17", "Read Chapter 4 on Pipelining Hazards", today, 30, isCompleted = true, completedAt = today, taskType = "Study")
        )
        saveTasks(tasks)

        // Spaced Repetition Revisions
        val revisions = listOf(
            RevisionRecord("rev_1", defaultUser.id, s1.id, u1_2.id, "t4", scheduledDate = today, intervalIndex = 3, isCompleted = false, rating = "Good"),
            RevisionRecord("rev_2", defaultUser.id, s2.id, u2_1.id, "t11", scheduledDate = today, intervalIndex = 7, isCompleted = false, rating = "Easy"),
            RevisionRecord("rev_3", defaultUser.id, s3.id, u3_1.id, "t15", scheduledDate = DateUtils.addDays(today, 2), intervalIndex = 14, isCompleted = false, rating = "Good")
        )
        saveRevisions(revisions)

        // Exams
        val exams = listOf(
            Exam("ex_1", defaultUser.id, s1.id, "Midterm Exam (Algorithms & Trees)", DateUtils.addDays(today, 8), "Auditorium 101", 30, "A"),
            Exam("ex_2", defaultUser.id, s2.id, "Linear Algebra Quiz 2", DateUtils.addDays(today, 12), "Room 204", 15, "A"),
            Exam("ex_3", defaultUser.id, s3.id, "Systems Architecture Midterm", DateUtils.addDays(today, 19), "Hall B", 35, "A-")
        )
        saveExams(exams)
    }
}
