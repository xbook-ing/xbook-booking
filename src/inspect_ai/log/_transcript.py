import contextlib
from contextvars import ContextVar
from datetime import datetime
from logging import getLogger
from typing import (
    Any,
    Iterator,
    Literal,
    Sequence,
    TypeAlias,
    Union,
)

from pydantic import BaseModel, Field, JsonValue, field_serializer

from xbook._util.constants import SAMPLE_SUBTASK
from xbook._util.error import EvalError
from xbook._util.json import JsonChange, json_changes
from xbook.dataset._dataset import Sample
from xbook.log._message import LoggingMessage
from xbook.model._chat_message import ChatMessage
from xbook.model._generate_config import GenerateConfig
from xbook.model._model_call import ModelCall
from xbook.model._model_output import ModelOutput
from xbook.scorer._metric import Score
from xbook.solver._task_state import state_jsonable
from xbook.tool._tool import ToolResult
from xbook.tool._tool_call import (
    ToolCall,
    ToolCallContent,
    ToolCallError,
    ToolCallView,
)
from xbook.tool._tool_choice import ToolChoice
from xbook.tool._tool_info import ToolInfo
from xbook.util._store import store, store_changes, store_jsonable

logger = getLogger(__name__)


class BaseEvent(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    """Time at which event occurred."""

    pending: bool | None = Field(default=None)
    """Is this event pending?"""

    @field_serializer("timestamp")
    def serialize_timestamp(self, dt: datetime) -> str:
        return dt.astimezone().isoformat()


class SampleInitEvent(BaseEvent):
    """Beginning of processing a Sample."""

    event: Literal["sample_init"] = Field(default="sample_init")
    """Event type."""

    sample: Sample
    """Sample."""

    state: JsonValue
    """Initial state."""


class SampleLimitEvent(BaseEvent):
    """The sample was unable to finish processing due to a limit"""

    event: Literal["sample_limit"] = Field(default="sample_limit")
    """Event type."""

    type: Literal["message", "time", "token", "operator"]
    """Type of limit that halted processing"""

    message: str
    """A message associated with this limit"""

    limit: int | None = Field(default=None)
    """The limit value (if any)"""


class StoreEvent(BaseEvent):
    """Change to data within the current `Store`."""

    event: Literal["store"] = Field(default="store")
    """Event type."""

    changes: list[JsonChange]
    """List of changes to the `Store`."""


class StateEvent(BaseEvent):
    """Change to the current `TaskState`"""

    event: Literal["state"] = Field(default="state")
    """Event type."""

    changes: list[JsonChange]
    """List of changes to the `TaskState`"""


class ModelEvent(BaseEvent):
    """Call to a language model."""

    event: Literal["model"] = Field(default="model")
    """Event type."""

    model: str
    """Model name."""

    input: list[ChatMessage]
    """Model input (list of messages)."""

    tools: list[ToolInfo]
    """Tools available to the model."""

    tool_choice: ToolChoice
    """Directive to the model which tools to prefer."""

    config: GenerateConfig
    """Generate config used for call to model."""

    output: ModelOutput
    """Output from model."""

    cache: Literal["read", "write"] | None = Field(default=None)
    """Was this a cache read or write."""

    call: ModelCall | None = Field(default=None)
    """Raw call made to model API."""


class ToolEvent(BaseEvent):
    """Call to a tool."""

    event: Literal["tool"] = Field(default="tool")
    """Event type."""

    type: Literal["function"] = Field(default="function")
    """Type of tool call (currently only 'function')"""

    id: str
    """Unique identifier for tool call."""

    function: str
    """Function called."""

    arguments: dict[str, JsonValue]
    """Arguments to function."""

    view: ToolCallContent | None = Field(default=None)
    """Custom view of tool call input."""

    result: ToolResult = Field(default_factory=str)
    """Function return value."""

    truncated: tuple[int, int] | None = Field(default=None)
    """Bytes truncated (from,to) if truncation occurred"""

    error: ToolCallError | None = Field(default=None)
    """Error that occurred during tool call."""

    events: list["Event"] = Field(default_factory=list)
    """Transcript of events for tool."""

    def set_result(
        self,
        result: ToolResult,
        truncated: tuple[int, int] | None,
        error: ToolCallError | None,
        events: list["Event"],
    ) -> None:
        self.result = result
        self.truncated = truncated
        self.error = error
        self.events = events
        self.pending = None


class ApprovalEvent(BaseEvent):
    """Tool approval."""

    event: Literal["approval"] = Field(default="approval")
    """Event type"""

    message: str
    """Message generated by model along with tool call."""

    call: ToolCall
    """Tool call being approved."""

    view: ToolCallView | None = Field(default=None)
    """View presented for approval."""

    approver: str
    """Aprover name."""

    decision: Literal["approve", "modify", "reject", "escalate", "terminate"]
    """Decision of approver."""

    modified: ToolCall | None = Field(default=None)
    """Modified tool call for decision 'modify'."""

    explanation: str | None = Field(default=None)
    """Explanation for decision."""


class InputEvent(BaseEvent):
    """Input screen interaction."""

    event: Literal["input"] = Field(default="input")
    """Event type."""

    input: str
    """Input interaction (plain text)."""

    input_ansi: str
    """Input interaction (ANSI)."""


class LoggerEvent(BaseEvent):
    """Log message recorded with Python logger."""

    event: Literal["logger"] = Field(default="logger")
    """Event type."""

    message: LoggingMessage
    """Logging message"""


class InfoEvent(BaseEvent):
    """Event with custom info/data."""

    event: Literal["info"] = Field(default="info")
    """Event type."""

    data: JsonValue
    """Data provided with event."""


class ErrorEvent(BaseEvent):
    """Event with sample error."""

    event: Literal["error"] = Field(default="error")
    """Event type."""

    error: EvalError
    """Sample error"""


class ScoreEvent(BaseEvent):
    """Event with sample score."""

    event: Literal["score"] = Field(default="score")
    """Event type."""

    score: Score
    """Sample score."""

    target: str | list[str] | None = Field(default=None)
    """"Sample target."""


class StepEvent(BaseEvent):
    """Step within current sample or subtask."""

    event: Literal["step"] = Field(default="step")
    """Event type."""

    action: Literal["begin", "end"]
    """Designates beginning or end of event."""

    type: str | None = Field(default=None)
    """Optional 'type' field for events"""

    name: str
    """Event name."""


class SubtaskEvent(BaseEvent):
    """Subtask spawned."""

    event: Literal["subtask"] = Field(default="subtask")
    """Event type."""

    name: str
    """Name of subtask function."""

    type: str | None = Field(default=None)
    """Type of subtask"""

    input: dict[str, Any]
    """Subtask function inputs."""

    result: Any = Field(default=None)
    """Subtask function result."""

    events: list["Event"] = Field(default_factory=list)
    """Transcript of events for subtask."""


Event: TypeAlias = Union[
    SampleInitEvent
    | SampleLimitEvent
    | StateEvent
    | StoreEvent
    | ModelEvent
    | ToolEvent
    | ApprovalEvent
    | InputEvent
    | ScoreEvent
    | ErrorEvent
    | LoggerEvent
    | InfoEvent
    | StepEvent
    | SubtaskEvent,
]
"""Event in a transcript."""


class Transcript:
    """Transcript of events."""

    def __init__(self, name: str = "") -> None:
        self.name = name
        self._events: list[Event] = []

    def info(self, data: JsonValue) -> None:
        """Add an `InfoEvent` to the transcript.

        Args:
           data (JsonValue): Data associated with the event.
        """
        self._event(InfoEvent(data=data))

    @contextlib.contextmanager
    def step(self, name: str, type: str | None = None) -> Iterator[None]:
        """Context manager for recording StepEvent.

        Args:
            name (str): Step name.
            type (str | None): Optional step type.
        """
        # step event
        self._event(StepEvent(action="begin", name=name, type=type))

        # run the step (tracking state/store changes)
        with track_state_changes(type), track_store_changes():
            yield

        # end step event
        self._event(StepEvent(action="end", name=name, type=type))

    @property
    def events(self) -> Sequence[Event]:
        return self._events

    def _event(self, event: Event) -> None:
        self._events.append(event)


def transcript() -> Transcript:
    """Get the current `Transcript`."""
    return _transcript.get()


@contextlib.contextmanager
def track_store_changes() -> Iterator[None]:
    before = store_jsonable(store())
    yield
    after = store_jsonable(store())

    changes = store_changes(before, after)
    if changes:
        transcript()._event(StoreEvent(changes=changes))


@contextlib.contextmanager
def track_state_changes(type: str | None = None) -> Iterator[None]:
    # we only want to track for step() inside the the sample
    # (solver level tracking is handled already and there are
    # no state changes in subtasks)
    if transcript().name == SAMPLE_SUBTASK and type != "solver":
        before = state_jsonable()
        yield
        after = state_jsonable()

        changes = json_changes(before, after)
        if changes:
            transcript()._event(StateEvent(changes=changes))
    else:
        yield


def init_transcript(transcript: Transcript) -> None:
    _transcript.set(transcript)


_transcript: ContextVar[Transcript] = ContextVar(
    "subtask_transcript", default=Transcript()
)
