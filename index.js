import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import express from "express";

// Configuração da API do backend
const API_BASE_URL = "http://localhost:8090/api";

const server = new Server(
  {
    name: "lista-compras-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Definindo as ferramentas disponíveis para os agentes IA
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_shopping_lists",
        description: "Lista todas as listas de compras disponíveis no sistema.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "add_item_to_list",
        description: "Adiciona um novo item a uma lista de compras existente.",
        inputSchema: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "O ID da lista de compras",
            },
            description: {
              type: "string",
              description: "Nome ou descrição do item",
            },
            quantity: {
              type: "number",
              description: "Quantidade do item",
            },
            price: {
              type: "number",
              description: "Preço estimado ou atual do item",
            },
            unit: {
              type: "string",
              description: "Unidade de medida (ex: und, g, kg, l, ml)",
            }
          },
          required: ["listId", "description", "quantity", "price"],
        },
      },
      {
        name: "edit_item_in_list",
        description: "Edita ou atualiza as propriedades de um item existente em uma lista de compras.",
        inputSchema: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "O ID da lista de compras que contém o item",
            },
            itemId: {
              type: "string",
              description: "O ID do item a ser editado",
            },
            description: {
              type: "string",
              description: "Novo nome ou descrição do item",
            },
            quantity: {
              type: "number",
              description: "Nova quantidade do item",
            },
            price: {
              type: "number",
              description: "Novo preço estimado ou atual do item",
            },
            unit: {
              type: "string",
              description: "Nova unidade de medida (und, g, kg, l, ml)",
            },
            isChecked: {
              type: "boolean",
              description: "Status de marcação do item (comprado ou não)",
            }
          },
          required: ["listId", "itemId"],
        },
      },
      {
        name: "delete_item_from_list",
        description: "Exclui um item de uma lista de compras.",
        inputSchema: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "O ID da lista de compras que contém o item",
            },
            itemId: {
              type: "string",
              description: "O ID do item a ser excluído",
            }
          },
          required: ["listId", "itemId"],
        },
      },
      {
        name: "edit_shopping_list",
        description: "Edita o nome ou orçamento (budget) de uma lista de compras existente.",
        inputSchema: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "O ID da lista de compras a ser editada",
            },
            name: {
              type: "string",
              description: "Novo nome da lista de compras",
            },
            budget: {
              type: "number",
              description: "Novo orçamento limite da lista de compras",
            }
          },
          required: ["listId"],
        },
      },
      {
        name: "delete_shopping_list",
        description: "Exclui permanentemente uma lista de compras inteira e todos os seus itens.",
        inputSchema: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "O ID da lista de compras a ser excluída",
            }
          },
          required: ["listId"],
        },
      },
      {
        name: "set_item_completion_status",
        description: "Marca ou desmarca um item como comprado (isChecked).",
        inputSchema: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "O ID da lista de compras que contém o item",
            },
            itemId: {
              type: "string",
              description: "O ID do item a ser marcado/desmarcado",
            },
            isChecked: {
              type: "boolean",
              description: "true se o item foi comprado, false se não foi",
            }
          },
          required: ["listId", "itemId", "isChecked"],
        },
      },
      {
        name: "create_shopping_list",
        description: "Cria uma nova lista de compras vazia no sistema.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "O nome da nova lista de compras",
            },
            budget: {
              type: "number",
              description: "O orçamento limite da lista de compras (opcional)",
            },
            description: {
              type: "string",
              description: "Uma breve descrição para a lista de compras (opcional)",
            }
          },
          required: ["name"],
        },
      }
    ],
  };
});

