export function toUpperCaseNormalizedGreek(s: string) {
  return s
    .toUpperCase()
    .replace(/Ά/g, 'Α')
    .replace(/Έ/g, 'Ε')
    .replace(/Ή/g, 'Η')
    .replace(/Ί|Ϊ|Ϊ́/g, 'Ι')
    .replace(/Ό/g, 'Ο')
    .replace(/Ύ|Ϋ|Ϋ́/g, 'Υ')
    .replace(/Ώ/g, 'Ω');
}

// If entries are provided on the constructor, originalKey
// is initialized on the first set call
class CaseInsensitiveMap<T, U> extends Map<T, U> {
  public originalKey!: Map<string, string>;

  constructor(entries?: readonly (readonly [T, U])[] | null | undefined) {
    super(entries);

    if (!(this as any).originalKey) {
      this.originalKey = new Map<string, string>();
    }
  }

  public set(key: T, value: U): this {
    if (typeof key === 'string') {
      const originalKey = key;
      key = (toUpperCaseNormalizedGreek(key) as any) as T;

      if (!this.originalKey) {
        this.originalKey = new Map<string, string>();
      }

      this.originalKey.set((key as any) as string, originalKey);
    }
    return Map.prototype.set.call(this, key, value) as this;
  }

  public get(key: T) {
    if (typeof key === 'string') {
      key = (toUpperCaseNormalizedGreek(key) as any) as T;
    }
    return Map.prototype.get.call(this, key);
  }

  public delete(key: T) {
    if (typeof key === 'string') {
      this.originalKey.delete(key);
      key = (toUpperCaseNormalizedGreek(key) as any) as T;
    }
    return Map.prototype.delete.call(this, key);
  }

  public has(key: T) {
    if (typeof key === 'string') {
      key = (toUpperCaseNormalizedGreek(key) as any) as T;
    }
    return Map.prototype.has.call(this, key);
  }
}

export default CaseInsensitiveMap;
