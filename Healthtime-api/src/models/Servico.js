const mongoose = require('mongoose');

const servicoSchema = new mongoose.Schema({
    cod_servico: { 
        type: Number, 
        required: true, 
        unique: true, 
        index: true 
    },
    nome_servico: { type: String, required: true, trim: true },
    especialidade: { 
        type: String, 
        required: true, 
        index: true, 
        trim: true 
    },
    
    // Dados de Prioridade (Flattened, pois é 1:1 com o serviço)
    cod_prioridade: { type: Number, required: true },
    descricao_prioridade: { type: String, required: true, trim: true },

    // Tipo de Cuidado (Estrutura Aninhada/Complexa - Diferenciador Técnico)
    tipo_cuidado: {
        codigo: { type: Number, required: true },
        descricao: { 
            type: String, 
            required: true,
            enum: ['Consulta', 'Cirurgia'], // Validação forte
            index: true
        }
    }
}, {
    timestamps: false, // Dados mestres raramente mudam data de criação
    collection: 'Servicos'
});

// Índice Composto: Permite queries como "Dá-me todas as Cirurgias de Cardiologia"
servicoSchema.index({ especialidade: 1, "tipo_cuidado.descricao": 1 });

module.exports = mongoose.model('Servico', servicoSchema);