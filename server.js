import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const VOLC_API_HOST = 'visual.volcengineapi.com';
const VOLC_API_REGION = 'cn-north-1';
const VOLC_API_SERVICE = 'cv';

function getApiKeys() {
  const accessKeyId = process.env.VOLC_ACCESS_KEY_ID;
  const secretAccessKey = process.env.VOLC_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing VOLC API keys');
  return { accessKeyId, secretAccessKey };
}

const HEADER_KEYS_TO_IGNORE = new Set(['authorization', 'content-length', 'content-type', 'user-agent']);

function uriEscape(str) {
  try {
    return encodeURIComponent(str).replace(/[*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  } catch { return ''; }
}

function queryParamsToString(params) {
  return Object.keys(params).sort()
    .map((key) => (params[key] != null ? `${uriEscape(key)}=${uriEscape(params[key])}` : undefined))
    .filter(Boolean).join('&');
}

function getSignHeaders(headers) {
  const h = Object.keys(headers).filter((k) => !HEADER_KEYS_TO_IGNORE.has(k.toLowerCase()));
  const signedKeys = h.map((k) => k.toLowerCase()).sort().join(';');
  const canonical = h.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k.toLowerCase()}:${(headers[k] || '').toString().trim().replace(/\s+/g, ' ')}`).join('\n');
  return [signedKeys, canonical];
}

function hmac(secret, s) { return crypto.createHmac('sha256', secret).update(s, 'utf8').digest(); }
function hash(s) { return crypto.createHash('sha256').update(s, 'utf8').digest('hex'); }

function generateSignature(method, pathName, query, headers, bodySha, accessKeyId, secretAccessKey) {
  const dt = headers['X-Date'] || headers['x-date'];
  const date = dt.substring(0, 8);
  const [signedHeaders, canonicalHeaders] = getSignHeaders(headers);
  const canonicalRequest = [method.toUpperCase(), pathName, queryParamsToString(query) || '', `${canonicalHeaders}\n`, signedHeaders, bodySha || hash('')].join('\n');
  const credentialScope = [date, VOLC_API_REGION, VOLC_API_SERVICE, 'request'].join('/');
  const stringToSign = ['HMAC-SHA256', dt, credentialScope, hash(canonicalRequest)].join('\n');
  const kDate = hmac(secretAccessKey, date);
  const kRegion = hmac(kDate, VOLC_API_REGION);
  const kService = hmac(kRegion, VOLC_API_SERVICE);
  const kSigning = hmac(kService, 'request');
  const signature = hmac(kSigning, stringToSign).toString('hex');
  return `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function getDateTimeNow() { return new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''); }

async function submitTask(imageBase64, prompt) {
  const { accessKeyId, secretAccessKey } = getApiKeys();
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const body = JSON.stringify({ req_key: 'jimeng_t2i_v40', binary_data_base64: [base64Data], prompt, scale: 0.5, force_single: true });
  const bodySha = hash(body);
  const query = { Action: 'CVSync2AsyncSubmitTask', Version: '2022-08-31' };
  const xDate = getDateTimeNow();
  const headers = { host: VOLC_API_HOST, 'X-Date': xDate, 'content-type': 'application/json' };
  const auth = generateSignature('POST', '/', query, headers, bodySha, accessKeyId, secretAccessKey);
  const qs = queryParamsToString(query);
  const res = await fetch(`https://${VOLC_API_HOST}/?${qs}`, {
    method: 'POST', headers: { ...headers, Authorization: auth, 'Content-Length': Buffer.byteLength(body).toString() }, body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Submit failed: ${res.status} ${text}`);
  const data = JSON.parse(text);
  if (data.status && data.status !== 10000) {
    if (data.status === 50411 || (data.message || '').includes('Risk')) throw new Error('IMAGE_RISK: 图片未通过安全检测');
  }
  return data;
}

async function queryTask(taskId) {
  const { accessKeyId, secretAccessKey } = getApiKeys();
  const body = JSON.stringify({ req_key: 'jimeng_t2i_v40', task_id: taskId });
  const bodySha = hash(body);
  const query = { Action: 'CVSync2AsyncGetResult', Version: '2022-08-31' };
  const xDate = getDateTimeNow();
  const headers = { host: VOLC_API_HOST, 'X-Date': xDate, 'content-type': 'application/json' };
  const auth = generateSignature('POST', '/', query, headers, bodySha, accessKeyId, secretAccessKey);
  const qs = queryParamsToString(query);
  const res = await fetch(`https://${VOLC_API_HOST}/?${qs}`, {
    method: 'POST', headers: { ...headers, Authorization: auth, 'Content-Length': Buffer.byteLength(body).toString() }, body,
  });
  const text = await res.text();
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(`Query failed: ${res.status} ${text}`);
  return data;
}

async function waitForCompletion(taskId, maxAttempts = 60, interval = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await queryTask(taskId);
    if (result.data?.status === 'done') {
      if (result.data.image_urls?.length > 0) return result.data.image_urls[0];
      if (result.data.binary_data_base64?.length > 0) return `data:image/jpeg;base64,${result.data.binary_data_base64[0]}`;
      throw new Error('Task done but no image');
    }
    if (result.data?.status === 'failed') throw new Error(`Task failed: ${result.message || 'Unknown'}`);
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('Task timeout');
}

app.post('/api/ai-optimize', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;
    if (!imageBase64 || !prompt) return res.status(400).json({ error: 'Missing parameters' });
    const submitResult = await submitTask(imageBase64, prompt);
    if (!submitResult.data?.task_id) return res.status(500).json({ error: 'Failed to submit', details: submitResult });
    const imageUrl = await waitForCompletion(submitResult.data.task_id);
    res.json({ success: true, imageUrl, taskId: submitResult.data.task_id });
  } catch (err) {
    console.error('AI optimize error:', err);
    res.status(500).json({ error: 'AI optimization failed', message: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AI proxy server running on port ${PORT}`));
