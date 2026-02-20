export function indent(str, n = 2) {
  const spaces = ' '.repeat(n);
  return `${spaces}${str.replaceAll('\n', `\n${spaces}`)}`;
}
