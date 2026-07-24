'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { saveCurrentMaterial } from '@/lib/session-material';
import { getAuthSession, type AuthSessionUser } from '@/lib/auth-session';
import { MOCK_USER_PROFILE_FAMILY, getMockUserProfile } from '@/lib/mock-data';
import type { FamilyRelation, Material, UserProfile } from '@/lib/types';

interface PreviewFile {
  id: string;
  name: string;
  url: string;
  rawFile?: File;
  rotation: number;
  cropBounds?: CropBounds;
  croppedPreviewUrl?: string;
  isAutoCropping?: boolean;
  cropMessage?: string;
}

interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AnalyzeStep = 'idle' | 'uploading' | 'clarity' | 'privacy' | 'ocr' | 'understanding' | 'deep_analyzing' | 'done' | 'error';

const STEP_LABELS: Partial<Record<AnalyzeStep, string>> = {
  uploading: '正在上传，请不要关闭页面……',
  clarity: '正在检查图片是否清楚……',
  privacy: '正在检查图片中的个人信息……',
  ocr: '正在识别图片中的文字……',
  understanding: '正在整理结果，请稍等……',
};

function detectSensitiveInformation(text: string): string[] {
  const checks: Array<[string, RegExp]> = [
    ['身份证号码', /(?:\d{17}[\dXx]|\d{15})/],
    ['银行卡号', /(?:\d[\s-]?){16,19}/],
    ['手机号码', /(?:\+?86[-\s]?)?1[3-9]\d{9}/],
    ['验证码', /(?:验证码|动态码|校验码)[：:\s]*\d{4,8}/],
    ['详细地址', /(?:省|市|区|县|街道|路|号).{2,24}/],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function loadPreviewImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = url;
  });
}

async function detectAutoCropBounds(preview: PreviewFile): Promise<CropBounds | null> {
  const image = await loadPreviewImage(preview.url);
  const maxSampleSide = 560;
  const scale = Math.min(1, maxSampleSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;

  const cornerSize = Math.max(4, Math.round(Math.min(width, height) * 0.08));
  const backgroundSamples: Array<[number, number, number]> = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inCorner = (x < cornerSize || x >= width - cornerSize)
        && (y < cornerSize || y >= height - cornerSize);
      if (!inCorner) continue;
      const index = (y * width + x) * 4;
      backgroundSamples.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
    }
  }
  if (backgroundSamples.length === 0) return null;

  const background = backgroundSamples.reduce(
    (sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]],
    [0, 0, 0]
  ).map((value) => value / backgroundSamples.length);
  const sampleDistances = backgroundSamples.map(([red, green, blue]) =>
    Math.hypot(red - background[0], green - background[1], blue - background[2])
  ).sort((a, b) => a - b);
  const backgroundVariation = sampleDistances[Math.floor(sampleDistances.length * 0.85)] || 0;
  const colorThreshold = Math.max(32, backgroundVariation + 20);
  const columnScores = new Array<number>(width).fill(0);
  const rowScores = new Array<number>(height).fill(0);
  let foregroundCount = 0;

  for (let y = 1; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const index = (y * width + x) * 4;
      const leftIndex = index - 4;
      const topIndex = index - width * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const colorDistance = Math.hypot(
        red - background[0],
        green - background[1],
        blue - background[2]
      );
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const leftLuminance = pixels[leftIndex] * 0.299
        + pixels[leftIndex + 1] * 0.587
        + pixels[leftIndex + 2] * 0.114;
      const topLuminance = pixels[topIndex] * 0.299
        + pixels[topIndex + 1] * 0.587
        + pixels[topIndex + 2] * 0.114;
      const edgeStrength = Math.abs(luminance - leftLuminance) + Math.abs(luminance - topLuminance);

      if (colorDistance > colorThreshold || edgeStrength > 52) {
        columnScores[x] += 1;
        rowScores[y] += 1;
        foregroundCount += 1;
      }
    }
  }

  if (foregroundCount < width * height * 0.004) return null;

  const findWeightedBoundary = (scores: number[], fromStart: boolean) => {
    const target = foregroundCount * 0.012;
    let sum = 0;
    if (fromStart) {
      for (let index = 0; index < scores.length; index++) {
        sum += scores[index];
        if (sum >= target) return index;
      }
    } else {
      for (let index = scores.length - 1; index >= 0; index--) {
        sum += scores[index];
        if (sum >= target) return index;
      }
    }
    return fromStart ? 0 : scores.length - 1;
  };

  let left = findWeightedBoundary(columnScores, true);
  let right = findWeightedBoundary(columnScores, false);
  let top = findWeightedBoundary(rowScores, true);
  let bottom = findWeightedBoundary(rowScores, false);
  const horizontalPadding = Math.round((right - left + 1) * 0.05);
  const verticalPadding = Math.round((bottom - top + 1) * 0.05);
  left = Math.max(0, left - horizontalPadding);
  right = Math.min(width - 1, right + horizontalPadding);
  top = Math.max(0, top - verticalPadding);
  bottom = Math.min(height - 1, bottom + verticalPadding);
  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;

  if (cropWidth < width * 0.2 || cropHeight < height * 0.2) return null;
  if (cropWidth > width * 0.97 && cropHeight > height * 0.97) return null;

  return {
    x: left / width,
    y: top / height,
    width: cropWidth / width,
    height: cropHeight / height,
  };
}

