import { Disposable, Event, EventEmitter, ExtensionContext } from "vscode";
import { pythonInterpreter } from "../../core/python";
import { xbookBinPath } from "../../xbook/props";
import { AbsolutePath } from "../../core/path";
import { delimiter } from "path";

// Activates the provider which tracks the availability of xbook
export function activatexbookManager(context: ExtensionContext) {
  const xbookManager = new xbookManager(context);

  // Initialize the terminal with the xbook bin path
  // on the path (if needed)
  const terminalEnv = terminalEnvironment(context);
  context.subscriptions.push(xbookManager.onxbookChanged((e: xbookChangedEvent) => {
    terminalEnv.update(e.binPath);
  }));
  terminalEnv.update(xbookBinPath());

  return xbookManager;
}

// Fired when the active task changes
export interface xbookChangedEvent {
  available: boolean;
  binPath: AbsolutePath | null;
}

export class xbookManager implements Disposable {
  constructor(context: ExtensionContext) {
    // If the interpreter changes, refresh the tasks
    context.subscriptions.push(
      pythonInterpreter().onDidChange(() => {
        this.updatexbookAvailable();
      })
    );
    this.updatexbookAvailable();
  }
  private xbookBinPath_: string | undefined = undefined;

  get available(): boolean {
    return this.xbookBinPath_ !== null;
  }

  private updatexbookAvailable() {
    const binPath = xbookBinPath();
    const available = binPath !== null;
    const valueChanged = this.xbookBinPath_ !== binPath?.path;
    if (valueChanged) {
      this.xbookBinPath_ = binPath?.path;
      this.onxbookChanged_.fire({ available: !!this.xbookBinPath_, binPath });
    }
    if (!available) {
      this.watchForxbook();
    }
  }

  watchForxbook() {
    this.xbookTimer = setInterval(() => {
      const path = xbookBinPath();
      if (path) {
        if (this.xbookTimer) {
          clearInterval(this.xbookTimer);
          this.xbookTimer = null;
          this.updatexbookAvailable();
        }
      }
    }, 3000);
  }

  private xbookTimer: NodeJS.Timeout | null = null;

  dispose() {
    if (this.xbookTimer) {
      clearInterval(this.xbookTimer);
      this.xbookTimer = null;
    }
  }

  private readonly onxbookChanged_ = new EventEmitter<xbookChangedEvent>();
  public readonly onxbookChanged: Event<xbookChangedEvent> =
    this.onxbookChanged_.event;
}

// Configures the terminal environment to support xbook. We do this
// to ensure the the 'xbook' command will work from within the
// terminal (especially in cases where the global interpreter is being used)
const terminalEnvironment = (context: ExtensionContext) => {
  const filter = (binPath: AbsolutePath | null) => {
    switch (process.platform) {
      case "win32":
        {
          const localPath = process.env['LocalAppData'];
          if (localPath) {
            return binPath?.path.startsWith(localPath);
          }
          return false;
        }
      case "linux":
        return binPath && binPath.path.includes(".local/bin");
      default:
        return false;
    }
  };

  return {
    update: (binPath: AbsolutePath | null) => {
      // The path info
      const env = context.environmentVariableCollection;
      env.delete('PATH');
      // Actually update the path
      const binDir = binPath?.dirname();
      if (binDir && filter(binPath)) {
        env.append('PATH', `${delimiter}${binDir.path}`);
      }
    }
  };
};
