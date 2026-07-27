# MultiConverte — Cloudflare Document Converter (Worker + Container LibreOffice)

Este projeto isolado implementa um serviço de alta fidelidade para conversão de documentos Word (.doc/.docx) e planilhas Excel (.xls/.xlsx) em arquivos PDF utilizando LibreOffice headless executado em um Container Linux orquestrado via Cloudflare Worker.

## Estrutura do Projeto

```
cloudflare-document-converter/
├── Dockerfile                  # Container Debian/Ubuntu com LibreOffice, Calc, Writer e Fontes
├── .dockerignore
├── package.json
├── tsconfig.json
├── wrangler.jsonc              # Configuração Wrangler para Cloudflare Worker / Container
├── src/
│   ├── worker.ts               # Worker da Cloudflare (Validação CORS, Roteamento, Proxy)
│   ├── container.ts            # Servidor HTTP Express interno para o Container
│   ├── types.ts                # Definições de Tipos TypeScript
│   ├── routes/
│   │   ├── health.ts           # Endpoint GET /health
│   │   ├── wordToPdf.ts        # Endpoint POST /convert/word-to-pdf
│   │   └── excelToPdf.ts       # Endpoint POST /convert/excel-to-pdf
│   └── services/
│       ├── libreOfficeService.ts     # Execução do soffice em subprocesso isolado
│       ├── fileValidationService.ts  # Validação de tamanho, extensão, MIME e magic bytes
│       ├── temporaryFilesService.ts  # Criação/limpeza de diretórios em /tmp
│       └── conversionQueueService.ts # Controle de concorrência simultânea
└── README.md
```

## Endpoints

1. `GET /health`
   - Retorna o status de integridade do Worker, Container e disponibilidade do LibreOffice Writer e Calc.

2. `POST /convert/word-to-pdf`
   - Entrada: `multipart/form-data` contendo o campo `file` (.doc ou .docx).
   - Retorno: Stream binário `application/pdf`.

3. `POST /convert/excel-to-pdf`
   - Entrada: `multipart/form-data` contendo o campo `file` (.xls ou .xlsx).
   - Retorno: Stream binário `application/pdf`.

## Regras de Segurança e Privacidade

- **Nenhum Armazenamento Persistente**: Os arquivos recebidos são gravados apenas temporariamente no diretório `/tmp` do container para a conversão do LibreOffice e imediatamente excluídos no bloco `finally`.
- **Limpeza de Abandonados**: Varredura automática no container apaga diretórios e perfis com mais de 15 minutos.
- **Validação Rigorosa**: Limite padrão de 20 MB, verificação de magic bytes ZIP/OpenXML e OLE.
- **Controle de Concorrência**: Máximo de 2 conversões simultâneas por padrão para evitar saturação de CPU/Memória.
