package com.example.semesterstudyos.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object DateUtils {
    private val standardFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val displayFormat = SimpleDateFormat("MMM d, yyyy", Locale.getDefault())
    private val shortDisplayFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())

    fun getTodayString(): String {
        return standardFormat.format(Date())
    }

    fun formatDisplayDate(dateStr: String): String {
        return try {
            val date = standardFormat.parse(dateStr) ?: return dateStr
            displayFormat.format(date)
        } catch (_: Exception) {
            dateStr
        }
    }

    fun formatShortDate(dateStr: String): String {
        return try {
            val date = standardFormat.parse(dateStr) ?: return dateStr
            shortDisplayFormat.format(date)
        } catch (_: Exception) {
            dateStr
        }
    }

    fun addDays(dateStr: String, days: Int): String {
        return try {
            val date = standardFormat.parse(dateStr) ?: Date()
            val calendar = Calendar.getInstance().apply {
                time = date
                add(Calendar.DAY_OF_YEAR, days)
            }
            standardFormat.format(calendar.time)
        } catch (_: Exception) {
            dateStr
        }
    }

    fun daysUntil(targetDateStr: String): Long {
        return try {
            val today = standardFormat.parse(getTodayString()) ?: return 0
            val target = standardFormat.parse(targetDateStr) ?: return 0
            val diff = target.time - today.time
            TimeUnit.DAYS.convert(diff, TimeUnit.MILLISECONDS)
        } catch (_: Exception) {
            0
        }
    }
}
