export const FILE_TYPES = {
  text: [
    "pdf", "txt", "md", "rtf", "doc", "docx", "odt", "tex", "pages",
    "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "cs", "go",
    "rb", "php", "rs", "swift", "kt", "kts", "sh", "bash", "ps1",
    "json", "xml", "yml", "yaml", "html", "htm", "css",
    "xls", "xlsx", "ods", "csv", "tsv", "numbers",
    "ppt", "pptx", "odp", "key",
  ],
  image: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "svg", "webp", "heic", "ico"],
  audio: ["mp3", "wav", "aac", "flac", "ogg", "m4a"],
  video: ["mp4", "mkv", "mov", "avi", "webm", "m4v", "mpeg"],
  application: ["zip", "rar", "7z", "tar", "gz", "bz2", "tgz",
    "exe", "msi", "apk", "dmg","ttf", "otf", "woff", "woff2", "eot", "deb", "rpm"]
};


export const EXT_TO_MIME = {
  "pdf": "application/pdf",
  "txt": "text/plain",
  "md": "text/markdown",
  "rtf": "application/rtf",
  "doc": "application/msword",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "odt": "application/vnd.oasis.opendocument.text",
  "tex": "application/x-tex",

  // code / web
  "js": "application/javascript",
  "jsx": "application/javascript",
  "ts": "application/typescript",
  "tsx": "application/typescript",
  "json": "application/json",
  "xml": "application/xml",
  "html": "text/html",
  "htm": "text/html",
  "css": "text/css",
  "py": "text/x-python",
  "java": "text/x-java-source",
  "c": "text/x-c",
  "cpp": "text/x-c++",
  "cs": "text/plain",
  "go": "text/x-go",
  "rb": "text/x-ruby",
  "php": "application/x-httpd-php",
  "rs": "text/plain",
  "sh": "application/x-sh",
  "bash": "application/x-sh",
  "ps1": "text/plain",

  // images
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "bmp": "image/bmp",
  "tiff": "image/tiff",
  "svg": "image/svg+xml",
  "webp": "image/webp",
  "heic": "image/heic",
  "ico": "image/x-icon",

  // audio / video
  "mp3": "audio/mpeg",
  "wav": "audio/wav",
  "ogg": "audio/ogg",
  "mp4": "video/mp4",
  "mkv": "video/x-matroska",
  "mov": "video/quicktime",
  "webm": "video/webm",

  // archives
  "zip": "application/zip",
  "rar": "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  "tar": "application/x-tar",
  "gz": "application/gzip",
  "tgz": "application/gzip",

  // fonts
  "ttf": "font/ttf",
  "otf": "font/otf",
  "woff": "font/woff",
  "woff2": "font/woff2"
};
export function memtype(filename){
  const ext = filename.slice(filename.lastIndexOf(".")+1);
  if (EXT_TO_MIME[ext] != undefined) {
    return EXT_TO_MIME[ext]
  } else {
    for (let key of Object.keys(FILE_TYPES)) {
      if (FILE_TYPES[key].includes(ext)) {
        return `${key}/${ext}`
      }else return "text/plain"
    }
  }
}