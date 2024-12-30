
import { ExtensionContext, StatusBarAlignment, window } from "vscode";
import { xbookManager } from "./xbook/xbook-manager";
import { xbookVersion } from "../xbook";
import { xbookBinPath } from "../xbook/props";


export function activateStatusBar(context: ExtensionContext, xbookManager: xbookManager) {
  const statusItem = window.createStatusBarItem(
    "xbook-ai.version",
    StatusBarAlignment.Right
  );

  // track changes to xbook
  const updateStatus = () => {
    statusItem.name = "xbook";
    const version = xbookVersion();
    const versionSummary = version ? `${version.version.toString()}${version.isDeveloperBuild ? '.dev' : ''}` : "(not found)";
    statusItem.text = `xbook: ${versionSummary}`;
    statusItem.tooltip = `xbook: ${version?.raw}` + (version ? `\n${xbookBinPath()?.path}` : "");
  };
  context.subscriptions.push(xbookManager.onxbookChanged(updateStatus));

  // reflect current state
  updateStatus();
  statusItem.show();
}
