import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { deleteAvatar, uploadAvatar } from "../services/storage.service";
import { setPhotoURL } from "../services/user.service";

type PhotoSource = "camera" | "library";

/** Square crop, modest quality — an avatar is never shown larger than 120pt. */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

/**
 * Everything needed to change a user's profile picture: permissions, the native
 * picker, the Storage upload, and persisting the resulting URL to both the
 * Firestore profile and the Firebase auth account.
 *
 * Shared by the Profile and Edit Profile screens; the caller owns the UI (the
 * source sheet, the progress ring) and just drives these handlers.
 */
export function useAvatarUpload() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const photoURL = profile?.photoURL ?? user?.photoURL ?? null;

  const requestAccess = useCallback(
    async (source: PhotoSource): Promise<boolean> => {
      const result =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (result.granted) return true;

      // Once denied, the OS won't prompt again — the only way through is Settings.
      Alert.alert(
        source === "camera" ? "Camera access needed" : "Photo access needed",
        source === "camera"
          ? "Allow Happy Place to use your camera to take a profile picture."
          : "Allow Happy Place to access your photos to choose a profile picture.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    },
    []
  );

  const pickAndUpload = useCallback(
    async (source: PhotoSource) => {
      if (busy) return;
      if (!user?.uid) {
        Alert.alert("Not signed in", "Please sign in to change your picture.");
        return;
      }
      if (!(await requestAccess(source))) return;

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;

      setBusy(true);
      setProgress(0);
      try {
        const url = await uploadAvatar(user.uid, asset.uri, {
          contentType: asset.mimeType ?? "image/jpeg",
          onProgress: setProgress,
        });
        await setPhotoURL(user.uid, url);
        await refreshProfile();
        showToast("Profile picture updated");
      } catch {
        Alert.alert(
          "Couldn't upload picture",
          "Check your connection and try again."
        );
      } finally {
        setBusy(false);
        setProgress(0);
      }
    },
    [busy, user?.uid, requestAccess, refreshProfile, showToast]
  );

  const takePhoto = useCallback(() => pickAndUpload("camera"), [pickAndUpload]);

  const chooseFromLibrary = useCallback(
    () => pickAndUpload("library"),
    [pickAndUpload]
  );

  const removePhoto = useCallback(() => {
    if (busy || !user?.uid) return;
    const { uid } = user;
    Alert.alert(
      "Remove profile picture?",
      "Your initials will be shown instead.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deleteAvatar(uid);
              await setPhotoURL(uid, null);
              await refreshProfile();
              showToast("Profile picture removed");
            } catch {
              Alert.alert("Couldn't remove picture", "Please try again.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [busy, user, refreshProfile, showToast]);

  return {
    /** Current picture, or null when the user has none. */
    photoURL,
    /** True while uploading or removing — drive a spinner off this. */
    busy,
    /** Upload progress as 0..1 (0 while not uploading). */
    progress,
    takePhoto,
    chooseFromLibrary,
    removePhoto,
  };
}
