from test_helpers.utils import file_check

from xbook import Task, task
from xbook.dataset import Sample
from xbook.scorer import includes
from xbook.solver import generate


@task
def task2():
    return Task(
        dataset=[
            Sample(id=id, input="What is 1+1?", target="2") for id in range(0, 10)
        ],
        solver=[file_check("task2.py"), generate()],
        scorer=includes(),
        metadata={"task_idx": 2},
    )
