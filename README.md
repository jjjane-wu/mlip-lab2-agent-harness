# Lab 2: Coding Agents and Agent Harnesses

In this lab, you will use an AI coding agent for software testing and compare a baseline workflow with an enhanced **agent harness** using Playwright and a reusable Skill.

You may use the coding agent you normally work with, as long as it can inspect and modify a local repository.

To receive credit for this lab, show your work to the TA during recitation.

## Deliverables

- [ ] Use a coding agent with its default setup to generate tests for the shopping cart functionality.
- [ ] Enhance the agent harness with Playwright and a reusable web-testing Skill, then test the checkout workflow end-to-end.
- [ ] Explain to the TA what value the enhanced harness added, including your choice of Playwright CLI or MCP and the role of the Skill.

## Getting started

Clone the starter repository and install dependencies:

```bash
git clone https://github.com/jcortega-projects/mlip-lab2-agent-harness.git
cd mlip-lab2-agent-harness
npm install
npm test
```

Start the application with:

```bash
npm run dev
```

Create a branch for Part 1:

```bash
git switch -c part1-baseline
```

## Part 1: Baseline Coding Agent

Use your coding agent with its default setup. Do not add custom Skills, Playwright, or MCP yet.

Give the agent the following task:

> Write automated tests for the shopping cart functionality of this application.
>
> At minimum, cover:
> - adding a product to the cart;
> - increasing and decreasing product quantity;
> - removing an item;
> - verifying that total item count and total price update correctly.
>
> Run the tests and make sure they pass.
>
> Do not modify the application solely to make the tests pass.

### Checkoff

Show the TA:

- the generated tests and test results;
- one thing the agent did well;
- one thing that could be improved.

Save your work:

```bash
git add .
git commit -m "Complete Part 1 baseline"
git switch main
git switch -c part2-enhanced
```

Part 2 should begin from the original starter application.

## Part 2: Enhance the Agent Harness

For this part, add:

1. Playwright for browser-based testing; and
2. a reusable web-testing Skill.

If possible, use the same coding agent and model as in Part 1.

### 1. Choose Playwright CLI or MCP

Choose one:

- **Playwright CLI / test runner**
- **Playwright MCP**

Configure your choice so the agent can interact with the running application.

Be ready to explain to the TA:

- the difference between CLI and MCP;
- why you chose one;
- one tradeoff of your choice.

### 2. Complete the web-testing Skill

Use the template:

```text
skill-template/web-testing/SKILL.md
```

Copy it into the project-level Skill location supported by your coding agent and complete the TODOs.

The Skill should contain reusable guidance for web testing rather than instructions specific to this checkout task.

Start a new agent session after configuring the Skill.

### 3. Test the checkout workflow

Make sure the application is running:

```bash
npm run dev
```

Give the agent the following task:

> Write automated end-to-end tests for the checkout workflow of this application.
>
> Before writing the final tests, use Playwright to explore the running application through a real browser.
>
> Consider successful and unsuccessful interactions, important state changes, and relevant edge cases.
>
> Use the web-testing Skill and your configured Playwright setup.
>
> The final tests must be Playwright end-to-end tests.
>
> Run the tests and investigate failures. Determine whether a failure is caused by the test or may indicate an application defect.
>
> Do not modify the application solely to make a failing test pass.

### Checkoff

Show the TA:

- your completed `SKILL.md`;
- your Playwright setup and browser interaction;
- the generated E2E tests and results;
- one example of how the Skill affected the agent's behavior;
- any unexpected behavior or potential defect you investigated.

Also explain what Playwright enabled the agent to do that was different from Part 1.

## Part 3: Reflection

Using your results from Parts 1 and 2, discuss with the TA:

- What value did the Skill add beyond the prompt?
- What did Playwright add to the agent harness?
- Did the enhanced harness change the agent's behavior?
- What still required human judgment?
- When would the extra harness complexity be worth using?

## Additional resources

- [Agent Skills specification](https://agentskills.io/)
- [Playwright](https://playwright.dev/)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
