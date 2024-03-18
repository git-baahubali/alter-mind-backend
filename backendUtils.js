const PdfParse = require('pdf-parse');
const fs = require('fs');

async function extractTextFromPDF(file) {
  const buffer = fs.readFileSync(file.path); // Assuming 'file' has a 'path' property from multer
  const data = await pdfParse(buffer);
  return data.text; 
}

// Function to split text into chunks
function splitIntoChunks(text, chunkSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        const tokens= roughTokenCount(text.substring(i, i + chunkSize));
        if(tokens< 7000)
        chunks.push(text.substring(i, i + chunkSize));
    else{
        const subchunks = splitIntoChunks(text.substring(i, i + Math.ceil(chunkSize / 2)), Math.ceil(chunkSize / 2));
        chunks.push(...subchunks);
    }
}
console.log("Total chunks", chunks.length);
return chunks;
}


function roughTokenCount(text) {
    // Split by spaces and punctuation for a rough approximation
    return text.split(/\s+|\b/).filter(Boolean).length;
}

 function generateTextEmbeddingPairs(Chunks, embeddings) {

   const clientData = [];
   for (let i = 0; i < Chunks.length; i++) {
     clientData.push({
       text: Chunks[i],
       vector: embeddings[i],
     });
   }
   // console.log(clientData);
   //  clientData = [
     //   { text: "text1", vector: [0.1, 0.2, 0.3, 0.4] },
     //   { text: "text2", vector: [0.5, 0.6, 0.7, 0.8] },
     // ];
     
     
     // Send embeddings to Zilliz
   return clientData;
}

module.exports = {splitIntoChunks,roughTokenCount,extractTextFromPDF,generateTextEmbeddingPairs}



