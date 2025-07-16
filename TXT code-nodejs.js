const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'interviewDB';
const client = new MongoClient(url);
const filePath = process.env.FILE_PATH || 'path_to_your_file.txt';

function isDataRow(line) {
    // این فانکشن برای جلوگیری از چاپ دیتاهای اضافی است (مثلا شامل چند ستون باشد)
    return line.trim() !== '' && /^\d/.test(line) && line.includes('  ');
}

async function readAndProcessFile() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(dbName);
        const collection = db.collection('deviceData');

        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        let headers = [];
        let dataStart = false;

        for (const line of lines) {
            if (line.startsWith('---')) {
                dataStart = false; 
                continue;
            }

            if (!dataStart && line.includes('Device No.')) {
                headers = line.trim().split(/\s{2,}/); 
                dataStart = true;
                continue;
            }

            if (dataStart && isDataRow(line)) {
                const values = line.trim().split(/\s{2,}/); 
                let document = {};
                headers.forEach((header, index) => {
                    document[header] = values[index]; 
                });
                await collection.insertOne(document); 
                console.log('Data inserted:', document);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
        console.log('Connection to MongoDB closed');
    }
}

readAndProcessFile();
