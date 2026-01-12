const { getDb } = require("../config/db");

// Q1: Média de utentes em espera para triagem (Por cor e tipologia)
exports.getMediaEsperaObservacao = async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    const db = getDb();
    
    // Validação de datas
    const inicio = dataInicio ? new Date(dataInicio) : new Date("2020-01-01");
    const fim = dataFim ? new Date(dataFim) : new Date();

    const query = [
      {
        $match: {
          data_registo: { $gte: inicio, $lte: fim },
        },
      },
      {
        $group: {
          _id: "$tipologia",
          // Média segura (ignora zeros se quiseres, aqui assume média simples)
          media_amarelo: { $avg: "$triagem.amarelo.tempo_medio" },
          media_laranja: { $avg: "$triagem.laranja.tempo_medio" },
          
          total_utentes: { 
            $sum: { 
              $add: [
                { $ifNull: ["$triagem.vermelho.num_utentes", 0] }, 
                { $ifNull: ["$triagem.laranja.num_utentes", 0] }, 
                { $ifNull: ["$triagem.amarelo.num_utentes", 0] }, 
                { $ifNull: ["$triagem.verde.num_utentes", 0] }, 
                { $ifNull: ["$triagem.azul.num_utentes", 0] }
              ] 
            } 
          }
        },
      },
    ];
    const dados = await db.collection("Urgencias").aggregate(query).toArray();
    res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Q2: Percentagem por categoria de triagem (Versão Compatível String/Number)
