package com.example.semesterstudyos.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.semesterstudyos.model.User
import com.example.semesterstudyos.ui.theme.RoseDanger

@Composable
fun SettingsScreen(
    user: User,
    darkTheme: Boolean,
    onToggleDarkTheme: () -> Unit,
    onLogout: () -> Unit,
    onResetDemoData: () -> Unit,
    onClearAllData: () -> Unit = {},
    onUpdateProfile: (name: String, major: String, semester: String) -> Unit = { _, _, _ -> },
    modifier: Modifier = Modifier
) {
    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showConfirmClearDialog by remember { mutableStateOf(false) }
    var showConfirmDemoDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Profile & Settings",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Manage your profile, theme, and workspace data",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // USER PROFILE CARD
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("user_profile_card"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = user.name.ifBlank { "Student" },
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            if (user.email.isNotBlank()) {
                                Text(
                                    text = user.email,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text(
                                text = "${user.major} • ${user.semester}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        IconButton(onClick = { showEditProfileDialog = true }) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Edit Profile",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showEditProfileDialog = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Edit Profile")
                        }

                        Button(
                            onClick = onLogout,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = RoseDanger.copy(alpha = 0.12f),
                                contentColor = RoseDanger
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("sign_out_button"),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.ExitToApp, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Sign Out", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // PREFERENCES
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.DarkMode, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Dark Theme", fontWeight = FontWeight.SemiBold)
                                Text("Toggle day/night theme", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = darkTheme,
                            onCheckedChange = { onToggleDarkTheme() }
                        )
                    }
                }
            }
        }

        // DATA MANAGEMENT
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Workspace Data",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Customize your syllabus and daily tasks. You can clear all data to start completely blank, or load sample data.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    OutlinedButton(
                        onClick = { showConfirmClearDialog = true },
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = RoseDanger
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("clear_all_data_button"),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Clear All Data (Start Blank)")
                    }

                    OutlinedButton(
                        onClick = { showConfirmDemoDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("load_sample_data_button"),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Load Sample Course & Tasks Data")
                    }
                }
            }
        }

        // APP INFO / APK DOWNLOAD INFO
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.School, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Semester Study OS", fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Native Android APK • Build 1.1.0",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "To install and use this application on your mobile phone, open the AI Studio top bar settings/download menu and choose 'Generate APK' or export project.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }

    // DIALOG: EDIT PROFILE
    if (showEditProfileDialog) {
        var newName by remember { mutableStateOf(user.name) }
        var newMajor by remember { mutableStateOf(user.major) }
        var newSemester by remember { mutableStateOf(user.semester) }

        AlertDialog(
            onDismissRequest = { showEditProfileDialog = false },
            title = { Text("Edit Student Profile", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        label = { Text("Your Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newMajor,
                        onValueChange = { newMajor = it },
                        label = { Text("Major / Program (e.g. Computer Science)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newSemester,
                        onValueChange = { newSemester = it },
                        label = { Text("Semester (e.g. Fall 2026, Semester 2)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateProfile(newName, newMajor, newSemester)
                        showEditProfileDialog = false
                    }
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditProfileDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: CONFIRM CLEAR ALL DATA
    if (showConfirmClearDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmClearDialog = false },
            title = { Text("Clear All Data?", fontWeight = FontWeight.Bold) },
            text = {
                Text("This will remove all subjects, chapters, topics, daily tasks, and reviews so you can start with a completely blank workspace. This action cannot be undone.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        onClearAllData()
                        showConfirmClearDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseDanger)
                ) {
                    Text("Clear All")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmClearDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // DIALOG: CONFIRM LOAD DEMO DATA
    if (showConfirmDemoDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDemoDialog = false },
            title = { Text("Load Sample Data?", fontWeight = FontWeight.Bold) },
            text = {
                Text("This will replace current items with sample university courses (Algorithms, Calculus, Systems) and daily tasks.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        onResetDemoData()
                        showConfirmDemoDialog = false
                    }
                ) {
                    Text("Load Sample Data")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDemoDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
