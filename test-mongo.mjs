// Quick diagnostic: test MongoDB connection & check for persisted data
import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://tirthj523_db_user:tirthj523@smartai-db.orc5ptm.mongodb.net/finai?retryWrites=true&w=majority&appName=SMARTAI-DB";

async function diagnose() {
    console.log("=== MongoDB Persistence Diagnostic ===\n");

    // 1. Test Connection
    console.log("[1] Connecting to MongoDB Atlas...");
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log("  ✅ Connected successfully!");
        console.log(`  Database: ${mongoose.connection.db.databaseName}`);
    } catch (err) {
        console.error("  ❌ CONNECTION FAILED:", err.message);
        console.log("\n  Possible causes:");
        console.log("    - IP not whitelisted in Atlas (Network Access)");
        console.log("    - Incorrect username/password");
        console.log("    - Cluster paused or deleted");
        process.exit(1);
    }

    // 2. List collections
    console.log("\n[2] Checking collections...");
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
        console.log("  ⚠️  No collections found in 'finai' database!");
    } else {
        console.log(`  Found ${collections.length} collection(s):`);
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`    - ${col.name}: ${count} document(s)`);
        }
    }

    // 3. Check transactions specifically
    console.log("\n[3] Checking 'transactions' collection...");
    try {
        const txCollection = mongoose.connection.db.collection("transactions");
        const count = await txCollection.countDocuments();
        console.log(`  Total transactions: ${count}`);

        if (count > 0) {
            const sample = await txCollection.find().sort({ date: -1 }).limit(3).toArray();
            console.log("  Latest 3 transactions:");
            for (const tx of sample) {
                console.log(`    - [${tx.type}] ${tx.title}: ₹${tx.amount} (userId: ${tx.userId}, date: ${tx.date})`);
            }
        } else {
            console.log("  ⚠️  No transactions exist in the database!");
        }
    } catch (err) {
        console.log(`  ⚠️  'transactions' collection doesn't exist yet: ${err.message}`);
    }

    // 4. Check users collection
    console.log("\n[4] Checking 'users' collection...");
    try {
        const usersCollection = mongoose.connection.db.collection("users");
        const count = await usersCollection.countDocuments();
        console.log(`  Total users: ${count}`);

        if (count > 0) {
            const users = await usersCollection.find().limit(5).toArray();
            for (const u of users) {
                console.log(`    - ${u.email} (uid: ${u.uid}, role: ${u.role})`);
            }
        }
    } catch (err) {
        console.log(`  ⚠️  'users' collection doesn't exist yet: ${err.message}`);
    }

    // 5. Write & Read test
    console.log("\n[5] Write/Read persistence test...");
    const testCollection = mongoose.connection.db.collection("_diagnostic_test");
    const testDoc = { test: true, timestamp: new Date(), value: Math.random() };
    await testCollection.insertOne(testDoc);
    const readBack = await testCollection.findOne({ test: true });
    if (readBack) {
        console.log("  ✅ Write/Read test PASSED — data persists correctly");
    } else {
        console.log("  ❌ Write/Read test FAILED — data not found after write");
    }
    await testCollection.drop();

    console.log("\n=== Diagnostic Complete ===");
    await mongoose.disconnect();
}

diagnose().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
