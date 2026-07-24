import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 延迟初始化 S3Storage
 *
 * coze dev 会自动注入以下环境变量：
 * - COZE_BUCKET_ENDPOINT_URL  对象存储代理端点
 * - COZE_BUCKET_NAME          桶名称
 * - COZE_WORKLOAD_IDENTITY_*  Workload Identity 认证信息
 *
 * S3Storage 构造函数的 endpointUrl/bucketName 参数不传时
 * 会自动从 process.env 读取，因此这里只需要 new S3Storage() 即可。
 * accessKey/secretKey 保持为空字符串（SDK 使用 Workload Identity 认证）。
 */
let storageInstance: S3Storage | null = null;

function getStorage(): S3Storage {
  if (!storageInstance) {
    const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
    const bucketName = process.env.COZE_BUCKET_NAME;

    if (!endpointUrl || !bucketName) {
      throw new Error('对象存储未配置：请确保 COZE_BUCKET_ENDPOINT_URL 和 COZE_BUCKET_NAME 已设置');
    }

    storageInstance = new S3Storage({
      endpointUrl,
      accessKey: '',
      secretKey: '',
      bucketName,
      region: 'cn-beijing',
    });
  }
  return storageInstance;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error_code: 'MISSING_FILE', error_message: '请选择要上传的图片文件' },
        { status: 400 }
      );
    }

    // 校验文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error_code: 'UNSUPPORTED_FILE', error_message: '文件格式不支持，请上传 JPG 或 PNG 格式的照片' },
        { status: 400 }
      );
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error_code: 'FILE_TOO_LARGE', error_message: '图片太大，请压缩后重试（不超过 10MB）' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);

    // 生成合规文件名（仅允许字母、数字、点、下划线、短横、目录分隔符）
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const rawExt = file.name.split('.').pop() || '';
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const safeName = `${timestamp}_${randomSuffix}.${ext}`;

    // 上传到对象存储
    const storage = getStorage();
    console.log('[/api/upload] Uploading, safeName:', safeName, 'contentType:', file.type, 'size:', fileContent.length);
    const fileKey = await storage.uploadFile({
      fileContent,
      fileName: safeName,
      contentType: file.type,
    });

    console.log('[/api/upload] Uploaded, fileKey:', fileKey);

    // 生成签名 URL（1 小时有效，供 Coze WF-1 访问）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600,
    });

    return NextResponse.json({
      success: true,
      data: { file_url: fileUrl },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '文件上传失败，请稍后重试';

    console.error('[/api/upload] Upload failed:', message);

    // 区分配置错误和运行时错误
    if (message.includes('not configured') || message.includes('COZE_BUCKET')) {
      return NextResponse.json(
        { success: false, error_code: 'STORAGE_NOT_CONFIGURED', error_message: '对象存储未配置，请使用 coze dev 启动开发环境' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error_code: 'UPLOAD_FAILED', error_message: '文件上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}
