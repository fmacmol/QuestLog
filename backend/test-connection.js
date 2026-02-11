require('dotenv').config();
console.log('Probando conexión a MongoDB...');
console.log('Cadena:', process.env.MONGODB_URI ? 'Existe' : 'NO EXISTE');