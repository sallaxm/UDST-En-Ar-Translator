class PDFName {
  constructor(value) {
    this.value = value;
  }

  static of(value) {
    return new PDFName(value);
  }
}

class PDFPage {
  constructor(stream) {
    this._stream = stream;
    this.node = {
      dict: {
        get: (name) => (name && name.value === "Contents" ? { stream: this._stream } : undefined),
      },
      context: {
        lookup: (value) => ({
          getUnencodedContents: () => [Buffer.from(value?.stream || "", "latin1")],
        }),
      },
    };
  }
}

class PDFDocument {
  constructor(bytes) {
    this._bytes = Buffer.from(bytes);
  }

  static async load(bytes) {
    return new PDFDocument(bytes);
  }

  getPages() {
    const raw = this._bytes.toString("latin1");
    const matches = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];

    if (matches.length === 0) {
      return [new PDFPage(raw)];
    }

    return matches.map((match) => new PDFPage(match[1] || ""));
  }
}

module.exports = { PDFDocument, PDFName };
