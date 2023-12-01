import fs from "fs";
import path from 'path';
import { promptTemplate } from "./prompt";
import mergeTemplate from "./merge";
import { tools } from "./tools";

import pkg from 'template-file';
const { render, renderFile } = pkg;

import util from "util";
const deb = (x: any) => util.inspect(x, { depth: null });

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';


const answerQuestion = async (question: string) => {
  // construct the prompt, with our question and the tools that the chain can use
  let prompt = render(promptTemplate, 
    {
      question, 
      tools: Object.keys(tools).map(toolname => `${toolname}: ${tools[toolname].description}`).
             join("\n"), 
      toolnames: Object.keys(tools).join(",")
    });
  console.log(prompt);

  // allow the LLM to iterate until it finds a final answer
  while (true) {
    const response = await completePrompt(prompt);
    console.log(response);
    
    // add this to the prompt
    prompt += response;

    const action = response.match(/Action: (.+)/)?.[1];
    //console.log(`New prompt with the answer of the LLM:\n`)
    //console.log(prompt);

    if (action) {
      // execute the action specified by the LLMs
      const actionInput = response.match(/Action Input: "?(.*)"?/)?.[1];
      console.log(`Going to execute the tool ${action.trim}(${deb(actionInput)})`);
      const result = await tools[action.trim().toLowerCase()].execute(actionInput);
      prompt += `Observation: ${result}\n`
    } else {
      return response.match(/Final Answer: (.*)/)?.[1];
    }
  }
};

const completePrompt = async (prompt: string) =>
    await fetch("https://api.openai.com/v1/completions", { // https://platform.openai.com/docs/api-reference/completions
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
            model: "text-davinci-003",
            prompt,
            max_tokens: 256,  // The token count of your prompt plus max_tokens cannot exceed 
                              // the model's context length.
            temperature: 0.7, // Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
            stream: false, // boolean or null.  Optional. Defaults to false
                           // Whether to stream back partial progress. 
                           // If set, tokens will be sent as data-only server-sent events 
                           // as they become available, with the stream terminated by a 
                           // data: [DONE] message.
            stop: ["Observation:"], // string / array / null
                                    // See https://platform.openai.com/docs/api-reference/completions/create#completions-create-stop
                                    // Up to 4 sequences where the API will stop generating further tokens. 
                                    // The returned text will not contain the stop sequence. Defaults to null
        }),
    })
        .then((res) => res.json())
        .then((res) => res.choices[0].text) // res.choices is a list of completions. Can be more than one if n is greater than 1.
        .then((res) => {
            console.log(prompt);
            console.log(res);
            return res;
        })
        .catch((err) => { console.error(err); process.exit(1); })

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set the runtime to edge for best performance
// export const runtime = 'edge';
// Error: A Node.js API is used (process.cwd) which is not supported in the "Edge" Runtime.

let senv = process.env;
export async function POST(req: Request) {
  const { prompt } = await req.json();
 
  // Just to show you that env vars persist across requests
  senv.COUNTER = (Number(senv.COUNTER) + 1).toString();
  console.log('COUNTER', senv.COUNTER) 

  console.log("promptTemplate", promptTemplate);
  console.log("mergeTemplate", mergeTemplate);

  // Ask OpenAI for a streaming completion given the prompt
  const response = await openai.completions.create({
    model: 'text-davinci-003',
    stream: true,
    temperature: 0.6,
    max_tokens: 300,
    prompt: `Create three slogans for a business with unique features.
 
Business: Bookstore with cats
Slogans: "Purr-fect Pages", "Books and Whiskers", "Novels and Nuzzles"
Business: Gym with rock climbing
Slogans: "Peak Performance", "Reach New Heights", "Climb Your Way Fit"
Business: ${prompt}
Slogans:`,
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}