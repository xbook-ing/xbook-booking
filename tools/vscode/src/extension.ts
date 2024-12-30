import { ExtensionContext, MessageItem, window } from "vscode";

import { CommandManager } from "./core/command";
import { activateCodeLens } from "./providers/codelens/codelens-provider";
import { activateLogview } from "./providers/logview/logview";
import { logviewTerminalLinkProvider } from "./providers/logview/logview-link-provider";
import { xbookSettingsManager } from "./providers/settings/xbook-settings";
import { initializeGlobalSettings } from "./providers/settings/user-settings";
import { activateEvalManager } from "./providers/xbook/xbook-eval";
import { activateActivityBar } from "./providers/activity-bar/activity-bar-provider";
import { activateActiveTaskProvider } from "./providers/active-task/active-task-provider";
import { activateWorkspaceTaskProvider } from "./providers/workspace/workspace-task-provider";
import {
  activateWorkspaceState,
} from "./providers/workspace/workspace-state-provider";
import { initializeWorkspace } from "./providers/workspace/workspace-init";
import { activateWorkspaceEnv } from "./providers/workspace/workspace-env-provider";
import { initPythonInterpreter } from "./core/python";
import { initxbookProps } from "./xbook";
import { activatexbookManager } from "./providers/xbook/xbook-manager";
import { checkActiveWorkspaceFolder } from "./core/workspace";
import { xbookBinPath, xbookVersionDescriptor } from "./xbook/props";
import { extensionHost } from "./hooks";
import { activateStatusBar } from "./providers/statusbar";
import { xbookViewServer } from "./providers/xbook/xbook-view-server";
import { xbookLogsWatcher } from "./providers/xbook/xbook-logs-watcher";
import { activateLogNotify } from "./providers/lognotify";
import { activateOpenLog } from "./providers/openlog";
import { activateProtocolHandler } from "./providers/protocol-handler";
import { activatexbookCommands } from "./providers/xbook/xbook-commands";

const kxbookMinimumVersion = "0.3.8";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
  // we don't activate anything if there is no workspace
  if (!checkActiveWorkspaceFolder()) {
    return;
  }

  // Get the host
  const host = extensionHost();

  const commandManager = new CommandManager();

  // init python interpreter
  context.subscriptions.push(await initPythonInterpreter());

  // init xbook props
  context.subscriptions.push(initxbookProps());

  // Initialize global settings
  await initializeGlobalSettings();

  // Warn the user if they don't have a recent enough version
  void checkxbookVersion();

  // Activate the workspacestate manager
  const [stateCommands, stateManager] = activateWorkspaceState(context);

  // For now, create an output channel for env changes
  const workspaceActivationResult = activateWorkspaceEnv();
  const [envComands, workspaceEnvManager] = workspaceActivationResult;
  context.subscriptions.push(workspaceEnvManager);

  // Initial the workspace
  await initializeWorkspace(stateManager);

  // Initialize the protocol handler
  activateProtocolHandler(context);

  // xbook Manager watches for changes to xbook binary
  const xbookManager = activatexbookManager(context);
  context.subscriptions.push(xbookManager);

  // Eval Manager
  const [xbookEvalCommands, xbookEvalMgr] = await activateEvalManager(
    stateManager,
    context
  );

  // Activate commands interface
  activatexbookCommands(stateManager, context);

  // Activate a watcher which xbooks the active document and determines
  // the active task (if any)
  const [taskCommands, activeTaskManager] = activateActiveTaskProvider(
    xbookEvalMgr,
    context
  );

  // Active the workspace manager to watch for tasks
  const workspaceTaskMgr = activateWorkspaceTaskProvider(
    xbookManager,
    context
  );

  // Read the extension configuration
  const settingsMgr = new xbookSettingsManager(() => { });

  // initialiaze view server
  const server = new xbookViewServer(context, xbookManager);

  // initialise logs watcher
  const logsWatcher = new xbookLogsWatcher(stateManager);

  // Activate the log view
  const [logViewCommands, logviewWebviewManager] = await activateLogview(
    xbookManager,
    server,
    workspaceEnvManager,
    logsWatcher,
    context,
    host
  );
  const xbookLogviewManager = logviewWebviewManager;

  // initilisze open log
  activateOpenLog(context, logviewWebviewManager);

  // Activate the Activity Bar
  const taskBarCommands = await activateActivityBar(
    xbookManager,
    xbookEvalMgr,
    xbookLogviewManager,
    activeTaskManager,
    workspaceTaskMgr,
    stateManager,
    workspaceEnvManager,
    server,
    logsWatcher,
    context
  );

  // Register the log view link provider
  window.registerTerminalLinkProvider(
    logviewTerminalLinkProvider()
  );

  // Activate Code Lens
  activateCodeLens(context);

  // Activate Status Bar
  activateStatusBar(context, xbookManager);

  // Activate Log Notification
  activateLogNotify(context, logsWatcher, settingsMgr, xbookLogviewManager);

  // Activate commands
  [
    ...logViewCommands,
    ...xbookEvalCommands,
    ...taskBarCommands,
    ...stateCommands,
    ...envComands,
    ...taskCommands,
  ].forEach((cmd) => commandManager.register(cmd));
  context.subscriptions.push(commandManager);

  // refresh the active task state
  await activeTaskManager.refresh();
}


const checkxbookVersion = async () => {
  if (xbookBinPath()) {
    const descriptor = xbookVersionDescriptor();
    if (descriptor && descriptor.version.compare(kxbookMinimumVersion) === -1) {
      const close: MessageItem = { title: "Close" };
      await window.showInformationMessage<MessageItem>(
        "The VS Code extension requires a newer version of xbook. Please update " +
        "with pip install --upgrade xbook-ai",
        close
      );
    }
  }
};