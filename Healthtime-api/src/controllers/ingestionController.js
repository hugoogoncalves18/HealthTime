const { getDb } = require("../config/db");

// --- FUNÇÕES DE ESCRITA (POST) ---

// 1. Criar Urgência
exports.createUrgencia = async (req, res) => {
  try {
    const db = getDb();
    const dadosXML = req.body.Urgencia; 

    if (!dadosXML) {
        return res.status(400).json({ 
            sucesso: false, 
            erro: "XML inválido ou tag <Urgencia> em falta." 
        });
    }

    const novoRegisto = {
      id_hospital: parseInt(dadosXML.id_hospital),
      nome_hospital: dadosXML.nome_hospital,
      data_registo: new Date(dadosXML.data_registo),
      data_submissao: new Date(),
      tipologia: dadosXML.tipologia,
      estado_urgencia: dadosXML.estado_urgencia,
      
      // Estrutura aninhada compatível com a Pipeline
      triagem: {
          vermelho: { 
              tempo_medio: parseInt(dadosXML.triagem?.vermelho?.tempo_medio || 0),
              num_utentes: parseInt(dadosXML.triagem?.vermelho?.num_utentes || 0)
          },
          laranja: { 
              tempo_medio: parseInt(dadosXML.triagem?.laranja?.tempo_medio || 0),
              num_utentes: parseInt(dadosXML.triagem?.laranja?.num_utentes || 0)
          },
          amarelo: { 
              tempo_medio: parseInt(dadosXML.triagem?.amarelo?.tempo_medio || 0),
              num_utentes: parseInt(dadosXML.triagem?.amarelo?.num_utentes || 0)
          },
          verde: { 
              tempo_medio: parseInt(dadosXML.triagem?.verde?.tempo_medio || 0),
              num_utentes: parseInt(dadosXML.triagem?.verde?.num_utentes || 0)
          },
          azul: { 
              tempo_medio: parseInt(dadosXML.triagem?.azul?.tempo_medio || 0),
              num_utentes: parseInt(dadosXML.triagem?.azul?.num_utentes || 0)
          }
      }
    };

    const resultado = await db.collection("Urgencias").insertOne(novoRegisto);
    
    res.status(201).json({ 
        sucesso: true, 
        mensagem: "Urgência registada com sucesso", 
        id: resultado.insertedId 
    });

  } catch (erro) {
    console.error("Erro Ingestão Urgencia:", erro);
    res.status(500).json({ sucesso: false, erro: "Falha ao gravar urgência: " + erro.message });
  }
};

// 2. Criar Consulta (Com cálculo de Ano/Mês)
exports.createConsulta = async (req, res) => {
  try {
    const db = getDb();
    const dados = req.body.Consulta;

    if (!dados) {
        return res.status(400).json({ sucesso: false, erro: "Tag <Consulta> em falta." });
    }

    // Processamento de Data para manter consistência com ETL
    const dataRef = new Date(dados.data_completa);
    const anoCalc = dataRef.getFullYear();
    // Mês por extenso (Ex: "Janeiro") - Opcional, mas bom para consistência
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const mesCalc = meses[dataRef.getMonth()];

    const novoRegisto = {
        id_hospital: parseInt(dados.id_hospital),
        nome_hospital: dados.nome_hospital,
        // Campos extra para consistência
        ano: anoCalc,
        mes: mesCalc,
        
        especialidade: dados.especialidade,
        tipo_lista: dados.tipo_lista,
        data_completa: dataRef,
        num_utentes: parseInt(dados.num_utentes),
        tempo_medio_espera: {
            global: parseFloat(dados.tempo_medio_espera?.global || 0),
            // Defaults para não partir o schema
            normal: 0,
            prioritario: 0,
            muito_prioritario: 0
        },
        data_submissao: new Date()
    };

    const resultado = await db.collection("Consultas").insertOne(novoRegisto);
    
    res.status(201).json({ 
        sucesso: true, 
        mensagem: "Consulta registada com sucesso", 
        id: resultado.insertedId 
    });

  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Falha ao gravar consulta: " + erro.message });
  }
};

// 3. Criar Cirurgia (Com cálculo de Ano/Mês)
exports.createCirurgia = async (req, res) => {
    try {
      const db = getDb();
      const dados = req.body.Cirurgia;
  
      if (!dados) {
          return res.status(400).json({ sucesso: false, erro: "Tag <Cirurgia> em falta." });
      }

      // Processamento de Data
      const dataRef = new Date(dados.data_completa);
      const anoCalc = dataRef.getFullYear();
      const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const mesCalc = meses[dataRef.getMonth()];
  
      const novoRegisto = {
          id_hospital: parseInt(dados.id_hospital),
          nome_hospital: dados.nome_hospital,
          
          // Campos extra
          ano: anoCalc,
          mes: mesCalc,

          especialidade: dados.especialidade,
          tipo_lista: dados.tipo_lista,
          data_completa: dataRef,
          num_utentes_inscritos: parseInt(dados.num_utentes_inscritos),
          tempo_medio_espera_dias: parseFloat(dados.tempo_medio_espera_dias),
          data_submissao: new Date()
      };
  
      const resultado = await db.collection("Cirurgias").insertOne(novoRegisto);
      
      res.status(201).json({ 
          sucesso: true, 
          mensagem: "Cirurgia registada com sucesso", 
          id: resultado.insertedId 
      });

    } catch (erro) {
      res.status(500).json({ sucesso: false, erro: "Falha ao gravar cirurgia: " + erro.message });
    }
  };


// --- FUNÇÕES DE LEITURA (GET) ---

exports.getUrgencias = async (req, res) => {
  try {
    const db = getDb();
    const dados = await db.collection("Urgencias")
                          .find({})
                          .sort({ data_registo: -1 })
                          .limit(50)
                          .toArray();
    
    res.status(200).json({ sucesso: true, total_resultados: dados.length, dados: dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao ler urgências" });
  }
};

exports.getConsultas = async (req, res) => {
  try {
    const db = getDb();
    const dados = await db.collection("Consultas").find({}).limit(50).toArray();
    res.status(200).json({ sucesso: true, total_resultados: dados.length, dados: dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao ler consultas" });
  }
};

exports.getCirurgias = async (req, res) => {
  try {
    const db = getDb();
    const dados = await db.collection("Cirurgias").find({}).limit(50).toArray();
    res.status(200).json({ sucesso: true, total_resultados: dados.length, dados: dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao ler cirurgias" });
  }
};

exports.getHospitais = async (req, res) => {
  try {
    const db = getDb();
    // Projeção otimizada para listas
    const dados = await db.collection("Hospitais")
                          .find({}, { projection: { nome_hospital: 1, regiao_nuts2: 1, localizacao: 1 } })
                          .limit(50)
                          .toArray();
    
    res.status(200).json({ sucesso: true, total_resultados: dados.length, dados: dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao ler hospitais" });
  }
};

exports.getServicos = async (req, res) => {
  try {
    const db = getDb();
    const dados = await db.collection("Servicos").find({}).limit(50).toArray();
    res.status(200).json({ sucesso: true, total_resultados: dados.length, dados: dados });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao ler serviços" });
  }
};