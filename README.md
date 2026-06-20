# Servidor MCP - Lista de Compras

Este é um servidor Model Context Protocol (MCP) desenvolvido em Node.js que permite que assistentes de IA (como Claude Desktop) interajam diretamente com a API do backend do aplicativo **Lista de Compras**.

---

## 🛠️ Tecnologias e Bibliotecas Utilizadas
* **Core SDK**: `@modelcontextprotocol/sdk` (Node.js)
* **Framework Web**: `express` (para transporte SSE sobre HTTP/HTTPS)
* **Requisições API**: `axios`

---

## 🔌 Ferramentas Expostas (MCP Tools)
O servidor expõe as seguintes ferramentas para os agentes de IA:
1. `get_shopping_lists`: Lista todas as listas de compras disponíveis no sistema.
2. `create_shopping_list`: Cria uma nova lista de compras vazia no sistema.
3. `add_item_to_list`: Adiciona um novo item (com descrição, quantidade, preço e unidade) a uma lista específica.
4. `edit_item_in_list`: Edita ou atualiza as propriedades de um item existente em uma lista.
5. `delete_item_from_list`: Exclui um item de uma lista.
6. `edit_shopping_list`: Edita o nome ou orçamento limite de uma lista.
7. `delete_shopping_list`: Exclui permanentemente uma lista de compras inteira.
8. `set_item_completion_status`: Marca/desmarca itens como comprados (`isChecked`).

---

## 🚀 Como Executar o Servidor MCP

Você pode executar este servidor em dois modos diferentes:

### Modo 1: Local via Stdio (Padrão para Claude Desktop local)
Para rodar usando entrada e saída padrão (stdio), execute:
```bash
node index.js stdio
```
*(ou apenas `node index.js`, pois o modo stdio é o padrão)*.

### Modo 2: Servidor Web HTTP / SSE (Para publicação em Nuvem ou conexões remotas)
Para rodar como um servidor web Express escutando em uma porta HTTP usando Server-Sent Events (SSE):
```bash
# Define a porta (opcional, padrão é 3000) e executa no modo sse
set PORT=3000
node index.js sse
```
O servidor ficará disponível em:
* **Endpoint SSE**: `http://localhost:3000/sse`
* **Endpoint de Mensagens**: `http://localhost:3000/messages`

Para expor publicamente em **HTTPS** na nuvem ou localmente (ex: para testes remotos via ChatGPT/Claude Web), você pode publicar o servidor em uma hospedagem na nuvem (como Render, Vercel ou Fly.io) ou usar uma ferramenta de tunelamento local como o **ngrok**:
```bash
ngrok http 3000
```
Isso gerará uma URL pública HTTPS segura (ex: `https://xxxx.ngrok-free.app/sse`) que pode ser conectada por clientes MCP remotos.

---

## 💬 Como Integrar com Clientes de IA

### Integração com o Claude Desktop (Local)

1. Abra o arquivo de configurações do Claude Desktop em seu sistema. No Windows, ele geralmente fica localizado no caminho:
   * **Instalação MSIX/Store (Padrão)**: `C:\Users\<Seu-Usuario>\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json`
   * **Instalação Tradicional**: `C:\Users\<Seu-Usuario>\AppData\Roaming\Claude\claude_desktop_config.json`

2. Adicione a configuração do servidor sob a chave `mcpServers`:
   ```json
   {
     "mcpServers": {
       "lista-compras-mcp": {
         "command": "node",
         "args": [
           "C:/Workspace/Projetos/lista-compras-mcp/index.js"
         ]
       }
     }
   }
   ```
   *(Substitua o caminho acima pelo caminho absoluto real da sua pasta de projeto se for diferente).*

3. Feche completamente o Claude Desktop (saindo pelo ícone da bandeja do sistema perto do relógio) e abra-o novamente.

4. Uma vez iniciado, você verá o ícone de plug/conexão e poderá pedir no chat:
   * *"Listar minhas listas de compras"*
   * *"Marque o item arroz na lista x como comprado"*
   * *"Adicione leite à minha lista de mercado"*
