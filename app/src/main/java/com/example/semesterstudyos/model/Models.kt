package com.example.semesterstudyos.model

import java.io.Serializable

data class User(
    val id: String = "user_default",
    val email: String = "",
    val name: String = "Student",
    val major: String = "University Studies",
    val semester: String = "Current Semester",
    val avatarUrl: String = ""
) : Serializable

data class Semester(
    val id: String,
    val userId: String,
    val title: String,
    val startDate: String,
    val endDate: String,
    val isCurrent: Boolean = true
) : Serializable

data class Subject(
    val id: String,
    val userId: String,
    val semesterId: String,
    val code: String,
    val title: String,
    val instructor: String = "",
    val credits: Int = 3,
    val colorHex: String = "#6366F1",
    val targetScore: String = "A",
    val createdAt: String = ""
) : Serializable

data class StudyUnit(
    val id: String,
    val userId: String,
    val semesterId: String,
    val subjectId: String,
    val unitNumber: Int,
    val title: String,
    val isCompleted: Boolean = false,
    val completedAt: String? = null
) : Serializable

data class Topic(
    val id: String,
    val userId: String,
    val unitId: String,
    val title: String,
    val isCompleted: Boolean = false,
    val completedAt: String? = null,
    val estimatedMinutes: Int = 45,
    val difficulty: String = "Medium" // "Easy", "Medium", "Hard"
) : Serializable

data class StudyTask(
    val id: String,
    val userId: String,
    val subjectId: String,
    val unitId: String? = null,
    val topicId: String? = null,
    val title: String,
    val date: String,
    val estimatedMinutes: Int = 30,
    val isCompleted: Boolean = false,
    val completedAt: String? = null,
    val taskType: String = "Study" // "Study", "Revision", "Assignment", "Exam Prep"
) : Serializable

data class RevisionRecord(
    val id: String,
    val userId: String,
    val subjectId: String,
    val unitId: String,
    val topicId: String? = null,
    val scheduledDate: String,
    val intervalIndex: Int = 1, // 1, 3, 7, 14, 30 days
    val isCompleted: Boolean = false,
    val completedAt: String? = null,
    val rating: String = "Good" // "Hard", "Good", "Easy"
) : Serializable

data class Exam(
    val id: String,
    val userId: String,
    val subjectId: String,
    val title: String,
    val date: String,
    val location: String = "Hall B",
    val weightPercentage: Int = 30,
    val targetGrade: String = "A"
) : Serializable
