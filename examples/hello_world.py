from xbook import Task, task
from xbook.dataset import Sample
from xbook.scorer import exact
from xbook.solver import generate

# This is the simplest possible xbook eval, useful for testing your configuration / network / platform etc.


@task
def hello_world():
    return Task(
        dataset=[
            Sample(
                input="Just reply with Hello World",
                target="Hello World",
            )
        ],
        solver=[
            generate(),
        ],
        scorer=exact(),
    )
