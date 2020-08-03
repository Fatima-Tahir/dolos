import { Index } from "./lib/analyze";
import { Report } from "./lib/analyze/report";
import { CustomOptions, Options } from "./lib/util/options";
import { CodeTokenizer } from "./lib/tokenizer/codeTokenizer";
import { File } from "./lib/file/file";
import { Result } from "./lib/util/result";
import { info } from "./lib/util/utils";

export class Dolos {

  readonly options: Options;
  private readonly tokenizer: CodeTokenizer;
  private readonly index: Index;

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
    this.tokenizer = new CodeTokenizer(this.options.language);
    this.index = new Index(this.tokenizer, this.options);
  }

  public async analyzePaths(paths: string[]): Promise<Report> {
    info("=== Starting analysis ===");
    info(`Reading ${ paths.length} files`);
    const files = await Result.all(paths.map(File.fromPath));
    return this.analyze(files.ok());
  }

  public async analyze(
    files: Array<File>
  ): Promise<Report> {

    if (files.length < 2) {
      throw new Error("You need to supply at least two files");
    } else if (files.length == 2 && this.options.maxHashPercentage !== null) {
      throw new Error("You have given a maximum hash percentage but your are " +
                      "comparing two files. Each matching hash will thus " +
                      "be present in 100% of the files. This option does only" +
                      "make sense when comparing more than two files.");
    }

    return this.index.compareFiles(files);
  }

}
