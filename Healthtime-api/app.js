const express = require("express");
const { connectToMongo } = require("./src/config/db");
const ingestionRoutes = require("./src/routes/ingestionRoutes");
const analiseRoutes = require("./src/routes/analiseRoutes");

const app = express();
const PORT = 3000;

// 1. Middlewares Globais
app.use(express.json()); // Permite ler JSON no body

// 2. Registar Rotas
// Ingestão e Dados Brutos (URLs mistos: /api/... e /HealthTime/...)
app.use("/", ingestionRoutes);

// Análise e Dashboards (Prefixo organizado: /api/analise/...)
app.use("/api/analise", analiseRoutes);

// 3. Rota de Boas-vindas (Root) - Melhorada para JSON
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Online",
    projeto: "HealthTime API",
    mensagem: "✅ Servidor a funcionar corretamente.",
    links_uteis: [
      "GET /HealthTime/Hospitais",
      "GET /api/analise/top10-pediatria"
    ]
  });
});

// 4. Tratamento de Rota Não Encontrada (404)
// Se o código chegar aqui, é porque nenhuma rota acima correspondeu
app.use((req, res) => {
  res.status(404).json({ 
    erro: "Rota não encontrada", 
    sugestao: "Verifica se o URL e o método (GET/POST) estão corretos." 
  });
});

// 5. Iniciar Servidor
async function startServer() {
  try {
    await connectToMongo(); // Espera pela ligação à BD
    
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 SERVIDOR HEALTHTIME ONLINE`);
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`==================================================\n`);
    });
  } catch (err) {
    console.error("❌ Falha crítica ao iniciar:", err);
    process.exit(1); // Fecha a aplicação se não houver base de dados
  }
}

startServer();