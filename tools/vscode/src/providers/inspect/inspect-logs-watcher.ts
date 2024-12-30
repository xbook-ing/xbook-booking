import { Disposable, Event, EventEmitter, Uri } from "vscode";

import { xbookLastEvalPaths } from "../../xbook/props";
import { existsSync, readFileSync, statSync } from "fs";
import { log } from "../../core/log";
import { WorkspaceStateManager } from "../workspace/workspace-state-provider";
import { withMinimumxbookVersion } from "../../xbook/version";
import { kxbookChangeEvalSignalVersion } from "./xbook-constants";
import { resolveToUri } from "../../core/uri";

export interface xbookLogCreatedEvent {
  log: Uri
  externalWorkspace: boolean;
}

export class xbookLogsWatcher implements Disposable {
  constructor(
    private readonly workspaceStateManager_: WorkspaceStateManager,
  ) {
    log.appendLine("Watching for evaluation logs");
    this.lastEval_ = Date.now();

    const evalSignalFiles = xbookLastEvalPaths().map(path => path.path);

    this.watchInterval_ = setInterval(() => {
      for (const evalSignalFile of evalSignalFiles) {
        if (existsSync(evalSignalFile)) {
          const updated = statSync(evalSignalFile).mtime.getTime();
          if (updated > this.lastEval_) {
            this.lastEval_ = updated;

            let evalLogPath: string | undefined;
            let workspaceId;
            const contents = readFileSync(evalSignalFile, { encoding: "utf-8" });

            // Parse the eval signal file result
            withMinimumxbookVersion(
              kxbookChangeEvalSignalVersion,
              () => {
                // 0.3.10- or later
                const contentsObj = JSON.parse(contents) as {
                  location: string;
                  workspace_id?: string;
                };
                evalLogPath = contentsObj.location;
                workspaceId = contentsObj.workspace_id;
              },
              () => {
                // 0.3.8 or earlier
                evalLogPath = contents;
              }
            );

            if (evalLogPath !== undefined) {
              // see if this is another instance of vscode
              const externalWorkspace = !!workspaceId && workspaceId !== this.workspaceStateManager_.getWorkspaceInstance();

              // log
              log.appendLine(`New log: ${evalLogPath}`);

              // fire event
              try {
                const logUri = resolveToUri(evalLogPath);
                this.onxbookLogCreated_.fire({ log: logUri, externalWorkspace });
              } catch (error) {
                log.appendLine(`Unexpected error parsing URI ${evalLogPath}`);
              }

            }
          }
        }
      }
    }, 500);
  }
  private lastEval_: number;
  private watchInterval_: NodeJS.Timeout;

  private readonly onxbookLogCreated_ =
    new EventEmitter<xbookLogCreatedEvent>();
  public readonly onxbookLogCreated: Event<xbookLogCreatedEvent> =
    this.onxbookLogCreated_.event;

  dispose() {
    if (this.watchInterval_) {
      log.appendLine("Stopping watching for new evaluations logs");
      clearTimeout(this.watchInterval_);
    }
  }
}
