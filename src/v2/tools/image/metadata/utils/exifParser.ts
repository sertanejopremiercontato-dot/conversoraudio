import { ImageMetadataItem, ImageMetadataCategory } from "../types";

export interface ParsedExifData {
  items: ImageMetadataItem[];
  orientation?: number;
  width?: number;
  height?: number;
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  artist?: string;
  copyright?: string;
  description?: string;
  userComment?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    latitudeStr?: string;
    longitudeStr?: string;
    altitudeStr?: string;
  };
}

export class ExifParser {
  /**
   * Converte offset para formato legível hexadecimal "0x0000012A"
   */
  public static toHexOffset(offset: number): string {
    return `0x${offset.toString(16).toUpperCase().padStart(8, "0")}`;
  }

  /**
   * Dicionário abrangente de tags TIFF / EXIF conhecidas
   */
  private static TAG_DICTIONARY: Record<number, { name: string; label: string; cat: ImageMetadataCategory; desc?: string }> = {
    // IFD0 / TIFF Baseline
    0x0100: { name: "ImageWidth", label: "Largura da Imagem (TIFF)", cat: "TECHNICAL" },
    0x0101: { name: "ImageLength", label: "Altura da Imagem (TIFF)", cat: "TECHNICAL" },
    0x0102: { name: "BitsPerSample", label: "Bits por Amostra", cat: "TECHNICAL" },
    0x0103: { name: "Compression", label: "Esquema de Compressão", cat: "TECHNICAL" },
    0x0106: { name: "PhotometricInterpretation", label: "Interpretação Fotométrica", cat: "TECHNICAL" },
    0x010e: { name: "ImageDescription", label: "Descrição da Imagem", cat: "METADATA", desc: "Legenda ou descrição autoral gravada no EXIF" },
    0x010f: { name: "Make", label: "Fabricante da Câmera", cat: "PROVENANCE", desc: "Marca do dispositivo ou fabricante de captura" },
    0x0110: { name: "Model", label: "Modelo da Câmera", cat: "PROVENANCE", desc: "Modelo do smartphone ou equipamento de captura" },
    0x0111: { name: "StripOffsets", label: "Offsets de Tiras", cat: "TECHNICAL" },
    0x0112: { name: "Orientation", label: "Orientação do Sensor", cat: "TECHNICAL", desc: "Posição física do sensor no disparo" },
    0x0115: { name: "SamplesPerPixel", label: "Amostras por Pixel", cat: "TECHNICAL" },
    0x0116: { name: "RowsPerStrip", label: "Linhas por Tira", cat: "TECHNICAL" },
    0x0117: { name: "StripByteCounts", label: "Tamanho de Tiras", cat: "TECHNICAL" },
    0x011a: { name: "XResolution", label: "Resolução Horizontal (DPI)", cat: "TECHNICAL" },
    0x011b: { name: "YResolution", label: "Resolução Vertical (DPI)", cat: "TECHNICAL" },
    0x011c: { name: "PlanarConfiguration", label: "Configuração Planar", cat: "TECHNICAL" },
    0x0128: { name: "ResolutionUnit", label: "Unidade de Resolução", cat: "TECHNICAL" },
    0x0131: { name: "Software", label: "Software / Editor", cat: "SOFTWARE_GENERATOR", desc: "Programa ou firmware que processou o arquivo" },
    0x0132: { name: "DateTime", label: "Data de Modificação", cat: "PRIVACY", desc: "Data e hora registrada na gravação do arquivo" },
    0x013b: { name: "Artist", label: "Autor / Fotógrafo", cat: "METADATA", desc: "Nome do fotógrafo ou autor registrado" },
    0x013e: { name: "WhitePoint", label: "Ponto Branco", cat: "TECHNICAL" },
    0x013f: { name: "PrimaryChromaticities", label: "Cromaticidades Primárias", cat: "TECHNICAL" },
    0x0211: { name: "YCbCrCoefficients", label: "Coeficientes YCbCr", cat: "TECHNICAL" },
    0x0212: { name: "YCbCrSubSampling", label: "Subamostragem YCbCr", cat: "TECHNICAL" },
    0x0213: { name: "YCbCrPositioning", label: "Posicionamento YCbCr", cat: "TECHNICAL" },
    0x0214: { name: "ReferenceBlackWhite", label: "Referência Preto/Branco", cat: "TECHNICAL" },
    0x8298: { name: "Copyright", label: "Direitos Autorais", cat: "METADATA", desc: "Declaração autoral e licença de uso" },
    0x8769: { name: "ExifOffset", label: "Ponteiro ExifIFD SubIFD", cat: "TECHNICAL" },
    0x8825: { name: "GPSInfo", label: "Ponteiro GPS SubIFD", cat: "TECHNICAL" },

    // Windows XP Tags
    0x9c9b: { name: "XPTitle", label: "Título (Windows XP)", cat: "METADATA", desc: "Título autoral gravado em UTF-16LE" },
    0x9c9c: { name: "XPComment", label: "Comentário (Windows XP)", cat: "COMMENTS", desc: "Comentário livre gravado em UTF-16LE" },
    0x9c9d: { name: "XPAuthor", label: "Autor (Windows XP)", cat: "METADATA", desc: "Autor do documento gravado em UTF-16LE" },
    0x9c9e: { name: "XPKeywords", label: "Palavras-chave (Windows XP)", cat: "METADATA", desc: "Tags autorais gravadas em UTF-16LE" },
    0x9c9f: { name: "XPSubject", label: "Assunto (Windows XP)", cat: "METADATA", desc: "Assunto do arquivo em UTF-16LE" },

    // ExifIFD SubIFD Tags
    0x829a: { name: "ExposureTime", label: "Tempo de Exposição", cat: "PROVENANCE" },
    0x829d: { name: "FNumber", label: "Abertura do Diafragma (F-Number)", cat: "PROVENANCE" },
    0x8822: { name: "ExposureProgram", label: "Programa de Exposição", cat: "PROVENANCE" },
    0x8824: { name: "SpectralSensitivity", label: "Sensibilidade Espectral", cat: "PROVENANCE" },
    0x8827: { name: "ISOSpeedRatings", label: "Sensibilidade ISO", cat: "PROVENANCE" },
    0x8830: { name: "SensitivityType", label: "Tipo de Sensibilidade", cat: "PROVENANCE" },
    0x9000: { name: "ExifVersion", label: "Versão do Padrão EXIF", cat: "TECHNICAL" },
    0x9003: { name: "DateTimeOriginal", label: "Data Original do Disparo", cat: "PRIVACY", desc: "Data e hora exata do clique na câmera" },
    0x9004: { name: "DateTimeDigitized", label: "Data de Digitalização", cat: "PRIVACY", desc: "Data e hora de digitalização ou renderização" },
    0x9101: { name: "ComponentsConfiguration", label: "Configuração de Componentes", cat: "TECHNICAL" },
    0x9102: { name: "CompressedBitsPerPixel", label: "Bits Comprimidos por Pixel", cat: "TECHNICAL" },
    0x9201: { name: "ShutterSpeedValue", label: "Velocidade do Obturador", cat: "PROVENANCE" },
    0x9202: { name: "ApertureValue", label: "Valor de Abertura (APEX)", cat: "PROVENANCE" },
    0x9203: { name: "BrightnessValue", label: "Valor de Brilho", cat: "PROVENANCE" },
    0x9204: { name: "ExposureBiasValue", label: "Compensação de Exposição (EV)", cat: "PROVENANCE" },
    0x9205: { name: "MaxApertureValue", label: "Abertura Máxima da Lente", cat: "PROVENANCE" },
    0x9206: { name: "SubjectDistance", label: "Distância do Objeto", cat: "PROVENANCE" },
    0x9207: { name: "MeteringMode", label: "Modo de Fotometria", cat: "PROVENANCE" },
    0x9208: { name: "LightSource", label: "Fonte de Iluminação", cat: "PROVENANCE" },
    0x9209: { name: "Flash", label: "Estado do Flash", cat: "PROVENANCE" },
    0x920a: { name: "FocalLength", label: "Distância Focal", cat: "PROVENANCE" },
    0x927c: { name: "MakerNote", label: "Metadados do Fabricante (MakerNote)", cat: "PRIVACY", desc: "Bloco binário proprietário com rastros avançados do dispositivo" },
    0x9286: { name: "UserComment", label: "Comentário do Usuário", cat: "COMMENTS", desc: "Comentário livre embutido no EXIF" },
    0x9290: { name: "SubSecTime", label: "Frações de Segundo (Data)", cat: "PRIVACY" },
    0x9291: { name: "SubSecTimeOriginal", label: "Frações de Segundo (Disparo)", cat: "PRIVACY" },
    0x9292: { name: "SubSecTimeDigitized", label: "Frações de Segundo (Digitalização)", cat: "PRIVACY" },
    0xa000: { name: "FlashpixVersion", label: "Versão Flashpix", cat: "TECHNICAL" },
    0xa001: { name: "ColorSpace", label: "Espaço de Cores EXIF", cat: "COLOR_STRUCTURE" },
    0xa002: { name: "PixelXDimension", label: "Largura Efetiva (EXIF)", cat: "TECHNICAL" },
    0xa003: { name: "PixelYDimension", label: "Altura Efetiva (EXIF)", cat: "TECHNICAL" },
    0xa004: { name: "RelatedSoundFile", label: "Arquivo de Áudio Vinculado", cat: "PRIVACY" },
    0xa005: { name: "InteroperabilityOffset", label: "Ponteiro Interoperability SubIFD", cat: "TECHNICAL" },
    0xa20e: { name: "FocalPlaneXResolution", label: "Resolução X do Plano Focal", cat: "PROVENANCE" },
    0xa20f: { name: "FocalPlaneYResolution", label: "Resolução Y do Plano Focal", cat: "PROVENANCE" },
    0xa210: { name: "FocalPlaneResolutionUnit", label: "Unidade do Plano Focal", cat: "TECHNICAL" },
    0xa217: { name: "SensingMethod", label: "Método do Sensor", cat: "PROVENANCE" },
    0xa300: { name: "FileSource", label: "Origem do Arquivo", cat: "PROVENANCE" },
    0xa301: { name: "SceneType", label: "Tipo de Cena", cat: "PROVENANCE" },
    0xa302: { name: "CFAPattern", label: "Padrão CFA (Matriz Bayer)", cat: "TECHNICAL" },
    0xa401: { name: "CustomRendered", label: "Renderização Customizada", cat: "PROVENANCE" },
    0xa402: { name: "ExposureMode", label: "Modo de Exposição", cat: "PROVENANCE" },
    0xa403: { name: "WhiteBalance", label: "Balanço de Branco", cat: "PROVENANCE" },
    0xa404: { name: "DigitalZoomRatio", label: "Zoom Digital Utilizado", cat: "PROVENANCE" },
    0xa405: { name: "FocalLengthIn35mmFilm", label: "Distância Focal Equivalente 35mm", cat: "PROVENANCE" },
    0xa406: { name: "SceneCaptureType", label: "Tipo de Captura de Cena", cat: "PROVENANCE" },
    0xa407: { name: "GainControl", label: "Controle de Ganho", cat: "PROVENANCE" },
    0xa408: { name: "Contrast", label: "Contraste", cat: "PROVENANCE" },
    0xa409: { name: "Saturation", label: "Saturação", cat: "PROVENANCE" },
    0xa40a: { name: "Sharpness", label: "Nitidez", cat: "PROVENANCE" },
    0xa40b: { name: "DeviceSettingDescription", label: "Ajustes do Dispositivo", cat: "PROVENANCE" },
    0xa40c: { name: "SubjectDistanceRange", label: "Faixa de Distância do Sujeito", cat: "PROVENANCE" },
    0xa420: { name: "ImageUniqueID", label: "Identificador Único da Imagem (UUID)", cat: "PRIVACY", desc: "Identificador global exclusivo gravado pela câmera" },
    0xa430: { name: "CameraOwnerName", label: "Proprietário da Câmera", cat: "PRIVACY", desc: "Nome pessoal registrado no dispositivo" },
    0xa431: { name: "BodySerialNumber", label: "Número de Série do Corpo da Câmera", cat: "PRIVACY", desc: "Identificador físico exclusivo do hardware" },
    0xa432: { name: "LensSpecification", label: "Especificação da Lente", cat: "PROVENANCE" },
    0xa433: { name: "LensMake", label: "Fabricante da Lente", cat: "PROVENANCE" },
    0xa434: { name: "LensModel", label: "Modelo da Lente", cat: "PROVENANCE" },
    0xa435: { name: "LensSerialNumber", label: "Número de Série da Lente", cat: "PRIVACY", desc: "Identificador físico exclusivo da objetiva" },

    // IFD1 / Thumbnail Tags
    0x0201: { name: "JPEGInterchangeFormat", label: "Offset da Miniatura (Thumbnail)", cat: "PRIVACY", desc: "Offset da imagem embutida na miniatura EXIF" },
    0x0202: { name: "JPEGInterchangeFormatLength", label: "Tamanho da Miniatura (Thumbnail)", cat: "PRIVACY", desc: "Tamanho em bytes da miniatura de pré-visualização" }
  };

