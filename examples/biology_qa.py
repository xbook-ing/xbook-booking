from xbook import Task, task
from xbook.dataset import FieldSpec, example_dataset
from xbook.scorer import model_graded_qa
from xbook.solver import generate, use_tools
from xbook.tool import web_search


@task
def biology_qa() -> Task:
    return Task(
        dataset=example_dataset(
            name="biology_qa",
            sample_fields=FieldSpec(input="question", target="answer"),
        ),
        solver=[use_tools(web_search()), generate()],
        scorer=model_graded_qa(),
    )
