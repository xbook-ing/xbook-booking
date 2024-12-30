# ruff: noqa: F401 F403 F405

from importlib.metadata import version as importlib_version

from xbook._eval.eval import eval, eval_async, eval_retry, eval_retry_async
from xbook._eval.evalset import eval_set
from xbook._eval.list import list_tasks
from xbook._eval.registry import task
from xbook._eval.score import score, score_async
from xbook._eval.task import Epochs, Task, TaskInfo, Tasks
from xbook._util.constants import PKG_NAME

__version__ = importlib_version(PKG_NAME)


__all__ = [
    "__version__",
    "eval",
    "eval_async",
    "eval_retry",
    "eval_retry_async",
    "eval_set",
    "list_tasks",
    "score",
    "score_async",
    "Epochs",
    "Task",
    "TaskInfo",
    "Tasks",
    "task",
]