  /**
   * Realiza a varredura e extração forense profunda de todos os IFDs do TIFF
   */
  public static parseTiff(bytes: Uint8Array, tiffOffset = 0): ParsedExifData {
    const result: ParsedExifData = { items: [] };
    if (bytes.length < tiffOffset + 8) return result;

    const byteOrder = String.fromCharCode(bytes[tiffOffset], bytes[tiffOffset + 1]);
    const isLittleEndian = byteOrder === "II";
    if (byteOrder !== "II" && byteOrder !== "MM") {
      return result;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = view.getUint16(tiffOffset + 2, isLittleEndian);
    if (magic !== 0x002a) return result;

    const firstIfdOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
    if (firstIfdOffset < 8 || tiffOffset + firstIfdOffset >= bytes.length) return result;

    let exifIfdOffset: number | null = null;
    let gpsIfdOffset: number | null = null;
    let interopIfdOffset: number | null = null;

    // 1. Ler IFD0 e capturar ponteiros para SubIFDs e IFD1
    const ifd1Offset = this.readIfd(
      bytes,
      view,
      tiffOffset,
      tiffOffset + firstIfdOffset,
      isLittleEndian,
      "IFD0",
      result,
      (tag, valOffset) => {
        if (tag === 0x8769) exifIfdOffset = valOffset;
        if (tag === 0x8825) gpsIfdOffset = valOffset;
      }
    );

    // 2. Ler ExifIFD (SubIFD)
    if (exifIfdOffset && tiffOffset + exifIfdOffset < bytes.length) {
      this.readIfd(
        bytes,
        view,
        tiffOffset,
        tiffOffset + exifIfdOffset,
        isLittleEndian,
        "ExifIFD",
        result,
        (tag, valOffset) => {
          if (tag === 0xa005) interopIfdOffset = valOffset;
        }
      );
    }

    // 3. Ler GPS IFD
    if (gpsIfdOffset && tiffOffset + gpsIfdOffset < bytes.length) {
      this.readGpsIfd(bytes, view, tiffOffset, tiffOffset + gpsIfdOffset, isLittleEndian, result);
    }

    // 4. Ler Interoperability IFD
    if (interopIfdOffset && tiffOffset + interopIfdOffset < bytes.length) {
      this.readIfd(
        bytes,
        view,
        tiffOffset,
        tiffOffset + interopIfdOffset,
        isLittleEndian,
        "InteropIFD",
        result
      );
    }

    // 5. Ler IFD1 (Miniatura / Thumbnail) se existir
    if (ifd1Offset && ifd1Offset > 0 && tiffOffset + ifd1Offset < bytes.length) {
      this.readIfd(
        bytes,
        view,
        tiffOffset,
        tiffOffset + ifd1Offset,
        isLittleEndian,
        "IFD1 (Thumbnail)",
        result
      );
    }

    return result;
  }

  private static readIfd(
    bytes: Uint8Array,
    view: DataView,
    tiffOffset: number,
    ifdOffset: number,
    le: boolean,
    sourceName: string,
    result: ParsedExifData,
    onSpecialTag?: (tag: number, val: number) => void
  ): number {
    if (ifdOffset + 2 > bytes.length) return 0;
    const numEntries = view.getUint16(ifdOffset, le);
    let offset = ifdOffset + 2;

    for (let i = 0; i < numEntries; i++) {
      if (offset + 12 > bytes.length) break;

      const tag = view.getUint16(offset, le);
      const type = view.getUint16(offset + 2, le);
      const count = view.getUint32(offset + 4, le);
      const valBytesOffset = offset + 8;

      const tagSize = this.getTypeSize(type) * count;
      let valueOffset = valBytesOffset;
      let isIndirect = false;

      if (tagSize > 4) {
        const ptr = view.getUint32(valBytesOffset, le);
        valueOffset = tiffOffset + ptr;
        isIndirect = true;
      }

      if (onSpecialTag && (tag === 0x8769 || tag === 0x8825 || tag === 0xa005)) {
        const ptrVal = view.getUint32(valBytesOffset, le);
        onSpecialTag(tag, ptrVal);
      }

      if (valueOffset >= 0 && valueOffset + Math.min(tagSize, 4) <= bytes.length) {
        this.processIfdTag(
          tag,
          type,
          count,
          valueOffset,
          tagSize,
          bytes,
          view,
          le,
          sourceName,
          result,
          offset, // offset da entrada do IFD (12 bytes)
          isIndirect
        );
      }

      offset += 12;
    }

    // Offset para o próximo IFD (IFD1)
    if (offset + 4 <= bytes.length) {
      return view.getUint32(offset, le);
    }
    return 0;
  }

  private static readGpsIfd(
    bytes: Uint8Array,
    view: DataView,
    tiffOffset: number,
    ifdOffset: number,
    le: boolean,
    result: ParsedExifData
  ) {
    if (ifdOffset + 2 > bytes.length) return;
    const numEntries = view.getUint16(ifdOffset, le);
    let offset = ifdOffset + 2;

    let latRef = "N";
    let lonRef = "E";
    let latVal: number | null = null;
    let lonVal: number | null = null;
    let altVal: number | null = null;
    let altRef = 0;

    for (let i = 0; i < numEntries; i++) {
      if (offset + 12 > bytes.length) break;

      const tag = view.getUint16(offset, le);
      const type = view.getUint16(offset + 2, le);
      const count = view.getUint32(offset + 4, le);
      const valBytesOffset = offset + 8;

      const tagSize = this.getTypeSize(type) * count;
      let valueOffset = valBytesOffset;
      if (tagSize > 4) {
        valueOffset = tiffOffset + view.getUint32(valBytesOffset, le);
      }

      if (valueOffset >= 0 && valueOffset + Math.min(tagSize, 4) <= bytes.length) {
        if (tag === 0x0001) {
          latRef = String.fromCharCode(bytes[valueOffset]) || "N";
        } else if (tag === 0x0002 && count === 3) {
          const deg = this.readRational(view, valueOffset, le);
          const min = this.readRational(view, valueOffset + 8, le);
          const sec = this.readRational(view, valueOffset + 16, le);
          latVal = deg + min / 60 + sec / 3600;
        } else if (tag === 0x0003) {
          lonRef = String.fromCharCode(bytes[valueOffset]) || "E";
        } else if (tag === 0x0004 && count === 3) {
          const deg = this.readRational(view, valueOffset, le);
          const min = this.readRational(view, valueOffset + 8, le);
          const sec = this.readRational(view, valueOffset + 16, le);
          lonVal = deg + min / 60 + sec / 3600;
        } else if (tag === 0x0005) {
          altRef = bytes[valueOffset];
        } else if (tag === 0x0006) {
          altVal = this.readRational(view, valueOffset, le);
          if (altRef === 1) altVal = -altVal;
        } else if (tag === 0x001d) {
          const dateStr = this.readAscii(bytes, valueOffset, count);
          result.items.push({
            id: `gps_date_${valueOffset}`,
            key: "GPSDateStamp",
            label: "Data do Sensor GPS",
            value: dateStr,
            source: "EXIF / GPS SubIFD",
            category: "PRIVACY",
            offset: valueOffset,
            offsetHex: this.toHexOffset(valueOffset),
            size: count,
            isRemovable: true,
            details: "Data gravada via satélite GPS"
          });
        } else if (tag === 0x0007 && count === 3) {
          const h = this.readRational(view, valueOffset, le);
          const m = this.readRational(view, valueOffset + 8, le);
          const s = this.readRational(view, valueOffset + 16, le);
          const timeStr = `${Math.floor(h)}:${Math.floor(m)}:${Math.floor(s)} UTC`;
          result.items.push({
            id: `gps_time_${valueOffset}`,
            key: "GPSTimeStamp",
            label: "Hora do Sensor GPS",
            value: timeStr,
            source: "EXIF / GPS SubIFD",
            category: "PRIVACY",
            offset: valueOffset,
            offsetHex: this.toHexOffset(valueOffset),
            size: 24,
            isRemovable: true,
            details: "Horário UTC registrado pelo relógio atômico do GPS"
          });
        } else if (tag === 0x001b) {
          const procMethod = this.readAscii(bytes, valueOffset, count);
          result.items.push({
            id: `gps_proc_${valueOffset}`,
            key: "GPSProcessingMethod",
            label: "Método de Processamento GPS",
            value: procMethod || "Posicionamento Híbrido",
            source: "EXIF / GPS SubIFD",
            category: "PRIVACY",
            offset: valueOffset,
            offsetHex: this.toHexOffset(valueOffset),
            size: count,
            isRemovable: true,
            details: "Indica método (CELLID, GPS, WLAN, NETWORK)"
          });
        } else {
          // Processar qualquer outra tag do GPS
          const rawVal = this.formatTagValue(type, count, valueOffset, bytes, view, le);
          result.items.push({
            id: `gps_tag_${tag.toString(16)}_${valueOffset}`,
            key: `GPS_Tag_0x${tag.toString(16).toUpperCase()}`,
            label: `Parâmetro GPS (0x${tag.toString(16).toUpperCase()})`,
            value: rawVal,
            source: "EXIF / GPS SubIFD",
            category: "PRIVACY",
            offset: valueOffset,
            offsetHex: this.toHexOffset(valueOffset),
            size: tagSize,
            isRemovable: true,
            details: `Tag do sensor GPS ID 0x${tag.toString(16).toUpperCase()}`
          });
        }
      }

      offset += 12;
    }

    if (latVal !== null) {
      if (latRef === "S") latVal = -latVal;
      const latStr = `${latVal.toFixed(6)}° (${latRef})`;
      result.items.push({
        id: `gps_latitude_${ifdOffset}`,
        key: "GPSLatitude",
        label: "GPS Latitude",
        value: latStr,
        source: "EXIF / GPS SubIFD",
        category: "PRIVACY",
        offset: ifdOffset,
        offsetHex: this.toHexOffset(ifdOffset),
        size: 24,
        isRemovable: true,
        details: "Coordenada geográfica exata de latitude registrada pelo dispositivo"
      });
      if (!result.gps) result.gps = {};
      result.gps.latitude = latVal;
      result.gps.latitudeStr = latStr;
    }

    if (lonVal !== null) {
      if (lonRef === "W") lonVal = -lonVal;
      const lonStr = `${lonVal.toFixed(6)}° (${lonRef})`;
      result.items.push({
        id: `gps_longitude_${ifdOffset}`,
        key: "GPSLongitude",
        label: "GPS Longitude",
        value: lonStr,
        source: "EXIF / GPS SubIFD",
        category: "PRIVACY",
        offset: ifdOffset,
        offsetHex: this.toHexOffset(ifdOffset),
        size: 24,
        isRemovable: true,
        details: "Coordenada geográfica exata de longitude registrada pelo dispositivo"
      });
      if (!result.gps) result.gps = {};
      result.gps.longitude = lonVal;
      result.gps.longitudeStr = lonStr;
    }

    if (altVal !== null) {
      const altStr = `${altVal.toFixed(1)} m`;
      result.items.push({
        id: `gps_altitude_${ifdOffset}`,
        key: "GPSAltitude",
        label: "GPS Altitude",
        value: altStr,
        source: "EXIF / GPS SubIFD",
        category: "PRIVACY",
        offset: ifdOffset,
        offsetHex: this.toHexOffset(ifdOffset),
        size: 8,
        isRemovable: true,
        details: "Altitude em relação ao nível do mar registrada pelo sensor"
      });
      if (!result.gps) result.gps = {};
      result.gps.altitude = altVal;
      result.gps.altitudeStr = altStr;
    }
  }

  private static processIfdTag(
    tag: number,
    type: number,
    count: number,
    valOffset: number,
    tagSize: number,
    bytes: Uint8Array,
    view: DataView,
    le: boolean,
    source: string,
    result: ParsedExifData,
    entryOffset: number,
    isIndirect: boolean
  ) {
    const known = this.TAG_DICTIONARY[tag];
    const rawVal = this.formatTagValue(type, count, valOffset, bytes, view, le);

    // Tags especiais com formatações específicas
    if (tag === 0x0112) {
      // Orientation
      const orient = view.getUint16(valOffset, le);
      result.orientation = orient;
      const orientNames: Record<number, string> = {
        1: "Normal (0°)",
        2: "Espelhada horizontal",
        3: "Rotacionada 180°",
        4: "Espelhada vertical",
        5: "Espelhada horizontal e rotacionada 270°",
        6: "Rotacionada 90° horário",
        7: "Espelhada horizontal e rotacionada 90°",
        8: "Rotacionada 270° horário"
      };
      result.items.push({
        id: `exif_${tag.toString(16)}_${valOffset}`,
        key: "Orientation",
        label: "Orientação do Sensor",
        value: orientNames[orient] || `Valor ${orient}`,
        source: `EXIF / ${source}`,
        category: "TECHNICAL",
        offset: isIndirect ? valOffset : entryOffset,
        offsetHex: this.toHexOffset(isIndirect ? valOffset : entryOffset),
        size: tagSize,
        isRemovable: true,
        details: "Flag de orientação do sensor de captura"
      });
      return;
    }

    if (tag === 0x927c) {
      // MakerNote
      result.items.push({
        id: `exif_makernote_${valOffset}`,
        key: "MakerNote",
        label: "Metadados do Fabricante (MakerNote)",
        value: `Bloco proprietário do fabricante (${count} bytes)`,
        source: `EXIF / ${source}`,
        category: "PRIVACY",
        offset: isIndirect ? valOffset : entryOffset,
        offsetHex: this.toHexOffset(isIndirect ? valOffset : entryOffset),
        size: count,
        isRemovable: true,
        details: "Dados diagnósticos internos e números de calibração do sensor da câmera"
      });
      return;
    }

    if (tag === 0x9286) {
      // UserComment
      const comment = this.readUserComment(bytes, valOffset, count);
      if (comment) {
        result.userComment = comment;
        result.items.push({
          id: `exif_comment_${valOffset}`,
          key: "UserComment",
          label: "Comentário do Usuário",
          value: comment,
          source: `EXIF / ${source}`,
          category: "COMMENTS",
          offset: isIndirect ? valOffset : entryOffset,
          offsetHex: this.toHexOffset(isIndirect ? valOffset : entryOffset),
          size: count,
          isRemovable: true,
          details: "Comentário livre gravado no padrão EXIF"
        });
      }
      return;
    }

    // Windows XP Tags (UTF-16LE)
    if (tag >= 0x9c9b && tag <= 0x9c9f) {
      const xpVal = this.readUtf16le(bytes, valOffset, count);
      if (xpVal && known) {
        result.items.push({
          id: `exif_${known.name}_${valOffset}`,
          key: known.name,
          label: known.label,
          value: xpVal,
          source: `EXIF / ${source}`,
          category: known.cat,
          offset: isIndirect ? valOffset : entryOffset,
          offsetHex: this.toHexOffset(isIndirect ? valOffset : entryOffset),
          size: count,
          isRemovable: true,
          details: known.desc
        });
      }
      return;
    }

    if (known) {
      // Atualizar campos conhecidos no result
      if (tag === 0x010f) result.make = rawVal;
      if (tag === 0x0110) result.model = rawVal;
      if (tag === 0x0131) result.software = rawVal;
      if (tag === 0x0132) result.dateTime = rawVal;
      if (tag === 0x013b) result.artist = rawVal;
      if (tag === 0x8298) result.copyright = rawVal;
      if (tag === 0x010e) result.description = rawVal;
      if (tag === 0x9003) result.dateTimeOriginal = rawVal;

      result.items.push({
        id: `exif_${known.name}_${valOffset}`,
        key: known.name,
        label: known.label,
        value: rawVal,
        source: `EXIF / ${source}`,
        category: known.cat,
        offset: isIndirect ? valOffset : entryOffset,
        offsetHex: this.toHexOffset(isIndirect ? valOffset : entryOffset),
        size: tagSize,
        isRemovable: known.cat !== "TECHNICAL",
        details: known.desc
      });
    } else {
      // Tag desconhecida / custom / não catalogada: FORENSICAMENTE RASTREADA E NUNCA IGNORADA!
      result.items.push({
        id: `exif_unknown_${tag.toString(16)}_${valOffset}`,
        key: `Tag_0x${tag.toString(16).toUpperCase()}`,
        label: `Tag EXIF Não Catalogada (0x${tag.toString(16).toUpperCase()})`,
        value: rawVal,
        source: `EXIF / ${source}`,
        category: "UNKNOWN_OPTIONAL",
        offset: isIndirect ? valOffset : entryOffset,
        offsetHex: this.toHexOffset(isIndirect ? valOffset : entryOffset),
        size: tagSize,
        isRemovable: true,
        details: `Tipo TIFF: ${type} • Elementos: ${count}`
      });
    }
  }

  // --- Formatador Genérico de Tipos TIFF ---

  private static formatTagValue(
    type: number,
    count: number,
    offset: number,
    bytes: Uint8Array,
    view: DataView,
    le: boolean
  ): string {
    switch (type) {
      case 2: // ASCII String
        return this.readAsciiOrUtf8(bytes, offset, count);
      case 3: { // SHORT (uint16)
        if (count === 1) return String(view.getUint16(offset, le));
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 8); i++) {
          arr.push(view.getUint16(offset + i * 2, le));
        }
        return arr.join(", ") + (count > 8 ? `... (+${count - 8})` : "");
      }
      case 4: { // LONG (uint32)
        if (count === 1) return String(view.getUint32(offset, le));
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 8); i++) {
          arr.push(view.getUint32(offset + i * 4, le));
        }
        return arr.join(", ") + (count > 8 ? `... (+${count - 8})` : "");
      }
      case 5: { // RATIONAL
        if (count === 1) {
          const num = view.getUint32(offset, le);
          const den = view.getUint32(offset + 4, le);
          if (den === 1) return String(num);
          if (den === 0) return `${num}/0`;
          const val = num / den;
          return val % 1 === 0 ? String(val) : `${num}/${den} (${val.toFixed(2)})`;
        }
        const arr: string[] = [];
        for (let i = 0; i < Math.min(count, 4); i++) {
          const num = view.getUint32(offset + i * 8, le);
          const den = view.getUint32(offset + i * 8 + 4, le);
          arr.push(den === 1 ? String(num) : `${num}/${den}`);
        }
        return arr.join(", ");
      }
      case 9: { // SLONG (int32)
        return String(view.getInt32(offset, le));
      }
      case 10: { // SRATIONAL (signed rational)
        const num = view.getInt32(offset, le);
        const den = view.getInt32(offset + 4, le);
        return den === 0 ? `${num}/0` : `${num}/${den} (${(num / den).toFixed(2)})`;
      }
      case 7: // UNDEFINED (raw bytes)
      case 1: { // BYTE
        if (count <= 16) {
          const hexArr = Array.from(bytes.subarray(offset, offset + count)).map(b => b.toString(16).padStart(2, "0"));
          return `Hex: ${hexArr.join(" ")}`;
        }
        return `Bloco binário (${count} bytes)`;
      }
      default:
        return `Dado bruto (${count} elementos, tipo ${type})`;
    }
  }

  private static getTypeSize(type: number): number {
    switch (type) {
      case 1: return 1; // BYTE
      case 2: return 1; // ASCII
      case 3: return 2; // SHORT
      case 4: return 4; // LONG
      case 5: return 8; // RATIONAL
      case 7: return 1; // UNDEFINED
      case 9: return 4; // SLONG
      case 10: return 8; // SRATIONAL
      default: return 1;
    }
  }

  private static readRational(view: DataView, offset: number, le: boolean): number {
    if (offset + 8 > view.byteLength) return 0;
    const num = view.getUint32(offset, le);
    const den = view.getUint32(offset + 4, le);
    return den === 0 ? 0 : num / den;
  }

  private static readAscii(bytes: Uint8Array, offset: number, length: number): string {
    let s = "";
    for (let i = 0; i < length; i++) {
      if (offset + i >= bytes.length) break;
      const b = bytes[offset + i];
      if (b === 0) break;
      s += String.fromCharCode(b);
    }
    return s.trim();
  }

  private static readAsciiOrUtf8(bytes: Uint8Array, offset: number, length: number): string {
    if (offset + length > bytes.length) length = bytes.length - offset;
    const slice = bytes.subarray(offset, offset + length);
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(slice).replace(/\0+$/, "").trim();
    } catch {
      return this.readAscii(bytes, offset, length);
    }
  }

  private static readUtf16le(bytes: Uint8Array, offset: number, length: number): string {
    if (offset + length > bytes.length) length = bytes.length - offset;
    const slice = bytes.subarray(offset, offset + length);
    try {
      return new TextDecoder("utf-16le", { fatal: false }).decode(slice).replace(/\0+$/, "").trim();
    } catch {
      return "";
    }
  }

  private static readUserComment(bytes: Uint8Array, offset: number, count: number): string {
    if (count <= 8 || offset + count > bytes.length) return "";
    const prefix = String.fromCharCode(...bytes.subarray(offset, offset + 8));
    const payload = bytes.subarray(offset + 8, offset + count);

    if (prefix.startsWith("UNICODE")) {
      try {
        return new TextDecoder("utf-16be", { fatal: false }).decode(payload).replace(/\0+$/, "").trim();
      } catch {
        return "";
      }
    }
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(payload).replace(/\0+$/, "").trim();
    } catch {
      return "";
    }
  }

  // --- EXIF Builder (Construtor Físico de EXIF para JPEG/WebP) ---

  public static buildExifPayload(fields: {
    title?: string;
    artist?: string;
    description?: string;
    copyright?: string;
    keywords?: string;
    comment?: string;
    software?: string;
    dateTime?: string;
  }): Uint8Array {
    interface IfdEntry {
      tag: number;
      type: number;
      count: number;
      data: Uint8Array;
    }

    const entries: IfdEntry[] = [];
    const encUtf8 = (str: string) => {
      const encoded = new TextEncoder().encode(str);
      const res = new Uint8Array(encoded.length + 1);
      res.set(encoded, 0);
      res[encoded.length] = 0x00; // NUL terminator
      return res;
    };

    const encUtf16le = (str: string) => {
      const res = new Uint8Array((str.length + 1) * 2);
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        res[i * 2] = code & 0xff;
        res[i * 2 + 1] = (code >> 8) & 0xff;
      }
      res[str.length * 2] = 0;
      res[str.length * 2 + 1] = 0;
      return res;
    };

    if (fields.description || fields.title) {
      const text = fields.description || fields.title || "";
      const buf = encUtf8(text);
      entries.push({ tag: 0x010e, type: 2, count: buf.length, data: buf });
    }

    const swText = fields.software || "Image Metadata Forensics Studio";
    const swBuf = encUtf8(swText);
    entries.push({ tag: 0x0131, type: 2, count: swBuf.length, data: swBuf });

    const now = new Date();
    const dtText = fields.dateTime || `${now.getFullYear()}:${String(now.getMonth() + 1).padStart(2, "0")}:${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const dtBuf = encUtf8(dtText);
    entries.push({ tag: 0x0132, type: 2, count: dtBuf.length, data: dtBuf });

    if (fields.artist) {
      const artBuf = encUtf8(fields.artist);
      entries.push({ tag: 0x013b, type: 2, count: artBuf.length, data: artBuf });
    }

    if (fields.copyright) {
      const cprBuf = encUtf8(fields.copyright);
      entries.push({ tag: 0x8298, type: 2, count: cprBuf.length, data: cprBuf });
    }

    if (fields.title) {
      const xpTitleBuf = encUtf16le(fields.title);
      entries.push({ tag: 0x9c9b, type: 1, count: xpTitleBuf.length, data: xpTitleBuf });
    }

    if (fields.artist) {
      const xpArtBuf = encUtf16le(fields.artist);
      entries.push({ tag: 0x9c9d, type: 1, count: xpArtBuf.length, data: xpArtBuf });
    }

    if (fields.comment || fields.description) {
      const xpCommBuf = encUtf16le(fields.comment || fields.description || "");
      entries.push({ tag: 0x9c9c, type: 1, count: xpCommBuf.length, data: xpCommBuf });
    }

    if (fields.keywords) {
      const xpKeyBuf = encUtf16le(fields.keywords);
      entries.push({ tag: 0x9c9e, type: 1, count: xpKeyBuf.length, data: xpKeyBuf });
    }

    if (fields.title) {
      const xpSubBuf = encUtf16le(fields.title);
      entries.push({ tag: 0x9c9f, type: 1, count: xpSubBuf.length, data: xpSubBuf });
    }

    entries.sort((a, b) => a.tag - b.tag);

    const ifd0HeaderSize = 2 + entries.length * 12 + 4;
    let heapOffset = 8 + ifd0HeaderSize;

    let totalSize = heapOffset;
    for (const entry of entries) {
      if (entry.data.length > 4) {
        totalSize += entry.data.length;
        if (entry.data.length % 2 !== 0) totalSize += 1;
      }
    }

    const tiffBuf = new Uint8Array(totalSize);
    const view = new DataView(tiffBuf.buffer);

    // TIFF Header (Little Endian 'II\x2A\x00')
    tiffBuf[0] = 0x49;
    tiffBuf[1] = 0x49;
    view.setUint16(2, 0x002a, true);
    view.setUint32(4, 8, true);

    let currOffset = 8;
    view.setUint16(currOffset, entries.length, true);
    currOffset += 2;

    let currHeapOffset = heapOffset;

    for (const entry of entries) {
      view.setUint16(currOffset, entry.tag, true);
      view.setUint16(currOffset + 2, entry.type, true);
      view.setUint32(currOffset + 4, entry.count, true);

      if (entry.data.length <= 4) {
        tiffBuf.set(entry.data, currOffset + 8);
      } else {
        view.setUint32(currOffset + 8, currHeapOffset, true);
        tiffBuf.set(entry.data, currHeapOffset);
        currHeapOffset += entry.data.length;
        if (entry.data.length % 2 !== 0) {
          tiffBuf[currHeapOffset] = 0x00;
          currHeapOffset += 1;
        }
      }
      currOffset += 12;
    }

    view.setUint32(currOffset, 0, true);
    return tiffBuf;
  }
}
