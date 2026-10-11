package com.example.semesterstudyos.util

import com.example.semesterstudyos.model.Subject
import com.example.semesterstudyos.model.StudyUnit
import com.example.semesterstudyos.model.Topic

data class TopicProgressDetail(
    val topicId: String,
    val topicTitle: String,
    val unitId: String,
    val unitTitle: String,
    val subjectId: String,
    val subjectCode: String,
    val subjectTitle: String,
    val isCompleted: Boolean,
    val completedAt: String? = null
)

data class SubjectCoverageDetail(
    val subject: Subject,
    val totalChapters: Int,
    val completedChapters: Int,
    val chapterPercentage: Int,
    val totalTopics: Int,
    val completedTopics: Int,
    val topicPercentage: Int
)

data class SyllabusCoverageResult(
    val overallPercentage: Int,
    val totalChapters: Int,
    val completedChapters: Int,
    val totalTopics: Int,
    val completedTopics: Int,
    val subjectDetails: List<SubjectCoverageDetail>,
    val topicDetails: List<TopicProgressDetail>
)

object ProgressMath {

    fun calculateSyllabusCoverage(
        subjects: List<Subject>,
        units: List<StudyUnit>,
        topics: List<Topic>
    ): SyllabusCoverageResult {
        var totalChaptersCount = 0
        var completedChaptersCount = 0
        var totalTopicsCount = 0
        var completedTopicsCount = 0

        val subjectDetails = mutableListOf<SubjectCoverageDetail>()
        val topicProgressList = mutableListOf<TopicProgressDetail>()

        // Map units for quick lookup
        val unitMap = units.associateBy { it.id }
        val subjectMap = subjects.associateBy { it.id }

        // Populate topic progress details
        for (topic in topics) {
            val unit = unitMap[topic.unitId]
            val subject = if (unit != null) subjectMap[unit.subjectId] else null
            if (unit != null && subject != null) {
                topicProgressList.add(
                    TopicProgressDetail(
                        topicId = topic.id,
                        topicTitle = topic.title,
                        unitId = unit.id,
                        unitTitle = "Unit ${unit.unitNumber}: ${unit.title}",
                        subjectId = subject.id,
                        subjectCode = subject.code,
                        subjectTitle = subject.title,
                        isCompleted = topic.isCompleted,
                        completedAt = topic.completedAt
                    )
                )
            }
        }

        // Calculate for each subject
        for (subject in subjects) {
            val subjectUnits = units.filter { it.subjectId == subject.id }
            val unitIds = subjectUnits.map { it.id }.toSet()
            val subjectTopics = topics.filter { unitIds.contains(it.unitId) }

            val totalCh = subjectUnits.size
            // A chapter is completed if its isCompleted is true OR if all its topics are completed (when it has topics)
            val compCh = subjectUnits.count { unit ->
                if (unit.isCompleted) true
                else {
                    val unitTopics = subjectTopics.filter { it.unitId == unit.id }
                    unitTopics.isNotEmpty() && unitTopics.all { it.isCompleted }
                }
            }

            val totalTop = subjectTopics.size
            val compTop = subjectTopics.count { it.isCompleted }

            val chPct = if (totalCh > 0) ((compCh.toFloat() / totalCh) * 100).toInt() else 0
            val topPct = if (totalTop > 0) ((compTop.toFloat() / totalTop) * 100).toInt() else chPct

            totalChaptersCount += totalCh
            completedChaptersCount += compCh
            totalTopicsCount += totalTop
            completedTopicsCount += compTop

            subjectDetails.add(
                SubjectCoverageDetail(
                    subject = subject,
                    totalChapters = totalCh,
                    completedChapters = compCh,
                    chapterPercentage = chPct,
                    totalTopics = totalTop,
                    completedTopics = compTop,
                    topicPercentage = topPct
                )
            )
        }

        // Calculate overall percentage based on topics if available, else chapters
        val overallPct = if (totalTopicsCount > 0) {
            ((completedTopicsCount.toFloat() / totalTopicsCount) * 100).toInt()
        } else if (totalChaptersCount > 0) {
            ((completedChaptersCount.toFloat() / totalChaptersCount) * 100).toInt()
        } else {
            0
        }

        return SyllabusCoverageResult(
            overallPercentage = overallPct.coerceIn(0, 100),
            totalChapters = totalChaptersCount,
            completedChapters = completedChaptersCount,
            totalTopics = totalTopicsCount,
            completedTopics = completedTopicsCount,
            subjectDetails = subjectDetails,
            topicDetails = topicProgressList
        )
    }
}
