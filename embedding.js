const OpenAI = require("openai");
const { log } = require("util");


// apiKey:import.meta.env.REACT_APP_OPENAI_API_KEY;
const openai = new OpenAI({
    // apiKey:import.meta.env.VITE_OPENAI_API_KEY,
    apiKey:process.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});


// TODO: Logic to send chunks to OpenAI for embedding and then to Zilliz
 const getEmbeddingsFromOpenAI = async (Chunks) => {
  // TODO: Implement OpenAI embedding logic here
  const embeddings = [];
  for (const chunk of Chunks) {
    try {
      // Send chunks to OpenAI for embedding
      // console.log(chunk);
      const response = await openai.embeddings.create({
        input: chunk,
        model: "text-embedding-3-small", // Or another suitable model
        encoding_format: "float",
      });
      // console.log(response.data);
      embeddings.push(response.data[0].embedding);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      // Code to execute regardless of success or failure
    }
  }
  return embeddings;
};


function performCosineSimilarity(Dataembeddings,Qnembeddings){
  const cosineSimilarity = [];
  for (let i = 0; i < Dataembeddings.length; i++) {
    const data = Dataembeddings[i];
    const question = Qnembeddings[i];
    const dotProduct = data.reduce((acc, cur, idx) => acc + cur * question[idx], 0);
    const dataMagnitude = Math.sqrt(data.reduce((acc, cur) => acc + cur * cur, 0));
    const questionMagnitude = Math.sqrt(question.reduce((acc, cur) => acc + cur * cur, 0));
    const similarity = dotProduct / (dataMagnitude * questionMagnitude);
    cosineSimilarity.push(similarity);
  }
  console.log(cosineSimilarity);
  const maxSimilarity = Math.max(...cosineSimilarity);
  const maxIndex = cosineSimilarity.indexOf(maxSimilarity);
  console.log("maxSimilarity:",maxSimilarity,"MaxIndex:", maxIndex);
  // setAnswer(inputText.substring(maxIndex * 4000, (maxIndex + 1) * 4000));
  console.log(inputText.substring(maxIndex * 4000, (maxIndex + 1) * 4000));
  // return inputText.substring(maxIndex * 4000, (maxIndex + 1) * 4000);
  // return maxIndex;
  // return max
}

async function askGPT3( knowledge,secondPrompt) {
 
  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview", // Specify the model you're using
      // prompt: `The following text provides context for a question:\n\n"${knowledge}"\n\nBased on the above context, answer the following question succinctly:\n\nQuestion: ${query}\n\nAnswer:`,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {"role": "user", "content": knowledge},
        secondPrompt,
      ],
      temperature: 0.3,
      max_tokens: 250,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    }),
  });

  // console.log("openAiResponse: ",openAiResponse);
  const openAiResponseData = await openAiResponse.json();
  // console.log("openAiResponseData: ",openAiResponseData);

  // Extract the text from the OpenAI response
  const openAiText = openAiResponseData.choices[0].message.content.trim();

  // Return the text 
  console.log("openAiText: ",openAiText);
  return openAiText;
}


module.exports = {getEmbeddingsFromOpenAI,performCosineSimilarity,askGPT3}