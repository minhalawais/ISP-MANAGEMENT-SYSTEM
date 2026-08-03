export const MAX_EMPLOYEE_UPLOAD_BYTES = 15 * 1024 * 1024

const ALLOWED_EMPLOYEE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "pdf"])

export const validateEmployeeFiles = (files: Record<string, File>) => {
  const selectedFiles = Object.values(files)
  const totalBytes = selectedFiles.reduce((total, file) => total + file.size, 0)

  if (totalBytes > MAX_EMPLOYEE_UPLOAD_BYTES) {
    return "Employee files must be smaller than 15 MB in total."
  }

  for (const file of selectedFiles) {
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !ALLOWED_EMPLOYEE_EXTENSIONS.has(extension)) {
      return `${file.name} is not supported. Use PNG, JPG, JPEG, GIF, or PDF files.`
    }
  }

  return null
}