async function createCroppedPreviewUrl(preview: PreviewFile, cropBounds: CropBounds): Promise<string> {
  const image = await loadPreviewImage(preview.url);
  const sourceX = Math.round(image.naturalWidth * cropBounds.x);
  const sourceY = Math.round(image.naturalHeight * cropBounds.y);
  const sourceWidth = Math.round(image.naturalWidth * cropBounds.width);
  const sourceHeight = Math.round(image.naturalHeight * cropBounds.height);
  const scale = Math.min(1, 1000 / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return preview.url;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return blob ? URL.createObjectURL(blob) : preview.url;
}

async function prepareImageFile(preview: PreviewFile): Promise<File | undefined> {
  if (!preview.rawFile || (preview.rotation === 0 && !preview.cropBounds)) {
    return preview.rawFile;
  }

  const image = await loadPreviewImage(preview.url);
  const cropBounds = preview.cropBounds ?? { x: 0, y: 0, width: 1, height: 1 };
  const cropX = Math.round(image.naturalWidth * cropBounds.x);
  const cropY = Math.round(image.naturalHeight * cropBounds.y);
  const sourceWidth = Math.round(image.naturalWidth * cropBounds.width);
  const sourceHeight = Math.round(image.naturalHeight * cropBounds.height);
  const swapsSides = preview.rotation % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = swapsSides ? sourceHeight : sourceWidth;
  canvas.height = swapsSides ? sourceWidth : sourceHeight;
  const context = canvas.getContext('2d');
  if (!context) return preview.rawFile;

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(preview.rotation * Math.PI / 180);
  context.drawImage(
    image,
    cropX,
    cropY,
    sourceWidth,
    sourceHeight,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, preview.rawFile?.type || 'image/jpeg', 0.92));
  return blob ? new File([blob], preview.rawFile.name, { type: blob.type }) : preview.rawFile;
}

