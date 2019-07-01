import { ReadStream } from "fs";
import RollingHash from "./rollingHash";

export default class Winnow {
    private readonly windowSize: number;
    private readonly k: number;

    /**
     * Generates a Winnow object with given window size and k-mer size. The winnowing algorithm
     * will reduce the number of hash values returned by the hash function. It will at least
     * return 1 hash for every window (i.e. for every windowSize characters).
     *
     * @param windowSize The window size
     * @param k The k-mer size of which hashes are calculated
     */
    constructor(windowSize: number, k: number) {
        this.windowSize = windowSize;
        this.k = k;
    }

    /**
     * Returns an async interator that yields tuples containing a hash and its corresponding k-mer
     * position. Can be called successively on multiple files.
     *
     * Code based on pseudocode from http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
     *
     * @param stream The readable stream of a file (or stdin) to process. Such stream can be created
     * using fs.createReadStream("path").
     */
    public async *winnow(stream: ReadStream): AsyncIterableIterator<[number, number]> {
        const hash = new RollingHash(this.k);
        const buffer: number[] = new Array(this.windowSize).fill(Number.MAX_SAFE_INTEGER);
        let filePos: number = -1 * this.k;
        let bufferPos: number = 0;
        let minPos: number = 0;

        // At the end of each iteration, minPos holds the position of the rightmost minimal
        // hash in the current window.
        // yield([x,pos]) is called only the first time an instance of x is selected
        for await (const data of stream) {
            for (const byte of data as Buffer) {
                filePos++;
                if (filePos < 0) {
                    hash.nextHash(byte);
                    continue;
                }
                bufferPos = (bufferPos + 1) % this.windowSize;
                buffer[bufferPos] = hash.nextHash(byte);
                if (minPos === bufferPos) {
                    // The previous minimum is no longer in this window.
                    // Scan buffer starting from bufferPos for the rightmost minimal hash.
                    // Note minPos starts with the index of the rightmost hash.
                    for (let i = (bufferPos + 1) % this.windowSize; i !== bufferPos; i = (i + 1) % this.windowSize) {
                        if (buffer[i] <= buffer[minPos]) {
                            minPos = i;
                        }
                    }
                    yield [buffer[minPos], filePos + (minPos - bufferPos - this.windowSize) % this.windowSize];
                } else {
                    // Otherwise, the previous minimum is still in this window. Compare
                    // against the new value and update minPos if necessary.
                    if (buffer[bufferPos] <= buffer[minPos]) {
                        minPos = bufferPos;
                        yield [buffer[minPos], filePos + (minPos - bufferPos - this.windowSize) % this.windowSize];
                    }
                }
            }
        }
    }
}
