import { AllLogKeys, type AllLogKeysType } from "../db/schema";


export const convertToUniqueTrackingKeys = (loggingKeys: string[]) => {
    const allowed = new Set<string>(AllLogKeys);
    return loggingKeys
      .filter((g): g is AllLogKeysType => allowed.has(g))
      .filter((key, index, self) => self.indexOf(key) === index);
}