# Lab 3 — AI Use and Reflection  (fill this in)

**LLM/agent used:** <Gemini 3.7 Flash Medium>

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | begin laying the foundations like writing specification.md with these given business rules and context of the assignment. | Define the ambiguities that remains after the LLM produced the initial draft |
| 2 | Write out implementation plan, use lab 2 plan as base | Skim through the plan and ask for more details on some parts |
| 3 | Review the Docs on wether they are ready to be committed | I commited the doc after getting approval |
| 4 | create new branch, begin implementing feature 1, write out instructions to verify | i did follow up on the instructions to verify|
| 5 | create all place holder files to match the required directory | it did create the files but curiously they are not empty and some of them are already completed|
| 6 | i have a problem, of signing in sends me to old selector page | it did fix the problem |
| 7 | write me a checklist of things to verify for this branch | it did write the checklist and most of it was functional except few |
| 8 | Update Implementation plan to match the current implementation progress and reflect the changes made | it did update the plan, both retroactively and ones that are yet to be implemented | 
| 9 | the paging is horrid and does not match UI specs | It tried to rework on the UI and succeeded but did not fully align with UI specs, with some major things sticking out still even after the rework, so i have to prompt again |
| 10 | review the doccuments and compare to previous changes to see if any of it needs correction | It did find some things that needed to be corrected | 

## Reflection
Two or three sentences: what made your prompts better, and one place you had to correct or reject what the agent produced.

In contrast to lab 2 i did not use a seperate agent to write out the docs and refine them, i only let it write once on its own and left it at that. And it resulted in much more noticible gaps in the specification, and implementation efficiency compared to lab 2, having features that deserves to be bundled up together instead of being separate features, extending the chat and thus clogging up the memory, causing the later feature branches to have difficulty referencing the initial specifications

