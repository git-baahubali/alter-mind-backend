const express = require("express");
const cors = require("cors");

const {
  extractTextFromPDF,
  generateTextEmbeddingPairs,
  splitIntoChunks,
} = require("./backendUtils.js");
const { getEmbeddingsFromOpenAI, askGPT3 } = require("./embedding.js");
const { insertMultiple, searchWithEmbeddings } = require("./zillizUtils.js");

const app = express();
const port = 4000;
app.use(cors());
app.use(express.json()); // for parsing application/json

app.get("/", (req, res) => {
  res.send("Ai is here to stay !");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post("/api/upload-pdf", async (req, res) => {
  try {
    const { text } = req.body;
    console.log(text);
    // No PDF parsing - directly process the text
    // Split the text into chunks
    const chunkSize = 4 * 250;
    const chunks = splitIntoChunks(text, chunkSize);

    //text to embeddings
    const embeddings = await getEmbeddingsFromOpenAI(chunks);
    const data = generateTextEmbeddingPairs(chunks, embeddings);
    console.log("server.js -> data: ", data);
    // Insert the text and embedding pairs into Zilliz
    const zillizResponse = await insertMultiple(data);
    // console.log(zillizResponse);

    res.json({ message: "Text data loaded and processed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/api/ask-query", async (req, res) => {
  try {
    const { query } = req.body;
    console.log("query: ", query);

    // Split the query into chunks
    const chunkSize = 4 * 250;
    const chunks = splitIntoChunks(query, chunkSize);

    //query to embeddings
    const queryEmbedding = await getEmbeddingsFromOpenAI(chunks);

    // Search Zilliz for relevant embeddings
    const searchResults = await searchWithEmbeddings(queryEmbedding);
    const topFiveResults = searchResults.results;
    // console.log("searchResults",searchResults)

    //add the top 5 results to knowledge if score is greater than 0.3
    const minimumScore = 0.3;
    const knowledge = topFiveResults.reduce((context, searchResults) => {
      if (searchResults.score > minimumScore) {
        console.log("searchResults.score: ", searchResults.score);
        return (context += searchResults.text);
      }
      return context;
    }, "");
    console.log("knowledge: ", knowledge);

    // Ask GPT-3 for the answer
    const secondPrompt = {
      role: "user",
      content: `Based on the above context, succinctly answer the following question:\n\nQuestion: ${query} if question is not related to the knowledge reply with 'i cant help you with this information'`,
    };
    const answer = await askGPT3(knowledge, secondPrompt);

    // Return the answer  to frontend
    res.json({ results: answer });
    // res.json({ results: "Query processed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/api/summary", async (req, res) => {
  try {
    // Parse email thread
    const { emailThread } = req.body;
    const emailThreadinTextFormat = formatEmails(emailThread);

    const secondPrompt = {
      role: "user",
      content: `emailThread ${emailThreadinTextFormat} is a chain of emails .read all the emails and  summarize the email thread in 5 lines`,
    };

    // Ask GPT-3 for the summary
    const answer = await askGPT3("", secondPrompt);
    res.json({ summary: answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/api/rewrite-email", async (req, res) => {
  try {
    // Parse email text
    const { emailText, emailThread } = req.body;
    // console.log("emailThread: ", emailThread);
    const emailThreadinTextFormat = formatEmails(emailThread);

    const secondPrompt = {
      role: "user",
      content: `Given the email thread below and the specified email text, rewrite the email in three distinct tones: polite, neutral, and commanding. For each tone, create an object containing two keys: 'tone', which indicates the tone of the rewrite, and 'email', which contains the rewritten email text. Return the rewritten emails as an array of objects in the exact format shown in the example below. Ensure each rewrite maintains the original email's intent, adapted to the specified tone. The rewriting process should account for the original writer's limited fluency in English, aiming to improve clarity and appropriateness for different communication contexts.

      Email Thread:
      "${emailThreadinTextFormat}"
      
      Email Text:
      "${emailText}"
      
      Expected Output Format:
      [
        { "tone": "polite", "email": "<polite version of the email>" },
        { "tone": "neutral", "email": "<neutral version of the email>" },
        { "tone": "commanding", "email": "<commanding version of the email>" }
      ]
      
      Please adhere strictly to the specified output format, ensuring that the response is an array of objects with 'tone' and 'email' keys, corresponding to each of the three tones.
      `,
    };
    // Ask GPT-3 for the rewritten emails
    const gptResponse = await askGPT3('', secondPrompt);
    const cleanedResponse = gptResponse.replace(/```json\n|\n```/g, '');
    console.log(cleanedResponse);
    console.log("answer: ", JSON.parse(cleanedResponse));
    res.json({ emailSuggestions:JSON.parse(cleanedResponse) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

function formatEmails(emails) {
  return emails
    .map((email) => {
      return `
Subject: ${email.subject}
From: ${email.from}
To: ${email.to}
Date: ${email.date}
Body:
${email.body}
------------------------
`;
    })
    .join("\n");
}
