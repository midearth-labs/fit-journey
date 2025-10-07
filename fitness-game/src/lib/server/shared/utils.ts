import { ALL_LOG_KEYS, type AllLogKeysType } from "../../config/constants";

export const convertToUniqueTrackingKeys = (loggingKeys: string[]) => {
    const allowed = new Set<string>(ALL_LOG_KEYS);
    return loggingKeys
      .filter((g): g is AllLogKeysType => allowed.has(g))
      .filter((key, index, self) => self.indexOf(key) === index);
}