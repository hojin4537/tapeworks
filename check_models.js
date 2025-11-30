import { readFileSync } from 'fs';
import { resolve } from 'path';

// Simple .env parser
function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env');
        const content = readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const API_KEY = env.VITE_NANOBANANA_API_KEY || env.VITE_GOOGLE_AI_API_KEY;

if (!API_KEY) {
    console.error('Error: API Key not found in .env');
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        console.log('Available Models:');
        if (data.models) {
            data.models.forEach(model => {
                if (model.name.includes('image') || model.name.includes('gemini')) {
                    console.log(`- ${model.name} (${model.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log('No models found or unexpected format:', data);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

listModels();
