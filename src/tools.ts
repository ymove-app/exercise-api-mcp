// @ts-nocheck: the MCP SDK infers types from every zod schema below, which
// runs tsc (and next build) out of memory. tsup builds this file without a
// type check, and the tools are exercised at runtime against the live API.
/**
 * YMove Exercise API - MCP tool definitions
 *
 * Shared by both ways of running the server:
 * - index.ts: local stdio server, published to npm as ymove-exercise-mcp
 * - the hosted endpoint at https://exercise-api.ymove.app/mcp
 *
 * Every tool is a thin call to the public v2 API with the caller's own key,
 * so auth, rate limits and usage metering stay in the API itself.
 */

import { z } from 'zod';

export const DEFAULT_BASE_URL = 'https://exercise-api.ymove.app/api/v2';

/** The one McpServer method used here, so any SDK copy's server fits. */
export interface ToolServer {
  tool(...args: any[]): unknown;
}

export interface ToolOptions {
  apiKey: string;
  baseUrl?: string;
}

export function registerTools(server: ToolServer, { apiKey, baseUrl = DEFAULT_BASE_URL }: ToolOptions) {

  async function apiGet(path: string): Promise<any> {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  async function apiPost(path: string, body: any): Promise<any> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  // ── Tools ──────────────────────────────────────────────

  server.tool(
    'search_exercises',
    'Search and filter exercises from the YMove exercise database (1,413+ exercises with HD videos). Filter by muscle group, equipment, difficulty, exercise type, or search by name. Note: most exercise videos are PORTRAIT (vertical, ~9:16), shot for mobile - build any video UI as a portrait player (aspect-ratio 9/16, object-fit cover), not landscape. Each video carries an "orientation" field.',
    {
      muscleGroup: z.enum(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full_body']).optional().describe('Filter by target muscle group'),
      equipment: z.enum(['machine', 'barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'cable']).optional().describe('Filter by equipment type'),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Filter by difficulty level'),
      exerciseType: z.enum(['strength', 'yoga', 'stretching', 'cardio', 'plyometric', 'calisthenics', 'warmup', 'cooldown', 'balance', 'mobility', 'isometric', 'rehabilitation', 'functional', 'core', 'hiit']).optional().describe('Filter by exercise type'),
      search: z.string().optional().describe('Search exercises by name'),
      hasVideo: z.boolean().optional().describe('Only return exercises with video'),
      page: z.number().optional().describe('Page number (default: 1)'),
      pageSize: z.number().optional().describe('Results per page (default: 20, max: 50)'),
    },
    async (params) => {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
      const result = await apiGet(`/exercises${query ? '?' + query : ''}`);
      const exercises = result.data.map((ex: any) => ({
        title: ex.title,
        slug: ex.slug,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        exerciseType: ex.exerciseType,
        hasVideo: ex.hasVideo,
        description: ex.description,
        videoUrl: ex.videoUrl,
        thumbnailUrl: ex.thumbnailUrl,
        orientation: ex.videos?.[0]?.orientation ?? 'portrait',
      }));
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ exercises, pagination: result.pagination }, null, 2),
        }],
      };
    }
  );

  server.tool(
    'get_exercise',
    'Get detailed information about a specific exercise by slug or ID, including video URLs, instructions, and muscle data. Videos are usually PORTRAIT (vertical, ~9:16) - check each video\'s "orientation" field and render in a portrait player (aspect-ratio 9/16, object-fit cover), not landscape.',
    {
      idOrSlug: z.string().describe('Exercise slug (e.g., "barbell-squat") or UUID'),
    },
    async ({ idOrSlug }) => {
      const result = await apiGet(`/exercises/${encodeURIComponent(idOrSlug)}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'generate_workout',
    'Generate a structured workout with specific exercises, sets, reps, and rest times for a target muscle group.',
    {
      muscleGroup: z.enum(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core']).describe('Target muscle group'),
      equipment: z.enum(['machine', 'barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'cable']).optional().describe('Limit to specific equipment'),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Difficulty level (default: intermediate)'),
      exerciseCount: z.number().min(3).max(12).optional().describe('Number of exercises (default: 6)'),
    },
    async (params) => {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
      const result = await apiGet(`/workouts/generate?${query}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'generate_program',
    'Generate a multi-week training program with periodization. Returns a complete weekly schedule with exercises for each training day.',
    {
      goal: z.enum(['muscle_building', 'weight_loss', 'strength', 'endurance']).optional().describe('Training goal (default: muscle_building)'),
      daysPerWeek: z.number().min(3).max(6).optional().describe('Training days per week (default: 4)'),
      weeks: z.enum(['4', '8', '12']).optional().describe('Program duration in weeks (default: 4)'),
      equipment: z.enum(['machine', 'barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'cable']).optional().describe('Limit to specific equipment'),
    },
    async (params) => {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
      const result = await apiGet(`/programs/generate?${query}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'list_muscle_groups',
    'List all available muscle groups with the number of exercises in each.',
    {},
    async () => {
      const result = await apiGet('/exercises/muscle-groups');
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'list_exercise_types',
    'List all exercise types (strength, yoga, cardio, etc.) with counts.',
    {},
    async () => {
      const result = await apiGet('/exercises/exercise-types');
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  // ── Food & Nutrition Tools ─────────────────────────────

  server.tool(
    'search_foods',
    'Search the nutrition database for foods by name or category. Returns nutritional data per serving.',
    {
      q: z.string().optional().describe('Search foods by name'),
      category: z.string().optional().describe('Filter by food category'),
      page: z.number().optional().describe('Page number (default: 1)'),
      pageSize: z.number().optional().describe('Results per page (default: 20, max: 50)'),
    },
    async (params) => {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
      const result = await apiGet(`/foods${query ? '?' + query : ''}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ foods: result.data, pagination: result.pagination }, null, 2),
        }],
      };
    }
  );

  server.tool(
    'get_food',
    'Get detailed nutritional information for a specific food by ID.',
    {
      id: z.string().describe('Food UUID'),
    },
    async ({ id }) => {
      const result = await apiGet(`/foods/${encodeURIComponent(id)}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'barcode_lookup',
    'Look up a food product by barcode (UPC/EAN). Returns nutritional data and product image.',
    {
      upc: z.string().describe('Product barcode (UPC or EAN)'),
    },
    async ({ upc }) => {
      const result = await apiGet(`/foods/barcode/${encodeURIComponent(upc)}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'calculate_meal',
    'Calculate total nutrition for a combination of foods with specific quantities.',
    {
      items: z.array(z.object({
        foodId: z.string().describe('Food UUID'),
        quantityG: z.number().optional().describe('Quantity in grams'),
      })).describe('List of foods with quantities'),
    },
    async ({ items }) => {
      const result = await apiPost('/meals/calculate', { items });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'log_food_text',
    'Analyze a text description of food/meal using AI. Identifies individual foods, estimates portions, and calculates nutrition.',
    {
      text: z.string().describe('Description of food or meal (e.g. "grilled chicken with rice and broccoli")'),
    },
    async ({ text }) => {
      const result = await apiPost('/foods/log/text', { text });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );

  server.tool(
    'search_recipes',
    'Search recipes by name, meal type, diet, cuisine, and nutritional filters.',
    {
      q: z.string().optional().describe('Search recipes by title'),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']).optional().describe('Filter by meal type'),
      diet: z.enum(['high_protein', 'low_carb', 'vegetarian', 'vegan', 'keto', 'gluten_free', 'dairy_free', 'paleo', 'mediterranean']).optional().describe('Filter by diet tag'),
      cuisine: z.string().optional().describe('Filter by cuisine type'),
      maxCalories: z.number().optional().describe('Maximum calories per serving'),
      minProtein: z.number().optional().describe('Minimum protein per serving (grams)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      pageSize: z.number().optional().describe('Results per page (default: 20, max: 50)'),
    },
    async (params) => {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
      const result = await apiGet(`/recipes/search${query ? '?' + query : ''}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ recipes: result.data, pagination: result.pagination }, null, 2),
        }],
      };
    }
  );

  server.tool(
    'get_recipe',
    'Get a full recipe with ingredients, instructions, and nutritional breakdown by ID or slug.',
    {
      idOrSlug: z.string().describe('Recipe UUID or slug (e.g. "high-protein-chicken-bowl")'),
    },
    async ({ idOrSlug }) => {
      const result = await apiGet(`/recipes/${encodeURIComponent(idOrSlug)}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    }
  );
}
