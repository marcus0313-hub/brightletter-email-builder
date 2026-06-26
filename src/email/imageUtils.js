export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener(
      "error",
      () => reject(new Error("The image could not be read.")),
      { once: true },
    );
    reader.readAsDataURL(file);
  });
}

export async function optimizeImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPG, PNG, GIF, or WebP image.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 10 MB.");
  }
  if (file.type === "image/gif") {
    return readFileAsDataUrl(file);
  }

  const source = await readFileAsDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const nextImage = new window.Image();
    nextImage.addEventListener("load", () => resolve(nextImage), { once: true });
    nextImage.addEventListener(
      "error",
      () => reject(new Error("The image format is not supported.")),
      { once: true },
    );
    nextImage.src = source;
  });

  const maxWidth = 1600;
  const maxHeight = 1200;
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(outputType, outputType === "image/jpeg" ? 0.86 : undefined);
}
