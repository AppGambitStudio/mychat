export class RecursiveCharacterTextSplitter {
    private chunkSize: number;
    private chunkOverlap: number;
    private separators: string[];

    constructor({
        chunkSize = 1000,
        chunkOverlap = 200,
        separators = ["\n\n", "\n", ". ", " ", ""]
    } = {}) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
        this.separators = separators;
    }

    async splitText(text: string): Promise<string[]> {
        const finalChunks: string[] = [];
        let goodSplits: string[] = [];

        // Determine which separator to use
        let separator = this.separators[this.separators.length - 1]; // Default to chars
        for (const s of this.separators) {
            if (text.includes(s)) {
                separator = s;
                break;
            }
        }

        // Split text by separator
        const splits = text.split(separator);

        // Merge splits back into chunks
        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const split of splits) {
            const splitLength = split.length;

            if (currentLength + splitLength + (currentChunk.length > 0 ? separator.length : 0) > this.chunkSize) {
                if (currentChunk.length > 0) {
                    const chunkContent = currentChunk.join(separator);
                    finalChunks.push(chunkContent);

                    // Handle overlap: Keep trailing items that fit within overlap limit
                    while (currentChunk.join(separator).length > this.chunkOverlap && currentChunk.length > 0) {
                        currentChunk.shift();
                    }

                    // Recalculate length for the remaining overlapping content
                    currentLength = currentChunk.join(separator).length;
                }
                // Do NOT clear currentChunk here; it now contains the overlap for the next chunk
            }

            currentChunk.push(split);
            currentLength += splitLength + (currentChunk.length > 1 ? separator.length : 0);
        }

        if (currentChunk.length > 0) {
            finalChunks.push(currentChunk.join(separator));
        }

        return finalChunks;
    }
}
