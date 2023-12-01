import { Parser } from "expr-eval";

const googleSearch = async (question: string) => {
  console.log(`Google search question: ${question}\n***********`)

  let answer = await fetch(
    `https://serpapi.com/search?api_key=${process.env.SERPAPI_API_KEY}&q=${question}`
  ).then((res) => res.json()).then(
    (res) =>
      // try to pull the answer from various components of the response
      res.answer_box?.answer ||
      res.answer_box?.snippet ||
      res.organic_results?.[0]?.snippet
  );
  console.log(`Google search answer: ${answer}\n***********`)
  return answer;
}

const calculator = async (input: string) => {
  try {
    let answer = Parser.evaluate(input).toString()
    console.log(`Calculator answer: ${answer}\n***********`)
    return answer;
  } catch (e) {
    console.log(`Calculator got errors: ${e}\n***********`)
    return `Please reformulate the expression. The calculator tool has failed with error:\n'${e}'`;
  }
}

interface Tool {
  // tools that can be used to answer questions
  description: string;
  execute: (input: string) => Promise<string>;
}
interface ToolDict {
  [key: string]: Tool;
}
  
const tools: ToolDict = {
  search: {
    description:
      "A search engine. Useful for when you need to answer questions about current events. Input should be a search query.",
    execute: googleSearch,
  },
  calculator: {
    description:
      "Useful for getting the result of a numeric math expression. " +
      "The input to this tool should be a valid mathematical expression that could be executed by a simple calculator. " +
      "Examples of valid inputs for the calculator tool are: '(cos(2)+3!)*(-sqrt(2)*3)' and 'asin(0.5)^3'",
    execute: calculator,
  },
};

export { tools, calculator, googleSearch }
