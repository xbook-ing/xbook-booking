from test_helpers.utils import file_check

from xbook import Task, task
from xbook.dataset import Sample
from xbook.scorer import includes
from xbook.solver import generate


@task
def task1():
    return Task(
        dataset=[Sample(input="What is 1+1?", target="2")],
        solver=[file_check("task1.py"), generate()],
        scorer=includes(),
        metadata={"task_idx": 1},
    )
