package ru.grudnyaks.cosmodragon;

import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Обновление по воздуху.
 * 1) Игра (web.zip) скачивается тихо и применяется при следующем открытии/по кнопке.
 * 2) Новый APK — по согласию взрослого через системный установщик.
 * Файлы берутся из последнего релиза репозитория GitHub.
 */
public class Updater {
    static final String TAG = "CosmoUpdater";
    static final String BASE = "https://github.com/grudnyaks/cosmodragon/releases/latest/download/";
    static final String PREFS = "updater";

    final MainActivity act;
    final java.util.concurrent.atomic.AtomicBoolean running = new java.util.concurrent.atomic.AtomicBoolean(false);
    volatile long lastCheck = 0;
    volatile String lastError = "";
    volatile String lastResult = "ещё не проверялось";
    volatile int remoteWeb = 0, remoteApk = 0;
    long apkAskedAt = 0;

    Updater(MainActivity act) {
        this.act = act;
    }

    static File webDir(Context c) {
        return new File(c.getFilesDir(), "web");
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static int bundledCache = -1;

    static int bundledWebVersion(Context c) {
        if (bundledCache >= 0) return bundledCache;
        try (InputStream in = c.getAssets().open("web/version.json")) {
            bundledCache = new JSONObject(new String(readAll(in), StandardCharsets.UTF_8)).optInt("web", 0);
        } catch (Exception e) {
            bundledCache = 0;
        }
        return bundledCache;
    }

    static int downloadedWebVersion(Context c) {
        return prefs(c).getInt("web", 0);
    }

    /** Использовать скачанную игру, только если она новее встроенной в APK. */
    static boolean useDownloaded(Context c) {
        return downloadedWebVersion(c) > bundledWebVersion(c) && new File(webDir(c), "index.html").isFile();
    }

    /** Проверка не чаще раза в 3 минуты (вызывается при запуске и при каждом возвращении в игру). */
    void checkAsync(boolean force) {
        long now = System.currentTimeMillis();
        if (!force && now - lastCheck < 3 * 60 * 1000) return;
        if (!running.compareAndSet(false, true)) return;
        lastCheck = now;
        new Thread(() -> {
            try {
                check();
                lastError = "";
            } catch (Exception e) {
                Log.w(TAG, "update check failed", e);
                lastError = e.getClass().getSimpleName() + ": " + e.getMessage();
                lastResult = "ошибка проверки";
            } finally {
                running.set(false);
            }
        }, "updater").start();
    }

    /** Сведения для экрана настроек в игре. */
    String infoJson() {
        try {
            JSONObject j = new JSONObject();
            j.put("apk", BuildConfig.VERSION_CODE);
            j.put("apkName", BuildConfig.VERSION_NAME);
            j.put("webBundled", bundledWebVersion(act));
            j.put("webDownloaded", downloadedWebVersion(act));
            j.put("webActive", useDownloaded(act) ? downloadedWebVersion(act) : bundledWebVersion(act));
            j.put("remoteWeb", remoteWeb);
            j.put("remoteApk", remoteApk);
            j.put("lastCheck", lastCheck);
            j.put("result", lastResult);
            j.put("error", lastError);
            return j.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    void check() throws Exception {
        String body = new String(httpGet(BASE + "version.json"), StandardCharsets.UTF_8);
        JSONObject j = new JSONObject(body);
        remoteWeb = j.optInt("web", 0);
        remoteApk = j.optInt("apk", 0);
        int minApk = j.optInt("minApk", 0);
        String apkUrl = j.optString("apkUrl", BASE + "cosmodragon.apk");

        if (remoteApk > BuildConfig.VERSION_CODE) {
            act.runOnUiThread(() -> askApkUpdate(apkUrl));
        }
        int current = Math.max(bundledWebVersion(act), downloadedWebVersion(act));
        if (remoteWeb > current && BuildConfig.VERSION_CODE >= minApk) {
            lastResult = "скачиваю игру " + remoteWeb;
            downloadWeb(remoteWeb);
            lastResult = "игра обновлена до " + remoteWeb;
        } else if (remoteWeb > current) {
            lastResult = "игре " + remoteWeb + " нужен новый APK";
        } else {
            lastResult = "последняя версия";
        }
    }

    void downloadWeb(int version) throws IOException {
        File zip = new File(act.getCacheDir(), "web.zip");
        download(BASE + "web.zip", zip);
        File tmp = new File(act.getFilesDir(), "web_new");
        deleteRec(tmp);
        unzip(zip, tmp);
        zip.delete();
        if (!new File(tmp, "index.html").isFile()) throw new IOException("bad bundle");
        File dst = webDir(act);
        File old = new File(act.getFilesDir(), "web_old");
        deleteRec(old);
        if (dst.exists() && !dst.renameTo(old)) deleteRec(dst);
        if (!tmp.renameTo(dst)) throw new IOException("rename failed");
        deleteRec(old);
        prefs(act).edit().putInt("web", version).apply();
        Log.i(TAG, "web updated to " + version);
        act.notifyUpdateReady();
    }

    // ---------- Обновление APK ----------
    void askApkUpdate(String url) {
        if (act.isFinishing()) return;
        long now = System.currentTimeMillis();
        if (now - apkAskedAt < 30 * 60 * 1000) return;
        apkAskedAt = now;
        new AlertDialog.Builder(act)
                .setTitle("Новая версия Космодракона")
                .setMessage("Доступна новая версия приложения. Скачать и установить?")
                .setPositiveButton("Обновить", (d, w) -> startApkUpdate(url))
                .setNegativeButton("Позже", null)
                .show();
    }

    void startApkUpdate(String url) {
        if (Build.VERSION.SDK_INT >= 26 && !act.getPackageManager().canRequestPackageInstalls()) {
            Toast.makeText(act, "Разрешите установку из этого приложения и нажмите «Обновить» ещё раз", Toast.LENGTH_LONG).show();
            try {
                act.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + act.getPackageName())));
            } catch (Exception e) {
                openInBrowser(url);
            }
            return;
        }
        Toast.makeText(act, "Скачиваю обновление…", Toast.LENGTH_LONG).show();
        new Thread(() -> {
            try {
                File apk = new File(act.getCacheDir(), "update.apk");
                download(url, apk);
                installApk(apk);
            } catch (Exception e) {
                Log.w(TAG, "apk update failed", e);
                act.runOnUiThread(() -> openInBrowser(url));
            }
        }, "apk-update").start();
    }