// Implementação das ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "get_shopping_lists") {
      const response = await axios.get(`${API_BASE_URL}/lists`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    if (request.params.name === "add_item_to_list") {
      const { listId, description, quantity, price, unit } = request.params.arguments;
      const response = await axios.post(`${API_BASE_URL}/lists/${listId}/items`, {
        description,
        quantity,
        price,
        unit: unit || "und",
        isChecked: false
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Item adicionado com sucesso! Dados: ${JSON.stringify(response.data)}`,
          },
        ],
      };
    }

    if (request.params.name === "edit_item_in_list") {
      const { listId, itemId, description, quantity, price, unit, isChecked } = request.params.arguments;
      
      // Busca a lista para obter o item atual e não perder campos não fornecidos
      const listResponse = await axios.get(`${API_BASE_URL}/lists/${listId}`);
      const list = listResponse.data;
      
      if (!list || !list.items) {
        throw new Error(`Lista de compras com ID ${listId} não encontrada ou não possui itens.`);
      }
      
      const currentItem = list.items.find(item => item.id === itemId);
      if (!currentItem) {
        throw new Error(`Item com ID ${itemId} não encontrado na lista ${listId}.`);
      }
      
      // Mescla os novos valores com os existentes
      const updatedItem = {
        description: description !== undefined ? description : currentItem.description,
        quantity: quantity !== undefined ? quantity : currentItem.quantity,
        price: price !== undefined ? price : currentItem.price,
        unit: unit !== undefined ? unit : currentItem.unit,
        isChecked: isChecked !== undefined ? isChecked : currentItem.isChecked,
        category: currentItem.category // preserva a categoria
      };
      
      const response = await axios.put(`${API_BASE_URL}/lists/${listId}/items/${itemId}`, updatedItem);
      
      return {
        content: [
          {
            type: "text",
            text: `Item atualizado com sucesso! Dados: ${JSON.stringify(response.data)}`,
          },
        ],
      };
    }

    if (request.params.name === "delete_item_from_list") {
      const { listId, itemId } = request.params.arguments;
      
      await axios.delete(`${API_BASE_URL}/lists/${listId}/items/${itemId}`);
      
      return {
        content: [
          {
            type: "text",
            text: `Item com ID ${itemId} foi excluído com sucesso da lista ${listId}.`,
          },
        ],
      };
    }

    if (request.params.name === "edit_shopping_list") {
      const { listId, name, budget } = request.params.arguments;
      
      const listResponse = await axios.get(`${API_BASE_URL}/lists/${listId}`);
      const list = listResponse.data;
      
      if (!list) {
        throw new Error(`Lista de compras com ID ${listId} não encontrada.`);
      }
      
      const updatedList = {
        name: name !== undefined ? name : list.name,
        budget: budget !== undefined ? budget : list.budget
      };
      
      const response = await axios.put(`${API_BASE_URL}/lists/${listId}`, updatedList);
      
      return {
        content: [
          {
            type: "text",
            text: `Lista de compras atualizada com sucesso! Dados: ${JSON.stringify(response.data)}`,
          },
        ],
      };
    }

    if (request.params.name === "delete_shopping_list") {
      const { listId } = request.params.arguments;
      
      await axios.delete(`${API_BASE_URL}/lists/${listId}`);
      
      return {
        content: [
          {
            type: "text",
            text: `Lista de compras com ID ${listId} foi excluída com sucesso.`,
          },
        ],
      };
    }

    if (request.params.name === "set_item_completion_status") {
      const { listId, itemId, isChecked } = request.params.arguments;
      
      const listResponse = await axios.get(`${API_BASE_URL}/lists/${listId}`);
      const list = listResponse.data;
      
      if (!list || !list.items) {
        throw new Error(`Lista de compras com ID ${listId} não encontrada ou não possui itens.`);
      }
      
      const currentItem = list.items.find(item => item.id === itemId);
      if (!currentItem) {
        throw new Error(`Item com ID ${itemId} não encontrado na lista ${listId}.`);
      }
      
      const updatedItem = {
        description: currentItem.description,
        quantity: currentItem.quantity,
        price: currentItem.price,
        unit: currentItem.unit,
        isChecked: isChecked,
        category: currentItem.category
      };
      
      const response = await axios.put(`${API_BASE_URL}/lists/${listId}/items/${itemId}`, updatedItem);
      
      return {
        content: [
          {
            type: "text",
            text: `Status do item atualizado com sucesso! Comprado: ${response.data.isChecked}`,
          },
        ],
      };
    }

    if (request.params.name === "create_shopping_list") {
      const { name, budget, description } = request.params.arguments;
      
      const newList = {
        name,
        budget: budget !== undefined ? budget : 0.0,
        description: description || "",
        status: "OPEN",
        items: []
      };
      
      const response = await axios.post(`${API_BASE_URL}/lists`, newList);
      
      return {
        content: [
          {
            type: "text",
            text: `Lista de compras criada com sucesso! Dados: ${JSON.stringify(response.data)}`,
          },
        ],
      };
    }

    throw new Error("Ferramenta desconhecida");
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Erro ao executar ferramenta: ${error.message}${error.response ? ' - ' + JSON.stringify(error.response.data) : ''}`,
        },
      ],
      isError: true,
    };
  }
});

// Iniciando o servidor usando transporte Stdio ou SSE/Express
async function main() {
  const mode = process.argv[2] || "stdio";

  if (mode === "sse") {
    const app = express();
    const port = process.env.PORT || 3000;

    // Armazena conexões ativas por session ID
    const transports = {};

    app.get("/sse", async (req, res) => {
      console.error("Estabelecendo conexão SSE...");
      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;

      res.on("close", () => {
        console.error(`Conexão SSE encerrada para sessão ${transport.sessionId}`);
        delete transports[transport.sessionId];
      });

      await server.connect(transport);
      console.error(`Servidor conectado à sessão SSE ${transport.sessionId}`);
    });

    app.post("/messages", express.json(), async (req, res) => {
      const sessionId = req.query.sessionId;
      const transport = transports[sessionId];

      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("Nenhum transporte encontrado para a sessão fornecida.");
      }
    });

    app.listen(port, () => {
      console.error(`Servidor MCP HTTP (SSE) iniciado na porta ${port}`);
      console.error(`Endpoint SSE: http://localhost:${port}/sse`);
      console.error(`Endpoint de Mensagens: http://localhost:${port}/messages`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Servidor MCP da Lista de Compras iniciado via stdio");
  }
}

main().catch((error) => {
  console.error("Erro fatal iniciando o servidor MCP:", error);
  process.exit(1);
});
