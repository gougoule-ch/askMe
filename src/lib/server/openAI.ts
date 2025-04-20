import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const client = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export default client;
