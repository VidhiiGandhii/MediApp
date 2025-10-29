// backend/importInventory.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const uri = "mongodb+srv://vidhigandhii:vidhi0042@cluster0.kxtzs.mongodb.net/mediapp?retryWrites=true&w=majority&appName=Cluster0";

const inventorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    expiry: { type: Date },
    category: { type: String },
    lowStockThreshold: { type: Number, default: 20 },
    reorderLevel: { type: Number, default: 50 },
    location: { type: String },
    batchNumber: { type: String },
    supplier: { type: String },
    costPerUnit: { type: Number },
    notes: { type: String }
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

async function importInventory() {
    try {
        const inventoryData = [];
        const csvFilePath = path.resolve(__dirname, 'inventory.csv'); // Make sure inventory.csv is in the same folder

        console.log(`Reading data from ${csvFilePath}...`);

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    // This block transforms each row from the CSV
                    const transformedRow = {
                        ...row,
                        // Convert quantity from a string to a number
                        quantity: Number(row.quantity) || 0,
                        // **KEY CHANGE**: Use the expiry date from the CSV file
                        expiry: row.expiry ? new Date(row.expiry) : null,
                        
                        // Dynamically generate other fields not in your CSV
                        lowStockThreshold: Math.floor((Number(row.quantity) || 0) * 0.2),
                        reorderLevel: Math.floor((Number(row.quantity) || 0) * 0.5),
                        costPerUnit: Math.floor(Math.random() * 50) + 5
                    };
                    inventoryData.push(transformedRow);
                })
                .on('end', () => {
                    console.log(`✅ Finished reading CSV file. Found ${inventoryData.length} items.`);
                    resolve();
                })
                .on('error', (error) => reject(error));
        });

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        console.log('Clearing existing inventory...');
        await Inventory.deleteMany({});

        console.log('Importing inventory items...');
        const result = await Inventory.insertMany(inventoryData);
        console.log(`✅ Successfully imported ${result.length} inventory items`);

        // Display stats (same as your original script)
        const totalItems = await Inventory.countDocuments();
        console.log('━'.repeat(50));
        console.log(`Total unique medicines in inventory: ${totalItems}`);
        console.log('━'.repeat(50));

    } catch (error) {
        console.error('❌ Error importing inventory:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

importInventory();