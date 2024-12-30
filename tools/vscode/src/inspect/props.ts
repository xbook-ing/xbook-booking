import { SemVer, coerce } from "semver";

import { log } from "../core/log";
import { pythonBinaryPath, pythonInterpreter } from "../core/python";
import { AbsolutePath, toAbsolutePath } from "../core/path";
import { Disposable } from "vscode";
import { runProcess } from "../core/process";
import { join } from "path";
import { userDataDir, userRuntimeDir } from "../core/appdirs";
import { kxbookChangeEvalSignalVersion } from "../providers/xbook/xbook-constants";
import { existsSync } from "fs";

export const kPythonPackageName = "xbook";

export interface VersionDescriptor {
  raw: string;
  version: SemVer,
  isDeveloperBuild: boolean
}

// we cache the results of these functions so long as
// they (a) return success, and (b) the active python
// interpreter hasn't been changed
class xbookPropsCache implements Disposable {
  private readonly eventHandle_: Disposable;

  constructor(
    private binPath_: AbsolutePath | null,
    private version_: VersionDescriptor | null,
    private viewPath_: AbsolutePath | null
  ) {
    this.eventHandle_ = pythonInterpreter().onDidChange(() => {
      log.info("Resetting xbook props to null");
      this.binPath_ = null;
      this.version_ = null;
      this.viewPath_ = null;
    });
  }

  get binPath(): AbsolutePath | null {
    return this.binPath_;
  }

  setBinPath(binPath: AbsolutePath) {
    log.info(`xbook bin path: ${binPath.path}`);
    this.binPath_ = binPath;
  }

  get version(): VersionDescriptor | null {
    return this.version_;
  }

  setVersion(version: VersionDescriptor) {
    log.info(`xbook version: ${version.version.toString()}`);
    this.version_ = version;
  }

  get viewPath(): AbsolutePath | null {
    return this.viewPath_;
  }

  setViewPath(path: AbsolutePath) {
    log.info(`xbook view path: ${path.path}`);
    this.viewPath_ = path;
  }

  dispose() {
    this.eventHandle_.dispose();
  }
}

export function initxbookProps(): Disposable {
  xbookPropsCache_ = new xbookPropsCache(null, null, null);
  return xbookPropsCache_;
}

let xbookPropsCache_: xbookPropsCache;

export function xbookVersionDescriptor(): VersionDescriptor | null {
  if (xbookPropsCache_.version) {
    return xbookPropsCache_.version;
  } else {
    const xbookBin = xbookBinPath();
    if (xbookBin) {
      try {
        const versionJson = runProcess(xbookBin, [
          "info",
          "version",
          "--json",
        ]);
        const version = JSON.parse(versionJson) as {
          version: string;
          path: string;
        };

        const parsedVersion = coerce(version.version);
        if (parsedVersion) {
          const isDeveloperVersion = version.version.indexOf('.dev') > -1;
          const xbookVersion = {
            raw: version.version,
            version: parsedVersion,
            isDeveloperBuild: isDeveloperVersion
          };
          xbookPropsCache_.setVersion(xbookVersion);
          return xbookVersion;
        } else {
          return null;
        }
      } catch (error) {
        log.error("Error attempting to read xbook version.");
        log.error(error instanceof Error ? error : String(error));
        return null;
      }
    } else {
      return null;
    }
  }
}

// path to xbook view www assets
export function xbookViewPath(): AbsolutePath | null {
  if (xbookPropsCache_.viewPath) {
    return xbookPropsCache_.viewPath;
  } else {
    const xbookBin = xbookBinPath();
    if (xbookBin) {
      try {
        const versionJson = runProcess(xbookBin, [
          "info",
          "version",
          "--json",
        ]);
        const version = JSON.parse(versionJson) as {
          version: string;
          path: string;
        };
        let viewPath = toAbsolutePath(version.path)
          .child("_view")
          .child("www")
          .child("dist");

        if (!existsSync(viewPath.path)) {
          // The dist folder is only available on newer versions, this is for
          // backwards compatibility only
          viewPath = toAbsolutePath(version.path)
            .child("_view")
            .child("www");
        }
        xbookPropsCache_.setViewPath(viewPath);
        return viewPath;
      } catch (error) {
        log.error("Error attempting to read xbook view path.");
        log.error(error instanceof Error ? error : String(error));
        return null;
      }
    } else {
      return null;
    }
  }
}

export function xbookBinPath(): AbsolutePath | null {
  if (xbookPropsCache_.binPath) {
    return xbookPropsCache_.binPath;
  } else {
    const interpreter = pythonInterpreter();
    if (interpreter.available) {
      try {
        const binPath = pythonBinaryPath(interpreter, xbookFileName());
        if (binPath) {
          xbookPropsCache_.setBinPath(binPath);
        }
        return binPath;
      } catch (error) {
        log.error("Error attempting to read xbook version.");
        log.error(error instanceof Error ? error : String(error));
        return null;
      }
    } else {
      return null;
    }
  }
}

export function xbookLastEvalPaths(): AbsolutePath[] {
  const descriptor = xbookVersionDescriptor();
  const fileName =
    descriptor && descriptor.version.compare(kxbookChangeEvalSignalVersion) < 0
      ? "last-eval"
      : "last-eval-result";

  return [userRuntimeDir(kPythonPackageName), userDataDir(kPythonPackageName)]
    .map(dir => join(dir, "view", fileName))
    .map(toAbsolutePath);
}

function xbookFileName(): string {
  switch (process.platform) {
    case "darwin":
      return "xbook";
    case "win32":
      return "xbook.exe";
    case "linux":
    default:
      return "xbook";
  }
}