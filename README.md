
Welcome to xbook, a framework for large language model evaluations created by the [Xbook Ing](https://xbook.ing).

xbook provides many built-in components, including facilities for prompt engineering, tool usage, multi-turn dialog, and model graded evaluations. Extensions to xbook (e.g. to support new elicitation and scoring techniques) can be provided by other Python packages.

To get started with xbook, please see the documentation at <https://xbook.ing/whitepaper>.

***



To work on development of xbook, clone the repository and install with the `-e` flag and `[dev]` optional dependencies:

```bash
$ git clone https://github.com/xbook-ing
$ cd xbook-ing
$ pip install -e ".[dev]"
```

Optionally install pre-commit hooks via
```bash
make hooks
```

Run linting, formatting, and tests via
```bash
make check
make test
```

If you use VS Code, you should be sure to have installed the recommended extensions (Python, Ruff, and MyPy). Note that you'll be prompted to install these when you open the project in VS Code.
