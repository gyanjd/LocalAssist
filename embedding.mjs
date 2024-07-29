
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { ChatPromptTemplate, PromptTemplate,} from "@langchain/core/prompts";
import { ConversationChain } from "langchain/chains";
import { AIMessage, HumanMessage } from "@langchain/core/messages"
import { RunnableBranch, RunnableLambda, RunnablePassthrough, RunnableParallel, RunnableMap } from "@langchain/core/runnables";
import {} from 'dotenv/config'
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { graph } from './database.mjs';
import { model } from "./model.mjs";
import { StringOutputParser } from "@langchain/core/output_parsers";

const parser = new StringOutputParser();

const embedding = new MistralAIEmbeddings({
  apiKey: process.env.MISTRAL_API_KEY
});

const vector_index = await Neo4jVectorStore.fromExistingGraph(
  embedding,
  {
    url: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    searchType: "hybrid",
    nodeLabel: "Document",
    textNodeProperties: ["text"],
    embeddingNodeProperty: "embedding"
  }
)
const systemTemplate = "You are extracting organization and person entities from the text.";
const humanTemplate = "Use the given format to extract information from the following.";
const chatPrompt = ChatPromptTemplate.fromMessages(
  [
    ["system", systemTemplate],
    ["human", humanTemplate, "input: {question}"],
  ]
)

const entity_chain = new ConversationChain({ llm: model, prompt: chatPrompt });

function removeLuceneChars(input) {
  return input.replace(/[+\-&|!(){}\[\]^"~*?:\\]/g, '');
}

async function structuredRetriever(question) {
  let result = "";
  try {
        const response = await graph.query(
          `
          MATCH (node)
          WHERE node:Person OR node:Entity
          WITH node LIMIT 2
          CALL {
            WITH node
            MATCH (node)-[r:!MENTIONED]->(neighbor)
            RETURN node.id + ' - ' + type(r) + ' -> ' + neighbor.id AS output
            UNION ALL
            WITH node
            MATCH (node)<-[r:!MENTIONED]-(neighbor)
            RETURN neighbor.id + ' - ' + type(r) + ' -> ' + node.id AS output
          }
          RETURN output LIMIT 50
          `,
        );
    
        response.forEach(record => {
          result += record.output + '\n';
        });
  } catch (error) {
      console.error('Error in Neo4j:', error);
  } 
  return result;
}

async function retriever(question) {
  console.log(`Search query: ${question}`);

  const structuredData = await structuredRetriever(question);
  const unstructuredDataArray = await vector_index.similaritySearch(question);
  // Join the unstructured data with "#Document " separator
  const unstructuredData = unstructuredDataArray.map(el => el.page_content).join("#Document ");
  const finalData = `Structured data:
  ${structuredData}
  Unstructured data:
  ${unstructuredData}`;

  return finalData;
}

const template = "Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language. Chat History: {chat_history} Follow Up Input: {question} Standalone question:";
     
const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(template);

function formatChatHistory(chatHistory) {
  const buffer = [];
  for (const [human, ai] of chatHistory) {
      buffer.push(new HumanMessage({ content: human }));
      buffer.push(new AIMessage({ content: ai }));
  }
  return buffer;
}

const template2 = "Answer the question based only on the following context: {context} Question: {question} Use natural language and be concise. Answer:";

const prompt = ChatPromptTemplate.fromTemplate(template2);

export async function llmChat(inputText){

  const searchQuery = RunnableBranch.from([
    [
      new RunnableLambda({ func: (input) => !!input.chat_history }).withConfig({
        runName: "HasChatHistoryCheck"
      }),
      new RunnablePassthrough()
        .assign({
          chat_history: (input) => formatChatHistory(input.chat_history)
        })
        .pipe(CONDENSE_QUESTION_PROMPT)
        .pipe(model)
        .pipe(parser),
    ],
    new RunnableLambda({ func: (input) => input.question })
  ]);

  const chain = RunnableMap.from({
    context: searchQuery.pipe(retriever),
    question: new RunnablePassthrough()
  })
    .pipe(prompt)
    .pipe(model)
    .pipe(parser);

  const result = await chain.invoke({"question": inputText})
  return result
}