export default function UploadPage() {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [step, setStep] = useState<AnalyzeStep>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkedPersonalInfo, setCheckedPersonalInfo] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [selectedElderId, setSelectedElderId] = useState('');
  const [elderOptions, setElderOptions] = useState<UserProfile[]>([]);
  const [sensitiveFindings, setSensitiveFindings] = useState<string[]>([]);
  const [pendingMaterial, setPendingMaterial] = useState<Material | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getAuthSession();
    setAuthUser(session);
    setIsLoggedIn(Boolean(session));
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (authUser?.user_role !== 'family') return;
    fetch(`/api/family/relations?family_user_id=${encodeURIComponent(MOCK_USER_PROFILE_FAMILY.user_id)}`)
      .then((response) => response.json())
      .then((json) => {
        if (!json.success) return;
        const relations = (json.data.relations as FamilyRelation[])
          .filter((relation) => relation.permissions.upload_for_elder);
        const elders = relations
          .map((relation) => getMockUserProfile(relation.elder_user_id))
          .filter((profile): profile is UserProfile => Boolean(profile));
        setElderOptions(elders);
        const requestedElderId = new URLSearchParams(window.location.search).get('elder_id') || '';
        if (elders.some((elder) => elder.user_id === requestedElderId)) {
          setSelectedElderId(requestedElderId);
        }
      });
  }, [authUser]);

  if (!authChecked) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在检查登录状态……</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div>
        <PageHeader title="上传材料" backHref="/" />
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center" role="alert">
          <p className="text-xl font-semibold text-amber-800 mb-4">请先登录</p>
          <Link
            href="/login"
            className="inline-block bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setCheckedPersonalInfo(false);

    const newFiles: PreviewFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (!file.type.startsWith('image/')) {
        setUploadError('请上传 JPG 或 PNG 格式的照片。');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError('图片太大，请换一张或缩小后重试。');
        continue;
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        name: file.name,
        url: URL.createObjectURL(file),
        rawFile: file,
        rotation: 0,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setCheckedPersonalInfo(false);
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
        if (file.croppedPreviewUrl && file.croppedPreviewUrl !== file.url) {
          URL.revokeObjectURL(file.croppedPreviewUrl);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateFile = (id: string, update: Partial<PreviewFile>) => {
    setFiles((prev) => prev.map((file) => file.id === id ? { ...file, ...update } : file));
  };

  const handleRotateFile = (file: PreviewFile) => {
    setCheckedPersonalInfo(false);
    updateFile(file.id, { rotation: (file.rotation + 90) % 360 });
  };

  const handleAutoCrop = async (file: PreviewFile) => {
    setCheckedPersonalInfo(false);
    updateFile(file.id, { isAutoCropping: true, cropMessage: '正在分析主体边缘……' });
    try {
      const cropBounds = await detectAutoCropBounds(file);
      if (!cropBounds) {
        updateFile(file.id, {
          cropBounds: undefined,
          isAutoCropping: false,
          cropMessage: '未找到可靠的主体边缘，已保留原图。建议换纯色背景后重拍。',
        });
        return;
      }
      const croppedPreviewUrl = await createCroppedPreviewUrl(file, cropBounds);
      if (file.croppedPreviewUrl && file.croppedPreviewUrl !== file.url) {
        URL.revokeObjectURL(file.croppedPreviewUrl);
      }
      updateFile(file.id, {
        cropBounds,
        croppedPreviewUrl,
        isAutoCropping: false,
        cropMessage: '已根据对比度和边缘自动保留主体，并留出安全边距。',
      });
    } catch {
      updateFile(file.id, {
        isAutoCropping: false,
        cropMessage: '自动裁切失败，已保留原图。',
      });
    }
  };

  const handleCancelCrop = (file: PreviewFile) => {
    setCheckedPersonalInfo(false);
    if (file.croppedPreviewUrl && file.croppedPreviewUrl !== file.url) {
      URL.revokeObjectURL(file.croppedPreviewUrl);
    }
    updateFile(file.id, {
      cropBounds: undefined,
      croppedPreviewUrl: undefined,
      cropMessage: undefined,
    });
  };

  const handleCancelUpload = () => {
    setFiles((prev) => {
      prev.forEach((f) => {
        URL.revokeObjectURL(f.url);
        if (f.croppedPreviewUrl && f.croppedPreviewUrl !== f.url) {
          URL.revokeObjectURL(f.croppedPreviewUrl);
        }
      });
      return [];
    });
    setUploadError(null);
    setStep('idle');
    setCheckedPersonalInfo(false);
    setSensitiveFindings([]);
    setPendingMaterial(null);
  };

  const saveMaterialAndContinue = (material: Material) => {
    if (authUser) {
      sessionStorage.setItem('yinling_current_operation_context', JSON.stringify({
        operator_user_id: authUser.user_id,
        subject_user_id: authUser.user_role === 'family' ? selectedElderId : authUser.user_id,
      }));
    }
    saveCurrentMaterial(material);
    window.location.href = '/confirm';
  };

  const handleStartAnalyze = async () => {
    if (files.length === 0 || !checkedPersonalInfo || (authUser?.user_role === 'family' && !selectedElderId)) return;
    setUploadError(null);
    setStep('uploading');

    try {
      // 当前后端只支持单文件上传，取第一张图片进行真实上传
      const file = files[0];
      if (!file.rawFile) {
        setUploadError('文件读取失败，请重新选择。');
        setStep('error');
        return;
      }

      const formData = new FormData();
      const preparedFile = await prepareImageFile(file);
      if (!preparedFile) {
        setUploadError('文件处理失败，请重新选择。');
        setStep('error');
        return;
      }
      formData.append('file', preparedFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.success) {
        setUploadError(
          uploadJson.error_message || '文件上传失败，请稍后重试。'
        );
        setStep('error');
        return;
      }

      const fileUrl = uploadJson.data.file_url as string;

      setStep('ocr');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl }),
      });
      const analyzeJson = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeJson.success) {
        setUploadError(
          analyzeJson.error_message || '分析暂时失败，请稍后再试。'
        );
        setStep('error');
        return;
      }

      setStep('understanding');
      const analyzedMaterial = analyzeJson.data as Material;
      const findings = detectSensitiveInformation(analyzedMaterial.ocr_text || '');
      if (findings.length > 0) {
        setSensitiveFindings(findings);
        setPendingMaterial(analyzedMaterial);
        setStep('done');
        return;
      }
      saveMaterialAndContinue(analyzedMaterial);
    } catch (error) {
      console.error('Upload/Analyze error:', error);
      setUploadError('网络连接失败，请检查网络后重试。');
      setStep('error');
    }
  };

  const isProcessing = step !== 'idle' && step !== 'done' && step !== 'error';

  return (
    <div>
      <PageHeader
        title="拍照或上传材料"
        subtitle="请拍清楚文字，并尽量拍完整。"
        backHref="/"
      />

      {authUser?.user_role === 'family' && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 mb-6">
          <label htmlFor="subject-elder" className="block text-lg font-bold text-foreground mb-2">
            这次材料属于哪位老人？
          </label>
          <p className="text-base text-muted-foreground mb-3">
            代上传前请先选择已绑定且允许代上传的老人。
          </p>
          <select
            id="subject-elder"
            value={selectedElderId}
            onChange={(e) => setSelectedElderId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">请选择老人</option>
            {elderOptions.map((elder) => (
              <option key={elder.user_id} value={elder.user_id}>{elder.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 上传区域 */}
      <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center mb-6">
        <span className="text-5xl block mb-4" aria-hidden="true">📷</span>
        <p className="text-lg font-semibold text-foreground mb-2">
          拍照或上传材料
        </p>
        <p className="text-base text-muted-foreground mb-6">
          请拍清楚文字，并尽量拍完整。
        </p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="camera-upload"
          aria-label="拍照上传"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          aria-label="选择照片上传"
        />

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <label
            htmlFor="camera-upload"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span aria-hidden="true">📷</span>
            拍照
          </label>
          <label
            htmlFor="file-upload"
            className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span aria-hidden="true">📁</span>
            相册或文件
          </label>
        </div>

        <p className="text-base text-muted-foreground mt-4">
          仅支持 JPG、PNG 格式图片，单张不超过 10MB
        </p>
      </div>

      {/* 上传失败/错误提示 */}
      {uploadError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6" role="alert">
          <p className="text-red-700 text-base">
            <span aria-hidden="true">❌</span> {uploadError}
          </p>
        </div>
      )}

      {/* 图片预览 */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            已选择 {files.length} 张图片
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.croppedPreviewUrl || file.url}
                    alt={file.name}
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${file.rotation}deg)` }}
                  />
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-base hover:bg-red-600 transition-colors"
                  aria-label={`删除 ${file.name}`}
                >
                  ✕
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotateFile(file)}
                    className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground"
                  >
                    旋转 90°
                  </button>
                  <button
                    type="button"
                    onClick={() => file.cropBounds ? handleCancelCrop(file) : handleAutoCrop(file)}
                    disabled={file.isAutoCropping}
                    className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground"
                  >
                    {file.isAutoCropping ? '正在自动裁切……' : file.cropBounds ? '取消裁剪' : '自动裁切主体'}
                  </button>
                </div>
                {file.cropMessage && (
                  <p className="mt-1 text-sm text-muted-foreground">{file.cropMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
          <h3 className="text-lg font-bold text-amber-800 mb-2">
            <span aria-hidden="true">🔒</span> 调整图片后请检查隐私信息
          </h3>
          <p className="text-amber-800 text-base leading-relaxed mb-2">
            请遮住身份证号、住址、银行卡号、完整手机号和验证码等无关信息。
          </p>
          <p className="text-amber-700 text-base leading-relaxed mb-4">
            保留药名、产品名称、宣传原文、订单信息和付款对象等分析所需内容。
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedPersonalInfo}
              onChange={(e) => setCheckedPersonalInfo(e.target.checked)}
              className="w-5 h-5 accent-primary mt-0.5"
            />
            <span className="text-base text-amber-900 leading-relaxed">
              我已检查调整后的图片及其中的个人信息
            </span>
          </label>
        </div>
      )}

      {sensitiveFindings.length > 0 && pendingMaterial && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6" role="alert">
          <h3 className="text-xl font-bold text-red-700 mb-3">检测到可能的敏感信息</h3>
          <p className="text-base text-red-700 leading-relaxed mb-3">
            OCR 文字中可能包含：{sensitiveFindings.join('、')}。建议遮挡后重新拍摄；如确认这些内容可用于本次分析，也可以继续。
          </p>
          <div className="max-h-40 overflow-y-auto rounded-xl bg-white p-3 text-base text-foreground whitespace-pre-wrap mb-4">
            {pendingMaterial.ocr_text}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCancelUpload}
              className="flex-1 rounded-xl bg-white border-2 border-red-200 px-5 py-3 text-lg font-semibold text-red-700"
            >
              重新选择图片
            </button>
            <button
              type="button"
              onClick={() => saveMaterialAndContinue(pendingMaterial)}
              className="flex-1 rounded-xl bg-red-600 px-5 py-3 text-lg font-semibold text-white"
            >
              我已确认，继续识别
            </button>
            <Link
              href="/"
              className="flex-1 rounded-xl bg-muted px-5 py-3 text-center text-lg font-semibold text-foreground"
            >
              取消上传
            </Link>
          </div>
        </div>
      )}

      {/* 分析中加载状态 */}
      {isProcessing && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center mb-6">
          <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-lg font-semibold text-foreground">{STEP_LABELS[step] || '处理中...'}</p>
          <p className="text-base text-muted-foreground mt-2">
            {step === 'uploading'
              ? '正在将图片上传到安全存储'
              : '系统正在识别材料类型和内容'}
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      {!isProcessing && sensitiveFindings.length === 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleStartAnalyze}
            disabled={files.length === 0 || !checkedPersonalInfo || (authUser?.user_role === 'family' && !selectedElderId)}
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            开始识别
          </button>
          <button
            onClick={handleCancelUpload}
            disabled={files.length === 0}
            className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            取消上传
          </button>
          <Link
            href="/"
            onClick={(event) => {
              if (!window.confirm('是否返回首页？\n系统将不会保留未上传的图片或未保存的分析结果')) event.preventDefault();
            }}
            className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      )}
    </div>
  );
}
