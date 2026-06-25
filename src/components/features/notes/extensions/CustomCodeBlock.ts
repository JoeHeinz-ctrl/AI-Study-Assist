import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import CodeBlockComponent from './CodeBlockComponent';

// Initialize lowlight with common programming language grammars
const lowlight = createLowlight(common);

export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({
  lowlight,
});

export default CustomCodeBlock;
