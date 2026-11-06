# Lab 2 — AI Use and Reflection  (fill this in)

**LLM/agent used:** <Gemini 3.7 Flash Medium + ChatGpt>

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | In summary i had these request from Stakeholder, please provide me with an implementation plan, in writing the doccuments to be used by the coding agent | The Agent gave me a rather overly complex implementation plan, which i had to simplify futher in next few prompts, then carry out one by one |
| 2 | Write out UI specifications with following rules | The Agent gave me a very disarrayed UI specifications, mixed with instructions, things to expect among other things that aren't the main goal, so i had to redo the UI Specification prompt to be more objective and less instruction-based, and more rules-based, on what needs to be done and the end result instead of the process |
| 3 | Write Out API specs with following rules and template | The Agent did a good job with the API specs prompt and gave a fairly good API specs, after i learned to make the prompt more objective, and i copied it into the API specs file right away |
| 4 | make an Implementation plan Listing what features to implement one by one  | The Agent gave me an overly fragmented and scattered implementation plan, which i reprompted to make it more organized and wrapped together properly |
| 5 | Reviewed the given specification draft in specification.md and assess whether it's ready to be used in the next step | The Agent gave a good feedback and told me its ready but also pointed out some small issues, like missing contents and points that needed to be polished  |
| 6 | Read UI specifications and look for ambiguities, list them out | The agent, list out several ambiguities that i hadn't noticed, then i went on define them in a prompt to let the agent edit the specification to make them more clear and un-ambiguous |
| 7 | Implement Feature 1, write me instructions on how to replicate the test | The Agent gave me a list of instructions on how to replicate the test, which i followed and implemented the feature successfully |
| 8 | Make a change to the ticket creation page, with these new following added rules | The agent updated the ticket creation page based on my new specifications without much issue |
| 9 | Seed more Ticket entries | The Agent, for some reason struggle to really bad for several times before getting it right after many re-prompting | 
| 10 | Read tests.md and check if everything is implemented correctly | The Agent gave a good feedback and told me everything is implemented correctly (i had already ran all the tests myself and they were passing, but i wanted the agent to check for missed edge cases and things like that) |

## Reflection
Two or three sentences: what made your prompts better, and one place you had to correct or reject what the agent produced.

To put it simply, the prompts that gave the most success were the ones that were most objective and less instruction-based, rather instead of telling the agent what to do, i told it the end result i wanted, with a list of rules it had to follow, this made the agent give more clear and organized answers that were easier to work with.

Only few places where i actually had to correct the agent, The example was when it gave me a fragmented and scattered implementation plan, or terrible seed data, in which needed reprompting several times to get right.