exports.getPercentagemTriagem = async (req, res) => {
  const { id_hospital } = req.query;
  try {
    const db = getDb();
    if (!id_hospital) return res.status(400).json({ erro: "ID Hospital obrigatório" });

   
    // A query abaixo usa $or para testar os dois casos ao mesmo tempo.
    
    const query = [
      { 
        $match: { 
          $or: [
            { id_hospital: parseInt(id_hospital) }, // Tenta como Número
            { id_hospital: id_hospital.toString() } // Tenta como String
          ]
        } 
      },
      { $sort: { data_registo: -1 } },
      { $limit: 1 },
      {
        $project: {
            _id: 0,
            vermelho: { $ifNull: ["$triagem.vermelho.num_utentes", 0] },
            laranja: { $ifNull: ["$triagem.laranja.num_utentes", 0] },
            amarelo: { $ifNull: ["$triagem.amarelo.num_utentes", 0] },
            verde: { $ifNull: ["$triagem.verde.num_utentes", 0] },
            azul: { $ifNull: ["$triagem.azul.num_utentes", 0] }
        }
      },
      {
        $addFields: {
            total: { $add: ["$vermelho", "$laranja", "$amarelo", "$verde", "$azul"] }
        }
      },
      {
         $project: {
             total_utentes: "$total",
             percentagens: {
                 vermelho: { $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$vermelho", "$total"] }, 100] }] },
                 amarelo: { $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$amarelo", "$total"] }, 100] }] },
                 verde: { $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$verde", "$total"] }, 100] }] }
             }
         }
      }
    ];
    const dados = await db.collection("Urgencias").aggregate(query).toArray();
    res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Q3: Tempo médio espera pediatria por região
exports.getEsperaPediatriaRegiao = async (req, res) => {
  try {
    const db = getDb();
    const query = [
      {
        $match: {
            tipologia: { $regex: "Pedi", $options: "i" } 
        },
      },
      // Lookup para ir buscar a Região (Indispensável aqui)
      {
          $lookup: {
              from: "Hospitais",
              localField: "id_hospital",
              foreignField: "id_hospital", // Atenção: Confirma se na coleção Hospitais o campo é 'id_hospital' ou '_id'
              as: "hospital_doc"
          }
      },
      { $unwind: "$hospital_doc" },
      {
        $group: {
          _id: "$hospital_doc.regiao_nuts2", 
          tempo_medio_verde: { $avg: "$triagem.verde.tempo_medio" }
        },
      },
      {
        $project: {
          regiao: "$_id",
          tempo_medio: { $round: ["$tempo_medio_verde", 2] },
          _id: 0
        },
      },
    ];
    const dados = await db.collection("Urgencias").aggregate(query).toArray();
    res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Q4: Diferença Oncologia vs Não-Oncologia (Consultas)
exports.getDiferencaOncologia = async (req, res) => {
  const { id_hospital, especialidade } = req.query;
  
  // Converte id para inteiro se vier na query
  const idHosp = id_hospital ? parseInt(id_hospital) : null;

  try {
    const db = getDb();
    
    const matchStage = {};
    if (idHosp) matchStage.id_hospital = idHosp;
    if (especialidade) matchStage.especialidade = especialidade;

    const query = [
      { $match: matchStage },
      {
        $group: {
          _id: "$id_hospital",
          nome_hospital: { $first: "$nome_hospital" }, // Para saberes quem é
          media_oncologia: {
            $avg: {
              $cond: [
                { $eq: ["$tipo_lista", "Oncológica"] }, // String exata da pipeline
                "$tempo_medio_espera.global",
                null,
              ],
            },
          },
          media_nao_oncologia: {
            $avg: {
              $cond: [
                { $ne: ["$tipo_lista", "Oncológica"] },
                "$tempo_medio_espera.global",
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          nome_hospital: 1,
          media_oncologia: { $round: ["$media_oncologia", 1] },
          media_nao_oncologia: { $round: ["$media_nao_oncologia", 1] },
          diferenca_dias: {
            $subtract: [
                { $ifNull: ["$media_oncologia", 0] }, 
                { $ifNull: ["$media_nao_oncologia", 0] }
            ],
          },
        },
      },
    ];
    const dados = await db.collection("Consultas").aggregate(query).toArray();
    res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Q5: Top 5 Especialidades com Maior Lista de Espera
exports.getTop5Especialidades = async (req, res) => {
    try {
        
        const db = getDb(); 
        
        const dados = await db.collection("Consultas").aggregate([
            {
                $group: {
                    _id: "$especialidade",
                    total_utentes: { $sum: "$num_utentes" }
                }
            },
            { $sort: { total_utentes: -1 } },
            { $limit: 5 },
            {
                $project: {
                    especialidade: "$_id",
                    total_utentes: 1,
                    _id: 0
                }
            }
        ]).toArray();

        res.status(200).json({ sucesso: true, dados });
    } catch (erro) {
        console.error("Erro na Q5:", erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
};

// Q6: Tempo Médio de Espera para Cirurgia por Hospital
exports.getTempoCirurgiaPorHospital = async (req, res) => {
    try {
        
        const db = getDb();

        const dados = await db.collection("Cirurgias").aggregate([
            {
                $group: {
                    _id: "$nome_hospital",
                    tempo_medio: { $avg: "$tempo_medio_espera_dias" }
                }
            },
            { $sort: { tempo_medio: -1 } }, 
            {
                $project: {
                    hospital: "$_id",
                    tempo_medio_dias: { $round: ["$tempo_medio", 1] },
                    _id: 0
                }
            }
        ]).toArray();

        res.status(200).json({ sucesso: true, dados });
    } catch (erro) {
        console.error("Erro na Q6:", erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
};

// Q7: Top 10 Hospitais Pediatria (Menor espera)
exports.getTop10Pediatria = async (req, res) => {
  try {
    const db = getDb();
    const query = [
      { $match: { tipologia: { $regex: "Pedi", $options: "i" } } },
      // Agrupar primeiro para tirar médias caso haja múltiplos registos por hospital
      {
        $group: {
            _id: "$id_hospital",
            nome: { $first: "$nome_hospital" },
            media_verde: { $avg: "$triagem.verde.tempo_medio" },
            media_amarelo: { $avg: "$triagem.amarelo.tempo_medio" }
        }
      },
      {
          $addFields: {
              // Média ponderada simples (verde + amarelo / 2)
              media_final: { $avg: ["$media_verde", "$media_amarelo"] }
          }
      },
      { $sort: { media_final: 1 } }, // Menor é melhor
      { $limit: 10 },
      {
          $project: {
              _id: 0,
              hospital: "$nome",
              tempo_medio_espera: { $round: ["$media_final", 1] }
          }
      }
    ];
    const dados = await db.collection("Urgencias").aggregate(query).toArray();
    res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Q8: Evolução Temporal (Versão Corrigida para Date Objects)
exports.getEvolucaoTemporal = async (req, res) => {
  const { dia } = req.query; 
  try {
    const db = getDb();
    
    // Se o user não mandar dia, usa o dia de hoje.
    // Se mandar "2025-02-16", cria a data corretamente.
    const dataInput = dia ? new Date(dia) : new Date();

    // Passo 1: Definir o INÍCIO do dia (00:00:00.000)
    const inicio = new Date(dataInput);
    inicio.setUTCHours(0, 0, 0, 0);

    // Passo 2: Definir o FIM do dia (23:59:59.999 ou inicio do dia seguinte)
    const fim = new Date(inicio);
    fim.setUTCDate(inicio.getUTCDate() + 1);

    console.log(`🔎 A pesquisar entre: ${inicio.toISOString()} e ${fim.toISOString()}`);

    const query = [
      {
         // Procura registos ONDE a data é Maior/Igual ao inicio E Menor que o fim
         $match: { 
             data_registo: { 
                 $gte: inicio, 
                 $lt: fim 
             } 
         }
      },
      {
        $group: {
          _id: { $hour: "$data_registo" }, // Extrai a hora automaticamente do objeto Data
          media_espera: { $avg: "$triagem.amarelo.tempo_medio" },
          total_entradas: { $sum: 1 }
        },
      },
      { $sort: { "_id": 1 } },
      {
          $project: {
              hora: "$_id",
              media_espera: { $round: ["$media_espera", 1] },
              total_entradas: 1,
              _id: 0
          }
      }
    ];
    const dados = await db.collection("Urgencias").aggregate(query).toArray();
    
    // Debug: Se vier vazio, avisa no terminal
    if (dados.length === 0) {
        console.log("⚠️ Nenhum dado encontrado para este intervalo.");
    }

    res.status(200).json({ sucesso: true, dados });
  } catch (erro) {
    console.error("Erro Q8:", erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};