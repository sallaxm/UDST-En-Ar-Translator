export class PDFName {
  value: string;
  private constructor(value: string);
  static of(value: string): PDFName;
}

export class PDFDocument {
  static load(bytes: ArrayBuffer): Promise<PDFDocument>;
  getPages(): Array<{
    node: {
      dict: { get(name: PDFName): unknown };
      context: { lookup(value: unknown): { getUnencodedContents?: () => Uint8Array[] } | undefined };
    };
  }>;
}
