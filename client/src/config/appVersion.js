/**
 * APP_VERSION — The version string baked into this APK build.
 *
 * ⚡ IMPORTANT: Bump this version number BEFORE building and uploading a new APK.
 * Use semantic versioning: MAJOR.MINOR.PATCH (e.g. "1.0.1", "1.1.0", "2.0.0")
 *
 * Workflow:
 *   1. Bump APP_VERSION here (e.g. "1.0.0" → "1.0.1")
 *   2. Build the APK:  npx cap build android
 *   3. Upload new APK to Firebase Storage
 *   4. Go to Admin Panel → App Version → set the new version + URL → Save
 *   5. All users instantly see the update prompt ✅
 */
export const APP_VERSION = "1.0.1";
