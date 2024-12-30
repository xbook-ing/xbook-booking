import { Command } from "../../core/command";
import { xbookViewManager } from "./logview-view";
import { showError } from "../../components/error";
import { commands } from "vscode";
import { kxbookEvalLogFormatVersion, kxbookOpenxbookViewVersion } from "../xbook/xbook-constants";
import { LogviewState } from "./logview-state";
import { xbookVersionDescriptor } from "../../xbook/props";

export interface LogviewOptions {
  state?: LogviewState;
  activate?: boolean;
}


export async function logviewCommands(
  manager: xbookViewManager,
): Promise<Command[]> {

  // Check whether the open in xbook view command should be enabled
  const descriptor = xbookVersionDescriptor();
  const enableOpenInView = descriptor?.version && descriptor.version.compare(kxbookOpenxbookViewVersion) >= 0 && descriptor.version.compare(kxbookEvalLogFormatVersion) <= 0;
  await commands.executeCommand(
    "setContext",
    "xbook.enableOpenInView",
    enableOpenInView
  );

  return [new ShowLogviewCommand(manager)];
}

class ShowLogviewCommand implements Command {
  constructor(private readonly manager_: xbookViewManager) { }
  async execute(): Promise<void> {
    // ensure logview is visible
    try {
      await this.manager_.showxbookView();
    } catch (err: unknown) {
      await showError(
        "An error occurred while attempting to start xbook View",
        err instanceof Error ? err : Error(String(err))
      );
    }
  }

  private static readonly id = "xbook.xbookView";
  public readonly id = ShowLogviewCommand.id;
}

