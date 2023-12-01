export const promptTemplate = `Answer the following questions as best you can. You have access to the following tools:

{{tools}}

Use the following format:

Question: the input question you must answer
Plan: you should ellaborate a plan of what to do according to the current knowledge
Action: the action to take, should be one of [{{toolnames}}]
Action Input: the input to the action
Observation: the result of the action
... (this Plan/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: when you are sure you know the final answer, fill it with the final answer to the original input question

Begin!

Question: {{question}}
`