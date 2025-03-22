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

/**
 * Retrieves source code from MongoDB GridFS
 * @param {string} fileId - The ID of the stored file in GridFS
 * @returns {Promise<string>} - The source code content
 */
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


/**
 * Compiles and runs a C++ file stored in MongoDB
 * @param {string} fileId - The GridFS file ID
 * @param {object} res - Express response object
 * @param {Array} testCases - Optional test cases for execution
 */
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
                return safeResponse(res, { success: false, error: `❌ Compilation failed: ${errorOutput}` });
            }

            console.log(`✅ Compilation successful: ${outFilePath}`);

            // Run the program and capture output
            let executionResult = await runExecutable(outFilePath);

            // Compare Expected & Actual Output
            if (testCases.length > 0) {
                const testResults = runTestCases(executionResult, testCases);
                await cleanupFiles(tempFilePath, outFilePath);
                return safeResponse(res, { success: true, results: testResults });
            } else {
                await cleanupFiles(tempFilePath, outFilePath);
                return safeResponse(res, { success: true, output: executionResult });
            }
        });
    } catch (err) {
        console.error("❌ Execution Error:", err);
        return safeResponse(res, { success: false, error: "❌ Execution error occurred." });
    }
};

/**
 * Runs the compiled executable and captures output
 * @param {string} executablePath - Path to the compiled executable
 * @returns {Promise<string>} - Captured output
 */
const runExecutable = async (executablePath) => {
    return new Promise((resolve) => {
        let outputData = "";
        let errorOutput = "";

        console.log(`🚀 Running Executable: ${executablePath}`);
        const run = spawn(executablePath);

        run.stdout.on("data", (data) => {
            outputData += data.toString();
        });

        run.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        run.on("close", () => {
            if (errorOutput) {
                console.error(`❌ Runtime Error: ${errorOutput}`);
                resolve(`Runtime Error: ${errorOutput}`);
            } else {
                console.log(`✅ Execution Output: ${outputData.trim()}`);
                resolve(outputData.trim());
            }
        });
    });
};

/**
 * Runs test cases on the actual output
 * @param {string} actualOutput - The actual output from execution
 * @param {Array} testCases - Array of { expectedOutput }
 * @returns {Object} - Test results
 */
const runTestCases = (actualOutput, testCases) => {
    let results = testCases.map((testCase, index) => {
        const { expectedOutput } = testCase;
        const success = actualOutput.trim() === expectedOutput.trim();

        console.log(`🔎 Test Case ${index + 1}: Expected: "${expectedOutput}", Got: "${actualOutput}"`);
        console.log(`✅ Test Case ${index + 1} ${success ? "PASSED" : "FAILED"}`);

        return {
            testCase: index + 1,
            expectedOutput,
            actualOutput,
            success,
        };
    });

    return { testResults: results };
};

/**
 * Cleans up temporary files
 * @param  {...string} filePaths - Paths of files to delete
 */
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

/**
 * Sends a response safely without causing duplicate response errors
 * @param {object} res - Express response object
 * @param {object} message - Message to send
 */
const safeResponse = (res, message) => {
    if (!res.headersSent) {
        res.json(message);
    } else {
        console.warn("⚠️ Response already sent, skipping duplicate response.");
    }
};


module.exports = { executeCpp };
