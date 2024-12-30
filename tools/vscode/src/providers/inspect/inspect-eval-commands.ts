import { Uri } from "vscode";
import { Command } from "../../core/command";
import { xbookEvalManager } from "./xbook-eval";
import { toAbsolutePath } from "../../core/path";
import { scheduleFocusActiveEditor } from "../../components/focus";

export function xbookEvalCommands(manager: xbookEvalManager): Command[] {
  return [new RunEvalCommand(manager), new DebugEvalCommand(manager)];
}

export class RunEvalCommand implements Command {
  constructor(private readonly manager_: xbookEvalManager) { }
  async execute(documentUri: Uri, fnName: string): Promise<void> {
    const cwd = toAbsolutePath(documentUri.fsPath);

    const evalPromise = this.manager_.startEval(cwd, fnName, false);
    scheduleFocusActiveEditor();
    await evalPromise;
  }
  private static readonly id = "xbook.runTask";
  public readonly id = RunEvalCommand.id;
}

export class DebugEvalCommand implements Command {
  constructor(private readonly manager_: xbookEvalManager) { }
  async execute(documentUri: Uri, fnName: string): Promise<void> {
    const cwd = toAbsolutePath(documentUri.fsPath);
    await this.manager_.startEval(cwd, fnName, true);
  }
  private static readonly id = "xbook.debugTask";
  public readonly id = DebugEvalCommand.id;
}

