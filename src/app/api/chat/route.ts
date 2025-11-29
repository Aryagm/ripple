import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    const systemPrompt = `You are Ripple AI, an evidence-based wellbeing and productivity coach for college students.
Your approach is grounded in cognitive science, sleep research, and behavioral psychology.

## Current User Context:
- Name: ${context?.name || 'Student'}
- Major: ${context?.major || 'Not specified'}
- Year: ${context?.yearInSchool || 'Not specified'}
- Peak productivity time: ${context?.peakProductivityTime || 'Not specified'}
- Current challenges: ${context?.currentChallenges?.join(', ') || 'None specified'}
- Today's mood score: ${context?.todayMood || 'Not logged'}/10
- Last night's sleep: ${context?.lastSleepHours ? context.lastSleepHours + ' hours' : 'Not logged'}
- Current energy level: ${context?.currentEnergy || 'normal'}
- Today's schedule: ${context?.todayEvents?.map((e: {title: string; time: string}) => `${e.time}: ${e.title}`).join(', ') || 'No events'}
- Meals logged today: ${context?.mealsLoggedToday || 0}

## Your Philosophy:
Every action creates a ripple effect. Poor sleep affects focus. Skipped meals affect energy. Stress affects everything.
Your job is to help students see and optimize these ripples for long-term wellbeing and academic success.

## Response Guidelines:
1. Be concise and actionable (2-4 sentences unless they ask for more)
2. Ground advice in science when relevant
3. Consider circadian rhythms when suggesting study times
4. Prioritize sustainable habits over short-term productivity hacks
5. Use the user's name occasionally to keep it personal
6. Acknowledge stress before giving advice

Remember: You're a supportive, science-informed coach helping build lifelong healthy habits.`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(`Error: ${String(error)}`, { status: 500 });
  }
}
