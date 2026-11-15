export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1800;
const WEBP_QUALITIES = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.38];

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

export async function optimizeImageForUpload(file: File, maxBytes: number): Promise<File> {
  if (file.size === 0) throw new Error("O arquivo está vazio. Escolha outra imagem.");
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("A imagem original deve ter até 10 MB.");
  }

  const mimeType = await readImageMimeType(file);
  const alreadyFits = file.size <= maxBytes;
  if (!mimeType) {
    if (alreadyFits) return file;
    throw new Error(`A imagem precisa ser um PNG, JPEG ou WebP válido e ficar até ${formatSize(maxBytes)}.`);
  }
  if (alreadyFits && file.size <= 16 * 1024) return file;

  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    if (alreadyFits) throw new Error("Escolha uma imagem PNG, JPEG ou WebP válida.");
    throw new Error(`Não foi possível comprimir a imagem para até ${formatSize(maxBytes)}. Escolha outra imagem.`);
  }

  try {
    const initialScale = Math.min(1, MAX_IMAGE_EDGE / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      if (alreadyFits) return file;
      throw new Error(`Não foi possível comprimir a imagem para até ${formatSize(maxBytes)}.`);
    }

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const scale = initialScale * Math.pow(0.82, Math.floor(attempt / 4));
      canvas.width = Math.max(1, Math.round(decoded.width * scale));
      canvas.height = Math.max(1, Math.round(decoded.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

      const quality = WEBP_QUALITIES[attempt % WEBP_QUALITIES.length] ?? 0.38;
      const webpBlob = await canvasToBlob(canvas, "image/webp", quality);
      const output = webpBlob.type === "image/webp"
        ? webpBlob
        : await canvasToBlob(canvas, mimeType === "image/jpeg" ? "image/jpeg" : "image/png", quality);

      if (output.size <= maxBytes) {
        if (!alreadyFits || output.size < file.size) {
          return new File([output], outputFileName(file.name, output.type), {
            lastModified: file.lastModified,
            type: output.type,
          });
        }
        return file;
      }
    }

    if (alreadyFits) return file;
    throw new Error(`Não foi possível comprimir a imagem para até ${formatSize(maxBytes)}. Escolha uma imagem menor.`);
  } finally {
    decoded.release();
  }
}

async function readImageMimeType(file: File): Promise<"image/png" | "image/jpeg" | "image/webp" | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes.length >= 8 && bytes.subarray(0, 8).join(",") === "137,80,78,71,13,10,26,10") return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = objectUrl;
  try {
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (cause) {
    URL.revokeObjectURL(objectUrl);
    throw cause;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Não foi possível otimizar esta imagem."));
    }, type, quality);
  });
}

function outputFileName(name: string, mimeType: string): string {
  const baseName = name.replace(/\.[^.]+$/, "") || "imagem";
  const extension = mimeType === "image/webp" ? "webp" : mimeType === "image/jpeg" ? "jpg" : "png";
  return `${baseName}.${extension}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.ceil(bytes / (1024 * 1024))} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}
