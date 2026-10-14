// Android app download settings.
//
// The APK is hosted as a GitHub Release asset on this repository. The
// "latest/download" URL always points at the newest release, so publishing a
// new version only means uploading a new release with the same file name;
// the website needs no change.
//
// Set APK_AVAILABLE to true once the first release with that file exists,
// otherwise visitors see "Coming soon" instead of a broken download.
export const APK_AVAILABLE = true;
export const APK_FILE_NAME = "ack-st-pauls-youths.apk";
export const APK_URL = `https://github.com/ictcathedral2-create/website/releases/latest/download/${APK_FILE_NAME}`;
export const APP_VERSION = "1.0.1";
