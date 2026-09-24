import express from "express";
import cors from "cors";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const MODEL_PATH =
    "C:\\Users\\prana\\Desktop\\AI\\models\\Qwen2.5-1.5B-Instruct-Q4_K_M.gguf";

let model;
let context;
let session;

async function loadModel() {
    console.log("Loading Qwen model...");
    console.log(`Model: ${MODEL_PATH}`);

    const llama = await getLlama();

    model = await llama.loadModel({
        modelPath: MODEL_PATH
    });

    console.log("Model loaded.");

    context = await model.createContext({
        contextSize: 4096
    });

    session = new LlamaChatSession({
        contextSequence: context.getSequence()
    });

    console.log("Qwen session ready.");
}

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        modelLoaded: !!session
    });
});

app.post("/ask", async (req, res) => {
    try {
        if (!session) {
            return res.status(503).json({
                error: "Model is not loaded yet."
            });
        }

        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: "No text provided."
            });
        }

        console.log("\nUser:");
        console.log(text);

        const prompt = `
Answer the user's question clearly and concisely. Do not ask follow up questions. If the question is ambiguous, provide a general answer.

User:
${text}
`;

        const response = await session.prompt(prompt);

        console.log("\nQwen:");
        console.log(response);

        res.json({
            response
        });

    } catch (error) {
        console.error("Generation error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});

async function start() {
    try {
        await loadModel();

        app.listen(PORT, () => {
            console.log("");
            console.log("=================================");
            console.log("AskAI server is running");
            console.log(`http://localhost:${PORT}`);
            console.log("=================================");
        });

    } catch (error) {
        console.error("Failed to start AskAI:");
        console.error(error);
    }
}

start();