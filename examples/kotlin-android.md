# Native Android App (Kotlin + Google Play + Custom Server)

## Tech-Stack
- **Language:** Kotlin (Android SDK)
- **Platform:** Android 7.0+ (API Level 24+)
- **Distribution:** Google Play Store + Custom Update Server
- **Code-Signing:** Google Play App Signing Key
- **Package-Manager:** Gradle, Maven
- **OTA-Updates:** Firebase App Distribution oder custom Solution

## Maturity-Level
**Level 3 (Produktiv)** – Für native Android-Apps mit Play Store + Hotfix-Pipeline

---

## Architektur-Beschreibung

Native Android Apps mit Kotlin können Updates auf zwei Wegen beziehen:
1. **Google Play In-App Updates** – für Major/Minor Releases
2. **Custom Update Server** – für Hotfixes ohne Play Store Review

Das System:
- Prüft beim App-Start auf neue APK
- Verifiziert Signaturen (Code-Signatur)
- Lädt Download herunter (mit Retry-Logik)
- Installiert im Hintergrund oder mit Benachrichtigung
- Rollback bei Installation-Fehler

---

## Code-Snippet: build.gradle (App-Level)

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
    id 'com.google.gms.google-services'
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.example.myapp"
        minSdk 24
        targetSdk 34
        versionCode 42
        versionName "2.1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            signingConfig signingConfigs.release
        }
    }
    
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
}

dependencies {
    // Google Play In-App Updates
    implementation 'com.google.android.play:core:1.10.3'
    
    // Firebase für Remote Config & Crashes
    implementation 'com.google.firebase:firebase-remoteconfig-ktx'
    implementation 'com.google.firebase:firebase-crashlytics-ktx'
    
    // HTTP & Serialization
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1'
}
```

---

## Code-Snippet: Google Play In-App Updates

```kotlin
import android.app.Activity
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus

class UpdateManager(private val activity: Activity) {
    
    private val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(activity)
    private val installStateUpdatedListener = InstallStateUpdatedListener { state ->
        when (state.installStatus) {
            InstallStatus.PENDING -> {
                Log.d("UpdateManager", "Update pending...")
            }
            InstallStatus.DOWNLOADING -> {
                val bytesDownloaded = state.bytesDownloaded()
                val totalBytes = state.totalBytesToDownload()
                val progress = (bytesDownloaded * 100 / totalBytes).toInt()
                notifyDownloadProgress(progress)
            }
            InstallStatus.DOWNLOADED -> {
                Log.d("UpdateManager", "Update downloaded, ready to install")
                promptRestartForUpdateDownloaded()
            }
            InstallStatus.INSTALLING -> {
                Log.d("UpdateManager", "Installing update...")
            }
            InstallStatus.INSTALLED -> {
                Log.d("UpdateManager", "Update successfully installed")
            }
            InstallStatus.FAILED -> {
                Log.e("UpdateManager", "Update installation failed")
            }
            else -> {}
        }
    }
    
    fun checkForUpdates() {
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo
        
        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            val updateAvailable = appUpdateInfo.updateAvailability() == 
                com.google.android.play.core.install.model.UpdateAvailability.UPDATE_AVAILABLE
            
            if (updateAvailable) {
                when {
                    // Flexible Update (Notification-based)
                    appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) -> {
                        startFlexibleUpdate(appUpdateInfo)
                    }
                    // Immediate Update (Full-screen, blocking)
                    appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) -> {
                        startImmediateUpdate(appUpdateInfo)
                    }
                }
            }
        }
    }
    
    private fun startFlexibleUpdate(appUpdateInfo: com.google.android.play.core.appupdate.AppUpdateInfo) {
        appUpdateManager.registerListener(installStateUpdatedListener)
        
        appUpdateManager.startUpdateFlow(
            appUpdateInfo,
            AppUpdateType.FLEXIBLE,
            activity,
            REQUEST_CODE_UPDATE
        )
    }
    
    private fun startImmediateUpdate(appUpdateInfo: com.google.android.play.core.appupdate.AppUpdateInfo) {
        appUpdateManager.startUpdateFlow(
            appUpdateInfo,
            AppUpdateType.IMMEDIATE,
            activity,
            REQUEST_CODE_UPDATE
        )
    }
    
    private fun promptRestartForUpdateDownloaded() {
        appUpdateManager.completeUpdate()
    }
    
    private fun notifyDownloadProgress(progress: Int) {
        Log.d("UpdateManager", "Download progress: $progress%")
        // Update UI progress bar
    }
    
    fun unregisterListener() {
        appUpdateManager.unregisterListener(installStateUpdatedListener)
    }
    
    companion object {
        const val REQUEST_CODE_UPDATE = 123
    }
}
```

---

## Code-Snippet: Custom Update Server (Kotlin)

```kotlin
import okhttp3.OkHttpClient
import okhttp3.Request
import com.google.gson.Gson
import java.security.MessageDigest
import android.content.Context
import android.content.pm.PackageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class UpdateManifest(
    val versionName: String,
    val versionCode: Int,
    val apkUrl: String,
    val checksum: String,
    val changelog: String,
    val isCritical: Boolean
)

