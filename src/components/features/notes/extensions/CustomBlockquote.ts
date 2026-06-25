import Blockquote from '@tiptap/extension-blockquote';
import { ReactNodeViewRenderer } from '@tiptap/react';
import BlockquoteNodeView from './BlockquoteNodeView';

export const CustomBlockquote = Blockquote.extend({
  addNodeView() {
    return ReactNodeViewRenderer(BlockquoteNodeView);
  },
});

export default CustomBlockquote;
