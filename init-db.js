import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './src/common/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sqlFiles = [
  './src/modules/auth/schema/create_users_table.sql',
  './src/modules/booking-tickets/schema/create_tickets_table.sql',
  './src/modules/booking-tickets/schema/create_seats_table.sql',
  './src/modules/auth/schema/seed_users.sql',
  './src/modules/booking-tickets/schema/seed_seats.sql'
];

async function initializeDB() {
  console.log('Connecting to Neon DB and running migrations...');

  try {
    for (const filePath of sqlFiles) {
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        const sql = fs.readFileSync(fullPath, 'utf8');
        
        if (sql.trim()) {
          console.log(`Executing: ${filePath}`);
          await query(sql);
          console.log(`Success: ${filePath}`);
        }
      } else {
        console.warn(`Warning: File not found ${filePath}`);
      }
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    process.exit(); 
  }
}

initializeDB();