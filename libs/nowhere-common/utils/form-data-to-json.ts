export function formDataToObject(formData: FormData) {
  let obj: [string, any] | {} = {};
  formData['_parts'].forEach((part) => {
    obj[part[0] as string] = part[1];
  });
  return obj;
}
