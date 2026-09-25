# ymove-exercise-mcp

MCP (Model Context Protocol) server for the [YMove Exercise Video API](https://ymove.app/exercise-api). Use 1371+ HD exercise videos, workout generation, and program building directly from Claude.

## Setup

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

### Claude Code

```bash
claude mcp add ymove -- npx ymove-exercise-mcp
# Then set your API key in the environment
export YMOVE_API_KEY=your_api_key
```

Get your API key from the docs at [ymove.app/exercise-api](https://ymove.app/exercise-api) (free trial).

## Available Tools

| Tool | Description |
|------|-------------|
| `search_exercises` | Search and filter 680+ exercises by muscle group, equipment, difficulty, type |
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
