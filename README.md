## Introduction

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app)

We have used the following versions of node and pnpm:

```
➜  my-ai-app git:(main) ✗ node --version
v21.2.0
➜  my-ai-app git:(main) ✗ pnpm --version
8.11.0
```

I've got errors with `pnpm` relate to IP6 when using node.js version 20:

```
➜  vercel-ai-quickstart-guide pnpm dlx create-next-app my-ai-app
 WARN  GET https://registry.npmjs.org/create-next-app error (ERR_INVALID_THIS). Will retry in 10 seconds. 2 retries left.
 WARN  GET https://registry.npmjs.org/create-next-app error (ERR_INVALID_THIS). Will retry in 1 minute. 1 retries left.
/Users/casianorodriguezleon/Library/pnpm/store/v3/tmp/dlx-11440:
 ERR_PNPM_META_FETCH_FAIL  GET https://registry.npmjs.org/create-next-app: Value of "this" must be of type URLSearchParams

This error happened while installing a direct dependency of /Users/casianorodriguezleon/Library/pnpm/store/v3/tmp/dlx-11440
```

The problem was fixed using node.js version >=21


The command used to create this project was:

```
pnpm dlx create-next-app my-ai-app
```

To the questions, we answered:

- [x] TypeScript
- [ ] EsLint
- [x] Tailwind CSS
- [ ] `src` directory
- [x] App Router
- [ ] customize the default `import alias (@/*)`?

`pnpm dlx create-next-app my-ai-app` fetches the package `create-next-app` from the registry without installing it as a dependency, hotloads it, and runs the default command binary it exposes with argument `my-ai-app`. Visit <https://pnpm.io/8.x/cli/dlx> for documentation about this command.

then 
    
``` 
cd my-ai-app
```

Next, we'll install `ai` and `openai`, OpenAI's official JavaScript SDK compatible with the Vercel Edge Runtime.


```
pnpm install ai openai
```

We create a `.env.local` file in our project root and add our OpenAI API Key. This key is used to authenticate your application with the OpenAI service.

```
touch .env.local
```

Edit the `.env.local` file:

```.env
OPENAI_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual OpenAI API key.

## Create an API Route

Create a Next.js Route Handler at  `app/api/completion/route.ts`. 
Create the folders 
- `api` and 
- `api/completion` and then 
- the file `app/api/completion/route.ts`. 

This handler will be using the Edge Runtime to generate a text completion via OpenAI, which will then be streamed back to Next.js.

Here's what the route handler should look like:

```ts
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
 
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
 
// Set the runtime to edge for best performance
export const runtime = 'edge';
 
export async function POST(req: Request) {
  const { prompt } = await req.json();
 
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
```

In the above code, the `openai.completions.create` method gets a response stream from the OpenAI API. 

```ts
const response = await openai.completions.create({
    model: 'text-davinci-003',
    stream: true,
    temperature: 0.6,
    max_tokens: 300,
    prompt: `...`,
  });
```

We then pass the `response` into the `OpenAIStream` provided by the `OpenAIStream` library. 

```ts
  const stream = OpenAIStream(response);
```

Then we use `StreamingTextResponse` to set the proper headers and response details in order to stream the response back to the client.

```ts
  return new StreamingTextResponse(stream);
```

## Wire up a UI

Finally, create a client component with a form to collect the prompt from the user and stream back the completion.

Create the file `app/page.tsx`:

```tsx
'use client'
 
import { useCompletion } from 'ai/react';
 
export default function SloganGenerator() {
  const { completion, input, handleInputChange, handleSubmit } = useCompletion();
 
  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      <form onSubmit={handleSubmit}>
        <input
          className="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2 dark:text-black"
          value={input}
          placeholder="Describe your business..."
          onChange={handleInputChange}
        />
      </form>
      {completion ? (
        <div className="whitespace-pre-wrap my-4">{completion}</div>
      ) : (
        <div>Enter a business description and click enter to generate slogans.</div>
      )}
    </div>
  );
}
```

This component utilizes the `useCompletion` hook, which will, by default, use the `POST` route handler we created earlier. 

```tsx
import { useCompletion } from 'ai/react';
```

The hook provides functions and state for handling user input and form submission.
    
```tsx
    const { completion, input, handleInputChange, handleSubmit } = useCompletion();
```

The `useCompletion` hook provides multiple utility functions and state variables:

- `completion` - This is the current completion result, a string value representing the generated text.
- `input` - This is the current value of the user's input field.
- `handleInputChange` and `handleSubmit` - These functions handle user interactions such as typing into the input field and submitting the form, respectively.
- `isLoading` This boolean indicates whether the API request is in progress or not.

## Running the Project

First, run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
Test it by entering a business description and see the AI-generated slogans in real-time.

You can start editing the page by modifying `app/page.tsx`. 
The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## References

To learn more about Next.js, take a look at the following resources:

- [Vercel SDK AI Quickstart tutorial](https://sdk.vercel.ai/docs/getting-started)
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
