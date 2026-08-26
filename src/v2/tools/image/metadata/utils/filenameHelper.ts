/**
 * Utilitário seguro para higienização e geração de nomes de arquivo para download.
 * - Preserva acentos e caracteres Unicode (ex: 'Mônik Estevão O Rodeio Começou')
 * - Preserva espaços normais
 * - Remove apenas caracteres estritamente proibidos pelo sistema operacional: \ / : * ? " < > |
 * - Remove espaços duplicados e espaços nas pontas
 * - Se o título estiver vazio ou nulo, faz fallback seguro para o nome base da imagem.
 */
export function sanitizeImageFilename(
  title: string | undefined | null,
  originalFilename: string,
  extension: string
): string {
  const normExt = extension.startsWith(".") ? extension : `.${extension}`;

  if (title && title.trim().length > 0) {
    // Remove caracteres ilegais em SOs (Windows/Linux/macOS) e caracteres de controle, mantendo acentuação e espaços
    const cleaned = title
      .trim()
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length > 0) {
      // Se o título já possuir a extensão correta no final, não duplicar
      if (cleaned.toLowerCase().endsWith(normExt.toLowerCase())) {
        return cleaned;
      }
      return `${cleaned}${normExt}`;
    }
  }

  // Fallback: usar nome original removendo sufixos internos de processamento anterior
  const baseName = originalFilename
    .replace(/\.[^.]+$/, "")
    .replace(/_limpo(_metadados)?$/, "")
    .replace(/_metadados$/, "")
    .trim();

  return `${baseName || "imagem"}_metadados${normExt}`;
}
