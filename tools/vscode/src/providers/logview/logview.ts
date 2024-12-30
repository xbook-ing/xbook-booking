import { ExtensionContext } from "vscode";

import { Command } from "../../core/command";
import { logviewCommands } from "./commands";
import { xbookViewWebviewManager } from "./logview-view";
import { xbookViewManager } from "./logview-view";
import { xbookManager } from "../xbook/xbook-manager";
import { WorkspaceEnvManager } from "../workspace/workspace-env-provider";
import { ExtensionHost } from "../../hooks";
import { xbookViewServer } from "../xbook/xbook-view-server";
import { activateLogviewEditor } from "./logview-editor";
import { xbookLogsWatcher } from "../xbook/xbook-logs-watcher";

export async function activateLogview(
  xbookManager: xbookManager,
  server: xbookViewServer,
  envMgr: WorkspaceEnvManager,
  logsWatcher: xbookLogsWatcher,
  context: ExtensionContext,
  host: ExtensionHost
): Promise<[Command[], xbookViewManager]> {

  // activate the log viewer editor
  activateLogviewEditor(context, server);

  // initilize manager
  const logviewWebManager = new xbookViewWebviewManager(
    xbookManager,
    server,
    context,
    host
  );
  const logviewManager = new xbookViewManager(
    context,
    logviewWebManager,
    envMgr,
    logsWatcher
  );

  // logview commands
  return [await logviewCommands(logviewManager), logviewManager];
}
