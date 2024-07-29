# LocalAssist

## Setup

### Neo4j Instance Setup

You can create a Neo4j instance using [Neo4j Aura](https://aura.neo4j.io/). Although local Neo4j instances are available, Neo4j Aura is recommended for simplicity.

Add your Neo4j connection details in the `.env` file:

NEO4J_URI=your_neo4j_uri
NEO4J_USERNAME=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password


### MistralAi Setup

Create an API key on MistralAi at [this link](https://mistral.ai/).

Add your MistralAi API key in the `.env` file:

MISTRAL_API_KEY=your-api-key


### Installation

Install dependencies using npm:
```bash
npm install
```

Go to http://localhost:3000/

Important Notes
Ollama LLM
Currently, Ollama LLM does not work with LLMGraphTransformer. For more details, refer to this issue.

ChatOllama
There is an alternative, ChatOllama, which supports this functionality but may still throw errors. You can explore it further here.

Still more to do on this project but feel free to contribute.