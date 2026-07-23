import { NextResponse } from 'next/server';

const toCamel = (s: string) => {
  if (s === '_id') return s;
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const isObject = (o: any) => o === Object(o) && !Array.isArray(o) && typeof o !== 'function' && !(o instanceof Date) && !(o instanceof RegExp);

const keysToCamel = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString(); // Safely handle dates in API responses
  
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v));
  } else if (isObject(obj)) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamel(key)]: keysToCamel(obj[key]),
      }),
      {}
    );
  }
  return obj;
};

export function camelCaseResponse(body: any, init?: ResponseInit): NextResponse {
  const camelBody = keysToCamel(body);
  return NextResponse.json(camelBody, init);
}
