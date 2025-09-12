import { config } from 'dotenv';
config()
export const API_TEXT_GENERATE = process.env.API_GENERATE as string;//'http://localhost:9601/llm/generate'
export const API_IMAGE_GENERATE = process.env.API_IMAGE_GENERATE as string;//'http://localhost:9601/llm/generate'
