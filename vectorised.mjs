import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { LLMGraphTransformer } from "@langchain/community/experimental/graph_transformers/llm";
import * as fs from 'fs' 
import {} from 'dotenv/config'

import { graph } from './database.mjs';
import { model } from "./model.mjs";

export async function vectorised(filename){
  const filePath = `./uploads/${filename}`;
  let data = '';

  // File read
  function readFileAndProcess(filePath) {
    try {
      data = fs.readFileSync(filePath, 'utf8');
      // console.log("data : ", data);
    } catch (err) {
      console.error('Error reading the file:', err);
    }
    if (!data) {
      console.log("Empty File");
      return;
    }
  }
  readFileAndProcess(filePath);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 24,
  });
  const document = await splitter.splitDocuments([
    new Document({ pageContent: data }),
  ]);

  const llm_transformer = new LLMGraphTransformer({
    llm: model,
    allowed_nodes: ['Category'],
    allowed_relationships: ['Relation'],
    strict_mode: false
  })
  const graph_documents = await llm_transformer.convertToGraphDocuments(document);

  // store graph_documents to Neo4j
  await graph.addGraphDocuments(graph_documents);
}
