import { Command } from "../../core/command";
import { toAbsolutePath } from "../../core/path";
import { xbookEvalManager } from "../xbook/xbook-eval";
import { ActiveTaskManager } from "../active-task/active-task-provider";
import { scheduleReturnFocus } from "../../components/focus";

export class RunConfigTaskCommand implements Command {
  constructor(private readonly manager_: ActiveTaskManager,
    private readonly xbookMgr_: xbookEvalManager
  ) { }
  async execute(): Promise<void> {
    const taskInfo = this.manager_.getActiveTaskInfo();
    if (taskInfo) {
      const docPath = toAbsolutePath(taskInfo.document.fsPath);
      const evalPromise = this.xbookMgr_.startEval(docPath, taskInfo.activeTask?.name, false);
      scheduleReturnFocus("xbook.task-configuration.focus");
      await evalPromise;
    }
  }

  private static readonly id = "xbook.runConfigTask";
  public readonly id = RunConfigTaskCommand.id;
}

export class DebugConfigTaskCommand implements Command {
  constructor(private readonly manager_: ActiveTaskManager,
    private readonly xbookMgr_: xbookEvalManager
  ) { }
  async execute(): Promise<void> {
    const taskInfo = this.manager_.getActiveTaskInfo();
    if (taskInfo) {
      const docPath = toAbsolutePath(taskInfo.document.fsPath);
      const evalPromise = this.xbookMgr_.startEval(docPath, taskInfo.activeTask?.name, true);
      scheduleReturnFocus("xbook.task-configuratio.focus");
      await evalPromise;
    }
  }

  private static readonly id = "xbook.debugConfigTask";
  public readonly id = DebugConfigTaskCommand.id;
}
