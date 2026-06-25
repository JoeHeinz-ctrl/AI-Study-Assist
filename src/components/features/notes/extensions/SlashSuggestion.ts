import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const SlashSuggestion = Extension.create({
  name: 'slashSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashSuggestion;
