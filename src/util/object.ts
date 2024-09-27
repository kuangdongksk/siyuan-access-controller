export const objToMap = (obj: { [key: string]: any }): Map<string, any> => {
  return new Map(Object.entries(obj));
};
