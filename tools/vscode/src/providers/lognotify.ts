import { window, ExtensionContext, MessageItem, commands } from "vscode";
import { xbookLogsWatcher } from "./xbook/xbook-logs-watcher";
import { xbookSettingsManager } from "./settings/xbook-settings";
import { xbookViewManager } from "./logview/logview-view";


export function activateLogNotify(
  context: ExtensionContext,
  logsWatcher: xbookLogsWatcher,
  settingsMgr: xbookSettingsManager,
  viewManager: xbookViewManager
) {

  context.subscriptions.push(logsWatcher.onxbookLogCreated(async e => {

    if (e.externalWorkspace) {
      return;
    }

    if (!settingsMgr.getSettings().notifyEvalComplete) {
      return;
    }

    if (viewManager.logFileWillVisiblyUpdate(e.log)) {
      return false;
    }

    // see if we can pick out the task name
    const logFile = e.log.path.split("/").pop()!;
    const parts = logFile?.split("_");
    const task = parts.length > 1 ? parts[1] : "task";

    // show the message
    const viewLog: MessageItem = { title: "View Log" };
    const dontShowAgain: MessageItem = { title: "Don't Show Again" };
    const result = await window.showInformationMessage(
      `Eval complete: ${task}`,
      viewLog,
      dontShowAgain,
    );
    if (result === viewLog) {
      // open the editor
      await commands.executeCommand('xbook.openLogViewer', e.log);

    } else if (result === dontShowAgain) {
      settingsMgr.setNotifyEvalComplete(false);
    }


  }));


}