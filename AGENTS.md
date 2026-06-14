# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise
- explain the terminal commands you are going to run before running them,in short 
- use the terminal wmux tool to run service when every you see an ideal pane instead of runing it  in the background.  
- Always run agent in new pane , if he is not already running in one , and if there is no ideal pane , ask the user to open a terminal beside you and run the agent there.
## PLANNING MODE

- Always ask clarifying questions
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## CHANGE / EDIT MODE

- Identify changes from the plan that can be implemented in parallel, and use sub-agents or agents  to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- Use the best model for the task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check and next build to check code quality

## DATABASE SCHEMA CHANGES

- Whenever you make changes to the database schema, ALWAYS run the drizzle generate and migrate commands
- NEVER run drizzle push!
- For all ID columns NOT related to BetterAuth, use UUID for the ID columns and be randomly generated

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages.
- Design System: @DESIGN.md

# AGENTS

Guidance for AI agents working on **SpeakType**.

> 🚧 **Reserved.** Project system structure and work organization will be defined
> here in an upcoming session. Keep this file as the top-level entry point for agents.
