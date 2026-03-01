/**
 * 调用 OpenAI 图像编辑接口，把用户照片转成卡通风格。
 * 注意：此实现由前端直接调用，需要用户自行提供 API Key。
 */

const OPENAI_IMAGE_EDIT_ENDPOINT = 'https://api.openai.com/v1/images/edits';

function toDataUrl(base64, mimeType = 'image/png') {
  return `data:${mimeType};base64,${base64}`;
}

export async function cartoonizeImageWithAI({ file, apiKey, prompt }) {
  if (!file) {
    throw new Error('请先上传图片');
  }
  if (!apiKey) {
    throw new Error('请先填写 OpenAI API Key');
  }

  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append(
    'prompt',
    prompt || '把人物照片转成可爱、清晰、轮廓明确的卡通形象，保持原人物特征和构图，不要添加文字。'
  );
  formData.append('image', file);
  formData.append('size', '1024x1024');

  const response = await fetch(OPENAI_IMAGE_EDIT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'AI 卡通化失败';
    try {
      const errorData = await response.json();
      message = errorData?.error?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const result = await response.json();
  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('AI 接口未返回图片数据');
  }

  return {
    imageUrl: toDataUrl(b64),
    raw: result,
  };
}
