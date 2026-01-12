const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    id_hospital: { 
        type: Number, 
        required: [true, "O ID do hospital é obrigatório"], 
        unique: true, 
        index: true 
    },
    nome_hospital: { 
        type: String, 
        required: [true, "O nome do hospital é obrigatório"], 
        trim: true,
        index: true 
    },
    descricao: { type: String, trim: true },
    morada: { type: String, trim: true },
    distrito: { type: String, required: true, index: true },
    
    // --- GEOJSON REAL (CORREÇÃO PRO) ---
    // Isto permite fazer queries do tipo: "Hospitais num raio de 5km"
    localizacao: {
        type: { 
            type: String, 
            enum: ['Point'], 
            default: 'Point' 
        },
        coordinates: { 
            type: [Number], // Formato: [Longitude, Latitude]
            index: '2dsphere' // Índice Geoespacial (Fundamental para performance)
        }
    },

    // Regiões NUTS
    regiao_nuts1: { type: String, trim: true },
    regiao_nuts2: { type: String, required: true, index: true },
    regiao_nuts3: { type: String, trim: true },

    contactos: {
        telefone: { type: String, trim: true },
        email: { 
            type: String, 
            trim: true, 
            lowercase: true,
            // Validação Regex (Muito bem visto da tua parte!)
            match: [/.+\@.+\..+/, "Por favor insira um email válido"] 
        }
    }
}, {
    timestamps: false,
    collection: 'Hospitais'
});

// Índice composto para pesquisas rápidas no Dashboard
hospitalSchema.index({ regiao_nuts2: 1, nome_hospital: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);