class CustomUpdateClient(private val context: Context) {
    
    private val httpClient = OkHttpClient()
    private val gson = Gson()
    private val updateServerUrl = "https://updates.example.com/api/android/latest"
    
    suspend fun checkForUpdates(): UpdateManifest? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(updateServerUrl)
                .addHeader("X-App-Version", getCurrentVersion())
                .addHeader("X-Device-Model", android.os.Build.MODEL)
                .build()
            
            val response = httpClient.newCall(request).execute()
            
            if (response.isSuccessful && response.body != null) {
                val manifest = gson.fromJson(
                    response.body!!.string(),
                    UpdateManifest::class.java
                )
                
                if (isNewerVersion(manifest.versionCode)) {
                    manifest
                } else {
                    null
                }
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("CustomUpdateClient", "Update check failed: ${e.message}")
            null
        }
    }
    
    suspend fun downloadApk(manifest: UpdateManifest, onProgress: (Int) -> Unit): String? = 
        withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(manifest.apkUrl)
                .build()
            
            val response = httpClient.newCall(request).execute()
            
            if (response.isSuccessful && response.body != null) {
                val file = java.io.File(
                    context.externalCacheDir,
                    "update-${manifest.versionCode}.apk"
                )
                
                val body = response.body!!
                val contentLength = body.contentLength()
                var downloadedBytes = 0L
                
                file.outputStream().use { fileOut ->
                    body.byteStream().use { inputStream ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        
                        while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                            fileOut.write(buffer, 0, bytesRead)
                            downloadedBytes += bytesRead
                            val progress = (downloadedBytes * 100 / contentLength).toInt()
                            onProgress(progress)
                        }
                    }
                }
                
                // Verify checksum
                if (verifyChecksum(file, manifest.checksum)) {
                    file.absolutePath
                } else {
                    android.util.Log.e("CustomUpdateClient", "Checksum mismatch!")
                    file.delete()
                    null
                }
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("CustomUpdateClient", "Download failed: ${e.message}")
            null
        }
    }
    
    private fun verifyChecksum(file: java.io.File, expectedChecksum: String): Boolean {
        return try {
            val md = MessageDigest.getInstance("SHA-256")
            val bytes = file.readBytes()
            val actualChecksum = md.digest(bytes).joinToString("") { "%02x".format(it) }
            actualChecksum.equals(expectedChecksum, ignoreCase = true)
        } catch (e: Exception) {
            false
        }
    }
    
    private fun getCurrentVersion(): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(
                context.packageName,
                0
            )
            pInfo.versionName
        } catch (e: PackageManager.NameNotFoundException) {
            "1.0.0"
        }
    }
    
    private fun isNewerVersion(newVersionCode: Int): Boolean {
        return try {
            val pInfo = context.packageManager.getPackageInfo(
                context.packageName,
                0
            )
            newVersionCode > pInfo.versionCode
        } catch (e: PackageManager.NameNotFoundException) {
            true
        }
    }
}
```

---

## Code-Snippet: Installation Manager

```kotlin
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import java.io.File

class ApkInstaller(private val context: Context) {
    
    fun installApk(apkPath: String) {
        val apkFile = File(apkPath)
        
        if (!apkFile.exists()) {
            android.util.Log.e("ApkInstaller", "APK file not found: $apkPath")
            return
        }
        
        val intent = Intent(Intent.ACTION_VIEW)
        
        val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            // Use FileProvider for Android 7+
            FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )
        } else {
            Uri.fromFile(apkFile)
        }
        
        intent.setDataAndType(uri, "application/vnd.android.package-archive")
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        
        context.startActivity(intent)
    }
}
```

---

## Code-Snippet: FileProvider Config (res/xml/file_paths.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-cache-path name="cache" path="." />
    <external-files-path name="files" path="." />
</paths>
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Checksum-Verifikation schlägt fehl** | Netzwerk-Fehler; beschädigte Datei | Retry mit Exponential-Backoff; lokale Hash-Überprüfung |
| **APK-Installation schlägt fehl** | Unknown source blockiert; Signatur falsch | AndroidManifest.permission.REQUEST_INSTALL_PACKAGES; APK mit richtiger Key signieren |
| **In-App Update nicht erkannt** | Alte Play Store Version; Timeout | User auffordern, Play Store zu aktualisieren; Timeout erhöhen |
| **Custom Updates blockiert** | Netzwerk-Timeout; Server unerreichbar | Fallback zu Play Store; Offline-Caching |

---

## Best Practices

1. **Signing:** APK immer mit Keystore signieren vor Release
2. **Gradual Rollout:** Im Play Store Phased Rollout nutzen (5% → 25% → 100%)
3. **Monitoring:** Firebase Crashlytics für Crash-Reports nach Update
4. **Feature Flags:** Firebase Remote Config für Feature-Aktivierung nutzen
5. **Testing:** Update-Flow auf verschiedenen Android-Versionen testen

---

## Links & Tools

- [Google Play In-App Updates](https://developer.android.com/guide/playcore/in-app-updates)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)
- [OkHttp Documentation](https://square.github.io/okhttp/)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)
