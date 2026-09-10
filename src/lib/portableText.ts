// Minimal Portable Text -> paragraph-text helper. Intentionally does not
// pull in a full Portable Text renderer (no such dependency exists in this
// project yet) — sufficient for rendering plain-text block content in a
// bare-bones, functional-only page. Revisit if/when rich formatting
// (marks, embedded images, etc.) is actually needed.
export type PortableTextBlock = {
  _type: string;
  children?: Array<{ _type: string; text?: string }>;
};

export function blocksToPlainText(blocks: PortableTextBlock[] | null | undefined): string[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => (block.children ?? []).map((child) => child.text ?? '').join(''));
}
