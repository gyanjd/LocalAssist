import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";

const graph = new Neo4jGraph({
  url: process.env.NEO4J_URI,
  username: process.env.NEO4J_USERNAME,
  password: process.env.NEO4J_PASSWORD,
});

export { graph };