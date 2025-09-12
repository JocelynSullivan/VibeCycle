# AI Tool (replace with the name of your app)

This is a starter project and that you should update this README to reflect any additional instructions or description needed. For example, you will be using the [Ollama python library](https://github.com/ollama/ollama-python). What additional setup does a user of your app need to go through to get started?

## Getting started

Create a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements
```

Create the database:

```bash
createdb <name-of-db>
```

Rename `.env.example` to `.env` and adjust/fill in the variables.

For running the app, I recommend you use vscode. The `launch.json` is configured already, so you should be able to just start the debugger.

If you don't want to use vscode for any reason, you can run the app in the terminal:

```bash
uvicorn app.main:app --reload
```