    void installApk(File apk) throws IOException {
        PackageInstaller pi = act.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(act.getPackageName());
        int id = pi.createSession(params);
        try (PackageInstaller.Session session = pi.openSession(id)) {
            try (OutputStream out = session.openWrite("base.apk", 0, apk.length());
                 InputStream in = new FileInputStream(apk)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                session.fsync(out);
            }
            Intent i = new Intent(act, InstallReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 31) flags |= PendingIntent.FLAG_MUTABLE;
            PendingIntent p = PendingIntent.getBroadcast(act, id, i, flags);
            session.commit(p.getIntentSender());
        }
    }

    void openInBrowser(String url) {
        try {
            act.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
        }
    }

    // ---------- Сеть и файлы ----------
    static HttpURLConnection open(String url) throws IOException {
        HttpURLConnection c = null;
        for (int i = 0; i < 6; i++) { // ручное следование редиректам github -> objects.githubusercontent
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent", "Cosmodragon/" + BuildConfig.VERSION_NAME);
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = c.getHeaderField("Location");
                c.disconnect();
                if (loc == null) throw new IOException("redirect without location");
                url = new URL(new URL(url), loc).toString();
                continue;
            }
            if (code != 200) {
                c.disconnect();
                throw new IOException("HTTP " + code + " for " + url);
            }
            return c;
        }
        throw new IOException("too many redirects");
    }

    static byte[] httpGet(String url) throws IOException {
        HttpURLConnection c = open(url);
        try (InputStream in = new BufferedInputStream(c.getInputStream())) {
            return readAll(in);
        } finally {
            c.disconnect();
        }
    }

    static void download(String url, File dst) throws IOException {
        HttpURLConnection c = open(url);
        File part = new File(dst.getPath() + ".part");
        try (InputStream in = new BufferedInputStream(c.getInputStream());
             OutputStream out = new FileOutputStream(part)) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        } finally {
            c.disconnect();
        }
        if (dst.exists()) dst.delete();
        if (!part.renameTo(dst)) throw new IOException("rename failed");
    }

    static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
        return bo.toByteArray();
    }

    static void unzip(File zip, File dir) throws IOException {
        if (!dir.mkdirs() && !dir.isDirectory()) throw new IOException("mkdir failed");
        String root = dir.getCanonicalPath() + File.separator;
        try (ZipInputStream zin = new ZipInputStream(new BufferedInputStream(new FileInputStream(zip)))) {
            ZipEntry e;
            byte[] buf = new byte[65536];
            while ((e = zin.getNextEntry()) != null) {
                File f = new File(dir, e.getName());
                if (!f.getCanonicalPath().startsWith(root)) throw new IOException("zip slip");
                if (e.isDirectory()) {
                    f.mkdirs();
                    continue;
                }
                File parent = f.getParentFile();
                if (parent != null) parent.mkdirs();
                try (OutputStream out = new FileOutputStream(f)) {
                    int n;
                    while ((n = zin.read(buf)) > 0) out.write(buf, 0, n);
                }
            }
        }
    }

    static void deleteRec(File f) {
        if (f == null || !f.exists()) return;
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteRec(k);
        f.delete();
    }
}
