// @TODO: keep this number and the list of articles in sync with the sql script
// otherwise, an exception will occur.
export const ARTICLE_KEY_SPACE = 10;


export type IPartitionGenerator = {
  generateRandomForArticle(): number;
};

export class PartitionGenerator implements IPartitionGenerator {
  public generateRandomForArticle(): number {
    return this.generateRandom(ARTICLE_KEY_SPACE);
  }

  private generateRandom(keySpace: number): number {
    if (keySpace <= 0) {
      throw new Error('keySpace must be a positive integer');
    }
    return Math.floor(Math.random() * keySpace) + 1;
  }

  private generateHash(input: string, keySpace: number): number {
    if (keySpace <= 0) {
      throw new Error('keySpace must be a positive integer');
    }
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return (hash >>> 0) % keySpace + 1;
  }
}


