import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@carecircle_local_logs';

/**
 * Saves a medication dose to the local device storage.
 * Used for the "Local Shared Station" architecture.
 */
export const saveLogLocally = async (logEntry: any) => {
  try {
    const existingLogs = await AsyncStorage.getItem(STORAGE_KEY);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    
    // Safety check: Avoid duplicate logs for the same window locally
    const isDuplicate = logs.some((l: any) => 
      l.med_id === logEntry.med_id && 
      l.window_start === logEntry.window_start
    );

    if (isDuplicate) {
      throw new Error("Dose already recorded on this device.");
    }

    logs.push(logEntry);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return true;
  } catch (e) {
    console.error("Local storage error:", e);
    return false;
  }
};

/**
 * Retrieves all logs from local storage.
 */
export const getLocalLogs = async () => {
  const logs = await AsyncStorage.getItem(STORAGE_KEY);
  return logs ? JSON.parse(logs) : [];
};
