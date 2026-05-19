const slice = Array.prototype.slice;

const REGEX_AMP = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi;
const REGEX_CODE = /`([^`]+)`/g;
const REGEX_LINK = /(^|\s)@([\w._$()…]*[\w_$](\(\))?)/g;
const REGEX_HREF = /(https?:\/\/[^\s"]+[\d\w_\-/])/g;

export function forEach<T>(
  obj: T[] | undefined,
  callback: (value: T, index: number, obj: T[]) => void,
  thisArg?: unknown,
): void {
  if (!Array.isArray(obj)) {
    return;
  }

  for (let i = 0, l = obj.length; i < l; i += 1) {
    callback.call(thisArg, obj[i], i, obj);
  }
}

export function extend<T extends object>(obj: T, ...sources: Array<object | undefined>): T {
  forEach(sources, (source) => {
    if (source) {
      for (const prop in source) {
        (obj as Record<string, unknown>)[prop] = (source as Record<string, unknown>)[prop];
      }
    }
  });
  return obj;
}

export function format(value: unknown): string {
  if (!value) {
    return value as string;
  }

  return String(value)
    .replace(/</g, '&lt;')
    .replace(REGEX_AMP, '<em class="amp">&amp;</em>')
    .replace(REGEX_CODE, '<code class="prettyprint">$1</code>')
    .replace(REGEX_LINK, '$1<a href="#$2" class="cjs-link">$2</a>')
    .replace(REGEX_HREF, '<a href="$1" rel="external">$1</a>');
}

export function has(obj: unknown[] | Record<string, unknown>, value: string): boolean {
  return Array.isArray(obj) ? obj.indexOf(value) > -1 : value in obj;
}

export function hash(keys: string[], values?: unknown[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const vlen = values?.length || 0;

  for (let i = 0; i < keys.length; i += 1) {
    if (i in keys) {
      result[keys[i]] = vlen > i && i in values! ? values![i] : true;
    }
  }

  return result;
}

export function isEmpty(obj: unknown): boolean {
  if (!obj) {
    return true;
  }

  if (Array.isArray(obj) || typeof obj === 'string') {
    return obj.length === 0;
  }

  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

export function argsToArray(args: IArguments): unknown[] {
  return slice.call(args, 0);
}
