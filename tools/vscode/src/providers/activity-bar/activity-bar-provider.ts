import { ExtensionContext, window } from "vscode";
import { EnvConfigurationProvider } from "./env-config-provider";
import { activateTaskOutline } from "./task-outline-provider";
import { xbookEvalManager } from "../xbook/xbook-eval";
import { ActiveTaskManager } from "../active-task/active-task-provider";
import { WorkspaceTaskManager } from "../workspace/workspace-task-provider";
import { WorkspaceEnvManager } from "../workspace/workspace-env-provider";
import { WorkspaceStateManager } from "../workspace/workspace-state-provider";
import { TaskConfigurationProvider } from "./task-config-provider";
import { xbookManager } from "../xbook/xbook-manager";
import { DebugConfigTaskCommand, RunConfigTaskCommand } from "./task-config-commands";
import { xbookViewManager } from "../logview/logview-view";
import { activateLogListing } from "./log-listing/log-listing-provider";
import { xbookViewServer } from "../xbook/xbook-view-server";
import { xbookLogsWatcher } from "../xbook/xbook-logs-watcher";

export async function activateActivityBar(
  xbookManager: xbookManager,
  xbookEvalMgr: xbookEvalManager,
  xbookLogviewManager: xbookViewManager,
  activeTaskManager: ActiveTaskManager,
  workspaceTaskMgr: WorkspaceTaskManager,
  workspaceStateMgr: WorkspaceStateManager,
  workspaceEnvMgr: WorkspaceEnvManager,
  xbookViewServer: xbookViewServer,
  logsWatcher: xbookLogsWatcher,
  context: ExtensionContext
) {

  const [outlineCommands, treeDataProvider] = await activateTaskOutline(context, xbookEvalMgr, workspaceTaskMgr, activeTaskManager, xbookManager, xbookLogviewManager);
  context.subscriptions.push(treeDataProvider);

  const [logsCommands, logsDispose] = await activateLogListing(context, workspaceEnvMgr, xbookViewServer, logsWatcher);
  context.subscriptions.push(...logsDispose);

  const envProvider = new EnvConfigurationProvider(context.extensionUri, workspaceEnvMgr, workspaceStateMgr, xbookManager);
  context.subscriptions.push(
    window.registerWebviewViewProvider(EnvConfigurationProvider.viewType, envProvider)
  );

  const taskConfigProvider = new TaskConfigurationProvider(context.extensionUri, workspaceStateMgr, activeTaskManager, xbookManager);
  context.subscriptions.push(
    window.registerWebviewViewProvider(TaskConfigurationProvider.viewType, taskConfigProvider)
  );
  const taskConfigCommands = [
    new RunConfigTaskCommand(activeTaskManager, xbookEvalMgr),
    new DebugConfigTaskCommand(activeTaskManager, xbookEvalMgr),
  ];

  return [...outlineCommands, ...taskConfigCommands, ...logsCommands];
}

