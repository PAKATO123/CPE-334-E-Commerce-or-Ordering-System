# Lab 4 — AI Use and Reflection

**LLM/agent used:** Gemini 2.5 Flash / Google Antigravity Agent

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | begin laying the foundations like writing specification.md among other documents with these given business rules and context of the assignment. For Ambiguities, do exert common sense and standard practices for obvious decisions, and leave the remainings for me to define | Define the ambiguities that remains after the LLM produced the initial draft |
| 2 | Write Implementation plan for Lab 4, dont fragment it too much, each branch must be testable on its own, while having both front and back end changes complete and isolated in each branch | It returns with 3 branch not including doccumentation branch, which i was alittle skeptical, but i follow through with it | 
| 3 | Review all of the doccuments written and check to see if there is anything that needs correcting or refining | It does refine it to be more detailed and so i follow through with it | 
| 4 | Generate the dummy placeholder files to match this given required directory | It does its task. although some of things came fully written, which was outside the scope of what i wanted so i had to delete some of the files |
| 5 | Reine implementation plan to describe what is testable when each branch is done and how to verify them | I went ahead and review the refined implementation plan and ask agents for clarifications |
| 6 | Implement branch 1, test, and tell me how to verify, dont commit yet | It gives me the result for it with clear instructions on what to do next, and i follow through and verify them, while asking for adjustments |
| 7 | Implement branch 2, test, and tell me how to verify, dont commit yet | It does give me the result and i go through the motions to verify it, but then i noticed it missed out on some parts of the UI or straight up broken features, and so i had to ask it for corrections multiple times |
| 8 | Go through all of the pages and make sure the colors still align with the UI specs as some of them is out of place | It go through it and make some adjustments here and there, and i judge wether its good enough |
| 9 | Implement branch 3, test, and tell me how to verify, dont commit yet | It does give me the result and i go through the motions to verify it, but there was even more broken pieces and really terrible UI and UX by extension, that i had to chat back and fourth with agent multiple times to correct them |
| 10 | Implement branch 4, verify with the specs, make sure everything is in place and ready to go and tell me how to verify that everything has been completed | It tells me that everything has been completed, and i proceed to verify with the specs and instructions, and it turns out it was mostly correct with few adjustment needed | 

## Reflection
Overall compared to lab 3, my prompts have became more detailed and specific, however i have noticed that when i condensed my prompt for the agent to do too many tasks at once, it leads to it skipping details, forgetting some of the earlier constraints, and/or producing buggy code that are further from the specification, or just overall ugly code and UX, i really have to balance between being specific enough to avoid the previous problems and scoped down enough to avoid overwhelming the agent per each prompt.
