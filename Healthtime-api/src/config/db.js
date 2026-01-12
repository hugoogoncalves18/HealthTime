const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://carlitoslopes078_db_user:kML4t55GicDPj24b@healthtime.qjc6ldv.mongodb.net/";
const client = new MongoClient(uri);

let dbConnection;

module.exports = {
  connectToMongo: async () => {
    try {
      if (!dbConnection) {
        await client.connect();
        dbConnection = client.db("HealthTime");
        console.log("✅ Ligação ao MongoDB estabelecida.");
      }
      return dbConnection;
    } catch (err) {
      console.error("❌ Erro ao ligar ao Mongo:", err);
      process.exit(1);
    }
  },
  getDb: () => dbConnection,
};