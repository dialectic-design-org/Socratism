export interface DublinCore {
    title: string;           // dc:title
    description: string;     // dc:description
    created: Date;          // dc:created
    issued: Date;           // dc:issued (for published date)
    creator: string;        // dc:creator
    contributor?: string;   // dc:contributor
    publisher?: string;     // dc:publisher
    subject?: string;       // dc:subject
    type?: string;         // dc:type
    format?: string;       // dc:format
    identifier?: string;   // dc:identifier
    source?: string;       // dc:source
    language?: string;     // dc:language
    relation?: string;     // dc:relation
    coverage?: string;     // dc:coverage
    rights?: string;       // dc:rights
}

export interface Work extends DublinCore {
    // Extended properties (not in Dublin Core)
    fileSource: string;
    previewSource: string;
    staticPreviewSource: string;
}