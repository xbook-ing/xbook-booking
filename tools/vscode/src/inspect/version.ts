import { coerce } from "semver";
import { xbookVersionDescriptor } from "./props";

export function withMinimumxbookVersion(version: string, hasVersion: () => void, doesntHaveVersion: () => void): void;
export function withMinimumxbookVersion<T>(version: string, hasVersion: () => T, doesntHaveVersion: () => T): T;

export function withMinimumxbookVersion<T>(version: string, hasVersion: () => T, doesntHaveVersion: () => T): T | void {
  if (hasMinimumxbookVersion(version)) {
    return hasVersion();
  } else {
    return doesntHaveVersion();
  }
}

export function hasMinimumxbookVersion(version: string, strictDevCheck = false): boolean {
  const descriptor = xbookVersionDescriptor();
  if (descriptor?.isDeveloperBuild && strictDevCheck) {
    // Since this is strictly being checked, require that the version is actually greater
    // than the minimum version (we declare the minimum version based upon the pypi version, but the
    // dev version is often one patch level great since it has already been tagged with the pypi version
    // and incremented it)
    const required = coerce(version);
    const installed = descriptor.version;
    return installed.major >= (required?.major || 0) && installed.minor >= (required?.minor || 0) && installed.patch > (required?.patch || 0);
  } else {
    if (descriptor && (descriptor.version.compare(version) >= 0 || descriptor.isDeveloperBuild)) {
      return true;
    } else {
      return false;
    }
  }



}