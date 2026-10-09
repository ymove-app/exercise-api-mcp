# ymove-exercise-mcp

MCP (Model Context Protocol) server for the [YMove Exercise Video API](https://ymove.app/exercise-api). Use 1,413+ HD exercise videos, workout generation, and program building directly from Claude.

## Setup

### Hosted (no install)

Clients that support remote MCP servers can connect to the hosted endpoint directly. Send your API key in the `X-API-Key` header.

```bash
claude mcp add --transport http ymove https://exercise-api.ymove.app/mcp --header "X-API-Key: your_api_key"
```

Cursor (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ymove": {
      "url": "https://exercise-api.ymove.app/mcp",
      "headers": { "X-API-Key": "your_api_key" }
    }
  }
}
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ymove": {
      "command": "npx",
      "args": ["ymove-exercise-mcp"],
      "env": {
        "YMOVE_API_KEY": "your_api_key"
      }
    }
  }
}
```

### Claude Code (local)

```bash
claude mcp add ymove -e YMOVE_API_KEY=your_api_key -- npx ymove-exercise-mcp
```

Get your API key from the docs at [ymove.app/exercise-api](https://ymove.app/exercise-api) (free trial).

## Available Tools

| Tool | Description |
|------|-------------|
| `search_exercises` | Search and filter 1,413+ exercises by muscle group, equipment, difficulty, type |
| `get_exercise` | Get detailed exercise info with video URLs, instructions, muscles |
| `generate_workout` | Generate a structured workout with sets, reps, and rest times |
| `generate_program` | Generate a multi-week training program with periodization |
| `list_muscle_groups` | List all muscle groups with exercise counts |
| `list_exercise_types` | List all exercise types with counts |

## Example Prompts

Once connected, you can ask Claude things like:

- "Show me all chest exercises with dumbbells"
- "Generate an intermediate back workout with 6 exercises"
- "Create a 4-week muscle building program, 4 days per week"
- "What bodyweight exercises are available for core?"
- "Get details on the barbell squat exercise"

## Links

- [API Documentation](https://ymove.app/exercise-api/docs)
- [SDK (npm)](https://www.npmjs.com/package/ymove-exercise-api)
- [Sign Up](https://ymove.app/exercise-api/signup)
