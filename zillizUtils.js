const fs = require("fs");
const { MilvusClient } = require("@zilliz/milvus2-sdk-node");
// import { config } from "../cloud-vectordb-examples/node/config.serverless";



// const {address,token} = config;
const address = "https://in03-816426eb267d0fd.api.gcp-us-west1.zillizcloud.com";
const token =
  "cee4afa99657b55d06cfc7c690119a2116475cc670672aff4e46813fa83687de59b6d8eef8ad79f6d9df12a4c359f5b2d858f9ca";
const client = new MilvusClient({ address, token });
const collectionName = "altermind";
// const data_file = `./medium_articles_2020_dpr.json`

const ViewCollection = async () => {
  res = await client.describeCollection({
    collection_name: collectionName,
  });

  console.log(res);
};

const insertMultiple = async (client_data) => {
  // client_data is expected in the form of a list of objects
  // [
  //   { text: "text1", vector: [0.1, 0.2, 0.3, 0.4] },
  //   { text: "text2", vector: [0.5, 0.6, 0.7, 0.8] },
  // ];

  const res = await client.insert({
    collection_name: collectionName,
    data: client_data,
  });
  console.log("multi insert complete: ", res);
  return res;
};

const searchWithEmbeddings = async (embeddings) => {
  res = await client.search({
    collection_name: collectionName,
    vector: embeddings,
    output_fields: ['text'],
    limit: 15,
})
return res;
};
module.exports = { insertMultiple, ViewCollection, searchWithEmbeddings };
