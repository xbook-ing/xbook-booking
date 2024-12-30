from xbook._util.deprecation import relocated_module_attribute

from ._basic_agent import basic_agent
from ._chain import chain
from ._critique import self_critique
from ._fork import fork
from ._multiple_choice import MultipleChoiceTemplate, multiple_choice
from ._plan import Plan, plan
from ._prompt import (
    chain_of_thought,
    prompt_template,
    system_message,
)
from ._solver import Generate, Solver, SolverSpec, generate, solver
from ._task_state import Choice, Choices, TaskState
from ._use_tools import use_tools

__all__ = [
    "basic_agent",
    "chain",
    "fork",
    "generate",
    "prompt_template",
    "chain_of_thought",
    "multiple_choice",
    "system_message",
    "self_critique",
    "use_tools",
    "plan",
    "Plan",
    "Solver",
    "SolverSpec",
    "solver",
    "Choice",
    "Choices",
    "TaskState",
    "Generate",
    "MultipleChoiceTemplate",
]


_TOOL_MODULE_VERSION_3_18 = "0.3.18"
_TOOL_MODULE_VERSION_3_19 = "0.3.19"
_SUBTASKS_MODULE_VERSION = "0.3.26"
_REMOVED_IN = "0.4"
relocated_module_attribute(
    "Tool", "xbook.tool.Tool", _TOOL_MODULE_VERSION_3_18, _REMOVED_IN
)
relocated_module_attribute(
    "ToolEnvironment",
    "xbook.util.SandboxEnvironment",
    _TOOL_MODULE_VERSION_3_18,
    _REMOVED_IN,
)
relocated_module_attribute(
    "ToolEnvironments",
    "xbook.util.SandboxEnvironments",
    _TOOL_MODULE_VERSION_3_18,
    _REMOVED_IN,
)
relocated_module_attribute(
    "ToolEnvironmentSpec",
    "xbook.util.SandboxEnvironmentSpec",
    _TOOL_MODULE_VERSION_3_18,
    _REMOVED_IN,
)
relocated_module_attribute(
    "ToolError", "xbook.tool.ToolError", _TOOL_MODULE_VERSION_3_18, _REMOVED_IN
)
relocated_module_attribute(
    "ToolResult", "xbook.tool.ToolResult", _TOOL_MODULE_VERSION_3_18, _REMOVED_IN
)
relocated_module_attribute(
    "tool", "xbook.tool.tool", _TOOL_MODULE_VERSION_3_18, _REMOVED_IN
)
relocated_module_attribute(
    "tool_environment",
    "xbook.util.sandbox",
    _TOOL_MODULE_VERSION_3_18,
    _REMOVED_IN,
)
relocated_module_attribute(
    "toolenv", "xbook.util.sandboxenv", _TOOL_MODULE_VERSION_3_18, _REMOVED_IN
)
relocated_module_attribute(
    "bash", "xbook.tool.bash", _TOOL_MODULE_VERSION_3_19, _REMOVED_IN
)
relocated_module_attribute(
    "python", "xbook.tool.python", _TOOL_MODULE_VERSION_3_19, _REMOVED_IN
)
relocated_module_attribute(
    "web_search", "xbook.tool.web_search", _TOOL_MODULE_VERSION_3_19, _REMOVED_IN
)
relocated_module_attribute(
    "Transcript",
    "xbook.log.Transcript",
    _SUBTASKS_MODULE_VERSION,
    _REMOVED_IN,
)
relocated_module_attribute(
    "transcript",
    "xbook.log.transcript",
    _SUBTASKS_MODULE_VERSION,
    _REMOVED_IN,
)
relocated_module_attribute(
    "Store",
    "xbook.util.Store",
    _SUBTASKS_MODULE_VERSION,
    _REMOVED_IN,
)
relocated_module_attribute(
    "store",
    "xbook.util.store",
    _SUBTASKS_MODULE_VERSION,
    _REMOVED_IN,
)
relocated_module_attribute(
    "Subtask",
    "xbook.util.Subtask",
    _SUBTASKS_MODULE_VERSION,
    _REMOVED_IN,
)
relocated_module_attribute(
    "subtask",
    "xbook.util.subtask",
    _SUBTASKS_MODULE_VERSION,
    _REMOVED_IN,
)
