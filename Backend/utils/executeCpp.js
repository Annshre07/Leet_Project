const { spawn } = require("child_process"); 
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

let bucket;

// Initialize GridFSBucket when MongoDB connects
mongoose.connection.once("open", () => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "codes" });
    console.log("📂 GridFSBucket initialized for execution");
});

const getCodeFromGridFS = async (fileId) => {
    return new Promise((resolve, reject) => {
        let sourceCode = "";
        console.log(`📥 Fetching code from GridFS for ID: ${fileId}`);
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.on("data", (chunk) => {
            sourceCode += chunk.toString();
        });

        downloadStream.on("end", () => {
            console.log(`✅ Code fetched from MongoDB: ${sourceCode.length} characters`);
            resolve(sourceCode);
        });

        downloadStream.on("error", (err) => {
            console.error("❌ Error fetching code from MongoDB:", err);
            reject(err);
        });
    });
};

const executeCpp = async (fileId, res, testCases = []) => {
    if (!bucket) {
        console.warn("⚠️ GridFSBucket not initialized. Initializing now...");
        bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "codes" });
    }

    const tempDir = path.resolve(os.tmpdir(), "code_exec");
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilePath = path.join(tempDir, `${fileId}.cpp`);
    const outputFile = os.platform() === "win32" ? `${fileId}.exe` : `${fileId}`;
    const outFilePath = path.resolve(tempDir, outputFile);

    console.log(`🔍 Executing file with ID: ${fileId}`);
    console.log(`📂 Temp Directory: ${tempDir}`);
    console.log(`📁 Source File Path: ${tempFilePath}`);
    console.log(`📁 Output File Path: ${outFilePath}`);

    try {
        // Retrieve source code from GridFS
        const sourceCode = await getCodeFromGridFS(fileId);
        await fs.writeFile(tempFilePath, sourceCode, "utf-8");
        console.log(`✅ File written: ${tempFilePath}`);

        // Compile the C++ file
        const compile = spawn("g++", [tempFilePath, "-o", outFilePath]);
        let errorOutput = "";

        compile.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        compile.on("close", async (code) => {
            if (code !== 0) {
                console.error(`❌ Compilation failed: ${errorOutput}`);
                await cleanupFiles(tempFilePath);
                return res.json({ success: false, error: `❌ Compilation failed: ${errorOutput}` });
            }

            console.log(`✅ Compilation successful: ${outFilePath}`);

            // Measure start time and memory usage
            const startTime = process.hrtime();
            const startMemory = process.memoryUsage().rss;

            try {
                // Run the program and capture output
                const executionResult = await runExecutable(outFilePath, startTime, startMemory);

                // Send back the response
                const responseData = {
                    success: true,
                    output: executionResult.output,
                    executionTime: executionResult.executionTime + " ms",
                    memoryUsed: executionResult.memoryUsed + " KB"
                };

                if (testCases.length > 0) {
                    const testResults = runTestCases(executionResult.output, testCases);
                    responseData.testResults = testResults;
                }

                await cleanupFiles(tempFilePath, outFilePath);
                return res.json(responseData);

            } catch (err) {
                console.error("❌ Execution Error:", err);
                return res.json({ success: false, error: "❌ Execution error occurred." });
            }
        });
    } catch (err) {
        console.error("❌ Error:", err);
        return res.json({ success: false, error: "❌ Execution error occurred." });
    }
};

const runExecutable = async (executablePath, startTime, startMemory) => {
    return new Promise((resolve) => {
        let outputData = "";
        let errorOutput = "";

        const run = spawn(executablePath);

        run.stdout.on("data", (data) => {
            outputData += data.toString();
        });

        run.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        run.on("close", () => {
            const endTime = process.hrtime(startTime);
            const endMemory = process.memoryUsage().rss;

            const executionTime = (endTime[0] * 1000) + (endTime[1] / 1e6);
            const memoryUsed = endMemory - startMemory;

            if (errorOutput) {
                console.error(`❌ Runtime Error: ${errorOutput}`);
                resolve({ output: `Runtime Error: ${errorOutput}`, executionTime, memoryUsed });
            } else {
                console.log(`✅ Execution Output: ${outputData.trim()}`);
                console.log(`Execution time: ${executionTime.toFixed(2)} ms`);
                console.log(`Memory used: ${(memoryUsed / 1024).toFixed(2)} KB`);

                resolve({ output: outputData.trim(), executionTime, memoryUsed: memoryUsed / 1024 });
            }
        });
    });
};


const cleanupFiles = async (...filePaths) => {
    for (const file of filePaths) {
        try {
            await fs.unlink(file);
            console.log(`🗑️ Deleted temp file: ${file}`);
        } catch (err) {
            console.warn(`⚠️ Failed to delete temp file: ${file}`);
        }
    }
};

const safeResponse = (res, message) => {
    if (!res.headersSent) {
        res.json(message);
    } else {
        console.warn("⚠️ Response already sent, skipping duplicate response.");
    }
};

module.exports = { executeCpp };
