from fastmcp import FastMCP # pyright: ignore[reportMissingImports]
from fastapi import FastAPI


app = FastAPI()
mcp = FastMCP("Vibe Cycle")

@mcp.tool
def greet(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run()