from xbook import Task, task
from xbook.dataset import Sample
from xbook.scorer import includes
from xbook.solver import generate, use_tools
from xbook.tool import web_browser


@task
def browser():
    return Task(
        dataset=[
            Sample(
                input=""
            )
        ],
        solver=[
            use_tools(web_browser()),
            generate(),
        ],
        scorer=includes(),
        sandbox="docker",
    )
