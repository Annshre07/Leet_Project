const express = require('express');
const { generateFile } = require('../utils/generateFile');
const { executeCpp } = require('../utils/executeCpp');

const router = express.Router();

// Code Execution Route
router.post('/run', async (req, res) => {
    console.log(req.body);
    const { language = "cpp", code } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, error: "Code is required" });
    }

    try {
        const filepath = await generateFile(language, code);
        const output = await executeCpp(filepath);
        return res.json({ filepath, output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
