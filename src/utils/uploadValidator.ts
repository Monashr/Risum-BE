export function validateUploadedFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {},
) {
  const { maxSizeMB = 5, allowedTypes = ["image/jpeg", "image/png"] } = options;

  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`File too large. Max ${maxSizeMB}MB allowed.`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type.");
  }

  return true;
}
