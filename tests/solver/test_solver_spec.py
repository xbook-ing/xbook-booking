import os
from random import random

from test_helpers.utils import ensure_test_package_installed

from xbook import Task, eval, eval_retry, task
from xbook.dataset import Sample
from xbook.log._log import EvalLog
from xbook.solver import (
    Generate,
    SolverSpec,
    TaskState,
    generate,
    solver,
)
from xbook.solver._chain import chain
from xbook.solver._solver import Solver


@solver
def the_solver(rate=1.0):
    @solver
    def failing_solver(rate=1.0):
        async def solve(state: TaskState, generate: Generate):
            if random() <= rate:
                raise ValueError("Eval failed!")
            return state

        return solve

    return chain(failing_solver(rate), generate())


@task
def the_task(solver: Solver = generate()):
    return Task(
        dataset=[Sample(input="Say hello.", target="Hello")],
        solver=solver,
    )


def test_solver_spec():
    solver_file = f"{os.path.relpath(__file__)}"

    def check_solver_spec(solver_spec: str):
        log = eval(
            f"{solver_file}@the_task",
            solver=SolverSpec(solver_spec, {"rate": 1.0}),
            model="mockllm/model",
        )[0]
        check_solver(log, solver_spec)

    check_solver_spec("the_solver")
    check_solver_spec(solver_file)
    check_solver_spec(f"{solver_file}@the_solver")


def test_solver_extension():
    ensure_test_package_installed()
    log = eval(
        the_task(), solver=SolverSpec("xbookpackage/cot"), model="mockllm/model"
    )[0]
    assert log.eval.solver == "xbookpackage/cot"
    assert log.plan.steps[0].solver == "chain_of_thought"


def test_solver_retry():
    log = eval(the_task(), solver=the_solver(1.0), model="mockllm/model")[0]
    check_solver(log)

    log = eval_retry(log)[0]
    check_solver(log)


def check_solver(log: EvalLog, solver_name="the_solver"):
    assert log.eval.solver == solver_name
    assert log.eval.solver_args == {"rate": 1.0}
    assert log.plan.steps[0].params["rate"] == 1.0
